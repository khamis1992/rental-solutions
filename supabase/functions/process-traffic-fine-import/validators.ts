export interface ValidationError {
  row: number;
  error: string;
  data: string;
}

export const validateRow = (
  rowData: string[],
  rowIndex: number,
  expectedColumns: number
): ValidationError | null => {
  if (rowData.length !== expectedColumns) {
    console.error(`Row ${rowIndex} has incorrect number of columns:`, {
      expected: expectedColumns,
      actual: rowData.length,
      data: rowData
    });
    return {
      row: rowIndex,
      error: `Incorrect number of columns (expected ${expectedColumns}, found ${rowData.length})`,
      data: rowData.join(',')
    };
  }
  return null;
};

export const normalizeRow = (
  rowData: string[],
  expectedColumns: number
): string[] => {
  if (rowData.length < expectedColumns) {
    console.log("Normalizing row with missing columns:", {
      original: rowData.length,
      adding: expectedColumns - rowData.length
    });
    return [...rowData, ...Array(expectedColumns - rowData.length).fill('')];
  }
  return rowData.slice(0, expectedColumns);
};

export const validateHeaders = (headers: string[]): string[] | null => {
  const requiredHeaders = [
    'serial_number',
    'violation_number',
    'violation_date',
    'license_plate',
    'fine_location',
    'violation_charge',
    'fine_amount',
    'violation_points'
  ];

  const missingHeaders = requiredHeaders.filter(
    header => !headers.map(h => h.toLowerCase().trim()).includes(header)
  );

  if (missingHeaders.length > 0) {
    console.error('Missing required headers:', missingHeaders);
    return missingHeaders;
  }

  return null;
};