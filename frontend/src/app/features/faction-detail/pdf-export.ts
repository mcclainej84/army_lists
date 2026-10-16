import { jsPDF } from 'jspdf';
import autoTable, { RowInput } from 'jspdf-autotable';
import {
  Battalia,
  effectiveUnitStats,
  formatDistance,
  ListCommanderEntry,
  ListUnitEntry,
  scaleDistance,
  UNASSIGNED_BATTALIA_ID,
} from './list-builder.model';

// Exportacion de la lista en curso a PDF. Diseño sobrio tipo "hoja de ejercito": membrete
// con el nombre de la lista y los puntos, y un bloque por Battalia/Brigada con su mando y
// una tabla de unidades de tipografia pequeña. Cada bloque se mantiene entero en una sola
// pagina siempre que cabe (si no cabe en lo que queda de pagina, salta a la siguiente en
// vez de partirse por la mitad); solo un bloque mas largo que una pagina entera se divide,
// repitiendo la cabecera de la tabla en cada pagina.

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

type RGB = [number, number, number];

// Paleta calcada de la app (pergamino / granate / bronce), con un gris-tinta mas neutro
// para el texto de las tablas.
const COLOR_ACCENT: RGB = [122, 31, 31]; // #7a1f1f
const COLOR_BRONZE: RGB = [184, 148, 79]; // #b8944f
const COLOR_CREAM: RGB = [250, 246, 239];
const COLOR_BORDER: RGB = [222, 210, 190];
const COLOR_MUTED: RGB = [120, 105, 90];
const COLOR_DARK: RGB = [43, 29, 20]; // #2b1d14

const FONT_DISPLAY = 'times'; // titulos y nombres de battalia
const FONT_TABLE = 'helvetica'; // cuerpo de las tablas: mas legible a cuerpo pequeño

const PAGE_MARGIN = 14;
const FOOTER_SPACE = 10;
const GROUP_HEADER_HEIGHT = 11;
const GROUP_GAP = 6;

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

function groupPoints(group: PdfExportGroup): number {
  return (
    group.units.reduce((sum, u) => sum + entryPoints(u), 0) +
    group.commanders.reduce((sum, c) => sum + c.commander.points, 0)
  );
}

function commanderLine(group: PdfExportGroup, labels: PdfExportLabels): string {
  if (!group.commanders.length) return '';
  const text = group.commanders
    .map((c) =>
      c.commander.commandRating !== null
        ? `${c.commander.name} (${labels.commandRating}: ${c.commander.commandRating})`
        : c.commander.name
    )
    .join('  ·  ');
  return `${labels.commander}: ${text}`;
}

// Anchos de columna (mm). Suman exactamente el ancho util (210 - 2 * 14 = 182 mm).
const COLUMN_WIDTHS = [33, 15, 9, 11, 21, 9, 9, 11, 10, 11, 31, 12];

function tableHead(labels: PdfExportLabels): RowInput[] {
  return [
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
}

function tableBody(group: PdfExportGroup, options: PdfExportOptions): RowInput[] {
  return group.units.map((entry) => {
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
}

/** Opciones de autoTable compartidas entre la medicion (en un documento de prueba) y el dibujo real. */
function tableOptions(head: RowInput[], body: RowInput[]) {
  const columnStyles: Record<number, object> = {};
  COLUMN_WIDTHS.forEach((w, i) => {
    const centered = [2, 3, 5, 6, 7, 8, 9, 11].includes(i);
    columnStyles[i] = { cellWidth: w, ...(centered ? { halign: 'center' } : {}) };
  });
  columnStyles[0] = { cellWidth: COLUMN_WIDTHS[0], fontStyle: 'bold' };
  columnStyles[11] = { cellWidth: COLUMN_WIDTHS[11], halign: 'center', fontStyle: 'bold', textColor: COLOR_ACCENT };

  return {
    head,
    body,
    theme: 'plain' as const,
    showHead: 'everyPage' as const,
    rowPageBreak: 'avoid' as const,
    styles: {
      font: FONT_TABLE,
      fontSize: 6.8,
      cellPadding: { top: 1.3, bottom: 1.3, left: 1.2, right: 1.2 },
      textColor: COLOR_DARK,
      lineColor: COLOR_BORDER,
      lineWidth: { top: 0, right: 0, bottom: 0.15, left: 0 },
      valign: 'middle' as const,
    },
    headStyles: {
      fontStyle: 'bold' as const,
      fontSize: 6,
      textColor: COLOR_MUTED,
      halign: 'center' as const,
      lineColor: COLOR_BRONZE,
      lineWidth: { top: 0, right: 0, bottom: 0.4, left: 0 },
    },
    alternateRowStyles: { fillColor: COLOR_CREAM },
    columnStyles,
  };
}

/** Alto (mm) que ocupara la tabla de un bloque, medido en un documento de prueba muy alto para que no haga saltos de pagina. */
function measureTableHeight(head: RowInput[], body: RowInput[]): number {
  const probe = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [210, 4000] });
  autoTable(probe, {
    ...tableOptions(head, body),
    startY: 0,
    margin: { left: PAGE_MARGIN, right: PAGE_MARGIN, top: 0, bottom: 0 },
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (probe as any).lastAutoTable.finalY as number;
}

export function exportListToPdf(options: PdfExportOptions): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - PAGE_MARGIN * 2;
  const usableHeight = pageHeight - PAGE_MARGIN - FOOTER_SPACE;
  const labels = options.labels;

  // --- Membrete: nombre de la lista a la izquierda, puntos a la derecha, linea doble fina debajo.
  doc.setTextColor(...COLOR_ACCENT);
  doc.setFont(FONT_DISPLAY, 'bold');
  doc.setFontSize(16);
  doc.text(options.listName, PAGE_MARGIN, PAGE_MARGIN + 3);

  const pointsText = `${options.totalPoints} / ${options.pointsLimit}`;
  doc.setFontSize(16);
  const pointsWidth = doc.getTextWidth(pointsText);
  doc.text(pointsText, PAGE_MARGIN + contentWidth - pointsWidth, PAGE_MARGIN + 3);
  doc.setFont(FONT_DISPLAY, 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...COLOR_MUTED);
  const pointsLabelWidth = doc.getTextWidth(labels.points.toUpperCase());
  doc.text(labels.points.toUpperCase(), PAGE_MARGIN + contentWidth - pointsLabelWidth, PAGE_MARGIN + 7);

  doc.setFont(FONT_DISPLAY, 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...COLOR_MUTED);
  doc.text(`${labels.faction}: `, PAGE_MARGIN, PAGE_MARGIN + 8);
  const factionLabelWidth = doc.getTextWidth(`${labels.faction}: `);
  doc.setFont(FONT_DISPLAY, 'bold');
  doc.setTextColor(...COLOR_DARK);
  doc.text(options.factionName, PAGE_MARGIN + factionLabelWidth, PAGE_MARGIN + 8);

  doc.setDrawColor(...COLOR_BRONZE);
  doc.setLineWidth(0.5);
  doc.line(PAGE_MARGIN, PAGE_MARGIN + 10.5, PAGE_MARGIN + contentWidth, PAGE_MARGIN + 10.5);
  doc.setDrawColor(...COLOR_BORDER);
  doc.setLineWidth(0.15);
  doc.line(PAGE_MARGIN, PAGE_MARGIN + 11.4, PAGE_MARGIN + contentWidth, PAGE_MARGIN + 11.4);

  let y = PAGE_MARGIN + 11.4 + 6;

  const groups = buildGroups(options);

  if (!groups.length) {
    doc.setFont(FONT_DISPLAY, 'italic');
    doc.setFontSize(10);
    doc.setTextColor(...COLOR_MUTED);
    doc.text(labels.noUnits, PAGE_MARGIN, y + 4);
  }

  const head = tableHead(labels);

  for (const group of groups) {
    const body = tableBody(group, options);
    const tableHeight = body.length ? measureTableHeight(head, body) : 6;
    const blockHeight = GROUP_HEADER_HEIGHT + tableHeight;

    // Bloque entero en la misma pagina: si no cabe en lo que queda pero si cabe en una
    // pagina nueva, se salta de pagina antes de empezar (no se parte por la mitad).
    const remaining = pageHeight - FOOTER_SPACE - y;
    if (blockHeight > remaining && blockHeight <= usableHeight) {
      doc.addPage();
      y = PAGE_MARGIN;
    } else if (remaining < GROUP_HEADER_HEIGHT + 14) {
      // Bloque mas largo que una pagina: al menos que la cabecera no quede huerfana abajo.
      doc.addPage();
      y = PAGE_MARGIN;
    }

    // Cabecera del bloque: barra vertical granate + nombre; mando en una linea fina debajo;
    // puntos del bloque a la derecha.
    doc.setFillColor(...COLOR_ACCENT);
    doc.rect(PAGE_MARGIN, y, 1.2, 8, 'F');

    doc.setFont(FONT_DISPLAY, 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...COLOR_DARK);
    doc.text(group.name, PAGE_MARGIN + 3.2, y + 3.6);

    const subtotal = `${groupPoints(group)} ${labels.points}`;
    doc.setFont(FONT_DISPLAY, 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...COLOR_ACCENT);
    const subtotalWidth = doc.getTextWidth(subtotal);
    doc.text(subtotal, PAGE_MARGIN + contentWidth - subtotalWidth, y + 3.6);

    const commanders = commanderLine(group, labels);
    if (commanders) {
      doc.setFont(FONT_DISPLAY, 'italic');
      doc.setFontSize(8);
      doc.setTextColor(...COLOR_MUTED);
      doc.text(commanders, PAGE_MARGIN + 3.2, y + 7.4, { maxWidth: contentWidth - 3.2 });
    }

    y += GROUP_HEADER_HEIGHT;

    if (group.units.length === 0) {
      doc.setFont(FONT_DISPLAY, 'italic');
      doc.setFontSize(8.5);
      doc.setTextColor(...COLOR_MUTED);
      doc.text(labels.noUnits, PAGE_MARGIN + 3.2, y);
      y += 6 + GROUP_GAP;
      continue;
    }

    autoTable(doc, {
      ...tableOptions(head, body),
      startY: y,
      margin: { left: PAGE_MARGIN, right: PAGE_MARGIN, top: PAGE_MARGIN, bottom: FOOTER_SPACE },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    y = (doc as any).lastAutoTable.finalY + GROUP_GAP;
  }

  // --- Pie de pagina: marca discreta a la izquierda, numero de pagina a la derecha ---
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(...COLOR_BORDER);
    doc.setLineWidth(0.15);
    doc.line(PAGE_MARGIN, pageHeight - 9, pageWidth - PAGE_MARGIN, pageHeight - 9);
    doc.setFont(FONT_DISPLAY, 'italic');
    doc.setFontSize(7);
    doc.setTextColor(...COLOR_MUTED);
    doc.text(`${options.listName}  ·  ${labels.generatedWith}`, PAGE_MARGIN, pageHeight - 5.5);
    const pageLabel = `${labels.page} ${i} / ${pageCount}`;
    const pageLabelWidth = doc.getTextWidth(pageLabel);
    doc.text(pageLabel, pageWidth - PAGE_MARGIN - pageLabelWidth, pageHeight - 5.5);
  }

  doc.save(`${slugify(options.listName)}.pdf`);
}
