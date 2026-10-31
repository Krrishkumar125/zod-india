/**
 * Pure, dependency-free validators for Indian identifiers and formats.
 *
 * Every check here is offline: format rules and, where one exists, the published
 * checksum. None of them confirms that a number was actually issued to anyone.
 */

const ALNUM36 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/** Strip whitespace and hyphens, then upper-case. */
const compact = (value: string): string => value.replace(/[\s-]+/g, '').toUpperCase();

// ---------------------------------------------------------------------------
// GSTIN
// ---------------------------------------------------------------------------

/** GST state / UT codes (first two digits of a GSTIN). 97 = Other Territory, 99 = Centre Jurisdiction. */
export const GST_STATE_CODES: Readonly<Record<string, string>> = Object.freeze({
  '01': 'Jammu and Kashmir',
  '02': 'Himachal Pradesh',
  '03': 'Punjab',
  '04': 'Chandigarh',
  '05': 'Uttarakhand',
  '06': 'Haryana',
  '07': 'Delhi',
  '08': 'Rajasthan',
  '09': 'Uttar Pradesh',
  '10': 'Bihar',
  '11': 'Sikkim',
  '12': 'Arunachal Pradesh',
  '13': 'Nagaland',
  '14': 'Manipur',
  '15': 'Mizoram',
  '16': 'Tripura',
  '17': 'Meghalaya',
  '18': 'Assam',
  '19': 'West Bengal',
  '20': 'Jharkhand',
  '21': 'Odisha',
  '22': 'Chhattisgarh',
  '23': 'Madhya Pradesh',
  '24': 'Gujarat',
  '25': 'Daman and Diu',
  '26': 'Dadra and Nagar Haveli and Daman and Diu',
  '27': 'Maharashtra',
  '28': 'Andhra Pradesh (old)',
  '29': 'Karnataka',
  '30': 'Goa',
  '31': 'Lakshadweep',
  '32': 'Kerala',
  '33': 'Tamil Nadu',
  '34': 'Puducherry',
  '35': 'Andaman and Nicobar Islands',
  '36': 'Telangana',
  '37': 'Andhra Pradesh',
  '38': 'Ladakh',
  '97': 'Other Territory',
  '99': 'Centre Jurisdiction',
});

const GSTIN_RE = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

/** Normalise a GSTIN-like input: trims, removes spaces/hyphens, upper-cases. */
export const normalizeGSTIN = compact;

/**
 * Compute the GSTIN check character for the first 14 characters (the GSTN mod-36 algorithm).
 * Returns `undefined` if the input is not 14 base-36 characters.
 */
export function gstinCheckChar(first14: string): string | undefined {
  const s = first14.toUpperCase();
  if (!/^[0-9A-Z]{14}$/.test(s)) return undefined;
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    const product = ALNUM36.indexOf(s.charAt(i)) * (i % 2 === 0 ? 1 : 2);
    sum += Math.floor(product / 36) + (product % 36);
  }
  return ALNUM36.charAt((36 - (sum % 36)) % 36);
}

export interface GSTINOptions {
  /** Verify the 15th character checksum. Default `true`. */
  checksum?: boolean;
}

/** Validate a GSTIN: structure, known state code, embedded PAN, and mod-36 checksum. Input must already be normalised. */
export function isValidGSTIN(value: string, options: GSTINOptions = {}): boolean {
  if (!GSTIN_RE.test(value)) return false;
  if (!(value.slice(0, 2) in GST_STATE_CODES)) return false;
  if (!isValidPAN(value.slice(2, 12))) return false;
  if (options.checksum === false) return true;
  return gstinCheckChar(value.slice(0, 14)) === value.charAt(14);
}

/** Break a valid GSTIN into its parts. Returns `undefined` for invalid input. */
export function parseGSTIN(
  value: string,
):
  | { stateCode: string; state: string; pan: string; entityNumber: string; checkChar: string }
  | undefined {
  const v = normalizeGSTIN(value);
  if (!isValidGSTIN(v)) return undefined;
  const stateCode = v.slice(0, 2);
  return {
    stateCode,
    state: GST_STATE_CODES[stateCode] as string,
    pan: v.slice(2, 12),
    entityNumber: v.charAt(12),
    checkChar: v.charAt(14),
  };
}

// ---------------------------------------------------------------------------
// PAN
// ---------------------------------------------------------------------------

/** Holder type encoded in the 4th character of a PAN. */
export const PAN_ENTITY_TYPES: Readonly<Record<string, string>> = Object.freeze({
  A: 'Association of Persons (AOP)',
  B: 'Body of Individuals (BOI)',
  C: 'Company',
  F: 'Firm / LLP',
  G: 'Government',
  H: 'Hindu Undivided Family (HUF)',
  J: 'Artificial Juridical Person',
  L: 'Local Authority',
  P: 'Individual',
  T: 'Trust',
});

const PAN_RE = /^[A-Z]{3}[ABCFGHJLPT][A-Z]\d{4}[A-Z]$/;

export const normalizePAN = compact;

/** Validate a PAN: `AAAPA9999A` with a known holder-type 4th character. No checksum is published for PAN. */
export function isValidPAN(value: string): boolean {
  return PAN_RE.test(value);
}

/** Holder type for a PAN, or `undefined` if invalid. */
export function panEntityType(value: string): string | undefined {
  const v = normalizePAN(value);
  return isValidPAN(v) ? PAN_ENTITY_TYPES[v.charAt(3)] : undefined;
}

// ---------------------------------------------------------------------------
// TAN
// ---------------------------------------------------------------------------

const TAN_RE = /^[A-Z]{4}\d{5}[A-Z]$/;
export const normalizeTAN = compact;
/** Validate a TAN (Tax Deduction Account Number): `AAAA99999A`. Format only. */
export function isValidTAN(value: string): boolean {
  return TAN_RE.test(value);
}

// ---------------------------------------------------------------------------
// IFSC
// ---------------------------------------------------------------------------

const IFSC_RE = /^[A-Z]{4}0[A-Z0-9]{6}$/;
export const normalizeIFSC = compact;
/** Validate an IFSC: 4-letter bank code, a literal `0`, then a 6-character branch code. Format only. */
export function isValidIFSC(value: string): boolean {
  return IFSC_RE.test(value);
}

// ---------------------------------------------------------------------------
// UPI VPA
// ---------------------------------------------------------------------------

const UPI_RE = /^[a-z0-9][a-z0-9._-]{1,255}@[a-z][a-z0-9]{1,63}$/;
/** Normalise a UPI ID: trims and lower-cases (UPI handles are case-insensitive). */
export const normalizeUPI = (value: string): string => value.trim().toLowerCase();
/**
 * Validate a UPI Virtual Payment Address (`handle@psp`). Syntax only: this does not
 * check that the PSP handle exists or that the address is registered.
 */
export function isValidUPI(value: string): boolean {
  return UPI_RE.test(value);
}

// ---------------------------------------------------------------------------
// Mobile
// ---------------------------------------------------------------------------

/** Normalise an Indian mobile number to E.164 (`+91XXXXXXXXXX`), or return the cleaned input if it does not match. */
export function normalizeMobile(value: string): string {
  const cleaned = value.replace(/[\s\-().]+/g, '');
  const m = /^(?:\+91|0091|91|0)?([6-9]\d{9})$/.exec(cleaned);
  return m ? `+91${m[1] as string}` : cleaned;
}
/** Validate an Indian mobile number in E.164 form (`+91` then 10 digits starting 6-9). Normalise first. */
export function isValidMobile(value: string): boolean {
  return /^\+91[6-9]\d{9}$/.test(value);
}

// ---------------------------------------------------------------------------
// PIN code
// ---------------------------------------------------------------------------

export const normalizePincode = (value: string): string => value.replace(/\s+/g, '');
/** Validate an Indian postal PIN code: 6 digits, first digit 1-9. Format only. */
export function isValidPincode(value: string): boolean {
  return /^[1-9]\d{5}$/.test(value);
}

// ---------------------------------------------------------------------------
// Aadhaar
// ---------------------------------------------------------------------------

const VERHOEFF_D = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
] as const;
const VERHOEFF_P = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
] as const;
const VERHOEFF_INV = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9] as const;

const verhoeffC = (digits: string, offset: number): number => {
  let c = 0;
  const rev = digits.split('').reverse();
  for (let i = 0; i < rev.length; i++) {
    const p = VERHOEFF_P[(i + offset) % 8] as readonly number[];
    c = (VERHOEFF_D[c] as readonly number[])[p[Number(rev[i])] as number] as number;
  }
  return c;
};

/** `true` if a string of digits passes the Verhoeff checksum. */
export function verhoeffValidate(digits: string): boolean {
  return /^\d+$/.test(digits) && verhoeffC(digits, 0) === 0;
}
/** Verhoeff check digit to append to a string of digits. */
export function verhoeffGenerate(digits: string): number {
  if (!/^\d+$/.test(digits)) throw new TypeError('verhoeffGenerate expects a string of digits');
  return VERHOEFF_INV[verhoeffC(digits, 1)] as number;
}

export const normalizeAadhaar = (value: string): string => value.replace(/[\s-]+/g, '');
/** Validate an Aadhaar number: 12 digits, not starting with 0 or 1, valid Verhoeff check digit. Offline check only. */
export function isValidAadhaar(value: string): boolean {
  return /^[2-9]\d{11}$/.test(value) && verhoeffValidate(value);
}
/**
 * Mask an Aadhaar number, keeping only the last 4 digits: `XXXX XXXX 1234`.
 * Works on any input with at least 4 digits; never returns more than the last 4.
 */
export function maskAadhaar(value: string, maskChar = 'X'): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length < 4) throw new TypeError('maskAadhaar expects at least 4 digits');
  const m = maskChar.charAt(0) || 'X';
  return `${m.repeat(4)} ${m.repeat(4)} ${digits.slice(-4)}`;
}

// ---------------------------------------------------------------------------
// Udyam (MSME registration)
// ---------------------------------------------------------------------------

/**
 * Normalise an Udyam registration number to `UDYAM-SS-DD-NNNNNNN`.
 * Whitespace and hyphens are ignored while parsing; malformed input is compacted
 * so validation can reject it without throwing.
 */
export function normalizeUdyam(value: string): string {
  const cleaned = value.replace(/[\s-]+/g, '').toUpperCase();
  const match = /^(UDYAM)([A-Z]{2})(\d{2})(\d{7})$/.exec(cleaned);
  return match ? `${match[1]}-${match[2]}-${match[3]}-${match[4]}` : cleaned;
}

/** Validate the Udyam number structure: prefix, two-letter state, two-digit district and seven-digit serial. Input must be normalised. */
export function isValidUdyam(value: string): boolean {
  return /^UDYAM-[A-Z]{2}-\d{2}-\d{7}$/.test(value);
}

// ---------------------------------------------------------------------------
// Vehicle registration
// ---------------------------------------------------------------------------

/** State / UT prefixes used on Indian registration plates (including legacy codes still on the road). */
export const VEHICLE_STATE_CODES: ReadonlySet<string> = new Set([
  'AN',
  'AP',
  'AR',
  'AS',
  'BR',
  'CG',
  'CH',
  'DD',
  'DL',
  'DN',
  'GA',
  'GJ',
  'HP',
  'HR',
  'JH',
  'JK',
  'KA',
  'KL',
  'LA',
  'LD',
  'MH',
  'ML',
  'MN',
  'MP',
  'MZ',
  'NL',
  'OD',
  'OR',
  'PB',
  'PY',
  'RJ',
  'SK',
  'TN',
  'TR',
  'TS',
  'UK',
  'UA',
  'UP',
  'WB',
]);

/** CIN state/UT codes, reusing the vehicle codes where they match MCA's list. */
const CIN_STATE_CODES: ReadonlySet<string> = new Set([
  ...[...VEHICLE_STATE_CODES].filter((code) => !['DN', 'OR', 'UA'].includes(code)),
  'DH',
]);

export const normalizeVehicleNumber = compact;

/**
 * Validate an Indian vehicle registration number (normalised, no spaces):
 * state-series `DL01AB1234` / `DL1CAB1234`-style, or Bharat series `22BH1234AB`.
 * Format and state prefix only.
 */
export function isValidVehicleNumber(value: string): boolean {
  if (/^\d{2}BH\d{4}[A-HJ-NP-Z]{1,2}$/.test(value)) return true;
  const m = /^([A-Z]{2})(\d{1,2})([A-Z]{0,3})(\d{1,4})$/.exec(value);
  if (!m) return false;
  return VEHICLE_STATE_CODES.has(m[1] as string) && Number(m[2]) > 0 && Number(m[4]) > 0;
}

export * from './format';
export * from './lookup';


// ---------------------------------------------------------------------------
// Corporate Identification Number (CIN)
// ---------------------------------------------------------------------------

/** Normalise a CIN by removing whitespace and hyphens and upper-casing it. */
export const normalizeCIN = compact;

/**
 * Validate the structure of an Indian Corporate Identification Number.
 * This is a format check only; it does not confirm registration with the MCA.
 */
export function isValidCIN(value: string): boolean {
  return (
    /^[LU]\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6}$/.test(value) &&
    CIN_STATE_CODES.has(value.slice(6, 8))
  );
}
