import { NextRequest, NextResponse } from "next/server";
import { parseExcelFile, workbookToPromptText, parseCpExport } from "@/lib/parse-excel";

const SYSTEM_PROMPT = `You are a data merge specialist for procurement consulting. You merge savings tracker data into existing Connected Platform (CP) initiative data. Output ONLY valid JSON, no markdown, no code blocks, no explanation text before or after.`;

const MERGE_PROMPT_PREFIX = `You have two data sources. Merge the TRACKER data into the existing CP DATA.

## MERGE RULES

1. FUZZY MATCHING: Match tracker initiatives to CP initiatives by name. Names may differ significantly (e.g. "S&D Transportation" in the tracker matches "ERI04-1001 | Soil and Dredge Transportation" in CP). Use semantic understanding to match, not just string similarity. Include a confidence level (high/medium/low) for each match.

2. FOR MATCHED INITIATIVES:
   - If CP has a value and tracker does NOT have that field → KEEP the CP value unchanged
   - If tracker has a value and CP does NOT → ADD the tracker value
   - If both have a value and they DIFFER → UPDATE to the tracker value
   - Track EVERY change as a change record with the field name, old value, and new value

3. FOR UNMATCHED TRACKER INITIATIVES: Add them as new initiatives

4. FOR CP INITIATIVES WITH NO TRACKER MATCH: Preserve them exactly as-is

5. PROFILES: Apply the same merge logic at the profile level. Match profiles by name within matched initiatives. New profiles from the tracker get added. Existing CP profiles without tracker matches stay unchanged.

## OUTPUT SCHEMA

Return ONLY valid JSON matching this schema:
{
  "projectName": "string",
  "initiatives": [{
    "id": "string",
    "cpInitiativeId": "string (from CP data if matched, empty for new)",
    "name": "string (use the CP name for matched initiatives)",
    "status": "Complete|Active|Cancelled|Pilot / Ramp up|Track",
    "methodology": "Complex Sourcing|Simple Sourcing|Demand Management|Project CP Set-up and Management",
    "ownerEmail": "string",
    "division": "string",
    "l1Category": "string",
    "l2Category": "string",
    "l3Category": "string",
    "profiles": [{
      "profileName": "string",
      "status": "Signed-off|At risk|In-flight|On Hold|Target",
      "linkWithBaseline": "string",
      "annualisedBaseline": 0,
      "expenditure": "Opex|Capex",
      "type": "One off|Recurring",
      "savingsMethodology": "string",
      "workstream": "string",
      "businessUnit": "string",
      "signOffDate": "string",
      "annualisedSavings": 0,
      "monthlySavings": [0,0,0,0,0,0,0,0,0,0,0,0]
    }],
    "baseline": {"baselineName":"","expenditure":"","workstream":"","businessUnit":"","annualisedBaseline":0,"baselineFY1":0,"baselineFY2":0},
    "targets": {"benefitName":"Savings","fyStartMonth":"","reportingPeriod":"Monthly","unitOfMeasurement":"USD","inYearStartDate":"","inYearEndDate":"","totalBaselineEstimate":0,"addressableBaselineEstimate":0,"lowTarget":0,"midTarget":0,"highTarget":0}
  }],
  "warnings": ["string"],
  "rawSummary": "brief 1-line summary",
  "changeReport": {
    "matched": [{
      "cpName": "original CP initiative name",
      "trackerName": "matched tracker initiative name",
      "initiativeId": "id in the result initiatives array",
      "confidence": "high|medium|low",
      "changes": [
        {"field": "status", "from": "Active", "to": "Complete"},
        {"field": "profiles[0].annualisedSavings", "from": 50000, "to": 75000}
      ]
    }],
    "added": [{"initiativeId": "id", "name": "New initiative name from tracker"}],
    "unchanged": [{"initiativeId": "id", "name": "CP initiative name with no tracker updates"}]
  }
}

CRITICAL RULES:
- NEVER guess or fabricate values. If a field is missing from BOTH sources, set to 0 or empty string.
- For matched initiatives, ALWAYS use the CP name (it's the canonical name in the system).
- The changeReport must be exhaustive — list EVERY matched, added, and unchanged initiative.
- Add warnings for low-confidence matches so the user can verify.
- Keep rawSummary under 100 chars.
- Minimize whitespace in output.
- WARNINGS MUST BE CONCISE — maximum ~10 warnings. Group by issue type, don't repeat per-field per-initiative. Example: "Baselines missing for: Init A, Init B, Init C" instead of one warning per field per initiative. This prevents response truncation on large trackers.

## DATA

### EXISTING CP DATA (structured JSON):
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
    const trackerFile = formData.get("file") as File | null;
    const cpExportFile = formData.get("cpExport") as File | null;

    if (!trackerFile) {
      return NextResponse.json({ error: "No tracker file uploaded" }, { status: 400 });
    }
    if (!cpExportFile) {
      return NextResponse.json({ error: "No CP export file uploaded" }, { status: 400 });
    }

    // Parse tracker
    const trackerBuffer = Buffer.from(await trackerFile.arrayBuffer());
    const trackerParsed = await parseExcelFile(trackerBuffer, trackerFile.name);
    if (trackerParsed.sheets.length === 0) {
      return NextResponse.json(
        { error: "No data found in the tracker file." },
        { status: 400 }
      );
    }
    const trackerText = workbookToPromptText(trackerParsed);

    // Parse CP export deterministically
    const cpBuffer = Buffer.from(await cpExportFile.arrayBuffer());
    const cpParsed = await parseExcelFile(cpBuffer, cpExportFile.name);
    const cpData = parseCpExport(cpParsed);

    if (cpData.initiatives.length === 0 && cpData.warnings.length > 0) {
      return NextResponse.json(
        { error: `CP export parsing failed: ${cpData.warnings[0]}` },
        { status: 400 }
      );
    }

    // Build the merge prompt
    const cpDataJson = JSON.stringify(cpData, null, 0);
    const userPrompt = MERGE_PROMPT_PREFIX + cpDataJson + "\n\n### NEW TRACKER DATA (raw spreadsheet):\n" + trackerText;

    // Call OpenRouter
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
            { role: "user", content: userPrompt },
          ],
        }),
      }
    );

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("OpenRouter error:", errorText);
      return NextResponse.json(
        { error: "AI merge analysis failed. Please try again." },
        { status: 502 }
      );
    }

    const aiResult = await aiResponse.json();
    const finishReason = aiResult.choices?.[0]?.finish_reason;
    if (finishReason === "length") {
      console.error("AI response truncated (hit max_tokens)");
    }

    let responseText = "";
    try {
      responseText = aiResult.choices[0].message.content;
    } catch {
      console.error("Unexpected AI response format:", JSON.stringify(aiResult).substring(0, 500));
      return NextResponse.json(
        { error: "Unexpected AI response format" },
        { status: 502 }
      );
    }

    const result = extractJSON(responseText);
    if (result) {
      return NextResponse.json(result);
    }

    console.error(
      "Failed to parse merge AI JSON. finish_reason:", finishReason,
      "Response length:", responseText.length,
      "First 500 chars:", responseText.substring(0, 500),
      "Last 500 chars:", responseText.substring(responseText.length - 500)
    );

    return NextResponse.json({
      projectName: cpData.projectName || "Unknown Project",
      initiatives: cpData.initiatives,
      warnings: [
        finishReason === "length"
          ? "AI response was too long and got truncated. Try uploading smaller files."
          : "Failed to parse AI merge response. Returning original CP data unchanged.",
      ],
      rawSummary: "Merge failed — returning original CP data",
    });
  } catch (error) {
    console.error("Merge error:", error);
    return NextResponse.json(
      { error: "Failed to process files" },
      { status: 500 }
    );
  }
}

function extractJSON(text: string): Record<string, unknown> | null {
  // Try 1: Direct parse
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

  // Try 4: Truncated JSON repair
  if (startIdx !== -1) {
    let jsonStr = text.substring(startIdx);
    let openBraces = 0;
    let openBrackets = 0;
    let inString = false;
    let escaped = false;
    for (const ch of jsonStr) {
      if (escaped) { escaped = false; continue; }
      if (ch === "\\") { escaped = true; continue; }
      if (ch === '"') { inString = !inString; continue; }
      if (inString) continue;
      if (ch === "{") openBraces++;
      else if (ch === "}") openBraces--;
      else if (ch === "[") openBrackets++;
      else if (ch === "]") openBrackets--;
    }
    if (inString) jsonStr += '"';
    jsonStr = jsonStr.replace(/,\s*"?[^"{}[\],]*$/, "");
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
