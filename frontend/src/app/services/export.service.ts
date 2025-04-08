import { Injectable } from '@angular/core';
import { Packer } from 'docx';
import { BorderStyle, Document, HeadingLevel, Table, TableCell } from 'docx';
import { Paragraph } from 'docx';
import { TableRow } from 'docx';
import * as XLSX from 'xlsx';
import { SearchParams, SearchResultDocument } from '../commons/constants';

@Injectable({
  providedIn: 'root',
})
export class ExportService {
  // Xuất dữ liệu từ kết quả tìm kiếm vào file Excel
  processAndExportDataToExcel(documents: SearchResultDocument[], documentType: string): void {
    console.log(documentType);
    if (documents.length === 0) {
      console.warn('Không có dữ liệu để xuất');
      return;
    }

    const isIncomingDocument = documentType === 'incoming-document';
    
    const exportData = this.getExportData(documents, isIncomingDocument);
    
    // Tạo workbook Excel từ dữ liệu
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(exportData);
    
    worksheet['!cols'] = this.prepareColumnsWidth(isIncomingDocument);;
    
    const workbook: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Kết quả tìm kiếm');
    
    // Tạo tên file xuất ra
    const documentTypeLabel = isIncomingDocument ? 'Văn bản đến' : 'Văn bản đi';
    const fileName = `${documentTypeLabel}_${new Date().toLocaleDateString('vi-VN')}.xlsx`;
    
    // Xuất file Excel
    XLSX.writeFile(workbook, fileName);
  }

  getExportData(documents: SearchResultDocument[], isIncomingDocument: boolean) {
    return documents.map((doc, index) => {
      const data: Record<string, string> = {'TT': (index + 1).toString()};

      if (isIncomingDocument) {
          // Thứ tự cột cho văn bản đến
          data['Số đến'] = doc.documentNumber || '';
          data['Ngày đến'] = doc.receivedDate || '';
          data['Số ký hiệu'] = doc.referenceNumber || '';
          data['Ngày văn bản'] = doc.issuedDate || '';
          data['Hạn xử lý'] = doc.dueDate || '';
          data['Tác giả'] = doc.author || '';
          data['Trích yếu'] = doc.summary || '';
          data["Nội dung"] = doc.attachments?.join(', ') || '';

          return data;
      }

      // Thứ tự cột cho văn bản đi
      data['Số ký hiệu'] = doc.referenceNumber || '';
      data['Ngày văn bản'] = doc.issuedDate || '';
      data['Tác giả'] = doc.signedBy || '';
      data['Trích yếu'] = doc.summary || '';
      data["Nội dung"] = doc.attachments?.join(', ') || '';
      
      return data;
    });
  }

  prepareColumnsWidth(isIncomingDocument: boolean): { wch: number }[] {
    if (isIncomingDocument) {
      return [
        { wch: 5 },  // TT
        { wch: 10 }, // Số đến
        { wch: 15 }, // Ngày đến  
        { wch: 15 }, // Số ký hiệu
        { wch: 15 }, // Ngày văn bản
        { wch: 15 }, // Hạn xử lý
        { wch: 25 }, // Tác giả
        { wch: 50 }, // Trích yếu
        { wch: 50 }, // Nội dung
      ];
    }

    return [
        { wch: 5 },  // TT
        { wch: 15 }, // Số ký hiệu
        { wch: 15 }, // Ngày văn bản
        { wch: 25 }, // Tác giả
        { wch: 50 }, // Trích yếu
        { wch: 50 }, // Nội dung
    ];
  }

  // Xuất dữ liệu hiển thị ra file Word
  processAndExportDataToWord(documents: SearchResultDocument[], searchParams: SearchParams): void {
    // Kiểm tra dữ liệu
    if (documents.length === 0) {
      console.warn('Không có dữ liệu để xuất');
      return;
    }

    const isIncomingDocument = searchParams.documentType === 'incoming-document';
    
    const headerRow: TableRow = this.createHeaderRow(isIncomingDocument);
    const dataRows: TableRow[] = this.createDataRows(documents, isIncomingDocument);
    const rows: TableRow[] = [headerRow, ...dataRows];
    
    // Tạo document
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            this.createWordTitle(isIncomingDocument),
            ...this.createWordSearchInfo(searchParams),
            this.createReportDate(),
            new Paragraph(" "), // Khoảng trống
            this.createTable(rows, isIncomingDocument),
          ],
        },
      ],
    });
    
    // Xuất file
    Packer.toBlob(doc).then(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      document.body.appendChild(a);
      a.style.display = "none";
      
      const documentType = searchParams.documentType === 'incoming-document' ? 'Văn bản đến' : 'Văn bản đi';
      const fileName = `${documentType}_${new Date().toLocaleDateString('vi-VN')}.docx`;
      
      a.href = url;
      a.download = fileName;
      a.click();
      window.URL.revokeObjectURL(url);
    });
  }

  createWordTitle(isIncomingDocument: boolean): Paragraph {
    return new Paragraph({
      text: isIncomingDocument ? 'DANH SÁCH VĂN BẢN ĐẾN' : 'DANH SÁCH VĂN BẢN ĐI',
      heading: HeadingLevel.HEADING_1,
      alignment: 'center',
    });
  }
  
  createWordSearchInfo(searchParams: SearchParams): Paragraph[] {
    const searchInfo = [];
    if (searchParams.issuedDateFrom) {
      searchInfo.push(new Paragraph(`Từ ngày: ${searchParams.issuedDateFrom}`));
    }
    if (searchParams.issuedDateTo) {
      searchInfo.push(new Paragraph(`Đến ngày: ${searchParams.issuedDateTo}`));
    }
    if (searchParams.referenceNumber) {
      searchInfo.push(new Paragraph(`Số ký hiệu: ${searchParams.referenceNumber}`));
    }
    if (searchParams.author) {
      searchInfo.push(new Paragraph(`Tác giả: ${searchParams.author}`));
    }
    if (searchParams.summary) {
      searchInfo.push(new Paragraph(`Trích yếu: ${searchParams.summary}`));
    }

    return searchInfo;
  }

  createReportDate(): Paragraph {
    const formatDateString = (dateStr?: string) => {
      if (!dateStr) return '';
      try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        
        // Định dạng thành DD/MM/YYYY
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        
        return `${day}/${month}/${year}`;
      } catch {
        return dateStr;
      }
    };

    return new Paragraph({
      text: `Ngày xuất báo cáo: ${formatDateString(new Date().toISOString())}`,
      alignment: 'right',
    });
  }

  createTable(rows: TableRow[], isIncomingDocument: boolean) {
    return new Table({
      rows,
      width: {
        size: 100,
        type: 'pct',
      },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1, color: "auto" },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: "auto" },
        left: { style: BorderStyle.SINGLE, size: 1, color: "auto" },
        right: { style: BorderStyle.SINGLE, size: 1, color: "auto" },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "auto" },
        insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "auto" },
      },
      columnWidths: isIncomingDocument ? 
        [600, 800, 1200, 1200, 1200, 1200, 1800, 3000] : 
        [600, 1500, 1200, 1800, 4000],
    });
  }

  createHeaderRow(isIncomingDocument: boolean): TableRow {
    if (isIncomingDocument) {
      return new TableRow({
        children: [
          new TableCell({ 
            children: [new Paragraph({ text: 'TT', alignment: 'center' })],
            shading: { color: "auto", fill: "D3D3D3" }, 
          }),
          new TableCell({ 
            children: [new Paragraph({ text: 'Số đến', alignment: 'center' })],
            shading: { color: "auto", fill: "D3D3D3" }, 
          }),
          new TableCell({ 
            children: [new Paragraph({ text: 'Ngày đến', alignment: 'center' })],
            shading: { color: "auto", fill: "D3D3D3" }, 
          }),
          new TableCell({ 
            children: [new Paragraph({ text: 'Số ký hiệu', alignment: 'center' })],
            shading: { color: "auto", fill: "D3D3D3" }, 
          }),
          new TableCell({ 
            children: [new Paragraph({ text: 'Ngày văn bản', alignment: 'center' })],
            shading: { color: "auto", fill: "D3D3D3" }, 
          }),
          new TableCell({ 
            children: [new Paragraph({ text: 'Hạn xử lý', alignment: 'center' })],
            shading: { color: "auto", fill: "D3D3D3" }, 
          }),
          new TableCell({ 
            children: [new Paragraph({ text: 'Tác giả', alignment: 'center' })],
            shading: { color: "auto", fill: "D3D3D3" }, 
          }),
          new TableCell({ 
            children: [new Paragraph({ text: 'Trích yếu', alignment: 'center' })],
            shading: { color: "auto", fill: "D3D3D3" }, 
          }),
        ],
      });
    }
    return new TableRow({
      children: [
        new TableCell({ 
          children: [new Paragraph({ text: 'TT', alignment: 'center' })],
          shading: { color: "auto", fill: "D3D3D3" }, 
        }),
        new TableCell({ 
          children: [new Paragraph({ text: 'Số ký hiệu', alignment: 'center' })],
          shading: { color: "auto", fill: "D3D3D3" }, 
        }),
        new TableCell({ 
          children: [new Paragraph({ text: 'Ngày văn bản', alignment: 'center' })],
          shading: { color: "auto", fill: "D3D3D3" }, 
        }),
        new TableCell({ 
          children: [new Paragraph({ text: 'Tác giả', alignment: 'center' })],
          shading: { color: "auto", fill: "D3D3D3" }, 
        }),
        new TableCell({ 
          children: [new Paragraph({ text: 'Trích yếu', alignment: 'center' })],
          shading: { color: "auto", fill: "D3D3D3" }, 
        }),
      ],
    });
  }

  createDataRows(documents: SearchResultDocument[], isIncomingDocument: boolean): TableRow[] {
    const rows: TableRow[] = [];
    documents.forEach((doc, index) => {
      if (isIncomingDocument) {
        // Hàng dữ liệu cho văn bản đến
        const dataRow = new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ text: (index + 1).toString(), alignment: 'center' })] }),
            new TableCell({ children: [new Paragraph(doc.documentNumber || '')] }),
            new TableCell({ children: [new Paragraph({ text: doc.receivedDate || '', alignment: 'center' })] }),
            new TableCell({ children: [new Paragraph(doc.referenceNumber || '')] }),
            new TableCell({ children: [new Paragraph({ text: doc.issuedDate || '', alignment: 'center' })] }),
            new TableCell({ children: [new Paragraph({ text: doc.dueDate || '', alignment: 'center' })] }),
            new TableCell({ children: [new Paragraph(doc.author || '')] }),
            new TableCell({ children: [new Paragraph(doc.summary || '')] }),
          ],
        });
        rows.push(dataRow);
      } else {
        // Hàng dữ liệu cho văn bản đi
        const dataRow = new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ text: (index + 1).toString(), alignment: 'center' })] }),
            new TableCell({ children: [new Paragraph(doc.referenceNumber || '')] }),
            new TableCell({ children: [new Paragraph({ text: doc.issuedDate || '', alignment: 'center' })] }),
            new TableCell({ children: [new Paragraph(doc.signedBy || '')] }),
            new TableCell({ children: [new Paragraph(doc.summary || '')] }),
          ],
        });
        rows.push(dataRow);
      }
    });

    return rows;
  }

}
