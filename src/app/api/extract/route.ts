import { NextRequest, NextResponse } from "next/server";
import { parseExcelFile, workbookToPromptText } from "@/lib/parse-excel";

const SYSTEM_PROMPT = `You are a data extraction specialist for procurement consulting. Extract initiative data from savings trackers into structured JSON. Output ONLY valid JSON, no markdown, no code blocks, no explanation text before or after.`;

const USER_PROMPT_PREFIX = `Extract ALL initiatives from this savings tracker. Return ONLY raw JSON (no markdown, no code blocks, no backticks).

Schema:
{
  "projectName": "string",
  "initiatives": [{
    "id": "unique-id (e.g. init-1)",
    "cpInitiativeId": "string (extract from data if present, otherwise empty)",
    "name": "initiative name",
    "status": "Complete|Active|Cancelled|Pilot / Ramp up|Track",
    "methodology": "Complex Sourcing|Simple Sourcing|Demand Management|Project CP Set-up and Management",
    "ownerEmail": "",
    "division": "",
    "l1Category": "",
    "l2Category": "",
    "l3Category": "",
    "profiles": [{
      "profileName": "string",
      "status": "Signed-off|At risk|In-flight|On Hold|Target",
      "linkWithBaseline": "",
      "annualisedBaseline": 0,
      "expenditure": "Opex|Capex",
      "type": "One off|Recurring",
      "savingsMethodology": "Unit Price reduction|Demand management|Cost mitigation",
      "workstream": "",
      "businessUnit": "",
      "signOffDate": "",
      "annualisedSavings": 0,
      "monthlySavings": [0,0,0,0,0,0,0,0,0,0,0,0]
    }],
    "baseline": {"baselineName":"","expenditure":"","workstream":"","businessUnit":"","annualisedBaseline":0,"baselineFY1":0,"baselineFY2":0},
    "targets": {"benefitName":"Savings","fyStartMonth":"","reportingPeriod":"Monthly","unitOfMeasurement":"USD","inYearStartDate":"","inYearEndDate":"","totalBaselineEstimate":0,"addressableBaselineEstimate":0,"lowTarget":0,"midTarget":0,"highTarget":0}
  }],
  "warnings": ["string"],
  "rawSummary": "brief 1-line summary"
}

Rules:
- Group related line items as profiles under one initiative
- monthlySavings: array of 12 numbers (use 0 if unknown)
- If initiative ID looks like a CP UUID, put it in cpInitiativeId
- Keep rawSummary under 100 chars
- Minimize whitespace in output to stay within token limits

CRITICAL — Missing data handling:
- NEVER guess or fabricate values for fields not present in the source data
- If baseline spend is missing, set annualisedBaseline/baselineFY1/baselineFY2/totalBaselineEstimate/addressableBaselineEstimate to 0
- If savings figures exist but baselines do not, do NOT use savings as baselines. They are different fields.
- If midpoint/target estimates are missing, set lowTarget/midTarget/highTarget to 0
- If expenditure type (Opex/Capex) is unclear, leave empty
- If savings methodology is unclear, leave empty

CRITICAL — Warnings must be CONCISE to avoid response truncation:
- Do NOT add a separate warning per field per initiative. Instead, GROUP by issue type.
- GOOD: "Baselines missing for all initiatives — set to 0", "Expenditure type unclear for: Init A, Init B, Init C"
- BAD: "Initiative A: baseline not found", "Initiative A: expenditure unclear", "Initiative B: baseline not found" (repetitive)
- Maximum ~10 warnings total. Summarize patterns, don't enumerate every field.

CRITICAL — Column disambiguation:
- Trackers often have MULTIPLE numeric columns that could look like savings (e.g. "Planned Savings", "Total Savings", "Cost Avoidance", "P&L Impact", plus random/internal columns)
- Do NOT just pick the first numeric column that looks like money. Analyze ALL column headers carefully.
- Ignore columns with nonsensical, internal, or unrecognizable headers — they are likely tracker-specific metadata, not savings data
- Always add a warning stating which columns you identified and how you mapped them

CRITICAL — Savings profiles (MOST IMPORTANT):
- In Connected Platform, different savings types are tracked as SEPARATE PROFILES under the same initiative
- When a tracker has columns like "Cost Avoidance Savings" AND "P&L Impact Savings", these are NOT alternative measures of the same thing — they are DIFFERENT savings profiles that must each become their own entry in the profiles array
- Example: if initiative CS-001 has Cost Avoidance = $40k and P&L Impact = $200k, output TWO profiles:
  [{"profileName": "P&L Impact Savings", "annualisedSavings": 200000, ...}, {"profileName": "Cost Avoidance Savings", "annualisedSavings": 40000, ...}]
- "Total Savings" is usually the SUM of all profile types — do NOT create a separate profile for it. Instead, verify: Total Savings should roughly equal the sum of the individual profile columns. If it does not, add a warning.
- Common profile types to look for: "P&L Impact", "Cost Avoidance", "Cost Mitigation", "Value Creation", "Volume Rebate", "Payment Terms"
- If only ONE savings column exists (e.g. just "Total Savings"), create one profile with that value
- If multiple savings-type columns exist, create one profile PER type

Column mapping guide:
- "Baseline spend" / "Current spend" / "Estimated baseline" → baseline.annualisedBaseline
- "Addressable spend" / "Estimated addressable" → targets.addressableBaselineEstimate
- "Estimated savings low/mid/high" → targets.lowTarget/midTarget/highTarget
- "Planned savings" / "Target savings" → targets, NOT actual savings profiles
- "Total savings" → cross-check sum, not a separate profile
- If you cannot confidently determine the column mapping, set values to 0 AND add a warning listing ALL candidate columns

Data:
`;

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENROUTER_API_KEY not configured" },
      { status: 500 }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Parse Excel locally
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const parsed = await parseExcelFile(buffer, file.name);

    if (parsed.sheets.length === 0) {
      return NextResponse.json(
        {
          error:
            "No data found in the uploaded file. Make sure it contains sheets with data.",
        },
        { status: 400 }
      );
    }

    // Convert to text for AI analysis
    const promptText = workbookToPromptText(parsed);

    // Call OpenRouter directly
    const aiResponse = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "anthropic/claude-sonnet-4-5",
          max_tokens: 32768,
          temperature: 0.1,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: USER_PROMPT_PREFIX + promptText },
          ],
        }),
      }
    );

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("OpenRouter error:", errorText);
      return NextResponse.json(
        { error: "AI analysis failed. Please try again." },
        { status: 502 }
      );
    }

    const aiResult = await aiResponse.json();

    // Check for truncation
    const finishReason = aiResult.choices?.[0]?.finish_reason;
    if (finishReason === "length") {
      console.error("AI response truncated (hit max_tokens)");
    }

    // Extract text from OpenRouter response
    let responseText = "";
    try {
      responseText = aiResult.choices[0].message.content;
    } catch {
      console.error(
        "Unexpected AI response format:",
        JSON.stringify(aiResult).substring(0, 500)
      );
      return NextResponse.json(
        { error: "Unexpected AI response format" },
        { status: 502 }
      );
    }

    // Parse JSON from response
    const result = extractJSON(responseText);
    if (result) {
      return NextResponse.json(result);
    }

    // If we couldn't parse, log and return fallback
    console.error(
      "Failed to parse AI JSON. finish_reason:",
      finishReason,
      "Response length:",
      responseText.length,
      "First 500 chars:",
      responseText.substring(0, 500),
      "Last 500 chars:",
      responseText.substring(responseText.length - 500)
    );

    return NextResponse.json({
      projectName: "Unknown Project",
      initiatives: [],
      warnings: [
        finishReason === "length"
          ? "AI response was too long and got truncated. Try uploading a smaller file."
          : "Failed to parse AI response. Please try again.",
      ],
      rawSummary: responseText.substring(0, 200),
    });
  } catch (error) {
    console.error("Extract error:", error);
    return NextResponse.json(
      { error: "Failed to process file" },
      { status: 500 }
    );
  }
}

function extractJSON(text: string): Record<string, unknown> | null {
  // Try 1: Direct parse (ideal case - no wrapping)
  try {
    return JSON.parse(text);
  } catch {
    // continue
  }

  // Try 2: Extract from markdown code block
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1].trim());
    } catch {
      // continue
    }
  }

  // Try 3: Find outermost { ... } pair with brace counting
  const startIdx = text.indexOf("{");
  if (startIdx === -1) return null;

  let depth = 0;
  let endIdx = -1;
  for (let i = startIdx; i < text.length; i++) {
    if (text[i] === "{") depth++;
    else if (text[i] === "}") {
      depth--;
      if (depth === 0) {
        endIdx = i;
        break;
      }
    }
  }

  if (endIdx !== -1) {
    try {
      return JSON.parse(text.substring(startIdx, endIdx + 1));
    } catch {
      // continue
    }
  }

  // Try 4: Truncated JSON - try to repair by closing open arrays/objects
  if (startIdx !== -1) {
    let jsonStr = text.substring(startIdx);
    // Count unclosed brackets
    let openBraces = 0;
    let openBrackets = 0;
    let inString = false;
    let escaped = false;
    for (const ch of jsonStr) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (ch === "\\") {
        escaped = true;
        continue;
      }
      if (ch === '"') {
        inString = !inString;
        continue;
      }
      if (inString) continue;
      if (ch === "{") openBraces++;
      else if (ch === "}") openBraces--;
      else if (ch === "[") openBrackets++;
      else if (ch === "]") openBrackets--;
    }

    // If inside a string, close it
    if (inString) jsonStr += '"';

    // Remove trailing incomplete value (after last comma)
    jsonStr = jsonStr.replace(/,\s*"?[^"{}[\],]*$/, "");

    // Close unclosed brackets/braces
    for (let i = 0; i < openBrackets; i++) jsonStr += "]";
    for (let i = 0; i < openBraces; i++) jsonStr += "}";

    try {
      return JSON.parse(jsonStr);
    } catch {
      // final fallback failed
    }
  }

  return null;
}
