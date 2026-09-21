import React from 'react';
import { BedConfig, StrengthMetrics, VentilationMetrics, WoodSpecies } from '../types';
import { STANDARD_MATTRESS_SIZES, WOOD_SPECIES } from '../data/woodSpecies';
import { Sliders, BedDouble, Ruler, Layers, ShieldAlert, Sparkles, ShieldCheck, AlertTriangle, CheckCircle2, Activity, ArrowRight } from 'lucide-react';

interface DimensionInputsProps {
  config: BedConfig;
  onChange: (updated: Partial<BedConfig>) => void;
  metrics?: StrengthMetrics;
  ventilation?: VentilationMetrics;
  frameWood?: WoodSpecies;
  slatWood?: WoodSpecies;
  onGoToStrengthTab?: () => void;
}

export const DimensionInputs: React.FC<DimensionInputsProps> = ({
  config,
  onChange,
  metrics,
  ventilation,
  frameWood,
  slatWood,
  onGoToStrengthTab,
}) => {
  const handlePresetSelect = (size: typeof STANDARD_MATTRESS_SIZES[0]) => {
    onChange({
      mattressWidth: size.width,
      mattressLength: size.length,
      hasCenterBeam: size.hasCenterBeam,
      name: size.label.split('(')[0].trim(),
    });
  };

  const calculateSittingHeight = () => {
    // Istumakorkeus
    if (config.constructionStyle === 'top_mounted') {
      return config.legHeight + config.frameHeight + config.slatThickness + config.mattressThickness;
    }
    return config.legHeight + (config.frameHeight - config.recessDepth) + config.mattressThickness;
  };

  return (
    <div className="space-y-6">
      {/* Runkorakenne & Säleiden asennustapa */}
      <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-stone-900 font-semibold text-sm">
            <Layers className="w-4 h-4 text-amber-700" />
            <span>Runkorakenne &amp; Säleasennus</span>
          </div>
          <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-amber-100/80 text-amber-900">
            Valitse rakennustapa
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Vaihtoehto A: Upotettu kaukalo */}
          <button
            type="button"
            onClick={() => onChange({ constructionStyle: 'recessed' })}
            className={`p-4 rounded-xl border text-left transition-all relative ${
              config.constructionStyle !== 'top_mounted'
                ? 'border-amber-700 bg-amber-50/70 ring-1 ring-amber-700 shadow-xs'
                : 'border-stone-200 bg-stone-50/50 hover:border-amber-300 hover:bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-sm text-stone-900">Upotettu kaukalo (Perinteinen)</span>
              {config.constructionStyle !== 'top_mounted' && (
                <span className="w-2.5 h-2.5 rounded-full bg-amber-600"></span>
              )}
            </div>
            <p className="text-xs text-stone-600 leading-relaxed mb-2">
              Sivulaitojen sisäpintaan asennetaan kannatinrimat. Säleet ja keskipalkki ovat kehyksen sisäpuolella ja patja uppoaa kehykseen reunojen suojaan.
            </p>
            <div className="text-[11px] font-medium text-amber-900 flex items-center gap-1.5 pt-1 border-t border-amber-200/60">
              <span>• Vaatii kannatinrimat</span>
              <span>• Säädettävä upotussyvyys</span>
            </div>
          </button>

          {/* Vaihtoehto B: Tasarunko / Säleet laitojen ja keskipalkin päällä */}
          <button
            type="button"
            onClick={() => onChange({ constructionStyle: 'top_mounted', hasCenterBeam: true })}
            className={`p-4 rounded-xl border text-left transition-all relative ${
              config.constructionStyle === 'top_mounted'
                ? 'border-amber-700 bg-amber-50/70 ring-1 ring-amber-700 shadow-xs'
                : 'border-stone-200 bg-stone-50/50 hover:border-amber-300 hover:bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-sm text-stone-900">Tasarunko (Säleet laitojen &amp; keskipalkin päällä)</span>
              {config.constructionStyle === 'top_mounted' && (
                <span className="w-2.5 h-2.5 rounded-full bg-amber-600"></span>
              )}
            </div>
            <p className="text-xs text-stone-600 leading-relaxed mb-2">
              Keskipalkki asennetaan samaan tasoon laitojen yläreunan kanssa. Säleet kiinnitetään suoraan kaikkien niiden päälle. Patja lepää tason päällä.
            </p>
            <div className="text-[11px] font-medium text-emerald-800 flex items-center gap-1.5 pt-1 border-t border-amber-200/60">
              <span>✓ Ei erillisiä kannatinrimoja</span>
              <span>✓ Suora kantavuus laitoihin</span>
            </div>
          </button>
        </div>
      </div>

      {/* Vakiokokojen pikavalinta */}
      <div>
        <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-2">
          Vakiokokoiset patjamitat (cm)
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {STANDARD_MATTRESS_SIZES.map((size) => {
            const isSelected =
              config.mattressWidth === size.width && config.mattressLength === size.length;
            return (
              <button
                key={size.label}
                type="button"
                onClick={() => handlePresetSelect(size)}
                className={`text-left p-2.5 rounded-lg border text-xs font-medium transition-all ${
                  isSelected
                    ? 'border-amber-700 bg-amber-50/80 text-amber-950 font-semibold shadow-xs'
                    : 'border-stone-200 bg-white text-stone-700 hover:border-amber-400 hover:bg-stone-50'
                }`}
              >
                <div className="text-stone-900 font-semibold">
                  {size.width / 10} × {size.length / 10} cm
                </div>
                <div className="text-[10px] text-stone-500 truncate">{size.label.split('(')[0]}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 1. Patjan ja upotuksen mitat */}
      <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
        <div className="flex items-center gap-2 mb-4 text-stone-900 font-semibold text-sm">
          <BedDouble className="w-4 h-4 text-amber-700" />
          <span>1. Patja &amp; Upotussyvyys</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs text-stone-600 mb-1">
              Patjan leveys (mm)
            </label>
            <div className="relative">
              <input
                type="number"
                min="600"
                max="2400"
                step="10"
                value={config.mattressWidth}
                onChange={(e) => onChange({ mattressWidth: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 font-mono"
              />
              <span className="absolute right-3 top-2 text-xs text-stone-400">mm</span>
            </div>
            <p className="text-[11px] text-stone-400 mt-1">{(config.mattressWidth / 10).toFixed(0)} cm</p>
          </div>

          <div>
            <label className="block text-xs text-stone-600 mb-1">
              Patjan pituus (mm)
            </label>
            <div className="relative">
              <input
                type="number"
                min="1600"
                max="2400"
                step="10"
                value={config.mattressLength}
                onChange={(e) => onChange({ mattressLength: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 font-mono"
              />
              <span className="absolute right-3 top-2 text-xs text-stone-400">mm</span>
            </div>
            <p className="text-[11px] text-stone-400 mt-1">{(config.mattressLength / 10).toFixed(0)} cm</p>
          </div>

          <div>
            <label className="block text-xs text-stone-600 mb-1">
              Patjan paksuus (mm)
            </label>
            <div className="relative">
              <input
                type="number"
                min="100"
                max="400"
                step="10"
                value={config.mattressThickness}
                onChange={(e) => onChange({ mattressThickness: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 font-mono"
              />
              <span className="absolute right-3 top-2 text-xs text-stone-400">mm</span>
            </div>
            <p className="text-[11px] text-stone-400 mt-1">Tyypillisesti 180–250 mm</p>
          </div>

          <div>
            <label className="block text-xs text-stone-600 mb-1">
              {config.constructionStyle === 'top_mounted' ? 'Tasarungon käyntivara patjaan (mm)' : 'Upotussyvyys (mm)'}
            </label>
            {config.constructionStyle === 'top_mounted' ? (
              <div className="space-y-1.5">
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="60"
                    step="5"
                    value={config.topMountedClearance ?? 10}
                    onChange={(e) => onChange({ topMountedClearance: Math.max(0, Number(e.target.value)) })}
                    className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 font-mono"
                  />
                  <span className="absolute right-3 top-2 text-xs text-stone-400">mm</span>
                </div>
                <div className="flex gap-1.5">
                  {[
                    { label: '0 mm (Tasan)', val: 0 },
                    { label: '10 mm (1 cm suositus)', val: 10 },
                    { label: '20 mm (2 cm)', val: 20 },
                  ].map((p) => (
                    <button
                      key={p.val}
                      type="button"
                      onClick={() => onChange({ topMountedClearance: p.val })}
                      className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                        (config.topMountedClearance ?? 10) === p.val
                          ? 'bg-amber-100 text-amber-900 border-amber-300 font-semibold'
                          : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="number"
                  min="20"
                  max={Math.min(180, config.frameHeight - 30)}
                  step="5"
                  value={config.recessDepth}
                  onChange={(e) => onChange({ recessDepth: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 font-mono"
                />
                <span className="absolute right-3 top-2 text-xs text-stone-400">mm</span>
              </div>
            )}
            <p className="text-[11px] text-stone-400 mt-1">
              {config.constructionStyle === 'top_mounted'
                ? `10 mm käyntivara (5 mm/puoli) tekee petauksesta helppoa ilman turhaa leveyttä.`
                : `Patja nousee reunasta ${config.mattressThickness - config.recessDepth} mm`}
            </p>
          </div>
        </div>

        {/* Ulkomitat ja istumakorkeuden yhteenvetopalkki */}
        <div className="mt-4 p-3 bg-stone-50 rounded-lg space-y-2 border border-stone-200/70 text-xs text-stone-600">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Ruler className="w-3.5 h-3.5 text-stone-500" />
              <span>Sängyn valmiit ulkomitat:</span>
              <span className="font-bold text-stone-900 font-mono">
                {config.constructionStyle === 'top_mounted'
                  ? `${config.mattressWidth + (config.topMountedClearance ?? 10)} × ${config.mattressLength + (config.topMountedClearance ?? 10)} mm (${(config.mattressWidth + (config.topMountedClearance ?? 10)) / 10} × ${(config.mattressLength + (config.topMountedClearance ?? 10)) / 10} cm)`
                  : `${config.mattressWidth + 2 * config.frameThickness + 10} × ${config.mattressLength + 2 * config.frameThickness + 10} mm (${(config.mattressWidth + 2 * config.frameThickness + 10) / 10} × ${(config.mattressLength + 2 * config.frameThickness + 10) / 10} cm)`}
              </span>
            </div>
            <div className="text-[11px] text-amber-900 bg-amber-100/60 px-2 py-0.5 rounded">
              {config.constructionStyle === 'top_mounted'
                ? `Tasarunko: patja ${config.mattressWidth / 10} × ${config.mattressLength / 10} cm + käyntivara ${config.topMountedClearance ?? 10} mm`
                : `Upotettu: patja + 10 mm välys + 2×${config.frameThickness} mm laidat`}
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-stone-200/50">
            <div className="flex items-center gap-2">
              <span>Kokonaisistumakorkeus:</span>
              <span className="font-bold text-stone-900 font-mono">{calculateSittingHeight()} mm ({Math.round(calculateSittingHeight() / 10)} cm)</span>
            </div>
            <div className="text-[11px] text-stone-500">
              Ergonominen vuodekorkeus: 45–60 cm
            </div>
          </div>
        </div>
      </div>

      {/* 2. Sängyn runko & jalat */}
      <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
        <div className="flex items-center gap-2 mb-4 text-stone-900 font-semibold text-sm">
          <Sliders className="w-4 h-4 text-amber-700" />
          <span>2. Rungon puutavara &amp; Jalat</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs text-stone-600 mb-1">
              Sivulautojen korkeus (mm)
            </label>
            <div className="relative">
              <input
                type="number"
                min="120"
                max="300"
                step="5"
                value={config.frameHeight}
                onChange={(e) => onChange({ frameHeight: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 font-mono"
              />
              <span className="absolute right-3 top-2 text-xs text-stone-400">mm</span>
            </div>
            <p className="text-[11px] text-stone-400 mt-1">Sahatavara 145, 170, 195 tai 220 mm</p>
          </div>

          <div>
            <label className="block text-xs text-stone-600 mb-1">
              Sivulautojen paksuus (mm)
            </label>
            <div className="relative">
              <input
                type="number"
                min="20"
                max="60"
                step="2"
                value={config.frameThickness}
                onChange={(e) => onChange({ frameThickness: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 font-mono"
              />
              <span className="absolute right-3 top-2 text-xs text-stone-400">mm</span>
            </div>
            <p className="text-[11px] text-stone-400 mt-1">Yleensä 28, 32 tai 45 mm</p>
          </div>

          <div>
            <label className="block text-xs text-stone-600 mb-1">
              Jalkojen vapaa korkeus (mm)
            </label>
            <div className="relative">
              <input
                type="number"
                min="100"
                max="500"
                step="10"
                value={config.legHeight}
                onChange={(e) => onChange({ legHeight: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 font-mono"
              />
              <span className="absolute right-3 top-2 text-xs text-stone-400">mm</span>
            </div>
            <p className="text-[11px] text-stone-400 mt-1">Imurin maavara vähintään 150 mm</p>
          </div>

          <div>
            <label className="block text-xs text-stone-600 mb-1">
              Kulmajalkojen poikkileikkaus
            </label>
            <div className="relative">
              <select
                value={config.legSection}
                onChange={(e) => onChange({ legSection: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 font-mono bg-white"
              >
                <option value={45}>45 × 45 mm (Kevyt)</option>
                <option value={70}>70 × 70 mm (Vakiokoko)</option>
                <option value={90}>90 × 90 mm (Tukeva massiivi)</option>
                <option value={100}>100 × 100 mm (Järeä rustiikki)</option>
              </select>
            </div>
            <p className="text-[11px] text-stone-400 mt-1">Neliöpuutolppa kulmiin</p>
          </div>

          {/* Jalkojen asennustapa ja sisäänveto */}
          <div className="col-span-full border-t border-stone-200/60 pt-3 mt-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Jalkojen sijoitus &amp; asennustapa
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => onChange({ legPlacement: 'under_frame' })}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      (config.legPlacement ?? 'under_frame') === 'under_frame'
                        ? 'bg-amber-50/80 border-amber-300 ring-1 ring-amber-400/50'
                        : 'bg-white border-stone-200 hover:bg-stone-50 text-stone-700'
                    }`}
                  >
                    <div className="text-xs font-semibold text-stone-900 flex items-center gap-1">
                      <span>Rungon alle</span>
                      {(config.legPlacement ?? 'under_frame') === 'under_frame' && (
                        <span className="text-[10px] text-amber-800 bg-amber-100 px-1 rounded font-normal">Valittu</span>
                      )}
                    </div>
                    <div className="text-[11px] text-stone-500 mt-0.5 leading-tight">
                      Runko lepää jalkojen päällä. Jalan pituus = maavara ({config.legHeight} mm).
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => onChange({ legPlacement: 'corner_post' })}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      config.legPlacement === 'corner_post'
                        ? 'bg-amber-50/80 border-amber-300 ring-1 ring-amber-400/50'
                        : 'bg-white border-stone-200 hover:bg-stone-50 text-stone-700'
                    }`}
                  >
                    <div className="text-xs font-semibold text-stone-900 flex items-center gap-1">
                      <span>Kulmatolppa</span>
                      {config.legPlacement === 'corner_post' && (
                        <span className="text-[10px] text-amber-800 bg-amber-100 px-1 rounded font-normal">Valittu</span>
                      )}
                    </div>
                    <div className="text-[11px] text-stone-500 mt-0.5 leading-tight">
                      Nousee rungon sisäkulmaan ({config.legHeight + config.frameHeight - 15} mm).
                    </div>
                  </button>
                </div>
              </div>

              {(config.legPlacement ?? 'under_frame') === 'under_frame' && (
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Jalkojen sisäänveto ulkoreunasta (mm)
                  </label>
                  <div className="space-y-1.5">
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="80"
                        step="5"
                        value={config.legInset ?? 0}
                        onChange={(e) => onChange({ legInset: Math.max(0, Number(e.target.value)) })}
                        className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 font-mono"
                      />
                      <span className="absolute right-3 top-2 text-xs text-stone-400">mm</span>
                    </div>
                    <div className="flex gap-1.5">
                      {[
                        { label: '0 mm (Tasan reunaan)', val: 0 },
                        { label: '20 mm (Pieni varvassuoja)', val: 20 },
                        { label: '40 mm (Varvasystävällinen)', val: 40 },
                      ].map((p) => (
                        <button
                          key={p.val}
                          type="button"
                          onClick={() => onChange({ legInset: p.val })}
                          className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                            (config.legInset ?? 0) === p.val
                              ? 'bg-amber-100 text-amber-900 border-amber-300 font-semibold'
                              : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <p className="text-[11px] text-stone-400 mt-1">
                    0 mm = jalka tasan rungon ulkoreunan alla. Sisäänveto estää varpaiden kolhimisen.
                  </p>
                </div>
              )}
            </div>
          </div>

          {metrics && (
            <div className="col-span-full bg-stone-50 p-2.5 rounded-lg border border-stone-200 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-stone-800">Sivulaidan lujuus istuttaessa:</span>
                <span className="text-stone-600 font-mono">
                  Taipuma {metrics.sideRailDeflectionMm} mm / max {metrics.sideRailAllowableDeflectionMm} mm
                </span>
                <span className="text-stone-500 font-mono text-[11px]">
                  (Varmuus {metrics.sideRailSafetyFactor}×, max kuorma {metrics.sideRailMaxPointLoadKg ?? 450} kg)
                </span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                metrics.sideRailStatus === 'safe'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}>
                {metrics.sideRailStatus === 'safe' ? '✓ Sivulauta tukeva' : '⚠ Tarkista laudan korkeus'}
              </span>
            </div>
          )}
        </div>

        {/* Keskipalkin asetukset */}
        <div className="mt-5 pt-4 border-t border-stone-100">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-xs font-semibold text-stone-800">
                Pituussuuntainen keskipalkki
              </div>
              <div className="text-[11px] text-stone-500">
                Puolittaa säleiden jännevälin ja lisää kestävyyttä (suositellaan leveydelle ≥ 120 cm)
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.hasCenterBeam}
                onChange={(e) => onChange({ hasCenterBeam: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-700"></div>
            </label>
          </div>

          {config.hasCenterBeam && (
            <div className="space-y-2">
              {config.constructionStyle === 'top_mounted' && (
                <div className="text-[11px] bg-amber-100/70 text-amber-900 px-3 py-1.5 rounded-lg border border-amber-200 flex items-center gap-1.5">
                  <span className="font-bold">Tasarakenne:</span>
                  <span>Keskipalkin yläpinta on samalla korolla sivulautojen kanssa. Säleet asennetaan suoraan laitojen ja keskipalkin päälle.</span>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-amber-50/40 p-3 rounded-lg border border-amber-100">
                <div>
                  <label className="block text-[11px] text-stone-600 mb-1">
                    Keskipalkin poikkileikkaus
                  </label>
                  <div className="text-xs font-mono font-medium text-stone-800">
                    {config.centerBeamWidth} × {config.centerBeamHeight} mm (C24 soiro)
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-stone-600 mb-1">
                    Keskitukijalat lattiaan
                  </label>
                  <select
                    value={config.centerLegCount}
                    onChange={(e) => onChange({ centerLegCount: Number(e.target.value) })}
                    className="w-full px-2 py-1 text-xs border border-stone-300 rounded bg-white font-mono"
                  >
                    <option value={0}>0 kpl (Ei tukijalkaa)</option>
                    <option value={1}>1 kpl (Sängyn keskipisteessä)</option>
                    <option value={2}>2 kpl (Kolmasosapisteissä)</option>
                  </select>
                </div>

                <div className="text-[11px] text-stone-600 flex items-center">
                  {config.centerLegCount > 0 ? (
                    <span className="text-emerald-800 font-medium">✓ Erinomainen: Keskipalkki ei taivu</span>
                  ) : (
                    <span className="text-amber-800 font-medium">Suositus: Lisää vähintään 1 tukijalka</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Pohjasäleikön & Tuuletusrakojen mitoitus */}
      <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2 text-stone-900 font-semibold text-sm">
            <Layers className="w-4 h-4 text-amber-700" />
            <span>3. Pohjasäleet &amp; Tuuletusraot</span>
          </div>
          {metrics && (
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium border flex items-center gap-1 ${
              metrics.slatStatus === 'safe'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : metrics.slatStatus === 'warning'
                ? 'bg-amber-50 text-amber-800 border-amber-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}>
              {metrics.slatStatus === 'safe' ? '✓ Kestävä säle' : metrics.slatStatus === 'warning' ? '⚠ Huomioi taipuma' : '⛔ Murtumisriski'}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-stone-700">
                Säleen paksuus (mm)
              </label>
              <span className="text-[10px] text-amber-800 font-medium">Kriittinen lujuudelle</span>
            </div>
            <div className="relative">
              <input
                type="number"
                min="12"
                max="45"
                step="1"
                value={config.slatThickness}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (!isNaN(val)) onChange({ slatThickness: val });
                }}
                className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 font-mono font-bold text-stone-900 bg-amber-50/20"
              />
              <span className="absolute right-3 top-2 text-xs text-stone-400">mm</span>
            </div>
            {/* Pikanapit yleisimmille sälepituuksille */}
            <div className="flex items-center gap-1 mt-1.5 flex-wrap">
              {[18, 21, 24, 28, 32].map((th) => (
                <button
                  key={th}
                  type="button"
                  onClick={() => onChange({ slatThickness: th })}
                  className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                    config.slatThickness === th
                      ? 'bg-amber-800 text-white border-amber-800 font-bold shadow-xs'
                      : 'bg-stone-50 hover:bg-stone-100 text-stone-600 border-stone-200'
                  }`}
                >
                  {th} mm
                </button>
              ))}
            </div>
            <p className="text-[11px] text-stone-500 mt-1">Jäykkyys kasvaa paksuuden kuutiossa (h³)</p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-stone-700">
                Säleen leveys (mm)
              </label>
              <span className="text-[10px] text-stone-400">Standardi lauta</span>
            </div>
            <div className="relative">
              <input
                type="number"
                min="40"
                max="140"
                step="5"
                value={config.slatWidth}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (!isNaN(val)) onChange({ slatWidth: val });
                }}
                className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 font-mono"
              />
              <span className="absolute right-3 top-2 text-xs text-stone-400">mm</span>
            </div>
            <div className="flex items-center gap-1 mt-1.5 flex-wrap">
              {[70, 95, 120].map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => onChange({ slatWidth: w })}
                  className={`text-[10px] px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                    config.slatWidth === w
                      ? 'bg-amber-800 text-white border-amber-800 font-bold shadow-xs'
                      : 'bg-stone-50 hover:bg-stone-100 text-stone-600 border-stone-200'
                  }`}
                >
                  {w} mm
                </button>
              ))}
            </div>
            <p className="text-[11px] text-stone-400 mt-1">Yleensä 70 tai 95 mm lauta</p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-stone-700">
                Tavoiteltu tuuletusrako (mm)
              </label>
              <span className="text-[10px] text-stone-400">Patjan hengittävyys</span>
            </div>
            <div className="relative">
              <input
                type="number"
                min="20"
                max="80"
                step="5"
                value={config.targetSlatGap}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (!isNaN(val)) onChange({ targetSlatGap: val });
                }}
                className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 font-mono"
              />
              <span className="absolute right-3 top-2 text-xs text-stone-400">mm</span>
            </div>
            <div className="flex items-center gap-1 mt-1.5 flex-wrap">
              {[30, 40, 50].map((gap) => (
                <button
                  key={gap}
                  type="button"
                  onClick={() => onChange({ targetSlatGap: gap })}
                  className={`text-[10px] px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                    config.targetSlatGap === gap
                      ? 'bg-amber-800 text-white border-amber-800 font-bold shadow-xs'
                      : 'bg-stone-50 hover:bg-stone-100 text-stone-600 border-stone-200'
                  }`}
                >
                  {gap} mm
                </button>
              ))}
            </div>
            <p className="text-[11px] text-stone-400 mt-1">
              Toteutuva rako: <strong className="text-stone-700 font-mono">{ventilation?.actualGapMm ?? config.targetSlatGap} mm</strong> ({ventilation?.slatCount ?? 0} kpl säleitä)
            </p>
          </div>
        </div>

        {/* REAALIAIKAINEN KESTÄVYYSLASKELMA SÄLEILLE */}
        {metrics && (
          <div className="mt-5 pt-4 border-t border-stone-200">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-amber-700" />
                <span className="text-xs font-bold text-stone-900 uppercase tracking-wide">
                  Reaaliaikainen säleiden kestävyyslaskelma ({config.slatThickness} × {config.slatWidth} mm)
                </span>
              </div>
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-[11px] font-medium text-stone-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  Jänneväli L: <strong className="text-amber-950 font-bold">{metrics.slatSpanMm} mm</strong>
                  {metrics.slatClearSpanMm && <span className="text-stone-500 font-normal ml-1">(vapaa {metrics.slatClearSpanMm} mm)</span>}
                  {config.hasCenterBeam ? ' • Keskipalkki puolittaa' : ' • Ei keskipalkkia'}
                </span>
                <span className="text-[11px] font-medium text-stone-600 bg-stone-100 px-2 py-0.5 rounded border border-stone-200">
                  Materiaali: <strong className="text-stone-900">{slatWood?.nameFi ? slatWood.nameFi.split('(')[0] : 'Koivu'}</strong> ({slatWood?.bendingStrength ?? 38} MPa)
                </span>
                {['pine_c24', 'birch', 'oak', 'ash'].map((wId) => {
                  const w = WOOD_SPECIES.find((item) => item.id === wId);
                  if (!w) return null;
                  const isCurrent = (slatWood?.id ?? config.slatWoodSpeciesId) === w.id;
                  return (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => onChange({ slatWoodSpeciesId: w.id, useSeparateSlatWood: true })}
                      className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                        isCurrent
                          ? 'bg-amber-800 text-white border-amber-800 font-bold shadow-xs'
                          : 'bg-white hover:bg-stone-100 text-stone-600 border-stone-200'
                      }`}
                      title={`${w.nameFi}: ${w.bendingStrength} MPa`}
                    >
                      {w.nameFi.split('(')[0]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tilabanneri */}
            <div className={`p-3 rounded-lg border text-xs mb-3 flex items-start gap-2.5 transition-colors ${
              metrics.slatStatus === 'safe'
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                : metrics.slatStatus === 'warning'
                ? 'bg-amber-50/90 border-amber-200 text-amber-900'
                : 'bg-rose-50/90 border-rose-200 text-rose-900'
            }`}>
              {metrics.slatStatus === 'safe' ? (
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : metrics.slatStatus === 'warning' ? (
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              ) : (
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <div className="font-semibold text-sm">
                  {metrics.slatStatus === 'safe'
                    ? `✓ Kestää erinomaisesti ${config.pointLoadKg} kg pistekuorman!`
                    : metrics.slatStatus === 'warning'
                    ? `⚠ Huomio: Säle notkuu ${metrics.slatDeflectionMm} mm (sallittu max ${metrics.slatAllowableDeflectionMm} mm)`
                    : `⛔ Varoitus: Säle on alimitoitettu ja saattaa murtua ${config.pointLoadKg} kg pistekuormalla!`}
                </div>
                <div className="text-[11px] opacity-90 mt-0.5">
                  {metrics.slatStatus === 'safe'
                    ? `Taipuma kuormitettuna on vain ${metrics.slatDeflectionMm} mm ja varmuuskerroin ${metrics.slatSafetyFactor}×.`
                    : metrics.slatStatus === 'warning'
                    ? `Käyttöaste ${metrics.slatStressRatio}%. Kasvata säleen paksuutta (esim. 28 mm) vankempaa ja jäykempää rakennetta varten.`
                    : `Käyttöaste ${metrics.slatStressRatio}% ylittää sallitun lujuuden! Valitse vähintään ${Math.max(24, config.slatThickness + 3)} mm paksu säle.`}
                </div>
              </div>
            </div>

            {/* 4 Päämittaria */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-200/80">
                <span className="text-[10px] uppercase tracking-wider text-stone-500 font-semibold block">
                  Säleen Pistekantavuus
                </span>
                <div className="text-base font-bold font-mono text-stone-900 mt-0.5">
                  {metrics.slatMaxPointLoadKg ?? metrics.maxAllowablePointLoadKg} kg
                </div>
                <span className="text-[10px] text-stone-500">Murtoraja & L/200 taipuma</span>
              </div>

              <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-200/80">
                <span className="text-[10px] uppercase tracking-wider text-stone-500 font-semibold block">
                  Taipuma ({config.pointLoadKg} kg)
                </span>
                <div className={`text-base font-bold font-mono mt-0.5 ${
                  metrics.slatDeflectionMm > metrics.slatAllowableDeflectionMm ? 'text-rose-600' : 'text-stone-900'
                }`}>
                  {metrics.slatDeflectionMm} mm
                </div>
                <span className="text-[10px] text-stone-500">
                  Sallittu max {metrics.slatAllowableDeflectionMm} mm ({metrics.slatDeflectionRatio}%)
                </span>
              </div>

              <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-200/80">
                <span className="text-[10px] uppercase tracking-wider text-stone-500 font-semibold block">
                  Taivutusjännitys
                </span>
                <div className="text-base font-bold font-mono text-stone-900 mt-0.5">
                  {metrics.slatStressMPa} MPa
                </div>
                <span className="text-[10px] text-stone-500">
                  Sallittu {metrics.slatAllowableStressMPa} MPa ({metrics.slatStressRatio}%)
                </span>
              </div>

              <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-200/80">
                <span className="text-[10px] uppercase tracking-wider text-stone-500 font-semibold block">
                  Varmuuskerroin
                </span>
                <div className={`text-base font-bold font-mono mt-0.5 ${
                  metrics.slatSafetyFactor >= 1.5 ? 'text-emerald-700' : 'text-amber-700'
                }`}>
                  {metrics.slatSafetyFactor} ×
                </div>
                <span className="text-[10px] text-stone-500">Lujuuteen nähden</span>
              </div>
            </div>

            {/* Visuaalinen taipumapalkki */}
            <div className="mt-3 bg-stone-50 p-2.5 rounded-lg border border-stone-200/80">
              <div className="flex justify-between text-[11px] text-stone-600 mb-1">
                <span>Taipuma suhteessa sallittuun rajaan (L/200 = {metrics.slatAllowableDeflectionMm} mm)</span>
                <span className="font-mono font-semibold">{metrics.slatDeflectionRatio}%</span>
              </div>
              <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden relative">
                <div
                  className={`h-full transition-all duration-300 ${
                    metrics.slatDeflectionRatio > 100
                      ? 'bg-rose-500'
                      : metrics.slatDeflectionRatio > 75
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, metrics.slatDeflectionRatio)}%` }}
                />
              </div>
            </div>

            {/* Vaikutuksen selitys ja siirtymälinkki */}
            <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-stone-500">
              <div>
                💡 Paksuuden vaikutus: <strong className="text-stone-800 font-mono">{config.slatThickness} mm</strong> säle on{' '}
                <strong className="text-stone-800 font-mono">
                  {Math.round((Math.pow(config.slatThickness / 21, 3)) * 100)}%
                </strong>{' '}
                niin jäykkä kuin 21 mm standardilauta.
              </div>
              {onGoToStrengthTab && (
                <button
                  type="button"
                  onClick={onGoToStrengthTab}
                  className="text-amber-800 font-semibold hover:text-amber-950 flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <span>Avaa tarkka Kestävyyslaskuri & Pistekuorman simulointi</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
