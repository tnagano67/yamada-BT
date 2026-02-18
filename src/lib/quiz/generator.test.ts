import { describe, it, expect } from "vitest";
import {
  fisherYatesShuffle,
  stratifiedSample,
  selectWithWrongAnswerPriority,
} from "./generator";
import type { QuizWord } from "./types";

describe("fisherYatesShuffle", () => {
  it("配列の長さが変わらない", () => {
    const arr = [1, 2, 3, 4, 5];
    const result = fisherYatesShuffle([...arr]);
    expect(result).toHaveLength(arr.length);
  });

  it("全要素が保持される", () => {
    const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const result = fisherYatesShuffle([...arr]);
    expect(result.sort((a, b) => a - b)).toEqual(arr);
  });

  it("空配列を処理できる", () => {
    const result = fisherYatesShuffle([]);
    expect(result).toEqual([]);
  });

  it("1要素配列を処理できる", () => {
    const result = fisherYatesShuffle([42]);
    expect(result).toEqual([42]);
  });

  it("元の配列を破壊的に変更する", () => {
    const arr = [1, 2, 3, 4, 5];
    const result = fisherYatesShuffle(arr);
    expect(result).toBe(arr); // 同じ参照
  });
});

describe("stratifiedSample", () => {
  const makeItem = (id: number, bucket: number) => ({ id, bucket });

  it("要素数が選出数以下なら全要素を返す", () => {
    const items = [makeItem(1, 0), makeItem(2, 0), makeItem(3, 1)];
    const result = stratifiedSample(items, 5, (i) => i.bucket);
    expect(result).toHaveLength(3);
    expect(result.map((r) => r.id).sort()).toEqual([1, 2, 3]);
  });

  it("各バケットから均等に選出する", () => {
    // バケット0: 5個, バケット1: 5個 → 4個選出 → 各2個ずつ
    const items = [
      ...Array.from({ length: 5 }, (_, i) => makeItem(i, 0)),
      ...Array.from({ length: 5 }, (_, i) => makeItem(i + 5, 1)),
    ];
    const result = stratifiedSample(items, 4, (i) => i.bucket);
    expect(result).toHaveLength(4);

    // 複数回実行して各バケットから選出されることを確認
    let bucket0Count = 0;
    let bucket1Count = 0;
    for (let trial = 0; trial < 50; trial++) {
      const r = stratifiedSample(items, 4, (i) => i.bucket);
      for (const item of r) {
        if (item.bucket === 0) bucket0Count++;
        else bucket1Count++;
      }
    }
    // 各バケットからほぼ均等に選出される（完全均等: 各100）
    expect(bucket0Count).toBeGreaterThan(50);
    expect(bucket1Count).toBeGreaterThan(50);
  });

  it("バケットが偏っていても選出できる", () => {
    // バケット0: 8個, バケット1: 2個 → 6個選出
    const items = [
      ...Array.from({ length: 8 }, (_, i) => makeItem(i, 0)),
      ...Array.from({ length: 2 }, (_, i) => makeItem(i + 8, 1)),
    ];
    const result = stratifiedSample(items, 6, (i) => i.bucket);
    expect(result).toHaveLength(6);
    // 全要素が元のアイテムに含まれる
    for (const item of result) {
      expect(items.some((orig) => orig.id === item.id)).toBe(true);
    }
  });

  it("バケットが1つしかなくても動作する", () => {
    const items = Array.from({ length: 10 }, (_, i) => makeItem(i, 0));
    const result = stratifiedSample(items, 5, (i) => i.bucket);
    expect(result).toHaveLength(5);
  });

  it("選出数と同数のアイテムがある場合", () => {
    const items = [makeItem(1, 0), makeItem(2, 1)];
    const result = stratifiedSample(items, 2, (i) => i.bucket);
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.id).sort()).toEqual([1, 2]);
  });
});

describe("selectWithWrongAnswerPriority", () => {
  const makeWord = (id: string, num: number): QuizWord => ({
    id,
    wordNumber: num,
    word: `word${num}`,
    meaning: `meaning${num}`,
  });

  const words: QuizWord[] = Array.from({ length: 20 }, (_, i) =>
    makeWord(`w${i + 1}`, i + 1),
  );

  it("誤答がある場合、誤答が優先的に含まれる", () => {
    const incorrectWordIds = ["w1", "w2", "w3", "w4", "w5"];

    // 複数回実行して統計的に確認
    let wrongIncluded = 0;
    const trials = 100;
    for (let i = 0; i < trials; i++) {
      const result = selectWithWrongAnswerPriority(words, incorrectWordIds, 10);
      expect(result).toHaveLength(10);
      const wrongCount = result.filter((w) =>
        incorrectWordIds.includes(w.id),
      ).length;
      wrongIncluded += wrongCount;
    }
    // 10問中30% = MAX 3問が誤答枠。平均で少なくとも2問以上は誤答が含まれるはず
    expect(wrongIncluded / trials).toBeGreaterThan(1.5);
  });

  it("誤答が少ない場合、その数だけ含まれる", () => {
    const incorrectWordIds = ["w1"];
    const result = selectWithWrongAnswerPriority(words, incorrectWordIds, 10);
    expect(result).toHaveLength(10);
    // w1が含まれるはず
    expect(result.some((w) => w.id === "w1")).toBe(true);
  });

  it("誤答リストが空なら通常のシャッフルと同じ挙動", () => {
    const result = selectWithWrongAnswerPriority(words, [], 10);
    expect(result).toHaveLength(10);
    // 全要素がwordsに含まれる
    for (const w of result) {
      expect(words.some((orig) => orig.id === w.id)).toBe(true);
    }
  });

  it("要求数が単語総数以下でも動作する", () => {
    const smallPool = words.slice(0, 5);
    const incorrectWordIds = ["w1", "w2"];
    const result = selectWithWrongAnswerPriority(
      smallPool,
      incorrectWordIds,
      5,
    );
    expect(result).toHaveLength(5);
  });

  it("重複なく選出される", () => {
    const incorrectWordIds = ["w1", "w2", "w3"];
    const result = selectWithWrongAnswerPriority(words, incorrectWordIds, 10);
    const ids = result.map((w) => w.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
