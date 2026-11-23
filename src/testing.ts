/**
 * Synthetic test data that passes zod-india's validators (checksums included).
 * Values are random and NOT real identifiers; use them only in tests, seeds and demos.
 *
 *   import { fakeGSTIN, createFaker } from 'zod-india/testing';
 */
import { GST_STATE_CODES, gstinCheckChar, verhoeffGenerate } from './validators';

export type Random = () => number;

/** Small deterministic PRNG (mulberry32) so fixtures can be reproducible. */
export function seededRandom(seed: number): Random {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const pick = (rnd: Random, s: string): string => s.charAt(Math.floor(rnd() * s.length));
const many = (rnd: Random, s: string, n: number): string =>
  Array.from({ length: n }, () => pick(rnd, s)).join('');
const digits = (rnd: Random, n: number): string => many(rnd, '0123456789', n);

/** Build a set of generators bound to one random source (`Math.random` by default). */
export function createFaker(rnd: Random = Math.random) {
  const pan = (holder = 'P'): string =>
    `${many(rnd, LETTERS, 3)}${holder}${pick(rnd, LETTERS)}${digits(rnd, 3)}${pick(rnd, '123456789')}${pick(rnd, LETTERS)}`;
  const states = Object.keys(GST_STATE_CODES).filter((c) => c !== '97' && c !== '99');
  return {
    pan,
    din(): string {
      return digits(rnd, 8);
    },
    gstin(stateCode?: string): string {
      const sc = stateCode ?? (states[Math.floor(rnd() * states.length)] as string);
      const first14 = `${sc}${pan('C')}${pick(rnd, '123456789')}Z`;
      return `${first14}${gstinCheckChar(first14) as string}`;
    },
    aadhaar(): string {
      const first11 = `${pick(rnd, '23456789')}${digits(rnd, 10)}`;
      return `${first11}${verhoeffGenerate(first11)}`;
    },
    mobile(): string {
      return `+91${pick(rnd, '6789')}${digits(rnd, 9)}`;
    },
    pincode(): string {
      return `${pick(rnd, '12345678')}${digits(rnd, 5)}`;
    },
    ifsc(bank = 'TEST'): string {
      return `${bank}0${digits(rnd, 6)}`;
    },
    upi(): string {
      return `${many(rnd, 'abcdefghijklmnopqrstuvwxyz', 8)}@test`;
    },
  };
}

const defaultFaker = createFaker();
export const fakePAN = defaultFaker.pan;
export const fakeDIN = defaultFaker.din;
export const fakeGSTIN = defaultFaker.gstin;
export const fakeAadhaar = defaultFaker.aadhaar;
export const fakeMobile = defaultFaker.mobile;
export const fakePincode = defaultFaker.pincode;
export const fakeIFSC = defaultFaker.ifsc;
export const fakeUPI = defaultFaker.upi;
