import type { DayType } from "@/generated/prisma/client";

export interface CalendarCsvRow {
  date: string; // YYYY-MM-DD
  dayType: DayType;
  hasMorningTest: boolean;
  note: string;
}

export interface CalendarCsvResult {
  rows: CalendarCsvRow[];
  errors: { line: number; message: string }[];
}

const VALID_DAY_TYPES: DayType[] = [
  "school_day",
  "weekend",
  "holiday",
  "vacation",
  "exam_period",
  "special",
];

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const HEADER_PATTERNS = ["date", "daytype", "hasmorningtest", "note"];

function isHeaderRow(fields: string[]): boolean {
  const lower = fields.map((f) => f.trim().toLowerCase().replace(/_/g, ""));
  return HEADER_PATTERNS.every((h) => lower.some((f) => f.includes(h)));
}

function parseBoolean(value: string): boolean | null {
  const lower = value.trim().toLowerCase();
  if (lower === "true" || lower === "1") return true;
  if (lower === "false" || lower === "0") return false;
  return null;
}

export function parseCalendarCsv(csvText: string): CalendarCsvResult {
  const rows: CalendarCsvRow[] = [];
  const errors: { line: number; message: string }[] = [];

  const lines = csvText.split(/\r?\n/).filter((line) => line.trim() !== "");

  if (lines.length === 0) {
    return { rows, errors };
  }

  let startIndex = 0;
  const firstFields = lines[0].split(",");
  if (isHeaderRow(firstFields)) {
    startIndex = 1;
  }

  for (let i = startIndex; i < lines.length; i++) {
    const lineNumber = i + 1;
    const fields = lines[i].split(",");

    if (fields.length < 3) {
      errors.push({
        line: lineNumber,
        message: "列が不足しています（最低3列必要: date, dayType, hasMorningTest）",
      });
      continue;
    }

    const dateStr = fields[0].trim();
    if (!DATE_REGEX.test(dateStr)) {
      errors.push({
        line: lineNumber,
        message: `日付形式が不正です: "${dateStr}"（YYYY-MM-DD形式で入力してください）`,
      });
      continue;
    }

    // Validate the date is a real date
    const [yearStr, monthStr, dayStr] = dateStr.split("-");
    const parsed = new Date(
      Date.UTC(Number(yearStr), Number(monthStr) - 1, Number(dayStr)),
    );
    if (
      parsed.getUTCFullYear() !== Number(yearStr) ||
      parsed.getUTCMonth() !== Number(monthStr) - 1 ||
      parsed.getUTCDate() !== Number(dayStr)
    ) {
      errors.push({
        line: lineNumber,
        message: `無効な日付です: "${dateStr}"`,
      });
      continue;
    }

    const dayTypeStr = fields[1].trim() as DayType;
    if (!VALID_DAY_TYPES.includes(dayTypeStr)) {
      errors.push({
        line: lineNumber,
        message: `無効なDayTypeです: "${dayTypeStr}"（${VALID_DAY_TYPES.join(", ")}のいずれか）`,
      });
      continue;
    }

    const hasMorningTest = parseBoolean(fields[2]);
    if (hasMorningTest === null) {
      errors.push({
        line: lineNumber,
        message: `hasMorningTestが不正です: "${fields[2].trim()}"（true/falseで入力してください）`,
      });
      continue;
    }

    const note = fields.length >= 4 ? fields[3].trim() : "";

    rows.push({
      date: dateStr,
      dayType: dayTypeStr,
      hasMorningTest,
      note,
    });
  }

  return { rows, errors };
}
