const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const patientId = "422a812e-e54e-4a39-bdf3-b470bc0e7f35";

  const result = await prisma.goals.createMany({
    data: [
      { patient_id: patientId, metric_type: "steps", target_value: 10000, frequency: "daily", is_active: true },
      { patient_id: patientId, metric_type: "calories", target_value: 2200, frequency: "daily", is_active: true },
      { patient_id: patientId, metric_type: "water", target_value: 8, frequency: "daily", is_active: true },
      { patient_id: patientId, metric_type: "sleep", target_value: 8, frequency: "daily", is_active: true },
    ],
    skipDuplicates: true,
  });

  console.log("Seed result:", result);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });