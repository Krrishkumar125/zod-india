import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import {
  zAadhaar,
  zGSTIN,
  zIFSC,
  zMobile,
  zPAN,
  zPincode,
  zTAN,
  zUPI,
  zUdyam,
  zVehicleNumber,
} from '../src/index';

const issueMessage = (r: { success: boolean; error?: { issues: { message: string }[] } }) =>
  r.error?.issues[0]?.message;

describe('zod schemas', () => {
  it.each([
    ['zGSTIN', zGSTIN, ' 27aapfu0939f1zv ', '27AAPFU0939F1ZV', '27AAPFU0939F1ZA', 'Invalid GSTIN'],
    ['zPAN', zPAN, 'abcpd 1234e', 'ABCPD1234E', 'ABCXD1234E', 'Invalid PAN'],
    ['zTAN', zTAN, 'dela12345b', 'DELA12345B', 'DEL123456B', 'Invalid TAN'],
    ['zIFSC', zIFSC, 'sbin0000001', 'SBIN0000001', 'SBIN1000001', 'Invalid IFSC code'],
    ['zUPI', zUPI, ' Name@OkAxis', 'name@okaxis', 'name@', 'Invalid UPI ID'],
    [
      'zUdyam',
      zUdyam,
      'udyam mh 26 0012345',
      'UDYAM-MH-26-0012345',
      'UDYAM-MH-26-123456',
      'Invalid Udyam number',
    ],
    [
      'zMobile',
      zMobile,
      '098765 43210',
      '+919876543210',
      '5876543210',
      'Invalid Indian mobile number',
    ],
    ['zPincode', zPincode, '110 001', '110001', '011001', 'Invalid PIN code'],
    [
      'zAadhaar',
      zAadhaar,
      '2341 2341 2346',
      '234123412346',
      '234123412345',
      'Invalid Aadhaar number',
    ],
    [
      'zVehicleNumber',
      zVehicleNumber,
      'dl 01 ab 1234',
      'DL01AB1234',
      'XX01AB1234',
      'Invalid vehicle registration number',
    ],
  ] as const)(
    '%s normalises, validates and reports errors',
    (_name, make, input, output, bad, msg) => {
      const schema = make();
      expect(schema.parse(input)).toBe(output);
      const r = schema.safeParse(bad);
      expect(r.success).toBe(false);
      expect(issueMessage(r)).toBe(msg);
      expect(make({ message: 'custom' }).safeParse(bad).error?.issues[0]?.message).toBe('custom');
      // Strict mode: canonical input passes untouched, messy input fails.
      const strict = make({ normalize: false });
      expect(strict.parse(output)).toBe(output);
      expect(strict.safeParse(input).success).toBe(false);
    },
  );

  it('rejects non-strings', () => {
    expect(zGSTIN().safeParse(123).success).toBe(false);
    expect(zPAN({ normalize: false }).safeParse(null).success).toBe(false);
  });

  it('composes inside z.object with inferred string output', () => {
    const KYC = z.object({ pan: zPAN(), mobile: zMobile(), gstin: zGSTIN().optional() });
    const parsed: { pan: string; mobile: string; gstin?: string | undefined } = KYC.parse({
      pan: 'abcpd1234e',
      mobile: '9876543210',
    });
    expect(parsed).toEqual({ pan: 'ABCPD1234E', mobile: '+919876543210' });
  });
});
