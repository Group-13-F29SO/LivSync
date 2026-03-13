import { prisma } from "@/lib/prisma";
import sax from "sax";
import yauzl from "yauzl";
import { Readable } from "node:stream";
import { cookies } from "next/headers";

export const runtime = "nodejs";
const BATCH_SIZE = 1000;

const RECORD_TYPE_MAP = {
  HKQuantityTypeIdentifierStepCount: "steps",
  HKQuantityTypeIdentifierActiveEnergyBurned: "calories",
  HKQuantityTypeIdentifierHeartRate: "heart_rate",
  HKQuantityTypeIdentifierRestingHeartRate: "resting_heart_rate",
  HKQuantityTypeIdentifierDietaryWater: "hydration",
  HKQuantityTypeIdentifierBloodGlucose: "blood_glucose",
};

function parseNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function toDateSafe(dateStr) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function diffHours(start, end) {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  const ms = e - s;
  if (!Number.isFinite(ms) || ms <= 0) return null;
  return Number((ms / (1000 * 60 * 60)).toFixed(2));
}

function makeKey(metric_type, timestamp, value) {
  return `${metric_type}|${timestamp.toISOString()}|${Number(value)}`;
}

async function flushBatch(batch, existingKeys) {
  if (batch.length === 0) return 0;

  const uniqueRows = [];
  for (const row of batch) {
    const key = makeKey(row.metric_type, row.timestamp, row.value);
    if (!existingKeys.has(key)) {
      existingKeys.add(key);
      uniqueRows.push(row);
    }
  }

  if (uniqueRows.length > 0) {
    await prisma.biometric_data.createMany({
      data: uniqueRows,
    });
  }

  batch.length = 0;
  return uniqueRows.length;
}

async function loadExistingKeysForPatient(patientId) {
  const existing = await prisma.biometric_data.findMany({
    where: {
      patient_id: patientId,
      source: "apple_health",
    },
    select: {
      metric_type: true,
      value: true,
      timestamp: true,
    },
  });

  return new Set(
    existing.map((e) =>
      makeKey(e.metric_type, new Date(e.timestamp), e.value)
    )
  );
}

function getZipEntryStream(buffer) {
  return new Promise((resolve, reject) => {
    yauzl.fromBuffer(buffer, { lazyEntries: true }, (err, zipfile) => {
      if (err) return reject(err);
      if (!zipfile) return reject(new Error("Could not read zip file."));

      zipfile.readEntry();

      zipfile.on("entry", (entry) => {
        const name = entry.fileName.toLowerCase();
        const isExportXml =
          name === "export.xml" || name.endsWith("/export.xml");

        if (!isExportXml) {
          zipfile.readEntry();
          return;
        }

        zipfile.openReadStream(entry, (streamErr, stream) => {
          if (streamErr) return reject(streamErr);
          if (!stream) return reject(new Error("Could not open export.xml stream."));
          resolve(stream);
        });
      });

      zipfile.on("end", () => {
        reject(new Error("Could not find export.xml inside the uploaded zip."));
      });

      zipfile.on("error", reject);
    });
  });
}

async function getXmlStreamFromUpload(file, buffer) {
  const isZip =
    file.name?.toLowerCase().endsWith(".zip") ||
    file.type === "application/zip" ||
    file.type === "application/x-zip-compressed";

  if (!isZip) {
    return Readable.from(buffer);
  }

  return await getZipEntryStream(buffer);
}

async function checkForOverlappingData(patientId, metricsDateMap) {
  const overlaps = {};
  
  for (const [metricType, dates] of Object.entries(metricsDateMap)) {
    const uniqueDates = Array.from(dates);
    
    for (const date of uniqueDates) {
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      
      const existingData = await prisma.biometric_data.findMany({
        where: {
          patient_id: patientId,
          metric_type: metricType,
          timestamp: {
            gte: dayStart,
            lte: dayEnd,
          },
        },
        select: { source: true },
      });
      
      if (existingData.length > 0) {
        const key = `${metricType}|${date.toISOString().split('T')[0]}`;
        overlaps[key] = existingData.map(d => d.source);
      }
    }
  }
  
  return overlaps;
}

async function replaceSimulatedDataWithAppleHealth(patientId, metricsDateMap) {
  const dateRanges = new Set();
  
  for (const dates of Object.values(metricsDateMap)) {
    for (const date of dates) {
      const dateKey = date.toISOString().split('T')[0];
      dateRanges.add(dateKey);
    }
  }
  
  for (const dateKey of dateRanges) {
    const dayStart = new Date(dateKey);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dateKey);
    dayEnd.setHours(23, 59, 59, 999);
    
    // Delete only SIMULATED data for dates that will have Apple Health data
    await prisma.biometric_data.deleteMany({
      where: {
        patient_id: patientId,
        source: 'simulated',
        timestamp: {
          gte: dayStart,
          lte: dayEnd,
        },
      },
    });
  }
}

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const confirmImport = formData.get("confirmImport") === "true";

    if (!file) {
      return Response.json({ error: "No file uploaded." }, { status: 400 });
    }

    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('livsync_session');

    if (!sessionCookie) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let session;
    try {
      session = JSON.parse(sessionCookie.value);
    } catch {
      return Response.json({ error: 'Invalid session' }, { status: 401 });
    }

    const patientId = session.userId;

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const xmlStream = await getXmlStreamFromUpload(file, buffer);
    const existingKeys = await loadExistingKeysForPatient(patientId);

    const counts = {
      steps: 0,
      calories: 0,
      heart_rate: 0,
      resting_heart_rate: 0,
      hydration: 0,
      blood_glucose: 0,
      sleep: 0,
      workouts: 0,
    };

    let imported = 0;
    let candidateRows = 0;
    const batch = [];
    const metricsDateMap = {}; // Track which metrics and dates are in the import

    const parser = sax.createStream(true, {
      lowercase: false,
      trim: true,
      normalize: true,
    });

    parser.on("opentag", (node) => {
      if (node.name === "Record") {
        const a = node.attributes;
        const metricType = RECORD_TYPE_MAP[a.type];

        if (metricType) {
          const value = parseNumber(a.value);
          const timestamp = toDateSafe(a.startDate || a.creationDate || a.endDate);

          if (value !== null && timestamp) {
            const dateKey = timestamp.toISOString().split('T')[0];
            if (!metricsDateMap[metricType]) metricsDateMap[metricType] = new Set();
            metricsDateMap[metricType].add(new Date(dateKey));

            batch.push({
              patient_id: patientId,
              metric_type: metricType,
              value,
              timestamp,
              source: "apple_health",
            });
            counts[metricType] += 1;
            candidateRows += 1;
          }
          return;
        }

        if (a.type === "HKCategoryTypeIdentifierSleepAnalysis") {
          const sleepValue = String(a.value || "");
          const asleep =
            sleepValue.toLowerCase().includes("asleep") ||
            sleepValue === "HKCategoryValueSleepAnalysisAsleep" ||
            sleepValue === "HKCategoryValueSleepAnalysisAsleepCore" ||
            sleepValue === "HKCategoryValueSleepAnalysisAsleepDeep" ||
            sleepValue === "HKCategoryValueSleepAnalysisAsleepREM";

          if (!asleep) return;

          const duration = diffHours(a.startDate, a.endDate);
          const timestamp = toDateSafe(a.endDate || a.startDate);

          if (duration !== null && timestamp) {
            const dateKey = timestamp.toISOString().split('T')[0];
            if (!metricsDateMap['sleep']) metricsDateMap['sleep'] = new Set();
            metricsDateMap['sleep'].add(new Date(dateKey));

            batch.push({
              patient_id: patientId,
              metric_type: "sleep",
              value: duration,
              timestamp,
              source: "apple_health",
            });
            counts.sleep += 1;
            candidateRows += 1;
          }
        }

        return;
      }

      if (node.name === "Workout") {
        const a = node.attributes;
        const timestamp = toDateSafe(a.startDate || a.endDate || a.creationDate);

        if (timestamp) {
          const dateKey = timestamp.toISOString().split('T')[0];
          if (!metricsDateMap['workouts']) metricsDateMap['workouts'] = new Set();
          metricsDateMap['workouts'].add(new Date(dateKey));

          batch.push({
            patient_id: patientId,
            metric_type: "workouts",
            value: 1,
            timestamp,
            source: "apple_health",
          });
          counts.workouts += 1;
          candidateRows += 1;
        }
      }
    });

    for await (const chunk of xmlStream) {
      parser.write(chunk.toString("utf8"));

      // Don't flush during parsing - collect all data first
      // We'll flush only after confirming overlaps
    }

    parser.end();

    // Check for overlapping data BEFORE flushing anything
    const overlaps = await checkForOverlappingData(patientId, metricsDateMap);
    const hasSimulatedOverlap = Object.values(overlaps).some(sources => 
      sources.includes('simulated')
    );
    const hasAppleHealthOverlap = Object.values(overlaps).some(sources => 
      sources.includes('apple_health')
    );

    // If not confirmed and there are overlaps, return preview WITHOUT inserting
    if (!confirmImport && (hasSimulatedOverlap || hasAppleHealthOverlap)) {
      return Response.json({
        requiresConfirmation: true,
        message: "This import will affect existing data. Please review before proceeding.",
        overlappingDates: Object.keys(overlaps),
        simulatedDataWillBeReplaced: hasSimulatedOverlap,
        appleHealthDataWillBeReplaced: hasAppleHealthOverlap,
        importSummary: {
          metricsToImport: Object.keys(metricsDateMap),
          totalRecords: candidateRows,
          counts,
        },
      }, { status: 200 });
    }

    // If re-import with Apple Health overlap, ask for confirmation
    if (!confirmImport && hasAppleHealthOverlap) {
      return Response.json({
        requiresConfirmation: true,
        isReImport: true,
        message: "Apple Health data already exists for some of these dates from a previous import. Proceeding will replace the existing import.",
        overlappingDates: Object.keys(overlaps),
      }, { status: 200 });
    }

    // NOW that we have confirmation, delete old Apple Health data if re-importing
    if (confirmImport && hasAppleHealthOverlap) {
      const dateRanges = new Set();
      for (const dates of Object.values(metricsDateMap)) {
        for (const date of dates) {
          const dateKey = date.toISOString().split('T')[0];
          dateRanges.add(dateKey);
        }
      }

      for (const dateKey of dateRanges) {
        const dayStart = new Date(dateKey);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(dateKey);
        dayEnd.setHours(23, 59, 59, 999);

        await prisma.biometric_data.deleteMany({
          where: {
            patient_id: patientId,
            source: 'apple_health',
            timestamp: {
              gte: dayStart,
              lte: dayEnd,
            },
          },
        });
      }
    }

    // Replace simulated data if confirmed
    if (confirmImport && hasSimulatedOverlap) {
      await replaceSimulatedDataWithAppleHealth(patientId, metricsDateMap);
    }

    // Refresh existing keys if we deleted data (re-import case)
    if (confirmImport && hasAppleHealthOverlap) {
      const refreshedKeys = await loadExistingKeysForPatient(patientId);
      // Update existingKeys with refreshed values
      existingKeys.clear();
      refreshedKeys.forEach(key => existingKeys.add(key));
    }

    // NOW flush the batch to database (only after all confirmations and deletions)
    if (batch.length > 0) {
      imported += await flushBatch(batch, existingKeys);
    }

    return Response.json({
      message: "Apple Health import complete.",
      imported,
      skippedDuplicates: candidateRows - imported,
      counts,
      replacedSimulatedData: hasSimulatedOverlap && confirmImport,
      replacedAppleHealthData: hasAppleHealthOverlap && confirmImport,
    }, { status: 200 });
  } catch (error) {
    console.error("Apple Health import error:", error);
    return Response.json(
      { error: error.message || "Import failed." },
      { status: 500 }
    );
  }
}