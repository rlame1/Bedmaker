import React, { useState } from 'react';
import { WOOD_SPECIES } from '../data/woodSpecies';
import { WoodSpecies } from '../types';
import { TreePine, Check, ShieldCheck, Sparkles, Scale, Info, Layers } from 'lucide-react';

interface MaterialSelectorProps {
  selectedWoodId: string;
  onSelectWood: (id: string) => void;
  slatWoodId?: string;
  onSelectSlatWood?: (id: string) => void;
  useSeparateSlatWood: boolean;
  onToggleSeparateSlatWood: (enable: boolean) => void;
}

export const MaterialSelector: React.FC<MaterialSelectorProps> = ({
  selectedWoodId,
  onSelectWood,
  slatWoodId,
  onSelectSlatWood,
  useSeparateSlatWood,
  onToggleSeparateSlatWood,
}) => {
  const currentFrameWood = WOOD_SPECIES.find((w) => w.id === selectedWoodId) || WOOD_SPECIES[0];
  const currentSlatWood = WOOD_SPECIES.find((w) => w.id === (slatWoodId || selectedWoodId)) || currentFrameWood;

  // Track which wood the user is currently inspecting in the technical profile card
  const [inspectedTarget, setInspectedTarget] = useState<'frame' | 'slat'>(
    useSeparateSlatWood && slatWoodId ? 'slat' : 'frame'
  );

  const displayedWood =
    inspectedTarget === 'slat' && useSeparateSlatWood ? currentSlatWood : currentFrameWood;

  // Laske suhteellinen lujuusero säleen ja rungon välillä
  const strengthDiffPercent = Math.round(
    ((currentSlatWood.bendingStrength - currentFrameWood.bendingStrength) / currentFrameWood.bendingStrength) * 100
  );
  const stiffnessDiffPercent = Math.round(
    ((currentSlatWood.elasticModulus - currentFrameWood.elasticModulus) / currentFrameWood.elasticModulus) * 100
  );

  return (
    <div className="space-y-6">
      {/* 1. Rungon ja jalkojen puumateriaali */}
      <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TreePine className="w-5 h-5 text-amber-700" />
            <div>
              <h3 className="text-sm font-bold text-stone-900">1. Rungon ja jalkojen puumateriaali</h3>
              <p className="text-xs text-stone-500">
                Määrittää sängyn massiivisuuden, sivulaitojen taipuman, pinnan kestävyyden ja ulkonäön
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-md bg-stone-100 text-stone-800 border border-stone-200">
            Valittu: <strong className="text-amber-900">{currentFrameWood.nameFi.split('(')[0]}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {WOOD_SPECIES.map((wood) => {
            const isSelected = wood.id === selectedWoodId;
            return (
              <button
                key={wood.id}
                type="button"
                onClick={() => {
                  onSelectWood(wood.id);
                  setInspectedTarget('frame');
                }}
                className={`text-left p-3.5 rounded-xl border transition-all relative flex flex-col justify-between cursor-pointer ${
                  isSelected
                    ? 'border-amber-700 bg-amber-50/60 ring-2 ring-amber-700/20 shadow-xs'
                    : 'border-stone-200 bg-white hover:border-amber-300 hover:bg-stone-50/80'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-4 h-4 rounded-full border border-stone-300 shadow-2xs inline-block shrink-0"
                        style={{ backgroundColor: wood.colorHex }}
                      />
                      <span className="text-xs font-bold text-stone-900">{wood.nameFi}</span>
                    </div>
                    {isSelected && (
                      <span className="p-0.5 rounded-full bg-amber-700 text-white shrink-0">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-stone-500 mb-3 line-clamp-2">
                    {wood.description}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-1.5 pt-2.5 border-t border-stone-100 text-[10px]">
                  <div className="bg-stone-50 p-1.5 rounded">
                    <span className="text-stone-400 block">Taivutus</span>
                    <span className="font-semibold text-stone-800 font-mono">{wood.bendingStrength} MPa</span>
                  </div>
                  <div className="bg-stone-50 p-1.5 rounded">
                    <span className="text-stone-400 block">Kimmokerroin</span>
                    <span className="font-semibold text-stone-800 font-mono">{(wood.elasticModulus / 1000).toFixed(1)} GPa</span>
                  </div>
                  <div className="bg-stone-50 p-1.5 rounded">
                    <span className="text-stone-400 block">Tiheys</span>
                    <span className="font-semibold text-stone-800 font-mono">{wood.density} kg/m³</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Erillisen sälemateriaalin valinta */}
      <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-700" />
            <div>
              <h4 className="text-sm font-bold text-stone-900">2. Pohjasäleiden puumateriaali</h4>
              <p className="text-xs text-stone-500">
                Säleet joutuvat suurimpaan pistekuormitukseen. Sitkeä koivu tai saarni estää pohjan notkumisen.
              </p>
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs text-stone-800 font-semibold cursor-pointer bg-stone-50 hover:bg-stone-100 px-3 py-1.5 rounded-lg border border-stone-200 transition-colors">
            <input
              type="checkbox"
              checked={useSeparateSlatWood}
              onChange={(e) => {
                const enable = e.target.checked;
                onToggleSeparateSlatWood(enable);
                if (enable) {
                  setInspectedTarget('slat');
                } else {
                  setInspectedTarget('frame');
                }
              }}
              className="rounded border-stone-300 text-amber-700 focus:ring-amber-500 w-4 h-4 cursor-pointer"
            />
            <span>Käytä erillistä sälepuuta</span>
          </label>
        </div>

        {useSeparateSlatWood ? (
          <div>
            <div className="flex items-center justify-between text-xs text-stone-600 mb-2">
              <span>Valitse säleille puulaji (päivittyy heti alla olevaan tekniseen profiiliin ja kestävyyslaskelmiin):</span>
              <span className="font-mono font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-950 border border-amber-200">
                Sälepuu: <strong>{currentSlatWood.nameFi.split('(')[0]}</strong> ({currentSlatWood.bendingStrength} MPa)
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              {WOOD_SPECIES.map((wood) => {
                const isSelected = wood.id === (slatWoodId || selectedWoodId);
                return (
                  <button
                    key={wood.id}
                    type="button"
                    onClick={() => {
                      if (onSelectSlatWood) onSelectSlatWood(wood.id);
                      setInspectedTarget('slat');
                    }}
                    className={`p-3 rounded-xl border text-left text-xs transition-all cursor-pointer relative ${
                      isSelected
                        ? 'border-amber-700 bg-amber-50/80 text-amber-950 font-semibold ring-2 ring-amber-700/20 shadow-xs'
                        : 'border-stone-200 bg-white hover:border-amber-300 hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-stone-900 text-xs">{wood.nameFi.split('(')[0]}</span>
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-stone-300 shrink-0"
                        style={{ backgroundColor: wood.colorHex }}
                      />
                    </div>
                    <div className="text-[11px] text-stone-600 font-mono mb-1">
                      Taivutus: <strong className="text-stone-900">{wood.bendingStrength} MPa</strong>
                    </div>
                    <div className="text-[10px] text-stone-500 font-mono">
                      Jäykkyys: {(wood.elasticModulus / 1000).toFixed(1)} GPa
                    </div>

                    {isSelected && (
                      <div className="mt-2 text-[10px] font-semibold text-amber-800 flex items-center gap-1">
                        <Check className="w-3 h-3 text-amber-700" />
                        <span>Valittu sälepuuksi</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-700 flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="font-semibold text-stone-900 block mb-0.5">
                Yhtenäinen materiaali koko sängyssä
              </span>
              <span className="text-stone-600">
                Pohjasäleet valmistetaan samasta puusta kuin sängyn runko:{' '}
                <strong className="text-amber-900">{currentFrameWood.nameFi}</strong>
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                onToggleSeparateSlatWood(true);
                setInspectedTarget('slat');
              }}
              className="px-3 py-1.5 rounded-lg bg-white border border-stone-300 hover:border-amber-600 text-amber-900 font-semibold text-xs transition-colors shadow-2xs cursor-pointer"
            >
              Ota käyttöön erillinen sitkeä sälepuu (esim. Koivu) →
            </button>
          </div>
        )}
      </div>

      {/* 3. Valitun puun syväanalyysi & puusepän arvio (Reaktiivinen tekninen profiili) */}
      <div className="bg-stone-900 text-stone-100 p-5 sm:p-6 rounded-2xl border border-stone-800 shadow-lg">
        {/* Yläpalkki: Vaihtotabit rungon ja säleiden välillä */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-4 border-b border-stone-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Puumateriaalin tekninen profiili
            </span>
          </div>

          {/* Interaktiiviset välilehdet: Runkopuu / Sälepuu */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setInspectedTarget('frame')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                inspectedTarget === 'frame'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
              }`}
            >
              <span>🌲 Runkopuu:</span>
              <strong className="font-bold">{currentFrameWood.nameFi.split('(')[0]}</strong>
              <span className="text-[10px] opacity-80">({currentFrameWood.bendingStrength} MPa)</span>
            </button>

            {useSeparateSlatWood && (
              <button
                type="button"
                onClick={() => setInspectedTarget('slat')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  inspectedTarget === 'slat'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                }`}
              >
                <span>🪵 Sälepuu:</span>
                <strong className="font-bold">{currentSlatWood.nameFi.split('(')[0]}</strong>
                <span className="text-[10px] opacity-80">({currentSlatWood.bendingStrength} MPa)</span>
              </button>
            )}
          </div>
        </div>

        {/* Kohdemerkintä & Kasvitieteellinen nimi */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-stone-800 text-amber-300 text-xs font-semibold">
            {inspectedTarget === 'slat' && useSeparateSlatWood
              ? 'Tarkastelussa: Pohjasäleiden puumateriaali'
              : 'Tarkastelussa: Sängyn rungon ja jalkojen puumateriaali'}
          </span>
          <span className="text-xs text-stone-400 font-mono italic">{displayedWood.botanicalName}</span>
        </div>

        {/* Nimi ja kuvaus */}
        <h4 className="text-xl font-extrabold text-white mb-2 flex items-center gap-2.5">
          <span
            className="w-4 h-4 rounded-full border border-stone-600 inline-block shrink-0"
            style={{ backgroundColor: displayedWood.colorHex }}
          />
          <span>{displayedWood.nameFi}</span>
        </h4>
        <p className="text-xs text-stone-300 leading-relaxed mb-4 max-w-3xl">{displayedWood.description}</p>

        {/* Vertailuhuomio jos säleille valittu eri puu */}
        {useSeparateSlatWood && currentFrameWood.id !== currentSlatWood.id && (
          <div className="mb-4 p-3 rounded-xl bg-amber-950/40 border border-amber-800/60 text-xs text-amber-200">
            {inspectedTarget === 'slat' ? (
              <div>
                <strong className="text-amber-300 block mb-0.5">
                  Puusepän vertailu: Sälepuu ({currentSlatWood.nameFi.split('(')[0]}) vs Runkopuu ({currentFrameWood.nameFi.split('(')[0]}):
                </strong>
                <span>
                  {strengthDiffPercent >= 0 ? `+${strengthDiffPercent}% suurempi taivutuslujuus` : `${strengthDiffPercent}% taivutuslujuus`} ja{' '}
                  {stiffnessDiffPercent >= 0 ? `+${stiffnessDiffPercent}% suurempi jäykkyys (kimmokerroin)` : `${stiffnessDiffPercent}% jäykkyys`}.{' '}
                  Koivun tai saarnen suuri sitkeys estää pohjasäleitä notkumasta aikuisen astuessa polvella tai hypätessä sängylle.
                </span>
              </div>
            ) : (
              <div>
                <strong className="text-amber-300 block mb-0.5">
                  Runkopuun ja säleiden materiaalijako:
                </strong>
                <span>
                  Runkoon valittu {currentFrameWood.nameFi.split('(')[0]} antaa kauniin pinnan ja suorat sivulaidat.{' '}
                  Pohjasäleille on valittu erikseen sitkeämpi {currentSlatWood.nameFi.split('(')[0]} ({currentSlatWood.bendingStrength} MPa), joka vastaa varsinaisesta kantavuudesta.
                </span>
              </div>
            )}
          </div>
        )}

        {/* 4 Pääominaisuutta ruudukkona */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs border-t border-stone-800 pt-4">
          <div className="bg-stone-800/60 p-3 rounded-xl border border-stone-800">
            <span className="text-stone-400 text-[11px] block">Taivutuslujuus (f_m,k)</span>
            <span className="text-white font-bold text-base font-mono">{displayedWood.bendingStrength} N/mm²</span>
            <span className="text-[10px] text-stone-500 block mt-0.5">Eurocode 5 mitoitusarvo</span>
          </div>
          <div className="bg-stone-800/60 p-3 rounded-xl border border-stone-800">
            <span className="text-stone-400 text-[11px] block">Kimmokerroin (E_0,mean)</span>
            <span className="text-white font-bold text-base font-mono">{displayedWood.elasticModulus} MPa</span>
            <span className="text-[10px] text-stone-500 block mt-0.5">Määrittää taipuman</span>
          </div>
          <div className="bg-stone-800/60 p-3 rounded-xl border border-stone-800">
            <span className="text-stone-400 text-[11px] block">Kuivatiheys</span>
            <span className="text-white font-bold text-base font-mono">{displayedWood.density} kg/m³</span>
            <span className="text-[10px] text-stone-500 block mt-0.5">Sängyn kokonaispainoon</span>
          </div>
          <div className="bg-stone-800/60 p-3 rounded-xl border border-stone-800">
            <span className="text-stone-400 text-[11px] block">Arvioitu raakapuuhinta</span>
            <span className="text-amber-300 font-bold text-base font-mono">~{displayedWood.approxPricePerM3} €/m³</span>
            <span className="text-[10px] text-stone-500 block mt-0.5">Höylätty puutavara</span>
          </div>
        </div>

        {/* Vahvuudet ja Huomioitavaa */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-stone-800 text-xs">
          <div className="bg-stone-800/40 p-3.5 rounded-xl border border-stone-800">
            <span className="text-emerald-400 font-bold block mb-2 flex items-center gap-1.5">
              <span>✓</span> Vahvuudet puusepäntyössä:
            </span>
            <ul className="space-y-1.5 text-stone-300">
              {displayedWood.pros.map((p, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-emerald-400 shrink-0 font-bold">•</span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-stone-800/40 p-3.5 rounded-xl border border-stone-800">
            <span className="text-amber-400 font-bold block mb-2 flex items-center gap-1.5">
              <span>!</span> Huomioitavaa työstössä:
            </span>
            <ul className="space-y-1.5 text-stone-300">
              {displayedWood.cons.map((c, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-amber-400 shrink-0 font-bold">•</span>
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
