export type WoodCategory = 'softwood' | 'hardwood' | 'engineered';
export type BedConstructionStyle = 'recessed' | 'top_mounted';
export type LegPlacement = 'under_frame' | 'corner_post';

export interface WoodSpecies {
  id: string;
  nameFi: string;
  name?: string;
  botanicalName: string;
  category: WoodCategory;
  density: number; // kg/m³
  bendingStrength: number; // f_m,k in MPa (Eurocode 5 / EN 338 taivutuslujuus)
  elasticModulus: number; // E_0,mean in MPa (Kimmokerroin / jäykkyys)
  shearStrength: number; // f_v,k in MPa (Leikkauslujuus)
  description: string;
  pros: string[];
  cons: string[];
  workability: 'Helppo' | 'Kohtalainen' | 'Vaativa';
  stabilityRating: number; // 1-5
  colorHex: string;
  grainColorHex: string;
  approxPricePerM3: number; // €/m³
}

export interface BedConfig {
  name: string;
  // Runkorakenne / säleasennus
  constructionStyle: BedConstructionStyle; // 'recessed' (upotettu) tai 'top_mounted' (säleet laitojen ja keskipalkin päällä)

  // Patjamitat (mm)
  mattressWidth: number;
  mattressLength: number;
  mattressThickness: number;
  recessDepth: number; // Kuinka paljon patja uppoaa kehyksen sisään (mm)
  topMountedClearance?: number; // Tasarungon käyntivara / reunavara patjaan nähden (mm), oletus 10 mm (1 cm)

  // Kehys (mm)
  frameThickness: number; // Sivulautojen paksuus (mm, esim. 28-45)
  frameHeight: number; // Sivulautojen korkeus/leveys (mm, esim. 150-240)
  
  // Jalat (mm)
  legPlacement?: LegPlacement; // 'under_frame' = Jalat rungon alle (oletus), 'corner_post' = Kulmatolpat
  legInset?: number; // Jalkojen sisäänveto rungon ulkoreunoista (mm, oletus 0 mm)
  legHeight: number; // Vapaa maavara lattiasta sängyn alapintaan (mm)
  legSection: number; // Jalkatolpan paksuus x leveys (neliö mm, esim. 70x70 tai 90x90)

  // Keskipalkki
  hasCenterBeam: boolean;
  centerBeamWidth: number;
  centerBeamHeight: number;
  centerLegCount: number; // 0, 1 tai 2

  // Säleikön kannatinrimat (mm)
  slatSupportThickness: number; // esim. 25-32 mm
  slatSupportWidth: number; // esim. 45-50 mm

  // Pohjasäleet (mm)
  slatThickness: number; // esim. 18-28 mm
  slatWidth: number; // esim. 65-100 mm
  targetSlatGap: number; // esim. 30-50 mm

  // Puulaji
  woodSpeciesId: string;
  slatWoodSpeciesId?: string; // Voidaan valita säleille erillinen sitkeä puulaji (esim. koivu)
  useSeparateSlatWood?: boolean; // Käytetäänkö pohjasäleille eri puulajia kuin rungolle

  // Kuormitustarkastelu
  pointLoadKg: number; // Suunnittelupistekuorma (kg) esim. 150 - 400 kg
  pointLoadLocation: 'slat_center' | 'side_rail';
  occupantCount: 1 | 2;
  totalOccupantWeightKg: number; // Henkilöiden yhteenlaskettu paino (kg)

  // Sahaus & optimointi
  stockBoardLength: number; // Standardi laudan pituus (mm, esim. 3000, 3600, 4200)
  sawKerf: number; // Terän sahausleveys / hukka per sahaus (mm, esim. 3)
}

export interface BOMItem {
  id: string;
  name: string;
  category: 'frame' | 'slats' | 'legs' | 'support' | 'hardware';
  count: number;
  thickness: number; // mm
  width: number; // mm
  length: number; // mm
  totalLengthM: number;
  volumeM3: number;
  weightKg: number;
  woodSpeciesName: string;
  crossSectionKey: string; // esim. "32x180" leikkaussuunnitelman ryhmittelyyn
  notes?: string;
}

export interface HardwareItem {
  name: string;
  count: number;
  unit: string;
  purpose: string;
}

export interface CutPiece {
  pieceId: string;
  name: string;
  length: number;
  color: string;
}

export interface CutBoard {
  stockIndex: number;
  crossSection: string;
  stockLength: number;
  cuts: CutPiece[];
  usedLength: number;
  wasteLength: number;
  wastePercent: number;
}

export interface CrossSectionCutGroup {
  crossSection: string;
  timberName: string;
  stockLength: number;
  boards: CutBoard[];
  totalBoardsNeeded: number;
  totalPieces: number;
  totalWastePercent: number;
}

export interface CutPlanResult {
  groups: CrossSectionCutGroup[];
  totalStockBoards: number;
  totalTimberLengthM: number;
  totalUsedLengthM: number;
  totalWasteLengthM: number;
  overallWastePercent: number;
}

export interface StrengthMetrics {
  // Yksittäinen säle pistekuormassa
  slatSpanMm: number; // Tehollinen mitoitusjänneväli L_eff (Eurocode 5, tukikeskiöiden väli)
  slatClearSpanMm?: number; // Vapaa valoaukon jänneväli L_clear tukipintojen välissä
  slatForceN: number;
  slatBendingMomentNm: number;
  slatStressMPa: number;
  slatAllowableStressMPa: number;
  slatStressRatio: number; // % kapasiteetista
  slatDeflectionMm: number;
  slatAllowableDeflectionMm: number;
  slatDeflectionRatio: number; // % sallitusta taipumasta
  slatSafetyFactor: number;
  slatStatus: 'safe' | 'warning' | 'danger';

  // Sivulaita pistekuormassa (kun istutaan laidalle)
  sideRailSpanMm: number;
  sideRailForceN: number;
  sideRailStressMPa: number;
  sideRailAllowableStressMPa: number;
  sideRailStressRatio: number;
  sideRailDeflectionMm: number;
  sideRailAllowableDeflectionMm: number;
  sideRailSafetyFactor: number;
  sideRailStatus: 'safe' | 'warning' | 'danger';

  // Keskipalkki
  centerBeamStressRatio?: number;
  centerBeamDeflectionMm?: number;
  centerBeamStatus?: 'safe' | 'warning' | 'danger';

  // Jalat ja liitokset
  legStressMPa: number;
  legCapacityKg: number;
  legStatus: 'safe' | 'warning' | 'danger';

  // Yhteenveto
  slatMaxPointLoadKg: number; // Yksittäisen säleen suurin sallittu pistekuorma (kg)
  sideRailMaxPointLoadKg: number; // Sivulaidan suurin sallittu istumakuorma (kg)
  maxAllowablePointLoadKg: number; // Suurin turvallinen pistekuorma nykyrakenteella
  totalBedCapacityKg: number; // Suurin tasainen kokonaiskuorma
  overallStatus: 'safe' | 'warning' | 'danger';
  warnings: string[];
  recommendations: string[];
}

export interface VentilationMetrics {
  slatCount: number;
  actualGapMm: number;
  slatCoverageM2: number;
  mattressAreaM2: number;
  openVentilationAreaM2: number;
  ventilationRatioPercent: number;
  isCompliant: boolean;
  status: 'optimal' | 'acceptable' | 'too_tight' | 'too_loose';
  message: string;
}
