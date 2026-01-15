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

        // Explicitly lock to the first sheet as per user requirement
        const targetSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[targetSheetName];

        if (!worksheet) {
          reject(new Error(`No sheets found in the Excel file.`));
          return;
        }

        // Parse as array of arrays first to find the header row
        // header: 1 produces an array of arrays [ ["A", "B"], [1, 2] ]
        const jsonSheet = utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        if (jsonSheet.length === 0) {
          resolve({ headers: [], data: [], rowCount: 0, columnMetadata: [] });
          return;
        }

        // 1. AUTO-DETECT HEADER ROW
        // Look for a row containing "Id" and "Name" (case-insensitive)
        let headerRowIndex = 0;
        let groupRowIndex = -1;

        for (let i = 0; i < Math.min(jsonSheet.length, 10); i++) {
          // Get raw values for checking
          const rawRow = jsonSheet[i];
          const rowStr = rawRow.map(c => String(c).toLowerCase().trim());

          // Check for presence of "id" and "name"
          if (rowStr.includes('id') && rowStr.includes('name')) {
            headerRowIndex = i;
            if (i > 0) groupRowIndex = i - 1;
            break;
          }
        }

        // 2. EXTRACT HEADERS & METADATA
        const rawHeaderRow = jsonSheet[headerRowIndex];
        const groupRow = groupRowIndex >= 0 ? jsonSheet[groupRowIndex] : null;

        const headers: string[] = [];
        const columnMetadata: ColumnMetadata[] = [];
        const validIndices: number[] = []; // Track which column indices we actually keep

        let currentGroup = "";

        // Iterate through the raw header positions
        rawHeaderRow.forEach((cellValue: any, index: number) => {
          let headerText = cellValue ? String(cellValue).trim() : "";

          // Sanitize: Replace newlines with spaces for cleaner keys
          headerText = headerText.replace(/[\r\n]+/g, " ");

          if (headerText) {
            headers.push(headerText);
            validIndices.push(index);

            // Handle Grouping (Explicit headers only, no fill-right)
            if (groupRow) {
              const groupVal = groupRow[index];
              if (groupVal && String(groupVal).trim()) {
                currentGroup = String(groupVal).trim();
              } else {
                currentGroup = ""; // Reset if blank (don't inherit)
              }
            }

            columnMetadata.push({
              header: headerText,
              group: currentGroup || (groupRow ? "Identification" : "General")
            });
          }
        });

        // 3. EXTRACT DATA
        // Start reading data from the row after the header
        const rawDataRows = jsonSheet.slice(headerRowIndex + 1);

        const finalData = rawDataRows.map((rowArray: any[]) => {
          const rowObj: any = {};
          // Only map the columns that had valid headers
          validIndices.forEach((colIndex, i) => {
            const header = headers[i];
            const value = rowArray[colIndex]; // Direct index mapping
            // Store undefined/null as empty string or keep as is? 
            // Context expects explicit values, but undefined often okay.
            // Converting to string here might be safer for display consistency?
            // But let's keep raw types if possible (numbers, etc).
            rowObj[header] = value !== undefined ? value : "";
          });
          return rowObj;
        });

        resolve({
          headers,
          data: finalData,
          rowCount: finalData.length,
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
