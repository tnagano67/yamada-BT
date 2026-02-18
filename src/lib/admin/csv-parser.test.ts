import { describe, it, expect } from "vitest";
import { parseStudentCsv } from "./csv-parser";

describe("parseStudentCsv", () => {
  it("正常なCSVをパースできる", () => {
    const csv = [
      "1,A,1,山田太郎,ヤマダタロウ,taro@example.com",
      "2,B,15,佐藤花子,サトウハナコ,hanako@example.com",
    ].join("\n");

    const result = parseStudentCsv(csv);
    expect(result.errors).toHaveLength(0);
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0]).toEqual({
      gradeYear: 1,
      className: "A",
      studentNumber: 1,
      name: "山田太郎",
      nameKana: "ヤマダタロウ",
      email: "taro@example.com",
    });
    expect(result.rows[1]).toEqual({
      gradeYear: 2,
      className: "B",
      studentNumber: 15,
      name: "佐藤花子",
      nameKana: "サトウハナコ",
      email: "hanako@example.com",
    });
  });

  it("ヘッダー行を検出してスキップする", () => {
    const csv = [
      "学年,組,出席番号,氏名,氏名カナ,Googleメールアドレス",
      "1,A,1,山田太郎,ヤマダタロウ,taro@example.com",
    ].join("\n");

    const result = parseStudentCsv(csv);
    expect(result.errors).toHaveLength(0);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].name).toBe("山田太郎");
  });

  it("列数が不足している行をエラーにする", () => {
    const csv = [
      "1,A,1,山田太郎,ヤマダタロウ,taro@example.com",
      "2,B,15",
    ].join("\n");

    const result = parseStudentCsv(csv);
    expect(result.rows).toHaveLength(1);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].line).toBe(2);
    expect(result.errors[0].message).toContain("列数が不足");
  });

  it("不正な学年をエラーにする", () => {
    const csv = "5,A,1,山田太郎,ヤマダタロウ,taro@example.com";
    const result = parseStudentCsv(csv);
    expect(result.rows).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toContain("学年が不正");
  });

  it("学年が0の場合もエラーにする", () => {
    const csv = "0,A,1,山田太郎,ヤマダタロウ,taro@example.com";
    const result = parseStudentCsv(csv);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toContain("学年が不正");
  });

  it("学年が数値でない場合エラーにする", () => {
    const csv = "abc,A,1,山田太郎,ヤマダタロウ,taro@example.com";
    const result = parseStudentCsv(csv);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toContain("学年が不正");
  });

  it("不正なメールアドレスをエラーにする", () => {
    const csv = "1,A,1,山田太郎,ヤマダタロウ,invalid-email";
    const result = parseStudentCsv(csv);
    expect(result.rows).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toContain("メールアドレスが不正");
  });

  it("空の組をエラーにする", () => {
    const csv = "1,,1,山田太郎,ヤマダタロウ,taro@example.com";
    const result = parseStudentCsv(csv);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toContain("組が空");
  });

  it("空の氏名をエラーにする", () => {
    const csv = "1,A,1,,ヤマダタロウ,taro@example.com";
    const result = parseStudentCsv(csv);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toContain("氏名が空");
  });

  it("空の氏名カナをエラーにする", () => {
    const csv = "1,A,1,山田太郎,,taro@example.com";
    const result = parseStudentCsv(csv);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toContain("氏名カナが空");
  });

  it("不正な出席番号をエラーにする", () => {
    const csv = "1,A,0,山田太郎,ヤマダタロウ,taro@example.com";
    const result = parseStudentCsv(csv);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toContain("出席番号が不正");
  });

  it("空のCSVを処理できる", () => {
    const result = parseStudentCsv("");
    expect(result.rows).toHaveLength(0);
    expect(result.errors).toHaveLength(0);
  });

  it("空行を無視する", () => {
    const csv = [
      "1,A,1,山田太郎,ヤマダタロウ,taro@example.com",
      "",
      "2,B,1,佐藤花子,サトウハナコ,hanako@example.com",
      "",
    ].join("\n");

    const result = parseStudentCsv(csv);
    expect(result.errors).toHaveLength(0);
    expect(result.rows).toHaveLength(2);
  });

  it("CRLFの改行コードに対応する", () => {
    const csv =
      "1,A,1,山田太郎,ヤマダタロウ,taro@example.com\r\n2,B,1,佐藤花子,サトウハナコ,hanako@example.com";
    const result = parseStudentCsv(csv);
    expect(result.errors).toHaveLength(0);
    expect(result.rows).toHaveLength(2);
  });

  it("複数のエラーを蓄積する", () => {
    const csv = [
      "5,A,1,山田太郎,ヤマダタロウ,taro@example.com",
      "1,A,1,山田太郎,ヤマダタロウ,invalid",
      "1,A,1,正常太郎,セイジョウタロウ,ok@example.com",
    ].join("\n");

    const result = parseStudentCsv(csv);
    expect(result.rows).toHaveLength(1);
    expect(result.errors).toHaveLength(2);
    expect(result.errors[0].line).toBe(1);
    expect(result.errors[1].line).toBe(2);
  });
});
