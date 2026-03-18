import { NextRequest, NextResponse } from "next/server";
import { parseExcelFile, workbookToPromptText } from "@/lib/parse-excel";

export async function POST(req: NextRequest) {
  const webhookUrl = process.env.N8N_WEBHOOK_URL;
  if (!webhookUrl) {
    return NextResponse.json(
      { error: "N8N_WEBHOOK_URL not configured" },
      { status: 500 }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Parse Excel locally (we have ExcelJS here)
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

    // Send parsed data to n8n webhook for AI analysis
    const n8nResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileName: file.name,
        sheetsText: promptText,
        sheetCount: parsed.sheets.length,
        sheetNames: parsed.sheets.map((s) => s.name),
        totalRows: parsed.sheets.reduce((sum, s) => sum + s.rows.length, 0),
      }),
    });

    if (!n8nResponse.ok) {
      const errorText = await n8nResponse.text();
      console.error("n8n webhook error:", errorText);
      return NextResponse.json(
        { error: "AI analysis failed. Please try again." },
        { status: 502 }
      );
    }

    const result = await n8nResponse.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Extract error:", error);
    return NextResponse.json(
      { error: "Failed to process file" },
      { status: 500 }
    );
  }
}
