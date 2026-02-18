import { PrismaClient } from "../src/generated/prisma/client";
import { getAllGrades } from "./seed/grades";
import { getSampleWords } from "./seed/sample-words";
import { seedSprint6Data } from "./seed/sprint6-data";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Seed grades
  const grades = getAllGrades();
  console.log(`Seeding ${grades.length} grades...`);

  for (const grade of grades) {
    await prisma.grade.upsert({
      where: { id: grade.id },
      update: grade,
      create: grade,
    });
  }
  console.log(`Seeded ${grades.length} grades.`);

  // Seed sample words
  const words = getSampleWords();
  console.log(`Seeding ${words.length} sample words...`);

  for (const word of words) {
    await prisma.word.upsert({
      where: {
        subject_wordNumber: {
          subject: word.subject,
          wordNumber: word.wordNumber,
        },
      },
      update: word,
      create: word,
    });
  }
  console.log(`Seeded ${words.length} sample words.`);

  // Seed dev users (one per role)
  const devUsers = [
    { email: "admin@dev.local", name: "管理者 太郎", role: "admin" as const },
    { email: "teacher@dev.local", name: "教員 花子", role: "teacher" as const },
    { email: "lead@dev.local", name: "教科主任 次郎", role: "subject_lead" as const },
    { email: "student@dev.local", name: "生徒 三郎", role: "student" as const },
  ];

  console.log(`Seeding ${devUsers.length} dev users...`);
  for (const u of devUsers) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role },
      create: { email: u.email, name: u.name, role: u.role },
    });
  }
  console.log(`Seeded ${devUsers.length} dev users.`);

  // Seed initial badge masters
  const badges = [
    { name: "はじめの一歩", description: "初めてのクイズを完了", category: "continuity" as const, iconKey: "footprints", difficulty: 1, conditionType: "first_quiz", conditionValue: 1, phase: 1, sortOrder: 1 },
    { name: "ウィークリーマスター", description: "7日間連続でテストに参加", category: "continuity" as const, iconKey: "calendar-check", difficulty: 2, conditionType: "streak_days", conditionValue: 7, phase: 1, sortOrder: 2 },
    { name: "マンスリーマスター", description: "30日間連続でテストに参加", category: "continuity" as const, iconKey: "trophy", difficulty: 4, conditionType: "streak_days", conditionValue: 30, phase: 1, revealCondition: "ウィークリーマスター", sortOrder: 3 },
    { name: "パーフェクトデイ", description: "朝テストで10問全問正解", category: "achievement" as const, iconKey: "star", difficulty: 2, conditionType: "perfect_score", conditionValue: 10, phase: 1, sortOrder: 4 },
    { name: "100問の壁突破", description: "累計100問正解", category: "achievement" as const, iconKey: "target", difficulty: 2, conditionType: "cumulative_correct", conditionValue: 100, phase: 1, sortOrder: 5 },
    { name: "500問の壁突破", description: "累計500問正解", category: "achievement" as const, iconKey: "zap", difficulty: 3, conditionType: "cumulative_correct", conditionValue: 500, phase: 1, sortOrder: 6 },
    { name: "1000問の壁突破", description: "累計1000問正解", category: "achievement" as const, iconKey: "flame", difficulty: 4, conditionType: "cumulative_correct", conditionValue: 1000, phase: 1, sortOrder: 7 },
    { name: "リベンジ成功", description: "過去に間違えた単語を3つ正解", category: "growth" as const, iconKey: "rotate-ccw", difficulty: 2, conditionType: "revenge_correct", conditionValue: 3, phase: 1, sortOrder: 8 },
    { name: "昇格テスト一発合格", description: "一度も失敗せずにグレード昇格", category: "growth" as const, iconKey: "rocket", difficulty: 3, conditionType: "clean_promotion", conditionValue: 1, phase: 1, sortOrder: 9 },
    { name: "苦手克服", description: "カテゴリ正答率を40%から75%に向上", category: "growth" as const, iconKey: "trending-up", difficulty: 4, conditionType: "category_improvement", conditionValue: 75, phase: 1, sortOrder: 10 },
  ];

  console.log(`Seeding ${badges.length} badge masters...`);
  for (const badge of badges) {
    const existing = await prisma.badgeMaster.findFirst({
      where: { name: badge.name },
    });
    if (!existing) {
      await prisma.badgeMaster.create({ data: badge });
    }
  }
  console.log(`Seeded ${badges.length} badge masters.`);

  // Assign StudentGrade (E1) to dev student
  const devStudent = await prisma.user.findUnique({
    where: { email: "student@dev.local" },
  });
  if (devStudent) {
    await prisma.studentGrade.upsert({
      where: {
        studentId_subject: {
          studentId: devStudent.id,
          subject: "english",
        },
      },
      update: { currentGradeId: "E1" },
      create: {
        studentId: devStudent.id,
        subject: "english",
        currentGradeId: "E1",
      },
    });
    console.log("Assigned StudentGrade E1 to dev student.");
  }

  // Seed today's active QuizDelivery for dev testing
  // JST today as UTC midnight (for @db.Date field)
  const jstNow = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const todayUtc = new Date(
    Date.UTC(jstNow.getUTCFullYear(), jstNow.getUTCMonth(), jstNow.getUTCDate()),
  );

  for (const subject of ["english", "japanese"] as const) {
    const existing = await prisma.quizDelivery.findUnique({
      where: { date_subject: { date: todayUtc, subject } },
    });
    if (!existing) {
      // deliveryTime = JST 8:15 (= UTC 23:15 前日)
      const deliveryTime = new Date(todayUtc);
      deliveryTime.setUTCHours(-1 + 24, 15, 0, 0); // 前日 23:15 UTC = JST 8:15
      deliveryTime.setUTCDate(deliveryTime.getUTCDate() - 1);

      // deadlineTime = JST 23:59 (= UTC 14:59)
      const deadlineTime = new Date(todayUtc);
      deadlineTime.setUTCHours(14, 59, 0, 0);

      await prisma.quizDelivery.create({
        data: {
          date: todayUtc,
          subject,
          deliveryTime,
          deadlineTime,
          status: "active",
        },
      });
      console.log(`Created active delivery for today (${subject}).`);
    }
  }

  // Seed Sprint 6 test data (classes, students, quiz history, etc.)
  await seedSprint6Data(prisma);

  console.log("Seeding complete!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
