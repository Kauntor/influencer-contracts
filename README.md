# Kauntor Influencer Contracts

Generate partnership contracts for Kauntor influencer/creator partnerships.

## Contract Terms

- **Revenue Share:** 40% of net revenue on initial subscription (renewals not included)
- **Discount:** 25% off Kauntor Premium annual subscription
- **Code Eligibility:** Users can use the code even if they've used other offer codes before
- **Term:** From signing date until December 31, 2026
- **Payment Options:** Zelle (USA), PayPal, Revolut, Interac e-Transfer (Canada), Bitcoin
- **Bitcoin Payments:** Converted from USD at market rate at time of payment
- **Minimum Payout:** $25 USD
- **Minor Partners:** Parent/guardian signature always available

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
```

### Install a PDF engine

```bash
# macOS - Prince (recommended)
brew install prince

# Or wkhtmltopdf
brew install wkhtmltopdf

# Or weasyprint
pip install weasyprint
```

## Quick Start

### Using command-line arguments

```bash
node scripts/generate-contract.js \
  --partner-name "John Smith" \
  --start-date "2025-01-15" \
  --promo-code "JOHNFIT25"
```

### Using a JSON config file

1. Create a partner config in `partners/`:

```json
{
  "PARTNER_NAME": "John Smith",
  "START_DATE": "2025-01-15",
  "PROMO_CODE": "JOHNFIT25"
}
```

2. Generate:

```bash
node scripts/generate-contract.js partners/john-smith.json
```

### Output

Contracts are generated in `output/`:
- `kauntor-partnership-john-smith-2025-01-15.md`
- `kauntor-partnership-john-smith-2025-01-15.html`
- `kauntor-partnership-john-smith-2025-01-15.pdf`

## Configuration

| Field | Required | Default | Description |
|-------|----------|---------|-------------|
| `PARTNER_NAME` | Yes | - | Partner's full legal name |
| `START_DATE` | Yes | - | Agreement start date (YYYY-MM-DD) |
| `PROMO_CODE` | Yes | - | Unique promotional code |
| `GOVERNING_LAW` | No | Ontario, Canada | Legal jurisdiction |

## Directory Structure

```
influencer-contracts/
├── templates/
│   └── founding-partner-agreement.md
├── partners/
│   └── example-partner.json
├── scripts/
│   └── generate-contract.js
├── output/                    # Generated contracts (gitignored)
└── README.md
```

## DM Outreach Template

> Hey! I run Kauntor and we're opening a small founding partner program with a few creators.
>
> It's a custom code with 25% off the Kauntor Premium annual plan and 40% rev share (net) on new subscribers. You also get free Kauntor Premium while partnered.
>
> If you're interested, I can send over a simple agreement.

## Revenue Math

- Annual plan: $59.88/year ($4.99/mo)
- 25% discount: $44.91/year
- Apple cut (~30%): ~$31.44 net to Kauntor
- **Partner gets 40%:** ~$12.58 per new subscriber (initial subscription only)
