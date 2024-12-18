export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export const statusMapping: { [key: string]: string } = {
  'active': 'active',
  'pending': 'pending',
  'completed': 'completed',
  'cancelled': 'cancelled',
  'closed': 'completed',
  'done': 'completed',
  'cancel': 'cancelled',
  'canceled': 'cancelled'
};

export const validateRowData = (rowData: any, headers: string[]) => {
  const missingFields = [];
  if (!rowData.agreementNumber) missingFields.push('Agreement Number');
  if (!rowData.fullName) missingFields.push('full_name');
  if (!rowData.status) missingFields.push('STATUS');

  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
  }

  const mappedStatus = statusMapping[rowData.status.toLowerCase()];
  if (!mappedStatus) {
    throw new Error(`Invalid status value: "${rowData.status}". Allowed values are: ${Object.keys(statusMapping).join(', ')}`);
  }

  return mappedStatus;
};

export const extractRowData = (currentRowValues: string[], headers: string[]) => {
  return {
    agreementNumber: currentRowValues[headers.indexOf('Agreement Number')]?.trim(),
    licenseNo: currentRowValues[headers.indexOf('License No')]?.trim(),
    fullName: currentRowValues[headers.indexOf('full_name')]?.trim(),
    licenseNumber: currentRowValues[headers.indexOf('License Number')]?.trim(),
    checkoutDate: currentRowValues[headers.indexOf('Check-out Date')]?.trim(),
    checkinDate: currentRowValues[headers.indexOf('Check-in Date')]?.trim(),
    returnDate: currentRowValues[headers.indexOf('Return Date')]?.trim(),
    status: currentRowValues[headers.indexOf('STATUS')]?.trim()?.toLowerCase(),
  };
};