/**
 * CSV エクスポートユーティリティ
 * BOM付きUTF-8 CSV文字列を生成し、ブラウザダウンロードをトリガーする
 */

function escapeCsvField(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function generateCsv(
  headers: string[],
  rows: string[][],
): string {
  const headerLine = headers.map(escapeCsvField).join(",");
  const dataLines = rows.map((row) =>
    row.map((cell) => escapeCsvField(cell ?? "")).join(","),
  );
  return [headerLine, ...dataLines].join("\r\n");
}

export function downloadCsv(filename: string, csvContent: string): void {
  const bom = "\uFEFF";
  const blob = new Blob([bom + csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
