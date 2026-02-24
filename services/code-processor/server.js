/**
 * Code Processor Service
 * HTTP API for code processing operations
 *
 * Endpoints:
 * - POST /process - Process code with various operations
 * - POST /analyze - Deep code analysis
 * - POST /format - Format code with options
 * - GET /health - Health check
 */

const express = require('express');
const app = express();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'code-processor',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Process code endpoint
app.post('/process', async (req, res) => {
  try {
    const { code, operations = ['validate', 'analyze'] } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Code is required' });
    }

    const results = {};

    // Validate if requested
    if (operations.includes('validate')) {
      results.validation = validateCode(code);
    }

    // Analyze if requested
    if (operations.includes('analyze')) {
      results.analysis = analyzeCode(code);
    }

    // Format if requested
    if (operations.includes('format')) {
      results.formatting = formatCode(code);
    }

    res.json({
      results,
      operations_completed: operations,
      processed_at: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      type: 'ProcessError',
    });
  }
});

// Deep analysis endpoint (simulates long-running operation)
app.post('/analyze', async (req, res) => {
  try {
    const { code, deep = false, include_suggestions = true } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Code is required' });
    }

    // Simulate long-running analysis
    if (deep) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    const analysis = analyzeCode(code);

    // Add suggestions if requested
    if (include_suggestions) {
      analysis.suggestions = generateSuggestions(analysis);
    }

    res.json(analysis);
  } catch (error) {
    res.status(500).json({
      error: error.message,
      type: 'AnalysisError',
    });
  }
});

// Format code endpoint
app.post('/format', async (req, res) => {
  try {
    const { code, options = {} } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Code is required' });
    }

    const result = formatCode(code, options);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: error.message,
      type: 'FormatError',
    });
  }
});

// Helper functions
function validateCode(code) {
  const errors = [];

  try {
    new Function(code);

    const openBraces = (code.match(/\{/g) || []).length;
    const closeBraces = (code.match(/\}/g) || []).length;
    if (openBraces !== closeBraces) {
      errors.push({ type: 'syntax', message: 'Mismatched braces' });
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  } catch (error) {
    return {
      valid: false,
      errors: [{ type: 'syntax', message: error.message }],
    };
  }
}

function analyzeCode(code) {
  const lines = code.split('\n').length;
  const complexity = calculateComplexity(code);

  const issues = [];
  if (code.includes('eval(')) {
    issues.push({
      severity: 'high',
      message: 'Use of eval() detected',
      category: 'security',
    });
  }

  return {
    metrics: {
      lines,
      complexity,
      rating: complexity <= 10 ? 'simple' : 'complex',
    },
    issues,
    summary: {
      total_issues: issues.length,
      high: issues.filter((i) => i.severity === 'high').length,
    },
  };
}

function formatCode(code, options = {}) {
  let formatted = code.trim();

  if (options.addSemicolons !== false) {
    formatted = formatted.replace(/([^;{}\s])(\n|$)/g, '$1;$2');
  }

  return {
    original: code,
    formatted: formatted,
    changed: code !== formatted,
  };
}

function calculateComplexity(code) {
  const keywords = ['if', 'else', 'for', 'while', 'case'];
  let complexity = 1;
  keywords.forEach((keyword) => {
    const matches = code.match(new RegExp('\\b' + keyword + '\\b', 'g'));
    if (matches) complexity += matches.length;
  });
  return complexity;
}

function generateSuggestions(analysis) {
  const suggestions = [];

  if (analysis.metrics.complexity > 10) {
    suggestions.push({
      type: 'refactoring',
      message: 'Consider breaking down complex functions into smaller ones',
    });
  }

  analysis.issues.forEach((issue) => {
    if (issue.severity === 'high') {
      suggestions.push({
        type: 'security',
        message: `Fix ${issue.category} issue: ${issue.message}`,
      });
    }
  });

  return suggestions;
}

// Error handling
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message,
  });
});

// Start server
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log(`🚀 Code Processor Service`);
  console.log(`📡 Running on port ${PORT}`);
  console.log(`🔗 http://localhost:${PORT}`);
  console.log('='.repeat(50));
  console.log('Endpoints:');
  console.log(`  GET  /health - Health check`);
  console.log(`  POST /process - Process code`);
  console.log(`  POST /analyze - Deep analysis`);
  console.log(`  POST /format - Format code`);
  console.log('='.repeat(50));
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

module.exports = app;
