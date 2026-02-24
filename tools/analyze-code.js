#!/usr/bin/env node

/**
 * Code Analyzer Tool
 * Analyzes JavaScript/TypeScript code for metrics, complexity, and issues
 *
 * Usage: node analyze-code.js <code> [language]
 */

function analyzeCode(code, language = 'javascript') {
  const lines = code.split('\n').length;
  const chars = code.length;
  const words = code.split(/\s+/).filter((w) => w).length;

  // Detect potential issues
  const issues = [];

  // Security issues
  if (code.includes('eval(')) {
    issues.push({
      severity: 'high',
      line: findLineNumber(code, 'eval('),
      message: 'Dangerous use of eval() detected - security risk',
      category: 'security',
    });
  }

  if (code.match(/innerHTML\s*=/)) {
    issues.push({
      severity: 'medium',
      line: findLineNumber(code, 'innerHTML'),
      message: 'Direct innerHTML assignment can lead to XSS vulnerabilities',
      category: 'security',
    });
  }

  // Code quality issues
  if (code.includes('var ')) {
    issues.push({
      severity: 'low',
      line: findLineNumber(code, 'var '),
      message: 'Use let or const instead of var for better scoping',
      category: 'best-practices',
    });
  }

  if (code.includes('console.log')) {
    issues.push({
      severity: 'info',
      line: findLineNumber(code, 'console.log'),
      message: 'Remove console.log statements before production',
      category: 'best-practices',
    });
  }

  if (code.match(/==(?!=)/)) {
    issues.push({
      severity: 'low',
      line: findLineNumber(code, '=='),
      message: 'Use === instead of == for strict equality',
      category: 'best-practices',
    });
  }

  // Calculate cyclomatic complexity
  const complexity = calculateComplexity(code);

  // Count functions
  const functionCount =
    (code.match(/function\s+\w+/g) || []).length +
    (code.match(/\w+\s*=\s*\(/g) || []).length +
    (code.match(/=>\s*{/g) || []).length;

  return {
    language,
    metrics: {
      lines,
      characters: chars,
      words,
      complexity,
      complexity_rating: getComplexityRating(complexity),
      function_count: functionCount,
      average_line_length: Math.round(chars / lines),
    },
    issues,
    summary: {
      total_issues: issues.length,
      high: issues.filter((i) => i.severity === 'high').length,
      medium: issues.filter((i) => i.severity === 'medium').length,
      low: issues.filter((i) => i.severity === 'low').length,
      info: issues.filter((i) => i.severity === 'info').length,
    },
    analyzed_at: new Date().toISOString(),
  };
}

function calculateComplexity(code) {
  const complexityKeywords = ['if', 'else', 'for', 'while', 'case', '&&', '||'];
  let complexity = 1;

  complexityKeywords.forEach((keyword) => {
    const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = keyword.match(/^\w+$/)
      ? new RegExp('\\b' + escapedKeyword + '\\b', 'g')
      : new RegExp(escapedKeyword, 'g');
    const matches = code.match(pattern);
    if (matches) complexity += matches.length;
  });

  return complexity;
}

function findLineNumber(code, pattern) {
  const lines = code.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(pattern)) {
      return i + 1;
    }
  }
  return 1;
}

function getComplexityRating(complexity) {
  if (complexity <= 5) return 'simple';
  if (complexity <= 10) return 'moderate';
  if (complexity <= 20) return 'complex';
  return 'very_complex';
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
          usage: 'node analyze-code.js <code> [language]',
          example:
            'node analyze-code.js "function test() { return true; }" javascript',
        }),
      );
      process.exit(1);
    }

    const result = analyzeCode(code, language);

    // Output JSON to stdout (captured by Universal MCP Bridge)
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

module.exports = { analyzeCode };
