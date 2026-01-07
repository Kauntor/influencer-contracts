# Kauntor Influencer Contracts

Generate partnership contracts for Kauntor influencer/creator partnerships.

## Features

- Markdown-based contract template with variable substitution
- PDF generation via pandoc
- Support for adult and minor partners (with guardian clause)
- JSON config files for easy partner management
- Performance boost clause (30% -> 40% at 50 active subs)

## Prerequisites

- Node.js (v14+)
- [pandoc](https://pandoc.org/installing.html) - for HTML generation
- A PDF engine (one of: prince, wkhtmltopdf, weasyprint, or pdflatex)

### Install pandoc

```bash
# macOS
brew install pandoc

# Ubuntu/Debian
sudo apt-get install pandoc

# Windows
choco install pandoc
```

### Install a PDF engine

The script tries multiple PDF engines in order: prince > wkhtmltopdf > weasyprint > pdflatex

```bash
# macOS - Prince (high quality, recommended)
brew install prince

# Or wkhtmltopdf
brew install wkhtmltopdf

# Or weasyprint (Python-based)
pip install weasyprint

# Or MacTeX for pdflatex
brew install --cask mactex
```

## Quick Start

### Option 1: Using command-line arguments

```bash
node scripts/generate-contract.js \
  --partner-name "John Smith" \
  --start-date "2025-01-15" \
  --promo-code "JOHNFIT25"
```

### Option 2: Using a JSON config file

1. Create a partner config file in `partners/`:

```json
{
  "PARTNER_NAME": "John Smith",
  "START_DATE": "2025-01-15",
  "PROMO_CODE": "JOHNFIT25"
}
```

2. Generate the contract:

```bash
node scripts/generate-contract.js partners/john-smith.json
```

### Output

Contracts are generated in the `output/` directory:
- `kauntor-partnership-john-smith-2025-01-06.md` (Markdown)
- `kauntor-partnership-john-smith-2025-01-06.html` (HTML)
- `kauntor-partnership-john-smith-2025-01-06.pdf` (PDF)

## Configuration Options

### Required Fields

| Field | Description |
|-------|-------------|
| `PARTNER_NAME` | Partner's full legal name |
| `START_DATE` | Agreement start date (YYYY-MM-DD) |
| `PROMO_CODE` | Unique promotional code |

### Optional Fields

| Field | Default | Description |
|-------|---------|-------------|
| `END_DATE` | 1 year from start | Agreement end date |
| `REV_SHARE_PERCENT` | 30 | Base revenue share % |
| `PERFORMANCE_REV_SHARE_PERCENT` | 40 | Performance boost % |
| `PERFORMANCE_THRESHOLD` | 50 | Active subs for boost |
| `PAYMENT_FREQUENCY` | monthly | Payment schedule |
| `PAYMENT_METHOD` | PayPal or bank transfer | Payment method |
| `MIN_PAYOUT` | 25 | Minimum payout ($) |
| `GOVERNING_LAW` | Ontario, Canada | Legal jurisdiction |

### Minor Partner Fields

| Field | Description |
|-------|-------------|
| `IS_MINOR` | Set to `true` if partner is under 18 |
| `MINOR_NAME` | Minor's name |
| `GUARDIAN_NAME` | Parent/Guardian's full legal name |

## Examples

### Adult Partner

```bash
node scripts/generate-contract.js \
  --partner-name "Sarah Johnson" \
  --start-date "2025-02-01" \
  --promo-code "SARAHFIT25" \
  --payment-method "PayPal"
```

### Minor Partner (requires guardian signature)

```bash
node scripts/generate-contract.js \
  --partner-name "Mike Williams Sr." \
  --start-date "2025-02-01" \
  --promo-code "MIKEFIT25" \
  --is-minor true \
  --minor-name "Mike Williams Jr." \
  --guardian-name "Mike Williams Sr."
```

### Using JSON config with overrides

```bash
# Use config file but override the promo code
node scripts/generate-contract.js partners/sarah.json --promo-code "NEWCODE25"
```

## Directory Structure

```
influencer-contracts/
├── templates/
│   └── founding-partner-agreement.md   # Main contract template
├── partners/
│   ├── example-partner.json            # Example adult config
│   └── example-minor.json              # Example minor config
├── scripts/
│   └── generate-contract.js            # Contract generator
├── output/                             # Generated contracts (gitignored)
├── package.json
└── README.md
```

## Deal Summary (for DMs)

Use this when reaching out to potential partners:

> Hey! I run Kauntor and we're opening a small founding partner program with a few creators.
>
> It's a custom code with 25% off the Kauntor Premium annual plan, 30% recurring rev share (net, incl. renewals), and a performance boost to 40% for strong results. You also get free Kauntor Premium while partnered.
>
> If you're interested, I can send over a simple annual agreement.

## Contract Terms Summary

- **Discount:** 25% off Kauntor Premium annual plan
- **Revenue Share:** 30% of net revenue (after App Store fees, taxes, refunds)
- **Performance Boost:** 40% after 50 active subscribers
- **Duration:** 1 year (renewable)
- **Renewals:** Included for life of subscription
- **Posting Requirements:** None (organic, authentic use only)
- **Minor Partners:** Requires parent/guardian signature

## Notes

- Revenue share is calculated on **net revenue** (after Apple's ~30% cut, taxes, and refunds)
- Approximate payout: ~$9.43/year per active annual subscriber at 30%
- Contracts should be reviewed by a lawyer before use in production
