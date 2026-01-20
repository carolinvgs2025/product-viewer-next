import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { ColumnMetadata } from './excel-parser';

export const exportToExcel = async (
    data: any[],
    headers: string[],
    columnMetadata: ColumnMetadata[],
    fileName: string = 'exported-data.xlsx',
    originalFileBuffer?: ArrayBuffer | null
) => {
    try {
        console.log('Starting Excel export process (Experimental: ExcelJS)...');

        // 1. Prepare data for insertion
        const hasGroups = columnMetadata.some(m => m.group && m.group !== 'General' && m.group !== 'Other' && m.group !== 'Identification');
        const rowsToInsert: any[][] = [];

        if (hasGroups) {
            const groupRow = headers.map(h => {
                const meta = columnMetadata.find(m => m.header === h);
                const group = meta?.group || '';
                if (group === 'Identification' || group === 'General' || group === 'Other') return '';
                return group;
            });
            rowsToInsert.push(groupRow);
        }

        rowsToInsert.push(headers);

        data.forEach(row => {
            const rowData = headers.map(h => row[h]);
            rowsToInsert.push(rowData);
        });

        console.log(`Data prepared. ${rowsToInsert.length} rows to write.`);

        // 2. Load Workbook (Original or New)
        const workbook = new ExcelJS.Workbook();
        let worksheet: ExcelJS.Worksheet;

        if (originalFileBuffer) {
            console.log('Loading original file buffer into ExcelJS...');
            await workbook.xlsx.load(originalFileBuffer);

            // Assume the first sheet is the one to update
            // Note: ExcelJS sheets are 1-based, but array access is 0-based in .worksheets array, 
            // BUT .getWorksheet(1) grabs the first one. Let's use array for safety.
            worksheet = workbook.worksheets[0];

            if (!worksheet) {
                console.warn('First sheet not found, creating new one.');
                worksheet = workbook.addWorksheet('Data');
            } else {
                console.log(`Using existing sheet: "${worksheet.name}" (ID: ${worksheet.id})`);
                // Clear existing data? 
                // Strategy: Instead of deleting rows (which might break ranges), we overwrite.
                // However, if the new data is shorter, old data remains.
                // "Unzipping" approach is safer if we stick to cell-by-cell or row-by-row update.

                // Let's try splice to remove old data but keep structure? 
                // WARNING: Splice can shift references which might break pivots too.
                // Safest for Pivot Preservation is usually: Clear values, keep cells.

                // Simple approach first: Overwrite cells, then clear remaining if any.
                // Actually, worksheet.spliceRows(1, worksheet.rowCount) is standard to clear data.
                // Let's hope exceljs handles the shared strings correctly.
                if (worksheet.rowCount > 0) {
                    worksheet.spliceRows(1, worksheet.rowCount);
                }
            }
        } else {
            console.log('Creating fresh workbook.');
            worksheet = workbook.addWorksheet('Data');
        }

        // 3. Write Data
        worksheet.addRows(rowsToInsert);

        // 4. Generate Output Buffer
        console.log('Writing workbook to buffer...');
        const buffer = await workbook.xlsx.writeBuffer();

        // 5. Download
        const dataBlob = new Blob([buffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });

        const url = window.URL.createObjectURL(dataBlob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`;
        anchor.style.display = 'none';
        document.body.appendChild(anchor);

        anchor.click();
        document.body.removeChild(anchor);

        setTimeout(() => {
            window.URL.revokeObjectURL(url);
        }, 100);

    } catch (error) {
        console.error('FATAL EXPORT ERROR:', error);
        alert('Export failed. Please check the console for details.');
    }
};
