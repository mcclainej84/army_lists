import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Battalia,
  effectiveUnitStats,
  formatDistance,
  ListCommanderEntry,
  ListUnitEntry,
  scaleDistance,
  UNASSIGNED_BATTALIA_ID,
} from './list-builder.model';

// Exportacion de la lista en curso a PDF, con un estilo visual inspirado en la hoja de
// referencia que aporto el usuario: una tabla por Battalia (Unidad / Tipo / Peanas /
// Armamento / C.a C. / Disparo / Moral / Aguante / Reglas Especiales / Puntos), sobre un
// fondo tipo pergamino. Se sustituyen los campos "Army Commander" y "Command Rating" de la
// hoja original por la Faccion (a peticion del usuario), y se pide un nombre para la lista
// antes de exportar (se usa como titulo del documento y como nombre de archivo).

export interface PdfTableLabels {
  unit: string;
  type: string;
  bases: string;
  armament: string;
  handToHand: string;
  shooting: string;
  morale: string;
  stamina: string;
  specialRules: string;
  points: string;
  move: string;
  weaponRange: string;
}

export interface PdfExportLabels {
  table: PdfTableLabels;
  faction: string;
  points: string;
  battalia: string;
  commander: string;
  commandRating: string;
  unassigned: string;
  noUnits: string;
  generatedWith: string;
  page: string;
}

export interface PdfExportGroup {
  name: string;
  commanders: ListCommanderEntry[];
  units: ListUnitEntry[];
}

export interface PdfExportOptions {
  listName: string;
  factionName: string;
  totalPoints: number;
  pointsLimit: number;
  battalias: Battalia[];
  listCommanders: ListCommanderEntry[];
  listUnits: ListUnitEntry[];
  /** Si esta activo el boton "Recortar distancias" al exportar: mismo criterio que en pantalla (2/3, redondeando hacia arriba). */
  reducedDistances: boolean;
  labels: PdfExportLabels;
}

// Paleta calcada de faction-detail.scss para que el PDF encaje con el resto de la app.
const COLOR_ACCENT: [number, number, number] = [122, 31, 31]; // #7a1f1f
const COLOR_CREAM: [number, number, number] = [251, 246, 238]; // #fbf6ee
const COLOR_PAPER: [number, number, number] = [255, 253, 249]; // #fffdf9
const COLOR_BORDER: [number, number, number] = [216, 200, 176]; // #d8c8b0
const COLOR_MUTED: [number, number, number] = [107, 91, 75]; // #6b5b4b
const COLOR_DARK: [number, number, number] = [43, 29, 20]; // #2b1d14
const COLOR_HEADROW: [number, number, number] = [236, 224, 207]; // #ece0cf

// Serif en toda la hoja: da un aire mas "documento/manual militar" (como la referencia)
// que el sans-serif de la propia app, que esta pensado para pantalla, no para imprimir.
const FONT = 'times';

const PAGE_MARGIN = 12;

function slugify(text: string): string {
  const normalized = text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return normalized || 'lista';
}

function buildGroups(options: PdfExportOptions): PdfExportGroup[] {
  const groups: PdfExportGroup[] = options.battalias.map((b) => ({
    name: b.name,
    commanders: options.listCommanders.filter((c) => c.battaliaId === b.id),
    units: options.listUnits.filter((u) => u.battaliaId === b.id),
  }));

  const unassignedCommanders = options.listCommanders.filter((c) => c.battaliaId === UNASSIGNED_BATTALIA_ID);
  const unassignedUnits = options.listUnits.filter((u) => u.battaliaId === UNASSIGNED_BATTALIA_ID);
  if (unassignedCommanders.length || unassignedUnits.length) {
    groups.push({ name: options.labels.unassigned, commanders: unassignedCommanders, units: unassignedUnits });
  }

  return groups.filter((g) => g.commanders.length > 0 || g.units.length > 0);
}

function specialRulesCell(entry: ListUnitEntry): string {
  const base = entry.unit.specialRules ?? '';
  if (!entry.selectedOptionCodes.length) return base || '–';
  const optionText = entry.selectedOptionCodes
    .map((code) => entry.unit.options.find((o) => o.code === code)?.description ?? code)
    .join(', ');
  return base ? `${base} (+ ${optionText})` : `+ ${optionText}`;
}

function entryPoints(entry: ListUnitEntry): number {
  const optionPoints = entry.selectedOptionCodes.reduce((sum, code) => {
    const option = entry.unit.options.find((o) => o.code === code);
    return sum + (option?.pointDelta ?? 0);
  }, 0);
  return entry.unit.basePoints + optionPoints;
}

function ensureSpace(doc: jsPDF, y: number, needed: number): number {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (y + needed > pageHeight - PAGE_MARGIN) {
    doc.addPage();
    return PAGE_MARGIN;
  }
  return y;
}

export function exportListToPdf(options: PdfExportOptions): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - PAGE_MARGIN * 2;
  const labels = options.labels;

  // --- Cabecera: titulo de la lista a modo de membrete, con una linea fina debajo en vez
  // de una caja rellena (menos "banner", mas documento formal). Faccion / Puntos sustituyen
  // a los campos "Army Commander" / "Command Rating" de la hoja de referencia original.
  doc.setTextColor(...COLOR_ACCENT);
  doc.setFont(FONT, 'bold');
  doc.setFontSize(18);
  doc.text(options.listName, PAGE_MARGIN, PAGE_MARGIN + 4);

  doc.setDrawColor(...COLOR_BORDER);
  doc.setLineWidth(0.3);
  doc.line(PAGE_MARGIN, PAGE_MARGIN + 7, PAGE_MARGIN + contentWidth, PAGE_MARGIN + 7);

  doc.setFontSize(10);
  doc.setFont(FONT, 'normal');
  doc.setTextColor(...COLOR_MUTED);
  doc.text(`${labels.faction}: `, PAGE_MARGIN, PAGE_MARGIN + 13.5);
  const factionLabelWidth = doc.getTextWidth(`${labels.faction}: `);
  doc.setFont(FONT, 'bold');
  doc.setTextColor(...COLOR_DARK);
  doc.text(options.factionName, PAGE_MARGIN + factionLabelWidth, PAGE_MARGIN + 13.5);

  const pointsText = `${labels.points}: ${options.totalPoints} / ${options.pointsLimit}`;
  doc.setFont(FONT, 'bold');
  doc.setTextColor(...COLOR_ACCENT);
  const pointsWidth = doc.getTextWidth(pointsText);
  doc.text(pointsText, PAGE_MARGIN + contentWidth - pointsWidth, PAGE_MARGIN + 13.5);

  let y = PAGE_MARGIN + 13.5 + 6;

  const groups = buildGroups(options);

  if (!groups.length) {
    doc.setFont(FONT, 'italic');
    doc.setFontSize(10);
    doc.setTextColor(...COLOR_MUTED);
    doc.text(labels.noUnits, PAGE_MARGIN, y + 4);
  }

  const head = [
    [
      labels.table.unit,
      labels.table.type,
      labels.table.move,
      labels.table.bases,
      labels.table.armament,
      labels.table.weaponRange,
      labels.table.handToHand,
      labels.table.shooting,
      labels.table.morale,
      labels.table.stamina,
      labels.table.specialRules,
      labels.table.points,
    ],
  ];

  for (const group of groups) {
    y = ensureSpace(doc, y, 16);

    // Barra de la battalia/brigada: sin relleno ni recuadro (solo texto + una linea fina
    // de separacion), mas sobria que una caja de color solida. Incluye el Valor de Mando
    // del/de los comandante(s) asignados junto al nombre.
    const commanderText = group.commanders.length
      ? group.commanders
          .map((c) =>
            c.commander.commandRating !== null
              ? `${c.commander.name} (${labels.commandRating}: ${c.commander.commandRating})`
              : c.commander.name
          )
          .join(', ')
      : '–';

    doc.setFont(FONT, 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...COLOR_ACCENT);
    doc.text(`${labels.battalia}: ${group.name}`, PAGE_MARGIN, y + 4);

    doc.setFont(FONT, 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...COLOR_DARK);
    const commanderLabelText = `${labels.commander}: ${commanderText}`;
    const commanderTextWidth = doc.getTextWidth(commanderLabelText);
    doc.text(commanderLabelText, PAGE_MARGIN + contentWidth - commanderTextWidth, y + 4);

    y += 6;
    doc.setDrawColor(...COLOR_BORDER);
    doc.setLineWidth(0.2);
    doc.line(PAGE_MARGIN, y, PAGE_MARGIN + contentWidth, y);
    y += 2.5;

    if (group.units.length === 0) {
      doc.setFont(FONT, 'italic');
      doc.setFontSize(8.5);
      doc.setTextColor(...COLOR_MUTED);
      doc.text(labels.noUnits, PAGE_MARGIN, y + 4);
      y += 9;
      continue;
    }

    const body = group.units.map((entry) => {
      const stats = effectiveUnitStats(entry.unit, entry.selectedOptionCodes);
      return [
        entry.unit.name,
        entry.unit.unitType ?? '–',
        formatDistance(scaleDistance(entry.unit.moveRange, options.reducedDistances)),
        stats.bases !== null ? String(stats.bases) : '–',
        entry.unit.armament ?? '–',
        formatDistance(scaleDistance(entry.unit.weaponRange, options.reducedDistances)),
        stats.handToHand ?? '–',
        stats.shooting ?? '–',
        entry.unit.morale ?? '–',
        stats.stamina !== null ? String(stats.stamina) : '–',
        specialRulesCell(entry),
        String(entryPoints(entry)),
      ];
    });

    autoTable(doc, {
      startY: y,
      margin: { left: PAGE_MARGIN, right: PAGE_MARGIN, bottom: PAGE_MARGIN },
      head,
      body,
      theme: 'grid',
      styles: {
        font: FONT,
        fontSize: 7.5,
        cellPadding: 1.3,
        textColor: COLOR_DARK,
        lineColor: COLOR_BORDER,
        lineWidth: 0.15,
        fillColor: COLOR_PAPER,
      },
      headStyles: {
        fillColor: COLOR_HEADROW,
        textColor: COLOR_MUTED,
        fontStyle: 'bold',
        fontSize: 7.5,
        halign: 'center',
        lineWidth: 0.15,
      },
      alternateRowStyles: { fillColor: COLOR_CREAM },
      // Anchos ajustados para que las cabeceras quepan en una sola linea y para que la
      // suma coincida exactamente con contentWidth (si no, la tabla queda mas estrecha
      // que la linea/cabecera de arriba y se ve desalineada).
      // Se inserto la columna de Alcance (arma) restando espacio a Armamento y a Reglas
      // Especiales para que la suma siga cuadrando exactamente con contentWidth (186mm).
      columnStyles: {
        0: { cellWidth: 34 }, // Unidad
        1: { cellWidth: 13 }, // Tipo
        2: { cellWidth: 10, halign: 'center' }, // Movimiento
        3: { cellWidth: 13, halign: 'center' }, // Peanas
        4: { cellWidth: 22 }, // Armamento
        5: { cellWidth: 10, halign: 'center' }, // Alcance (arma)
        6: { cellWidth: 10, halign: 'center' }, // CaC
        7: { cellWidth: 13, halign: 'center' }, // Disparo
        8: { cellWidth: 11, halign: 'center' }, // Moral
        9: { cellWidth: 13, halign: 'center' }, // Aguante
        10: { cellWidth: 25 }, // Reglas Especiales
        11: { cellWidth: 12, halign: 'center', fontStyle: 'bold', textColor: COLOR_ACCENT }, // Puntos
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    y = (doc as any).lastAutoTable.finalY + 5;
  }

  // --- Pie de pagina: numero de pagina + marca de la app ---
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFont(FONT, 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...COLOR_MUTED);
    doc.text(labels.generatedWith, PAGE_MARGIN, pageHeight - 6);
    const pageLabel = `${labels.page} ${i} / ${pageCount}`;
    const pageLabelWidth = doc.getTextWidth(pageLabel);
    doc.text(pageLabel, pageWidth - PAGE_MARGIN - pageLabelWidth, pageHeight - 6);
  }

  doc.save(`${slugify(options.listName)}.pdf`);
}
