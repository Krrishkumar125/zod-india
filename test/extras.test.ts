import { describe, expect, it } from 'vitest';
import {
  formatAadhaar,
  formatINR,
  formatINRCompact,
  formatMobile,
  groupIndian,
  isValidAadhaar,
  isValidGSTIN,
  isValidIFSC,
  isValidMobile,
  isValidPAN,
  isValidPincode,
  isValidUPI,
  maskMobile,
  maskPAN,
  parseIFSC,
  parseVehicleNumber,
  pincodeZone,
  rupeesInWords,
  toIndianWords,
} from '../src/validators';
import { zGSTIN } from '../src/index';
import * as fake from '../src/testing';

describe('format', () => {
  it('groups digits the Indian way', () => {
    expect(groupIndian('1')).toBe('1');
    expect(groupIndian('1000')).toBe('1,000');
    expect(groupIndian('123456789')).toBe('12,34,56,789');
    expect(() => groupIndian('1.5')).toThrow(TypeError);
  });
  it('formats INR', () => {
    expect(formatINR(1234567.5)).toBe('₹12,34,567.50');
    expect(formatINR(-1500, { decimals: 0 })).toBe('-₹1,500');
    expect(formatINR(99.999, { symbol: '' })).toBe('100.00');
    expect(formatINR(-0.001)).toBe('₹0.00');
    expect(() => formatINR(Infinity)).toThrow(TypeError);
  });
  it('formats compact INR', () => {
    expect(formatINRCompact(15000000)).toBe('₹1.5 Cr');
    expect(formatINRCompact(1200000)).toBe('₹12 L');
    expect(formatINRCompact(45250)).toBe('₹45.3K');
    expect(formatINRCompact(99999)).toBe('₹1 L');
    expect(formatINRCompact(-9999999)).toBe('-₹1 Cr');
    expect(formatINRCompact(-999, { symbol: 'Rs ' })).toBe('-Rs 999');
    expect(formatINRCompact(12.345, { decimals: 2 })).toBe('₹12.35');
    expect(() => formatINRCompact(NaN)).toThrow(TypeError);
  });
  it('writes numbers in Indian words', () => {
    expect(toIndianWords(0)).toBe('zero');
    expect(toIndianWords(15)).toBe('fifteen');
    expect(toIndianWords(40)).toBe('forty');
    expect(toIndianWords(100)).toBe('one hundred');
    expect(toIndianWords(12345678)).toBe(
      'one crore twenty-three lakh forty-five thousand six hundred seventy-eight',
    );
    expect(toIndianWords(1e12)).toBe('one lakh crore');
    expect(toIndianWords(-20000000)).toBe('minus two crore');
    expect(() => toIndianWords(1.5)).toThrow(TypeError);
  });
  it('writes rupees in words', () => {
    expect(rupeesInWords(1250.5)).toBe(
      'Rupees one thousand two hundred fifty and fifty paise only',
    );
    expect(rupeesInWords(100000)).toBe('Rupees one lakh only');
    expect(() => rupeesInWords(-1)).toThrow(TypeError);
  });
  it('masks and pretty-prints', () => {
    expect(maskPAN('abcpe1234f')).toBe('AB******4F');
    expect(maskPAN('ABCPE1234F', '')).toBe('AB******4F');
    expect(() => maskPAN('ABC')).toThrow(TypeError);
    expect(maskMobile('+91 98765-43210', '#')).toBe('+91 ######3210');
    expect(maskMobile('9876543210', '')).toBe('+91 ******3210');
    expect(() => maskMobile('12345')).toThrow(TypeError);
    expect(formatMobile('09876543210')).toBe('+91 98765 43210');
    expect(() => formatMobile('1234567890')).toThrow(TypeError);
    expect(formatAadhaar('234567890123')).toBe('2345 6789 0123');
    expect(() => formatAadhaar('123')).toThrow(TypeError);
  });
});

describe('lookup', () => {
  it('parses vehicle numbers', () => {
    expect(parseVehicleNumber('dl 1c ab 1234')).toEqual({
      series: 'state',
      stateCode: 'DL',
      state: 'Delhi',
      rto: '01',
    });
    expect(parseVehicleNumber('22 BH 1234 AB')).toEqual({ series: 'BH', year: '22' });
    expect(parseVehicleNumber('XX01AB1234')).toBeUndefined();
    expect(parseVehicleNumber('DL00AB1234')).toBeUndefined();
    expect(parseVehicleNumber('nope')).toBeUndefined();
  });
  it('finds PIN zones', () => {
    expect(pincodeZone('110 001')?.regions).toContain('Delhi');
    expect(pincodeZone('560001')?.zone).toBe('Southern');
    expect(pincodeZone('012345')).toBeUndefined();
  });
  it('parses IFSC', () => {
    expect(parseIFSC('hdfc0001234')).toEqual({ bank: 'HDFC', branch: '001234' });
    expect(parseIFSC('HDFC1001234')).toBeUndefined();
  });
});

describe('testing fakers', () => {
  it('generates values that pass the validators', () => {
    for (let i = 0; i < 200; i++) {
      expect(isValidGSTIN(fake.fakeGSTIN())).toBe(true);
      expect(isValidPAN(fake.fakePAN())).toBe(true);
      expect(isValidAadhaar(fake.fakeAadhaar())).toBe(true);
      expect(isValidMobile(fake.fakeMobile())).toBe(true);
      expect(isValidPincode(fake.fakePincode())).toBe(true);
      expect(isValidIFSC(fake.fakeIFSC())).toBe(true);
      expect(isValidUPI(fake.fakeUPI())).toBe(true);
    }
  });
  it('is reproducible with a seed and honours options', () => {
    const a = fake.createFaker(fake.seededRandom(42));
    const b = fake.createFaker(fake.seededRandom(42));
    expect(a.gstin('07')).toBe(b.gstin('07'));
    expect(a.gstin('07').startsWith('07')).toBe(true);
    expect(zGSTIN().parse(a.gstin())).toMatch(/^\d{2}/);
    expect(a.pan('C').charAt(3)).toBe('C');
    expect(a.ifsc('SBIN').startsWith('SBIN0')).toBe(true);
  });
});
