import { prisma } from "@/lib/prisma";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get("patientId");

    if (!patientId) {
      return Response.json({ error: "patientId is required" }, { status: 400 });
    }

    const goals = await prisma.goals.findMany({
      where: { patient_id: patientId },
      orderBy: { id: "asc" },
      select: {
        id: true,
        metric_type: true,
        target_value: true,
        frequency: true,
        is_active: true,
      },
    });

    return Response.json({ goals });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const body = await req.json();
    const goalId = Number(body.goalId);
    const patientId = body.patientId;
    const targetValue = Number(body.targetValue);

    if (!Number.isFinite(goalId)) {
      return Response.json({ error: "goalId must be a number" }, { status: 400 });
    }
    if (!patientId) {
      return Response.json({ error: "patientId is required" }, { status: 400 });
    }
    if (!Number.isFinite(targetValue) || targetValue <= 0) {
      return Response.json({ error: "targetValue must be > 0" }, { status: 400 });
    }

    const goal = await prisma.goals.findFirst({
      where: { id: goalId, patient_id: patientId },
      select: { id: true },
    });

    if (!goal) {
      return Response.json({ error: "Goal not found for this user" }, { status: 404 });
    }

    const updated = await prisma.goals.update({
      where: { id: goalId },
      data: { target_value: targetValue },
      select: { id: true, patient_id: true, metric_type: true, target_value: true, frequency: true },
    });

    return Response.json({ goal: updated });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { patientId, metricType, targetValue, frequency } = await req.json();

    if (!patientId) {
      return Response.json({ error: "patientId is required" }, { status: 400 });
    }
    if (!metricType) {
      return Response.json({ error: "metricType is required" }, { status: 400 });
    }

    const target = Number(targetValue);
    if (!Number.isFinite(target) || target <= 0) {
      return Response.json({ error: "targetValue must be > 0" }, { status: 400 });
    }

    // one goal per patient per metric_type
    const existing = await prisma.goals.findFirst({
      where: { patient_id: patientId, metric_type: metricType },
      select: { id: true },
    });

    if (existing) {
      return Response.json({ error: "Goal already exists" }, { status: 409 });
    }

    const created = await prisma.goals.create({
      data: {
        patient_id: patientId,
        metric_type: metricType,
        target_value: target,
        frequency: frequency || "daily",
        is_active: true,
      },
      select: { id: true, metric_type: true, target_value: true, frequency: true },
    });

    return Response.json({ goal: created }, { status: 201 });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}