import ExcelJS from "exceljs";

export interface ParsedSheet {
  name: string;
  headers: string[];
  rows: Record<string, string | number | null>[];
}

export interface ParsedWorkbook {
  fileName: string;
  sheets: ParsedSheet[];
}

export async function parseExcelFile(buffer: Buffer, fileName: string): Promise<ParsedWorkbook> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);

  const sheets: ParsedSheet[] = [];

  workbook.eachSheet((worksheet) => {
    const rows: Record<string, string | number | null>[] = [];
    let headers: string[] = [];
    let headerRowIndex = 0;

    // Find the header row (first row with multiple non-empty cells)
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (headerRowIndex > 0) return;
      const nonEmpty = row.values
        ? (row.values as (string | number | null)[]).filter(
            (v) => v !== null && v !== undefined && v !== ""
          )
        : [];
      if (nonEmpty.length >= 3) {
        headerRowIndex = rowNumber;
        headers = (row.values as (string | number | null | Record<string, unknown>)[]).map((v, i) => {
          if (i === 0) return "";
          if (typeof v === "object" && v !== null) {
            const obj = v as Record<string, unknown>;
            if ("result" in obj) return String(obj.result ?? `col_${i}`);
            if ("richText" in obj && Array.isArray(obj.richText))
              return (obj.richText as { text: string }[]).map((r) => r.text).join("");
            if ("text" in obj) return String(obj.text);
          }
          return String(v ?? `col_${i}`);
        });
      }
    });

    if (headerRowIndex === 0) return;

    // Extract data rows
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber <= headerRowIndex) return;

      const rowData: Record<string, string | number | null> = {};
      let hasData = false;

      (row.values as (string | number | null | Record<string, unknown>)[]).forEach((value, colIndex) => {
        if (colIndex === 0) return; // skip index 0 (1-based)
        const header = headers[colIndex] || `col_${colIndex}`;

        // Resolve ExcelJS formula/rich-text objects to their computed values
        let resolved = value;
        if (typeof value === "object" && value !== null) {
          const obj = value as Record<string, unknown>;
          if ("result" in obj && obj.result !== undefined) {
            // Formula cell: { formula: '=A1+B1', result: 123 }
            resolved = obj.result as string | number | null;
          } else if ("richText" in obj && Array.isArray(obj.richText)) {
            // Rich text cell: { richText: [{ text: 'hello' }, ...] }
            resolved = (obj.richText as { text: string }[]).map((r) => r.text).join("");
          } else if ("text" in obj) {
            // Hyperlink or other text object
            resolved = obj.text as string;
          } else {
            resolved = String(value);
          }
        }

        if (resolved !== null && resolved !== undefined && resolved !== "") {
          hasData = true;
          rowData[header] = resolved as string | number | null;
        }
      });

      if (hasData) {
        rows.push(rowData);
      }
    });

    if (rows.length > 0) {
      sheets.push({
        name: worksheet.name,
        headers: headers.filter((h) => h !== ""),
        rows,
      });
    }
  });

  return { fileName, sheets };
}

export function workbookToPromptText(parsed: ParsedWorkbook): string {
  let text = `FILE: ${parsed.fileName}\n\n`;

  for (const sheet of parsed.sheets) {
    text += `=== SHEET: "${sheet.name}" (${sheet.rows.length} rows) ===\n`;
    text += `COLUMNS: ${sheet.headers.join(" | ")}\n\n`;

    for (const row of sheet.rows.slice(0, 100)) {
      const entries = Object.entries(row)
        .filter(([, v]) => v !== null && v !== undefined)
        .map(([k, v]) => `${k}: ${v}`);
      text += entries.join(" | ") + "\n";
    }

    if (sheet.rows.length > 100) {
      text += `... and ${sheet.rows.length - 100} more rows\n`;
    }
    text += "\n";
  }

  return text;
}
