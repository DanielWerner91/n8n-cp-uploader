import ExcelJS from "exceljs";
import type {
  ExtractionResult,
  ExtractedInitiative,
  ExtractedProfile,
  ExtractedBaseline,
  ExtractedTargets,
} from "./types";

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
    // Skip hidden and very hidden sheets
    if (worksheet.state === "hidden" || worksheet.state === "veryHidden") return;
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

/**
 * Parse a CP bulk uploader export into an ExtractionResult.
 * The CP format has a known fixed structure: headers at row 6, data from row 7,
 * columns starting at B (index 2 in ExcelJS 1-based arrays).
 */
export function parseCpExport(parsed: ParsedWorkbook): ExtractionResult {
  const findSheet = (name: string) =>
    parsed.sheets.find((s) => s.name.toLowerCase().includes(name.toLowerCase()));

  const initSheet = findSheet("Initiatives");
  const dteSheet = findSheet("Dates, Targets");
  const basSheet = findSheet("Baselines");
  const profSheet = findSheet("Profiles");

  if (!initSheet) {
    return {
      projectName: parsed.fileName.replace(/\.[^.]+$/, ""),
      initiatives: [],
      warnings: ["Could not find 'Initiatives' sheet in CP export. Is this a valid CP bulk uploader file?"],
      rawSummary: "Failed to parse CP export",
    };
  }

  // Build initiative map from Initiatives sheet
  const initiatives: ExtractedInitiative[] = [];
  const initiativeById = new Map<string, ExtractedInitiative>();

  for (const row of initSheet.rows) {
    const cpId = str(row["Initiative ID"]);
    const name = str(row["Initiative"]);
    if (!cpId && !name) continue;

    const init: ExtractedInitiative = {
      id: `cp-${initiatives.length + 1}`,
      cpInitiativeId: cpId,
      name,
      status: str(row["Initiative Status"]),
      methodology: str(row["Methodology"]),
      ownerEmail: str(row["Owner Email"]),
      division: "",
      l1Category: "",
      l2Category: "",
      l3Category: "",
      profiles: [],
      baseline: null,
      targets: null,
    };

    initiatives.push(init);
    if (cpId) initiativeById.set(cpId, init);
  }

  // Populate targets from Dates, Targets & Estimates sheet
  if (dteSheet) {
    for (const row of dteSheet.rows) {
      const cpId = str(row["Initiative ID"]);
      const init = cpId ? initiativeById.get(cpId) : findByName(initiatives, str(row["Initiative"]));
      if (!init) continue;

      init.targets = {
        benefitName: str(row["Benefit Name"]) || "Savings",
        fyStartMonth: str(row["Financial year start month"]),
        reportingPeriod: str(row["Benefit Reporting Period"]) || "Monthly",
        unitOfMeasurement: str(row["Unit Of Measurement"]) || "USD",
        inYearStartDate: str(row["In-year start date"]),
        inYearEndDate: str(row["In-year end date"]),
        totalBaselineEstimate: num(row["Total Baseline Estimate"]),
        addressableBaselineEstimate: num(row["Addressable Baseline Estimate"]),
        lowTarget: num(row["Low Target"]),
        midTarget: num(row["Mid Target"]),
        highTarget: num(row["High Target"]),
      };
    }
  }

  // Populate baselines from Savings | Baselines sheet
  if (basSheet) {
    for (const row of basSheet.rows) {
      const cpId = str(row["Initiative ID"]);
      const init = cpId ? initiativeById.get(cpId) : findByName(initiatives, str(row["Initiative"]));
      if (!init) continue;

      // Find the FY columns dynamically (they contain "Baseline FY")
      const fy1Key = Object.keys(row).find((k) => k.includes("Baseline FY") && k !== "Annualised Baseline");
      const fy2Key = Object.keys(row).find((k) => k.includes("Baseline FY") && k !== fy1Key && k !== "Annualised Baseline");

      init.baseline = {
        baselineName: str(row["Baseline Name"]),
        expenditure: str(row["Expenditure"]),
        workstream: str(row["Workstream"]),
        businessUnit: str(row["Business Unit"]),
        annualisedBaseline: num(row["Annualised Baseline"]),
        baselineFY1: fy1Key ? num(row[fy1Key]) : 0,
        baselineFY2: fy2Key ? num(row[fy2Key]) : 0,
      };
    }
  }

  // Populate profiles from Savings | Profiles sheet
  if (profSheet) {
    // Identify monthly columns (anything after "Annualised Savings" that looks like a date)
    const knownFields = new Set([
      "Initiative ID", "Initiative", "Profile Name", "Status",
      "Link With Baseline", "Annualised Baseline", "Expenditure",
      "Type", "Savings Methodology", "Workstream", "Business Unit",
      "Sign-Off Date", "Annualised Savings",
    ]);
    const monthColumns = profSheet.headers.filter((h) => !knownFields.has(h) && h !== "");

    for (const row of profSheet.rows) {
      const cpId = str(row["Initiative ID"]);
      const init = cpId ? initiativeById.get(cpId) : findByName(initiatives, str(row["Initiative"]));
      if (!init) continue;

      const monthlySavings = monthColumns.length >= 12
        ? monthColumns.slice(0, 12).map((col) => num(row[col]))
        : Array(12).fill(0);

      const profile: ExtractedProfile = {
        profileName: str(row["Profile Name"]),
        status: str(row["Status"]),
        linkWithBaseline: str(row["Link With Baseline"]),
        annualisedBaseline: num(row["Annualised Baseline"]),
        expenditure: str(row["Expenditure"]),
        type: str(row["Type"]),
        savingsMethodology: str(row["Savings Methodology"]),
        workstream: str(row["Workstream"]),
        businessUnit: str(row["Business Unit"]),
        signOffDate: str(row["Sign-Off Date"]),
        annualisedSavings: num(row["Annualised Savings"]),
        monthlySavings,
      };

      init.profiles.push(profile);
    }
  }

  return {
    projectName: parsed.fileName.replace(/\.[^.]+$/, ""),
    initiatives,
    warnings: [],
    rawSummary: `Parsed ${initiatives.length} initiatives from CP export`,
  };
}

function str(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return "";
  return String(val).trim();
}

function num(val: string | number | null | undefined): number {
  if (val === null || val === undefined) return 0;
  const n = typeof val === "number" ? val : parseFloat(String(val));
  return isNaN(n) ? 0 : n;
}

function findByName(initiatives: ExtractedInitiative[], name: string): ExtractedInitiative | undefined {
  if (!name) return undefined;
  return initiatives.find((i) => i.name === name);
}
