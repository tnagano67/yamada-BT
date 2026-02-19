export interface TeacherCsvRow {
  name: string;
  nameKana: string;
  email: string;
  role: "teacher" | "subject_lead" | "admin";
}

export interface TeacherCsvResult {
  rows: TeacherCsvRow[];
  errors: { line: number; message: string }[];
}

const TEACHER_HEADERS = ["氏名", "氏名カナ", "メールアドレス", "ロール"];

const ROLE_MAP: Record<string, TeacherCsvRow["role"]> = {
  教員: "teacher",
  教科主任: "subject_lead",
  管理者: "admin",
  teacher: "teacher",
  subject_lead: "subject_lead",
  admin: "admin",
};

function isTeacherHeaderRow(fields: string[]): boolean {
  if (fields.length < 3) return false;
  return fields
    .slice(0, 3)
    .every((f, i) => f.trim() === TEACHER_HEADERS[i]);
}

export function parseTeacherCsv(csvText: string): TeacherCsvResult {
  const rows: TeacherCsvRow[] = [];
  const errors: { line: number; message: string }[] = [];

  const lines = csvText
    .split(/\r?\n/)
    .filter((line) => line.trim() !== "");

  if (lines.length === 0) {
    return { rows, errors };
  }

  let startIndex = 0;
  const firstFields = lines[0].split(",");
  if (isTeacherHeaderRow(firstFields)) {
    startIndex = 1;
  }

  for (let i = startIndex; i < lines.length; i++) {
    const lineNumber = i + 1;
    const fields = lines[i].split(",");

    if (fields.length < 3) {
      errors.push({
        line: lineNumber,
        message: `列数が不足しています（${fields.length}列、3列以上必要）`,
      });
      continue;
    }

    const name = fields[0].trim();
    const nameKana = fields[1].trim();
    const email = fields[2].trim();
    const roleStr = fields[3]?.trim() || "教員";

    if (name === "") {
      errors.push({ line: lineNumber, message: "氏名が空です" });
      continue;
    }

    if (nameKana === "") {
      errors.push({ line: lineNumber, message: "氏名カナが空です" });
      continue;
    }

    if (!email.includes("@")) {
      errors.push({
        line: lineNumber,
        message: `メールアドレスが不正です: "${email}"`,
      });
      continue;
    }

    const role = ROLE_MAP[roleStr];
    if (!role) {
      errors.push({
        line: lineNumber,
        message: `ロールが不正です: "${roleStr}"（教員/教科主任/管理者）`,
      });
      continue;
    }

    rows.push({ name, nameKana, email, role });
  }

  return { rows, errors };
}

export interface ClassCsvRow {
  gradeYear: number;
  className: string;
  homeroomEmail: string;
}

export interface ClassCsvResult {
  rows: ClassCsvRow[];
  errors: { line: number; message: string }[];
}

const CLASS_HEADERS = ["学年", "組", "担任メールアドレス"];

function isClassHeaderRow(fields: string[]): boolean {
  if (fields.length < 2) return false;
  return fields
    .slice(0, 2)
    .every((f, i) => f.trim() === CLASS_HEADERS[i]);
}

export function parseClassCsv(csvText: string): ClassCsvResult {
  const rows: ClassCsvRow[] = [];
  const errors: { line: number; message: string }[] = [];

  const lines = csvText
    .split(/\r?\n/)
    .filter((line) => line.trim() !== "");

  if (lines.length === 0) {
    return { rows, errors };
  }

  let startIndex = 0;
  const firstFields = lines[0].split(",");
  if (isClassHeaderRow(firstFields)) {
    startIndex = 1;
  }

  for (let i = startIndex; i < lines.length; i++) {
    const lineNumber = i + 1;
    const fields = lines[i].split(",");

    if (fields.length < 2) {
      errors.push({
        line: lineNumber,
        message: `列数が不足しています（${fields.length}列、2列以上必要）`,
      });
      continue;
    }

    const gradeYearStr = fields[0].trim();
    const className = fields[1].trim();
    const homeroomEmail = fields[2]?.trim() || "";

    const gradeYear = parseInt(gradeYearStr, 10);
    if (isNaN(gradeYear) || gradeYear < 1 || gradeYear > 3) {
      errors.push({
        line: lineNumber,
        message: `学年が不正です: "${gradeYearStr}"（1〜3を指定してください）`,
      });
      continue;
    }

    if (className === "") {
      errors.push({ line: lineNumber, message: "組が空です" });
      continue;
    }

    if (homeroomEmail !== "" && !homeroomEmail.includes("@")) {
      errors.push({
        line: lineNumber,
        message: `担任メールアドレスが不正です: "${homeroomEmail}"`,
      });
      continue;
    }

    rows.push({ gradeYear, className, homeroomEmail });
  }

  return { rows, errors };
}

export interface StudentCsvRow {
  gradeYear: number;
  className: string;
  studentNumber: number;
  name: string;
  nameKana: string;
  email: string;
}

export interface StudentCsvResult {
  rows: StudentCsvRow[];
  errors: { line: number; message: string }[];
}

const EXPECTED_HEADERS = [
  "学年",
  "組",
  "出席番号",
  "氏名",
  "氏名カナ",
  "Googleメールアドレス",
];

function isHeaderRow(fields: string[]): boolean {
  if (fields.length < EXPECTED_HEADERS.length) return false;
  return fields.every(
    (f, i) => f.trim() === EXPECTED_HEADERS[i],
  );
}

export function parseStudentCsv(csvText: string): StudentCsvResult {
  const rows: StudentCsvRow[] = [];
  const errors: { line: number; message: string }[] = [];

  const lines = csvText
    .split(/\r?\n/)
    .filter((line) => line.trim() !== "");

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

    if (fields.length < 6) {
      errors.push({
        line: lineNumber,
        message: `列数が不足しています（${fields.length}列、6列必要）`,
      });
      continue;
    }

    const gradeYearStr = fields[0].trim();
    const className = fields[1].trim();
    const studentNumberStr = fields[2].trim();
    const name = fields[3].trim();
    const nameKana = fields[4].trim();
    const email = fields[5].trim();

    const gradeYear = parseInt(gradeYearStr, 10);
    if (isNaN(gradeYear) || gradeYear < 1 || gradeYear > 3) {
      errors.push({
        line: lineNumber,
        message: `学年が不正です: "${gradeYearStr}"（1〜3を指定してください）`,
      });
      continue;
    }

    if (className === "") {
      errors.push({ line: lineNumber, message: "組が空です" });
      continue;
    }

    const studentNumber = parseInt(studentNumberStr, 10);
    if (isNaN(studentNumber) || studentNumber < 1) {
      errors.push({
        line: lineNumber,
        message: `出席番号が不正です: "${studentNumberStr}"`,
      });
      continue;
    }

    if (name === "") {
      errors.push({ line: lineNumber, message: "氏名が空です" });
      continue;
    }

    if (nameKana === "") {
      errors.push({ line: lineNumber, message: "氏名カナが空です" });
      continue;
    }

    if (!email.includes("@")) {
      errors.push({
        line: lineNumber,
        message: `メールアドレスが不正です: "${email}"`,
      });
      continue;
    }

    rows.push({ gradeYear, className, studentNumber, name, nameKana, email });
  }

  return { rows, errors };
}
