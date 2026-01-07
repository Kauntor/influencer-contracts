#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Default values
const DEFAULTS = {
  REV_SHARE_PERCENT: '30',
  PERFORMANCE_REV_SHARE_PERCENT: '40',
  PERFORMANCE_THRESHOLD: '50',
  PAYMENT_FREQUENCY: 'monthly',
  PAYMENT_METHOD: 'PayPal or bank transfer',
  MIN_PAYOUT: '25',
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

function calculateEndDate(startDate) {
  const date = new Date(startDate);
  date.setFullYear(date.getFullYear() + 1);
  return date.toISOString().split('T')[0];
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function processTemplate(template, config) {
  let result = template;

  // Handle conditional blocks for minor/adult
  const isMinor = config.IS_MINOR === 'true' || config.IS_MINOR === true;

  if (isMinor) {
    // Remove IF_ADULT blocks
    result = result.replace(/\{\{#IF_ADULT\}\}[\s\S]*?\{\{\/IF_ADULT\}\}/g, '');
    // Keep IF_MINOR content but remove tags
    result = result.replace(/\{\{#IF_MINOR\}\}/g, '');
    result = result.replace(/\{\{\/IF_MINOR\}\}/g, '');
  } else {
    // Remove IF_MINOR blocks
    result = result.replace(/\{\{#IF_MINOR\}\}[\s\S]*?\{\{\/IF_MINOR\}\}/g, '');
    // Keep IF_ADULT content but remove tags
    result = result.replace(/\{\{#IF_ADULT\}\}/g, '');
    result = result.replace(/\{\{\/IF_ADULT\}\}/g, '');
  }

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

  // Calculate end date if not provided
  if (!config.END_DATE) {
    config.END_DATE = calculateEndDate(config.START_DATE);
  }

  // Format dates for display
  config.START_DATE = formatDate(config.START_DATE);
  config.END_DATE = formatDate(config.END_DATE);

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

  // Convert markdown to HTML with styling
  const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Kauntor Partnership Agreement</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 40px auto; padding: 20px; color: #333; }
    h1 { color: #111; border-bottom: 2px solid #333; padding-bottom: 10px; }
    h2 { color: #222; margin-top: 30px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
    table { border-collapse: collapse; width: 100%; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
    th { background-color: #f5f5f5; }
    hr { border: none; border-top: 1px solid #ddd; margin: 30px 0; }
    ul { margin: 10px 0; padding-left: 25px; }
    li { margin: 5px 0; }
    strong { color: #111; }
    @media print { body { margin: 0; padding: 20px; } }
  </style>
</head>
<body>
${processed.replace(/^# /gm, '<h1>').replace(/^## /gm, '<h2>').replace(/\n\n/g, '</p><p>').replace(/^- /gm, '<li>').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')}
</body>
</html>`;

  // Try pandoc for better HTML conversion
  try {
    execSync(`pandoc "${mdPath}" -o "${htmlPath}" --standalone --metadata title="Kauntor Partnership Agreement" -c "" --embed-resources`, {
      stdio: 'pipe'
    });
    console.log(`Generated: ${htmlPath}`);
  } catch (e) {
    // Fallback to simple HTML
    fs.writeFileSync(htmlPath, htmlContent);
    console.log(`Generated: ${htmlPath}`);
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

Usage:
  node generate-contract.js [config.json] [options]
  node generate-contract.js [options]

You can provide a JSON config file, command-line options, or both.
Command-line options override values from the config file.

Required Fields:
  --partner-name <name>     Partner's full legal name
  --start-date <YYYY-MM-DD> Agreement start date
  --promo-code <code>       Unique promotional code for the partner

Optional Fields:
  --end-date <YYYY-MM-DD>          Agreement end date (default: 1 year from start)
  --rev-share-percent <num>        Revenue share percentage (default: 30)
  --performance-rev-share-percent  Performance boost percentage (default: 40)
  --performance-threshold <num>    Active subs threshold for boost (default: 50)
  --payment-frequency <freq>       Payment frequency (default: monthly)
  --payment-method <method>        Payment method (default: PayPal or bank transfer)
  --min-payout <amount>            Minimum payout threshold (default: 25)
  --governing-law <jurisdiction>   Governing law jurisdiction (default: Ontario, Canada)

Minor Partner Fields:
  --is-minor true                  Flag if partner is under 18
  --minor-name <name>              Minor's name (if different from partner name)
  --guardian-name <name>           Parent/Guardian's full legal name

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

  # Minor partner (requires guardian)
  node generate-contract.js \\
    --partner-name "Jane Doe" \\
    --start-date "2025-01-15" \\
    --promo-code "JANEFIT25" \\
    --is-minor true \\
    --minor-name "Jake Doe" \\
    --guardian-name "Jane Doe"
`);
}

// Main
const config = parseArgs();

if (config.HELP || process.argv.length < 3) {
  showHelp();
  process.exit(0);
}

generateContract(config);
