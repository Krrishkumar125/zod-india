import { z } from 'zod';
import {
  isValidAadhaar,
  isValidGSTIN,
  isValidIFSC,
  isValidMobile,
  isValidPAN,
  isValidPincode,
  isValidTAN,
  isValidUPI,
  isValidUdyam,
  isValidVehicleNumber,
  normalizeAadhaar,
  normalizeGSTIN,
  normalizeIFSC,
  normalizeMobile,
  normalizePAN,
  normalizePincode,
  normalizeTAN,
  normalizeUPI,
  normalizeUdyam,
  normalizeVehicleNumber,
} from './validators';

export * from './validators';

export interface SchemaOptions {
  /** Custom error message. */
  message?: string;
  /**
   * When `true` (default) input is cleaned before validation (trim, strip spaces/hyphens,
   * fix case, E.164 for mobiles) and the parsed output is the normalised value.
   * When `false` the input must already be in canonical form and is returned unchanged.
   */
  normalize?: boolean;
}

function build(
  isValid: (v: string) => boolean,
  normalize: (v: string) => string,
  defaultMessage: string,
  options: SchemaOptions = {},
) {
  const message = options.message ?? defaultMessage;
  if (options.normalize === false) return z.string().refine(isValid, { message });
  return z
    .string()
    .transform((v) => normalize(v.trim()))
    .refine(isValid, { message });
}

/** GSTIN schema: format, state code, embedded PAN and mod-36 checksum. */
export const zGSTIN = (options?: SchemaOptions) =>
  build(isValidGSTIN, normalizeGSTIN, 'Invalid GSTIN', options);
/** PAN schema: `AAAPA9999A` with a valid holder-type 4th character. */
export const zPAN = (options?: SchemaOptions) =>
  build(isValidPAN, normalizePAN, 'Invalid PAN', options);
/** TAN schema: `AAAA99999A`. */
export const zTAN = (options?: SchemaOptions) =>
  build(isValidTAN, normalizeTAN, 'Invalid TAN', options);
/** IFSC schema: `AAAA0XXXXXX`. */
export const zIFSC = (options?: SchemaOptions) =>
  build(isValidIFSC, normalizeIFSC, 'Invalid IFSC code', options);
/** UPI VPA schema (`handle@psp`), syntax only. */
export const zUPI = (options?: SchemaOptions) =>
  build(isValidUPI, normalizeUPI, 'Invalid UPI ID', options);
/** Indian mobile schema; output is E.164 (`+91XXXXXXXXXX`) when normalising. */
export const zMobile = (options?: SchemaOptions) =>
  build(isValidMobile, normalizeMobile, 'Invalid Indian mobile number', options);
/** PIN code schema: 6 digits, first digit 1-9. */
export const zPincode = (options?: SchemaOptions) =>
  build(isValidPincode, normalizePincode, 'Invalid PIN code', options);
/** Aadhaar schema: 12 digits, not starting 0/1, Verhoeff checksum. Output has no spaces. */
export const zAadhaar = (options?: SchemaOptions) =>
  build(isValidAadhaar, normalizeAadhaar, 'Invalid Aadhaar number', options);
/** Udyam (MSME) registration number schema. Output is canonical upper-case with hyphens. */
export const zUdyam = (options?: SchemaOptions) =>
  build(isValidUdyam, normalizeUdyam, 'Invalid Udyam number', options);
/** Vehicle registration schema (state series or BH series). Output is compact upper-case. */
export const zVehicleNumber = (options?: SchemaOptions) =>
  build(
    isValidVehicleNumber,
    normalizeVehicleNumber,
    'Invalid vehicle registration number',
    options,
  );
