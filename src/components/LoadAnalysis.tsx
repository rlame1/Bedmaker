import React from 'react';
import { BedConfig, StrengthMetrics, VentilationMetrics, WoodSpecies } from '../types';
import { POINT_LOAD_PRESETS, WOOD_SPECIES } from '../data/woodSpecies';
import { ShieldCheck, AlertTriangle, AlertOctagon, ArrowDown, Activity, Wind, Lightbulb, CheckCircle2, ChevronRight, Sliders, Ruler, HelpCircle } from 'lucide-react';

interface LoadAnalysisProps {
  config: BedConfig;
  onChangeConfig: (updated: Partial<BedConfig>) => void;
  metrics: StrengthMetrics;
  ventilation: VentilationMetrics;
  frameWood: WoodSpecies;
  slatWood: WoodSpecies;
}

export const LoadAnalysis: React.FC<LoadAnalysisProps> = ({
  config,
  onChangeConfig,
  metrics,
  ventilation,
  frameWood,
  slatWood,
}) => {
  const getStatusBadge = (status: 'safe' | 'warning' | 'danger') => {
    switch (status) {
      case 'safe':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Turvallinen
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            Huomioitava taipuma
          </span>
        );
      case 'danger':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
            <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
            Alimitoitettu / Murtumisriski
          </span>
        );
    }
  };

  // Visuaalinen taipumakäyrä SVG
  const renderDeflectionCurve = (deflectionMm: number, maxAllowedMm: number, spanMm: number) => {
    const width = 340;
    const height = 90;
    const baselineY = 35;
    // Skaalataan taipuma näkyväksi SVG:ssä
    const visualDeflection = Math.min(45, (deflectionMm / Math.max(1, maxAllowedMm)) * 25);
    const midY = baselineY + visualDeflection;

    const pathData = `M 20 ${baselineY} Q ${width / 2} ${midY * 1.6} ${width - 20} ${baselineY}`;

    return (
      <div className="w-full bg-stone-900 rounded-xl p-3 text-stone-200 overflow-hidden relative">
        <div className="flex justify-between items-center text-[10px] text-stone-400 mb-1">
          <span>
            Jänneväli L = <strong className="text-amber-300 font-mono">{spanMm} mm</strong>
            {metrics.slatClearSpanMm && (
              <span className="text-stone-400 ml-1">(vapaa aukko {metrics.slatClearSpanMm} mm)</span>
            )}
          </span>
          <span className="font-mono text-amber-300">
            Todellinen taipuma: <strong className="text-white text-xs">{deflectionMm} mm</strong> (sallittu {maxAllowedMm} mm)
          </span>
        </div>

        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-20">
          {/* Suora neutraaliakseli */}
          <line
            x1="20"
            y1={baselineY}
            x2={width - 20}
            y2={baselineY}
            stroke="#57534e"
            strokeDasharray="4 4"
            strokeWidth="1.5"
          />

          {/* Taipunut säle */}
          <path
            d={pathData}
            fill="none"
            stroke={metrics.slatStatus === 'danger' ? '#f43f5e' : (metrics.slatStatus === 'warning' ? '#f59e0b' : '#10b981')}
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          {/* Kuorman kohdistuspiste ja nuoli alaspäin */}
          <g transform={`translate(${width / 2}, ${baselineY - 26})`}>
            <line x1="0" y1="0" x2="0" y2="22" stroke="#f59e0b" strokeWidth="2.5" />
            <polygon points="-5,14 0,24 5,14" fill="#f59e0b" />
            <text x="0" y="-3" fill="#fef08a" fontSize="9" fontWeight="bold" textAnchor="middle">
              {config.pointLoadKg} kg
            </text>
          </g>

          {/* Päätytuet */}
          <polygon points="12,35 20,35 16,46" fill="#a8a29e" />
          <polygon points={`${width - 20},35 ${width - 12},35 ${width - 16},46`} fill="#a8a29e" />

          {/* Taipuman mittanuoli */}
          <line x1={width / 2 + 18} y1={baselineY} x2={width / 2 + 18} y2={midY} stroke="#38bdf8" strokeWidth="1" />
          <text x={width / 2 + 24} y={midY - 2} fill="#38bdf8" fontSize="9" fontFamily="monospace">
            δ={deflectionMm}mm
          </text>
        </svg>

        <div className="flex justify-between items-center text-[10px] text-stone-400 mt-1 border-t border-stone-800 pt-1">
          <span>Tuki ({config.constructionStyle === 'top_mounted' ? 'Sivulaita' : 'Kannatinrima'})</span>
          <span className="text-stone-300">Taipumasuhde: {metrics.slatDeflectionRatio}% sallitusta</span>
          <span>Tuki ({config.hasCenterBeam ? 'Keskipalkki' : (config.constructionStyle === 'top_mounted' ? 'Vastakkainen laita' : 'Vastakkainen rima')})</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Pistekuorman asetus */}
      <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-700" />
              <h3 className="text-sm font-bold text-stone-900">Pistekuorman simulointi &amp; Kestävyyslaskenta</h3>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Säädä pistekuormaa (kg) ja näe välittömästi puurakenteen jännitys, taipuma ja murtumisvarmuus
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs text-stone-500 block">Valittu pistekuorma:</span>
            <span className="text-xl font-extrabold text-amber-900 font-mono">
              {config.pointLoadKg} kg <span className="text-xs text-stone-500 font-normal">({(config.pointLoadKg * 0.00981).toFixed(2)} kN)</span>
            </span>
          </div>
        </div>

        {/* Pikavalinnat */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          {POINT_LOAD_PRESETS.map((preset) => {
            const isSelected = config.pointLoadKg === preset.kg;
            return (
              <button
                key={preset.kg}
                type="button"
                onClick={() => onChangeConfig({ pointLoadKg: preset.kg })}
                className={`p-2.5 rounded-lg border text-left text-xs transition-all ${
                  isSelected
                    ? 'border-amber-700 bg-amber-50 text-amber-950 font-semibold'
                    : 'border-stone-200 bg-white hover:border-amber-400'
                }`}
              >
                <div className="font-bold text-stone-900">{preset.kg} kg</div>
                <div className="text-[10px] text-stone-500 line-clamp-1">{preset.label.split('(')[0]}</div>
              </button>
            );
          })}
        </div>

        {/* Liukusäädin */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-stone-500 font-mono">
            <span>80 kg (Erittäin kevyt)</span>
            <span>250 kg (Tavallinen standardi)</span>
            <span>500 kg (Järeä hyppykuorma)</span>
          </div>
          <input
            type="range"
            min="80"
            max="500"
            step="10"
            value={config.pointLoadKg}
            onChange={(e) => onChangeConfig({ pointLoadKg: Number(e.target.value) })}
            className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-amber-700"
          />
        </div>

        {/* Säleen ja rungon mittojen suora kokeilu kestävyyslaskurissa */}
        <div className="mt-5 pt-4 border-t border-stone-200">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-800" />
              <span className="text-xs font-bold text-stone-900 uppercase tracking-wide">
                Kokeile säleen ja rungon mittojen vaikutusta kestävyyteen
              </span>
            </div>
            <span className="text-[11px] text-stone-500">
              Säädä paksuutta ja näe kuinka taipumakäyrä ja jännitys muuttuvat heti
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Säleen paksuus */}
            <div className="bg-amber-50/50 p-3 rounded-lg border border-amber-200/80 shadow-2xs">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-stone-800">Säleen paksuus</label>
                <span className="text-xs font-mono font-bold text-amber-900 bg-white px-2 py-0.5 rounded border border-amber-200">
                  {config.slatThickness} mm
                </span>
              </div>
              <input
                type="range"
                min="14"
                max="35"
                step="1"
                value={config.slatThickness}
                onChange={(e) => onChangeConfig({ slatThickness: Number(e.target.value) })}
                className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-amber-700 my-2"
              />
              <div className="flex items-center gap-1 flex-wrap">
                {[18, 21, 24, 28, 32].map((th) => (
                  <button
                    key={th}
                    type="button"
                    onClick={() => onChangeConfig({ slatThickness: th })}
                    className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                      config.slatThickness === th
                        ? 'bg-amber-800 text-white border-amber-800 font-bold shadow-xs'
                        : 'bg-white hover:bg-stone-100 text-stone-600 border-stone-200'
                    }`}
                  >
                    {th} mm
                  </button>
                ))}
              </div>
            </div>

            {/* Säleen leveys */}
            <div className="bg-amber-50/50 p-3 rounded-lg border border-amber-200/80 shadow-2xs">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-stone-800">Säleen leveys</label>
                <span className="text-xs font-mono font-bold text-amber-900 bg-white px-2 py-0.5 rounded border border-amber-200">
                  {config.slatWidth} mm
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="120"
                step="5"
                value={config.slatWidth}
                onChange={(e) => onChangeConfig({ slatWidth: Number(e.target.value) })}
                className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-amber-700 my-2"
              />
              <div className="flex items-center gap-1 flex-wrap">
                {[70, 95, 120].map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => onChangeConfig({ slatWidth: w })}
                    className={`text-[10px] px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                      config.slatWidth === w
                        ? 'bg-amber-800 text-white border-amber-800 font-bold shadow-xs'
                        : 'bg-white hover:bg-stone-100 text-stone-600 border-stone-200'
                    }`}
                  >
                    {w} mm
                  </button>
                ))}
              </div>
            </div>

            {/* Sivulaudan paksuus */}
            <div className="bg-amber-50/50 p-3 rounded-lg border border-amber-200/80 shadow-2xs">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-stone-800">Sivulaidan paksuus</label>
                <span className="text-xs font-mono font-bold text-amber-900 bg-white px-2 py-0.5 rounded border border-amber-200">
                  {config.frameThickness} mm
                </span>
              </div>
              <input
                type="range"
                min="20"
                max="50"
                step="2"
                value={config.frameThickness}
                onChange={(e) => onChangeConfig({ frameThickness: Number(e.target.value) })}
                className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-amber-700 my-2"
              />
              <div className="flex items-center gap-1 flex-wrap">
                {[28, 32, 45].map((ft) => (
                  <button
                    key={ft}
                    type="button"
                    onClick={() => onChangeConfig({ frameThickness: ft })}
                    className={`text-[10px] px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                      config.frameThickness === ft
                        ? 'bg-amber-800 text-white border-amber-800 font-bold shadow-xs'
                        : 'bg-white hover:bg-stone-100 text-stone-600 border-stone-200'
                    }`}
                  >
                    {ft} mm
                  </button>
                ))}
              </div>
            </div>

            {/* Keskipalkki & Jänneväli L */}
            <div className="bg-amber-50/50 p-3 rounded-lg border border-amber-200/80 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-stone-800">Keskipalkki & Jänneväli</label>
                  <span className="text-xs font-mono font-bold text-amber-900 bg-white px-2 py-0.5 rounded border border-amber-200">
                    L = {metrics.slatSpanMm} mm
                  </span>
                </div>
                <div className="text-[11px] text-stone-600 space-y-0.5 my-1.5">
                  <div className="flex justify-between">
                    <span>Mitoitusväli L_eff:</span>
                    <strong className="font-mono text-stone-900">{metrics.slatSpanMm} mm</strong>
                  </div>
                  {metrics.slatClearSpanMm && (
                    <div className="flex justify-between text-stone-500">
                      <span>Vapaa aukko:</span>
                      <span className="font-mono">{metrics.slatClearSpanMm} mm</span>
                    </div>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => onChangeConfig({ hasCenterBeam: !config.hasCenterBeam })}
                className={`w-full py-1.5 px-2 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer text-center ${
                  config.hasCenterBeam
                    ? 'bg-amber-800 text-white border-amber-800 hover:bg-amber-900 shadow-xs'
                    : 'bg-white hover:bg-stone-100 text-stone-700 border-stone-300'
                }`}
              >
                {config.hasCenterBeam ? '✓ Keskipalkki puolittaa jännevälin' : '+ Ota keskipalkki käyttöön'}
              </button>
            </div>
          </div>

          {/* Puulajin nopea vaihto suoraan kestävyyslaskurissa */}
          <div className="mt-3.5 p-3 bg-amber-50/50 rounded-xl border border-amber-200/80 flex flex-wrap items-center justify-between gap-2.5 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-stone-800">Säleiden puulaji:</span>
              <span className="text-stone-600">
                Nykyinen: <strong className="text-amber-950 font-bold">{slatWood.nameFi}</strong> ({slatWood.bendingStrength} MPa)
              </span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {WOOD_SPECIES.map((wood) => {
                const isSelected = slatWood.id === wood.id;
                return (
                  <button
                    key={wood.id}
                    type="button"
                    onClick={() => onChangeConfig({ slatWoodSpeciesId: wood.id, useSeparateSlatWood: true })}
                    className={`text-xs px-2.5 py-1 rounded-lg border transition-all cursor-pointer font-medium flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-amber-800 text-white border-amber-800 font-bold shadow-xs'
                        : 'bg-white hover:bg-amber-100 text-stone-700 border-stone-200'
                    }`}
                  >
                    <span
                      className="inline-block w-2.5 h-2.5 rounded-full border border-stone-400"
                      style={{ backgroundColor: wood.colorHex }}
                    />
                    <span>{wood.nameFi.split('(')[0]}</span>
                    <span className="text-[10px] opacity-75 font-mono">({wood.bendingStrength} MPa)</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Kokonaistulos & Varoitusbanneri */}
      <div
        className={`p-5 rounded-xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
          metrics.overallStatus === 'safe'
            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
            : metrics.overallStatus === 'warning'
            ? 'bg-amber-50/70 border-amber-200 text-amber-950'
            : 'bg-rose-50/80 border-rose-200 text-rose-950'
        }`}
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5">
            {metrics.overallStatus === 'safe' && <ShieldCheck className="w-6 h-6 text-emerald-600" />}
            {metrics.overallStatus === 'warning' && <AlertTriangle className="w-6 h-6 text-amber-600" />}
            {metrics.overallStatus === 'danger' && <AlertOctagon className="w-6 h-6 text-rose-600" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-sm">
                {metrics.overallStatus === 'safe' && 'Rakenne on vakaa ja turvallinen'}
                {metrics.overallStatus === 'warning' && 'Rakenne vaatii huomiota / notkuu havaittavasti'}
                {metrics.overallStatus === 'danger' && 'Kriittinen kuormitus: Rakenne on alimitoitettu!'}
              </h4>
              {getStatusBadge(metrics.overallStatus)}
            </div>
            <p className="text-xs mt-1 opacity-90">
              Suurin turvallinen pistekuorma nykyisellä puulla ({slatWood.nameFi}) ja mitoituksella on{' '}
              <strong className="font-mono font-bold">{metrics.maxAllowablePointLoadKg} kg</strong>.
              Sängyn tasainen kokonaiskantavuus on jopa{' '}
              <strong className="font-mono font-bold">{metrics.totalBedCapacityKg} kg</strong>.
            </p>
          </div>
        </div>

        <div className="text-right whitespace-nowrap self-end md:self-center">
          <span className="text-[11px] block opacity-75">Varmuuskerroin</span>
          <span className="text-2xl font-black font-mono">
            {metrics.slatSafetyFactor} ×
          </span>
        </div>
      </div>

      {/* Yksityiskohtainen kestävyysmatriisi */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Säleen kestävyys */}
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-stone-900">Pohjasäleen pistekuorma ({slatWood.nameFi})</span>
              {getStatusBadge(metrics.slatStatus)}
            </div>
            <p className="text-[11px] text-stone-500 mb-3">
              Yksittäisen {config.slatThickness}×{config.slatWidth} mm säleen rasitus jännevälillä {metrics.slatSpanMm} mm
            </p>

            {renderDeflectionCurve(metrics.slatDeflectionMm, metrics.slatAllowableDeflectionMm, metrics.slatSpanMm)}

            <div className="grid grid-cols-2 gap-3 mt-4 text-xs">
              <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-100">
                <span className="text-[10px] text-stone-500 block">Taivutusjännitys / Sallittu</span>
                <span className="font-bold text-stone-900 font-mono">
                  {metrics.slatStressMPa} / {metrics.slatAllowableStressMPa} MPa
                </span>
                <div className="w-full bg-stone-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      metrics.slatStressRatio > 100 ? 'bg-rose-600' : (metrics.slatStressRatio > 80 ? 'bg-amber-500' : 'bg-emerald-600')
                    }`}
                    style={{ width: `${Math.min(100, metrics.slatStressRatio)}%` }}
                  />
                </div>
                <span className="text-[10px] text-stone-400 block mt-1">Käyttöaste: {metrics.slatStressRatio}%</span>
              </div>

              <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-100">
                <span className="text-[10px] text-stone-500 block">Taipuma / Sallittu (L/200)</span>
                <span className="font-bold text-stone-900 font-mono">
                  {metrics.slatDeflectionMm} / {metrics.slatAllowableDeflectionMm} mm
                </span>
                <div className="w-full bg-stone-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      metrics.slatDeflectionRatio > 100 ? 'bg-rose-600' : (metrics.slatDeflectionRatio > 80 ? 'bg-amber-500' : 'bg-emerald-600')
                    }`}
                    style={{ width: `${Math.min(100, metrics.slatDeflectionRatio)}%` }}
                  />
                </div>
                <span className="text-[10px] text-stone-400 block mt-1">Taipumasuhde: {metrics.slatDeflectionRatio}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sivulaidan & Keskipalkin kestävyys */}
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-stone-900">Sivulaidan istumakuorma ({frameWood.nameFi})</span>
              {getStatusBadge(metrics.sideRailStatus)}
            </div>
            <p className="text-[11px] text-stone-500 mb-3">
              Reunapalkki {config.frameThickness}×{config.frameHeight} mm pituudella {metrics.sideRailSpanMm} mm
            </p>

            <div className="p-3 bg-stone-50 rounded-xl border border-stone-100 space-y-3 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-stone-600">Sivulaudan taivuma reunalla istuttaessa:</span>
                <span className="font-bold font-mono text-stone-900">{metrics.sideRailDeflectionMm} mm</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-600">Sivulaudan jännitysaste:</span>
                <span className="font-bold font-mono text-stone-900">{metrics.sideRailStressRatio}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-600">Sivulaidan varmuuskerroin:</span>
                <span className="font-bold font-mono text-emerald-700">{metrics.sideRailSafetyFactor} ×</span>
              </div>

              {config.hasCenterBeam && (
                <div className="pt-2 border-t border-stone-200">
                  <div className="flex justify-between items-center">
                    <span className="text-stone-700 font-medium">Keskipalkin tila:</span>
                    <span className="font-mono text-xs font-bold text-stone-900">
                      {metrics.centerBeamStatus === 'safe' ? '✓ Tukeva & riittävä' : 'Vaatii lisätukea'}
                    </span>
                  </div>
                  {metrics.centerBeamDeflectionMm !== undefined && (
                    <div className="text-[11px] text-stone-500 mt-1">
                      Keskipalkin laskennallinen taipuma: {metrics.centerBeamDeflectionMm} mm
                    </div>
                  )}
                </div>
              )}

              <div className="pt-2 border-t border-stone-200 flex justify-between items-center">
                <span className="text-stone-600">{(config.legPlacement ?? 'under_frame') === 'under_frame' ? 'Jalat (rungon alla)' : 'Kulmatolpat'} ({config.legSection}×{config.legSection} mm) puristus:</span>
                <span className="font-mono font-bold text-emerald-700">Turvallinen ({metrics.legStressMPa} MPa)</span>
              </div>
            </div>
          </div>

          {/* Tuuletusrakojen analyysi */}
          <div className="mt-4 pt-3 border-t border-stone-100">
            <div className="flex items-center gap-1.5 text-xs font-bold text-stone-900 mb-1">
              <Wind className="w-3.5 h-3.5 text-sky-600" />
              <span>Patjan tuuletus &amp; ilmankierto</span>
            </div>
            <div className="flex items-center justify-between text-xs text-stone-600">
              <span>Säleiden välinen rako: <strong className="font-mono text-stone-900">{ventilation.actualGapMm} mm</strong></span>
              <span className="text-stone-500">Avoin ala: {ventilation.ventilationRatioPercent}%</span>
            </div>
            <p className="text-[11px] text-stone-500 mt-1">{ventilation.message}</p>
          </div>
        </div>
      </div>

      {/* Säleiden jännevälin ja tukirakenteen laskentalogiikka */}
      <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-stone-200">
          <div className="flex items-center gap-2">
            <Ruler className="w-5 h-5 text-amber-800" />
            <div>
              <h3 className="text-sm font-bold text-stone-950">
                Pohjasäleiden jännevälin laskentalogiikka (Eurocode 5 &amp; Puurakenteet)
              </h3>
              <p className="text-xs text-stone-500">
                Miten ohjelma määrittää vapaan valoaukon, tehollisen mitoitusjännevälin ja keskipalkin tuennan
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-mono font-bold bg-amber-50 text-amber-900 border border-amber-200 px-2.5 py-1 rounded-md">
              L_eff = {metrics.slatSpanMm} mm
            </span>
            {metrics.slatClearSpanMm && (
              <span className="text-xs font-mono text-stone-600 bg-stone-100 border border-stone-200 px-2.5 py-1 rounded-md">
                L_vapaa = {metrics.slatClearSpanMm} mm
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Geometrinen laskukaava */}
          <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-3">
            <div className="font-semibold text-stone-900 flex items-center justify-between">
              <span>Nykyisen sängyn geometrinen laskelma:</span>
              <span className="text-[11px] font-normal text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded">
                {config.constructionStyle === 'top_mounted' ? 'Tasarunko' : 'Upotettu runko'}
              </span>
            </div>

            <div className="space-y-1.5 text-stone-700">
              <div className="flex justify-between border-b border-stone-200 pb-1">
                <span className="text-stone-500">Patjan nimellisleveys (W):</span>
                <span className="font-mono font-bold">{config.mattressWidth} mm</span>
              </div>

              <div className="flex justify-between border-b border-stone-200 pb-1">
                <span className="text-stone-500">
                  {config.constructionStyle === 'top_mounted' ? 'Reunatuet (sivulaidat):' : 'Reunatuet (kannatinrimat):'}
                </span>
                <span className="font-mono">
                  {config.constructionStyle === 'top_mounted'
                    ? `2 × ${config.frameThickness} mm (laitojen päällä)`
                    : `2 × ${config.slatSupportThickness} mm = ${2 * config.slatSupportThickness} mm`}
                </span>
              </div>

              <div className="flex justify-between border-b border-stone-200 pb-1">
                <span className="text-stone-500">Keskipalkin tuenta:</span>
                <span className="font-mono font-semibold text-stone-900">
                  {config.hasCenterBeam ? `Kyllä (leveys ${config.centerBeamWidth} mm)` : 'Ei keskipalkkia'}
                </span>
              </div>

              {/* Kaava auki kirjoitettuna */}
              <div className="bg-white p-2.5 rounded-lg border border-stone-200 mt-2">
                <div className="text-[11px] font-semibold text-stone-800 mb-1">Vapaa aukkomitta (L_vapaa):</div>
                <div className="font-mono text-stone-700 bg-stone-50 p-1.5 rounded border border-stone-100 text-[11px]">
                  {config.constructionStyle === 'top_mounted' ? (
                    config.hasCenterBeam ? (
                      `(${config.mattressWidth + (config.topMountedClearance ?? 10)} - 2×${config.frameThickness} - ${config.centerBeamWidth}) / 2 = ${metrics.slatClearSpanMm} mm`
                    ) : (
                      `${config.mattressWidth + (config.topMountedClearance ?? 10)} - 2×${config.frameThickness} = ${metrics.slatClearSpanMm} mm`
                    )
                  ) : (
                    config.hasCenterBeam ? (
                      `(${config.mattressWidth} - ${config.centerBeamWidth} - ${2 * config.slatSupportThickness}) / 2 = ${metrics.slatClearSpanMm} mm`
                    ) : (
                      `${config.mattressWidth} - ${2 * config.slatSupportThickness} = ${metrics.slatClearSpanMm} mm`
                    )
                  )}
                </div>
                <div className="text-[10px] text-stone-500 mt-1">
                  Puisen säleen vapaa tukeutumaton pituus tukien sisäpintojen välissä.
                </div>
              </div>

              {/* Eurocode 5 tehollinen jänneväli */}
              <div className="bg-amber-50/60 p-2.5 rounded-lg border border-amber-200">
                <div className="text-[11px] font-semibold text-amber-950 mb-0.5">
                  Eurocode 5 mitoitusjänneväli (L_eff):
                </div>
                <div className="font-mono text-amber-950 font-bold text-xs">
                  L_eff = {metrics.slatSpanMm} mm
                </div>
                <div className="text-[10px] text-amber-900/80 mt-1">
                  Eurocode 5 (SFS-EN 1995-1-1) mukaan lujuus- ja taipumalaskelmissa käytetään tukipintojen keskiöiden väliä
                  (L_vapaa + tukien puolikkaat), mikä antaa turvallisen ja standardien mukaisen lujuusarvion.
                </div>
              </div>
            </div>
          </div>

          {/* Fysiikka: Miksi jänneväli on kriittinen */}
          <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-3 flex flex-col justify-between">
            <div>
              <div className="font-semibold text-stone-900 mb-2">
                Fysiikka: Jännevälin eksponentiaalinen vaikutus taipumaan
              </div>

              <div className="space-y-2 text-stone-600">
                <p>
                  Palkkimekaniikassa yksinkertaisesti tuetun säleen taipuma pistekuormalla noudattaa yhtälöä:
                </p>
                <div className="font-mono text-center bg-white p-2 rounded-lg border border-stone-200 text-stone-900 font-bold text-xs">
                  δ = (F · L³) / (48 · E · I)
                </div>
                <p className="text-[11px]">
                  Huomaa, että jänneväli <strong>L on kolmannessa potenssissa (L³)</strong>:
                </p>
                <ul className="space-y-1.5 text-[11px] text-stone-700 bg-white p-2.5 rounded-lg border border-stone-200">
                  <li className="flex items-start gap-1.5">
                    <span className="text-emerald-700 font-bold">✓</span>
                    <span>
                      <strong>Keskipalkin hyöty:</strong> Kun jänneväli puolitetaan (esim. 1500 mm → 750 mm), taipuma pienenee peräti{' '}
                      <strong className="text-emerald-800">8-kertaiseksi</strong> (1/2³ = 1/8 eli vain 12.5% alkuperäisestä)!
                    </span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-amber-700 font-bold">📏</span>
                    <span>
                      <strong>Fyysinen sälepituus (BOM):</strong> Sahauslistan sälepituus lasketaan erikseen sängyn ulko- ja sisämittojen mukaan asennusvälyksillä (2 mm), kun taas lujuuslaskelma käyttää nimenomaan tukien välistä jänneväliä.
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-2 border-t border-stone-200 flex items-center justify-between text-[11px]">
              <span className="text-stone-500">Nykyinen taipuma:</span>
              <span className="font-mono font-bold text-stone-900">
                {metrics.slatDeflectionMm} mm (sallittu {metrics.slatAllowableDeflectionMm} mm)
              </span>
            </div>
          </div>
        </div>
      </div>
      {(metrics.warnings.length > 0 || metrics.recommendations.length > 0) && (
        <div className="bg-stone-900 text-stone-100 p-5 rounded-xl border border-stone-800">
          <div className="flex items-center gap-2 mb-3 text-amber-400 font-bold text-xs uppercase tracking-wider">
            <Lightbulb className="w-4 h-4" />
            <span>Puusepän optimointisuositukset rakenteelle</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {metrics.warnings.length > 0 && (
              <div>
                <span className="font-semibold text-rose-300 block mb-1.5">Havaitut riskikohdat:</span>
                <ul className="space-y-1 text-stone-300">
                  {metrics.warnings.map((w, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-rose-400 font-bold mt-0.5">•</span>
                      <span>{w}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {metrics.recommendations.length > 0 && (
              <div>
                <span className="font-semibold text-emerald-300 block mb-1.5">Toimenpide-ehdotukset:</span>
                <ul className="space-y-1 text-stone-300">
                  {metrics.recommendations.map((r, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold mt-0.5">→</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
