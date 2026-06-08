// ── DCF Model Utilities ──────────────────────────────────────────────────────
// Probability-adjusted NPV for biotech drug pipelines
// POS benchmarks: BIO/Citeline Industry Analysis (2011-2020)

export interface POSTransitions {
  discToP1: number;
  p1ToP2: number;
  p2ToP3: number;
  p3ToNDA: number;
  ndaToAP: number;
}

export interface DrugModel {
  id: string;
  drugName: string;
  genericName: string;
  phase: string;
  indication: string;
  indicationType: string;
  pos: POSTransitions;
  patientPopulationM: number;
  marketPenetration: number;
  pricePerPatient: number;
  useOverride: boolean;
  peakSalesOverrideM: number;
  launchYear: number;
  patentLife: number;
  rampYears: number;
  operatingMargin: number;
  isPartnered: boolean;
  royaltyRate: number;
  expanded: boolean;
  included: boolean;
}

export interface GlobalParams {
  wacc: number;
  taxRate: number;
  netCashB: number;
  sharesOutstandingM: number;
}

export interface DrugDCFResult {
  drugId: string;
  drugName: string;
  peakSalesM: number;
  cumulativePOS: number;
  grossNPVM: number;
  rNPVM: number;
  yearlyRevenue: { year: number; revenue: number; riskAdj: number }[];
}

export const INDICATION_TYPES = [
  'Oncology',
  'CNS / Neurology',
  'Cardiovascular',
  'Infectious Disease',
  'Rare Disease / Orphan',
  'Metabolic / Obesity',
  'Immunology',
  'Gene Therapy / Editing',
  'Other',
] as const;

// Phase transition POS by indication type (BIO Industry Analysis)
export const POS_DEFAULTS: Record<string, POSTransitions> = {
  'Oncology':               { discToP1: 0.60, p1ToP2: 0.40, p2ToP3: 0.22, p3ToNDA: 0.49, ndaToAP: 0.88 },
  'CNS / Neurology':        { discToP1: 0.58, p1ToP2: 0.52, p2ToP3: 0.24, p3ToNDA: 0.52, ndaToAP: 0.88 },
  'Cardiovascular':         { discToP1: 0.62, p1ToP2: 0.57, p2ToP3: 0.34, p3ToNDA: 0.60, ndaToAP: 0.92 },
  'Infectious Disease':     { discToP1: 0.65, p1ToP2: 0.60, p2ToP3: 0.38, p3ToNDA: 0.68, ndaToAP: 0.92 },
  'Rare Disease / Orphan':  { discToP1: 0.65, p1ToP2: 0.68, p2ToP3: 0.45, p3ToNDA: 0.79, ndaToAP: 0.94 },
  'Metabolic / Obesity':    { discToP1: 0.62, p1ToP2: 0.58, p2ToP3: 0.35, p3ToNDA: 0.62, ndaToAP: 0.92 },
  'Immunology':             { discToP1: 0.60, p1ToP2: 0.55, p2ToP3: 0.33, p3ToNDA: 0.67, ndaToAP: 0.92 },
  'Gene Therapy / Editing': { discToP1: 0.52, p1ToP2: 0.48, p2ToP3: 0.25, p3ToNDA: 0.55, ndaToAP: 0.85 },
  'Other':                  { discToP1: 0.58, p1ToP2: 0.52, p2ToP3: 0.29, p3ToNDA: 0.58, ndaToAP: 0.88 },
};

// ── Indication → TAM Database ─────────────────────────────────────────────────
// Matches indication text to realistic market size, pricing, and peak penetration.
// Figures represent US addressable market (typical for biotech DCF models).
interface TAMProfile { patientPopulationM: number; marketPenetration: number; pricePerPatient: number; }

export function getIndicationTAM(indication: string, indicationType: string): TAMProfile {
  const s = indication.toLowerCase();

  // ── Metabolic / Obesity ────────────────────────────────────────────────────
  if (/obesity|overweight|weight management|bmi/.test(s))
    return { patientPopulationM: 40, marketPenetration: 6, pricePerPatient: 12_000 };
  if (/type 2 diabetes|t2dm|t2d/.test(s))
    return { patientPopulationM: 28, marketPenetration: 8, pricePerPatient: 6_000 };
  if (/type 1 diabetes|t1dm/.test(s))
    return { patientPopulationM: 1.5, marketPenetration: 18, pricePerPatient: 10_000 };
  if (/nash|nafld|mash|metabolic.associated steatohepatitis/.test(s))
    return { patientPopulationM: 8, marketPenetration: 10, pricePerPatient: 18_000 };
  if (/hyperglycemia|insulin resistance/.test(s))
    return { patientPopulationM: 15, marketPenetration: 6, pricePerPatient: 5_000 };

  // ── Oncology ──────────────────────────────────────────────────────────────
  if (/non.small.cell lung|nsclc/.test(s))
    return { patientPopulationM: 0.23, marketPenetration: 18, pricePerPatient: 160_000 };
  if (/small.cell lung|sclc/.test(s))
    return { patientPopulationM: 0.04, marketPenetration: 22, pricePerPatient: 140_000 };
  if (/lung cancer/.test(s))
    return { patientPopulationM: 0.24, marketPenetration: 15, pricePerPatient: 150_000 };
  if (/breast cancer|her2\+|hr\+/.test(s))
    return { patientPopulationM: 0.32, marketPenetration: 14, pricePerPatient: 100_000 };
  if (/triple.negative breast|tnbc/.test(s))
    return { patientPopulationM: 0.08, marketPenetration: 18, pricePerPatient: 120_000 };
  if (/prostate cancer|crpc|mcrpc/.test(s))
    return { patientPopulationM: 0.18, marketPenetration: 14, pricePerPatient: 80_000 };
  if (/colorectal|colon cancer/.test(s))
    return { patientPopulationM: 0.16, marketPenetration: 12, pricePerPatient: 90_000 };
  if (/multiple myeloma/.test(s))
    return { patientPopulationM: 0.035, marketPenetration: 20, pricePerPatient: 130_000 };
  if (/acute myeloid leukemia|aml/.test(s))
    return { patientPopulationM: 0.022, marketPenetration: 22, pricePerPatient: 100_000 };
  if (/chronic lymphocytic leukemia|cll/.test(s))
    return { patientPopulationM: 0.02, marketPenetration: 20, pricePerPatient: 100_000 };
  if (/diffuse large b.cell|dlbcl/.test(s))
    return { patientPopulationM: 0.025, marketPenetration: 20, pricePerPatient: 100_000 };
  if (/renal.cell carcinoma|kidney cancer|rcc/.test(s))
    return { patientPopulationM: 0.08, marketPenetration: 15, pricePerPatient: 100_000 };
  if (/bladder cancer|urothelial/.test(s))
    return { patientPopulationM: 0.08, marketPenetration: 14, pricePerPatient: 90_000 };
  if (/melanoma/.test(s))
    return { patientPopulationM: 0.10, marketPenetration: 16, pricePerPatient: 120_000 };
  if (/pancreatic cancer/.test(s))
    return { patientPopulationM: 0.06, marketPenetration: 12, pricePerPatient: 100_000 };
  if (/ovarian cancer/.test(s))
    return { patientPopulationM: 0.05, marketPenetration: 16, pricePerPatient: 100_000 };
  if (/cervical cancer/.test(s))
    return { patientPopulationM: 0.04, marketPenetration: 18, pricePerPatient: 80_000 };
  if (/hepatocellular|liver cancer|hcc/.test(s))
    return { patientPopulationM: 0.04, marketPenetration: 15, pricePerPatient: 90_000 };
  if (/glioblastoma|glioma|brain tumor/.test(s))
    return { patientPopulationM: 0.025, marketPenetration: 14, pricePerPatient: 120_000 };
  if (/thyroid cancer/.test(s))
    return { patientPopulationM: 0.05, marketPenetration: 18, pricePerPatient: 80_000 };
  if (/gastric|gastroesophageal|stomach cancer/.test(s))
    return { patientPopulationM: 0.07, marketPenetration: 12, pricePerPatient: 90_000 };
  if (/kras/.test(s))
    return { patientPopulationM: 0.14, marketPenetration: 15, pricePerPatient: 140_000 };
  if (/myelofibrosis/.test(s))
    return { patientPopulationM: 0.02, marketPenetration: 22, pricePerPatient: 80_000 };
  if (/polycythemia vera/.test(s))
    return { patientPopulationM: 0.015, marketPenetration: 20, pricePerPatient: 80_000 };

  // ── CNS / Neurology ────────────────────────────────────────────────────────
  if (/alzheimer/.test(s))
    return { patientPopulationM: 6.5, marketPenetration: 8, pricePerPatient: 26_000 };
  if (/parkinson/.test(s))
    return { patientPopulationM: 1.0, marketPenetration: 10, pricePerPatient: 25_000 };
  if (/multiple sclerosis|relapsing ms|rrms/.test(s))
    return { patientPopulationM: 1.0, marketPenetration: 10, pricePerPatient: 85_000 };
  if (/migraine/.test(s))
    return { patientPopulationM: 4.0, marketPenetration: 7, pricePerPatient: 7_500 };
  if (/schizophrenia/.test(s))
    return { patientPopulationM: 2.8, marketPenetration: 5, pricePerPatient: 15_000 };
  if (/major depressive|mdd/.test(s))
    return { patientPopulationM: 16, marketPenetration: 4, pricePerPatient: 8_000 };
  if (/bipolar/.test(s))
    return { patientPopulationM: 4.5, marketPenetration: 5, pricePerPatient: 10_000 };
  if (/epilepsy|seizure/.test(s))
    return { patientPopulationM: 3.4, marketPenetration: 5, pricePerPatient: 10_000 };
  if (/tardive dyskinesia/.test(s))
    return { patientPopulationM: 0.5, marketPenetration: 25, pricePerPatient: 50_000 };
  if (/amyotrophic lateral|als/.test(s))
    return { patientPopulationM: 0.03, marketPenetration: 30, pricePerPatient: 100_000 };
  if (/spinal muscular atrophy|sma/.test(s))
    return { patientPopulationM: 0.01, marketPenetration: 60, pricePerPatient: 350_000 };
  if (/huntington/.test(s))
    return { patientPopulationM: 0.03, marketPenetration: 35, pricePerPatient: 80_000 };
  if (/congenital adrenal hyperplasia|cah/.test(s))
    return { patientPopulationM: 0.015, marketPenetration: 55, pricePerPatient: 60_000 };

  // ── Cardiovascular ─────────────────────────────────────────────────────────
  if (/heart failure|hfref|hfpef/.test(s))
    return { patientPopulationM: 6.5, marketPenetration: 7, pricePerPatient: 8_000 };
  if (/atrial fibrillation|afib|af/.test(s))
    return { patientPopulationM: 6.0, marketPenetration: 8, pricePerPatient: 15_000 };
  if (/hypertension/.test(s))
    return { patientPopulationM: 50, marketPenetration: 2, pricePerPatient: 2_000 };
  if (/hypercholesterolemia|dyslipidemia|ldl/.test(s))
    return { patientPopulationM: 25, marketPenetration: 4, pricePerPatient: 5_000 };
  if (/atherosclerosis|cardiovascular risk/.test(s))
    return { patientPopulationM: 10, marketPenetration: 5, pricePerPatient: 8_000 };
  if (/hypertrophic cardiomyopathy|hcm/.test(s))
    return { patientPopulationM: 0.2, marketPenetration: 20, pricePerPatient: 40_000 };

  // ── Immunology ─────────────────────────────────────────────────────────────
  if (/atopic dermatitis|eczema/.test(s))
    return { patientPopulationM: 7.5, marketPenetration: 8, pricePerPatient: 32_000 };
  if (/psoriasis/.test(s))
    return { patientPopulationM: 8.0, marketPenetration: 7, pricePerPatient: 25_000 };
  if (/psoriatic arthritis/.test(s))
    return { patientPopulationM: 1.5, marketPenetration: 10, pricePerPatient: 30_000 };
  if (/rheumatoid arthritis/.test(s))
    return { patientPopulationM: 1.5, marketPenetration: 8, pricePerPatient: 32_000 };
  if (/crohn|inflammatory bowel/.test(s))
    return { patientPopulationM: 1.5, marketPenetration: 10, pricePerPatient: 42_000 };
  if (/ulcerative colitis/.test(s))
    return { patientPopulationM: 1.0, marketPenetration: 10, pricePerPatient: 42_000 };
  if (/asthma/.test(s))
    return { patientPopulationM: 25, marketPenetration: 4, pricePerPatient: 15_000 };
  if (/lupus|sle/.test(s))
    return { patientPopulationM: 0.35, marketPenetration: 14, pricePerPatient: 35_000 };
  if (/myasthenia gravis|generalized myasthenia/.test(s))
    return { patientPopulationM: 0.065, marketPenetration: 25, pricePerPatient: 90_000 };
  if (/immune thrombocytopenia|itp/.test(s))
    return { patientPopulationM: 0.08, marketPenetration: 20, pricePerPatient: 60_000 };
  if (/chronic prurigo|prurigo nodularis/.test(s))
    return { patientPopulationM: 0.1, marketPenetration: 25, pricePerPatient: 30_000 };
  if (/chronic spontaneous urticaria|csu/.test(s))
    return { patientPopulationM: 0.3, marketPenetration: 20, pricePerPatient: 25_000 };
  if (/eosinophilic esophagitis/.test(s))
    return { patientPopulationM: 0.15, marketPenetration: 22, pricePerPatient: 35_000 };
  if (/thyroid eye disease|graves' ophthalmopathy/.test(s))
    return { patientPopulationM: 0.05, marketPenetration: 40, pricePerPatient: 100_000 };

  // ── Rare Disease / Orphan ──────────────────────────────────────────────────
  if (/cystic fibrosis/.test(s))
    return { patientPopulationM: 0.035, marketPenetration: 75, pricePerPatient: 280_000 };
  if (/hemophilia a/.test(s))
    return { patientPopulationM: 0.02, marketPenetration: 35, pricePerPatient: 500_000 };
  if (/hemophilia b/.test(s))
    return { patientPopulationM: 0.006, marketPenetration: 35, pricePerPatient: 500_000 };
  if (/sickle cell/.test(s))
    return { patientPopulationM: 0.1, marketPenetration: 20, pricePerPatient: 2_000_000 };
  if (/beta.thalassemia/.test(s))
    return { patientPopulationM: 0.015, marketPenetration: 30, pricePerPatient: 2_000_000 };
  if (/duchenne|dmd/.test(s))
    return { patientPopulationM: 0.015, marketPenetration: 50, pricePerPatient: 300_000 };
  if (/attr|transthyretin amyloid/.test(s))
    return { patientPopulationM: 0.055, marketPenetration: 28, pricePerPatient: 250_000 };
  if (/hereditary angioedema|hae/.test(s))
    return { patientPopulationM: 0.012, marketPenetration: 35, pricePerPatient: 400_000 };
  if (/gaucher/.test(s))
    return { patientPopulationM: 0.006, marketPenetration: 55, pricePerPatient: 300_000 };
  if (/pompe/.test(s))
    return { patientPopulationM: 0.005, marketPenetration: 55, pricePerPatient: 400_000 };
  if (/achondroplasia/.test(s))
    return { patientPopulationM: 0.005, marketPenetration: 60, pricePerPatient: 250_000 };
  if (/pulmonary arterial hypertension|pah/.test(s))
    return { patientPopulationM: 0.05, marketPenetration: 22, pricePerPatient: 100_000 };
  if (/primary biliary|pbc/.test(s))
    return { patientPopulationM: 0.03, marketPenetration: 35, pricePerPatient: 80_000 };
  if (/alagille|alpha.1 antitrypsin/.test(s))
    return { patientPopulationM: 0.01, marketPenetration: 50, pricePerPatient: 200_000 };
  if (/hyperoxaluria/.test(s))
    return { patientPopulationM: 0.003, marketPenetration: 60, pricePerPatient: 500_000 };
  if (/complement/.test(s))
    return { patientPopulationM: 0.02, marketPenetration: 35, pricePerPatient: 300_000 };

  // ── Infectious Disease ─────────────────────────────────────────────────────
  if (/hiv/.test(s))
    return { patientPopulationM: 1.2, marketPenetration: 10, pricePerPatient: 30_000 };
  if (/hepatitis b|hbv/.test(s))
    return { patientPopulationM: 2.0, marketPenetration: 8, pricePerPatient: 18_000 };
  if (/hepatitis c|hcv/.test(s))
    return { patientPopulationM: 2.4, marketPenetration: 8, pricePerPatient: 15_000 };
  if (/respiratory syncytial|rsv/.test(s))
    return { patientPopulationM: 5.0, marketPenetration: 18, pricePerPatient: 5_000 };
  if (/influenza/.test(s))
    return { patientPopulationM: 40, marketPenetration: 15, pricePerPatient: 50 };

  // ── Ophthalmology ──────────────────────────────────────────────────────────
  if (/wet amd|neovascular amd|age.related macular/.test(s))
    return { patientPopulationM: 1.5, marketPenetration: 20, pricePerPatient: 20_000 };
  if (/diabetic macular edema|dme/.test(s))
    return { patientPopulationM: 0.75, marketPenetration: 18, pricePerPatient: 18_000 };
  if (/dry eye/.test(s))
    return { patientPopulationM: 16, marketPenetration: 3, pricePerPatient: 5_000 };

  // ── Diagnostics / Genomics ─────────────────────────────────────────────────
  if (/colorectal screening|cancer screening|multi.cancer|liquid biopsy/.test(s))
    return { patientPopulationM: 50, marketPenetration: 5, pricePerPatient: 500 };

  // ── Fallback by broad indication type ─────────────────────────────────────
  switch (indicationType) {
    case 'Oncology':               return { patientPopulationM: 0.09, marketPenetration: 14, pricePerPatient: 110_000 };
    case 'CNS / Neurology':        return { patientPopulationM: 1.2,  marketPenetration: 7,  pricePerPatient: 25_000 };
    case 'Cardiovascular':         return { patientPopulationM: 5.0,  marketPenetration: 6,  pricePerPatient: 8_000 };
    case 'Infectious Disease':     return { patientPopulationM: 1.0,  marketPenetration: 10, pricePerPatient: 15_000 };
    case 'Rare Disease / Orphan':  return { patientPopulationM: 0.03, marketPenetration: 55, pricePerPatient: 250_000 };
    case 'Metabolic / Obesity':    return { patientPopulationM: 10,   marketPenetration: 7,  pricePerPatient: 12_000 };
    case 'Immunology':             return { patientPopulationM: 2.0,  marketPenetration: 8,  pricePerPatient: 30_000 };
    case 'Gene Therapy / Editing': return { patientPopulationM: 0.02, marketPenetration: 50, pricePerPatient: 1_000_000 };
    default:                       return { patientPopulationM: 0.5,  marketPenetration: 10, pricePerPatient: 30_000 };
  }
}

// ── Company-level net cash lookup ($B, approximate 2025) ─────────────────────
// Cash minus financial debt. Positive = net cash; negative = net debt.
export const NET_CASH_LOOKUP: Record<string, number> = {
  LLY:  -3.5,   AMGN: -24.0,  GILD: -14.0,  BIIB:  -4.5,
  NVO:   6.0,   REGN:  13.5,  VRTX:  13.0,  MRNA:   8.5,
  BNTX:  14.0,  ILMN:  -1.5,  ALNY:   3.0,  BMRN:   1.5,
  INCY:   2.5,  NBIX:   3.0,  SRPT:   1.2,  EXAS:   0.6,
  SGEN:   2.0,  HZNP:  -6.0,  UTHR:   3.5,  ARGX:   4.0,
  IONS:   1.0,  EXEL:   0.9,  TWST:  -0.3,  NTLA:   0.4,
  CRSP:   2.0,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

export function guessIndicationType(indication: string): string {
  const s = indication.toLowerCase();
  if (/cancer|tumor|carcin|leukemia|lymphoma|oncol|myeloma|melanoma|glioma|sarcoma|carcinoma/.test(s)) return 'Oncology';
  if (/alzheimer|parkinson|depress|schizoph|neurolog|multiple sclerosis|seizure|dementia|als|epilepsy|migraine|cns/.test(s)) return 'CNS / Neurology';
  if (/heart failure|cardiac|cardiovasc|atheroscler|cholesterol|arrhythmia|coronary|afib/.test(s)) return 'Cardiovascular';
  if (/hiv|hepatitis|infect|virus|bacteria|antimicr|fungal|rsv/.test(s)) return 'Infectious Disease';
  if (/rare|orphan|genetic|muscular dystrophy|cystic fibrosis|hemophilia|gaucher|pompe|fabry|sickle|attr|hae|complement/.test(s)) return 'Rare Disease / Orphan';
  if (/diabet|obesity|weight|metabol|glp|insulin|nafld|nash/.test(s)) return 'Metabolic / Obesity';
  if (/asthma|dermatitis|lupus|rheumat|crohn|colitis|autoimmune|immunolog|eczema|psoriasis|myasthenia|urticaria/.test(s)) return 'Immunology';
  if (/gene|crispr|rnai|antisense|mrna|aav|lentiviral/.test(s)) return 'Gene Therapy / Editing';
  return 'Other';
}

export function estimateLaunchYear(phase: string): number {
  const base = new Date().getFullYear();
  switch (phase) {
    case 'Discovery': return base + 10;
    case 'Phase I':   return base + 7;
    case 'Phase II':  return base + 5;
    case 'Phase III': return base + 3;
    case 'BLA/NDA':   return base + 1;
    case 'Approved':  return base;
    default: return base + 5;
  }
}

export function calcCumulativePOS(phase: string, pos: POSTransitions): number {
  switch (phase) {
    case 'Discovery': return pos.discToP1 * pos.p1ToP2 * pos.p2ToP3 * pos.p3ToNDA * pos.ndaToAP;
    case 'Phase I':   return pos.p1ToP2 * pos.p2ToP3 * pos.p3ToNDA * pos.ndaToAP;
    case 'Phase II':  return pos.p2ToP3 * pos.p3ToNDA * pos.ndaToAP;
    case 'Phase III': return pos.p3ToNDA * pos.ndaToAP;
    case 'BLA/NDA':   return pos.ndaToAP;
    case 'Approved':  return 1.0;
    default: return pos.p1ToP2 * pos.p2ToP3 * pos.p3ToNDA * pos.ndaToAP;
  }
}

export function calcPeakSales(drug: DrugModel): number {
  if (drug.useOverride) return drug.peakSalesOverrideM;
  return drug.patientPopulationM * 1e6 * (drug.marketPenetration / 100) * drug.pricePerPatient / 1e6;
}

function getRampFactor(yearPostLaunch: number, rampYears: number): number {
  if (yearPostLaunch <= 0) return 0;
  if (yearPostLaunch >= rampYears) return 1.0;
  const t = yearPostLaunch / rampYears;
  return t * t * (3 - 2 * t);
}

export function calcDrugDCF(drug: DrugModel, global: GlobalParams): DrugDCFResult {
  const peakSalesM = calcPeakSales(drug);
  const cumulativePOS = calcCumulativePOS(drug.phase, drug.pos);
  const patentExpiryYear = drug.launchYear + drug.patentLife;
  const margin = drug.isPartnered ? drug.royaltyRate / 100 : drug.operatingMargin / 100;
  const taxFactor = 1 - global.taxRate / 100;
  const wacc = global.wacc / 100;
  const currentYear = new Date().getFullYear();

  let grossNPVM = 0;
  const yearlyRevenue: DrugDCFResult['yearlyRevenue'] = [];

  for (let year = drug.launchYear; year <= patentExpiryYear; year++) {
    const yearPostLaunch = year - drug.launchYear + 1;
    const ramp = getRampFactor(yearPostLaunch, drug.rampYears);
    const revenueM = peakSalesM * ramp;
    const cashFlowM = revenueM * margin * taxFactor;
    const yearsOut = Math.max(0, year - currentYear);
    const pvM = cashFlowM / Math.pow(1 + wacc, yearsOut);

    grossNPVM += pvM;
    yearlyRevenue.push({ year, revenue: revenueM, riskAdj: revenueM * cumulativePOS });
  }

  return {
    drugId: drug.id,
    drugName: drug.drugName,
    peakSalesM,
    cumulativePOS,
    grossNPVM,
    rNPVM: grossNPVM * cumulativePOS,
    yearlyRevenue,
  };
}

// Build a DrugModel, auto-populating TAM from indication text.
// isLive=true: drug came from CT.gov (no analyst estimate).
//   - Phase III+ live drugs: included by default
//   - Phase I/II live drugs: excluded by default
// companyMarginHint: corporate net margin (0-1) to calibrate drug-level operating margin.
export function buildDrugModel(
  drug: {
    id: string; drugName: string; genericName: string; phase: string;
    indication: string; partnered: boolean; estimatedPeakSales?: number;
  },
  isLive = false,
  companyMarginHint = 0.25,
): DrugModel {
  const indicationType = guessIndicationType(drug.indication);
  const pos = { ...POS_DEFAULTS[indicationType] ?? POS_DEFAULTS['Other'] };
  const hasEstimate = !isLive && drug.estimatedPeakSales != null && drug.estimatedPeakSales > 0;
  const peakSalesOverrideM = hasEstimate ? drug.estimatedPeakSales! / 1e6 : 0;

  // Get indication-specific TAM profile
  const tam = getIndicationTAM(drug.indication, indicationType);

  // Patient population:
  // - Has analyst estimate → back-calculate from known peak sales using TAM price/pen
  // - No estimate → use indication TAM directly
  const patientPopulationM = hasEstimate
    ? Math.max(0.001, (peakSalesOverrideM * 1e6) / (tam.marketPenetration / 100) / tam.pricePerPatient / 1e6)
    : tam.patientPopulationM;

  // Operating margin: drug-level margins are higher than corporate (no R&D overhead)
  // Use company margin as a floor, scale up for mature drugs
  const baseMargin = Math.max(0.25, Math.min(0.55, companyMarginHint + 0.10));
  const phaseMarginScale: Record<string, number> = {
    'Approved': 1.0, 'BLA/NDA': 0.95, 'Phase III': 0.90, 'Phase II': 0.85,
    'Phase I': 0.80, 'Discovery': 0.75,
  };
  const operatingMargin = Math.round(baseMargin * (phaseMarginScale[drug.phase] ?? 0.85) * 100);

  // Include logic:
  // - Curated drugs: always include
  // - Live CT.gov Phase III/BLA/Approved: include (high enough POS to be material)
  // - Live CT.gov Phase II or earlier: exclude (user opts in)
  const lateStagePhases = new Set(['Approved', 'BLA/NDA', 'Phase III']);
  const included = !isLive || lateStagePhases.has(drug.phase);

  return {
    id: drug.id,
    drugName: drug.drugName,
    genericName: drug.genericName,
    phase: drug.phase,
    indication: drug.indication,
    indicationType,
    pos,
    patientPopulationM: parseFloat(patientPopulationM.toFixed(4)),
    marketPenetration: tam.marketPenetration,
    pricePerPatient: tam.pricePerPatient,
    useOverride: hasEstimate,
    peakSalesOverrideM,
    launchYear: estimateLaunchYear(drug.phase),
    patentLife: drug.phase === 'Approved' ? 8 : 12,
    rampYears: 5,
    operatingMargin,
    isPartnered: drug.partnered,
    royaltyRate: 15,
    expanded: false,
    included,
  };
}
