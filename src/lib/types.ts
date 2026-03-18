export interface ExtractedInitiative {
  id: string; // internal tracking id (auto-generated)
  cpInitiativeId: string; // UUID from CP (user-provided or extracted)
  name: string; // e.g., "ERI04-1001 | Soil and Dredge Transportation"
  status: string; // Complete, Active, Cancelled, etc.
  methodology: string; // Complex Sourcing, Simple Sourcing, etc.
  ownerEmail: string;
  division: string; // Clean Earth, Enviri, Harsco, etc.
  l1Category: string; // e.g., IT & Telecoms
  l2Category: string; // e.g., Apps
  l3Category: string; // e.g., Docusign
  profiles: ExtractedProfile[];
  baseline: ExtractedBaseline | null;
  targets: ExtractedTargets | null;
}

export interface ExtractedProfile {
  profileName: string;
  status: string; // Signed-off, At risk, In-flight, etc.
  linkWithBaseline: string;
  annualisedBaseline: number;
  expenditure: string; // Opex, Capex
  type: string; // One off, Recurring
  savingsMethodology: string;
  workstream: string;
  businessUnit: string;
  signOffDate: string;
  annualisedSavings: number;
  monthlySavings: number[]; // 12 monthly values
}

export interface ExtractedBaseline {
  baselineName: string;
  expenditure: string;
  workstream: string;
  businessUnit: string;
  annualisedBaseline: number;
  baselineFY1: number;
  baselineFY2: number;
}

export interface ExtractedTargets {
  benefitName: string;
  fyStartMonth: string;
  reportingPeriod: string;
  unitOfMeasurement: string;
  inYearStartDate: string;
  inYearEndDate: string;
  totalBaselineEstimate: number;
  addressableBaselineEstimate: number;
  lowTarget: number;
  midTarget: number;
  highTarget: number;
}

export interface ExtractionResult {
  projectName: string;
  initiatives: ExtractedInitiative[];
  warnings: string[];
  rawSummary: string;
}

export type AppStep = "upload" | "processing" | "review" | "generating" | "download";
