#!/usr/bin/env node

/**
 * Code Formatter Tool
 * Formats JavaScript/TypeScript code with consistent style
 *
 * Usage: node format-code.js <code> [language]
 */

function formatCode(code, language = 'javascript') {
  // Simple formatter (for production, use Prettier)
  let formatted = code;

  // Add semicolons if missing
  formatted = formatted.replace(/([^;{}\s])\s*(\n|$)/g, '$1;$2');

  // Consistent spacing around operators
  formatted = formatted.replace(/(\w+)=(\w+)/g, '$1 = $2');
  formatted = formatted.replace(/(\w+)\+(\w+)/g, '$1 + $2');
  formatted = formatted.replace(/(\w+)-(\w+)/g, '$1 - $2');
  formatted = formatted.replace(/(\w+)\*(\w+)/g, '$1 * $2');
  formatted = formatted.replace(/(\w+)\/(\w+)/g, '$1 / $2');

  // Format braces
  formatted = formatted.replace(/\{/g, ' {\n  ');
  formatted = formatted.replace(/\}/g, '\n}');
  formatted = formatted.replace(/;/g, ';\n');

  // Clean up extra newlines
  formatted = formatted.replace(/\n\n+/g, '\n');
  formatted = formatted.trim();

  const changes = [];
  if (formatted !== code) {
    changes.push({
      type: 'formatting',
      description: 'Code has been reformatted for consistency',
    });
  }

  return {
    original: code,
    formatted: formatted,
    language,
    stats: {
      original_length: code.length,
      formatted_length: formatted.length,
      difference: formatted.length - code.length,
      lines_before: code.split('\n').length,
      lines_after: formatted.split('\n').length,
    },
    changes,
    formatted_at: new Date().toISOString(),
  };
}

// Main execution
function main() {
  try {
    const code = process.argv[2];
    const language = process.argv[3] || 'javascript';

    if (!code) {
      console.error(
        JSON.stringify({
          error: 'Code argument is required',
          usage: 'node format-code.js <code> [language]',
          example: 'node format-code.js "const x=1;const y=2;" javascript',
        }),
      );
      process.exit(1);
    }

    const result = formatCode(code, language);

    // Output JSON to stdout
    console.log(JSON.stringify(result, null, 2));

    process.exit(0);
  } catch (error) {
    console.error(
      JSON.stringify({
        error: error.message,
        stack: error.stack,
      }),
    );
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { formatCode };
