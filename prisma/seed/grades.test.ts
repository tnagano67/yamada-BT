import { describe, it, expect } from "vitest";
import { getAllGrades } from "./grades";

describe("getAllGrades", () => {
  const grades = getAllGrades();
  const englishGrades = grades.filter((g) => g.subject === "english");
  const japaneseGrades = grades.filter((g) => g.subject === "japanese");

  it("generates 48 English grades", () => {
    expect(englishGrades).toHaveLength(48);
  });

  it("generates 20 Japanese grades", () => {
    expect(japaneseGrades).toHaveLength(20);
  });

  it("English grades are E1-E48", () => {
    for (let i = 0; i < 48; i++) {
      expect(englishGrades[i].id).toBe(`E${i + 1}`);
      expect(englishGrades[i].gradeNumber).toBe(i + 1);
    }
  });

  it("Japanese grades are J1-J20", () => {
    for (let i = 0; i < 20; i++) {
      expect(japaneseGrades[i].id).toBe(`J${i + 1}`);
      expect(japaneseGrades[i].gradeNumber).toBe(i + 1);
    }
  });

  it("E48 is complete mastery covering all 1900 words", () => {
    const e48 = englishGrades.find((g) => g.id === "E48");
    expect(e48).toBeDefined();
    expect(e48!.gradeType).toBe("complete");
    expect(e48!.wordStart).toBe(1);
    expect(e48!.wordEnd).toBe(1900);
  });

  it("J20 is complete mastery covering all 800 words", () => {
    const j20 = japaneseGrades.find((g) => g.id === "J20");
    expect(j20).toBeDefined();
    expect(j20!.gradeType).toBe("complete");
    expect(j20!.wordStart).toBe(1);
    expect(j20!.wordEnd).toBe(800);
  });

  it("review grades appear every 5th grade in English (E5, E10, ...)", () => {
    for (let i = 5; i <= 45; i += 5) {
      const grade = englishGrades.find((g) => g.id === `E${i}`);
      expect(grade).toBeDefined();
      expect(grade!.gradeType).toBe("review");
    }
  });

  it("review grades appear every 5th grade in Japanese (J5, J10, J15)", () => {
    for (const id of ["J5", "J10", "J15"]) {
      const grade = japaneseGrades.find((g) => g.id === id);
      expect(grade).toBeDefined();
      expect(grade!.gradeType).toBe("review");
    }
  });
});
