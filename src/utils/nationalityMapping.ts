// European Union member countries
const EU_COUNTRIES = [
  'Austria',
  'Belgium', 
  'Bulgaria',
  'Croatia',
  'Cyprus',
  'Czech Republic',
  'Denmark',
  'Estonia',
  'Finland',
  'France',
  'Germany',
  'Greece',
  'Hungary',
  'Ireland',
  'Italy',
  'Latvia',
  'Lithuania',
  'Luxembourg',
  'Malta',
  'Netherlands',
  'Poland',
  'Portugal',
  'Romania',
  'Slovakia',
  'Slovenia',
  'Spain',
  'Sweden'
];

/**
 * Get nationality status based on country selection
 * @param country - The selected country name
 * @returns 'British' for UK, 'EU' for European countries, 'NON-EU' for others
 */
export function getNationalityStatusFromCountry(country: string): string {
  if (!country) return '';
  
  // Handle UK variations
  if (country === 'United Kingdom' || country === 'United Kingdom of Great Britain and Northern Ireland') {
    return 'British';
  }
  
  // Check if country is in EU
  if (EU_COUNTRIES.includes(country)) {
    return 'EU';
  }
  
  // Default to NON-EU for all other countries
  return 'NON-EU';
}