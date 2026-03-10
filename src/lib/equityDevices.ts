/**
 * Check if a company has any equity compensation devices configured
 * (RSU, ESPP, BSPCE, AGA, Stock Options)
 */
export const hasEquityDevices = (compensationDevices: any): boolean => {
  if (!compensationDevices || typeof compensationDevices !== "object") return false;
  
  const equityKeys = ["rsu", "espp", "bspce", "aga", "stock_options"];
  return equityKeys.some((key) => compensationDevices[key] === true);
};
