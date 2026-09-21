import { BedConfig, BOMItem, CrossSectionCutGroup, CutBoard, CutPiece, CutPlanResult, HardwareItem, WoodSpecies } from '../types';
import { calculateVentilation } from './engineering';

const COLOR_PALETTE = [
  '#2563eb', // blue
  '#059669', // emerald
  '#d97706', // amber
  '#7c3aed', // violet
  '#db2777', // pink
  '#0891b2', // cyan
  '#ea580c', // orange
  '#4f46e5', // indigo
  '#16a34a', // green
];

export function generateBOM(
  config: BedConfig,
  frameWood: WoodSpecies,
  slatWood: WoodSpecies
): { items: BOMItem[]; hardware: HardwareItem[]; totalVolumeM3: number; totalWeightKg: number; estimatedCostEur: number } {
  const items: BOMItem[] = [];
  const isTopMounted = config.constructionStyle === 'top_mounted';
  const topClearance = config.topMountedClearance ?? 10; // 10 mm (1 cm) käyntivara tasarungossa

  // Ulkomitat:
  // Upotetussa laatikossa laidat kiertävät patjan ulkopuolelta (+2×paksuus + 10mm käyntivara).
  // Tasarungossa patja lepää säleiden päällä, jolloin 1 cm (10 mm) käyntivara riittää täydellisesti!
  const outerW = isTopMounted
    ? config.mattressWidth + topClearance
    : config.mattressWidth + 10 + 2 * config.frameThickness;
  const outerL = isTopMounted
    ? config.mattressLength + topClearance
    : config.mattressLength + 10 + 2 * config.frameThickness;

  // Laitojen sisämitat (vapaa väli)
  const innerW = outerW - 2 * config.frameThickness;
  const innerL = outerL - 2 * config.frameThickness;

  // 1. Sivulaudat (2 kpl)
  const sideRailLength = outerL;
  const sideRailVol = (2 * config.frameThickness * config.frameHeight * sideRailLength) / 1_000_000_000;
  items.push({
    id: 'side_rails',
    name: 'Sivulaidat (vasen ja oikea)',
    category: 'frame',
    count: 2,
    thickness: config.frameThickness,
    width: config.frameHeight,
    length: sideRailLength,
    totalLengthM: Math.round((2 * sideRailLength) / 10) / 100,
    volumeM3: Math.round(sideRailVol * 10000) / 10000,
    weightKg: Math.round(sideRailVol * frameWood.density * 10) / 10,
    woodSpeciesName: frameWood.nameFi,
    crossSectionKey: `${config.frameThickness}×${config.frameHeight}`,
    notes: isTopMounted
      ? `Rungon kantavat sivulaudat (koko ulkopituus ${outerL} mm)`
      : 'Rungon kantavat pituussuuntaiset sivulaudat',
  });

  // 2. Päätylaudat (2 kpl)
  const endRailLength = innerW;
  const endRailVol = (2 * config.frameThickness * config.frameHeight * endRailLength) / 1_000_000_000;
  items.push({
    id: 'end_rails',
    name: 'Päätylaudat (pääty ja jalkopää)',
    category: 'frame',
    count: 2,
    thickness: config.frameThickness,
    width: config.frameHeight,
    length: endRailLength,
    totalLengthM: Math.round((2 * endRailLength) / 10) / 100,
    volumeM3: Math.round(endRailVol * 10000) / 10000,
    weightKg: Math.round(endRailVol * frameWood.density * 10) / 10,
    woodSpeciesName: frameWood.nameFi,
    crossSectionKey: `${config.frameThickness}×${config.frameHeight}`,
    notes: 'Kiinnitetään sivulautojen väliin / kulmatolppiin',
  });

  // 3. Jalat (4 kpl)
  const legPlacement = config.legPlacement ?? 'under_frame';
  const isUnderFrame = legPlacement === 'under_frame';
  // Kun jalat asennetaan rungon alle, jalan pituus on tasan maavara (legHeight).
  // Jos kyseessä on perinteinen sisäkulmatolppa, se nousee rungon sisälle.
  const legTotalLength = isUnderFrame ? config.legHeight : config.legHeight + config.frameHeight - 15;
  const legVol = (4 * Math.pow(config.legSection, 2) * legTotalLength) / 1_000_000_000;
  items.push({
    id: 'corner_legs',
    name: isUnderFrame ? 'Jalat (asennus rungon alle)' : 'Kulmatolpat / jalat',
    category: 'legs',
    count: 4,
    thickness: config.legSection,
    width: config.legSection,
    length: legTotalLength,
    totalLengthM: Math.round((4 * legTotalLength) / 10) / 100,
    volumeM3: Math.round(legVol * 10000) / 10000,
    weightKg: Math.round(legVol * frameWood.density * 10) / 10,
    woodSpeciesName: frameWood.nameFi,
    crossSectionKey: `${config.legSection}×${config.legSection}`,
    notes: isUnderFrame
      ? `Asennus suoraan rungon alle (runko lepää jalkojen päällä). Pituus ${legTotalLength} mm = maavara${config.legInset ? `, sisäänveto ${config.legInset} mm` : ''}`
      : `Sängyn sisäkulmiin pultattavat tolpat. Vapaa maavara ${config.legHeight} mm`,
  });

  // 4. Säleikön kannatinrimat (vain upotetussa rakenteessa, tasarungossa säleet ovat laitojen päällä)
  if (config.constructionStyle !== 'top_mounted') {
    const ledgerLength = innerL - 20;
    const ledgerVol = (2 * config.slatSupportThickness * config.slatSupportWidth * ledgerLength) / 1_000_000_000;
    items.push({
      id: 'ledger_strips',
      name: 'Säleikön kannatinrimat',
      category: 'support',
      count: 2,
      thickness: config.slatSupportThickness,
      width: config.slatSupportWidth,
      length: ledgerLength,
      totalLengthM: Math.round((2 * ledgerLength) / 10) / 100,
      volumeM3: Math.round(ledgerVol * 10000) / 10000,
      weightKg: Math.round(ledgerVol * frameWood.density * 10) / 10,
      woodSpeciesName: frameWood.nameFi,
      crossSectionKey: `${config.slatSupportThickness}×${config.slatSupportWidth}`,
      notes: 'Kiinnitetään sivulautojen sisäpintaan ruuveilla ja liimalla',
    });
  }

  // 5. Keskipalkki ja keskitukijalat (jos valittu)
  if (config.hasCenterBeam) {
    const centerBeamLength = innerL;
    const centerBeamVol = (config.centerBeamWidth * config.centerBeamHeight * centerBeamLength) / 1_000_000_000;
    items.push({
      id: 'center_beam',
      name: 'Keskipalkki (pituussuuntainen)',
      category: 'support',
      count: 1,
      thickness: config.centerBeamWidth,
      width: config.centerBeamHeight,
      length: centerBeamLength,
      totalLengthM: Math.round(centerBeamLength / 10) / 100,
      volumeM3: Math.round(centerBeamVol * 10000) / 10000,
      weightKg: Math.round(centerBeamVol * frameWood.density * 10) / 10,
      woodSpeciesName: frameWood.nameFi,
      crossSectionKey: `${config.centerBeamWidth}×${config.centerBeamHeight}`,
      notes: config.constructionStyle === 'top_mounted'
        ? 'Asennetaan samalle tasolle sivulautojen kanssa (yläpinta tasan). Säleet tukeutuvat suoraan palkin päälle.'
        : 'Jakaa säleiden jännevälin ja vahvistaa sängyn keskiosan',
    });

    if (config.centerLegCount > 0) {
      // Keskitukijalka ulottuu lattiasta keskipalkin alapintaan
      const centerLegHeight = config.constructionStyle === 'top_mounted'
        ? Math.max(80, config.legHeight + config.frameHeight - config.centerBeamHeight)
        : Math.max(80, config.legHeight + config.frameHeight - config.recessDepth - config.slatThickness - config.centerBeamHeight);
      const centerLegVol = (config.centerLegCount * Math.pow(config.centerBeamWidth, 2) * centerLegHeight) / 1_000_000_000;
      items.push({
        id: 'center_legs',
        name: 'Keskipalkin tukijalat',
        category: 'legs',
        count: config.centerLegCount,
        thickness: config.centerBeamWidth,
        width: config.centerBeamWidth,
        length: centerLegHeight,
        totalLengthM: Math.round((config.centerLegCount * centerLegHeight) / 10) / 100,
        volumeM3: Math.round(centerLegVol * 10000) / 10000,
        weightKg: Math.round(centerLegVol * frameWood.density * 10) / 10,
        woodSpeciesName: frameWood.nameFi,
        crossSectionKey: `${config.centerBeamWidth}×${config.centerBeamWidth}`,
        notes: 'Estää keskipalkin notkumisen nukkujien alla',
      });
    }
  }

  // 6. Pohjasäleet
  const vent = calculateVentilation(config);
  // Tasarungossa säle ulottuu koko sängyn ulkoleveydelle (outerW); upotetussa se asettuu sisämittaan
  const slatLength = isTopMounted
    ? outerW
    : innerW - 4; // pieni 2mm välys molempiin päihin
  const slatVol = (vent.slatCount * config.slatThickness * config.slatWidth * slatLength) / 1_000_000_000;
  items.push({
    id: 'slats',
    name: 'Pohjasäleet',
    category: 'slats',
    count: vent.slatCount,
    thickness: config.slatThickness,
    width: config.slatWidth,
    length: slatLength,
    totalLengthM: Math.round((vent.slatCount * slatLength) / 10) / 100,
    volumeM3: Math.round(slatVol * 10000) / 10000,
    weightKg: Math.round(slatVol * slatWood.density * 10) / 10,
    woodSpeciesName: slatWood.nameFi,
    crossSectionKey: `${config.slatThickness}×${config.slatWidth}`,
    notes: isTopMounted
      ? `${vent.slatCount} kpl, pituus ${slatLength} mm (koko ulkoleveys), asennus laitojen ja keskipalkin päälle, tuuletusrako n. ${Math.round(vent.actualGapMm)} mm`
      : `${vent.slatCount} kpl, tasainen tuuletusrako n. ${Math.round(vent.actualGapMm)} mm`,
  });

  // Yhteenvedot
  const totalVolumeM3 = items.reduce((acc, it) => acc + it.volumeM3, 0);
  const totalWeightKg = items.reduce((acc, it) => acc + it.weightKg, 0);

  // Kustannusarvio
  const estimatedCostEur = items.reduce((acc, it) => {
    const isSlat = it.category === 'slats';
    const priceM3 = isSlat ? slatWood.approxPricePerM3 : frameWood.approxPricePerM3;
    // Lisätään 15% puutavarakaupan käsittely-/hukkalisä
    return acc + it.volumeM3 * priceM3 * 1.15;
  }, 0);

  // Rautatavara / helat
  const hardware: HardwareItem[] = [
    {
      name: 'Raskaat sänkyliitosraudat / kulmaraudat (vähintään 100×100×3 mm)',
      count: 4,
      unit: 'kpl',
      purpose: 'Sivulautojen ja päätyjen nurkkakiinnitys',
    },
    {
      name: 'Uppokantaiset puuruuvit 5,0 × 70 mm (sinkitty/karkaistu)',
      count: 32,
      unit: 'kpl',
      purpose: 'Kulmatolppien ja sänkyliitosten kiinnitys',
    },
  ];

  if (config.constructionStyle !== 'top_mounted') {
    hardware.push({
      name: 'Kannatinrimojen kiinnitysruuvit 4,5 × 50 mm',
      count: 24,
      unit: 'kpl',
      purpose: 'Säleikön kannatinrimojen ruuvaus sivulautaan (15-20 cm välein)',
    });
  }

  hardware.push(
    {
      name: config.constructionStyle === 'top_mounted' ? 'Säleruuvit 4,5 × 50 mm (uppokanta)' : 'Säleruuvit 4,0 × 40 mm',
      count: vent.slatCount * (config.hasCenterBeam ? 3 : 2),
      unit: 'kpl',
      purpose: config.constructionStyle === 'top_mounted'
        ? 'Säleiden ruuvaus yläkautta suoraan sivulaitoihin ja keskipalkkiin'
        : 'Säleiden ruuvaus kannattimiin ja keskipalkkiin estämään liikkuminen',
    },
    {
      name: 'Huonekaluhuopatassut (vähintään 30×30 mm tai leikattava levy)',
      count: 4 + (config.hasCenterBeam ? config.centerLegCount : 0),
      unit: 'kpl',
      purpose: 'Jalkojen alle lattian suojaamiseksi',
    }
  );

  if (config.hasCenterBeam) {
    hardware.push({
      name: config.constructionStyle === 'top_mounted'
        ? 'Keskipalkin palkkikengät / tasokiinnikkeet (sama taso laitojen kanssa)'
        : 'Palkkikenkä / keskipalkin U-kannattimet',
      count: 2,
      unit: 'kpl',
      purpose: config.constructionStyle === 'top_mounted'
        ? 'Keskipalkin kiinnitys päätylautoihin tasan laitojen yläreunan tasalle'
        : 'Keskipalkin luja ripustaminen päätylautoihin',
    });
  }

  return {
    items,
    hardware,
    totalVolumeM3: Math.round(totalVolumeM3 * 1000) / 1000,
    totalWeightKg: Math.round(totalWeightKg * 10) / 10,
    estimatedCostEur: Math.round(estimatedCostEur),
  };
}

export function optimizeCuttingPlan(
  bomItems: BOMItem[],
  stockLengthMm: number = 3000,
  sawKerfMm: number = 3
): CutPlanResult {
  // Ryhmitellään puutavara poikkileikkauksen (thickness x width) mukaan
  const groupsMap = new Map<string, { thickness: number; width: number; name: string; pieces: { id: string; name: string; length: number }[] }>();

  bomItems.forEach((item) => {
    const key = item.crossSectionKey;
    if (!groupsMap.has(key)) {
      groupsMap.set(key, {
        thickness: item.thickness,
        width: item.width,
        name: item.name,
        pieces: [],
      });
    }

    const group = groupsMap.get(key)!;
    for (let i = 0; i < item.count; i++) {
      group.pieces.push({
        id: `${item.id}_${i + 1}`,
        name: `${item.name} #${i + 1}`,
        length: item.length,
      });
    }
  });

  const groups: CrossSectionCutGroup[] = [];
  let totalStockBoards = 0;
  let totalTimberLengthMm = 0;
  let totalUsedLengthMm = 0;

  let colorIdx = 0;

  groupsMap.forEach((data, crossSection) => {
    // Järjestetään kappaleet pisimmästä lyhimpään (First-Fit Decreasing / Best-Fit)
    const pieces = [...data.pieces].sort((a, b) => b.length - a.length);

    // Jos jokin kappale on pidempi kuin peruslaudan pituus, nostetaan tämän ryhmän raakapuupituutta
    let effectiveStockLength = stockLengthMm;
    const longestPiece = pieces.length > 0 ? pieces[0].length : 0;
    if (longestPiece > effectiveStockLength) {
      // Valitaan kaupasta pitempi lauta esim. 3600, 4200, 4800 mm
      effectiveStockLength = Math.ceil((longestPiece + sawKerfMm) / 600) * 600;
    }

    const boards: CutBoard[] = [];

    pieces.forEach((piece) => {
      // Etsitään levy, johon kappale mahtuu sahauksineen parhaiten
      let bestBoardIndex = -1;
      let minRemainingSpace = Infinity;

      for (let i = 0; i < boards.length; i++) {
        const board = boards[i];
        const additionalKerf = board.cuts.length > 0 ? sawKerfMm : 0;
        const requiredSpace = piece.length + additionalKerf;
        const remainingSpace = effectiveStockLength - board.usedLength;

        if (remainingSpace >= requiredSpace) {
          const spaceAfter = remainingSpace - requiredSpace;
          if (spaceAfter < minRemainingSpace) {
            minRemainingSpace = spaceAfter;
            bestBoardIndex = i;
          }
        }
      }

      const assignedColor = COLOR_PALETTE[colorIdx % COLOR_PALETTE.length];
      colorIdx++;

      const cutPiece: CutPiece = {
        pieceId: piece.id,
        name: piece.name,
        length: piece.length,
        color: assignedColor,
      };

      if (bestBoardIndex >= 0) {
        const b = boards[bestBoardIndex];
        const additionalKerf = b.cuts.length > 0 ? sawKerfMm : 0;
        b.cuts.push(cutPiece);
        b.usedLength += piece.length + additionalKerf;
        b.wasteLength = effectiveStockLength - b.usedLength;
        b.wastePercent = Math.round((b.wasteLength / effectiveStockLength) * 100);
      } else {
        // Luodaan uusi lauta
        const newBoard: CutBoard = {
          stockIndex: boards.length + 1,
          crossSection,
          stockLength: effectiveStockLength,
          cuts: [cutPiece],
          usedLength: piece.length,
          wasteLength: effectiveStockLength - piece.length,
          wastePercent: Math.round(((effectiveStockLength - piece.length) / effectiveStockLength) * 100),
        };
        boards.push(newBoard);
      }
    });

    const groupTotalStockLength = boards.length * effectiveStockLength;
    const groupTotalUsedLength = boards.reduce((acc, b) => acc + b.usedLength, 0);
    const groupWastePercent = groupTotalStockLength > 0
      ? Math.round(((groupTotalStockLength - groupTotalUsedLength) / groupTotalStockLength) * 100)
      : 0;

    totalStockBoards += boards.length;
    totalTimberLengthMm += groupTotalStockLength;
    totalUsedLengthMm += groupTotalUsedLength;

    groups.push({
      crossSection,
      timberName: `${crossSection} mm (${data.name.split('(')[0].trim()})`,
      stockLength: effectiveStockLength,
      boards,
      totalBoardsNeeded: boards.length,
      totalPieces: pieces.length,
      totalWastePercent: groupWastePercent,
    });
  });

  const totalWasteLengthMm = Math.max(0, totalTimberLengthMm - totalUsedLengthMm);
  const overallWastePercent = totalTimberLengthMm > 0
    ? Math.round((totalWasteLengthMm / totalTimberLengthMm) * 100)
    : 0;

  return {
    groups,
    totalStockBoards,
    totalTimberLengthM: Math.round(totalTimberLengthMm / 10) / 100,
    totalUsedLengthM: Math.round(totalUsedLengthMm / 10) / 100,
    totalWasteLengthM: Math.round(totalWasteLengthMm / 10) / 100,
    overallWastePercent,
  };
}
