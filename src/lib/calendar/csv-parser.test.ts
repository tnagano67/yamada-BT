import { describe, it, expect } from "vitest";
import { parseCalendarCsv } from "./csv-parser";

describe("parseCalendarCsv", () => {
  it("ヘッダー付きCSVを正しくパースする", () => {
    const csv = `date,dayType,hasMorningTest,note
2025-04-07,school_day,true,始業式
2025-04-08,school_day,true,
2025-04-09,holiday,false,創立記念日`;

    const result = parseCalendarCsv(csv);
    expect(result.errors).toHaveLength(0);
    expect(result.rows).toHaveLength(3);
    expect(result.rows[0]).toEqual({
      date: "2025-04-07",
      dayType: "school_day",
      hasMorningTest: true,
      note: "始業式",
    });
    expect(result.rows[1]).toEqual({
      date: "2025-04-08",
      dayType: "school_day",
      hasMorningTest: true,
      note: "",
    });
    expect(result.rows[2]).toEqual({
      date: "2025-04-09",
      dayType: "holiday",
      hasMorningTest: false,
      note: "創立記念日",
    });
  });

  it("ヘッダーなしCSVもパースできる", () => {
    const csv = `2025-04-07,school_day,true,始業式`;

    const result = parseCalendarCsv(csv);
    expect(result.errors).toHaveLength(0);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].date).toBe("2025-04-07");
  });

  it("無効な日付形式でエラーを返す", () => {
    const csv = `2025/04/07,school_day,true,
04-07-2025,school_day,true,
abc,school_day,true,`;

    const result = parseCalendarCsv(csv);
    expect(result.rows).toHaveLength(0);
    expect(result.errors).toHaveLength(3);
    expect(result.errors[0].line).toBe(1);
    expect(result.errors[0].message).toContain("日付形式が不正です");
  });

  it("存在しない日付でエラーを返す", () => {
    const csv = `2025-02-30,school_day,true,`;

    const result = parseCalendarCsv(csv);
    expect(result.rows).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toContain("無効な日付です");
  });

  it("無効なDayTypeでエラーを返す", () => {
    const csv = `2025-04-07,invalid_type,true,`;

    const result = parseCalendarCsv(csv);
    expect(result.rows).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toContain("無効なDayTypeです");
  });

  it("全DayTypeを受け付ける", () => {
    const csv = `2025-04-01,school_day,true,
2025-04-02,weekend,false,
2025-04-03,holiday,false,
2025-04-04,vacation,false,
2025-04-05,exam_period,false,
2025-04-06,special,false,`;

    const result = parseCalendarCsv(csv);
    expect(result.errors).toHaveLength(0);
    expect(result.rows).toHaveLength(6);
  });

  it("空ファイルは空結果を返す", () => {
    const result = parseCalendarCsv("");
    expect(result.rows).toHaveLength(0);
    expect(result.errors).toHaveLength(0);
  });

  it("空行のみのファイルは空結果を返す", () => {
    const result = parseCalendarCsv("\n\n\n");
    expect(result.rows).toHaveLength(0);
    expect(result.errors).toHaveLength(0);
  });

  it("列が不足している場合エラーを返す", () => {
    const csv = `2025-04-07,school_day`;

    const result = parseCalendarCsv(csv);
    expect(result.rows).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toContain("列が不足しています");
  });

  it("boolean値のバリエーションを正しくパースする", () => {
    const csv = `2025-04-01,school_day,true,
2025-04-02,school_day,false,
2025-04-03,school_day,TRUE,
2025-04-04,school_day,FALSE,
2025-04-05,school_day,1,
2025-04-06,school_day,0,`;

    const result = parseCalendarCsv(csv);
    expect(result.errors).toHaveLength(0);
    expect(result.rows).toHaveLength(6);
    expect(result.rows[0].hasMorningTest).toBe(true);
    expect(result.rows[1].hasMorningTest).toBe(false);
    expect(result.rows[2].hasMorningTest).toBe(true);
    expect(result.rows[3].hasMorningTest).toBe(false);
    expect(result.rows[4].hasMorningTest).toBe(true);
    expect(result.rows[5].hasMorningTest).toBe(false);
  });

  it("無効なboolean値でエラーを返す", () => {
    const csv = `2025-04-07,school_day,yes,`;

    const result = parseCalendarCsv(csv);
    expect(result.rows).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toContain("hasMorningTestが不正です");
  });

  it("note列がない場合は空文字になる", () => {
    const csv = `2025-04-07,school_day,true`;

    const result = parseCalendarCsv(csv);
    expect(result.errors).toHaveLength(0);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].note).toBe("");
  });

  it("有効行と無効行が混在する場合、有効行のみrowsに含まれる", () => {
    const csv = `2025-04-07,school_day,true,通常
invalid,school_day,true,
2025-04-09,holiday,false,祝日`;

    const result = parseCalendarCsv(csv);
    expect(result.rows).toHaveLength(2);
    expect(result.errors).toHaveLength(1);
    expect(result.rows[0].date).toBe("2025-04-07");
    expect(result.rows[1].date).toBe("2025-04-09");
  });

  it("CRLFの改行を処理できる", () => {
    const csv = "2025-04-07,school_day,true,\r\n2025-04-08,holiday,false,";

    const result = parseCalendarCsv(csv);
    expect(result.errors).toHaveLength(0);
    expect(result.rows).toHaveLength(2);
  });
});
