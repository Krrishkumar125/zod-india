import { describe, expect, it } from 'vitest';
import {
  GST_STATE_CODES,
  gstinCheckChar,
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
  maskAadhaar,
  normalizeMobile,
  normalizeUPI,
  normalizeUdyam,
  normalizeVehicleNumber,
  panEntityType,
  parseGSTIN,
  verhoeffGenerate,
  verhoeffValidate,
} from '../src/validators';

// Sample identifiers below are synthetic or the generic examples used in public docs/tutorials.
// None belong to a real individual.

describe('GSTIN', () => {
  // 27AAPFU0939F1ZV is the sample GSTIN widely used in GST documentation.
  it('computes the documented check character', () => {
    expect(gstinCheckChar('27AAPFU0939F1Z')).toBe('V');
    expect(gstinCheckChar('27aapfu0939f1z')).toBe('V');
  });
  it('rejects bad input to gstinCheckChar', () => {
    expect(gstinCheckChar('27AAPFU0939F1')).toBeUndefined();
    expect(gstinCheckChar('27AAPFU0939F1!')).toBeUndefined();
  });
  it('accepts valid GSTINs', () => {
    expect(isValidGSTIN('27AAPFU0939F1ZV')).toBe(true);
    // Build one for every state code to exercise the checksum widely.
    for (const code of Object.keys(GST_STATE_CODES)) {
      const base = `${code}ABCPE1234F1Z`;
      expect(isValidGSTIN(base + gstinCheckChar(base))).toBe(true);
    }
  });
  it('produces check characters that are letters and digits', () => {
    const seen = new Set<string>();
    for (let i = 1; i <= 9; i++)
      for (const c of 'ABCDEFGHJ') seen.add(gstinCheckChar(`07ABCDE123${i}${c}1Z`) as string);
    expect(seen.size).toBeGreaterThan(10);
  });
  it('rejects a wrong checksum, including every single-character substitution', () => {
    expect(isValidGSTIN('27AAPFU0939F1ZA')).toBe(false);
    const good = '27AAPFU0939F1ZV';
    for (const ch of '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
      if (ch !== 'V') expect(isValidGSTIN(good.slice(0, 14) + ch)).toBe(false);
    }
  });
  it('detects adjacent transpositions in the PAN part', () => {
    expect(isValidGSTIN('27AAPFU9039F1ZV')).toBe(false);
  });
  it('can skip the checksum', () => {
    expect(isValidGSTIN('27AAPFU0939F1ZA', { checksum: false })).toBe(true);
  });
  it('rejects unknown state codes, bad PAN, bad structure', () => {
    const withState = (s: string) => {
      const b = `${s}AAPFU0939F1Z`;
      return b + gstinCheckChar(b);
    };
    expect(isValidGSTIN(withState('00'))).toBe(false);
    expect(isValidGSTIN(withState('39'))).toBe(false);
    expect(isValidGSTIN(withState('98'))).toBe(false);
    const badPan = '27AAPXU0939F1Z';
    expect(isValidGSTIN(badPan + gstinCheckChar(badPan))).toBe(false);
    expect(isValidGSTIN('27AAPFU0939F0ZV')).toBe(false); // entity number 0
    expect(isValidGSTIN('27AAPFU0939F1YV')).toBe(false); // 14th must be Z
    expect(isValidGSTIN('27aapfu0939f1zv')).toBe(false); // not normalised
    expect(isValidGSTIN('')).toBe(false);
    expect(isValidGSTIN('27AAPFU0939F1ZVX')).toBe(false);
  });
  it('parses a GSTIN', () => {
    expect(parseGSTIN(' 27aapfu0939f1zv ')).toEqual({
      stateCode: '27',
      state: 'Maharashtra',
      pan: 'AAPFU0939F',
      entityNumber: '1',
      checkChar: 'V',
    });
    expect(parseGSTIN('27AAPFU0939F1ZA')).toBeUndefined();
  });
});

describe('PAN', () => {
  it('accepts every holder type', () => {
    for (const t of 'ABCFGHJLPT') expect(isValidPAN(`ABC${t}D1234E`)).toBe(true);
  });
  it('rejects bad holder types and shapes', () => {
    for (const t of 'DEIKMNOQRSUVWXYZ') expect(isValidPAN(`ABC${t}D1234E`)).toBe(false);
    expect(isValidPAN('ABCPD123E')).toBe(false);
    expect(isValidPAN('ABCPD12345')).toBe(false);
    expect(isValidPAN('1BCPD1234E')).toBe(false);
    expect(isValidPAN('abcpd1234e')).toBe(false);
  });
  it('reports the holder type', () => {
    expect(panEntityType('abcpd1234e')).toBe('Individual');
    expect(panEntityType('AAACB1234C')).toBe('Company');
    expect(panEntityType('nope')).toBeUndefined();
  });
});

describe('TAN', () => {
  it('validates format', () => {
    expect(isValidTAN('DELA12345B')).toBe(true);
    expect(isValidTAN('DEL123456B')).toBe(false);
    expect(isValidTAN('DELA1234B')).toBe(false);
    expect(isValidTAN('dela12345b')).toBe(false);
  });
});

describe('IFSC', () => {
  it('validates format', () => {
    expect(isValidIFSC('SBIN0000001')).toBe(true);
    expect(isValidIFSC('HDFC0ABC123')).toBe(true);
    expect(isValidIFSC('SBIN1000001')).toBe(false); // 5th must be 0
    expect(isValidIFSC('SBI00000001')).toBe(false);
    expect(isValidIFSC('SBIN000001')).toBe(false);
    expect(isValidIFSC('sbin0000001')).toBe(false);
  });
});

describe('UPI', () => {
  it('validates syntax', () => {
    for (const v of ['name@okaxis', 'first.last@ybl', 'user_1-x@paytm', '9876543210@upi'])
      expect(isValidUPI(v)).toBe(true);
    for (const v of [
      'name',
      '@okaxis',
      'a@okaxis',
      'name@',
      'name@1bank',
      'na me@ybl',
      'name@ok.axis',
      '.name@ybl',
      'Name@ybl',
    ])
      expect(isValidUPI(v)).toBe(false);
  });
  it('normalises case and whitespace', () => {
    expect(normalizeUPI('  Name@OkAxis ')).toBe('name@okaxis');
  });
});

describe('mobile', () => {
  it.each([
    ['9876543210', '+919876543210'],
    ['+91 98765 43210', '+919876543210'],
    ['+91-98765-43210', '+919876543210'],
    ['09876543210', '+919876543210'],
    ['919876543210', '+919876543210'],
    ['0091 9876543210', '+919876543210'],
    ['(+91) 6000000000', '+916000000000'],
  ])('normalises %s', (input, out) => {
    expect(normalizeMobile(input)).toBe(out);
    expect(isValidMobile(normalizeMobile(input))).toBe(true);
  });
  it('rejects invalid numbers', () => {
    for (const v of [
      '5876543210',
      '987654321',
      '98765432101',
      '+929876543210',
      '+91 5876543210',
      'abc',
    ])
      expect(isValidMobile(normalizeMobile(v))).toBe(false);
    expect(isValidMobile('9876543210')).toBe(false); // not E.164
  });
});

describe('PIN code', () => {
  it('validates', () => {
    expect(isValidPincode('110001')).toBe(true);
    expect(isValidPincode('999999')).toBe(true);
    expect(isValidPincode('011001')).toBe(false);
    expect(isValidPincode('11001')).toBe(false);
    expect(isValidPincode('1100011')).toBe(false);
    expect(isValidPincode('11000A')).toBe(false);
  });
});

describe('Verhoeff / Aadhaar', () => {
  it('matches the textbook Verhoeff example (236 -> 3)', () => {
    expect(verhoeffGenerate('236')).toBe(3);
    expect(verhoeffValidate('2363')).toBe(true);
    expect(verhoeffValidate('2364')).toBe(false);
    expect(verhoeffValidate('')).toBe(false);
    expect(verhoeffValidate('12a')).toBe(false);
    expect(() => verhoeffGenerate('x')).toThrow(TypeError);
  });
  it('accepts synthetic valid Aadhaar numbers', () => {
    expect(isValidAadhaar('234123412346')).toBe(true);
    for (const base of ['99999999999', '20000000000', '87654321098']) {
      expect(isValidAadhaar(base + verhoeffGenerate(base))).toBe(true);
    }
  });
  it('catches every single-digit error and adjacent transposition', () => {
    const good = '234123412346';
    for (let i = 0; i < 12; i++) {
      for (let d = 0; d <= 9; d++) {
        const ch = String(d);
        if (ch === good[i]) continue;
        expect(verhoeffValidate(good.slice(0, i) + ch + good.slice(i + 1))).toBe(false);
      }
      if (i < 11 && good[i] !== good[i + 1]) {
        const t = good.slice(0, i) + good[i + 1] + good[i] + good.slice(i + 2);
        expect(verhoeffValidate(t)).toBe(false);
      }
    }
  });
  it('rejects numbers starting with 0 or 1 and wrong lengths', () => {
    for (const base of ['00000000000', '12345678901']) {
      expect(verhoeffValidate(base + verhoeffGenerate(base))).toBe(true);
      expect(isValidAadhaar(base + verhoeffGenerate(base))).toBe(false);
    }
    expect(isValidAadhaar('23412341234')).toBe(false);
    expect(isValidAadhaar('2341 2341 2346')).toBe(false); // not normalised
  });
  it('masks to the last 4 digits', () => {
    expect(maskAadhaar('2341 2341 2346')).toBe('XXXX XXXX 2346');
    expect(maskAadhaar('234123412346', '*')).toBe('**** **** 2346');
    expect(maskAadhaar('234123412346', '')).toBe('XXXX XXXX 2346');
    expect(() => maskAadhaar('123')).toThrow(TypeError);
  });
});

describe('vehicle registration', () => {
  it('accepts common formats', () => {
    for (const v of [
      'DL01AB1234',
      'DL1CAB1234',
      'MH12DE1433',
      'KA05M1',
      'UP16BT9999',
      'GJ1A1234',
      'TN091234',
    ])
      expect(isValidVehicleNumber(v)).toBe(true);
  });
  it('accepts Bharat series', () => {
    expect(isValidVehicleNumber('22BH1234AB')).toBe(true);
    expect(isValidVehicleNumber('21BH0001A')).toBe(true);
    expect(isValidVehicleNumber('22BH1234AI')).toBe(false); // I and O excluded
  });
  it('rejects bad state codes, zero numbers and junk', () => {
    for (const v of [
      'XX01AB1234',
      'DL00AB1234',
      'DL01AB0000',
      'DL01ABCD1234',
      'DL01AB12345',
      'DLAB1234',
      'dl01ab1234',
    ])
      expect(isValidVehicleNumber(v)).toBe(false);
  });
  it('normalises spacing and case', () => {
    expect(normalizeVehicleNumber(' dl 01-ab 1234 ')).toBe('DL01AB1234');
  });
});

describe('Udyam', () => {
  it('validates the canonical structure', () => {
    expect(isValidUdyam('UDYAM-MH-26-0012345')).toBe(true);
    expect(isValidUdyam('UDYAM-AB-00-9999999')).toBe(true);
  });

  it('rejects malformed prefixes, state, district and serial fields', () => {
    for (const value of [
      'UDYAM-MH-26-001234',
      'UDYAM-MH-26-00123456',
      'UDYAM-M-26-0012345',
      'UDYAM-MH-2-0012345',
      'UDYAM-MH-AA-0012345',
      'UDYAM-MH-26-00123A5',
      'UDYAM-MH-26-0012345-extra',
      'udyam-mh-26-0012345',
      '',
    ]) {
      expect(isValidUdyam(value)).toBe(false);
    }
  });

  it('normalises case, spaces and hyphens to the canonical form', () => {
    expect(normalizeUdyam(' udyam mh 26 0012345 ')).toBe('UDYAM-MH-26-0012345');
    expect(normalizeUdyam('Udyam-MH-26-0012345')).toBe('UDYAM-MH-26-0012345');
    expect(normalizeUdyam('invalid input')).toBe('INVALIDINPUT');
  });
});
