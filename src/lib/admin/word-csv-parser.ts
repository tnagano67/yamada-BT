export interface WordCsvRow {
  subject: "english" | "japanese";
  wordNumber: number;
  word: string;
  meaning: string;
  gradeId: string;
  partOfSpeech?: string;
  categoryTags?: string[];
}

export interface WordCsvResult {
  rows: WordCsvRow[];
  errors: { line: number; message: string }[];
}

const WORD_HEADERS = ["科目", "単語番号", "単語", "意味", "グレードID"];

const SUBJECT_MAP: Record<string, "english" | "japanese"> = {
  英語: "english",
  日本語: "japanese",
  english: "english",
  japanese: "japanese",
};

function isWordHeaderRow(fields: string[]): boolean {
  if (fields.length < 5) return false;
  return fields
    .slice(0, 5)
    .every((f, i) => f.trim() === WORD_HEADERS[i]);
}

export function parseWordCsv(csvText: string): WordCsvResult {
  const rows: WordCsvRow[] = [];
  const errors: { line: number; message: string }[] = [];

  const lines = csvText
    .split(/\r?\n/)
    .filter((line) => line.trim() !== "");

  if (lines.length === 0) {
    return { rows, errors };
  }

  let startIndex = 0;
  const firstFields = lines[0].split(",");
  if (isWordHeaderRow(firstFields)) {
    startIndex = 1;
  }

  for (let i = startIndex; i < lines.length; i++) {
    const lineNumber = i + 1;
    const fields = lines[i].split(",");

    if (fields.length < 5) {
      errors.push({
        line: lineNumber,
        message: `列数が不足しています（${fields.length}列、5列以上必要）`,
      });
      continue;
    }

    const subjectStr = fields[0].trim();
    const wordNumberStr = fields[1].trim();
    const word = fields[2].trim();
    const meaning = fields[3].trim();
    const gradeId = fields[4].trim();
    const partOfSpeech = fields[5]?.trim() || undefined;
    const tagsStr = fields[6]?.trim() || undefined;

    const subject = SUBJECT_MAP[subjectStr];
    if (!subject) {
      errors.push({
        line: lineNumber,
        message: `科目が不正です: "${subjectStr}"（英語/日本語/english/japanese）`,
      });
      continue;
    }

    const wordNumber = parseInt(wordNumberStr, 10);
    if (isNaN(wordNumber) || wordNumber < 1) {
      errors.push({
        line: lineNumber,
        message: `単語番号が不正です: "${wordNumberStr}"`,
      });
      continue;
    }

    if (word === "") {
      errors.push({ line: lineNumber, message: "単語が空です" });
      continue;
    }

    if (meaning === "") {
      errors.push({ line: lineNumber, message: "意味が空です" });
      continue;
    }

    if (gradeId === "") {
      errors.push({ line: lineNumber, message: "グレードIDが空です" });
      continue;
    }

    const categoryTags = tagsStr
      ? tagsStr.split("|").map((t) => t.trim()).filter(Boolean)
      : undefined;

    rows.push({
      subject,
      wordNumber,
      word,
      meaning,
      gradeId,
      partOfSpeech,
      categoryTags,
    });
  }

  return { rows, errors };
}
