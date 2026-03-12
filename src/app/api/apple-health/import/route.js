import { prisma } from "@/lib/prisma";
import sax from "sax";
import yauzl from "yauzl";
import { Readable } from "node:stream";

export const runtime = "nodejs";

const PATIENT_ID = "422a812e-e54e-4a39-bdf3-b470bc0e7f35";
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

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
      return Response.json({ error: "No file uploaded." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const xmlStream = await getXmlStreamFromUpload(file, buffer);
    const existingKeys = await loadExistingKeysForPatient(PATIENT_ID);

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
            batch.push({
              patient_id: PATIENT_ID,
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
            batch.push({
              patient_id: PATIENT_ID,
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
          batch.push({
            patient_id: PATIENT_ID,
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

      if (batch.length >= BATCH_SIZE) {
        imported += await flushBatch(batch, existingKeys);
      }
    }

    parser.end();

    if (batch.length > 0) {
      imported += await flushBatch(batch, existingKeys);
    }

    return Response.json({
      message: "Apple Health import complete.",
      imported,
      skippedDuplicates: candidateRows - imported,
      counts,
    });
  } catch (error) {
    console.error("Apple Health import error:", error);
    return Response.json(
      { error: error.message || "Import failed." },
      { status: 500 }
    );
  }
}