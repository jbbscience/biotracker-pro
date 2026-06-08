export interface FDAMilestone {
  id: string;
  companyTicker: string;
  companyName: string;
  drugName: string;
  milestoneType: 'PDUFA' | 'AdCom' | 'CRL Response' | 'Phase III Result' | 'NDA Filing';
  date: string;
  indication: string;
  significance: 'High' | 'Medium' | 'Low';
  notes: string;
}

export const FDA_MILESTONES: FDAMilestone[] = [
  { id: 'fda-01', companyTicker: 'REGN', companyName: 'Regeneron', drugName: 'linvoseltamab', milestoneType: 'PDUFA', date: '2026-05-12', indication: 'Multiple Myeloma (rel/ref)', significance: 'High', notes: 'BCMA×CD3 bispecific antibody; FDA has Priority Review designation' },
  { id: 'fda-02', companyTicker: 'NTLA', companyName: 'Intellia', drugName: 'NTLA-2001', milestoneType: 'Phase III Result', date: '2026-06-08', indication: 'ATTR Amyloidosis (Cardiomyopathy)', significance: 'High', notes: 'Pivotal MAGNITUDE trial primary endpoint readout; could be transformative for gene editing field' },
  { id: 'fda-03', companyTicker: 'NVO', companyName: 'Novo Nordisk', drugName: 'CagriSema', milestoneType: 'Phase III Result', date: '2026-06-22', indication: 'Obesity', significance: 'High', notes: 'REDEFINE-1 trial; key weight loss vs semaglutide alone comparison' },
  { id: 'fda-04', companyTicker: 'GILD', companyName: 'Gilead', drugName: 'GS-4182', milestoneType: 'Phase III Result', date: '2026-07-14', indication: 'COVID-19 / Respiratory Virus', significance: 'Medium', notes: 'TOPAZ trial results for oral antiviral candidate' },
  { id: 'fda-05', companyTicker: 'CRSP', companyName: 'CRISPR Therapeutics', drugName: 'CTX112', milestoneType: 'Phase III Result', date: '2026-07-28', indication: 'B-cell Malignancies', significance: 'High', notes: 'Allogeneic CAR-T expansion data; key off-the-shelf readout' },
  { id: 'fda-06', companyTicker: 'MRNA', companyName: 'Moderna', drugName: 'mRNA-4157/V940', milestoneType: 'Phase III Result', date: '2026-08-11', indication: 'Adjuvant Melanoma', significance: 'High', notes: 'KEYNOTE-942 OS data with Keytruda; potential NDA filing trigger' },
  { id: 'fda-07', companyTicker: 'ARGX', companyName: 'Argenx', drugName: 'ARGX-117', milestoneType: 'Phase III Result', date: '2026-08-19', indication: 'Multifocal Motor Neuropathy', significance: 'Medium', notes: 'Phase 3 ADHERE trial; add-on indication for C2 inhibitor' },
  { id: 'fda-08', companyTicker: 'ALNY', companyName: 'Alnylam', drugName: 'zilebesiran', milestoneType: 'Phase III Result', date: '2026-09-08', indication: 'Hypertension', significance: 'High', notes: 'KARDIA-2 combination study with standard of care BP meds; massive market opportunity' },
  { id: 'fda-09', companyTicker: 'LLY', companyName: 'Eli Lilly', drugName: 'retatrutide', milestoneType: 'Phase III Result', date: '2026-09-22', indication: 'Obesity / MASH', significance: 'High', notes: 'Triple agonist SURMOUNT-5 trial; potential best-in-class weight loss data' },
  { id: 'fda-10', companyTicker: 'AMGN', companyName: 'Amgen', drugName: 'olomorasib', milestoneType: 'Phase III Result', date: '2026-10-06', indication: 'KRAS G12C NSCLC', significance: 'High', notes: 'CodeBreaK 300 confirmatory trial vs chemotherapy' },
  { id: 'fda-11', companyTicker: 'BNTX', companyName: 'BioNTech', drugName: 'BNT323', milestoneType: 'Phase III Result', date: '2026-10-20', indication: 'HER2+ Breast Cancer', significance: 'Medium', notes: 'ADC program pivotal expansion study; competing with T-DXd' },
  { id: 'fda-12', companyTicker: 'VRTX', companyName: 'Vertex', drugName: 'VX-993', milestoneType: 'Phase III Result', date: '2026-11-10', indication: 'APOL1-mediated Kidney Disease', significance: 'High', notes: 'First-ever APOL1 inhibitor pivotal trial; Phase 2b showed ~50% proteinuria reduction' },
  { id: 'fda-13', companyTicker: 'MRNA', companyName: 'Moderna', drugName: 'mRNA-1010', milestoneType: 'Phase III Result', date: '2026-09-15', indication: 'Seasonal Influenza', significance: 'Medium', notes: 'Efficacy data vs standard egg-based flu vaccines; key for franchise diversification' },
  { id: 'fda-14', companyTicker: 'BIIB', companyName: 'Biogen', drugName: 'felzartamab', milestoneType: 'Phase III Result', date: '2027-02-03', indication: 'IgA Nephropathy', significance: 'Medium', notes: 'Anti-CD38 approach in nephrology; differentiated from sparsentan/SGLT2i' },
  { id: 'fda-15', companyTicker: 'LLY', companyName: 'Eli Lilly', drugName: 'orforglipron', milestoneType: 'Phase III Result', date: '2026-12-01', indication: 'Type 2 Diabetes (oral pill)', significance: 'High', notes: 'ACHIEVE-1 pivotal data; oral small molecule GLP-1 agonist for T2D' },
  { id: 'fda-16', companyTicker: 'NTLA', companyName: 'Intellia', drugName: 'NTLA-2002', milestoneType: 'Phase III Result', date: '2026-09-29', indication: 'Hereditary Angioedema', significance: 'Medium', notes: 'Phase 2 expansion data for HAE prophylaxis; single-dose potential' },
  { id: 'fda-17', companyTicker: 'VRTX', companyName: 'Vertex', drugName: 'VX-880', milestoneType: 'Phase III Result', date: '2027-03-10', indication: 'Type 1 Diabetes', significance: 'High', notes: 'Pivotal FORESEE-1 trial of stem cell-derived islets; potential functional cure' },
  { id: 'fda-18', companyTicker: 'INCY', companyName: 'Incyte', drugName: 'parsaclisib', milestoneType: 'AdCom', date: '2026-06-16', indication: 'Follicular Lymphoma', significance: 'Medium', notes: 'FDA advisory committee; PI3K delta inhibitor safety/efficacy review' },
  { id: 'fda-19', companyTicker: 'BMRN', companyName: 'BioMarin', drugName: 'Roctavian', milestoneType: 'Phase III Result', date: '2026-07-07', indication: 'Hemophilia A (long-term)', significance: 'Medium', notes: '5-year durability data for gene therapy; crucial for market confidence' },
  { id: 'fda-20', companyTicker: 'ALNY', companyName: 'Alnylam', drugName: 'fitusiran', milestoneType: 'PDUFA', date: '2026-05-28', indication: 'Hemophilia A & B', significance: 'High', notes: 'ATLAS trial NDA submission; RNAi-based subcutaneous hemophilia treatment' },
];
