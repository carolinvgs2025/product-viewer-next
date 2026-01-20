import * as XLSX from 'xlsx';
import { ColumnMetadata } from './excel-parser';

export const exportToExcel = (data: any[], headers: string[], columnMetadata: ColumnMetadata[], fileName: string = 'exported-data.xlsx') => {
    try {
        console.log('Starting Excel export process...');
        console.log('Using XLSX version:', XLSX.version);

        // 1. Prepare data for worksheet
        const hasGroups = columnMetadata.some(m => m.group && m.group !== 'General' && m.group !== 'Other' && m.group !== 'Identification');

        const worksheetData: any[][] = [];

        if (hasGroups) {
            // Group row
            const groupRow = headers.map(h => {
                const meta = columnMetadata.find(m => m.header === h);
                const group = meta?.group || '';
                // Hide default groups in export
                if (group === 'Identification' || group === 'General' || group === 'Other') return '';
                return group;
            });
            worksheetData.push(groupRow);
        }

        // Header row
        worksheetData.push(headers);

        // Data rows
        data.forEach(row => {
            const rowData = headers.map(h => row[h]);
            worksheetData.push(rowData);
        });
        console.log('Worksheet data prepared. Rows:', worksheetData.length);

        // 2. Create worksheet
        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

        // 3. Create workbook
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
        console.log('Workbook created');

        // 4. Generate binary logic (Fix for Vercel/Production)
        // Instead of using writeFile (which can be flaky with file-saver in some envs), we construct the Blob manually.
        console.log('Generating binary buffer (Method: XLSX.write)...');
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        console.log('Binary buffer generated. Bytes:', excelBuffer.byteLength);

        console.log('Creating Blob...');
        const dataBlob = new Blob([excelBuffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8'
        });
        console.log('Blob created. Size:', dataBlob.size, 'Type:', dataBlob.type);

        // 5. Trigger Download
        const url = window.URL.createObjectURL(dataBlob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`;
        anchor.style.display = 'none';
        document.body.appendChild(anchor);

        console.log('Attempting to click download anchor:', anchor.download);
        anchor.click();
        console.log('Click executed');

        document.body.removeChild(anchor);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('FATAL EXPORT ERROR:', error);
        alert('Export failed. Please check the console for details.');
    }
};
