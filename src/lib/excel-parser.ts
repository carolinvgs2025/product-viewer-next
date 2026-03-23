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
  originalFileBuffer?: ArrayBuffer;
}

export const parseExcelFile = async (file: File): Promise<ParseResult> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result as ArrayBuffer;
        const workbook = read(data, { type: 'array' });

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
          resolve({ headers: [], data: [], rowCount: 0, columnMetadata: [], originalFileBuffer: data });
          return;
        }

        // 1. EXTRACT HEADERS & METADATA
        // Auto-detect 1-tier vs 2-tier structure
        let groupRow: any[] = [];
        let rawHeaderRow: any[] = [];
        let dataStartIndex = 1;

        const row0Str = (jsonSheet[0] || []).map(v => String(v || "").toLowerCase()).join(" ");
        const firstColBlankRow0 = !jsonSheet[0]?.[0] || String(jsonSheet[0]?.[0]).trim() === "";
        const firstColHasValueRow1 = !!jsonSheet[1]?.[0] && String(jsonSheet[1]?.[0]).trim() !== "";
        const hasGrouping = row0Str.includes("attribute") || (firstColBlankRow0 && firstColHasValueRow1);

        if (hasGrouping) {
            groupRow = jsonSheet[0] || [];
            rawHeaderRow = jsonSheet[1] || [];
            dataStartIndex = 2;
        } else {
            groupRow = []; // Default group will be "General"
            rawHeaderRow = jsonSheet[0] || [];
            dataStartIndex = 1;
        }

        const headers: string[] = [];
        const columnMetadata: ColumnMetadata[] = [];
        const validIndices: number[] = [];

        let lastGroup = "";
        const seenHeaders = new Set<string>();

        // Iterate through the raw header positions
        rawHeaderRow.forEach((cellValue: any, index: number) => {
          let headerText = cellValue ? String(cellValue).trim() : "";
          headerText = headerText.replace(/[\r\n]+/g, " ");

          if (headerText) {
            // Deduplicate header
            let originalHeader = headerText;
            let counter = 1;
            while (seenHeaders.has(headerText)) {
                headerText = `${originalHeader} (${counter})`;
                counter++;
            }
            seenHeaders.add(headerText);

            headers.push(headerText);
            validIndices.push(index);

            // Handle Grouping with "Fill-Right" Logic (Row 0)
            const groupVal = groupRow[index];
            const currentGroupText = groupVal ? String(groupVal).trim() : "";

            if (currentGroupText) {
              lastGroup = currentGroupText;
            }
            // If current cell is empty, it inherits from lastGroup (fill-right)

            columnMetadata.push({
              header: headerText,
              group: lastGroup || "General"
            });
          }
        });

        // 2. EXTRACT DATA
        // Start reading data from dataStartIndex onwards
        const rawDataRows = jsonSheet.slice(dataStartIndex);

        const finalData = rawDataRows.map((rowArray: any[]) => {
          if (!rowArray) return null;
          const rowObj: any = {};
          validIndices.forEach((colIndex, i) => {
            const header = headers[i];
            const value = rowArray[colIndex];
            rowObj[header] = value !== undefined ? value : "";
          });
          return rowObj;
        }).filter(Boolean);

        resolve({
          headers,
          data: finalData,
          rowCount: finalData.length,
          columnMetadata,
          originalFileBuffer: data
        });

      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};
