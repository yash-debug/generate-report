import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

type ReportResultRow = {
  serialNumber: number | null;
  testName: string;
  result: string;
};

@Component({
  selector: 'app-report',
  imports: [CommonModule, FormsModule],
  templateUrl: './report.component.html',
  styleUrl: './report.component.css'
})
export class ReportComponent {
  isGenerating = false;

  reportForm = {
    refNo: '',
    nameOfParty: '',
    date: this.getTodayDate(),
    dateOfReceipt: this.getTodayDate(),
    natureOfSample: '',
    results: [this.createEmptyRow(1)]
  };

  addResultRow() {
    this.reportForm.results = [
      ...this.reportForm.results,
      this.createEmptyRow(this.reportForm.results.length + 1)
    ];
  }

  deleteResultRow(index: number) {
    if (this.reportForm.results.length === 1) {
      this.reportForm.results = [this.createEmptyRow(1)];
      return;
    }

    this.reportForm.results = this.reportForm.results
      .filter((_, rowIndex) => rowIndex !== index)
      .map((row, rowIndex) => ({
        ...row,
        serialNumber: rowIndex + 1
      }));
  }

  async submitReport() {
    try {
      this.isGenerating = true;

      const response = await fetch('assets/report-template-v4.pdf');
      const templateBytes = await response.arrayBuffer();
      const pdfDoc = await PDFDocument.load(templateBytes);
      const page = pdfDoc.getPage(0);
      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      this.clearTemplateFields(page);

      this.drawField(page, {
        x: 4 * 16,
        y: 16.95 * 16,
        width: 140,
        height: 26,
        value: 'Ref. No. : ' + (this.reportForm.refNo || '-'),
        font,
        fontSize: 13,
        clearPaddingLeft: 2
      });

      this.drawField(page, {
        x: 25 * 16,
        y: 16.95 * 16,
        width: 95,
        height: 26,
        value: 'DATE : ' + this.formatDate(this.reportForm.date),
        font,
        fontSize: 13,
        clearPaddingLeft: 2
      });

      this.drawField(page, {
        x: 18.15 * 16,
        y: 18.95 * 16,
        width: 210,
        height: 24,
        value: ' :    M/s. ' + (this.reportForm.nameOfParty || '-'),
        font,
        fontSize: 13,
        clearPaddingLeft: 1
      });

      this.drawField(page, {
        x: 18.1 * 16,
        y: 20.18 * 16,
        width: 215,
        height: 24,
        value: ' :    ' + (this.reportForm.natureOfSample || '-'),
        font,
        fontSize: 13,
        clearPaddingLeft: 1
      });

      this.drawField(page, {
        x: 18.1 * 16,
        y: 21.4 * 16,
        width: 120,
        height: 24,
        value: ' :    ' + this.formatDate(this.reportForm.dateOfReceipt),
        font,
        fontSize: 13,
        clearPaddingLeft: 1
      });

      this.drawResults(page, font);

      const pdfBytes = await pdfDoc.save();
      this.downloadPdf(pdfBytes, this.getDownloadName());
    } catch (error) {
      console.error('Error generating report PDF', error);
      alert('Error generating PDF report');
    } finally {
      this.isGenerating = false;
    }
  }

  private drawField(
    page: any,
    options: {
      x: number;
      y: number;
      width: number;
      height: number;
      value: string;
      font: any;
      fontSize: number;
      clearPaddingLeft?: number;
    }
  ) {
    const pageHeight = page.getHeight();
    const pdfY = pageHeight - options.y;

    this.clearArea(
      page,
      options.x - (options.clearPaddingLeft ?? 6),
      pdfY - 4,
      options.width,
      options.height
    );

    page.drawText(options.value, {
      x: options.x,
      y: pdfY,
      size: options.fontSize,
      font: options.font,
      color: rgb(0, 0, 0)
    });
  }

  private drawResults(page: any, font: any) {
    const pageHeight = page.getHeight();
    const tableX = 2.8 * 16;
    const tableTopY = pageHeight - (24.85 * 16);
    const headerHeight = 24;
    const rowHeight = 22;
    const tableWidth = 525;
    const col1 = 65;
    const col2 = 285;
    const results = this.reportForm.results.filter(
      (row) => row.serialNumber || row.testName.trim() || row.result.trim()
    );
    const bodyRows = Math.max(results.length, 1);
    const tableHeight = headerHeight + (bodyRows * rowHeight);
    const tableBottomY = tableTopY - tableHeight;

    this.clearArea(page, 2 * 16, tableBottomY - 8, 535, tableHeight + 30);

    page.drawRectangle({
      x: tableX,
      y: tableBottomY,
      width: tableWidth,
      height: tableHeight,
      borderWidth: 1,
      borderColor: rgb(0, 0, 0),
      color: rgb(1, 1, 1)
    });

    page.drawLine({
      start: { x: tableX, y: tableTopY - headerHeight },
      end: { x: tableX + tableWidth, y: tableTopY - headerHeight },
      thickness: 1,
      color: rgb(0, 0, 0)
    });

    page.drawLine({
      start: { x: tableX + col1, y: tableTopY },
      end: { x: tableX + col1, y: tableBottomY },
      thickness: 1,
      color: rgb(0, 0, 0)
    });

    page.drawLine({
      start: { x: tableX + col1 + col2, y: tableTopY },
      end: { x: tableX + col1 + col2, y: tableBottomY },
      thickness: 1,
      color: rgb(0, 0, 0)
    });

    for (let index = 1; index < bodyRows; index++) {
      const y = tableTopY - headerHeight - (index * rowHeight);
      page.drawLine({
        start: { x: tableX, y },
        end: { x: tableX + tableWidth, y },
        thickness: 1,
        color: rgb(0, 0, 0)
      });
    }

    page.drawText('S. No.', {
      x: tableX + 8,
      y: tableTopY - 15,
      size: 12,
      font,
      color: rgb(0, 0, 0)
    });

    page.drawText('Nature of Sample', {
      x: tableX + col1 + 8,
      y: tableTopY - 15,
      size: 12,
      font,
      color: rgb(0, 0, 0)
    });

    page.drawText('Result', {
      x: tableX + col1 + col2 + 8,
      y: tableTopY - 15,
      size: 12,
      font,
      color: rgb(0, 0, 0)
    });

    results.forEach((row, index) => {
      const rowY = tableTopY - headerHeight - 14 - (index * rowHeight);
      page.drawText(String(row.serialNumber ?? index + 1), {
        x: tableX + 8,
        y: rowY,
        size: 12,
        font,
        color: rgb(0, 0, 0)
      });

      page.drawText(this.fitText(row.testName || '-', 30), {
        x: tableX + col1 + 8,
        y: rowY,
        size: 12,
        font,
        color: rgb(0, 0, 0)
      });

      page.drawText(this.fitText(row.result || '-', 18), {
        x: tableX + col1 + col2 + 8,
        y: rowY,
        size: 12,
        font,
        color: rgb(0, 0, 0)
      });
    });
  }

  private clearTemplateFields(page: any) {
    const pageHeight = page.getHeight();
    const fields = [
      { x: 5.9 * 16, y: 15.72 * 16, width: 145, height: 28 },
      { x: 22.5 * 16, y: 15.72 * 16, width: 110, height: 28 },
      { x: 18 * 16, y: 17.95 * 16, width: 220, height: 24 },
      { x: 18 * 16, y: 19.18 * 16, width: 220, height: 24 },
      { x: 18 * 16, y: 20.4 * 16, width: 130, height: 24 }
    ];

    fields.forEach((field) => {
      this.clearArea(
        page,
        field.x,
        pageHeight - field.y - field.height + 2,
        field.width,
        field.height
      );
    });
  }

  private clearArea(page: any, x: number, y: number, width: number, height: number) {
    page.drawRectangle({
      x,
      y,
      width,
      height,
      color: rgb(1, 1, 1)
    });
  }

  private formatDate(value: string): string {
    if (!value) {
      return '-';
    }

    const [year, month, day] = value.split('-');
    if (!year || !month || !day) {
      return value;
    }

    return `${day}/${month}/${year}`;
  }

  private downloadPdf(pdfBytes: Uint8Array, fileName: string) {
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  }

  private getDownloadName(): string {
    const nameOfParty = this.sanitizeFilePart(this.reportForm.nameOfParty) || 'party';
    const refNo = this.sanitizeFilePart(this.reportForm.refNo) || 'report';
    return `${nameOfParty}_${refNo}_REPORT.pdf`;
  }

  private fitText(value: string, maxLength: number): string {
    if (value.length <= maxLength) {
      return value;
    }

    return `${value.slice(0, maxLength - 3)}...`;
  }

  private sanitizeFilePart(value: string): string {
    return value
      .trim()
      .replace(/[\\/:*?"<>|]/g, '')
      .replace(/\s+/g, '_');
  }

  private createEmptyRow(serialNumber: number): ReportResultRow {
    return {
      serialNumber,
      testName: '',
      result: ''
    };
  }

  private getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }
}
