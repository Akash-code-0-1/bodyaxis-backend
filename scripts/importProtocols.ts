import "dotenv/config";
import xlsx from "xlsx";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const workbook = xlsx.readFile("prisma/data/dataset.xlsx");

const clean = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  return String(value).trim();
};

const splitList = (value: unknown): string[] => {
  return clean(value)
    .replace(/•/g, ",")
    .split(/,|;|\n/)
    .map((item) => item.trim())
    .filter(Boolean);
};

const parseDuration = (sheetName: string): number => {
  if (sheetName.includes("15")) return 15;
  if (sheetName.includes("30")) return 30;
  if (sheetName.includes("45")) return 45;
  if (sheetName.includes("60")) return 60;

  return 15;
};

const importExercises = async () => {
  const sheet = workbook.Sheets["FULL EXERCISE LIST"];

  if (!sheet) {
    console.log("Available sheets:", workbook.SheetNames);
    throw new Error("FULL EXERCISE LIST sheet not found");
  }

  const rows = xlsx.utils.sheet_to_json<Record<string, unknown>>(sheet);

  if (!rows.length) {
    console.log("FULL EXERCISE LIST sheet is empty");
    return;
  }

  console.log("Exercise columns:", Object.keys(rows[0]));

  let imported = 0;

  for (const row of rows) {
    const name = clean(row["Exercise Name"]);

    if (!name) continue;

    await prisma.exercise.upsert({
      where: {
        name,
      },
      update: {
        targetArea: clean(row["Body Region Selected by the client"]),
        targetRegions: splitList(row["Specific Anatomical Areas"]),
        userCases: splitList(row["How does it feel?"]),
        benefit: clean(row["Benefits (Plain English)"]),
        phase: clean(row["Protocol Phase"]),
        equipment: splitList(row["Equipment Required"]),
        reps: clean(row["Reps / Time"]),
        avoidIf: clean(row["Avoid If"]),
        coachingCue: clean(row["Primary Intent (only for my reference)"]),
        regression: clean(row["Regression"]),
        progression: clean(row["Progression"]),
      },
      create: {
        name,
        targetArea: clean(row["Body Region Selected by the client"]),
        targetRegions: splitList(row["Specific Anatomical Areas"]),
        userCases: splitList(row["How does it feel?"]),
        benefit: clean(row["Benefits (Plain English)"]),
        phase: clean(row["Protocol Phase"]),
        equipment: splitList(row["Equipment Required"]),
        reps: clean(row["Reps / Time"]),
        avoidIf: clean(row["Avoid If"]),
        coachingCue: clean(row["Primary Intent (only for my reference)"]),
        regression: clean(row["Regression"]),
        progression: clean(row["Progression"]),
      },
    });

    imported++;
  }

  console.log(`✅ Exercises imported: ${imported}`);
};

const addExerciseToProtocol = async (
  protocolId: string,
  phase: string,
  order: number,
  exerciseName: string,
  setsReps: string,
  equipment: string[],
) => {
  if (!exerciseName || exerciseName === "—") return;

  const exercise = await prisma.exercise.findUnique({
    where: {
      name: exerciseName,
    },
  });

  await prisma.protocolExercise.create({
    data: {
      protocolId,
      exerciseId: exercise?.id,
      phase,
      order,
      name: exerciseName,
      setsReps,
      equipment,
    },
  });
};

const importProtocolSheet = async (sheetName: string) => {
  const sheet = workbook.Sheets[sheetName];

  if (!sheet) {
    console.log("Available sheets:", workbook.SheetNames);
    throw new Error(`${sheetName} sheet not found`);
  }

  const rows = xlsx.utils.sheet_to_json<Record<string, unknown>>(sheet);
  const durationMinutes = parseDuration(sheetName);

  if (!rows.length) {
    console.log(`${sheetName} sheet is empty`);
    return;
  }

  console.log(`${sheetName} columns:`, Object.keys(rows[0]));

  let imported = 0;

  for (const row of rows) {
    const protocolName = clean(row["Protocol Name"]);

    if (!protocolName) continue;

    const protocol = await prisma.protocol.create({
      data: {
        protocolNumber: Number(row["Protocol #"]) || null,
        name: protocolName,
        targetArea: clean(row["Target Area"]),
        userCase: clean(row["User Case"]),
        durationMinutes,
        totalTime: clean(row["Total Time"]),
        equipment: splitList(row["Equipment Needed"]),
      },
    });

    await addExerciseToProtocol(
      protocol.id,
      "RESET",
      1,
      clean(row["RESET Exercise"] || row["RESET 1 Exercise"]),
      clean(
        row["Reset Sets / Reps / Time"] || row["Reset 1 Sets / Reps / Time"],
      ),
      splitList(row["Equipment Needed"]),
    );

    await addExerciseToProtocol(
      protocol.id,
      "RESET",
      2,
      clean(row["RESET 2 Exercise"]),
      clean(row["Reset 2 Sets / Reps / Time"]),
      splitList(row["Equipment Needed"]),
    );

    await addExerciseToProtocol(
      protocol.id,
      "CONTROL",
      1,
      clean(row["CONTROL Exercise"] || row["CONTROL 1 Exercise"]),
      clean(
        row["Control Sets / Reps / Time"] ||
          row["Control 1 Sets / Reps / Time"],
      ),
      splitList(row["Equipment Needed"]),
    );

    await addExerciseToProtocol(
      protocol.id,
      "CONTROL",
      2,
      clean(row["CONTROL 2 Exercise"]),
      clean(row["Control 2 Sets / Reps / Time"]),
      splitList(row["Equipment Needed"]),
    );

    await addExerciseToProtocol(
      protocol.id,
      "CONTROL",
      3,
      clean(row["CONTROL 3 Exercise"]),
      clean(row["Control 3 Sets / Reps / Time"]),
      splitList(row["Equipment Needed"]),
    );

    await addExerciseToProtocol(
      protocol.id,
      "INTEGRATE",
      1,
      clean(row["INTEGRATE Exercise"] || row["INTEGRATE 1 Exercise"]),
      clean(
        row["Integrate Sets / Reps / Time"] ||
          row["Integrate 1 Sets / Reps / Time"],
      ),
      splitList(row["Equipment Needed"]),
    );

    await addExerciseToProtocol(
      protocol.id,
      "INTEGRATE",
      2,
      clean(row["INTEGRATE 2 Exercise"]),
      clean(row["Integrate 2 Sets / Reps / Time"]),
      splitList(row["Equipment Needed"]),
    );

    await addExerciseToProtocol(
      protocol.id,
      "INTEGRATE",
      3,
      clean(row["INTEGRATE 3 Exercise"]),
      clean(row["Integrate 3 Sets / Reps / Time"]),
      splitList(row["Equipment Needed"]),
    );

    await addExerciseToProtocol(
      protocol.id,
      "INTEGRATE",
      4,
      clean(row["INTEGRATE 4 Exercise"]),
      clean(row["Integrate 4 Sets / Reps / Time"]),
      splitList(row["Equipment Needed"]),
    );

    imported++;
  }

  console.log(`✅ ${sheetName} imported: ${imported}`);
};

const main = async () => {
  console.log("Workbook sheets:", workbook.SheetNames);

  await prisma.protocolExercise.deleteMany();
  await prisma.protocol.deleteMany();
  await prisma.exercise.deleteMany();

  await importExercises();

  await importProtocolSheet("15 Minute Protocols");
  await importProtocolSheet("30 Minute Protocols");
  await importProtocolSheet("45 Minute Protocol");
  await importProtocolSheet("60 Minute Protocols");

  console.log("✅ All exercises and protocols imported successfully");
};

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    prisma.$disconnect();
  });
