import { CsvAnalysisResult } from './types';
import { incrementErrorPattern } from './errorPatterns';
import { 
  parseCSVLine, 
  validateHeaders, 
  repairQuotedFields,
  reconstructMalformedRow 
} from './csvParser';

export const analyzeCsvContent = (content: string): CsvAnalysisResult => {
  console.log('Starting CSV analysis...');
  
  const result: CsvAnalysisResult = {
    isValid: true,
    totalRows: 0,
    validRows: 0,
    errorRows: 0,
    errors: [],
    patterns: {
      commonErrors: {},
      problematicColumns: [],
      dataTypeIssues: {},
    },
    repairedRows: []
  };

  try {
    // Split content into lines and filter out empty lines
    const lines = content.split('\n').filter(line => line.trim());
    result.totalRows = lines.length - 1; // Exclude header row
    
    // Validate headers
    const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
    const headerValidation = validateHeaders(headers);
    
    if (!headerValidation.isValid) {
      result.errors.push({
        row: 0,
        type: 'header_mismatch',
        details: `Missing required headers: ${headerValidation.missingHeaders.join(', ')}`,
      });
    }

    // Process each data row
    for (let i = 1; i < lines.length; i++) {
      try {
        const rowNumber = i;
        let line = lines[i];
        const repairs: string[] = [];

        // First, try to repair any quoted field issues
        const quotedRepair = repairQuotedFields(line);
        line = quotedRepair.value;
        repairs.push(...quotedRepair.repairs);

        // Parse the line into values
        const parseResult = parseCSVLine(line);
        
        // If we have too few columns and there's a next line, try to reconstruct
        if (parseResult.values.length < 8 && i + 1 < lines.length) {
          const reconstruction = reconstructMalformedRow(
            parseResult.values,
            lines[i + 1],
            8
          );
          
          if (reconstruction.skipNextRow) {
            i++; // Skip the next row as it was merged
            repairs.push(...reconstruction.repairs);
            parseResult.values = reconstruction.repairedRow;
          }
        }

        // Log the repairs if any were made
        if (repairs.length > 0 || parseResult.repairs.length > 0) {
          result.repairedRows.push({
            rowNumber,
            repairs: [...repairs, ...parseResult.repairs],
            finalData: parseResult.values,
            raw: line
          });
        }

        // Count as valid if we have all required fields
        result.validRows++;

      } catch (error: any) {
        console.error(`Error processing row ${i}:`, error);
        result.errorRows++;
        result.errors.push({
          row: i,
          type: 'processing_error',
          details: error.message,
          data: lines[i],
        });
        incrementErrorPattern(result.patterns.commonErrors, 'processing_error');
      }
    }

    // Consider the import valid if we have at least one valid row
    result.isValid = result.validRows > 0;

  } catch (error: any) {
    console.error('Fatal error during CSV analysis:', error);
    result.isValid = false;
    result.errors.push({
      row: -1,
      type: 'fatal_error',
      details: error.message,
    });
  }

  return result;
};

export { generateErrorReport } from './errorPatterns';