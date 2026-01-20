import { utils, write } from 'xlsx';
import { ColumnMetadata } from './excel-parser';

export const exportToExcel = (data: any[], headers: string[], columnMetadata: ColumnMetadata[], fileName: string = 'exported-data.xlsx') => {
    // 1. Prepare data for worksheet
    // If we have column metadata with groups, we want two header rows
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

    // 2. Create worksheet
    const worksheet = utils.aoa_to_sheet(worksheetData);

    // 3. Create workbook
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, 'Data');

    // 4. Generate binary logic (Fix for Vercel/Production)
    // Instead of using writeFile (which can be flaky with file-saver in some envs), we construct the Blob manually.
    const excelBuffer = write(workbook, { bookType: 'xlsx', type: 'array' });

    const dataBlob = new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8'
    });

    // 5. Trigger Download
    const url = window.URL.createObjectURL(dataBlob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`;
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.URL.revokeObjectURL(url);
};
