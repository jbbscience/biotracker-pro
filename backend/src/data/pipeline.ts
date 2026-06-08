export interface PipelineDrug {
  id: string;
  companyTicker: string;
  drugName: string;
  genericName: string;
  indication: string;
  phase: 'Discovery' | 'Phase I' | 'Phase II' | 'Phase III' | 'BLA/NDA' | 'Approved';
  mechanism: string;
  expectedDataDate?: string;
  partnered: boolean;
  partner?: string;
  estimatedPeakSales?: number;
}

export const PIPELINE: PipelineDrug[] = [
  // LLY
  { id: 'lly-01', companyTicker: 'LLY', drugName: 'Mounjaro', genericName: 'tirzepatide', indication: 'Type 2 Diabetes', phase: 'Approved', mechanism: 'GIP/GLP-1 Agonist', partnered: false, estimatedPeakSales: 25_000_000_000 },
  { id: 'lly-02', companyTicker: 'LLY', drugName: 'Zepbound', genericName: 'tirzepatide', indication: 'Obesity', phase: 'Approved', mechanism: 'GIP/GLP-1 Agonist', partnered: false, estimatedPeakSales: 20_000_000_000 },
  { id: 'lly-03', companyTicker: 'LLY', drugName: 'LY3437943', genericName: 'retatrutide', indication: 'Obesity / MASH', phase: 'Phase III', mechanism: 'GIP/GLP-1/Glucagon Agonist', expectedDataDate: '2026-09', partnered: false, estimatedPeakSales: 15_000_000_000 },
  { id: 'lly-04', companyTicker: 'LLY', drugName: 'Kisunla', genericName: 'donanemab', indication: 'Early Alzheimer\'s', phase: 'Approved', mechanism: 'Anti-amyloid mAb', partnered: false, estimatedPeakSales: 8_000_000_000 },
  { id: 'lly-05', companyTicker: 'LLY', drugName: 'LY3819253', genericName: 'orforglipron', indication: 'Type 2 Diabetes (oral)', phase: 'Phase III', mechanism: 'Non-peptide GLP-1 RA', expectedDataDate: '2026-12', partnered: false, estimatedPeakSales: 10_000_000_000 },
  { id: 'lly-06', companyTicker: 'LLY', drugName: 'LY3473329', genericName: 'mazigesimab', indication: 'SLE/Lupus', phase: 'Phase II', mechanism: 'Anti-TNFSF13B', expectedDataDate: '2027-03', partnered: false },

  // NVO
  { id: 'nvo-01', companyTicker: 'NVO', drugName: 'Ozempic', genericName: 'semaglutide', indication: 'Type 2 Diabetes', phase: 'Approved', mechanism: 'GLP-1 Agonist', partnered: false, estimatedPeakSales: 18_000_000_000 },
  { id: 'nvo-02', companyTicker: 'NVO', drugName: 'Wegovy', genericName: 'semaglutide', indication: 'Obesity', phase: 'Approved', mechanism: 'GLP-1 Agonist', partnered: false, estimatedPeakSales: 22_000_000_000 },
  { id: 'nvo-03', companyTicker: 'NVO', drugName: 'CagriSema', genericName: 'cagrilintide+semaglutide', indication: 'Obesity / T2D', phase: 'Phase III', mechanism: 'Amylin/GLP-1 Combo', expectedDataDate: '2026-06', partnered: false, estimatedPeakSales: 12_000_000_000 },
  { id: 'nvo-04', companyTicker: 'NVO', drugName: 'NNC0129-0000', genericName: 'insulin icodec', indication: 'Type 1 & 2 Diabetes', phase: 'Approved', mechanism: 'Once-weekly basal insulin', partnered: false },
  { id: 'nvo-05', companyTicker: 'NVO', drugName: 'NN9541', genericName: 'amycretin', indication: 'Obesity', phase: 'Phase II', mechanism: 'GLP-1/Amylin', expectedDataDate: '2027-01', partnered: false, estimatedPeakSales: 8_000_000_000 },

  // AMGN
  { id: 'amgn-01', companyTicker: 'AMGN', drugName: 'Repatha', genericName: 'evolocumab', indication: 'Cardiovascular Disease', phase: 'Approved', mechanism: 'PCSK9 Inhibitor', partnered: false, estimatedPeakSales: 4_000_000_000 },
  { id: 'amgn-02', companyTicker: 'AMGN', drugName: 'MariTide', genericName: 'AMG 133', indication: 'Obesity', phase: 'Phase III', mechanism: 'GIP/GLP-1 Bispecific', expectedDataDate: '2027-06', partnered: false, estimatedPeakSales: 10_000_000_000 },
  { id: 'amgn-03', companyTicker: 'AMGN', drugName: 'Lumakras', genericName: 'sotorasib', indication: 'KRAS G12C NSCLC', phase: 'Approved', mechanism: 'KRAS G12C Inhibitor', partnered: false },
  { id: 'amgn-04', companyTicker: 'AMGN', drugName: 'AMG 340', genericName: 'olomorasib', indication: 'KRAS G12C solid tumors', phase: 'Phase III', mechanism: 'Next-gen KRAS G12C', expectedDataDate: '2026-10', partnered: false },
  { id: 'amgn-05', companyTicker: 'AMGN', drugName: 'Tezspire', genericName: 'tezepelumab', indication: 'Severe Asthma', phase: 'Approved', mechanism: 'Anti-TSLP mAb', partnered: true, partner: 'AstraZeneca' },

  // GILD
  { id: 'gild-01', companyTicker: 'GILD', drugName: 'Biktarvy', genericName: 'bictegravir/FTC/TAF', indication: 'HIV-1', phase: 'Approved', mechanism: 'INSTI + NRTI', partnered: false, estimatedPeakSales: 12_000_000_000 },
  { id: 'gild-02', companyTicker: 'GILD', drugName: 'Yescarta', genericName: 'axicabtagene ciloleucel', indication: 'Large B-cell Lymphoma', phase: 'Approved', mechanism: 'CAR-T Cell Therapy', partnered: false },
  { id: 'gild-03', companyTicker: 'GILD', drugName: 'Tecartus', genericName: 'brexucabtagene autoleucel', indication: 'MCL / ALL', phase: 'Approved', mechanism: 'CAR-T Cell Therapy', partnered: false },
  { id: 'gild-04', companyTicker: 'GILD', drugName: 'GS-1811', genericName: 'zilurgisertib', indication: 'Myelofibrosis', phase: 'Phase II', mechanism: 'ALK2 Inhibitor', expectedDataDate: '2026-08', partnered: false },
  { id: 'gild-05', companyTicker: 'GILD', drugName: 'GS-4182', genericName: 'obeldesivir', indication: 'COVID-19 / RSV', phase: 'Phase III', mechanism: 'ProTide Antiviral', expectedDataDate: '2026-07', partnered: false },

  // REGN
  { id: 'regn-01', companyTicker: 'REGN', drugName: 'Dupixent', genericName: 'dupilumab', indication: 'Atopic Dermatitis / Asthma / COPD', phase: 'Approved', mechanism: 'IL-4/IL-13 Inhibitor', partnered: true, partner: 'Sanofi', estimatedPeakSales: 25_000_000_000 },
  { id: 'regn-02', companyTicker: 'REGN', drugName: 'EYLEA HD', genericName: 'aflibercept 8mg', indication: 'Wet AMD / DME', phase: 'Approved', mechanism: 'VEGF Trap', partnered: false },
  { id: 'regn-03', companyTicker: 'REGN', drugName: 'Kevzara', genericName: 'sarilumab', indication: 'Rheumatoid Arthritis', phase: 'Approved', mechanism: 'IL-6R Inhibitor', partnered: true, partner: 'Sanofi' },
  { id: 'regn-04', companyTicker: 'REGN', drugName: 'Libtayo', genericName: 'cemiplimab', indication: 'CSCC / BCC / NSCLC', phase: 'Approved', mechanism: 'Anti-PD-1', partnered: true, partner: 'Sanofi' },
  { id: 'regn-05', companyTicker: 'REGN', drugName: 'REGN5458', genericName: 'linvoseltamab', indication: 'Multiple Myeloma', phase: 'BLA/NDA', mechanism: 'BCMA × CD3 Bispecific', expectedDataDate: '2026-05', partnered: false, estimatedPeakSales: 2_000_000_000 },

  // VRTX
  { id: 'vrtx-01', companyTicker: 'VRTX', drugName: 'Trikafta', genericName: 'elexacaftor/tezacaftor/ivacaftor', indication: 'Cystic Fibrosis', phase: 'Approved', mechanism: 'CFTR Modulator Triple', partnered: false, estimatedPeakSales: 10_000_000_000 },
  { id: 'vrtx-02', companyTicker: 'VRTX', drugName: 'VX-548', genericName: 'suzetrigine', indication: 'Acute Pain (non-opioid)', phase: 'Approved', mechanism: 'NaV1.8 Inhibitor', partnered: false, estimatedPeakSales: 5_000_000_000 },
  { id: 'vrtx-03', companyTicker: 'VRTX', drugName: 'VX-880', genericName: 'zimislecel', indication: 'Type 1 Diabetes', phase: 'Phase III', mechanism: 'Stem cell-derived islets', expectedDataDate: '2027-03', partnered: false, estimatedPeakSales: 8_000_000_000 },
  { id: 'vrtx-04', companyTicker: 'VRTX', drugName: 'VX-993', genericName: 'inaxaplin', indication: 'APOL1 Kidney Disease', phase: 'Phase III', mechanism: 'APOL1 Inhibitor', expectedDataDate: '2026-11', partnered: false },

  // MRNA
  { id: 'mrna-01', companyTicker: 'MRNA', drugName: 'Spikevax', genericName: 'mRNA-1273', indication: 'COVID-19', phase: 'Approved', mechanism: 'mRNA Vaccine', partnered: false },
  { id: 'mrna-02', companyTicker: 'MRNA', drugName: 'mRNA-1345', genericName: 'mresvia', indication: 'RSV', phase: 'Approved', mechanism: 'mRNA Vaccine', partnered: false, estimatedPeakSales: 3_000_000_000 },
  { id: 'mrna-03', companyTicker: 'MRNA', drugName: 'mRNA-4157', genericName: 'V940', indication: 'Melanoma (adjuvant)', phase: 'Phase III', mechanism: 'Personalized mRNA Cancer Vaccine', expectedDataDate: '2026-08', partnered: true, partner: 'Merck', estimatedPeakSales: 4_000_000_000 },
  { id: 'mrna-04', companyTicker: 'MRNA', drugName: 'mRNA-1010', genericName: 'mRNA Flu', indication: 'Seasonal Influenza', phase: 'Phase III', mechanism: 'mRNA Vaccine', expectedDataDate: '2026-09', partnered: false },

  // BNTX
  { id: 'bntx-01', companyTicker: 'BNTX', drugName: 'Comirnaty', genericName: 'BNT162b2', indication: 'COVID-19', phase: 'Approved', mechanism: 'mRNA Vaccine', partnered: true, partner: 'Pfizer' },
  { id: 'bntx-02', companyTicker: 'BNTX', drugName: 'BNT111', genericName: 'autogene cevumeran', indication: 'Melanoma', phase: 'Phase III', mechanism: 'mRNA Cancer Vaccine', expectedDataDate: '2027-01', partnered: true, partner: 'Genentech', estimatedPeakSales: 3_000_000_000 },
  { id: 'bntx-03', companyTicker: 'BNTX', drugName: 'BNT323', genericName: 'DB-1311', indication: 'HER2+ Cancers', phase: 'Phase II', mechanism: 'HER2 ADC', expectedDataDate: '2026-10', partnered: false },

  // BIIB
  { id: 'biib-01', companyTicker: 'BIIB', drugName: 'Leqembi', genericName: 'lecanemab', indication: 'Early Alzheimer\'s', phase: 'Approved', mechanism: 'Anti-amyloid mAb', partnered: true, partner: 'Eisai', estimatedPeakSales: 5_000_000_000 },
  { id: 'biib-02', companyTicker: 'BIIB', drugName: 'Skyclarys', genericName: 'omaveloxolone', indication: 'Friedreich Ataxia', phase: 'Approved', mechanism: 'Nrf2 Activator', partnered: false },
  { id: 'biib-03', companyTicker: 'BIIB', drugName: 'BIIB080', genericName: 'gosuranemab', indication: 'PSP / Alzheimer\'s tau', phase: 'Phase II', mechanism: 'Anti-tau mAb', expectedDataDate: '2026-12', partnered: false },
  { id: 'biib-04', companyTicker: 'BIIB', drugName: 'BIIB131', genericName: 'felzartamab', indication: 'IgA Nephropathy', phase: 'Phase III', mechanism: 'Anti-CD38 mAb', expectedDataDate: '2027-02', partnered: false },

  // ALNY
  { id: 'alny-01', companyTicker: 'ALNY', drugName: 'Onpattro', genericName: 'patisiran', indication: 'ATTR Amyloidosis', phase: 'Approved', mechanism: 'RNAi / LNP', partnered: false },
  { id: 'alny-02', companyTicker: 'ALNY', drugName: 'Amvuttra', genericName: 'vutrisiran', indication: 'ATTR Cardiomyopathy', phase: 'Approved', mechanism: 'RNAi / GalNAc', partnered: false, estimatedPeakSales: 4_000_000_000 },
  { id: 'alny-03', companyTicker: 'ALNY', drugName: 'Leqvio', genericName: 'inclisiran', indication: 'Hypercholesterolemia', phase: 'Approved', mechanism: 'RNAi / PCSK9', partnered: true, partner: 'Novartis' },
  { id: 'alny-04', companyTicker: 'ALNY', drugName: 'ALN-ANG', genericName: 'zilebesiran', indication: 'Hypertension', phase: 'Phase III', mechanism: 'RNAi / Angiotensinogen', expectedDataDate: '2026-09', partnered: true, partner: 'Roche', estimatedPeakSales: 5_000_000_000 },
  { id: 'alny-05', companyTicker: 'ALNY', drugName: 'ALN-XDH', genericName: 'nedosiran', indication: 'Hyperoxaluria', phase: 'Approved', mechanism: 'RNAi / GalNAc', partnered: false },

  // NTLA
  { id: 'ntla-01', companyTicker: 'NTLA', drugName: 'NTLA-2001', genericName: 'nexiguran ziclumeran', indication: 'ATTR Amyloidosis', phase: 'Phase III', mechanism: 'In vivo CRISPR / TTR knockout', expectedDataDate: '2026-06', partnered: true, partner: 'Novartis', estimatedPeakSales: 3_000_000_000 },
  { id: 'ntla-02', companyTicker: 'NTLA', drugName: 'NTLA-2002', genericName: 'CRISPR-KLKB1', indication: 'Hereditary Angioedema', phase: 'Phase II', mechanism: 'In vivo CRISPR / KLKB1', expectedDataDate: '2026-09', partnered: false },
  { id: 'ntla-03', companyTicker: 'NTLA', drugName: 'NTLA-3001', genericName: 'CRISPR-SERPINA1', indication: 'Alpha-1 Antitrypsin Deficiency', phase: 'Phase I', mechanism: 'In vivo CRISPR correction', expectedDataDate: '2027-06', partnered: false },

  // CRSP
  { id: 'crsp-01', companyTicker: 'CRSP', drugName: 'Casgevy', genericName: 'exagamglogene autotemcel', indication: 'Sickle Cell / Beta-Thalassemia', phase: 'Approved', mechanism: 'Ex vivo CRISPR / BCL11A', partnered: true, partner: 'Vertex', estimatedPeakSales: 2_000_000_000 },
  { id: 'crsp-02', companyTicker: 'CRSP', drugName: 'CTX112', genericName: 'CTX112', indication: 'B-cell Malignancies', phase: 'Phase II', mechanism: 'Allogeneic CAR-T / CRISPR', expectedDataDate: '2026-07', partnered: false },
  { id: 'crsp-03', companyTicker: 'CRSP', drugName: 'CTX310', genericName: 'CTX310', indication: 'Hypercholesterolemia', phase: 'Phase I', mechanism: 'In vivo CRISPR / ANGPTL3', expectedDataDate: '2027-01', partnered: false },

  // ARGX
  { id: 'argx-01', companyTicker: 'ARGX', drugName: 'Vyvgart', genericName: 'efgartigimod alfa', indication: 'MG / ITP / CIDP', phase: 'Approved', mechanism: 'FcRn Antagonist', partnered: false, estimatedPeakSales: 5_000_000_000 },
  { id: 'argx-02', companyTicker: 'ARGX', drugName: 'ARGX-113 SC', genericName: 'efgartigimod SC', indication: 'Pemphigus / MG', phase: 'Approved', mechanism: 'FcRn Antagonist SC', partnered: false },
  { id: 'argx-03', companyTicker: 'ARGX', drugName: 'ARGX-117', genericName: 'empasiprubart', indication: 'Multifocal Motor Neuropathy', phase: 'Phase III', mechanism: 'C2 Complement Inhibitor', expectedDataDate: '2026-08', partnered: false },

  // UTHR
  { id: 'uthr-01', companyTicker: 'UTHR', drugName: 'Tyvaso DPI', genericName: 'treprostinil', indication: 'Pulmonary Hypertension', phase: 'Approved', mechanism: 'Prostacyclin Analog', partnered: false, estimatedPeakSales: 2_000_000_000 },
  { id: 'uthr-02', companyTicker: 'UTHR', drugName: 'Unituxin', genericName: 'dinutuximab', indication: 'Pediatric Neuroblastoma', phase: 'Approved', mechanism: 'Anti-GD2 mAb', partnered: false },
  { id: 'uthr-03', companyTicker: 'UTHR', drugName: 'UKidney', genericName: 'UKidney (xenograft)', indication: 'End-Stage Renal Disease', phase: 'Phase I', mechanism: 'Gene-edited porcine kidneys', expectedDataDate: '2027-06', partnered: false, estimatedPeakSales: 10_000_000_000 },
];
