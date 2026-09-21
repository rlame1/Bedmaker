import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { BedConfig, StrengthMetrics, VentilationMetrics, WoodSpecies } from '../types';
import {
  Box,
  Eye,
  EyeOff,
  Maximize2,
  Compass,
  Layers,
  Ruler,
  RotateCw,
  Play,
  Pause,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  Move,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface BedVisualizerProps {
  config: BedConfig;
  frameWood: WoodSpecies;
  slatWood: WoodSpecies;
  metrics: StrengthMetrics;
  ventilation: VentilationMetrics;
}

interface Point3D {
  x: number;
  y: number;
  z: number;
}

interface Box3D {
  id: string;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
  color: string;
  strokeColor?: string;
  opacity?: number;
  label?: string;
}

interface RenderPolygon {
  id: string;
  pointsStr: string;
  avgDepth: number;
  fillColor: string;
  strokeColor: string;
  opacity: number;
}

// Apufunktio värin kirkkauden säätämiseen valaistusta varten
function adjustBrightness(hex: string, factor: number): string {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map((x) => x + x).join('');
  const num = parseInt(c, 16);
  let r = (num >> 16) & 255;
  let g = (num >> 8) & 255;
  let b = num & 255;
  r = Math.min(255, Math.max(0, Math.round(r * factor)));
  g = Math.min(255, Math.max(0, Math.round(g * factor)));
  b = Math.min(255, Math.max(0, Math.round(b * factor)));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export const BedVisualizer: React.FC<BedVisualizerProps> = ({
  config,
  frameWood,
  slatWood,
  metrics,
  ventilation,
}) => {
  const [viewMode, setViewMode] = useState<'3d' | 'top' | 'side'>('3d');
  const [showMattress, setShowMattress] = useState<boolean>(true);
  const [mattressOpacity, setMattressOpacity] = useState<number>(0.5);
  const [showDimensions, setShowDimensions] = useState<boolean>(true);
  const [showLoadArrow, setShowLoadArrow] = useState<boolean>(true);

  // 3D Pyöritystilat
  const [azimuth, setAzimuth] = useState<number>(45); // Vaakakierto 0-360 astetta
  const [elevation, setElevation] = useState<number>(28); // Pystykierto 10-85 astetta
  const [zoom, setZoom] = useState<number>(1.0); // Lähennys/loitonnus
  const [isTurntable, setIsTurntable] = useState<boolean>(false); // Automaattipyöritys
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const lastMousePos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const animFrameRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Mittasuhteet
  const isTopMounted = config.constructionStyle === 'top_mounted';
  const topClearance = config.topMountedClearance ?? 10;
  // Upotetussa laatikossa laidat kiertävät patjaa (+2×paksuus + 10mm).
  // Tasarungossa sänky mitoitetaan patjan koon mukaan + 1 cm käyntivara (10 mm), jolloin
  // patja peittää säleet siististi eikä sängyn reunoille jää 5 cm tyhjiä tasanteita.
  const outerWidth = isTopMounted
    ? config.mattressWidth + topClearance
    : config.mattressWidth + 2 * config.frameThickness + 10;
  const outerLength = isTopMounted
    ? config.mattressLength + topClearance
    : config.mattressLength + 2 * config.frameThickness + 10;
  const sittingHeight =
    isTopMounted
      ? config.legHeight + config.frameHeight + config.slatThickness + config.mattressThickness
      : config.legHeight + (config.frameHeight - config.recessDepth) + config.mattressThickness;

  // Automaattipyöritys (Turntable animation loop)
  useEffect(() => {
    if (!isTurntable || viewMode !== '3d') {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    let lastTime = performance.now();
    const animate = (currentTime: number) => {
      const delta = (currentTime - lastTime) / 1000;
      lastTime = currentTime;
      // Pyöritetään noin 18 astetta sekunnissa
      setAzimuth((prev) => (prev + delta * 18) % 360);
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isTurntable, viewMode]);

  // Hiiripohjainen pyöritys
  const handleMouseDown = (e: React.MouseEvent) => {
    if (viewMode !== '3d') return;
    setIsDragging(true);
    setIsTurntable(false); // Pysäytetään automaattipyöritys käyttäjän tarttuessa kiinni
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || viewMode !== '3d') return;
    const dx = e.clientX - lastMousePos.current.x;
    const dy = e.clientY - lastMousePos.current.y;
    lastMousePos.current = { x: e.clientX, y: e.clientY };

    setAzimuth((prev) => {
      const next = (prev + dx * 0.6) % 360;
      return next < 0 ? next + 360 : next;
    });

    setElevation((prev) => {
      return Math.max(10, Math.min(85, prev - dy * 0.45));
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Kosketusnäyttöpyöritys
  const handleTouchStart = (e: React.TouchEvent) => {
    if (viewMode !== '3d' || e.touches.length !== 1) return;
    setIsDragging(true);
    setIsTurntable(false);
    lastMousePos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || viewMode !== '3d' || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - lastMousePos.current.x;
    const dy = e.touches[0].clientY - lastMousePos.current.y;
    lastMousePos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };

    setAzimuth((prev) => {
      const next = (prev + dx * 0.7) % 360;
      return next < 0 ? next + 360 : next;
    });

    setElevation((prev) => {
      return Math.max(10, Math.min(85, prev - dy * 0.5));
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Rullauszoomaus
  const handleWheel = (e: React.WheelEvent) => {
    if (viewMode !== '3d') return;
    e.preventDefault();
    const delta = e.deltaY * -0.0012;
    setZoom((prev) => Math.max(0.65, Math.min(2.2, prev + delta)));
  };

  // Valmiit katselukulmat
  const setPresetView = (preset: 'iso' | 'front' | 'side' | 'topDown' | 'lowAngle') => {
    setIsTurntable(false);
    if (preset === 'iso') {
      setAzimuth(45);
      setElevation(28);
      setZoom(1.0);
    } else if (preset === 'front') {
      setAzimuth(0);
      setElevation(20);
      setZoom(1.0);
    } else if (preset === 'side') {
      setAzimuth(90);
      setElevation(20);
      setZoom(1.0);
    } else if (preset === 'topDown') {
      setAzimuth(45);
      setElevation(75);
      setZoom(1.0);
    } else if (preset === 'lowAngle') {
      setAzimuth(45);
      setElevation(14);
      setZoom(1.1);
    }
  };

  // 3D-mallinnetut kappaleet (Boxes)
  const boxes = useMemo((): Box3D[] => {
    const list: Box3D[] = [];

    const L = outerLength;
    const W = outerWidth;
    const fT = config.frameThickness;
    const fH = config.frameHeight;
    const legH = config.legHeight;
    const lSec = config.legSection;
    const slatW = config.slatWidth;
    const slatT = config.slatThickness;
    const isTopMounted = config.constructionStyle === 'top_mounted';

    // 1. Jalat (asennus rungon alle)
    const legPlacement = config.legPlacement ?? 'under_frame';
    const isUnderFrame = legPlacement === 'under_frame';
    const legInset = Math.max(0, config.legInset ?? 0);

    // Kun jalat tulevat rungon alle, ne loppuvat tarkasti rungon alapinnan tasolle (legH).
    // Tällöin sängyn runko (sivulaidat ja päätylaudat) lepää suoraan jalkojen päällä.
    const legMaxZ = isUnderFrame ? legH : legH + fH - 8;

    const legCoords = [
      { x: legInset, y: legInset },
      { x: L - lSec - legInset, y: legInset },
      { x: legInset, y: W - lSec - legInset },
      { x: L - lSec - legInset, y: W - lSec - legInset },
    ];

    legCoords.forEach((leg, i) => {
      list.push({
        id: `corner-leg-${i}`,
        minX: leg.x,
        maxX: leg.x + lSec,
        minY: leg.y,
        maxY: leg.y + lSec,
        minZ: 0,
        maxZ: legMaxZ,
        color: frameWood.grainColorHex,
        strokeColor: '#57534e',
        label: isUnderFrame ? `Jalka ${i + 1} (rungon alla)` : `Kulmatolppa ${i + 1}`,
      });
    });

    // 2. Sivulaudat (Runko)
    // Takalaita (Y = 0)
    list.push({
      id: 'frame-back',
      minX: 0,
      maxX: L,
      minY: 0,
      maxY: fT,
      minZ: legH,
      maxZ: legH + fH,
      color: frameWood.colorHex,
      strokeColor: '#44403c',
      label: 'Takasivulaita',
    });

    // Etulaita (Y = W - fT)
    list.push({
      id: 'frame-front',
      minX: 0,
      maxX: L,
      minY: W - fT,
      maxY: W,
      minZ: legH,
      maxZ: legH + fH,
      color: frameWood.colorHex,
      strokeColor: '#44403c',
      label: 'Etusivulaita',
    });

    // Päätylaita (Pääpuoli, X = 0)
    list.push({
      id: 'frame-head',
      minX: 0,
      maxX: fT,
      minY: fT,
      maxY: W - fT,
      minZ: legH,
      maxZ: legH + fH,
      color: frameWood.colorHex,
      strokeColor: '#44403c',
      label: 'Päätylaita',
    });

    // Jalkopääty (X = L - fT)
    list.push({
      id: 'frame-foot',
      minX: L - fT,
      maxX: L,
      minY: fT,
      maxY: W - fT,
      minZ: legH,
      maxZ: legH + fH,
      color: frameWood.colorHex,
      strokeColor: '#44403c',
      label: 'Jalkopäätylaita',
    });

    // 3. Keskipalkki ja keskijalat
    if (config.hasCenterBeam) {
      const cbW = config.centerBeamWidth;
      const cbH = config.centerBeamHeight;
      const midY = W / 2 - cbW / 2;

      let beamTopZ: number;
      let beamBottomZ: number;

      if (isTopMounted) {
        // TASARUNKO: Keskipalkki on TÄSMÄLLEEN SAMALLA KOROLLA kuin sivulaidat!
        beamTopZ = legH + fH;
        beamBottomZ = beamTopZ - cbH;
      } else {
        // UPOTETTU: Keskipalkin yläpinta on säleiden alapinnan tasalla
        beamTopZ = legH + (fH - config.recessDepth - slatT);
        beamBottomZ = beamTopZ - cbH;
      }

      list.push({
        id: 'center-beam',
        minX: fT,
        maxX: L - fT,
        minY: midY,
        maxY: midY + cbW,
        minZ: beamBottomZ,
        maxZ: beamTopZ,
        color: '#d97706', // Huomioväri puulle jotta erottuu selkeästi
        strokeColor: '#92400e',
        label: isTopMounted ? 'Keskipalkki (tasan laitojen kanssa)' : 'Keskipalkki (upotettu)',
      });

      // Keskijalat lattiaan
      if (config.centerLegCount > 0) {
        const legPositions = config.centerLegCount === 1 ? [L / 2 - cbW / 2] : [L / 3 - cbW / 2, (2 * L) / 3 - cbW / 2];
        legPositions.forEach((posX, idx) => {
          list.push({
            id: `center-leg-${idx}`,
            minX: posX,
            maxX: posX + cbW,
            minY: midY,
            maxY: midY + cbW,
            minZ: 0,
            maxZ: beamBottomZ,
            color: '#b45309',
            strokeColor: '#78350f',
            label: `Keskitukijalka ${idx + 1}`,
          });
        });
      }
    }

    // 4. Kannatinrimat (VAIN upotetussa rakenteessa, top_mounted ei tarvitse!)
    if (!isTopMounted) {
      const slatElevationZ = legH + (fH - config.recessDepth - slatT);
      const ledgerT = config.slatSupportThickness;
      const ledgerW = config.slatSupportWidth;

      // Vasen rima
      list.push({
        id: 'ledger-left',
        minX: fT,
        maxX: L - fT,
        minY: fT,
        maxY: fT + ledgerT,
        minZ: slatElevationZ - ledgerW,
        maxZ: slatElevationZ,
        color: '#d97706',
        strokeColor: '#78350f',
        label: 'Kannatinrima (vasen)',
      });

      // Oikea rima
      list.push({
        id: 'ledger-right',
        minX: fT,
        maxX: L - fT,
        minY: W - fT - ledgerT,
        maxY: W - fT,
        minZ: slatElevationZ - ledgerW,
        maxZ: slatElevationZ,
        color: '#d97706',
        strokeColor: '#78350f',
        label: 'Kannatinrima (oikea)',
      });
    }

    // 5. Pohjasäleet
    const slatCount = ventilation.slatCount;
    const actualGap = ventilation.actualGapMm;
    const slatElevationZ = isTopMounted
      ? legH + fH // Tasarungossa suoraan laitojen ja keskipalkin päällä!
      : legH + (fH - config.recessDepth - slatT); // Upotetussa rimojen päällä

    const slatMinY = isTopMounted ? 0 : fT + 2;
    const slatMaxY = isTopMounted ? W : W - fT - 2;

    const totalSlatSpan = slatCount * slatW + (slatCount - 1) * actualGap;
    const slatStartX = isTopMounted ? Math.max(0, (L - totalSlatSpan) / 2) : fT + 8;

    for (let i = 0; i < slatCount; i++) {
      const slatX = slatStartX + i * (slatW + actualGap);
      if (slatX + slatW > (isTopMounted ? L : L - fT - 4)) break;

      list.push({
        id: `slat-${i}`,
        minX: slatX,
        maxX: slatX + slatW,
        minY: slatMinY,
        maxY: slatMaxY,
        minZ: slatElevationZ,
        maxZ: slatElevationZ + slatT,
        color: slatWood.colorHex,
        strokeColor: '#78716c',
        label: `Säle ${i + 1}`,
      });
    }

    // 6. Patja (jos valittu näkyväksi)
    if (showMattress) {
      const mattressThickness = config.mattressThickness;
      const mattressBaseZ = slatElevationZ + slatT;
      // Tasarungossa patja istuu säleiden päällä keskellä sänkyä (10 mm / 1 cm käyntivara jakaantuu 5 mm / puoli)
      const mattressMinX = isTopMounted ? Math.max(0, (L - config.mattressLength) / 2) : fT + 4;
      const mattressMaxX = isTopMounted ? mattressMinX + config.mattressLength : L - fT - 4;
      const mattressMinY = isTopMounted ? Math.max(0, (W - config.mattressWidth) / 2) : fT + 4;
      const mattressMaxY = isTopMounted ? mattressMinY + config.mattressWidth : W - fT - 4;

      list.push({
        id: 'mattress',
        minX: mattressMinX,
        maxX: mattressMaxX,
        minY: mattressMinY,
        maxY: mattressMaxY,
        minZ: mattressBaseZ,
        maxZ: mattressBaseZ + mattressThickness,
        color: '#f8fafc',
        strokeColor: '#cbd5e1',
        opacity: mattressOpacity,
        label: `Patja (${config.mattressThickness} mm)`,
      });
    }

    return list;
  }, [config, frameWood, slatWood, ventilation, outerLength, outerWidth, showMattress, mattressOpacity]);

  // 3D-matematiikka ja Polygonien projisointi
  const renderPolygons = useMemo((): RenderPolygon[] => {
    const svgWidth = 800;
    const svgHeight = 540;
    const baseScale = 0.225;

    const L = outerLength;
    const W = outerWidth;
    const isTopMounted = config.constructionStyle === 'top_mounted';
    const bedHeight = config.legHeight + config.frameHeight + (isTopMounted ? config.slatThickness : 0);

    // Keskipiste pyöritysakselille
    const cx = L / 2;
    const cy = W / 2;
    const cz = bedHeight / 2;

    const radAzimuth = (azimuth * Math.PI) / 180;
    const radElevation = (elevation * Math.PI) / 180;

    const cosA = Math.cos(radAzimuth);
    const sinA = Math.sin(radAzimuth);
    const cosB = Math.cos(radElevation);
    const sinB = Math.sin(radElevation);

    // Kameran suuntavektori (tunnistetaan visible-pinnat)
    // azimuth kiertää vaakatasossa, elevation kallistaa
    const camDirX = sinA * cosB;
    const camDirY = -cosA * cosB;
    const camDirZ = sinB;

    // Valaistuksen suuntavektori (ylä-vasen-etu)
    const lightDirX = -0.35;
    const lightDirY = -0.55;
    const lightDirZ = 0.75;
    const lightLen = Math.hypot(lightDirX, lightDirY, lightDirZ);
    const nLx = lightDirX / lightLen;
    const nLy = lightDirY / lightLen;
    const nLz = lightDirZ / lightLen;

    const projectPoint = (x: number, y: number, z: number) => {
      const dx = x - cx;
      const dy = y - cy;
      const dz = z - cz;

      // 1. Kierto vaakatasossa (Azimuth)
      const x1 = dx * cosA - dy * sinA;
      const y1 = dx * sinA + dy * cosA;
      const z1 = dz;

      // 2. Kierto pystytasossa (Elevation)
      const x2 = x1;
      const y2 = y1 * cosB - z1 * sinB; // syvyys kamerasta
      const z2 = y1 * sinB + z1 * cosB; // pystypaikka ruudulla

      // 3. Projisointi ruudulle
      const screenX = svgWidth / 2 + x2 * baseScale * zoom;
      const screenY = svgHeight / 2 - z2 * baseScale * zoom + 15;

      return { x: screenX, y: screenY, depth: y2 };
    };

    const polys: RenderPolygon[] = [];

    // Luodaan jokaiselle 3D-kappaleelle 6 tahkoa
    boxes.forEach((box) => {
      const { minX, maxX, minY, maxY, minZ, maxZ, color, strokeColor = '#44403c', opacity = 1 } = box;

      const faces = [
        // 1. Yläpinta (+Z)
        {
          normal: { x: 0, y: 0, z: 1 },
          pts: [
            { x: minX, y: minY, z: maxZ },
            { x: maxX, y: minY, z: maxZ },
            { x: maxX, y: maxY, z: maxZ },
            { x: minX, y: maxY, z: maxZ },
          ],
        },
        // 2. Alapinta (-Z)
        {
          normal: { x: 0, y: 0, z: -1 },
          pts: [
            { x: minX, y: maxY, z: minZ },
            { x: maxX, y: maxY, z: minZ },
            { x: maxX, y: minY, z: minZ },
            { x: minX, y: minY, z: minZ },
          ],
        },
        // 3. Oikea pääty (+X)
        {
          normal: { x: 1, y: 0, z: 0 },
          pts: [
            { x: maxX, y: minY, z: minZ },
            { x: maxX, y: maxY, z: minZ },
            { x: maxX, y: maxY, z: maxZ },
            { x: maxX, y: minY, z: maxZ },
          ],
        },
        // 4. Vasen pääty (-X)
        {
          normal: { x: -1, y: 0, z: 0 },
          pts: [
            { x: minX, y: maxY, z: minZ },
            { x: minX, y: minY, z: minZ },
            { x: minX, y: minY, z: maxZ },
            { x: minX, y: maxY, z: maxZ },
          ],
        },
        // 5. Etusivu (+Y)
        {
          normal: { x: 0, y: 1, z: 0 },
          pts: [
            { x: maxX, y: maxY, z: minZ },
            { x: minX, y: maxY, z: minZ },
            { x: minX, y: maxY, z: maxZ },
            { x: maxX, y: maxY, z: maxZ },
          ],
        },
        // 6. Takasivu (-Y)
        {
          normal: { x: 0, y: -1, z: 0 },
          pts: [
            { x: minX, y: minY, z: minZ },
            { x: maxX, y: minY, z: minZ },
            { x: maxX, y: minY, z: maxZ },
            { x: minX, y: minY, z: maxZ },
          ],
        },
      ];

      faces.forEach((face, fIdx) => {
        // Backface Culling: Tarkistetaan osoittaako pinta kameraan päin
        const dotCam = face.normal.x * camDirX + face.normal.y * camDirY + face.normal.z * camDirZ;
        if (dotCam <= 0.001) {
          // Pinta osoittaa pois kamerasta, jätetään piirtämättä
          return;
        }

        // Projisoidaan pisteet ruudulle
        const proj = face.pts.map((p) => projectPoint(p.x, p.y, p.z));
        const avgDepth = (proj[0].depth + proj[1].depth + proj[2].depth + proj[3].depth) / 4;
        const pointsStr = proj.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

        // Valaistuksen laskenta
        const dotLight = Math.max(0, face.normal.x * nLx + face.normal.y * nLy + face.normal.z * nLz);
        const lightFactor = 0.58 + 0.42 * dotLight;
        const shadedColor = adjustBrightness(color, lightFactor);

        polys.push({
          id: `${box.id}-f${fIdx}`,
          pointsStr,
          avgDepth,
          fillColor: shadedColor,
          strokeColor,
          opacity,
        });
      });
    });

    // Lajitellaan syvyyden mukaan (Painter's algorithm: kaukaisin piirretään ensin)
    polys.sort((a, b) => b.avgDepth - a.avgDepth);

    return polys;
  }, [boxes, azimuth, elevation, zoom, outerLength, outerWidth, config.constructionStyle, config.legHeight, config.frameHeight, config.slatThickness]);

  // Projisointipiste pistekuorman osoittimelle
  const pointLoadProjected = useMemo(() => {
    const svgWidth = 800;
    const svgHeight = 540;
    const baseScale = 0.225;

    const L = outerLength;
    const W = outerWidth;
    const isTopMounted = config.constructionStyle === 'top_mounted';
    const bedHeight = config.legHeight + config.frameHeight + (isTopMounted ? config.slatThickness : 0);

    const cx = L / 2;
    const cy = W / 2;
    const cz = bedHeight / 2;

    const radAzimuth = (azimuth * Math.PI) / 180;
    const radElevation = (elevation * Math.PI) / 180;

    const cosA = Math.cos(radAzimuth);
    const sinA = Math.sin(radAzimuth);
    const cosB = Math.cos(radElevation);
    const sinB = Math.sin(radElevation);

    const project = (x: number, y: number, z: number) => {
      const dx = x - cx;
      const dy = y - cy;
      const dz = z - cz;

      const x1 = dx * cosA - dy * sinA;
      const y1 = dx * sinA + dy * cosA;
      const z1 = dz;

      const x2 = x1;
      const z2 = y1 * sinB + z1 * cosB;

      const screenX = svgWidth / 2 + x2 * baseScale * zoom;
      const screenY = svgHeight / 2 - z2 * baseScale * zoom + 15;
      return { x: screenX, y: screenY };
    };

    const topZ = showMattress
      ? config.legHeight + config.frameHeight + (isTopMounted ? config.slatThickness : 0) + config.mattressThickness
      : config.legHeight + config.frameHeight + (isTopMounted ? config.slatThickness : 0);

    const loadX = outerLength / 2;
    const loadY = config.pointLoadLocation === 'side_rail' ? config.frameThickness / 2 : outerWidth / 2;

    const ptTarget = project(loadX, loadY, topZ);
    const ptArrowTop = project(loadX, loadY, topZ + 90);

    return { target: ptTarget, arrowTop: ptArrowTop };
  }, [azimuth, elevation, zoom, outerLength, outerWidth, config, showMattress]);

  // Lattiavarjon projisointi
  const floorShadowPoints = useMemo(() => {
    const svgWidth = 800;
    const svgHeight = 540;
    const baseScale = 0.225;

    const L = outerLength;
    const W = outerWidth;
    const isTopMounted = config.constructionStyle === 'top_mounted';
    const bedHeight = config.legHeight + config.frameHeight + (isTopMounted ? config.slatThickness : 0);

    const cx = L / 2;
    const cy = W / 2;
    const cz = bedHeight / 2;

    const radAzimuth = (azimuth * Math.PI) / 180;
    const radElevation = (elevation * Math.PI) / 180;

    const cosA = Math.cos(radAzimuth);
    const sinA = Math.sin(radAzimuth);
    const cosB = Math.cos(radElevation);
    const sinB = Math.sin(radElevation);

    const project = (x: number, y: number) => {
      const dx = x - cx;
      const dy = y - cy;
      const dz = 0 - cz;

      const x1 = dx * cosA - dy * sinA;
      const y1 = dx * sinA + dy * cosA;
      const z1 = dz;

      const x2 = x1;
      const z2 = y1 * sinB + z1 * cosB;

      return `${(svgWidth / 2 + x2 * baseScale * zoom).toFixed(1)},${(svgHeight / 2 - z2 * baseScale * zoom + 15).toFixed(1)}`;
    };

    const pad = 40;
    return `${project(-pad, -pad)} ${project(L + pad, -pad)} ${project(L + pad, W + pad)} ${project(-pad, W + pad)}`;
  }, [azimuth, elevation, zoom, outerLength, outerWidth, config]);

  // Render 3D Pyöritettävä malli
  const render3DView = () => {
    return (
      <div
        ref={containerRef}
        className="relative w-full overflow-hidden select-none cursor-grab active:cursor-grabbing touch-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
      >
        <svg
          viewBox="0 0 800 540"
          className="w-full h-auto drop-shadow-xs"
          style={{ maxHeight: '600px' }}
        >
          <defs>
            {/* Pehmeä varjostus */}
            <radialGradient id="floorGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#78716c" stopOpacity="0.25" />
              <stop offset="70%" stopColor="#a8a29e" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#e7e5e4" stopOpacity="0" />
            </radialGradient>
            {/* Voiman nuolipää */}
            <marker
              id="forceArrow"
              viewBox="0 0 10 10"
              refX="5"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#dc2626" />
            </marker>
          </defs>

          {/* Lattiavarjo sängyn alla */}
          <polygon points={floorShadowPoints} fill="url(#floorGrad)" />

          {/* 3D-Kappaleiden polygonit (Painter's algorithm: syvyysjärjestyksessä) */}
          {renderPolygons.map((poly) => (
            <polygon
              key={poly.id}
              points={poly.pointsStr}
              fill={poly.fillColor}
              stroke={poly.strokeColor}
              strokeWidth="0.75"
              strokeLinejoin="round"
              fillOpacity={poly.opacity}
            />
          ))}

          {/* Pistekuorman indikaattori 3D-avaruudessa */}
          {showLoadArrow && (
            <g className="transition-all duration-200 pointer-events-none">
              <line
                x1={pointLoadProjected.arrowTop.x}
                y1={pointLoadProjected.arrowTop.y}
                x2={pointLoadProjected.target.x}
                y2={pointLoadProjected.target.y - 6}
                stroke="#dc2626"
                strokeWidth="3.5"
                strokeLinecap="round"
                markerEnd="url(#forceArrow)"
              />
              <circle
                cx={pointLoadProjected.target.x}
                cy={pointLoadProjected.target.y}
                r="5"
                fill="#f59e0b"
                stroke="#b45309"
                strokeWidth="2"
              />
              <rect
                x={pointLoadProjected.arrowTop.x - 45}
                y={pointLoadProjected.arrowTop.y - 26}
                width="90"
                height="22"
                rx="11"
                fill="#1c1917"
                opacity="0.88"
              />
              <text
                x={pointLoadProjected.arrowTop.x}
                y={pointLoadProjected.arrowTop.y - 12}
                fill="#fef08a"
                fontSize="10.5"
                fontWeight="bold"
                fontFamily="monospace"
                textAnchor="middle"
              >
                {config.pointLoadKg} kg (Taipuma {metrics.slatDeflectionMm} mm)
              </text>
            </g>
          )}

          {/* Tasarungon huomiomerkintä 3D-näkymässä */}
          {config.constructionStyle === 'top_mounted' && (
            <g className="pointer-events-none">
              <rect x="24" y="24" width="260" height="42" rx="8" fill="#1c1917" opacity="0.82" />
              <text x="36" y="42" fill="#38bdf8" fontSize="11" fontWeight="bold" fontFamily="sans-serif">
                ★ Tasarunko: Säleet laitojen päällä
              </text>
              <text x="36" y="56" fill="#e2e8f0" fontSize="9.5" fontFamily="sans-serif">
                Keskipalkki on samalla tasolla kuin reunalaidat
              </text>
            </g>
          )}
        </svg>

        {/* 3D-interaktiovinkki ruudun alareunassa */}
        <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 pointer-events-none text-[11px]">
          <div className="px-3 py-1.5 rounded-lg bg-white/90 backdrop-blur-xs border border-stone-200/80 shadow-xs flex items-center gap-2 text-stone-700">
            <Move className="w-3.5 h-3.5 text-amber-700" />
            <span>
              <strong>Pyöritä:</strong> Vedä hiirellä tai sormella • <strong>Zoomaa:</strong> Rullaa
            </span>
          </div>

          <div className="px-3 py-1.5 rounded-lg bg-white/90 backdrop-blur-xs border border-stone-200/80 shadow-xs text-stone-600 font-mono">
            Kulma: <strong className="text-stone-900">{Math.round(azimuth)}°</strong> • Kallistus:{' '}
            <strong className="text-stone-900">{Math.round(elevation)}°</strong> • Zoom:{' '}
            <strong className="text-stone-900">{Math.round(zoom * 100)}%</strong>
          </div>
        </div>
      </div>
    );
  };

  // Render Top Blueprint View (Päältäpäin mittatarkka tekninen piirros)
  const renderTopView = () => {
    const svgW = 780;
    const svgH = 480;
    const margin = 45;
    const drawW = svgW - margin * 2;
    const drawH = svgH - margin * 2;

    const scaleX = drawW / outerLength;
    const scaleY = drawH / outerWidth;
    const scale = Math.min(scaleX, scaleY);

    const bedPixelW = outerLength * scale;
    const bedPixelH = outerWidth * scale;
    const startX = (svgW - bedPixelW) / 2;
    const startY = (svgH - bedPixelH) / 2;

    const fT = config.frameThickness * scale;
    const slatPixelW = config.slatWidth * scale;
    const gapPixel = ventilation.actualGapMm * scale;
    const isTopMounted = config.constructionStyle === 'top_mounted';

    return (
      <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-auto select-none bg-stone-900 rounded-xl p-4">
        {/* Taustaruudukko */}
        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#292524" strokeWidth="0.5" />
        </pattern>
        <rect width={svgW} height={svgH} fill="url(#grid)" />

        {/* Sängyn ulkokehys */}
        <rect
          x={startX}
          y={startY}
          width={bedPixelW}
          height={bedPixelH}
          fill="#1c1917"
          stroke={frameWood.colorHex}
          strokeWidth="3"
          rx="4"
        />

        {/* Sisäreuna (vain upotetussa rakenteessa näkyy kaukalo) */}
        {!isTopMounted && (
          <rect
            x={startX + fT}
            y={startY + fT}
            width={bedPixelW - 2 * fT}
            height={bedPixelH - 2 * fT}
            fill="#0c0a09"
            stroke="#44403c"
            strokeWidth="1.5"
          />
        )}

        {/* Keskipalkki (koko sängyn pituudelta) */}
        {config.hasCenterBeam && (
          <g>
            <rect
              x={startX + fT}
              y={startY + bedPixelH / 2 - (config.centerBeamWidth * scale) / 2}
              width={bedPixelW - 2 * fT}
              height={config.centerBeamWidth * scale}
              fill="#d97706"
              opacity={isTopMounted ? 0.95 : 0.75}
              stroke="#b45309"
              strokeWidth="1"
            />
            {isTopMounted && (
              <text
                x={startX + bedPixelW / 2}
                y={startY + bedPixelH / 2 - (config.centerBeamWidth * scale) / 2 - 4}
                fill="#fbbf24"
                fontSize="9"
                fontWeight="bold"
                fontFamily="sans-serif"
                textAnchor="middle"
              >
                Keskipalkki samalla tasolla kuin laidat
              </text>
            )}
          </g>
        )}

        {/* Säleet ja tuuletusraot */}
        {Array.from({ length: ventilation.slatCount }).map((_, i) => {
          const totalSlatSpan = ventilation.slatCount * slatPixelW + (ventilation.slatCount - 1) * gapPixel;
          const slatStartX = isTopMounted
            ? startX + Math.max(0, (bedPixelW - totalSlatSpan) / 2)
            : startX + fT + 4 * scale;
          const slatX = slatStartX + i * (slatPixelW + gapPixel);
          if (slatX + slatPixelW > startX + bedPixelW - (isTopMounted ? 0 : fT)) return null;

          const slatY = isTopMounted ? startY : startY + fT;
          const slatHeight = isTopMounted ? bedPixelH : bedPixelH - 2 * fT;

          return (
            <g key={`top-slat-${i}`}>
              <rect
                x={slatX}
                y={slatY}
                width={slatPixelW}
                height={slatHeight}
                fill={slatWood.colorHex}
                opacity={0.92}
                stroke="#57534e"
                strokeWidth="0.5"
              />
              {/* Ruuvien kiinnityspisteet */}
              <circle cx={slatX + slatPixelW / 2} cy={startY + (isTopMounted ? fT / 2 : fT + 8)} r="1.5" fill="#f59e0b" />
              <circle cx={slatX + slatPixelW / 2} cy={startY + bedPixelH - (isTopMounted ? fT / 2 : fT + 8)} r="1.5" fill="#f59e0b" />
              {config.hasCenterBeam && (
                <circle cx={slatX + slatPixelW / 2} cy={startY + bedPixelH / 2} r="1.5" fill="#f59e0b" />
              )}
            </g>
          );
        })}

        {/* Jalat (rungon alla katkoviivoin) */}
        {(() => {
          const isUnder = (config.legPlacement ?? 'under_frame') === 'under_frame';
          const inset = (config.legInset ?? 0) * scale;
          return [
            { x: startX + inset, y: startY + inset },
            { x: startX + bedPixelW - config.legSection * scale - inset, y: startY + inset },
            { x: startX + inset, y: startY + bedPixelH - config.legSection * scale - inset },
            { x: startX + bedPixelW - config.legSection * scale - inset, y: startY + bedPixelH - config.legSection * scale - inset },
          ].map((leg, i) => (
            <rect
              key={`top-leg-${i}`}
              x={leg.x}
              y={leg.y}
              width={config.legSection * scale}
              height={config.legSection * scale}
              fill={frameWood.grainColorHex}
              stroke="#1c1917"
              strokeWidth="1"
              strokeDasharray={isUnder ? "3 2" : undefined}
              opacity={isUnder ? 0.75 : 1}
            />
          ));
        })()}

        {/* Mittatekstit ja korostukset */}
        <g className="font-mono text-xs fill-stone-300">
          {/* Tuuletusraon mitta */}
          <line
            x1={startX + fT + 4 * scale + slatPixelW}
            y1={startY - 14}
            x2={startX + fT + 4 * scale + slatPixelW + gapPixel}
            y2={startY - 14}
            stroke="#38bdf8"
            strokeWidth="1.5"
          />
          <text
            x={startX + fT + 4 * scale + slatPixelW + gapPixel / 2}
            y={startY - 20}
            fill="#38bdf8"
            fontSize="10"
            textAnchor="middle"
            fontWeight="bold"
          >
            Tuuletusrako {ventilation.actualGapMm} mm
          </text>

          {/* Kokonaispituus */}
          <text x={startX + bedPixelW / 2} y={startY + bedPixelH + 25} fill="#e7e5e4" textAnchor="middle" fontSize="11">
            Ulkopituus: {outerLength} mm {isTopMounted ? `(Patja ${config.mattressLength} mm + ${topClearance} mm käyntivara)` : `(Sisäpituus: ${config.mattressLength + 10} mm)`}
          </text>

          {/* Kokonaisleveys */}
          <text
            x={startX - 15}
            y={startY + bedPixelH / 2}
            fill="#e7e5e4"
            textAnchor="middle"
            fontSize="11"
            transform={`rotate(-90 ${startX - 15} ${startY + bedPixelH / 2})`}
          >
            Ulkoleveys: {outerWidth} mm {isTopMounted ? `(Patja ${config.mattressWidth} mm + ${topClearance} mm käyntivara)` : `(Sisäleveys: ${config.mattressWidth + 10} mm)`}
          </text>

          {/* Selite ruuvikiinnityksestä */}
          <text x={startX + bedPixelW - 10} y={startY - 14} fill="#a8a29e" fontSize="9.5" textAnchor="end">
            ● Keltaiset pisteet = Säleen ruuvikiinnitys laitoihin &amp; keskipalkkiin
          </text>
        </g>
      </svg>
    );
  };

  // Render Side Cross-Section View (Poikkileikkaus: patja, upotus, säleet, jalat)
  const renderSideView = () => {
    const svgW = 780;
    const svgH = 400;
    const groundY = 330;
    const scale = 0.55;

    const legH = config.legHeight * scale;
    const fH = config.frameHeight * scale;
    const fT = config.frameThickness * scale;
    const mattressH = config.mattressThickness * scale;
    const slatT = config.slatThickness * scale;
    const isTopMounted = config.constructionStyle === 'top_mounted';

    const frameBottomY = groundY - legH;
    const frameTopY = frameBottomY - fH;

    // Tasarungossa säleet ovat laitojen PÄÄLLÄ (frameTopY - slatT)
    // Upotetussa säleet ovat UPOTETTUNA kaukalon sisällä (frameTopY + recess)
    const slatTopY = isTopMounted ? frameTopY : frameTopY + config.recessDepth * scale;
    const mattressTopY = isTopMounted ? frameTopY - slatT - mattressH : slatTopY - mattressH;

    const bedW = outerWidth * scale;
    const startX = (svgW - bedW) / 2;

    return (
      <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-auto select-none bg-stone-50 rounded-xl p-4 border border-stone-200">
        {/* Lattiataso */}
        <line x1="20" y1={groundY} x2={svgW - 20} y2={groundY} stroke="#78716c" strokeWidth="2" />
        <text x="30" y={groundY + 18} fill="#78716c" fontSize="10" className="font-mono">
          Lattiataso ±0.00
        </text>

        {/* Jalat (asennus rungon alle) */}
        {(() => {
          const inset = (config.legInset ?? 0) * scale;
          return (
            <>
              <rect
                x={startX + inset}
                y={frameBottomY}
                width={config.legSection * scale}
                height={legH}
                fill={frameWood.grainColorHex}
                stroke="#44403c"
                strokeWidth="1"
              />
              <rect
                x={startX + bedW - config.legSection * scale - inset}
                y={frameBottomY}
                width={config.legSection * scale}
                height={legH}
                fill={frameWood.grainColorHex}
                stroke="#44403c"
                strokeWidth="1"
              />
            </>
          );
        })()}

        {/* Keskijalka (jos on) */}
        {config.hasCenterBeam && config.centerLegCount > 0 && (
          <rect
            x={startX + bedW / 2 - (config.centerBeamWidth * scale) / 2}
            y={frameBottomY}
            width={config.centerBeamWidth * scale}
            height={legH}
            fill="#a8a29e"
            stroke="#44403c"
            strokeWidth="1"
          />
        )}

        {/* Sivulaudat poikkileikkauksessa (vasen ja oikea reuna) */}
        <rect
          x={startX}
          y={frameTopY}
          width={fT}
          height={fH}
          fill={frameWood.colorHex}
          stroke="#57534e"
          strokeWidth="1.25"
        />
        <rect
          x={startX + bedW - fT}
          y={frameTopY}
          width={fT}
          height={fH}
          fill={frameWood.colorHex}
          stroke="#57534e"
          strokeWidth="1.25"
        />

        {/* Keskipalkki poikkileikkauksessa */}
        {config.hasCenterBeam && (
          <g>
            <rect
              x={startX + bedW / 2 - (config.centerBeamWidth * scale) / 2}
              y={isTopMounted ? frameTopY : slatTopY}
              width={config.centerBeamWidth * scale}
              height={config.centerBeamHeight * scale}
              fill="#d97706"
              stroke="#92400e"
              strokeWidth="1.25"
            />
            {/* Tasolinja osoittamaan että keskipalkki ja sivulaidat ovat samalla korolla */}
            {isTopMounted && (
              <line
                x1={startX}
                y1={frameTopY}
                x2={startX + bedW}
                y2={frameTopY}
                stroke="#0284c7"
                strokeWidth="1.5"
                strokeDasharray="4 3"
              />
            )}
          </g>
        )}

        {/* Kannatinrimat (vain jos upotettu) */}
        {!isTopMounted && (
          <g>
            <rect
              x={startX + fT}
              y={slatTopY}
              width={config.slatSupportThickness * scale}
              height={config.slatSupportWidth * scale}
              fill="#d97706"
              stroke="#92400e"
              strokeWidth="0.75"
            />
            <rect
              x={startX + bedW - fT - config.slatSupportThickness * scale}
              y={slatTopY}
              width={config.slatSupportThickness * scale}
              height={config.slatSupportWidth * scale}
              fill="#d97706"
              stroke="#92400e"
              strokeWidth="0.75"
            />
          </g>
        )}

        {/* Pohjasäle poikkileikkauksessa */}
        {isTopMounted ? (
          // TASARUNKO: Säle kulkee koko leveyden laitojen ja keskipalkin YLÄPUOLELLA
          <g>
            <rect
              x={startX}
              y={frameTopY - slatT}
              width={bedW}
              height={slatT}
              fill={slatWood.colorHex}
              stroke="#78716c"
              strokeWidth="1.5"
            />
            {/* Kiinnitysruuvit */}
            <circle cx={startX + fT / 2} cy={frameTopY - slatT / 2} r="2" fill="#dc2626" />
            <circle cx={startX + bedW - fT / 2} cy={frameTopY - slatT / 2} r="2" fill="#dc2626" />
            <circle cx={startX + bedW / 2} cy={frameTopY - slatT / 2} r="2" fill="#dc2626" />
          </g>
        ) : (
          // UPOTETTU: Säle lepää kaukalon sisällä kannatinrimojen päällä
          <rect
            x={startX + fT + 2}
            y={slatTopY - slatT}
            width={bedW - 2 * fT - 4}
            height={slatT}
            fill={slatWood.colorHex}
            stroke="#78716c"
            strokeWidth="1"
          />
        )}

        {/* Patja */}
        {showMattress && (
          <g>
            <rect
              x={isTopMounted ? startX + (bedW - config.mattressWidth * scale) / 2 : startX + fT + 4}
              y={mattressTopY}
              width={isTopMounted ? config.mattressWidth * scale : bedW - 2 * fT - 8}
              height={mattressH}
              fill="#ffffff"
              stroke="#94a3b8"
              strokeWidth="1.5"
              rx="4"
            />
            <text
              x={startX + bedW / 2}
              y={mattressTopY + mattressH / 2 + 4}
              fill="#475569"
              fontSize="12"
              fontWeight="bold"
              textAnchor="middle"
            >
              Patja ({config.mattressThickness} mm)
            </text>
          </g>
        )}

        {/* Korkeusmitat ja merkinnät */}
        <g className="font-mono text-xs fill-stone-700">
          {/* Istumakorkeus */}
          <line x1={startX + bedW + 25} y1={groundY} x2={startX + bedW + 25} y2={mattressTopY} stroke="#0284c7" strokeWidth="1.5" />
          <polygon points={`${startX + bedW + 22},${groundY} ${startX + bedW + 28},${groundY} ${startX + bedW + 25},${groundY - 6}`} fill="#0284c7" />
          <polygon points={`${startX + bedW + 22},${mattressTopY} ${startX + bedW + 28},${mattressTopY} ${startX + bedW + 25},${mattressTopY + 6}`} fill="#0284c7" />
          <text x={startX + bedW + 35} y={(groundY + mattressTopY) / 2} fill="#0284c7" fontWeight="bold" fontSize="11">
            Istumakorkeus {sittingHeight} mm
          </text>

          {/* Maavara / jalat */}
          <line x1={startX - 25} y1={groundY} x2={startX - 25} y2={frameBottomY} stroke="#78716c" strokeWidth="1" />
          <text x={startX - 35} y={(groundY + frameBottomY) / 2} fill="#57534e" textAnchor="end" fontSize="10">
            Jalka {config.legHeight} mm
          </text>

          {/* Upotus vs. Tasarunko */}
          {isTopMounted ? (
            <g>
              <text x={startX + bedW / 2} y={frameTopY + 28} fill="#0284c7" fontSize="10.5" fontWeight="bold" textAnchor="middle">
                ✓ Keskipalkki ja sivulaidat samassa tasossa — Säleet asennetaan päälle
              </text>
            </g>
          ) : (
            <g>
              <line x1={startX + fT + 15} y1={frameTopY} x2={startX + fT + 15} y2={slatTopY} stroke="#dc2626" strokeWidth="1" />
              <text x={startX + fT + 22} y={(frameTopY + slatTopY) / 2 + 3} fill="#dc2626" fontSize="9" fontWeight="bold">
                Upotus {config.recessDepth} mm
              </text>
            </g>
          )}
        </g>
      </svg>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
      {/* Visualisoijan yläpalkki: Näkymätilat ja 3D-työkalut */}
      <div className="p-4 border-b border-stone-100 flex flex-wrap items-center justify-between gap-3 bg-stone-50/50">
        <div className="flex items-center gap-1.5 p-1 bg-stone-200/70 rounded-lg">
          <button
            type="button"
            onClick={() => setViewMode('3d')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
              viewMode === '3d'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <RotateCw className="w-3.5 h-3.5 text-amber-700" />
            3D Pyöritettävä malli
          </button>
          <button
            type="button"
            onClick={() => setViewMode('top')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
              viewMode === 'top'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Päältäpäin (Säleet &amp; Raot)
          </button>
          <button
            type="button"
            onClick={() => setViewMode('side')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
              viewMode === 'side'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Ruler className="w-3.5 h-3.5" />
            Poikkileikkaus &amp; Liitokset
          </button>
        </div>

        {/* Oikean reunan säädöt */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Patjan näkyvyys */}
          <button
            type="button"
            onClick={() => setShowMattress(!showMattress)}
            className={`px-2.5 py-1.5 rounded-md text-xs font-medium border flex items-center gap-1.5 transition-all ${
              showMattress
                ? 'border-amber-700 bg-amber-50 text-amber-900'
                : 'border-stone-300 bg-white text-stone-600'
            }`}
          >
            {showMattress ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>{showMattress ? 'Patja näkyvissä' : 'Piilota patja'}</span>
          </button>

          {showMattress && viewMode === '3d' && (
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-stone-500">
              <span className="text-[10px]">Läpinäkyvyys:</span>
              <input
                type="range"
                min="0.15"
                max="0.9"
                step="0.05"
                value={mattressOpacity}
                onChange={(e) => setMattressOpacity(Number(e.target.value))}
                className="w-14 h-1 bg-stone-300 rounded cursor-pointer accent-amber-700"
              />
            </div>
          )}

          {/* Kuormanuolen näyttö */}
          {viewMode === '3d' && (
            <button
              type="button"
              onClick={() => setShowLoadArrow(!showLoadArrow)}
              className={`px-2.5 py-1.5 rounded-md text-xs font-medium border flex items-center gap-1 transition-all ${
                showLoadArrow ? 'border-red-600 bg-red-50 text-red-800' : 'border-stone-300 bg-white text-stone-600'
              }`}
              title="Näytä / piilota pistekuorman suuntanuoli"
            >
              <span>Kuormanuoli</span>
            </button>
          )}
        </div>
      </div>

      {/* 3D-Ohjaustyökalut (näkyvissä 3D-tilassa) */}
      {viewMode === '3d' && (
        <div className="px-4 py-2.5 bg-stone-100/70 border-b border-stone-200/60 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Valmiit kuvakulmat */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-stone-500 font-semibold text-[11px] uppercase mr-1">Kuvakulma:</span>
            <button
              type="button"
              onClick={() => setPresetView('iso')}
              className="px-2.5 py-1 rounded bg-white hover:bg-stone-200 border border-stone-200 text-stone-800 font-medium transition-colors shadow-2xs"
            >
              Isometrinen (45°)
            </button>
            <button
              type="button"
              onClick={() => setPresetView('front')}
              className="px-2.5 py-1 rounded bg-white hover:bg-stone-200 border border-stone-200 text-stone-800 font-medium transition-colors shadow-2xs"
            >
              Pääty (0°)
            </button>
            <button
              type="button"
              onClick={() => setPresetView('side')}
              className="px-2.5 py-1 rounded bg-white hover:bg-stone-200 border border-stone-200 text-stone-800 font-medium transition-colors shadow-2xs"
            >
              Sivu (90°)
            </button>
            <button
              type="button"
              onClick={() => setPresetView('topDown')}
              className="px-2.5 py-1 rounded bg-white hover:bg-stone-200 border border-stone-200 text-stone-800 font-medium transition-colors shadow-2xs"
            >
              Yläviisto (75°)
            </button>
            <button
              type="button"
              onClick={() => setPresetView('lowAngle')}
              className="px-2.5 py-1 rounded bg-white hover:bg-stone-200 border border-stone-200 text-stone-800 font-medium transition-colors shadow-2xs"
            >
              Alaviisto
            </button>
          </div>

          {/* Automaattipyöritys ja Zoom-painikkeet */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsTurntable(!isTurntable)}
              className={`px-2.5 py-1 rounded border flex items-center gap-1.5 font-medium transition-all shadow-2xs ${
                isTurntable
                  ? 'bg-amber-800 text-white border-amber-900 animate-pulse'
                  : 'bg-white hover:bg-stone-200 border-stone-200 text-stone-800'
              }`}
            >
              {isTurntable ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isTurntable ? 'Pysäytä pyöritys' : '360° Automaattipyöritys'}</span>
            </button>

            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(2.2, z + 0.15))}
              className="p-1 rounded bg-white hover:bg-stone-200 border border-stone-200 text-stone-700 shadow-2xs"
              title="Lähennä"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.65, z - 0.15))}
              className="p-1 rounded bg-white hover:bg-stone-200 border border-stone-200 text-stone-700 shadow-2xs"
              title="Loitonna"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => {
                setAzimuth(45);
                setElevation(28);
                setZoom(1.0);
                setIsTurntable(false);
              }}
              className="p-1 rounded bg-white hover:bg-stone-200 border border-stone-200 text-stone-700 shadow-2xs"
              title="Palauta oletuskulma"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Visualisoijan piirtoalue */}
      <div className="p-3 sm:p-5 bg-gradient-to-b from-stone-100/80 via-stone-50 to-white flex items-center justify-center min-h-[420px]">
        {viewMode === '3d' && render3DView()}
        {viewMode === 'top' && renderTopView()}
        {viewMode === 'side' && renderSideView()}
      </div>

      {/* Alapalkin mittayhteenveto ja kestävyysmittari */}
      <div className="p-3 bg-stone-50 border-t border-stone-100 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs font-mono text-stone-700">
        <div>
          <span className="text-[10px] text-stone-400 block font-sans">Rakennetapa</span>
          <span className="font-bold text-stone-900">
            {config.constructionStyle === 'top_mounted' ? '★ Tasarunko (säleet päällä)' : 'Upotettu kaukalo'}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-stone-400 block font-sans">Ulkoleveys × Pituus</span>
          <span className="font-bold text-stone-900">
            {outerWidth} × {outerLength} mm
          </span>
        </div>
        <div>
          <span className="text-[10px] text-stone-400 block font-sans">Säleen mitoitus & puu</span>
          <span className="font-bold text-stone-900">
            {config.slatThickness}×{config.slatWidth} mm ({slatWood.nameFi})
          </span>
        </div>
        <div>
          <span className="text-[10px] text-stone-400 block font-sans">Säleen taipuma ({config.pointLoadKg} kg)</span>
          <span className={`font-bold ${metrics.slatStatus === 'safe' ? 'text-emerald-800' : 'text-rose-700'}`}>
            {metrics.slatDeflectionMm} mm (max {metrics.slatAllowableDeflectionMm} mm)
          </span>
        </div>
        <div>
          <span className="text-[10px] text-stone-400 block font-sans">Säleen max pistekuorma</span>
          <span className={`font-bold ${metrics.slatStatus === 'safe' ? 'text-emerald-900' : 'text-amber-900'}`}>
            {metrics.slatMaxPointLoadKg ?? metrics.maxAllowablePointLoadKg} kg ({metrics.slatStatus === 'safe' ? '✓ Kestää' : '⚠ Tarkista'})
          </span>
        </div>
      </div>
    </div>
  );
};
