import { BedConfig, StrengthMetrics, VentilationMetrics, WoodSpecies } from '../types';

export function calculateVentilation(config: BedConfig): VentilationMetrics {
  const innerLength = config.mattressLength;
  const innerWidth = config.mattressWidth;
  const slatW = config.slatWidth;
  const targetGap = config.targetSlatGap;

  // Lasketaan säleiden määrä siten, että rako osuu mahdollisimman lähelle toivottua
  // innerLength = n * slatW + (n + 1) * gap
  // gap = (innerLength - n * slatW) / (n + 1)
  let bestN = Math.round((innerLength - targetGap) / (slatW + targetGap));
  bestN = Math.max(5, Math.min(40, bestN));

  let actualGap = (innerLength - bestN * slatW) / (bestN + 1);

  // Varmistetaan ettei rako ole negatiivinen
  if (actualGap < 10 && bestN > 5) {
    bestN -= 1;
    actualGap = (innerLength - bestN * slatW) / (bestN + 1);
  }

  const mattressAreaM2 = (innerLength * innerWidth) / 1_000_000;
  const totalSlatAreaM2 = (bestN * slatW * innerWidth) / 1_000_000;
  const openAreaM2 = Math.max(0, mattressAreaM2 - totalSlatAreaM2);
  const ventilationRatioPercent = Math.round((openAreaM2 / mattressAreaM2) * 100);

  let status: 'optimal' | 'acceptable' | 'too_tight' | 'too_loose' = 'optimal';
  let message = '';

  if (actualGap > 65) {
    status = 'too_loose';
    message = `Tuuletusrako (${Math.round(actualGap)} mm) on liian suuri. Yli 60 mm rako voi aiheuttaa pussijousien tai vaahtomuovin painumista rakoihin ja vahingoittaa patjaa.`;
  } else if (actualGap < 20) {
    status = 'too_tight';
    message = `Tuuletusrako (${Math.round(actualGap)} mm) on liian tiheä. Alle 20 mm rako heikentää ilman kiertoa patjan alla ja voi kerryttää kosteutta.`;
  } else if (actualGap >= 30 && actualGap <= 50) {
    status = 'optimal';
    message = `Erinomainen tuuletusrako (${Math.round(actualGap)} mm). Tarjoaa ihanteellisen tuen patjalle ja optimaalisen ilmankierron.`;
  } else {
    status = 'acceptable';
    message = `Hyväksyttävä tuuletusrako (${Math.round(actualGap)} mm). Sopii useimmille runko- ja joustinpatjoille.`;
  }

  return {
    slatCount: bestN,
    actualGapMm: Math.round(actualGap * 10) / 10,
    slatCoverageM2: Math.round(totalSlatAreaM2 * 100) / 100,
    mattressAreaM2: Math.round(mattressAreaM2 * 100) / 100,
    openVentilationAreaM2: Math.round(openAreaM2 * 100) / 100,
    ventilationRatioPercent,
    isCompliant: actualGap >= 20 && actualGap <= 60,
    status,
    message,
  };
}

export function calculateStructuralStrength(
  config: BedConfig,
  frameWood: WoodSpecies,
  slatWood: WoodSpecies
): StrengthMetrics {
  const g = 9.81; // m/s²
  const pointLoadKg = Math.max(10, Number(config.pointLoadKg) || 150);
  const pointLoadN = pointLoadKg * g;
  const slatT = Math.max(8, Number(config.slatThickness) || 21);
  const slatW_dim = Math.max(30, Number(config.slatWidth) || 70);
  const frameT = Math.max(15, Number(config.frameThickness) || 28);
  const frameH = Math.max(80, Number(config.frameHeight) || 160);
  const legSec = Math.max(30, Number(config.legSection) || 70);

  // 1. SÄLEEN KUORMITUSTARKASTELU
  // Jänneväli (L):
  // Lasketaan sekä vapaa aukkomitta (L_clear) tukien reunojen välillä että
  // Eurocode 5 (SFS-EN 1995-1-1) mukainen tehollinen jänneväli (L_eff, tukipintojen keskiöiden väli).
  let slatClearSpanMm: number;
  let slatEffectiveSpanMm: number;

  if (config.constructionStyle === 'top_mounted') {
    // TASARUNKO: Sängyn ulkomitta on patja + käyntivara (oletus 10 mm / 1 cm).
    // Säleet asennetaan suoraan sivulaitojen (ja keskipalkin) päälle.
    const topClearance = config.topMountedClearance ?? 10;
    const outerW = config.mattressWidth + topClearance;
    const innerW = outerW - 2 * frameT;

    if (config.hasCenterBeam) {
      // Vapaa aukko sivulaidan sisäreunasta keskipalkin kylkeen: (innerW - centerBeamWidth) / 2
      slatClearSpanMm = (innerW - config.centerBeamWidth) / 2;
      // Tehollinen jänneväli: sivulaidan tukikeskiöstä (frameT / 2) keskipalkin laakeripinnan keskiöön (centerBeamWidth / 4)
      slatEffectiveSpanMm = slatClearSpanMm + (frameT / 2) + (config.centerBeamWidth / 4);
    } else {
      // Vapaa aukko sivulaitojen sisäpintojen välillä
      slatClearSpanMm = innerW;
      // Tehollinen jänneväli laitojen keskiöiden välillä
      slatEffectiveSpanMm = innerW + frameT;
    }
  } else {
    // UPOTETTU RUNKO: Säleet tukeutuvat sivulaitojen kannatinrimoihin (slatSupportThickness)
    const ledgerT = config.slatSupportThickness;
    if (config.hasCenterBeam) {
      // Vapaa aukko kannatinriman reunasta keskipalkin kylkeen:
      // (mattressWidth - centerBeamWidth - 2 * ledgerT) / 2
      slatClearSpanMm = (config.mattressWidth - config.centerBeamWidth - 2 * ledgerT) / 2;
      // Tehollinen jänneväli: kannatinriman tukikeskiöstä (ledgerT / 2) keskipalkin laakeripinnan keskiöön (centerBeamWidth / 4)
      slatEffectiveSpanMm = slatClearSpanMm + (ledgerT / 2) + (config.centerBeamWidth / 4);
    } else {
      // Vapaa aukko kannatinrimojen reunojen välillä
      slatClearSpanMm = config.mattressWidth - 2 * ledgerT;
      // Tehollinen jänneväli kannatinrimojen tukikeskiöiden välillä
      slatEffectiveSpanMm = config.mattressWidth - ledgerT;
    }
  }

  slatClearSpanMm = Math.max(150, Math.round(slatClearSpanMm));
  // Lujuus- ja taipumalaskennassa käytetään tehollista jänneväliä L_eff (Eurocode 5),
  // joka ottaa huomioon tukipinnan leveyden ja on rakenteellisesti oikea sekä turvallinen.
  const slatSpanMm = Math.max(200, Math.round(slatEffectiveSpanMm));

  // Huomioidaan patjan kuorman jakautuminen vierekkäisille säleille
  // Jos patja on päällä, pistekuormasta n. 65% kohdistuu suoraan yhteen säleeseen ja loput viereisille.
  // Äärimmäisessä pistekuormassa (esim. ilman patjaa suoraan säleelle astuttaessa) osuus on 100%.
  // Käytetään turvallista 80% kuormakerrointa patjan kanssa:
  const loadDistributionFactor = 0.80; // 80% pistekuormasta suoraan yhdelle säleelle
  const slatEffectiveLoadN = pointLoadN * loadDistributionFactor;

  // Taivutusmomentti keskellä yksinkertaista palkkia M = (F * L) / 4 (N*mm)
  const slatBendingMomentNmm = (slatEffectiveLoadN * slatSpanMm) / 4;
  const slatBendingMomentNm = slatBendingMomentNmm / 1000;

  // Poikkileikkauksen vastusmomentti W = (b * h²) / 6
  const slatW = (slatW_dim * Math.pow(slatT, 2)) / 6;

  // Jäyhyysmomentti I = (b * h³) / 12
  const slatI = (slatW_dim * Math.pow(slatT, 3)) / 12;

  // Taivutusjännitys sigma = M / W (MPa = N/mm²)
  const slatStressMPa = slatW > 0 ? slatBendingMomentNmm / slatW : 999;

  // Sallittu taivutusjännitys Eurocode 5 mukaan (lyhytaikainen kuorma, k_mod = 0.9, gamma_M = 1.3)
  const kMod = 0.9;
  const gammaM = 1.3;
  const slatAllowableStressMPa = (kMod * slatWood.bendingStrength) / gammaM;

  // Taipuma delta = (F * L³) / (48 * E * I)
  const slatDeflectionMm = slatI > 0
    ? (slatEffectiveLoadN * Math.pow(slatSpanMm, 3)) / (48 * slatWood.elasticModulus * slatI)
    : 99;

  // Sallittu taipuma L / 200 tai enintään 15 mm
  const slatAllowableDeflectionMm = Math.min(15, slatSpanMm / 200);

  const slatStressRatio = Math.round((slatStressMPa / slatAllowableStressMPa) * 100);
  const slatDeflectionRatio = Math.round((slatDeflectionMm / Math.max(1, slatAllowableDeflectionMm)) * 100);
  const slatSafetyFactor = slatStressMPa > 0 ? Math.round((slatWood.bendingStrength / slatStressMPa) * 10) / 10 : 0;

  let slatStatus: 'safe' | 'warning' | 'danger' = 'safe';
  if (slatStressRatio > 100 || slatDeflectionMm > slatAllowableDeflectionMm * 1.35) {
    slatStatus = 'danger';
  } else if (slatStressRatio > 80 || slatDeflectionMm > slatAllowableDeflectionMm) {
    slatStatus = 'warning';
  }

  // 2. SIVULAIDAN KUORMITUSTARKASTELU
  // Sivulaidan jänneväli on sängyn pituus kulmatolppien välillä
  const sideRailSpanMm = config.mattressLength;
  // Kun aikuinen istuu laidalle: koko pistekuorma kohdistuu sivulautaan sen keskipisteessä
  const sideRailForceN = pointLoadN;
  const sideRailMomentNmm = (sideRailForceN * sideRailSpanMm) / 4;

  // Sivulaudan vastusmomentti pystysuunnassa (b = paksuus, h = korkeus)
  const sideRailW = (frameT * Math.pow(frameH, 2)) / 6;
  const sideRailI = (frameT * Math.pow(frameH, 3)) / 12;

  const sideRailStressMPa = sideRailW > 0 ? sideRailMomentNmm / sideRailW : 999;
  const sideRailAllowableStressMPa = (kMod * frameWood.bendingStrength) / gammaM;
  const sideRailDeflectionMm = sideRailI > 0
    ? (sideRailForceN * Math.pow(sideRailSpanMm, 3)) / (48 * frameWood.elasticModulus * sideRailI)
    : 99;
  const sideRailAllowableDeflectionMm = Math.min(8, sideRailSpanMm / 300);

  const sideRailStressRatio = Math.round((sideRailStressMPa / sideRailAllowableStressMPa) * 100);
  const sideRailSafetyFactor = sideRailStressMPa > 0 ? Math.round((frameWood.bendingStrength / sideRailStressMPa) * 10) / 10 : 0;

  let sideRailStatus: 'safe' | 'warning' | 'danger' = 'safe';
  if (sideRailStressRatio > 100 || sideRailDeflectionMm > sideRailAllowableDeflectionMm * 1.4) {
    sideRailStatus = 'danger';
  } else if (sideRailStressRatio > 80 || sideRailDeflectionMm > sideRailAllowableDeflectionMm) {
    sideRailStatus = 'warning';
  }

  // 3. KESKIPALKKI
  let centerBeamStressRatio: number | undefined;
  let centerBeamDeflectionMm: number | undefined;
  let centerBeamStatus: 'safe' | 'warning' | 'danger' | undefined;

  if (config.hasCenterBeam) {
    // Jos on tukijalka keskellä, jänneväli puolittuu
    const beamSpan = config.centerLegCount > 0
      ? config.mattressLength / (config.centerLegCount + 1)
      : config.mattressLength;
    
    // Keskipalkki kantaa puolet sängyn kokonaispainosta + pistekuorman
    const beamPointN = pointLoadN * 0.5;
    const beamMomentNmm = (beamPointN * beamSpan) / 4;
    const beamW = (config.centerBeamWidth * Math.pow(config.centerBeamHeight, 2)) / 6;
    const beamI = (config.centerBeamWidth * Math.pow(config.centerBeamHeight, 3)) / 12;
    
    const beamStress = beamW > 0 ? beamMomentNmm / beamW : 999;
    const beamAllowable = (kMod * frameWood.bendingStrength) / gammaM;
    centerBeamDeflectionMm = beamI > 0 ? (beamPointN * Math.pow(beamSpan, 3)) / (48 * frameWood.elasticModulus * beamI) : 99;
    centerBeamStressRatio = Math.round((beamStress / beamAllowable) * 100);

    if (centerBeamStressRatio > 100) {
      centerBeamStatus = 'danger';
    } else if (centerBeamStressRatio > 80) {
      centerBeamStatus = 'warning';
    } else {
      centerBeamStatus = 'safe';
    }
  }

  // 4. JALKOJEN KESTÄVYYS
  const totalLegs = 4 + (config.hasCenterBeam ? config.centerLegCount : 0);
  const legAreaMm2 = Math.pow(legSec, 2);
  const totalLoadN = (config.totalOccupantWeightKg + 60) * g + pointLoadN; // käyttäjät + patja + pistekuorma
  const loadPerCornerLegN = totalLoadN / totalLegs;
  const legStressMPa = loadPerCornerLegN / legAreaMm2;
  // Puun syynsuuntainen puristuslujuus on tyypillisesti 20-30 MPa
  const legCapacityKg = Math.round((totalLegs * legAreaMm2 * 12) / g); // runsaalla varmuuskertoimella
  const legStatus: 'safe' | 'warning' | 'danger' = legStressMPa < 3 ? 'safe' : (legStressMPa < 6 ? 'warning' : 'danger');

  // 5. SUURIN SALLITTU PISTEKUORMA NYKYRAKENTEELLA
  // A) Säleen oma pistekantavuus (sekä taivutusjännityksen että sallitun taipuman mukaan)
  const maxLoadBySlatStressN = (slatAllowableStressMPa * slatW * 4) / (slatSpanMm * loadDistributionFactor);
  const maxLoadBySlatDeflectionN = (slatAllowableDeflectionMm * 48 * slatWood.elasticModulus * slatI) / (Math.pow(slatSpanMm, 3) * loadDistributionFactor);
  const slatMaxPointLoadKg = Math.round(Math.min(maxLoadBySlatStressN, maxLoadBySlatDeflectionN) / g);

  // B) Sivulaidan suurin sallittu istumakuorma
  const maxLoadBySideRailStressN = (sideRailAllowableStressMPa * sideRailW * 4) / sideRailSpanMm;
  const maxLoadBySideRailDeflectionN = (sideRailAllowableDeflectionMm * 48 * frameWood.elasticModulus * sideRailI) / Math.pow(sideRailSpanMm, 3);
  const sideRailMaxPointLoadKg = Math.round(Math.min(maxLoadBySideRailStressN, maxLoadBySideRailDeflectionN) / g);

  // Koko rakenteen heikoimman lenkin määräämä sallittu pistekuorma
  const maxAllowablePointLoadKg = Math.round(Math.min(slatMaxPointLoadKg, sideRailMaxPointLoadKg));

  // Kokonaiskapasiteetti tasaisella kuormalla
  const totalBedCapacityKg = Math.round(maxAllowablePointLoadKg * 2.2);

  // Yhteenveto ja suositukset
  const warnings: string[] = [];
  const recommendations: string[] = [];

  let overallStatus: 'safe' | 'warning' | 'danger' = 'safe';
  if (slatStatus === 'danger' || sideRailStatus === 'danger' || centerBeamStatus === 'danger') {
    overallStatus = 'danger';
  } else if (slatStatus === 'warning' || sideRailStatus === 'warning' || centerBeamStatus === 'warning') {
    overallStatus = 'warning';
  }

  // Huomiot ja suositukset puusepälle
  if (slatStatus === 'danger') {
    warnings.push(`Pohjasäleet ylikuormittuvat valitulla pistekuormalla (${config.pointLoadKg} kg). Murtumis- tai halkeamisriski.`);
    if (!config.hasCenterBeam && config.mattressWidth >= 1200) {
      recommendations.push('Lisää sänkyyn pituussuuntainen keskipalkki. Se puolittaa säleiden jännevälin ja nelinkertaistaa niiden kantavuuden!');
    }
    recommendations.push(`Kasvata säleen paksuutta vähintään ${Math.max(config.slatThickness + 4, 25)} mm:iin tai vaihda sälemateriaaliksi sitkeämpi ${slatWood.id === 'pine_c24' ? 'Koivu tai Saarni' : 'paksumpi massiivipuu'}.`);
  } else if (slatStatus === 'warning') {
    warnings.push(`Säleen taipuma on ${Math.round(slatDeflectionMm * 10) / 10} mm (sallittu ${Math.round(slatAllowableDeflectionMm * 10) / 10} mm). Säle voi notkua tuntuvasti pistekuorman alla.`);
    recommendations.push('Harkitse säleen paksuuden kasvattamista 2-4 mm tai säleen leveyden leventämistä.');
  }

  if (sideRailStatus === 'danger') {
    warnings.push(`Sivulaidan taivutuskapasiteetti ylittyy reunalla istuttaessa.`);
    recommendations.push(`Kasvata sivulaudan korkeutta (esim. ${config.frameHeight} mm -> ${config.frameHeight + 30} mm) tai paksuutta (${config.frameThickness} mm -> ${config.frameThickness + 6} mm).`);
  } else if (sideRailStatus === 'warning') {
    warnings.push(`Sivulaita taipuu reunalla istuttaessa ${Math.round(sideRailDeflectionMm * 10) / 10} mm.`);
    recommendations.push('Sivulaudan korkeuden nostaminen 20 mm:llä lisää taivutusjäykkyyttä merkittävästi.');
  }

  if (config.mattressWidth >= 1400 && !config.hasCenterBeam) {
    warnings.push('Parisängyssä (leveys ≥ 140 cm) ei ole tällä hetkellä keskipalkkia. Säleiden jänneväli on liian pitkä, mikä aiheuttaa sängyn notkumisen keskeltä.');
    recommendations.push('Aktivoi keskipalkki ja vähintään yksi keskitukijalka.');
  }

  if (config.hasCenterBeam && config.centerLegCount === 0) {
    warnings.push('Keskipalkilla ei ole omia lattiaan ulottuvia tukijalkoja. Keskipalkki voi taipua omasta ja nukkujien painosta.');
    recommendations.push('Lisää keskipalkille 1 tai 2 säädettävää tukijalkaa sängyn keskelle.');
  }

  if (config.constructionStyle === 'top_mounted') {
    recommendations.push('Tasarunko: Keskipalkki on samalla tasolla kuin laidat ja säleet asennetaan suoraan niiden päälle. Tämä rakenne antaa säleille laajan ja vakaan suoran tuen ilman kannatinrimojen ruuviliitosten leikkausrasitusta.');
  }

  return {
    slatSpanMm: Math.round(slatSpanMm),
    slatClearSpanMm: Math.round(slatClearSpanMm),
    slatForceN: Math.round(slatEffectiveLoadN),
    slatBendingMomentNm: Math.round(slatBendingMomentNm * 10) / 10,
    slatStressMPa: Math.round(slatStressMPa * 10) / 10,
    slatAllowableStressMPa: Math.round(slatAllowableStressMPa * 10) / 10,
    slatStressRatio,
    slatDeflectionMm: Math.round(slatDeflectionMm * 10) / 10,
    slatAllowableDeflectionMm: Math.round(slatAllowableDeflectionMm * 10) / 10,
    slatDeflectionRatio,
    slatSafetyFactor,
    slatStatus,

    sideRailSpanMm: Math.round(sideRailSpanMm),
    sideRailForceN: Math.round(sideRailForceN),
    sideRailStressMPa: Math.round(sideRailStressMPa * 10) / 10,
    sideRailAllowableStressMPa: Math.round(sideRailAllowableStressMPa * 10) / 10,
    sideRailStressRatio,
    sideRailDeflectionMm: Math.round(sideRailDeflectionMm * 10) / 10,
    sideRailAllowableDeflectionMm: Math.round(sideRailAllowableDeflectionMm * 10) / 10,
    sideRailSafetyFactor,
    sideRailStatus,

    centerBeamStressRatio,
    centerBeamDeflectionMm: centerBeamDeflectionMm ? Math.round(centerBeamDeflectionMm * 10) / 10 : undefined,
    centerBeamStatus,

    legStressMPa: Math.round(legStressMPa * 100) / 100,
    legCapacityKg,
    legStatus,

    slatMaxPointLoadKg,
    sideRailMaxPointLoadKg,
    maxAllowablePointLoadKg,
    totalBedCapacityKg,
    overallStatus,
    warnings,
    recommendations,
  };
}
