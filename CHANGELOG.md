# zod-india

## 0.4.0

### Minor Changes

- 6f8601f: Add Udyam (MSME) registration number normalization, validation and Zod schema. Thanks @Aaqibhafeezkhan (#5).

## 0.3.2

### Patch Changes

- npm metadata: shorter description, focused keywords, homepage/bugs links; README links sibling packages.

## 0.3.1

### Patch Changes

- README: clarify which GSTIN registrations are accepted (regular GSTINs; UIN, OIDAR and TAN-based TDS/TCS registrations are rejected on purpose).
- Dev dependency security updates (no runtime changes).

## 0.3.0

### Minor Changes

- 4986045: Add Indian display helpers (`formatINR`, `formatINRCompact`, `toIndianWords`, `rupeesInWords`, `maskPAN`, `maskMobile`, `formatMobile`, `formatAadhaar`), offline lookups (`parseVehicleNumber`, `pincodeZone`, `parseIFSC`), and a `zod-india/testing` entry with seedable, checksum-valid fake data generators.

## 0.2.0

### Minor Changes

- 8440ff5: Initial release: validators and Zod schemas for GSTIN, PAN, TAN, IFSC, UPI, mobile, PIN code, Aadhaar and vehicle registration numbers.
