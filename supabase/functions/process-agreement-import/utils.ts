export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const isValidDate = (day: number, month: number, year: number): boolean => {
  // Check if month is between 1 and 12
  if (month < 1 || month > 12) return false;
  
  // Get the last day of the month for the given year/month
  const daysInMonth = new Date(year, month, 0).getDate();
  
  // Check if day is valid for the given month
  if (day < 1 || day > daysInMonth) return false;
  
  return true;
};

const parseDate = (dateStr: string): string | null => {
  if (!dateStr || dateStr.trim() === '') return null;
  
  // Clean the input string and split by either '/' or '-'
  const cleanDateStr = dateStr.trim();
  const parts = cleanDateStr.split(/[-/]/);
  
  if (parts.length === 3) {
    let day: number, month: number, year: number;

    // Assume DD/MM/YYYY format
    day = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10);
    year = parseInt(parts[2], 10);

    // Validate the parsed numbers
    if (isNaN(day) || isNaN(month) || isNaN(year)) {
      throw new Error(`Invalid date parts in: ${dateStr}. All parts must be valid numbers.`);
    }

    if (!isValidDate(day, month, year)) {
      throw new Error(`Invalid date: ${dateStr}. Day or month is out of range.`);
    }

    // Convert to YYYY-MM-DD format for PostgreSQL
    return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  }
  
  throw new Error(`Invalid date format: ${dateStr}. Please use DD/MM/YYYY format.`);
};

export const validateRowData = (rowData: any, headers: string[]) => {
  const missingFields = [];
  if (!rowData.agreementNumber) missingFields.push('Agreement Number');
  if (!rowData.fullName) missingFields.push('full_name');
  if (!rowData.status) missingFields.push('STATUS');

  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
  }

  const statusMapping: { [key: string]: string } = {
    'active': 'active',
    'pending': 'pending',
    'pending_payment': 'pending',
    'pending_deposit': 'pending',
    'completed': 'completed',
    'cancelled': 'cancelled',
    'closed': 'completed',
    'done': 'completed',
    'cancel': 'cancelled',
    'canceled': 'cancelled',
    'open': 'active'
  };

  const mappedStatus = statusMapping[rowData.status.toLowerCase()];
  if (!mappedStatus) {
    throw new Error(`Invalid status value: "${rowData.status}". Allowed values are: ${Object.keys(statusMapping).join(', ')}`);
  }

  return mappedStatus;
};

export const extractRowData = (currentRowValues: string[], headers: string[]) => {
  const checkoutDate = parseDate(currentRowValues[headers.indexOf('Check-out Date')]?.trim());
  const checkinDate = parseDate(currentRowValues[headers.indexOf('Check-in Date')]?.trim());
  const returnDate = parseDate(currentRowValues[headers.indexOf('Return Date')]?.trim());

  console.log('Parsed dates:', {
    checkoutDate,
    checkinDate,
    returnDate
  });

  return {
    agreementNumber: currentRowValues[headers.indexOf('Agreement Number')]?.trim(),
    licenseNo: currentRowValues[headers.indexOf('License No')]?.trim(),
    fullName: currentRowValues[headers.indexOf('full_name')]?.trim(),
    licenseNumber: currentRowValues[headers.indexOf('License Number')]?.trim(),
    checkoutDate,
    checkinDate,
    returnDate,
    status: currentRowValues[headers.indexOf('STATUS')]?.trim()?.toLowerCase(),
  };
};