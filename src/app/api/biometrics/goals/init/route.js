import { prisma } from "@/lib/prisma";

const CORE_GOALS = [
  { metric_type: "steps", target_value: 10000, frequency: "daily" },
  { metric_type: "calories", target_value: 2200, frequency: "daily" },
  { metric_type: "water", target_value: 8, frequency: "daily" },
  { metric_type: "sleep", target_value: 8, frequency: "daily" },
];

export async function POST(req) {
  try {
    const { patientId } = await req.json();

    if (!patientId) {
      return Response.json({ error: "patientId is required" }, { status: 400 });
    }

    // Check if user already has any goals
    const existing = await prisma.goals.findFirst({
      where: { patient_id: patientId },
      select: { id: true },
    });

    if (existing) {
      // Goals already initialized
      return Response.json({ message: "Goals already exist" }, { status: 200 });
    }

    // Create core goals for new user
    const created = await prisma.goals.createMany({
      data: CORE_GOALS.map((goal) => ({
        ...goal,
        patient_id: patientId,
        is_active: true,
      })),
      skipDuplicates: true,
    });

    return Response.json(
      { message: "Goals initialized", count: created.count },
      { status: 201 }
    );
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
