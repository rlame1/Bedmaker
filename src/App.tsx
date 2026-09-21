import React, { useState, useEffect, useMemo } from 'react';
import { BedConfig, WoodSpecies } from './types';
import { WOOD_SPECIES, STANDARD_MATTRESS_SIZES } from './data/woodSpecies';
import { translations } from './i18n/translations';
import { calculateStructuralStrength, calculateVentilation } from './utils/engineering';
import { generateBOM, optimizeCuttingPlan } from './utils/optimizer';
import { DimensionInputs } from './components/DimensionInputs';
import { MaterialSelector } from './components/MaterialSelector';
import { LoadAnalysis } from './components/LoadAnalysis';
import { BedVisualizer } from './components/BedVisualizer';
import { MaterialList } from './components/MaterialList';
import { CuttingPlanView } from './components/CuttingPlanView';
import {
  Bed,
  Box,
  TreePine,
  Activity,
  ListOrdered,
  Scissors,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  Printer,
  ChevronDown,
  Hammer,
} from 'lucide-react';

const DEFAULT_CONFIG: BedConfig = {
  name: 'Standard Double Bed 160×200',
  constructionStyle: 'recessed',
  mattressWidth: 1600,
  mattressLength: 2000,
  mattressThickness: 200,
  recessDepth: 70,
  topMountedClearance: 10,

  frameThickness: 32,
  frameHeight: 180,

  legPlacement: 'under_frame',
  legInset: 0,
  legHeight: 220,
  legSection: 70,

  hasCenterBeam: true,
  centerBeamWidth: 45,
  centerBeamHeight: 95,
  centerLegCount: 1,

  slatSupportThickness: 28,
  slatSupportWidth: 45,

  slatThickness: 21,
  slatWidth: 70,
  targetSlatGap: 40,

  woodSpeciesId: 'pine_c24',
  slatWoodSpeciesId: 'birch',
  useSeparateSlatWood: true,

  pointLoadKg: 200,
  pointLoadLocation: 'slat_center',
  occupantCount: 2,
  totalOccupantWeightKg: 170,

  stockBoardLength: 3000,
  sawKerf: 3.0,
};

export default function App() {
  const [lang, setLang] = useState<'en' | 'fi'>(() => {
    const saved = localStorage.getItem('bed_crafter_lang');
    if (saved === 'en' || saved === 'fi') return saved;
    return 'en'; // default English as requested
  });

  const t = translations[lang];

  const [config, setConfig] = useState<BedConfig>(() => {
    const saved = localStorage.getItem('bed_crafter_config');
    if (saved) {
      try {
        return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
      } catch (e) {
        console.error('Failed to parse saved config', e);
      }
    }
    return DEFAULT_CONFIG;
  });

  const [activeTab, setActiveTab] = useState<'design' | 'strength' | 'materials' | 'bom' | 'cutting'>('design');
  const useSeparateSlatWood = config.useSeparateSlatWood !== false;
  const setUseSeparateSlatWood = (enable: boolean) => {
    handleUpdateConfig({ useSeparateSlatWood: enable });
  };

  useEffect(() => {
    localStorage.setItem('bed_crafter_lang', lang);
  }, [lang]);

  useEffect(() => {
    localStorage.setItem('bed_crafter_config', JSON.stringify(config));
  }, [config]);

  const handleUpdateConfig = (updated: Partial<BedConfig>) => {
    setConfig((prev) => ({ ...prev, ...updated }));
  };

  const handleReset = () => {
    if (window.confirm(t.resetConfirm)) {
      setConfig(DEFAULT_CONFIG);
      setUseSeparateSlatWood(true);
    }
  };

  // Puulajit lokalisoituna
  const frameWood = useMemo(() => {
    const base = WOOD_SPECIES.find((w) => w.id === config.woodSpeciesId) || WOOD_SPECIES[0];
    const tWood = t.woodSpecies[base.id as keyof typeof t.woodSpecies];
    if (!tWood) return base;
    return {
      ...base,
      name: tWood.name,
      description: tWood.description,
      pros: tWood.pros,
      cons: tWood.cons,
      workability: tWood.workability as any,
    };
  }, [config.woodSpeciesId, lang, t]);

  const slatWood = useMemo(() => {
    if (!useSeparateSlatWood) return frameWood;
    const base = WOOD_SPECIES.find((w) => w.id === config.slatWoodSpeciesId) || frameWood;
    const tWood = t.woodSpecies[base.id as keyof typeof t.woodSpecies];
    if (!tWood) return base;
    return {
      ...base,
      name: tWood.name,
      description: tWood.description,
      pros: tWood.pros,
      cons: tWood.cons,
      workability: tWood.workability as any,
    };
  }, [config.slatWoodSpeciesId, frameWood, useSeparateSlatWood, lang, t]);

  // Tuuletus ja säleet
  const ventilation = useMemo(() => {
    return calculateVentilation(config);
  }, [config]);

  // Rakenteellinen lujuus & pistekuorma
  const strengthMetrics = useMemo(() => {
    return calculateStructuralStrength(config, frameWood, slatWood);
  }, [config, frameWood, slatWood]);

  // Materiaalilista (BOM)
  const bomData = useMemo(() => {
    return generateBOM(config, frameWood, slatWood);
  }, [config, frameWood, slatWood]);

  // Leikkaussuunnitelma
  const cutPlan = useMemo(() => {
    return optimizeCuttingPlan(bomData.items, config.stockBoardLength, config.sawKerf);
  }, [bomData.items, config.stockBoardLength, config.sawKerf]);

  // Preset-profiilit
  const applyPresetProfile = (type: 'single' | 'double' | 'oak' | 'tatami' | 'top_beam') => {
    if (type === 'single') {
      handleUpdateConfig({
        name: lang === 'en' ? 'Single Bed 90×200' : 'Yhden hengen sänky 90×200',
        constructionStyle: 'recessed',
        mattressWidth: 900,
        mattressLength: 2000,
        mattressThickness: 180,
        recessDepth: 60,
        frameThickness: 28,
        frameHeight: 160,
        hasCenterBeam: false,
        centerLegCount: 0,
        legHeight: 250,
        legSection: 70,
        slatThickness: 21,
        slatWidth: 70,
        pointLoadKg: 160,
        woodSpeciesId: 'pine_c24',
      });
    } else if (type === 'double') {
      handleUpdateConfig({
        name: lang === 'en' ? 'Standard Double Bed 160×200' : 'Standardi Parisänky 160×200',
        constructionStyle: 'recessed',
        mattressWidth: 1600,
        mattressLength: 2000,
        mattressThickness: 220,
        recessDepth: 75,
        frameThickness: 32,
        frameHeight: 190,
        hasCenterBeam: true,
        centerLegCount: 1,
        legHeight: 220,
        legSection: 70,
        slatThickness: 21,
        slatWidth: 70,
        pointLoadKg: 200,
        woodSpeciesId: 'pine_c24',
        slatWoodSpeciesId: 'birch',
      });
    } else if (type === 'oak') {
      handleUpdateConfig({
        name: lang === 'en' ? 'Solid Oak King Size 180×200' : 'Massiivitammi King Size 180×200',
        constructionStyle: 'recessed',
        mattressWidth: 1800,
        mattressLength: 2000,
        mattressThickness: 240,
        recessDepth: 85,
        frameThickness: 42,
        frameHeight: 210,
        hasCenterBeam: true,
        centerLegCount: 2,
        legHeight: 200,
        legSection: 90,
        slatThickness: 25,
        slatWidth: 85,
        pointLoadKg: 350,
        woodSpeciesId: 'oak',
        slatWoodSpeciesId: 'oak',
      });
    } else if (type === 'tatami') {
      handleUpdateConfig({
        name: lang === 'en' ? 'Low-profile Tatami Bed 160×200' : 'Matalarunkoinen Tatami-sänky 160×200',
        constructionStyle: 'recessed',
        mattressWidth: 1600,
        mattressLength: 2000,
        mattressThickness: 180,
        recessDepth: 50,
        frameThickness: 45,
        frameHeight: 140,
        hasCenterBeam: true,
        centerLegCount: 1,
        legHeight: 120,
        legSection: 90,
        slatThickness: 24,
        slatWidth: 90,
        pointLoadKg: 220,
        woodSpeciesId: 'glulam_pine',
        slatWoodSpeciesId: 'birch',
      });
    } else if (type === 'top_beam') {
      handleUpdateConfig({
        name: lang === 'en' ? 'Top-Mounted Platform Bed 160×200' : 'Tasarunko (Säleet laitojen ja keskipalkin päällä) 160×200',
        constructionStyle: 'top_mounted',
        mattressWidth: 1600,
        mattressLength: 2000,
        mattressThickness: 200,
        recessDepth: 0,
        frameThickness: 32,
        frameHeight: 180,
        hasCenterBeam: true,
        centerBeamWidth: 45,
        centerBeamHeight: 95,
        centerLegCount: 1,
        legHeight: 220,
        legSection: 70,
        slatThickness: 22,
        slatWidth: 70,
        targetSlatGap: 40,
        pointLoadKg: 220,
        woodSpeciesId: 'pine_c24',
        slatWoodSpeciesId: 'birch',
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#fbfaf8] text-stone-900 pb-16 font-sans">
      {/* Pääotsikko ja työkalupalkki */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-800 flex items-center justify-center text-white shadow-xs">
              <Hammer className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-extrabold text-stone-900 tracking-tight">
                  {t.appName}
                </h1>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-900">
                  {t.tagline}
                </span>
              </div>
              <p className="text-xs text-stone-500 hidden sm:block">
                {t.appSubtitle}
              </p>
            </div>
          </div>

          {/* Pikaindikaattorit */}
          <div className="flex items-center gap-2.5">
            {/* Kieli / Language toggle */}
            <button
              type="button"
              onClick={() => setLang(lang === 'en' ? 'fi' : 'en')}
              className="px-3 py-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-xs font-semibold text-stone-700 flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
              title="Change Language / Vaihda kieli"
            >
              <span>🌐</span>
              <span>{lang === 'en' ? '🇬🇧 English' : '🇫🇮 Suomi'}</span>
            </button>

            {/* Kestävyyspilleri */}
            <button
              type="button"
              onClick={() => setActiveTab('strength')}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                strengthMetrics.overallStatus === 'safe'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                  : strengthMetrics.overallStatus === 'warning'
                  ? 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100'
                  : 'bg-rose-50 border-rose-200 text-rose-800 hover:bg-rose-100'
              }`}
            >
              {strengthMetrics.overallStatus === 'safe' && <ShieldCheck className="w-4 h-4 text-emerald-600" />}
              {strengthMetrics.overallStatus === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-600" />}
              {strengthMetrics.overallStatus === 'danger' && <AlertOctagon className="w-4 h-4 text-rose-600" />}
              <span>
                {t.pointLoadLabel}: <strong>{config.pointLoadKg} kg</strong>
              </span>
            </button>

            {/* Hinta-arviopilleri */}
            <div className="hidden md:flex px-3 py-1.5 rounded-lg border border-stone-200 bg-stone-50 text-xs font-mono font-medium text-stone-700">
              {t.woodCost}: <strong className="text-stone-900 ml-1">~{bomData.estimatedCostEur} €</strong>
            </div>

            {/* Reset */}
            <button
              type="button"
              onClick={handleReset}
              className="p-2 rounded-lg border border-stone-200 hover:bg-stone-100 text-stone-500 hover:text-stone-800 transition-colors"
              title={t.reset}
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Malliprofiilien pikavalitsin */}
        <div className="bg-stone-50 border-t border-stone-100 px-4 sm:px-6 py-2">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 overflow-x-auto text-xs text-stone-600">
            <div className="flex items-center gap-2 whitespace-nowrap">
              <span className="font-semibold text-stone-500 text-[11px] uppercase">{t.presetsTitle}</span>
              <button
                type="button"
                onClick={() => applyPresetProfile('double')}
                className="px-2.5 py-1 rounded bg-white hover:bg-stone-200 border border-stone-200 text-stone-800 font-medium transition-colors"
              >
                {t.presetDouble}
              </button>
              <button
                type="button"
                onClick={() => applyPresetProfile('single')}
                className="px-2.5 py-1 rounded bg-white hover:bg-stone-200 border border-stone-200 text-stone-800 font-medium transition-colors"
              >
                {t.presetSingle}
              </button>
              <button
                type="button"
                onClick={() => applyPresetProfile('oak')}
                className="px-2.5 py-1 rounded bg-white hover:bg-stone-200 border border-stone-200 text-stone-800 font-medium transition-colors"
              >
                {t.presetOak}
              </button>
              <button
                type="button"
                onClick={() => applyPresetProfile('tatami')}
                className="px-2.5 py-1 rounded bg-white hover:bg-stone-200 border border-stone-200 text-stone-800 font-medium transition-colors"
              >
                {t.presetTatami}
              </button>
              <button
                type="button"
                onClick={() => applyPresetProfile('top_beam')}
                className="px-2.5 py-1 rounded bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 font-semibold transition-colors flex items-center gap-1"
              >
                <span>{t.presetTopBeam}</span>
              </button>
            </div>

            <div className="hidden lg:flex items-center gap-4 text-[11px] text-stone-500 font-mono">
              <span>Structure: <strong className="text-stone-800">{config.constructionStyle === 'top_mounted' ? t.constructionTopMounted : t.constructionRecessed}</strong></span>
              <span>•</span>
              <span>{t.ventilationGap}: <strong className="text-stone-800">{ventilation.actualGapMm} mm</strong></span>
              <span>•</span>
              <span>{t.seatingHeight}: <strong className="text-stone-800">{config.constructionStyle === 'top_mounted' ? config.legHeight + config.frameHeight + config.slatThickness + config.mattressThickness : config.legHeight + (config.frameHeight - config.recessDepth) + config.mattressThickness} mm</strong></span>
            </div>
          </div>
        </div>

        {/* Välilehdet */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <nav className="flex space-x-1 sm:space-x-4 border-b border-transparent overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveTab('design')}
              className={`py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition-all ${
                activeTab === 'design'
                  ? 'border-amber-800 text-amber-900'
                  : 'border-transparent text-stone-500 hover:text-stone-800 hover:border-stone-300'
              }`}
            >
              <Box className="w-4 h-4" />
              <span>{t.tabs.design}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('strength')}
              className={`py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition-all ${
                activeTab === 'strength'
                  ? 'border-amber-800 text-amber-900'
                  : 'border-transparent text-stone-500 hover:text-stone-800 hover:border-stone-300'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>{t.tabs.strength}</span>
              {strengthMetrics.overallStatus !== 'safe' && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('materials')}
              className={`py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition-all ${
                activeTab === 'materials'
                  ? 'border-amber-800 text-amber-900'
                  : 'border-transparent text-stone-500 hover:text-stone-800 hover:border-stone-300'
              }`}
            >
              <TreePine className="w-4 h-4" />
              <span>{t.tabs.materials} ({(frameWood.name || frameWood.nameFi).split('(')[0]})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('bom')}
              className={`py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition-all ${
                activeTab === 'bom'
                  ? 'border-amber-800 text-amber-900'
                  : 'border-transparent text-stone-500 hover:text-stone-800 hover:border-stone-300'
              }`}
            >
              <ListOrdered className="w-4 h-4" />
              <span>{t.tabs.bom} ({bomData.items.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('cutting')}
              className={`py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition-all ${
                activeTab === 'cutting'
                  ? 'border-amber-800 text-amber-900'
                  : 'border-transparent text-stone-500 hover:text-stone-800 hover:border-stone-300'
              }`}
            >
              <Scissors className="w-4 h-4" />
              <span>{t.tabs.cutting} ({cutPlan.totalStockBoards})</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Pääsisältö */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        {/* VÄLILEHTI 1: MITAT & VISUAALINEN MALLI */}
        {activeTab === 'design' && (
          <div className="space-y-6">
            <BedVisualizer
              config={config}
              frameWood={frameWood}
              slatWood={slatWood}
              metrics={strengthMetrics}
              ventilation={ventilation}
            />

            <DimensionInputs
              config={config}
              onChange={handleUpdateConfig}
              metrics={strengthMetrics}
              ventilation={ventilation}
              frameWood={frameWood}
              slatWood={slatWood}
              onGoToStrengthTab={() => setActiveTab('strength')}
            />
          </div>
        )}

        {/* VÄLILEHTI 2: KESTÄVYYSLASKURI & PISTEKUORMA */}
        {activeTab === 'strength' && (
          <LoadAnalysis
            config={config}
            onChangeConfig={handleUpdateConfig}
            metrics={strengthMetrics}
            ventilation={ventilation}
            frameWood={frameWood}
            slatWood={slatWood}
          />
        )}

        {/* VÄLILEHTI 3: PUULAJIT & VAKAUS */}
        {activeTab === 'materials' && (
          <MaterialSelector
            selectedWoodId={config.woodSpeciesId}
            onSelectWood={(id) => handleUpdateConfig({ woodSpeciesId: id })}
            slatWoodId={config.slatWoodSpeciesId}
            onSelectSlatWood={(id) => handleUpdateConfig({ slatWoodSpeciesId: id })}
            useSeparateSlatWood={useSeparateSlatWood}
            onToggleSeparateSlatWood={setUseSeparateSlatWood}
          />
        )}

        {/* VÄLILEHTI 4: MATERIAALILISTA (BOM) */}
        {activeTab === 'bom' && (
          <MaterialList
            items={bomData.items}
            hardware={bomData.hardware}
            totalVolumeM3={bomData.totalVolumeM3}
            totalWeightKg={bomData.totalWeightKg}
            estimatedCostEur={bomData.estimatedCostEur}
            frameWood={frameWood}
            slatWood={slatWood}
          />
        )}

        {/* VÄLILEHTI 5: LEIKKAUSSUUNNITELMA */}
        {activeTab === 'cutting' && (
          <CuttingPlanView
            plan={cutPlan}
            stockLength={config.stockBoardLength}
            sawKerf={config.sawKerf}
            onChangeStockLength={(len) => handleUpdateConfig({ stockBoardLength: len })}
            onChangeSawKerf={(kerf) => handleUpdateConfig({ sawKerf: kerf })}
          />
        )}
      </main>
    </div>
  );
}
