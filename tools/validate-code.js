#!/usr/bin/env node

/**
 * Code Validator Tool
 * Quick syntax validation for JavaScript code
 *
 * Usage: node validate-code.js <code>
 */

function validateCode(code) {
  const errors = [];
  const warnings = [];

  try {
    // Basic syntax check - try to parse
    new Function(code);

    // Additional validation checks

    // Check for unclosed braces
    const openBraces = (code.match(/\{/g) || []).length;
    const closeBraces = (code.match(/\}/g) || []).length;
    if (openBraces !== closeBraces) {
      errors.push({
        type: 'syntax',
        message: `Mismatched braces: ${openBraces} opening, ${closeBraces} closing`,
      });
    }

    // Check for unclosed parentheses
    const openParens = (code.match(/\(/g) || []).length;
    const closeParens = (code.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
      errors.push({
        type: 'syntax',
        message: `Mismatched parentheses: ${openParens} opening, ${closeParens} closing`,
      });
    }

    // Check for unclosed brackets
    const openBrackets = (code.match(/\[/g) || []).length;
    const closeBrackets = (code.match(/\]/g) || []).length;
    if (openBrackets !== closeBrackets) {
      errors.push({
        type: 'syntax',
        message: `Mismatched brackets: ${openBrackets} opening, ${closeBrackets} closing`,
      });
    }

    // Warnings for common issues
    if (code.includes('var ')) {
      warnings.push({
        type: 'style',
        message: 'Using "var" is discouraged, consider using "let" or "const"',
      });
    }

    if (code.match(/==(?!=)/)) {
      warnings.push({
        type: 'style',
        message:
          'Using "==" is discouraged, consider using "===" for strict equality',
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      summary: {
        error_count: errors.length,
        warning_count: warnings.length,
      },
      validated_at: new Date().toISOString(),
    };
  } catch (error) {
    errors.push({
      type: 'syntax',
      message: error.message,
    });

    return {
      valid: false,
      errors,
      warnings,
      summary: {
        error_count: errors.length,
        warning_count: warnings.length,
      },
      validated_at: new Date().toISOString(),
    };
  }
}

// Main execution
function main() {
  try {
    const code = process.argv[2];

    if (!code) {
      console.error(
        JSON.stringify({
          error: 'Code argument is required',
          usage: 'node validate-code.js <code>',
          example: 'node validate-code.js "function test() { return true; }"',
        }),
      );
      process.exit(1);
    }

    const result = validateCode(code);

    // Output JSON to stdout
    console.log(JSON.stringify(result, null, 2));

    // Exit with error code if invalid
    process.exit(result.valid ? 0 : 1);
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

module.exports = { validateCode };
