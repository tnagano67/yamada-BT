import { PrismaClient } from "../src/generated/prisma/client";
import { getAllGrades } from "./seed/grades";
import { getSampleWords } from "./seed/sample-words";

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
