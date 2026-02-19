"use server";

import { auth } from "@/lib/auth/auth";
import { isAdmin } from "@/lib/auth/roles";
import { revalidatePath } from "next/cache";
import {
  createWord,
  updateWord,
  deleteWord,
  importWordsFromCsv,
} from "@/lib/admin/word-service";
import { parseWordCsv } from "@/lib/admin/word-csv-parser";
import type { Subject } from "@/generated/prisma/client";

export async function createWordAction(formData: FormData) {
  const session = await auth();
  if (!session?.user || !isAdmin(session.user.role)) {
    throw new Error("管理者権限が必要です");
  }

  const wordNumber = Number(formData.get("wordNumber"));
  const subject = formData.get("subject") as Subject;
  const word = formData.get("word") as string;
  const meaning = formData.get("meaning") as string;
  const partOfSpeech = (formData.get("partOfSpeech") as string) || undefined;
  const gradeId = formData.get("gradeId") as string;
  const tagsStr = (formData.get("categoryTags") as string) || "";
  const categoryTags = tagsStr
    ? tagsStr.split(",").map((t) => t.trim()).filter(Boolean)
    : undefined;

  await createWord({
    wordNumber,
    subject,
    word,
    meaning,
    partOfSpeech,
    gradeId,
    categoryTags,
  });

  revalidatePath("/admin/words");
}

export async function updateWordAction(formData: FormData) {
  const session = await auth();
  if (!session?.user || !isAdmin(session.user.role)) {
    throw new Error("管理者権限が必要です");
  }

  const wordId = formData.get("wordId") as string;
  const word = formData.get("word") as string;
  const meaning = formData.get("meaning") as string;
  const partOfSpeech = (formData.get("partOfSpeech") as string) || undefined;
  const gradeId = formData.get("gradeId") as string;
  const tagsStr = (formData.get("categoryTags") as string) || "";
  const categoryTags = tagsStr
    ? tagsStr.split(",").map((t) => t.trim()).filter(Boolean)
    : undefined;

  await updateWord(wordId, {
    word,
    meaning,
    partOfSpeech,
    gradeId,
    categoryTags,
  });

  revalidatePath("/admin/words");
}

export async function deleteWordAction(formData: FormData) {
  const session = await auth();
  if (!session?.user || !isAdmin(session.user.role)) {
    throw new Error("管理者権限が必要です");
  }

  const wordId = formData.get("wordId") as string;
  await deleteWord(wordId);
  revalidatePath("/admin/words");
}

export async function importWordsFromCsvAction(formData: FormData) {
  const session = await auth();
  if (!session?.user || !isAdmin(session.user.role)) {
    throw new Error("管理者権限が必要です");
  }

  const csvText = formData.get("csvText") as string;

  const parsed = parseWordCsv(csvText);
  if (parsed.rows.length === 0) {
    return { imported: 0, errors: parsed.errors };
  }

  const result = await importWordsFromCsv(parsed.rows);
  revalidatePath("/admin/words");
  return {
    imported: result.imported,
    errors: [...parsed.errors, ...result.errors],
  };
}
