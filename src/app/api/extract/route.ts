import { NextRequest, NextResponse } from "next/server";
import { parseExcelFile, workbookToPromptText } from "@/lib/parse-excel";

const SYSTEM_PROMPT = `You are a data extraction specialist for procurement consulting. You convert messy savings tracker spreadsheets into structured JSON for the Connected Platform bulk uploader. Be thorough and precise. Always output valid JSON only.`;

const USER_PROMPT_PREFIX = `Analyze this savings tracker and extract ALL initiatives. Return ONLY valid JSON matching this schema: {projectName, initiatives: [{id, cpInitiativeId, name, status, methodology, ownerEmail, division, l1Category, l2Category, l3Category, profiles: [{profileName, status, linkWithBaseline, annualisedBaseline, expenditure, type, savingsMethodology, workstream, businessUnit, signOffDate, annualisedSavings, monthlySavings}], baseline: {baselineName, expenditure, workstream, businessUnit, annualisedBaseline, baselineFY1, baselineFY2}, targets: {benefitName, fyStartMonth, reportingPeriod, unitOfMeasurement, inYearStartDate, inYearEndDate, totalBaselineEstimate, addressableBaselineEstimate, lowTarget, midTarget, highTarget}}], warnings, rawSummary}. Group related line items as profiles under one initiative. Data:\n\n`;

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
        { error: "No data found in the uploaded file. Make sure it contains sheets with data." },
        { status: 400 }
      );
    }

    // Convert to text for AI analysis
    const promptText = workbookToPromptText(parsed);

    // Call OpenRouter directly
    const aiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "anthropic/claude-sonnet-4-5",
        max_tokens: 8192,
        temperature: 0.1,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: USER_PROMPT_PREFIX + promptText },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("OpenRouter error:", errorText);
      return NextResponse.json(
        { error: "AI analysis failed. Please try again." },
        { status: 502 }
      );
    }

    const aiResult = await aiResponse.json();

    // Extract text from OpenRouter response
    let responseText = "";
    try {
      responseText = aiResult.choices[0].message.content;
    } catch {
      console.error("Unexpected AI response format:", JSON.stringify(aiResult));
      return NextResponse.json(
        { error: "Unexpected AI response format" },
        { status: 502 }
      );
    }

    // Parse JSON from response (handle markdown code blocks)
    let jsonStr = responseText;
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    } else {
      const braceMatch = responseText.match(/\{[\s\S]*\}/);
      if (braceMatch) {
        jsonStr = braceMatch[0];
      }
    }

    try {
      const result = JSON.parse(jsonStr);
      return NextResponse.json(result);
    } catch (e) {
      console.error("Failed to parse AI JSON:", e, "Raw:", responseText.substring(0, 500));
      return NextResponse.json({
        projectName: "Unknown Project",
        initiatives: [],
        warnings: ["Failed to parse AI response"],
        rawSummary: responseText.substring(0, 500),
      });
    }
  } catch (error) {
    console.error("Extract error:", error);
    return NextResponse.json(
      { error: "Failed to process file" },
      { status: 500 }
    );
  }
}
