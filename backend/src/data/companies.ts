export interface CompanyData {
  id: string;
  name: string;
  ticker: string;
  focusArea: string;
  focusTags: string[];
  basePrice: number;
  marketCap: number;
  volume: number;
  avgVolume: number;
  week52High: number;
  week52Low: number;
  pe: number | null;
  ps: number;
  evEbitda: number | null;
  debtToEquity: number;
  cashRunway: number;
  rdPercent: number;
  analystRating: 'Buy' | 'Hold' | 'Sell';
  priceTarget: number;
  institutionalOwnership: number;
  revenue: number;
  revenueGrowth: number;
  netIncome: number | null;
  employees: number;
  founded: number;
  hq: string;
  description: string;
}

export const COMPANIES: CompanyData[] = [
  {
    id: 'lly', name: 'Eli Lilly and Company', ticker: 'LLY',
    focusArea: 'Diabetes, Oncology, Immunology', focusTags: ['Diabetes', 'Oncology', 'Immunology'],
    basePrice: 848.50, marketCap: 805_000_000_000, volume: 2_840_000, avgVolume: 2_650_000,
    week52High: 972.45, week52Low: 672.80, pe: 52.4, ps: 18.2, evEbitda: 38.1,
    debtToEquity: 0.82, cashRunway: 14, rdPercent: 22.4, analystRating: 'Buy', priceTarget: 980.00,
    institutionalOwnership: 83.2, revenue: 44_230_000_000, revenueGrowth: 31.4, netIncome: 15_340_000_000,
    employees: 43000, founded: 1876, hq: 'Indianapolis, IN',
    description: 'Global pharmaceutical company with breakthrough GLP-1 therapies for diabetes and obesity, plus strong oncology and immunology pipelines.'
  },
  {
    id: 'nvo', name: 'Novo Nordisk', ticker: 'NVO',
    focusArea: 'Diabetes, Obesity, Rare Diseases', focusTags: ['Diabetes', 'Obesity', 'Rare Diseases'],
    basePrice: 91.20, marketCap: 410_000_000_000, volume: 5_120_000, avgVolume: 4_800_000,
    week52High: 138.65, week52Low: 78.40, pe: 28.6, ps: 11.8, evEbitda: 22.4,
    debtToEquity: 0.45, cashRunway: 20, rdPercent: 18.6, analystRating: 'Buy', priceTarget: 115.00,
    institutionalOwnership: 62.1, revenue: 35_790_000_000, revenueGrowth: 22.3, netIncome: 12_460_000_000,
    employees: 64000, founded: 1923, hq: 'Bagsværd, Denmark',
    description: 'World leader in diabetes care and obesity treatment, with Ozempic and Wegovy driving unprecedented demand globally.'
  },
  {
    id: 'amgn', name: 'Amgen Inc.', ticker: 'AMGN',
    focusArea: 'Oncology, Cardiovascular, Bone Health', focusTags: ['Oncology', 'Cardiovascular', 'Bone Health'],
    basePrice: 308.70, marketCap: 165_000_000_000, volume: 2_980_000, avgVolume: 2_750_000,
    week52High: 342.90, week52Low: 258.30, pe: 18.2, ps: 4.8, evEbitda: 12.6,
    debtToEquity: 3.24, cashRunway: 8, rdPercent: 19.8, analystRating: 'Hold', priceTarget: 325.00,
    institutionalOwnership: 77.4, revenue: 33_980_000_000, revenueGrowth: 3.8, netIncome: 9_020_000_000,
    employees: 25000, founded: 1980, hq: 'Thousand Oaks, CA',
    description: 'Pioneer in biotechnology developing innovative medicines across oncology, cardiovascular, and inflammatory diseases.'
  },
  {
    id: 'gild', name: 'Gilead Sciences', ticker: 'GILD',
    focusArea: 'HIV, Hepatitis, Oncology', focusTags: ['HIV', 'Hepatitis', 'Oncology'],
    basePrice: 93.80, marketCap: 118_000_000_000, volume: 5_430_000, avgVolume: 5_100_000,
    week52High: 102.40, week52Low: 72.50, pe: 22.1, ps: 4.4, evEbitda: 13.2,
    debtToEquity: 1.12, cashRunway: 10, rdPercent: 31.2, analystRating: 'Buy', priceTarget: 108.00,
    institutionalOwnership: 74.8, revenue: 26_940_000_000, revenueGrowth: 4.2, netIncome: 5_660_000_000,
    employees: 18000, founded: 1987, hq: 'Foster City, CA',
    description: 'Leader in antiviral therapies for HIV and hepatitis, expanding into oncology with cell therapies and targeted treatments.'
  },
  {
    id: 'regn', name: 'Regeneron Pharmaceuticals', ticker: 'REGN',
    focusArea: 'Ophthalmology, Immunology', focusTags: ['Ophthalmology', 'Immunology', 'Oncology'],
    basePrice: 838.20, marketCap: 89_000_000_000, volume: 820_000, avgVolume: 780_000,
    week52High: 1012.30, week52Low: 748.60, pe: 24.8, ps: 8.2, evEbitda: 16.4,
    debtToEquity: 0.18, cashRunway: 18, rdPercent: 28.4, analystRating: 'Buy', priceTarget: 1050.00,
    institutionalOwnership: 68.3, revenue: 13_880_000_000, revenueGrowth: 8.6, netIncome: 3_580_000_000,
    employees: 12000, founded: 1988, hq: 'Tarrytown, NY',
    description: 'Biotech known for EYLEA in ophthalmology and Dupixent in immunology, with a deep antibody-based pipeline.'
  },
  {
    id: 'vrtx', name: 'Vertex Pharmaceuticals', ticker: 'VRTX',
    focusArea: 'Cystic Fibrosis, Rare Diseases', focusTags: ['Cystic Fibrosis', 'Rare Diseases', 'Pain'],
    basePrice: 492.60, marketCap: 126_000_000_000, volume: 1_240_000, avgVolume: 1_150_000,
    week52High: 534.80, week52Low: 416.20, pe: 31.4, ps: 16.8, evEbitda: 24.2,
    debtToEquity: 0.02, cashRunway: 22, rdPercent: 24.6, analystRating: 'Buy', priceTarget: 560.00,
    institutionalOwnership: 89.6, revenue: 9_860_000_000, revenueGrowth: 12.8, netIncome: 3_640_000_000,
    employees: 5000, founded: 1989, hq: 'Boston, MA',
    description: 'Dominant player in cystic fibrosis with Trikafta, plus emerging non-opioid pain and gene editing programs.'
  },
  {
    id: 'mrna', name: 'Moderna Inc.', ticker: 'MRNA',
    focusArea: 'mRNA Vaccines, Oncology', focusTags: ['mRNA', 'Vaccines', 'Oncology'],
    basePrice: 44.30, marketCap: 17_800_000_000, volume: 12_340_000, avgVolume: 11_200_000,
    week52High: 98.40, week52Low: 36.20, pe: null, ps: 7.8, evEbitda: null,
    debtToEquity: 0.08, cashRunway: 6, rdPercent: 98.2, analystRating: 'Hold', priceTarget: 72.00,
    institutionalOwnership: 58.4, revenue: 4_490_000_000, revenueGrowth: -44.2, netIncome: -3_640_000_000,
    employees: 5400, founded: 2010, hq: 'Cambridge, MA',
    description: 'Pioneer in mRNA technology, rebuilding post-COVID with a diversified vaccine and oncology pipeline including personalized cancer vaccines.'
  },
  {
    id: 'bntx', name: 'BioNTech SE', ticker: 'BNTX',
    focusArea: 'mRNA Vaccines, Immunotherapy', focusTags: ['mRNA', 'Vaccines', 'Immunotherapy'],
    basePrice: 87.40, marketCap: 21_200_000_000, volume: 2_450_000, avgVolume: 2_280_000,
    week52High: 124.80, week52Low: 72.30, pe: 42.3, ps: 4.2, evEbitda: 18.6,
    debtToEquity: 0.04, cashRunway: 24, rdPercent: 64.8, analystRating: 'Buy', priceTarget: 120.00,
    institutionalOwnership: 44.2, revenue: 5_810_000_000, revenueGrowth: -38.6, netIncome: 984_000_000,
    employees: 5800, founded: 2008, hq: 'Mainz, Germany',
    description: 'German biotech leveraging mRNA platform beyond COVID vaccines with cancer immunotherapy and infectious disease programs.'
  },
  {
    id: 'biib', name: 'Biogen Inc.', ticker: 'BIIB',
    focusArea: 'Neurology, Rare Diseases', focusTags: ['Neurology', 'Alzheimers', 'MS', 'ALS'],
    basePrice: 204.80, marketCap: 26_800_000_000, volume: 1_680_000, avgVolume: 1_560_000,
    week52High: 298.60, week52Low: 182.40, pe: 38.6, ps: 3.4, evEbitda: 14.8,
    debtToEquity: 0.62, cashRunway: 12, rdPercent: 34.8, analystRating: 'Hold', priceTarget: 240.00,
    institutionalOwnership: 81.2, revenue: 7_880_000_000, revenueGrowth: -2.4, netIncome: 696_000_000,
    employees: 7500, founded: 1978, hq: 'Cambridge, MA',
    description: 'Neuroscience-focused biotech with approved Alzheimer\'s therapies and multiple sclerosis treatments, rebuilding pipeline growth.'
  },
  {
    id: 'ilmn', name: 'Illumina Inc.', ticker: 'ILMN',
    focusArea: 'Genomics, Diagnostics', focusTags: ['Genomics', 'Sequencing', 'Diagnostics'],
    basePrice: 126.40, marketCap: 19_900_000_000, volume: 2_120_000, avgVolume: 1_980_000,
    week52High: 168.20, week52Low: 100.80, pe: null, ps: 5.8, evEbitda: null,
    debtToEquity: 0.88, cashRunway: 9, rdPercent: 22.4, analystRating: 'Hold', priceTarget: 145.00,
    institutionalOwnership: 85.4, revenue: 4_440_000_000, revenueGrowth: -10.2, netIncome: -1_240_000_000,
    employees: 8400, founded: 1998, hq: 'San Diego, CA',
    description: 'Dominant genomic sequencing platform enabling precision medicine, liquid biopsy, and agricultural genomics globally.'
  },
  {
    id: 'alny', name: 'Alnylam Pharmaceuticals', ticker: 'ALNY',
    focusArea: 'RNAi Therapeutics', focusTags: ['RNAi', 'Rare Diseases', 'Cardiovascular'],
    basePrice: 224.60, marketCap: 29_200_000_000, volume: 980_000, avgVolume: 920_000,
    week52High: 268.40, week52Low: 188.20, pe: null, ps: 14.2, evEbitda: null,
    debtToEquity: 0.94, cashRunway: 8, rdPercent: 68.4, analystRating: 'Buy', priceTarget: 280.00,
    institutionalOwnership: 86.8, revenue: 2_050_000_000, revenueGrowth: 38.4, netIncome: -820_000_000,
    employees: 2800, founded: 2002, hq: 'Cambridge, MA',
    description: 'RNAi pioneer with approved therapies for rare diseases, pursuing liver-directed and beyond-liver programs in cardiometabolic disease.'
  },
  {
    id: 'bmrn', name: 'BioMarin Pharmaceutical', ticker: 'BMRN',
    focusArea: 'Rare Genetic Diseases', focusTags: ['Rare Diseases', 'Enzyme Replacement', 'Gene Therapy'],
    basePrice: 73.80, marketCap: 13_400_000_000, volume: 1_340_000, avgVolume: 1_280_000,
    week52High: 96.40, week52Low: 60.20, pe: 24.6, ps: 5.6, evEbitda: 18.4,
    debtToEquity: 0.28, cashRunway: 14, rdPercent: 28.6, analystRating: 'Buy', priceTarget: 98.00,
    institutionalOwnership: 92.4, revenue: 2_380_000_000, revenueGrowth: 14.8, netIncome: 544_000_000,
    employees: 3700, founded: 1997, hq: 'San Rafael, CA',
    description: 'Specialist in enzyme replacement therapies for rare metabolic disorders, with gene therapy programs advancing for hemophilia A.'
  },
  {
    id: 'incy', name: 'Incyte Corporation', ticker: 'INCY',
    focusArea: 'Oncology, Inflammation', focusTags: ['Oncology', 'Inflammation', 'JAK Inhibitors'],
    basePrice: 61.20, marketCap: 13_200_000_000, volume: 2_340_000, avgVolume: 2_180_000,
    week52High: 74.80, week52Low: 48.60, pe: 42.8, ps: 3.8, evEbitda: 22.6,
    debtToEquity: 0.06, cashRunway: 16, rdPercent: 48.2, analystRating: 'Hold', priceTarget: 72.00,
    institutionalOwnership: 88.6, revenue: 3_460_000_000, revenueGrowth: 4.6, netIncome: 308_000_000,
    employees: 2400, founded: 1991, hq: 'Wilmington, DE',
    description: 'Oncology-focused biotech with market-leading Jakafi for myelofibrosis and expanding portfolio in solid tumors and inflammatory disease.'
  },
  {
    id: 'nbix', name: 'Neurocrine Biosciences', ticker: 'NBIX',
    focusArea: 'Neurology, Endocrine', focusTags: ['Neurology', 'Endocrine', 'VMAT2'],
    basePrice: 146.40, marketCap: 14_800_000_000, volume: 1_120_000, avgVolume: 1_060_000,
    week52High: 178.60, week52Low: 118.40, pe: 28.4, ps: 6.4, evEbitda: 19.8,
    debtToEquity: 0.12, cashRunway: 18, rdPercent: 36.4, analystRating: 'Buy', priceTarget: 185.00,
    institutionalOwnership: 90.2, revenue: 2_310_000_000, revenueGrowth: 18.6, netIncome: 520_000_000,
    employees: 2100, founded: 1992, hq: 'San Diego, CA',
    description: 'CNS specialist with Ingrezza leading VMAT2 inhibitor market for tardive dyskinesia, expanding into endocrine and psychiatric disorders.'
  },
  {
    id: 'srpt', name: 'Sarepta Therapeutics', ticker: 'SRPT',
    focusArea: 'Genetic Medicine', focusTags: ['Duchenne MD', 'Gene Therapy', 'RNA Splice'],
    basePrice: 116.80, marketCap: 9_200_000_000, volume: 1_580_000, avgVolume: 1_480_000,
    week52High: 168.40, week52Low: 86.20, pe: null, ps: 8.4, evEbitda: null,
    debtToEquity: 0.92, cashRunway: 7, rdPercent: 56.8, analystRating: 'Buy', priceTarget: 165.00,
    institutionalOwnership: 76.4, revenue: 1_340_000_000, revenueGrowth: 24.8, netIncome: -892_000_000,
    employees: 1400, founded: 1980, hq: 'Cambridge, MA',
    description: 'Leader in Duchenne muscular dystrophy with multiple approved exon-skipping therapies and advancing gene therapy program SRP-9001.'
  },
  {
    id: 'exas', name: 'Exact Sciences', ticker: 'EXAS',
    focusArea: 'Cancer Screening, Diagnostics', focusTags: ['Cancer Screening', 'Diagnostics', 'Liquid Biopsy'],
    basePrice: 53.60, marketCap: 9_400_000_000, volume: 3_240_000, avgVolume: 3_080_000,
    week52High: 68.40, week52Low: 38.20, pe: null, ps: 4.2, evEbitda: null,
    debtToEquity: 0.64, cashRunway: 11, rdPercent: 28.4, analystRating: 'Buy', priceTarget: 72.00,
    institutionalOwnership: 84.2, revenue: 2_480_000_000, revenueGrowth: 14.2, netIncome: -684_000_000,
    employees: 6200, founded: 2009, hq: 'Madison, WI',
    description: 'Cancer diagnostics company with Cologuard for colorectal screening, expanding into multi-cancer early detection.'
  },
  {
    id: 'sgen', name: 'Seagen Inc.', ticker: 'SGEN',
    focusArea: 'Oncology (ADCs)', focusTags: ['Oncology', 'ADCs', 'Targeted Therapy'],
    basePrice: 227.80, marketCap: 40_200_000_000, volume: 1_840_000, avgVolume: 1_720_000,
    week52High: 248.60, week52Low: 194.20, pe: null, ps: 26.4, evEbitda: null,
    debtToEquity: 1.24, cashRunway: 6, rdPercent: 74.2, analystRating: 'Hold', priceTarget: 235.00,
    institutionalOwnership: 92.8, revenue: 2_100_000_000, revenueGrowth: 16.4, netIncome: -1_240_000_000,
    employees: 3400, founded: 1997, hq: 'Bothell, WA',
    description: 'Antibody-drug conjugate pioneer with multiple oncology approvals, pipeline expanding across bladder, breast, and cervical cancers.'
  },
  {
    id: 'hznp', name: 'Horizon Therapeutics', ticker: 'HZNP',
    focusArea: 'Rare Diseases', focusTags: ['Rare Diseases', 'Inflammation', 'Thyroid Eye Disease'],
    basePrice: 115.20, marketCap: 22_400_000_000, volume: 2_180_000, avgVolume: 2_040_000,
    week52High: 126.80, week52Low: 88.40, pe: 38.4, ps: 9.2, evEbitda: 28.6,
    debtToEquity: 0.78, cashRunway: 15, rdPercent: 22.8, analystRating: 'Hold', priceTarget: 118.00,
    institutionalOwnership: 89.4, revenue: 2_380_000_000, revenueGrowth: 6.4, netIncome: 584_000_000,
    employees: 2200, founded: 2005, hq: 'Dublin, Ireland',
    description: 'Rare disease specialist with Tepezza for thyroid eye disease and Krystexxa for uncontrolled gout, expanding rare disease franchise.'
  },
  {
    id: 'uthr', name: 'United Therapeutics', ticker: 'UTHR',
    focusArea: 'Pulmonary Hypertension', focusTags: ['Pulmonary Hypertension', 'Organ Manufacturing'],
    basePrice: 276.40, marketCap: 14_200_000_000, volume: 580_000, avgVolume: 540_000,
    week52High: 324.60, week52Low: 222.80, pe: 14.2, ps: 4.8, evEbitda: 10.4,
    debtToEquity: 0.14, cashRunway: 20, rdPercent: 14.8, analystRating: 'Buy', priceTarget: 340.00,
    institutionalOwnership: 78.6, revenue: 2_340_000_000, revenueGrowth: 8.2, netIncome: 1_000_000_000,
    employees: 2000, founded: 1996, hq: 'Silver Spring, MD',
    description: 'Pulmonary hypertension specialist with multiple approved therapies, pioneering xenotransplantation of genetically modified organs.'
  },
  {
    id: 'argx', name: 'Argenx SE', ticker: 'ARGX',
    focusArea: 'Autoimmune Diseases', focusTags: ['Autoimmune', 'FcRn', 'Rare Disease'],
    basePrice: 489.60, marketCap: 38_400_000_000, volume: 720_000, avgVolume: 680_000,
    week52High: 624.80, week52Low: 402.40, pe: null, ps: 22.4, evEbitda: null,
    debtToEquity: 0.06, cashRunway: 14, rdPercent: 68.4, analystRating: 'Buy', priceTarget: 620.00,
    institutionalOwnership: 64.2, revenue: 2_840_000_000, revenueGrowth: 58.4, netIncome: -524_000_000,
    employees: 2400, founded: 2008, hq: 'Breda, Netherlands',
    description: 'Belgian immunology company with Vyvgart/efgartigimod approved for MG and multiple indications across autoimmune diseases.'
  },
  {
    id: 'ions', name: 'Ionis Pharmaceuticals', ticker: 'IONS',
    focusArea: 'Antisense Therapeutics', focusTags: ['Antisense', 'Neurology', 'Cardiovascular'],
    basePrice: 43.80, marketCap: 6_400_000_000, volume: 3_480_000, avgVolume: 3_240_000,
    week52High: 58.60, week52Low: 32.80, pe: null, ps: 4.8, evEbitda: null,
    debtToEquity: 1.28, cashRunway: 9, rdPercent: 78.4, analystRating: 'Buy', priceTarget: 65.00,
    institutionalOwnership: 82.4, revenue: 968_000_000, revenueGrowth: 12.8, netIncome: -468_000_000,
    employees: 2400, founded: 1989, hq: 'Carlsbad, CA',
    description: 'Antisense oligonucleotide (ASO) pioneer with approved therapies in neurological and cardiometabolic diseases, broad platform.'
  },
  {
    id: 'exel', name: 'Exelixis Inc.', ticker: 'EXEL',
    focusArea: 'Oncology', focusTags: ['Oncology', 'Kinase Inhibitors', 'Cabozantinib'],
    basePrice: 24.20, marketCap: 7_200_000_000, volume: 5_840_000, avgVolume: 5_480_000,
    week52High: 32.40, week52Low: 18.60, pe: 18.6, ps: 4.2, evEbitda: 13.8,
    debtToEquity: 0.04, cashRunway: 22, rdPercent: 36.8, analystRating: 'Buy', priceTarget: 32.00,
    institutionalOwnership: 88.4, revenue: 1_720_000_000, revenueGrowth: 8.4, netIncome: 388_000_000,
    employees: 1200, founded: 1994, hq: 'Alameda, CA',
    description: 'Oncology company commercializing cabozantinib (Cabometyx) in renal and hepatocellular cancers, expanding XL092 next-gen program.'
  },
  {
    id: 'twst', name: 'Twist Bioscience', ticker: 'TWST',
    focusArea: 'Synthetic Biology, Genomics', focusTags: ['Synthetic Biology', 'DNA Synthesis', 'Biopharma Tools'],
    basePrice: 20.80, marketCap: 1_440_000_000, volume: 2_840_000, avgVolume: 2_640_000,
    week52High: 34.60, week52Low: 14.80, pe: null, ps: 6.8, evEbitda: null,
    debtToEquity: 0.18, cashRunway: 5, rdPercent: 42.4, analystRating: 'Hold', priceTarget: 28.00,
    institutionalOwnership: 72.4, revenue: 312_000_000, revenueGrowth: 18.4, netIncome: -284_000_000,
    employees: 1000, founded: 2013, hq: 'San Francisco, CA',
    description: 'Silicon-based DNA synthesis platform enabling synthetic biology, antibody drug discovery, and data storage applications.'
  },
  {
    id: 'ntla', name: 'Intellia Therapeutics', ticker: 'NTLA',
    focusArea: 'CRISPR Gene Editing', focusTags: ['CRISPR', 'Gene Editing', 'In Vivo'],
    basePrice: 17.40, marketCap: 1_680_000_000, volume: 4_280_000, avgVolume: 3_980_000,
    week52High: 38.60, week52Low: 12.40, pe: null, ps: 14.8, evEbitda: null,
    debtToEquity: 0.06, cashRunway: 6, rdPercent: 98.4, analystRating: 'Buy', priceTarget: 42.00,
    institutionalOwnership: 68.2, revenue: 198_000_000, revenueGrowth: -22.4, netIncome: -684_000_000,
    employees: 680, founded: 2014, hq: 'Cambridge, MA',
    description: 'In vivo CRISPR gene editing pioneer with NTLA-2001 for ATTR amyloidosis showing transformative clinical results.'
  },
  {
    id: 'crsp', name: 'CRISPR Therapeutics', ticker: 'CRSP',
    focusArea: 'CRISPR Gene Editing', focusTags: ['CRISPR', 'Gene Editing', 'Ex Vivo', 'Cell Therapy'],
    basePrice: 47.80, marketCap: 4_020_000_000, volume: 3_180_000, avgVolume: 2_960_000,
    week52High: 82.40, week52Low: 36.20, pe: null, ps: 16.4, evEbitda: null,
    debtToEquity: 0.04, cashRunway: 8, rdPercent: 88.4, analystRating: 'Buy', priceTarget: 85.00,
    institutionalOwnership: 62.4, revenue: 392_000_000, revenueGrowth: 124.8, netIncome: -384_000_000,
    employees: 650, founded: 2013, hq: 'Zug, Switzerland',
    description: 'CRISPR gene editing company with Casgevy (approved for sickle cell and beta thalassemia) and expanding oncology pipeline.'
  }
];
