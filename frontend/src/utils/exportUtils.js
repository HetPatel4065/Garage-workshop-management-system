import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

const PDF_MARGIN = 14;

/** Extract display string for a single export cell */
export const getExportCellValue = (col, row) => {
  let val;
  if (typeof col.accessor === 'function') {
    val = col.accessor(row);
  } else {
    val = row[col.accessorKey] ?? row[col.accessor];
  }
  const strVal = val !== undefined && val !== null ? String(val) : '';
  return strVal.replace(/₹/g, 'Rs. ');
};

/** Build head/body matrices for jspdf-autotable */
export const buildExportTableData = (columns, data) => {
  const head = [
    columns.map((col) => (col.header || '').replace(/₹/g, 'Rs. ')),
  ];
  const body = data.map((row) =>
    columns.map((col) => getExportCellValue(col, row)),
  );
  return { head, body };
};

const getTableFontSize = (columnCount) => {
  if (columnCount >= 10) return 7;
  if (columnCount >= 8) return 7.5;
  if (columnCount >= 6) return 8;
  return 9;
};

/** Measure each column from header + cell text (mm) */
const measureColumnWidths = (doc, head, body, fontSize) => {
  const colCount = head[0].length;
  const widths = [];

  for (let i = 0; i < colCount; i++) {
    let maxW = 0;

    doc.setFontSize(fontSize);
    doc.setFont('helvetica', 'bold');
    maxW = Math.max(maxW, doc.getTextWidth(String(head[0][i] || '')));

    doc.setFont('helvetica', 'normal');
    for (const row of body) {
      const text = String(row[i] ?? '');
      maxW = Math.max(maxW, doc.getTextWidth(text));
    }

    // Horizontal padding (left + right) in mm
    widths.push(maxW + 8);
  }

  return widths;
};

/** Scale column widths to fit the printable page width */
const fitColumnWidths = (widths, availableWidth) => {
  const total = widths.reduce((sum, w) => sum + w, 0);
  if (total <= availableWidth) return widths;

  const scale = (availableWidth * 0.98) / total;
  return widths.map((w) => w * scale);
};

/** Shared autoTable options used by page exports and full backup PDF */
export const getAutoTableOptions = (doc, columns, data, startY = 36) => {
  const { head, body } = buildExportTableData(columns, data);
  const fontSize = getTableFontSize(columns.length);
  const availableWidth = doc.internal.pageSize.getWidth() - PDF_MARGIN * 2;

  const rawWidths = measureColumnWidths(doc, head, body, fontSize);
  const columnWidths = fitColumnWidths(rawWidths, availableWidth);

  const columnStyles = {};
  columnWidths.forEach((width, index) => {
    columnStyles[index] = { cellWidth: width };
  });

  return {
    startY,
    head,
    body,
    theme: 'striped',
    tableWidth: availableWidth,
    margin: { left: PDF_MARGIN, right: PDF_MARGIN },
    styles: {
      fontSize,
      overflow: 'linebreak',
      cellPadding: { top: 2.5, right: 3, bottom: 2.5, left: 3 },
    },
    headStyles: {
      fillColor: [59, 130, 246],
      fontSize,
      fontStyle: 'bold',
      halign: 'left',
      valign: 'middle',
      minCellHeight: 9,
      overflow: 'linebreak',
    },
    bodyStyles: {
      fontSize,
      halign: 'left',
      valign: 'top',
      overflow: 'linebreak',
    },
    columnStyles,
    rowPageBreak: 'auto',
    showHead: 'everyPage',
  };
};

export const createExportPdfDoc = (columnCount) =>
  new jsPDF({
    orientation: columnCount >= 6 ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4',
  });

export const exportToPDF = (title, columns, data, filename = 'export.pdf') => {
  const doc = createExportPdfDoc(columns.length);

  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  doc.text((title || '').replace(/₹/g, 'Rs. '), PDF_MARGIN, 22);

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated on: ${format(new Date(), 'PPpp')}`, PDF_MARGIN, 30);

  autoTable(doc, getAutoTableOptions(doc, columns, data, 36));

  doc.save(filename);
};

export const exportToExcel = (title, columns, data, filename = 'export.xlsx') => {
  const worksheetData = data.map((row) => {
    const formattedRow = {};
    columns.forEach((col) => {
      formattedRow[col.header] = getExportCellValue(col, row);
    });
    return formattedRow;
  });

  const worksheet = XLSX.utils.json_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

  const colWidths = columns.map((col) => {
    const headerLen = (col.header || '').length;
    const maxDataLen = data.reduce((max, row) => {
      const val = getExportCellValue(col, row);
      return Math.max(max, String(val).length);
    }, 0);
    return { wch: Math.max(headerLen, maxDataLen, 12) + 2 };
  });
  worksheet['!cols'] = colWidths;

  XLSX.writeFile(workbook, filename);
};
