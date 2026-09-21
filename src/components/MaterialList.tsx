import React, { useState } from 'react';
import { BOMItem, HardwareItem, WoodSpecies } from '../types';
import { Clipboard, Printer, Download, Check, Wrench, Package, Info, FileSpreadsheet } from 'lucide-react';

interface MaterialListProps {
  items: BOMItem[];
  hardware: HardwareItem[];
  totalVolumeM3: number;
  totalWeightKg: number;
  estimatedCostEur: number;
  frameWood: WoodSpecies;
  slatWood: WoodSpecies;
}

export const MaterialList: React.FC<MaterialListProps> = ({
  items,
  hardware,
  totalVolumeM3,
  totalWeightKg,
  estimatedCostEur,
  frameWood,
  slatWood,
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  const totalRunningMeters = items.reduce((acc, it) => acc + it.totalLengthM, 0);

  const handleCopy = () => {
    let text = `SÄNGYN MATERIAALILISTA & OSTOSLISTA\n`;
    text += `Pääpuulaji: ${frameWood.nameFi}\n`;
    text += `Sälemateriaali: ${slatWood.nameFi}\n`;
    text += `Arvioitu puun tilavuus: ${totalVolumeM3} m³ | Kokonaispaino: ~${totalWeightKg} kg\n\n`;

    text += `SAHATAVARA:\n`;
    items.forEach((item) => {
      text += `- ${item.name}: ${item.count} kpl, ${item.thickness}×${item.width}×${item.length} mm (Yht. ${item.totalLengthM} m, ~${item.weightKg} kg)\n`;
    });

    text += `\nRAUTATAVARA & KIINNIKKEET:\n`;
    hardware.forEach((h) => {
      text += `- ${h.name}: ${h.count} ${h.unit} (${h.purpose})\n`;
    });

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleExportCSV = () => {
    const headers = ['Osa', 'Kategoria', 'Kpl', 'Paksuus (mm)', 'Leveys (mm)', 'Pituus (mm)', 'Yht. pituus (m)', 'Tilavuus (m3)', 'Paino (kg)', 'Puulaji'];
    const rows = items.map((it) => [
      `"${it.name}"`,
      `"${it.category}"`,
      it.count,
      it.thickness,
      it.width,
      it.length,
      it.totalLengthM,
      it.volumeM3,
      it.weightKg,
      `"${it.woodSpeciesName}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sangyn_materiaalilista_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Yhteenvetokortit */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
          <span className="text-[11px] text-stone-500 block uppercase font-medium">Puutavara yht.</span>
          <span className="text-xl font-extrabold text-stone-900 font-mono">{totalRunningMeters.toFixed(1)} m</span>
          <span className="text-[10px] text-stone-400 block mt-0.5">{items.reduce((a, b) => a + b.count, 0)} kappaletta</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
          <span className="text-[11px] text-stone-500 block uppercase font-medium">Puun tilavuus</span>
          <span className="text-xl font-extrabold text-stone-900 font-mono">{totalVolumeM3} m³</span>
          <span className="text-[10px] text-stone-400 block mt-0.5">Nettotilavuus</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
          <span className="text-[11px] text-stone-500 block uppercase font-medium">Rungon arvioitu paino</span>
          <span className="text-xl font-extrabold text-stone-900 font-mono">~{totalWeightKg} kg</span>
          <span className="text-[10px] text-stone-400 block mt-0.5">Kuivatiheyden mukaan</span>
        </div>

        <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200 shadow-xs">
          <span className="text-[11px] text-amber-800 block uppercase font-medium">Arvioitu puukustannus</span>
          <span className="text-xl font-extrabold text-amber-950 font-mono">~{estimatedCostEur} €</span>
          <span className="text-[10px] text-amber-700/80 block mt-0.5">Sis. +15% hukkavaran</span>
        </div>
      </div>

      {/* Sahatavaralista */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-stone-100 flex flex-wrap items-center justify-between gap-3 bg-stone-50/50">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-amber-700" />
            <h3 className="text-sm font-bold text-stone-900">1. Sahatavara ja Puuosat (Määrät &amp; Mitat)</h3>
          </div>

          <div className="flex items-center gap-2 no-print">
            <button
              type="button"
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-xs font-medium text-stone-700 flex items-center gap-1.5 transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Clipboard className="w-3.5 h-3.5" />}
              <span>{copied ? 'Kopioitu!' : 'Kopioi leikepöydälle'}</span>
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3 py-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-xs font-medium text-stone-700 flex items-center gap-1.5 transition-all"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Lataa CSV</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-black text-white text-xs font-medium flex items-center gap-1.5 transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Tulosta</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-700">
            <thead className="bg-stone-100/70 text-stone-600 font-semibold border-b border-stone-200">
              <tr>
                <th className="py-2.5 px-4">Osa</th>
                <th className="py-2.5 px-3">Määrä</th>
                <th className="py-2.5 px-3 font-mono">Paksuus × Leveys × Pituus</th>
                <th className="py-2.5 px-3 font-mono">Yht. metriä</th>
                <th className="py-2.5 px-3 font-mono">Paino</th>
                <th className="py-2.5 px-3">Puulaji</th>
                <th className="py-2.5 px-4 text-stone-500">Käyttötarkoitus / Huomiot</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-normal">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-stone-50/80 transition-colors">
                  <td className="py-3 px-4 font-semibold text-stone-900">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          item.category === 'frame'
                            ? 'bg-amber-600'
                            : item.category === 'slats'
                            ? 'bg-emerald-600'
                            : item.category === 'legs'
                            ? 'bg-stone-800'
                            : 'bg-indigo-600'
                        }`}
                      />
                      <span>{item.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 font-bold text-stone-900 font-mono">{item.count} kpl</td>
                  <td className="py-3 px-3 font-mono font-medium text-stone-800">
                    {item.thickness} × {item.width} × {item.length} mm
                  </td>
                  <td className="py-3 px-3 font-mono text-stone-600">{item.totalLengthM} m</td>
                  <td className="py-3 px-3 font-mono text-stone-600">~{item.weightKg} kg</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded bg-stone-100 text-stone-800 text-[11px] font-medium">
                      {item.woodSpeciesName.split('(')[0]}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-stone-500 text-[11px]">{item.notes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rautatavara ja kiinnikkeet */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-stone-100 flex items-center gap-2 bg-stone-50/50">
          <Wrench className="w-4 h-4 text-amber-700" />
          <h3 className="text-sm font-bold text-stone-900">2. Rautatavara, Helat &amp; Kiinnitystarvikkeet</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-700">
            <thead className="bg-stone-100/70 text-stone-600 font-semibold border-b border-stone-200">
              <tr>
                <th className="py-2.5 px-4">Tarvike / Hela</th>
                <th className="py-2.5 px-4 font-mono">Määrä</th>
                <th className="py-2.5 px-4">Tarkoitus sängyn rakenteessa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {hardware.map((h, i) => (
                <tr key={i} className="hover:bg-stone-50/80 transition-colors">
                  <td className="py-3 px-4 font-medium text-stone-900">{h.name}</td>
                  <td className="py-3 px-4 font-mono font-bold text-amber-900">
                    {h.count} {h.unit}
                  </td>
                  <td className="py-3 px-4 text-stone-500">{h.purpose}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-3 bg-amber-50/40 border-t border-amber-100 text-[11px] text-amber-900 flex items-center gap-2">
          <Info className="w-3.5 h-3.5 shrink-0 text-amber-700" />
          <span>
            Vinkki: Esiporaa aina ruuvinreiät (erityisesti koviin lehtipuihin kuten tammeen tai koivuun) estääksesi puun halkeamisen päistä.
          </span>
        </div>
      </div>
    </div>
  );
};
