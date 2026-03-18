# CP Uploader

AI-powered tool that converts procurement savings tracker spreadsheets into Connected Platform (CP) bulk upload format.

## Context

Efficio consultants track procurement savings in ad-hoc Excel trackers. To update Connected Platform (the firm's initiative tracking system), they must manually re-enter data into a rigid bulk uploader Excel format. This takes hours and is a major pain point. This tool automates that conversion.

**Stakeholder:** Graeme Kirkwood (Senior Manager, Efficio) — leading CP adoption. Wants a proof of concept to demonstrate to the CP dev team and get native automation prioritized.

**Reference files:** `~/n8n-apps/AI Connected Platform/` contains:
- `20250124 - Initiative Tracking - for Daniel.xlsx` — Example savings tracker (input format). Enviri/Clean Earth project with 35+ initiatives across divisions.
- `ERI04 - Enviri _ Clean Earth - Sourcing Program_template (1).xlsx` — CP bulk uploader template (output format). 6 sheets with strict structure.
- `AI connected platform transcript (graeme).docx` — Meeting transcript with full requirements context.

## Architecture

```
User (Browser)
  ├── Upload tracker Excel
  ├── Review extracted initiatives
  ├── Fill in missing CP Initiative IDs (if needed)
  └── Download generated CP bulk uploader Excel
       │
       ▼
  Next.js App (Vercel)
       │
       ▼
  n8n Workflow (webhook)
  ├── Receive Excel file + metadata
  ├── AI analysis (Claude/GPT): parse tracker, extract initiatives, map to CP format
  └── Generate CP bulk uploader Excel, return to app
```

- **Frontend:** Next.js app (App Router, TypeScript, Tailwind)
- **Backend:** n8n workflow via webhook
- **AI:** Claude or equivalent, for flexible parsing of varied tracker formats
- **Hosting:** Vercel (frontend), n8n Cloud personal instance (workflow)

## CP Bulk Uploader Output Format

The output Excel must have exactly 6 sheets with data starting at cell B6:

### Sheet 1: Instructions
- Read-only instructions about the workbook format

### Sheet 2: Initiatives
| Column | Field |
|--------|-------|
| B | Initiative ID (UUID) |
| C | Initiative Name (e.g., "ERI04-1001 \| Soil and Dredge Transportation") |
| D | Initiative Status (Complete, Cancelled, Active, etc.) |
| E | Methodology (Complex Sourcing, Simple Sourcing, Demand Management, etc.) |
| F | Owner Email |

### Sheet 3: Benefits Field Options
| Column | Field |
|--------|-------|
| B | Benefit Name (e.g., "All", "Savings") |
| C | Question (Profile Status, Workstream, Business Unit, Expenditure, Sign-Off Date, Type, Savings Methodology) |
| D | Applies To (Profiles, Both for comparisons) |
| E | Question Type (DropDown, Free Text, Date, Dropdown) |
| F | Allow Multi Select (True/False) |
| G-N | DDOption1-DDOption8 (dropdown values) |

Fixed structure — same for every project:
- Row 7: Profile Status dropdown (At risk, Awaiting sign-off, Cancelled, In-flight, On Hold, Signed-off, Target)
- Row 8: Workstream (Free Text)
- Row 9: Business Unit (Free Text)
- Row 10: Expenditure dropdown (Opex, Capex)
- Row 11: Sign-Off Date (Date)
- Row 12: Type dropdown (One off, Recurring)
- Row 13: Savings Methodology dropdown (Unit Price reduction, Demand management, Cost mitigation, Payment terms, Value creation, Cost avoidance, Volume rebate, Total cost of ownership)

### Sheet 4: Dates, Targets & Estimates
| Column | Field |
|--------|-------|
| B | Benefit Name ("Savings") |
| C | Financial year start month |
| D | Benefit Reporting Period ("Monthly") |
| E | Unit Of Measurement ("USD") |
| F | Initiative ID (UUID) |
| G | Initiative Name |
| H | In-year start date |
| I | In-year end date |
| J | Total Baseline Estimate |
| K | Addressable Baseline Estimate |
| L | Low Target |
| M | Mid Target |
| N | High Target |

### Sheet 5: Savings | Baselines
| Column | Field |
|--------|-------|
| B | Initiative ID (UUID) |
| C | Initiative Name |
| D | Baseline Name |
| E | Expenditure (Opex/Capex) |
| F | Workstream |
| G | Business Unit |
| H | Annualised Baseline |
| I | Baseline FY 2024-2025 |
| J | Baseline FY 2025-2026 |

### Sheet 6: Savings | Profiles
| Column | Field |
|--------|-------|
| B | Initiative ID (UUID) |
| C | Initiative Name |
| D | Profile Name |
| E | Status (Signed-off, At risk, In-flight, etc.) |
| F | Link With Baseline |
| G | Annualised Baseline |
| H | Expenditure (Opex/Capex) |
| I | Type (One off/Recurring) |
| J | Savings Methodology |
| K | Workstream |
| L | Business Unit |
| M | Sign-Off Date |
| N | Annualised Savings |
| O-Z | Monthly savings (12 months, columns mapped to date serial numbers) |

## Key Design Decisions

### Generic by design
- Works with ANY tracker format, not just the Enviri example
- AI must flexibly parse varied column layouts, naming conventions, and structures
- Should handle trackers with multiple projects/divisions

### Initiative ID handling
- If the uploaded tracker contains CP Initiative IDs, pre-fill them
- If not, show empty fields in the review UI so user can paste them in
- IDs are UUIDs assigned by CP (e.g., `0452dc92-d9fa-485a-bca1-b8fa6fc178ea`)
- The tool does NOT create initiatives in CP — only populates the upload template

### Mapping complexity
- One tracker can contain multiple CP projects (e.g., Enviri + Clean Earth)
- Multiple tracker line items may map to one CP initiative (e.g., 15 "Apps" items = 1 initiative with multiple savings profiles)
- AI needs to intelligently group and map, then let user review/adjust

## Tech Stack

- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Backend:** n8n workflow (personal cloud instance)
- **AI:** Claude (via n8n AI nodes)
- **Hosting:** Vercel (auto-deploy from GitHub)
- **Excel:** ExcelJS or SheetJS for generating the output file

## Environment Variables

```
N8N_WEBHOOK_URL=<webhook URL for the n8n workflow>
```

## n8n Workflow

- **Instance:** Personal n8n cloud (to be transferred to Efficio instance later)
- **Trigger:** Webhook (POST) receiving the tracker file + user inputs
- **Response:** JSON with extracted/mapped data, or the generated Excel file

## Status

- [ ] Project scaffolded
- [ ] n8n workflow created
- [ ] Frontend built
- [ ] Deployed to Vercel
- [ ] Tested with Enviri tracker example
