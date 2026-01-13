import { read, utils } from 'xlsx';

export interface ColumnMetadata {
  header: string;
  group: string;
}

export interface ParseResult {
  headers: string[];
  data: any[];
  rowCount: number;
  columnMetadata: ColumnMetadata[];
}

export const parseExcelFile = async (file: File): Promise<ParseResult> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Parse as array of arrays first to find the header row
        const jsonSheet = utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        if (jsonSheet.length === 0) {
          resolve({ headers: [], data: [], rowCount: 0, columnMetadata: [] });
          return;
        }

        // AUTO-DETECT HEADER ROW
        // We look for a row that contains "Id" and "Name" (case-insensitive)
        let headerRowIndex = 0;
        let groupRowIndex = -1;

        // Scan first 10 rows maximum
        for (let i = 0; i < Math.min(jsonSheet.length, 10); i++) {
          // Normalize: convert to string, lower case, and trim whitespace
          const rowStr = jsonSheet[i].map(c => String(c).toLowerCase().trim());

          // Flexible check: if row has "id" AND "name"
          if (rowStr.includes('id') && rowStr.includes('name')) {
            headerRowIndex = i;
            // Check if there's a row above this that might be group labels
            if (i > 0) {
              groupRowIndex = i - 1;
            }
            break;
          }
        }

        const headers = jsonSheet[headerRowIndex].map(h => String(h || "")); // Ensure headers are strings

        // Extract column groups if they exist
        const columnMetadata: ColumnMetadata[] = [];
        if (groupRowIndex >= 0) {
          const groupRow = jsonSheet[groupRowIndex];
          let currentGroup = "";

          headers.forEach((header, index) => {
            // If there's a value in the group row at this index, use it
            // Otherwise, use the previous group (merged cells behavior)
            if (groupRow[index] && String(groupRow[index]).trim()) {
              currentGroup = String(groupRow[index]).trim();
            }

            columnMetadata.push({
              header,
              group: currentGroup || "Identification"
            });
          });
        } else {
          // No group row found, assign all to "General"
          headers.forEach(header => {
            columnMetadata.push({
              header,
              group: "General"
            });
          });
        }

        // Data starts after the header row
        const rawRows = jsonSheet.slice(headerRowIndex + 1);

        const dataRows = rawRows.map((row: any) => {
          const rowObj: any = {};
          headers.forEach((header, index) => {
            rowObj[header] = row[index];
          });
          return rowObj;
        });

        resolve({
          headers,
          data: dataRows,
          rowCount: dataRows.length,
          columnMetadata
        });

      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsBinaryString(file);
  });
};
