import { prisma } from "@/lib/db/prisma";
import type { Prisma, Subject } from "@/generated/prisma/client";
import type { WordCsvRow } from "./word-csv-parser";

export async function getWordsPaginated(
  filter: {
    subject?: Subject;
    gradeId?: string;
    search?: string;
  },
  skip: number,
  take: number,
) {
  const where: Prisma.WordWhereInput = {};

  if (filter.subject) {
    where.subject = filter.subject;
  }

  if (filter.gradeId) {
    where.gradeId = filter.gradeId;
  }

  if (filter.search) {
    where.OR = [
      { word: { contains: filter.search, mode: "insensitive" } },
      { meaning: { contains: filter.search, mode: "insensitive" } },
    ];
  }

  const [words, totalCount] = await Promise.all([
    prisma.word.findMany({
      where,
      include: {
        grade: { select: { id: true, subject: true, gradeNumber: true } },
      },
      orderBy: [{ subject: "asc" }, { wordNumber: "asc" }],
      skip,
      take,
    }),
    prisma.word.count({ where }),
  ]);

  return { words, totalCount };
}

export async function createWord(data: {
  wordNumber: number;
  subject: Subject;
  word: string;
  meaning: string;
  partOfSpeech?: string;
  gradeId: string;
  categoryTags?: string[];
}) {
  const grade = await prisma.grade.findUnique({ where: { id: data.gradeId } });
  if (!grade) {
    throw new Error(`グレード "${data.gradeId}" が見つかりません`);
  }
  if (grade.subject !== data.subject) {
    throw new Error(
      `グレード "${data.gradeId}" の科目(${grade.subject})と単語の科目(${data.subject})が一致しません`,
    );
  }

  const existing = await prisma.word.findUnique({
    where: { subject_wordNumber: { subject: data.subject, wordNumber: data.wordNumber } },
  });
  if (existing) {
    throw new Error(
      `${data.subject === "english" ? "英語" : "日本語"}の単語番号 ${data.wordNumber} は既に存在します`,
    );
  }

  return prisma.word.create({
    data: {
      wordNumber: data.wordNumber,
      subject: data.subject,
      word: data.word,
      meaning: data.meaning,
      partOfSpeech: data.partOfSpeech || null,
      gradeId: data.gradeId,
      categoryTags: data.categoryTags ?? [],
    },
  });
}

export async function updateWord(
  wordId: string,
  data: {
    word: string;
    meaning: string;
    partOfSpeech?: string;
    gradeId: string;
    categoryTags?: string[];
  },
) {
  const existing = await prisma.word.findUnique({ where: { id: wordId } });
  if (!existing) {
    throw new Error("単語が見つかりません");
  }

  const grade = await prisma.grade.findUnique({ where: { id: data.gradeId } });
  if (!grade) {
    throw new Error(`グレード "${data.gradeId}" が見つかりません`);
  }
  if (grade.subject !== existing.subject) {
    throw new Error(
      `グレード "${data.gradeId}" の科目(${grade.subject})と単語の科目(${existing.subject})が一致しません`,
    );
  }

  return prisma.word.update({
    where: { id: wordId },
    data: {
      word: data.word,
      meaning: data.meaning,
      partOfSpeech: data.partOfSpeech || null,
      gradeId: data.gradeId,
      categoryTags: data.categoryTags ?? [],
    },
  });
}

export async function deleteWord(wordId: string) {
  const word = await prisma.word.findUnique({
    where: { id: wordId },
    include: {
      _count: {
        select: {
          quizAnswers: true,
          reviewItems: true,
        },
      },
    },
  });

  if (!word) {
    throw new Error("単語が見つかりません");
  }

  const refs: string[] = [];
  if (word._count.quizAnswers > 0) refs.push(`クイズ回答(${word._count.quizAnswers}件)`);
  if (word._count.reviewItems > 0) refs.push(`復習項目(${word._count.reviewItems}件)`);

  if (refs.length > 0) {
    throw new Error(
      `この単語は ${refs.join("、")} に参照されているため削除できません`,
    );
  }

  return prisma.word.delete({ where: { id: wordId } });
}

export async function importWordsFromCsv(
  rows: WordCsvRow[],
): Promise<{ imported: number; errors: { line: number; message: string }[] }> {
  const errors: { line: number; message: string }[] = [];
  let imported = 0;

  await prisma.$transaction(async (tx) => {
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        const grade = await tx.grade.findUnique({ where: { id: row.gradeId } });
        if (!grade) {
          errors.push({ line: i + 1, message: `グレード "${row.gradeId}" が見つかりません` });
          continue;
        }
        if (grade.subject !== row.subject) {
          errors.push({
            line: i + 1,
            message: `グレード "${row.gradeId}" の科目(${grade.subject})と単語の科目(${row.subject})が一致しません`,
          });
          continue;
        }

        await tx.word.upsert({
          where: {
            subject_wordNumber: {
              subject: row.subject,
              wordNumber: row.wordNumber,
            },
          },
          create: {
            wordNumber: row.wordNumber,
            subject: row.subject,
            word: row.word,
            meaning: row.meaning,
            partOfSpeech: row.partOfSpeech || null,
            gradeId: row.gradeId,
            categoryTags: row.categoryTags ?? [],
          },
          update: {
            word: row.word,
            meaning: row.meaning,
            partOfSpeech: row.partOfSpeech || null,
            gradeId: row.gradeId,
            categoryTags: row.categoryTags ?? [],
          },
        });
        imported++;
      } catch (e) {
        errors.push({
          line: i + 1,
          message: e instanceof Error ? e.message : "不明なエラー",
        });
      }
    }
  });

  return { imported, errors };
}
