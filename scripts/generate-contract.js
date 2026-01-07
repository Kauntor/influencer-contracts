#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Default values
const DEFAULTS = {
  GOVERNING_LAW: 'Ontario, Canada',
};

function parseArgs() {
  const args = process.argv.slice(2);
  let config = { ...DEFAULTS };

  // Check if first arg is a JSON config file
  if (args[0] && args[0].endsWith('.json')) {
    const configPath = path.resolve(args[0]);
    if (fs.existsSync(configPath)) {
      const fileConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      config = { ...config, ...fileConfig };
      // Process remaining args as overrides
      args.shift();
    }
  }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2).toUpperCase().replace(/-/g, '_');
      const value = args[++i];
      config[key] = value;
    }
  }

  return config;
}

function formatDate(dateStr) {
  // Parse as local date to avoid timezone issues
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function processTemplate(template, config) {
  let result = template;

  // Replace all variables
  for (const [key, value] of Object.entries(config)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(regex, value);
  }

  return result;
}

function generateContract(config) {
  // Validate required fields
  const required = ['PARTNER_NAME', 'START_DATE', 'PROMO_CODE'];
  for (const field of required) {
    if (!config[field]) {
      console.error(`Error: Missing required field: --${field.toLowerCase().replace(/_/g, '-')}`);
      process.exit(1);
    }
  }

  // Format start date for display
  config.START_DATE = formatDate(config.START_DATE);

  // Read template
  const templatePath = path.join(__dirname, '..', 'templates', 'founding-partner-agreement.md');
  const template = fs.readFileSync(templatePath, 'utf8');

  // Process template
  const processed = processTemplate(template, config);

  // Generate output filename
  const sanitizedName = config.PARTNER_NAME.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const dateStr = new Date().toISOString().split('T')[0];
  const outputName = `kauntor-partnership-${sanitizedName}-${dateStr}`;

  // Write markdown
  const outputDir = path.join(__dirname, '..', 'output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const mdPath = path.join(outputDir, `${outputName}.md`);
  fs.writeFileSync(mdPath, processed);
  console.log(`Generated: ${mdPath}`);

  // Generate HTML first (intermediate step)
  const htmlPath = path.join(outputDir, `${outputName}.html`);
  const pdfPath = path.join(outputDir, `${outputName}.pdf`);

  // Try pandoc for HTML conversion
  try {
    execSync(`pandoc "${mdPath}" -o "${htmlPath}" --standalone --metadata title="Kauntor Partnership Agreement"`, {
      stdio: 'pipe'
    });
    console.log(`Generated: ${htmlPath}`);
  } catch (e) {
    console.log(`Note: HTML generation failed. Markdown file is available at: ${mdPath}`);
  }

  // Generate PDF - try multiple engines
  let pdfGenerated = false;

  // Try prince first (high quality)
  try {
    execSync(`prince "${htmlPath}" -o "${pdfPath}"`, { stdio: 'pipe' });
    console.log(`Generated: ${pdfPath}`);
    pdfGenerated = true;
  } catch (e) {
    // Try wkhtmltopdf
    try {
      execSync(`wkhtmltopdf --enable-local-file-access "${htmlPath}" "${pdfPath}"`, { stdio: 'pipe' });
      console.log(`Generated: ${pdfPath}`);
      pdfGenerated = true;
    } catch (e2) {
      // Try weasyprint
      try {
        execSync(`weasyprint "${htmlPath}" "${pdfPath}"`, { stdio: 'pipe' });
        console.log(`Generated: ${pdfPath}`);
        pdfGenerated = true;
      } catch (e3) {
        // Try pandoc with pdflatex
        try {
          execSync(`pandoc "${mdPath}" -o "${pdfPath}" -V geometry:margin=1in`, { stdio: 'pipe' });
          console.log(`Generated: ${pdfPath}`);
          pdfGenerated = true;
        } catch (e4) {
          // All engines failed
        }
      }
    }
  }

  if (!pdfGenerated) {
    console.log(`Note: PDF generation failed. HTML file is available at: ${htmlPath}`);
    console.log('To generate PDF, install one of: prince, wkhtmltopdf, weasyprint, or pdflatex');
  }

  return { mdPath, pdfPath };
}

function showHelp() {
  console.log(`
Kauntor Contract Generator

Generates Founding Partner Agreements with:
- 40% revenue share (net of App Store fees, taxes, refunds)
- 25% off annual subscription for partner's audience
- Contract valid until December 31, 2026
- Payment via Zelle, PayPal, Revolut, Interac, or Bitcoin

Usage:
  node generate-contract.js [config.json] [options]
  node generate-contract.js [options]

Required Fields:
  --partner-name <name>     Partner's full legal name
  --start-date <YYYY-MM-DD> Agreement start date
  --promo-code <code>       Unique promotional code for the partner

Optional Fields:
  --governing-law <jurisdiction>   Legal jurisdiction (default: Ontario, Canada)

Examples:
  # Using a JSON config file
  node generate-contract.js partners/john-smith.json

  # Using command-line options
  node generate-contract.js \\
    --partner-name "John Smith" \\
    --start-date "2025-01-15" \\
    --promo-code "JOHNFIT25"

  # Config file with overrides
  node generate-contract.js partners/john-smith.json --promo-code "NEWCODE25"
`);
}

// Main
const config = parseArgs();

if (config.HELP || process.argv.length < 3) {
  showHelp();
  process.exit(0);
}

generateContract(config);
