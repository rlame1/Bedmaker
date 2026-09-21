import React from 'react';
import { CutPlanResult } from '../types';
import { Scissors, SlidersHorizontal, Info, CheckCircle, AlertCircle } from 'lucide-react';

interface CuttingPlanViewProps {
  plan: CutPlanResult;
  stockLength: number;
  sawKerf: number;
  onChangeStockLength: (length: number) => void;
  onChangeSawKerf: (kerf: number) => void;
}

export const CuttingPlanView: React.FC<CuttingPlanViewProps> = ({
  plan,
  stockLength,
  sawKerf,
  onChangeStockLength,
  onChangeSawKerf,
}) => {
  return (
    <div className="space-y-6">
      {/* Sahausparametrien säätö */}
      <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Scissors className="w-4 h-4 text-amber-700" />
            <div>
              <h3 className="text-sm font-bold text-stone-900">Leikkaussuunnitelma &amp; Hukan Minimointi</h3>
              <p className="text-xs text-stone-500">
                1D-lineaarinen leikkausoptimointi standardeista puutavaratangoista
              </p>
            </div>
          </div>

          {/* Kokonaistilastot */}
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="bg-stone-50 px-3 py-1.5 rounded-lg border border-stone-200 text-stone-700">
              <span className="text-[10px] text-stone-400 block font-sans">Tarvittavat laudat yht.</span>
              <strong className="text-sm text-stone-900 font-bold">{plan.totalStockBoards} kpl</strong>
            </div>

            <div className="bg-stone-50 px-3 py-1.5 rounded-lg border border-stone-200 text-stone-700">
              <span className="text-[10px] text-stone-400 block font-sans">Ostettava pituus</span>
              <strong className="text-sm text-stone-900 font-bold">{plan.totalTimberLengthM} m</strong>
            </div>

            <div className={`px-3 py-1.5 rounded-lg border text-stone-700 ${
              plan.overallWastePercent <= 15 ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}>
              <span className="text-[10px] block font-sans opacity-75">Kokonaishukka</span>
              <strong className="text-sm font-bold">{plan.overallWastePercent}%</strong> ({plan.totalWasteLengthM} m)
            </div>
          </div>
        </div>

        {/* Sahausasetukset */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-stone-100">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Puutavaran vakiopituus kaupassa
            </label>
            <div className="flex items-center gap-2">
              {[2700, 3000, 3600, 4200].map((len) => (
                <button
                  key={len}
                  type="button"
                  onClick={() => onChangeStockLength(len)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition-all ${
                    stockLength === len
                      ? 'border-amber-700 bg-amber-50 font-bold text-amber-950'
                      : 'border-stone-200 bg-white hover:border-amber-300 text-stone-700'
                  }`}
                >
                  {len} mm ({(len / 1000).toFixed(1)}m)
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Sahanterän leikkuuhukka / terän leveys (mm)
            </label>
            <div className="flex items-center gap-2">
              {[2.0, 3.0, 3.5, 4.0].map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => onChangeSawKerf(k)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition-all ${
                    sawKerf === k
                      ? 'border-amber-700 bg-amber-50 font-bold text-amber-950'
                      : 'border-stone-200 bg-white hover:border-amber-300 text-stone-700'
                  }`}
                >
                  {k.toFixed(1)} mm
                </button>
              ))}
            </div>
            <p className="text-[10px] text-stone-400 mt-1">
              Käsisirkkeli / jiirisahan terä vie tyypillisesti 2.5–3.2 mm per sahaus
            </p>
          </div>
        </div>
      </div>

      {/* Leikkausryhmät puun poikkileikkauksen mukaan */}
      <div className="space-y-4">
        {plan.groups.map((group, groupIdx) => (
          <div key={groupIdx} className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div>
                <h4 className="text-sm font-bold text-stone-900">{group.timberName}</h4>
                <p className="text-xs text-stone-500">
                  Poikkileikkaus: <strong className="font-mono">{group.crossSection} mm</strong> | Sahatavaran pituus:{' '}
                  <strong className="font-mono">{group.stockLength} mm</strong>
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="text-stone-600">Tarve: <strong>{group.totalBoardsNeeded} lautaa</strong> ({group.totalPieces} osaa)</span>
                <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                  group.totalWastePercent <= 12 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  Hukka {group.totalWastePercent}%
                </span>
              </div>
            </div>

            {/* Jokainen lauta visuaalisesti */}
            <div className="space-y-3 pt-2">
              {group.boards.map((board) => (
                <div key={board.stockIndex} className="bg-stone-50 p-3 rounded-lg border border-stone-200/80">
                  <div className="flex justify-between items-center text-xs font-mono mb-2 text-stone-600">
                    <span className="font-bold text-stone-800">Lauta #{board.stockIndex} ({board.stockLength} mm)</span>
                    <span>
                      Käytetty: <strong className="text-stone-900">{board.usedLength} mm</strong> | Jäännöspala: <strong className="text-amber-800">{board.wasteLength} mm</strong> ({board.wastePercent}%)
                    </span>
                  </div>

                  {/* Sahauspalkki */}
                  <div className="w-full h-8 bg-stone-200 rounded-md overflow-hidden flex border border-stone-300 relative shadow-2xs">
                    {board.cuts.map((cut, cutIdx) => {
                      const widthPercent = (cut.length / board.stockLength) * 100;
                      return (
                        <div
                          key={cutIdx}
                          style={{
                            width: `${widthPercent}%`,
                            backgroundColor: cut.color,
                          }}
                          className="h-full flex items-center justify-center px-1 text-[11px] font-bold text-white relative group overflow-hidden border-r border-white/60"
                          title={`${cut.name}: ${cut.length} mm`}
                        >
                          <span className="truncate drop-shadow-xs font-mono">
                            {cut.length}mm
                          </span>
                        </div>
                      );
                    })}

                    {/* Jäännöspala (hukka) */}
                    {board.wasteLength > 0 && (
                      <div
                        style={{ width: `${(board.wasteLength / board.stockLength) * 100}%` }}
                        className="h-full bg-repeating-linear bg-[linear-gradient(45deg,#e7e5e4_25%,#f5f5f4_25%,#f5f5f4_50%,#e7e5e4_50%,#e7e5e4_75%,#f5f5f4_75%,#f5f5f4_100%)] bg-[length:12px_12px] flex items-center justify-center text-[10px] font-mono text-stone-500 font-semibold"
                        title={`Hukkapala: ${board.wasteLength} mm`}
                      >
                        {board.wasteLength > 100 ? `${board.wasteLength}mm` : ''}
                      </div>
                    )}
                  </div>

                  {/* Sahattavat osat listana */}
                  <div className="flex flex-wrap gap-2 mt-2 pt-1">
                    {board.cuts.map((cut, cutIdx) => (
                      <div key={cutIdx} className="inline-flex items-center gap-1.5 text-[11px] text-stone-700">
                        <span
                          className="w-2.5 h-2.5 rounded-full inline-block"
                          style={{ backgroundColor: cut.color }}
                        />
                        <span className="font-medium">{cut.name}:</span>
                        <span className="font-mono font-bold text-stone-900">{cut.length} mm</span>
                      </div>
                    ))}
                    {board.wasteLength > 0 && (
                      <div className="inline-flex items-center gap-1 text-[11px] text-stone-400 font-mono">
                        <span>(Jäännöshukka: {board.wasteLength} mm)</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Sahausohjeet puusepälle */}
      <div className="bg-stone-900 text-stone-100 p-5 rounded-xl border border-stone-800">
        <div className="flex items-center gap-2 mb-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
          <Info className="w-4 h-4" />
          <span>Puusepän sahaus- ja työjärjestys</span>
        </div>
        <ol className="list-decimal list-inside space-y-1.5 text-xs text-stone-300 leading-relaxed">
          <li>
            <strong>Tarkista suoruus:</strong> Ennen sahausta tarkista lautojen suoruus katsomalla laudan särmää pitkin. Valitse suorimmat ja oksattomimmat laudat sivulaudoiksi.
          </li>
          <li>
            <strong>Sahaa pisimmät ensin:</strong> Sahaa aina ensin sängyn pisimmät osat (sivulaudat ja päädyt). Mahdolliset ylijäämäpätkät voidaan hyödyntää lyhyempiin tukiin ja jalkoihin.
          </li>
          <li>
            <strong>Pysäytysvaste säleille:</strong> Aseta jiirisahaan tai pöytäsirkkeliin kiinteä pysäytysvaste (stop block) säleiden katkaisua varten. Näin kaikista säleistä tulee millilleen identtisen mittaisia ilman jokaisen erillistä mittaamista.
          </li>
          <li>
            <strong>Hionta ja pyöristys:</strong> Pyöristä säleiden ja sivulautojen yläsärmät kevyesti hiekkapaperilla (R2-R3 mm) ennen kokoamista estääksesi patjakankaan kulumisen ja tikut.
          </li>
        </ol>
      </div>
    </div>
  );
};
