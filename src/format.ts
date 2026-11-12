/**
 * Display helpers for Indian formats: rupee amounts with lakh/crore grouping,
 * amounts in words (Indian numbering), and safe masking for PAN / mobile / Aadhaar.
 * Pure functions, no Intl or locale data required, so output is identical on every runtime.
 */

/** Group an integer string the Indian way: last 3 digits, then pairs (12,34,56,789). */
export function groupIndian(digits: string): string {
  if (!/^\d+$/.test(digits)) throw new TypeError('groupIndian expects a string of digits');
  if (digits.length <= 3) return digits;
  const last3 = digits.slice(-3);
  const rest = digits.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return `${rest},${last3}`;
}

export interface FormatINROptions {
  /** Fraction digits (default 2). Use 0 to round to whole rupees. */
  decimals?: number;
  /** Prefix symbol (default `'₹'`). Pass `''` for none. */
  symbol?: string;
}

/** Format a number as Indian rupees: `formatINR(1234567.5)` → `'₹12,34,567.50'`. */
export function formatINR(amount: number, options: FormatINROptions = {}): string {
  if (!Number.isFinite(amount)) throw new TypeError('formatINR expects a finite number');
  const decimals = options.decimals ?? 2;
  const symbol = options.symbol ?? '₹';
  const [int, frac] = Math.abs(amount).toFixed(decimals).split('.') as [string, string?];
  const sign = amount < 0 && Number(Math.abs(amount).toFixed(decimals)) !== 0 ? '-' : '';
  return `${sign}${symbol}${groupIndian(int)}${frac ? `.${frac}` : ''}`;
}

/**
 * Short lakh/crore form used in Indian apps: `₹1.5 Cr`, `₹12 L`, `₹45.2K`.
 * Values below 1,000 are returned as plain rupees.
 */
export function formatINRCompact(
  amount: number,
  options: { symbol?: string; decimals?: number } = {},
): string {
  if (!Number.isFinite(amount)) throw new TypeError('formatINRCompact expects a finite number');
  const symbol = options.symbol ?? '₹';
  const decimals = options.decimals ?? 1;
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  const units: [number, string][] = [
    [1e7, ' Cr'],
    [1e5, ' L'],
    [1e3, 'K'],
  ];
  for (const [size, suffix] of units) {
    if (abs >= size) {
      const n = Number((abs / size).toFixed(decimals));
      if (n >= 100 && size < 1e7) return formatINRCompact(Math.sign(amount) * 100 * size, options);
      return `${sign}${symbol}${n}${suffix}`;
    }
  }
  return `${sign}${symbol}${Number(abs.toFixed(decimals))}`;
}

const ONES = [
  '',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
  'eleven',
  'twelve',
  'thirteen',
  'fourteen',
  'fifteen',
  'sixteen',
  'seventeen',
  'eighteen',
  'nineteen',
];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

const below100 = (n: number): string =>
  n < 20
    ? (ONES[n] as string)
    : `${TENS[Math.floor(n / 10)] as string}${n % 10 ? `-${ONES[n % 10] as string}` : ''}`;

const below1000 = (n: number): string => {
  const h = Math.floor(n / 100);
  const r = n % 100;
  return [h ? `${ONES[h] as string} hundred` : '', r ? below100(r) : ''].filter(Boolean).join(' ');
};

function words(n: number): string {
  if (n >= 1e7) {
    const rest = n % 1e7;
    return `${words(Math.floor(n / 1e7))} crore${rest ? ` ${words(rest)}` : ''}`;
  }
  const parts: string[] = [];
  const lakh = Math.floor(n / 1e5);
  const thousand = Math.floor((n % 1e5) / 1e3);
  const rest = n % 1e3;
  if (lakh) parts.push(`${below100(lakh)} lakh`);
  if (thousand) parts.push(`${below100(thousand)} thousand`);
  if (rest) parts.push(below1000(rest));
  return parts.join(' ');
}

/**
 * Integer to words in the Indian numbering system:
 * `toIndianWords(12345678)` → `'one crore twenty-three lakh forty-five thousand six hundred seventy-eight'`.
 */
export function toIndianWords(n: number): string {
  if (!Number.isSafeInteger(n)) throw new TypeError('toIndianWords expects a safe integer');
  if (n === 0) return 'zero';
  return `${n < 0 ? 'minus ' : ''}${words(Math.abs(n))}`;
}

/**
 * Amount in words as written on cheques and invoices:
 * `rupeesInWords(1250.5)` → `'Rupees one thousand two hundred fifty and fifty paise only'`.
 */
export function rupeesInWords(amount: number): string {
  if (!Number.isFinite(amount) || amount < 0)
    throw new TypeError('rupeesInWords expects a non-negative number');
  const paiseTotal = Math.round(amount * 100);
  const rupees = Math.floor(paiseTotal / 100);
  const paise = paiseTotal % 100;
  const r = `Rupees ${toIndianWords(rupees)}`;
  return paise ? `${r} and ${below100(paise)} paise only` : `${r} only`;
}

/** Mask a PAN for display, keeping the first 2 and last 2 characters: `AB******4F`. */
export function maskPAN(value: string, maskChar = '*'): string {
  const v = value.replace(/[\s-]+/g, '').toUpperCase();
  if (v.length !== 10) throw new TypeError('maskPAN expects a 10-character PAN');
  return `${v.slice(0, 2)}${(maskChar.charAt(0) || '*').repeat(6)}${v.slice(-2)}`;
}

/** Mask an Indian mobile, keeping the last 4 digits: `+91 ******3210`. */
export function maskMobile(value: string, maskChar = '*'): string {
  const d = value.replace(/\D/g, '').slice(-10);
  if (d.length !== 10) throw new TypeError('maskMobile expects a 10-digit Indian mobile number');
  return `+91 ${(maskChar.charAt(0) || '*').repeat(6)}${d.slice(-4)}`;
}

/** Pretty-print an Indian mobile: `+91 98765 43210`. Accepts any input `normalizeMobile` accepts. */
export function formatMobile(value: string): string {
  const d = value.replace(/\D/g, '').slice(-10);
  if (!/^[6-9]\d{9}$/.test(d)) throw new TypeError('formatMobile expects an Indian mobile number');
  return `+91 ${d.slice(0, 5)} ${d.slice(5)}`;
}

/** Pretty-print an Aadhaar number in 4-4-4 groups: `2345 6789 0123`. Use `maskAadhaar` for display to others. */
export function formatAadhaar(value: string): string {
  const d = value.replace(/\D/g, '');
  if (d.length !== 12) throw new TypeError('formatAadhaar expects 12 digits');
  return `${d.slice(0, 4)} ${d.slice(4, 8)} ${d.slice(8)}`;
}
