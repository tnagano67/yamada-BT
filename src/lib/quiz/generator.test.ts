import { describe, it, expect } from "vitest";
import { fisherYatesShuffle } from "./generator";

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
