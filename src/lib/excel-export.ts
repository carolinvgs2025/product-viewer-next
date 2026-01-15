import { utils, writeFile } from 'xlsx';
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

    // 3. Handle Merged Cells for Groups if applicable
    if (hasGroups) {
        const merges: any[] = [];
        let startCol = 0;
        const groupRow = worksheetData[0];

        for (let i = 1; i <= groupRow.length; i++) {
            if (i === groupRow.length || groupRow[i] !== groupRow[startCol]) {
                if (i - 1 > startCol && groupRow[startCol] !== '') {
                    merges.push({ s: { r: 0, c: startCol }, e: { r: 0, c: i - 1 } });
                }
                startCol = i;
            }
        }
        worksheet['!merges'] = merges;
    }

    // 4. Create workbook and save
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, 'Data');
    writeFile(workbook, fileName);
};
