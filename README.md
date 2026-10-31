# zod-india

[![npm](https://img.shields.io/npm/v/zod-india)](https://www.npmjs.com/package/zod-india)
[![CI](https://github.com/Krrishkumar125/zod-india/actions/workflows/ci.yml/badge.svg)](https://github.com/Krrishkumar125/zod-india/actions/workflows/ci.yml)
![coverage 100%](https://img.shields.io/badge/coverage-100%25-brightgreen)
[![bundle size](https://img.shields.io/bundlephobia/minzip/zod-india)](https://bundlephobia.com/package/zod-india)
[![downloads](https://img.shields.io/npm/dm/zod-india)](https://www.npmjs.com/package/zod-india)

[Zod](https://zod.dev) schemas and zero-dependency validators for Indian identifiers and formats:
**GSTIN, CIN, PAN, TAN, IFSC, UPI ID, mobile number, PIN code, Aadhaar, Udyam registration and vehicle registration**.

- Real checksums where they exist: GSTIN mod-36 and Aadhaar Verhoeff, not just regexes.
- Normalises messy input (`" 27aapfu0939f1zv "` → `27AAPFU0939F1ZV`, `098765 43210` → `+919876543210`).
- Works with **Zod v3 and v4** (peer dependency). No other runtime dependencies.
- Pure functions are importable without Zod from `zod-india/validators`.
- Indian display helpers: `₹12,34,567.50`, `₹1.5 Cr`, amounts in words (`one crore twenty-three lakh…`), PAN/mobile/Aadhaar masking.
- Offline lookups: state + RTO from a vehicle number, postal zone from a PIN, bank code from an IFSC.
- Checksum-valid **fake data for tests** (`zod-india/testing`), seedable.
- ESM + CJS, fully typed, tree-shakeable (`sideEffects: false`), Node 18+.

> **Limits.** Every check is offline: format rules plus the published checksum where one exists.
> A value that passes is _well-formed_. It is **not** proof that the number was issued, is active,
> or belongs to the person submitting it. For that you need the relevant government or bank API.

## Install

```sh
npm install zod-india zod
```

## Usage

```ts
import { z } from 'zod';
import { zGSTIN, zPAN, zMobile, zAadhaar, zUdyam, maskAadhaar } from 'zod-india';

const Merchant = z.object({
  gstin: zGSTIN(),
  pan: zPAN(),
  phone: zMobile(),
  aadhaar: zAadhaar().transform((v) => maskAadhaar(v)), // store only the masked form
  udyam: zUdyam(),
});

Merchant.parse({
  gstin: '27aapfu0939f1zv',
  pan: 'aapfu0939f',
  phone: '+91 98765 43210',
  aadhaar: '2341 2341 2346',
  udyam: 'udyam mh 26 0012345',
});
// { gstin: '27AAPFU0939F1ZV', pan: 'AAPFU0939F', phone: '+919876543210', aadhaar: 'XXXX XXXX 2346', udyam: 'UDYAM-MH-26-0012345' }
```

Every schema factory takes the same options:

```ts
zGSTIN({ message: 'Enter a valid GSTIN' }); // custom error message
zGSTIN({ normalize: false }); // no cleaning; input must already be canonical and is returned as-is
```

Without Zod:

```ts
import { isValidGSTIN, normalizeGSTIN, parseGSTIN, panEntityType } from 'zod-india/validators';

isValidGSTIN(normalizeGSTIN(' 27aapfu0939f1zv ')); // true
parseGSTIN('27AAPFU0939F1ZV'); // { stateCode: '27', state: 'Maharashtra', pan: 'AAPFU0939F', entityNumber: '1', checkChar: 'V' }
panEntityType('AAPFU0939F'); // 'Firm / LLP'
```

`isValidX` functions expect normalised input. Call the matching `normalizeX` first, or use the schema.

## Validators



## CIN validation

The CIN state-code list follows the Ministry of Corporate Affairs' published [state abbreviations](https://www.mca.gov.in/bin/dms/getdocument?mds=nwCwmBNTS5nl1QpJqeEIxg%253D%253D&type=open). Validation checks the format only; it does not verify a company against the MCA register.

## Helpers

- `maskAadhaar(value, maskChar = 'X')` → `XXXX XXXX 1234`. Keeps only the last 4 digits.
- `verhoeffValidate(digits)` / `verhoeffGenerate(digits)`: general-purpose Verhoeff.
- `gstinCheckChar(first14)`: compute the GSTIN check character.
- `parseGSTIN`, `panEntityType`, and the tables `GST_STATE_CODES`, `PAN_ENTITY_TYPES`, `VEHICLE_STATE_CODES`.

## Formatting (lakh / crore)

```ts
import { formatINR, formatINRCompact, toIndianWords, rupeesInWords } from 'zod-india/validators';

formatINR(1234567.5); // '₹12,34,567.50'
formatINR(1500, { decimals: 0, symbol: 'Rs ' }); // 'Rs 1,500'
formatINRCompact(15000000); // '₹1.5 Cr'   (also '₹12 L', '₹45.3K')
toIndianWords(12345678); // 'one crore twenty-three lakh forty-five thousand six hundred seventy-eight'
rupeesInWords(1250.5); // 'Rupees one thousand two hundred fifty and fifty paise only'
```

No `Intl` / ICU dependency, so the output is identical on Node, browsers, Bun, Deno and edge runtimes.

Masking and display: `maskPAN('ABCPE1234F')` → `AB******4F`, `maskMobile('9876543210')` → `+91 ******3210`,
`formatMobile('09876543210')` → `+91 98765 43210`, `formatAadhaar(…)` → `2345 6789 0123`.

## Lookups (offline)

```ts
import { parseVehicleNumber, pincodeZone, parseIFSC, parseGSTIN } from 'zod-india/validators';

parseVehicleNumber('DL 1C AB 1234'); // { series: 'state', stateCode: 'DL', state: 'Delhi', rto: '01' }
parseVehicleNumber('22 BH 1234 AB'); // { series: 'BH', year: '22' }
pincodeZone('560001'); // { zone: 'Southern', regions: ['Andhra Pradesh', 'Telangana', 'Karnataka'] }
parseIFSC('HDFC0001234'); // { bank: 'HDFC', branch: '001234' }
parseGSTIN('27AAPFU0939F1ZV').state; // 'Maharashtra'
```

For full branch/bank names from an IFSC, use Razorpay's [`ifsc`](https://github.com/razorpay/ifsc) dataset; this package stays tiny and offline.

## Test data

```ts
import { fakeGSTIN, fakePAN, fakeAadhaar, createFaker, seededRandom } from 'zod-india/testing';

fakeGSTIN(); // random, checksum-valid, e.g. '07ABCCD1234E1Z5'
fakeGSTIN('27'); // Maharashtra
const f = createFaker(seededRandom(42)); // reproducible fixtures for snapshots
f.aadhaar(); // passes Verhoeff
```

Generated values are random and synthetic. Use them only in tests, seeds and demos.

## With react-hook-form / Hono

```ts
// react-hook-form
import { zodResolver } from '@hookform/resolvers/zod';
const schema = z.object({ gstin: zGSTIN({ message: 'Check your GSTIN' }), phone: zMobile() });
useForm({ resolver: zodResolver(schema) });

// Hono
import { zValidator } from '@hono/zod-validator';
app.post('/kyc', zValidator('json', z.object({ pan: zPAN(), ifsc: zIFSC() })), (c) =>
  c.json(c.req.valid('json')),
);
```

## Notes and known limits

- **GSTIN**: only regular PAN-based registrations are accepted. Special registrations (UN bodies with a UIN, non-resident OIDAR, TAN-based TDS/TCS) use a different structure in characters 3–12 and are rejected; `{ checksum: false }` only skips the 15th-character check, it does not accept those formats.
- **Aadhaar**: the Verhoeff check catches all single-digit typos and adjacent swaps, but random 12-digit numbers still pass about 1 time in 10. Never log or store full Aadhaar numbers; mask them (see UIDAI guidance).
- **Vehicle numbers**: state-series formats vary by RTO; the rule here is deliberately permissive within a known state prefix.
- **Mobile**: Indian mobile numbers only, not landlines.

## Comparison

| Package                                                            | Zod schemas | GSTIN checksum  | Aadhaar Verhoeff | Normalisation | Types  | Zod v3 + v4 |
| ------------------------------------------------------------------ | ----------- | --------------- | ---------------- | ------------- | ------ | ----------- |
| **zod-india**                                                      | ✅          | ✅              | ✅               | ✅            | ✅     | ✅          |
| single-format packages (`gstin-validator`, `aadhaar-validator`, …) | ❌          | one format each | one format each  | ❌            | varies | ❌          |

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). Please never put a real person's identifiers in issues or tests.

## Sibling packages

Other tools by the same author:

- [secret-blast-radius](https://www.npmjs.com/package/secret-blast-radius): what a malicious npm install could steal, plus a rotation plan
- [create-bullmq-app](https://www.npmjs.com/package/create-bullmq-app): scaffold a production BullMQ + TypeScript service
- [webhook-crash-lab](https://www.npmjs.com/package/webhook-crash-lab): crash-test webhook handlers against duplicates and races
- [webhook-crash-lab-mcp](https://www.npmjs.com/package/webhook-crash-lab-mcp): MCP server so coding agents can run webhook-crash-lab
- [eslint-plugin-bullmq](https://www.npmjs.com/package/eslint-plugin-bullmq): lint rules for BullMQ production pitfalls
- [eslint-plugin-webhook-safety](https://www.npmjs.com/package/eslint-plugin-webhook-safety): lint rules for unsafe Stripe webhook handlers

## License

MIT © Krrish Kumar| Format | Schema | Function | How it is checked | Normalised output |
| --- | --- | --- | --- | --- |
| CIN | `zCIN()` | `isValidCIN` | 21 characters; L/U listing status, 5-digit industry code, known 2-letter state code, 4-digit year, 3-letter company type and 6-digit registration number | `L17110MH1973PLC019786` |
| GSTIN | `zGSTIN()` | `isValidGSTIN` | 15 chars; known GST state code (01–38, 97, 99); characters 3–12 a valid PAN; 13th 1–9/A–Z; 14th `Z`; 15th the GSTN mod-36 check character | `27AAPFU0939F1ZV` |
| PAN | `zPAN()` | `isValidPAN` | `AAAPA9999A`; 4th char a holder type (A B C F G H J L P T). PAN has no public checksum | `ABCPD1234E` |
| TAN | `zTAN()` | `isValidTAN` | `AAAA99999A` | `DELA12345B` |
| IFSC | `zIFSC()` | `isValidIFSC` | 4 letters, a `0`, 6 alphanumerics (RBI format) | `SBIN0000001` |
| UPI ID (VPA) | `zUPI()` | `isValidUPI` | `handle@psp` syntax only. **Does not check that the PSP handle exists** | `name@okaxis` |
| Mobile | `zMobile()` | `isValidMobile` | Optional `+91` / `91` / `0091` / `0`, then 10 digits starting 6–9. Spaces, dashes, brackets allowed | `+919876543210` (E.164) |
| PIN code | `zPincode()` | `isValidPincode` | 6 digits, first 1–9 | `110001` |
| Aadhaar | `zAadhaar()` | `isValidAadhaar` | 12 digits, not starting 0 or 1, valid Verhoeff check digit | `234123412346` |
| Udyam (MSME) | `zUdyam()` | `isValidUdyam` | `UDYAM-SS-DD-NNNNNNN`: prefix, 2-letter state, 2-digit district and 7-digit serial | `UDYAM-MH-26-0012345` |
| Vehicle reg. | `zVehicleNumber()` | `isValidVehicleNumber` | `SS NN X(XX) NNNN` with a known state/UT code, or Bharat series `YY BH NNNN XX` | `DL01AB1234` |

[![npm](https://img.shields.io/npm/v/zod-india)](https://www.npmjs.com/package/zod-india)
[![CI](https://github.com/Krrishkumar125/zod-india/actions/workflows/ci.yml/badge.svg)](https://github.com/Krrishkumar125/zod-india/actions/workflows/ci.yml)
![coverage 100%](https://img.shields.io/badge/coverage-100%25-brightgreen)
[![bundle size](https://img.shields.io/bundlephobia/minzip/zod-india)](https://bundlephobia.com/package/zod-india)
[![downloads](https://img.shields.io/npm/dm/zod-india)](https://www.npmjs.com/package/zod-india)

[Zod](https://zod.dev) schemas and zero-dependency validators for Indian identifiers and formats:
**GSTIN, CIN, PAN, TAN, IFSC, UPI ID, mobile number, PIN code, Aadhaar, Udyam registration and vehicle registration**.

- Real checksums where they exist: GSTIN mod-36 and Aadhaar Verhoeff, not just regexes.
- Normalises messy input (`" 27aapfu0939f1zv "` → `27AAPFU0939F1ZV`, `098765 43210` → `+919876543210`).
- Works with **Zod v3 and v4** (peer dependency). No other runtime dependencies.
- Pure functions are importable without Zod from `zod-india/validators`.
- Indian display helpers: `₹12,34,567.50`, `₹1.5 Cr`, amounts in words (`one crore twenty-three lakh…`), PAN/mobile/Aadhaar masking.
- Offline lookups: state + RTO from a vehicle number, postal zone from a PIN, bank code from an IFSC.
- Checksum-valid **fake data for tests** (`zod-india/testing`), seedable.
- ESM + CJS, fully typed, tree-shakeable (`sideEffects: false`), Node 18+.

> **Limits.** Every check is offline: format rules plus the published checksum where one exists.
> A value that passes is _well-formed_. It is **not** proof that the number was issued, is active,
> or belongs to the person submitting it. For that you need the relevant government or bank API.

## Install

```sh
npm install zod-india zod
```

## Usage

```ts
import { z } from 'zod';
import { zGSTIN, zPAN, zMobile, zAadhaar, zUdyam, maskAadhaar } from 'zod-india';

const Merchant = z.object({
  gstin: zGSTIN(),
  pan: zPAN(),
  phone: zMobile(),
  aadhaar: zAadhaar().transform((v) => maskAadhaar(v)), // store only the masked form
  udyam: zUdyam(),
});

Merchant.parse({
  gstin: '27aapfu0939f1zv',
  pan: 'aapfu0939f',
  phone: '+91 98765 43210',
  aadhaar: '2341 2341 2346',
  udyam: 'udyam mh 26 0012345',
});
// { gstin: '27AAPFU0939F1ZV', pan: 'AAPFU0939F', phone: '+919876543210', aadhaar: 'XXXX XXXX 2346', udyam: 'UDYAM-MH-26-0012345' }
```

Every schema factory takes the same options:

```ts
zGSTIN({ message: 'Enter a valid GSTIN' }); // custom error message
zGSTIN({ normalize: false }); // no cleaning; input must already be canonical and is returned as-is
```

Without Zod:

```ts
import { isValidGSTIN, normalizeGSTIN, parseGSTIN, panEntityType } from 'zod-india/validators';

isValidGSTIN(normalizeGSTIN(' 27aapfu0939f1zv ')); // true
parseGSTIN('27AAPFU0939F1ZV'); // { stateCode: '27', state: 'Maharashtra', pan: 'AAPFU0939F', entityNumber: '1', checkChar: 'V' }
panEntityType('AAPFU0939F'); // 'Firm / LLP'
```

`isValidX` functions expect normalised input. Call the matching `normalizeX` first, or use the schema.

## Validators



#The CIN state-code list follows the Ministry of Corporate Affairs' published [state abbreviations](https://www.mca.gov.in/bin/dms/getdocument?mds=nwCwmBNTS5nl1QpJqeEIxg%253D%253D&type=open). Validation checks the format only; it does not verify a company against the MCA register.

## Helpers

- `maskAadhaar(value, maskChar = 'X')` → `XXXX XXXX 1234`. Keeps only the last 4 digits.
- `verhoeffValidate(digits)` / `verhoeffGenerate(digits)`: general-purpose Verhoeff.
- `gstinCheckChar(first14)`: compute the GSTIN check character.
- `parseGSTIN`, `panEntityType`, and the tables `GST_STATE_CODES`, `PAN_ENTITY_TYPES`, `VEHICLE_STATE_CODES`.

## Formatting (lakh / crore)

```ts
import { formatINR, formatINRCompact, toIndianWords, rupeesInWords } from 'zod-india/validators';

formatINR(1234567.5); // '₹12,34,567.50'
formatINR(1500, { decimals: 0, symbol: 'Rs ' }); // 'Rs 1,500'
formatINRCompact(15000000); // '₹1.5 Cr'   (also '₹12 L', '₹45.3K')
toIndianWords(12345678); // 'one crore twenty-three lakh forty-five thousand six hundred seventy-eight'
rupeesInWords(1250.5); // 'Rupees one thousand two hundred fifty and fifty paise only'
```

No `Intl` / ICU dependency, so the output is identical on Node, browsers, Bun, Deno and edge runtimes.

Masking and display: `maskPAN('ABCPE1234F')` → `AB******4F`, `maskMobile('9876543210')` → `+91 ******3210`,
`formatMobile('09876543210')` → `+91 98765 43210`, `formatAadhaar(…)` → `2345 6789 0123`.

## Lookups (offline)

```ts
import { parseVehicleNumber, pincodeZone, parseIFSC, parseGSTIN } from 'zod-india/validators';

parseVehicleNumber('DL 1C AB 1234'); // { series: 'state', stateCode: 'DL', state: 'Delhi', rto: '01' }
parseVehicleNumber('22 BH 1234 AB'); // { series: 'BH', year: '22' }
pincodeZone('560001'); // { zone: 'Southern', regions: ['Andhra Pradesh', 'Telangana', 'Karnataka'] }
parseIFSC('HDFC0001234'); // { bank: 'HDFC', branch: '001234' }
parseGSTIN('27AAPFU0939F1ZV').state; // 'Maharashtra'
```

For full branch/bank names from an IFSC, use Razorpay's [`ifsc`](https://github.com/razorpay/ifsc) dataset; this package stays tiny and offline.

## Test data

```ts
import { fakeGSTIN, fakePAN, fakeAadhaar, createFaker, seededRandom } from 'zod-india/testing';

fakeGSTIN(); // random, checksum-valid, e.g. '07ABCCD1234E1Z5'
fakeGSTIN('27'); // Maharashtra
const f = createFaker(seededRandom(42)); // reproducible fixtures for snapshots
f.aadhaar(); // passes Verhoeff
```

Generated values are random and synthetic. Use them only in tests, seeds and demos.

## With react-hook-form / Hono

```ts
// react-hook-form
import { zodResolver } from '@hookform/resolvers/zod';
const schema = z.object({ gstin: zGSTIN({ message: 'Check your GSTIN' }), phone: zMobile() });
useForm({ resolver: zodResolver(schema) });

// Hono
import { zValidator } from '@hono/zod-validator';
app.post('/kyc', zValidator('json', z.object({ pan: zPAN(), ifsc: zIFSC() })), (c) =>
  c.json(c.req.valid('json')),
);
```

## Notes and known limits

- **GSTIN**: only regular PAN-based registrations are accepted. Special registrations (UN bodies with a UIN, non-resident OIDAR, TAN-based TDS/TCS) use a different structure in characters 3–12 and are rejected; `{ checksum: false }` only skips the 15th-character check, it does not accept those formats.
- **Aadhaar**: the Verhoeff check catches all single-digit typos and adjacent swaps, but random 12-digit numbers still pass about 1 time in 10. Never log or store full Aadhaar numbers; mask them (see UIDAI guidance).
- **Vehicle numbers**: state-series formats vary by RTO; the rule here is deliberately permissive within a known state prefix.
- **Mobile**: Indian mobile numbers only, not landlines.

## Comparison

| Package                                                            | Zod schemas | GSTIN checksum  | Aadhaar Verhoeff | Normalisation | Types  | Zod v3 + v4 |
| ------------------------------------------------------------------ | ----------- | --------------- | ---------------- | ------------- | ------ | ----------- |
| **zod-india**                                                      | ✅          | ✅              | ✅               | ✅            | ✅     | ✅          |
| single-format packages (`gstin-validator`, `aadhaar-validator`, …) | ❌          | one format each | one format each  | ❌            | varies | ❌          |

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). Please never put a real person's identifiers in issues or tests.

## Sibling packages

Other tools by the same author:

- [secret-blast-radius](https://www.npmjs.com/package/secret-blast-radius): what a malicious npm install could steal, plus a rotation plan
- [create-bullmq-app](https://www.npmjs.com/package/create-bullmq-app): scaffold a production BullMQ + TypeScript service
- [webhook-crash-lab](https://www.npmjs.com/package/webhook-crash-lab): crash-test webhook handlers against duplicates and races
- [webhook-crash-lab-mcp](https://www.npmjs.com/package/webhook-crash-lab-mcp): MCP server so coding agents can run webhook-crash-lab
- [eslint-plugin-bullmq](https://www.npmjs.com/package/eslint-plugin-bullmq): lint rules for BullMQ production pitfalls
- [eslint-plugin-webhook-safety](https://www.npmjs.com/package/eslint-plugin-webhook-safety): lint rules for unsafe Stripe webhook handlers

## License

MIT © Krrish Kumar
