/**
 * JST (Asia/Tokyo, UTC+9) 基準の日付ユーティリティ
 *
 * Prisma の @db.Date フィールドは UTC の日付部分を使用するため、
 * JST の「今日」を正しく格納するには、JST の日付を UTC midnight として表現する。
 * 例: JST 2026-02-18 → new Date('2026-02-18T00:00:00.000Z')
 */

const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

/**
 * JST の現在日時を Date として返す（内部的に UTC に +9h したもの）
 * 注意: getUTCHours(), getUTCFullYear() 等で JST の値が取れる
 */
function toJstDate(date: Date): Date {
  return new Date(date.getTime() + JST_OFFSET_MS);
}

/**
 * JST での「今日」を UTC midnight の Date として返す
 * Prisma の @db.Date フィールドに格納する用
 */
export function todayJST(): Date {
  const jst = toJstDate(new Date());
  return new Date(
    Date.UTC(jst.getUTCFullYear(), jst.getUTCMonth(), jst.getUTCDate()),
  );
}

/**
 * JST での現在の年を返す
 */
export function currentYearJST(): number {
  return toJstDate(new Date()).getUTCFullYear();
}

/**
 * JST での現在の月 (1-12) を返す
 */
export function currentMonthJST(): number {
  return toJstDate(new Date()).getUTCMonth() + 1;
}

/**
 * JST 基準の年度を返す（4月始まり: 1-3月は前年度）
 */
export function currentAcademicYearJST(): number {
  const jst = toJstDate(new Date());
  const month = jst.getUTCMonth(); // 0-indexed
  const year = jst.getUTCFullYear();
  return month < 3 ? year - 1 : year;
}

/**
 * JST 基準の学期を返す（1学期: 4-7月, 2学期: 8-12月, 3学期: 1-3月）
 */
export function currentSemesterJST(): number {
  const month = toJstDate(new Date()).getUTCMonth(); // 0-indexed
  if (month >= 3 && month <= 6) return 1;
  if (month >= 7 && month <= 11) return 2;
  return 3;
}

/**
 * YYYY-MM-DD 文字列を UTC midnight の Date に変換する
 */
export function parseDate(dateStr: string): Date {
  return new Date(dateStr + "T00:00:00.000Z");
}

/**
 * Date を YYYY-MM-DD 文字列に変換する（UTC 基準）
 */
export function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

/**
 * JST での「明日」を UTC midnight の Date として返す
 */
export function tomorrowJST(): Date {
  const today = todayJST();
  return new Date(
    Date.UTC(
      today.getUTCFullYear(),
      today.getUTCMonth(),
      today.getUTCDate() + 1,
    ),
  );
}

/**
 * 指定日の曜日を返す（UTC 基準, 0=日 6=土）
 * @db.Date で格納された Date は UTC midnight なので getUTCDay() が正しい
 */
export function getDayOfWeek(date: Date): number {
  return date.getUTCDay();
}
