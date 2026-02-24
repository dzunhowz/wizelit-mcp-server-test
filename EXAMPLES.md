# Example Usage - Wizelit MCP Server Test

This document provides detailed examples of how to use the Node.js MCP server with the Universal Bridge.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Using CLI Tools Directly](#using-cli-tools-directly)
3. [Using HTTP Service](#using-http-service)
4. [Using via Universal Bridge](#using-via-universal-bridge)
5. [Integration Examples](#integration-examples)

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Test CLI tools only
npm test

# 3. Start HTTP service (in one terminal)
npm start

# 4. Run Universal Bridge (in another terminal)
cd ../wizelit-sdk
wizelit-sdk run-bridge --config ../wizelit-mcp-server-test/config/bridge-config.yaml
```

## Using CLI Tools Directly

### Analyze Code

```bash
# Basic analysis
node tools/analyze-code.js 'function test() { return 1; }'

# Analyze code with security issues
node tools/analyze-code.js 'function unsafe() { eval("test"); }'

# Output:
{
  "language": "javascript",
  "metrics": {
    "lines": 1,
    "complexity": 1,
    "function_count": 1
  },
  "issues": [
    {
      "severity": "high",
      "message": "Dangerous use of eval()",
      "category": "security"
    }
  ]
}
```

### Format Code

```bash
# Basic formatting
node tools/format-code.js 'const x=1;const y=2;'

# With multi-line code
node tools/format-code.js 'function test(){if(true){return 1}}'

# Output:
{
  "original": "...",
  "formatted": "...",
  "stats": {
    "lines_before": 1,
    "lines_after": 5
  }
}
```

### Validate Code

```bash
# Valid code
node tools/validate-code.js 'function test() { return 1; }'

# Invalid code
node tools/validate-code.js 'function test() { return 1'

# Output:
{
  "valid": false,
  "errors": [
    {
      "type": "syntax",
      "message": "Unexpected end of input"
    }
  ]
}
```

## Using HTTP Service

### Start the Service

```bash
npm start
# Server runs on http://localhost:3000
```

### Health Check

```bash
curl http://localhost:3000/health

# Response:
{
  "status": "healthy",
  "service": "code-processor",
  "uptime": 42.5
}
```

### Process Code (Multiple Operations)

```bash
curl -X POST http://localhost:3000/process \
  -H "Content-Type: application/json" \
  -d '{
    "code": "function test() { return 1; }",
    "operations": ["validate", "analyze", "format"]
  }'

# Response:
{
  "results": {
    "validation": { "valid": true, "errors": [] },
    "analysis": { "metrics": {...}, "issues": [] },
    "formatting": { "formatted": "...", "changed": false }
  },
  "operations_completed": ["validate", "analyze", "format"]
}
```

### Deep Analysis

```bash
curl -X POST http://localhost:3000/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "code": "function complex() { if(x) { if(y) { if(z) { return 1; } } } }",
    "deep": true,
    "include_suggestions": true
  }'

# Response:
{
  "metrics": {
    "lines": 1,
    "complexity": 4,
    "rating": "simple"
  },
  "issues": [],
  "suggestions": [
    {
      "type": "refactoring",
      "message": "Consider breaking down complex functions"
    }
  ]
}
```

### Format Code via HTTP

```bash
curl -X POST http://localhost:3000/format \
  -H "Content-Type: application/json" \
  -d '{
    "code": "const x=1;const y=2;",
    "options": { "addSemicolons": true }
  }'
```

## Using via Universal Bridge

### 1. Start Components

```bash
# Terminal 1: Start HTTP service
cd wizelit-mcp-server-test
npm start

# Terminal 2: Start Universal Bridge
cd ../wizelit-sdk
wizelit-sdk run-bridge --config ../wizelit-mcp-server-test/config/bridge-config.yaml
```

### 2. Connect MCP Client

The bridge exposes all tools via MCP protocol. You can connect any MCP client (like Claude Desktop, IDEs, etc.) to use these tools.

**Available MCP Tools:**

- `analyze_code_cli` - CLI-based code analyzer
- `format_code_cli` - CLI-based code formatter
- `validate_code_cli` - CLI-based code validator
- `process_code` - HTTP-based multi-operation processor
- `analyze_code_deep` - HTTP-based deep analyzer
- `format_code_http` - HTTP-based formatter
- `health_check` - Service health check

### 3. Example MCP Tool Calls

#### Using CLI Tool via Bridge

```python
# From Python using MCP client
result = await client.call_tool("analyze_code_cli", {
    "code": "function test() { eval('x'); }"
})

# Returns:
{
    "metrics": {"complexity": 1, "lines": 1},
    "issues": [
        {"severity": "high", "message": "Use of eval()"}
    ]
}
```

#### Using HTTP Tool via Bridge

```python
# Multi-operation processing
result = await client.call_tool("process_code", {
    "code": "const x = 1;",
    "operations": ["validate", "analyze", "format"]
})

# Returns combined results from all operations
```

## Integration Examples

### Example 1: Code Review Workflow

```python
from wizelit_sdk.universal_bridge import UniversalMCPBridge

# Initialize bridge
bridge = UniversalMCPBridge("config/bridge-config.yaml")

# Code review workflow
async def review_code(code: str):
    # Step 1: Validate
    validation = await bridge.call_tool("validate_code_cli", {"code": code})
    if not validation["valid"]:
        return {"status": "invalid", "errors": validation["errors"]}

    # Step 2: Analyze
    analysis = await bridge.call_tool("analyze_code_deep", {
        "code": code,
        "deep": True,
        "include_suggestions": True
    })

    # Step 3: Format if needed
    if analysis["metrics"]["complexity"] > 10:
        formatted = await bridge.call_tool("format_code_cli", {"code": code})
        code = formatted["formatted"]

    return {
        "status": "reviewed",
        "analysis": analysis,
        "code": code
    }
```

### Example 2: Batch Processing

```python
async def process_files(files: list):
    results = []

    for file_path in files:
        with open(file_path) as f:
            code = f.read()

        # Use HTTP service for batch processing
        result = await bridge.call_tool("process_code", {
            "code": code,
            "operations": ["validate", "analyze", "format"]
        })

        results.append({
            "file": file_path,
            "result": result
        })

    return results
```

### Example 3: Real-time Code Analysis in IDE

```python
# IDE plugin that analyzes code on save
async def on_file_save(code: str):
    # Quick analysis using CLI tool (fast)
    quick_result = await bridge.call_tool("analyze_code_cli", {
        "code": code
    })

    # Show quick feedback
    show_issues(quick_result["issues"])

    # Deep analysis in background (slower)
    deep_result = await bridge.call_tool("analyze_code_deep", {
        "code": code,
        "deep": True,
        "include_suggestions": True
    })

    # Show suggestions
    show_suggestions(deep_result["suggestions"])
```

### Example 4: CI/CD Integration

```bash
#!/bin/bash
# ci-check.sh - Run code quality checks in CI/CD

# Start HTTP service in background
npm start &
SERVICE_PID=$!

# Wait for service to start
sleep 2

# Analyze all JS files
for file in src/**/*.js; do
  code=$(cat "$file")

  # Call via Universal Bridge
  result=$(wizelit-sdk call-tool analyze_code_deep \
    --input "{\"code\": \"$code\", \"deep\": false}")

  # Check for high severity issues
  high_issues=$(echo "$result" | jq '.summary.high')

  if [ "$high_issues" -gt 0 ]; then
    echo "❌ High severity issues found in $file"
    exit 1
  fi
done

echo "✅ All checks passed"

# Cleanup
kill $SERVICE_PID
```

## Performance Comparison

### CLI Tools (Subprocess Adapter)

- **Startup**: ~50-100ms (Node.js process startup)
- **Execution**: Fast (no network overhead)
- **Best for**: Quick, stateless operations
- **Concurrent**: Each call spawns new process

### HTTP Service (HTTP Adapter)

- **Startup**: One-time service startup
- **Execution**: Network overhead (~5-10ms)
- **Best for**: Complex operations, state sharing
- **Concurrent**: Service handles multiple requests

### When to Use Each

**Use CLI Tools when:**

- Simple, stateless operations
- Don't need shared state
- Fast execution is critical

**Use HTTP Service when:**

- Need caching/state
- Multiple related operations
- Long-running tasks
- Need request queuing

**Use Both (Hybrid) when:**

- Want flexibility
- Different operation types
- Gradual migration

## Troubleshooting

### CLI Tool Issues

```bash
# Check Node.js version
node --version  # Should be >= 16.0.0

# Test tool directly
node tools/analyze-code.js 'test code'

# Check tool output format
node tools/analyze-code.js 'test' | jq .
```

### HTTP Service Issues

```bash
# Check if service is running
curl http://localhost:3000/health

# Check logs
npm start  # See console output

# Test endpoint directly
curl -X POST http://localhost:3000/analyze \
  -H "Content-Type: application/json" \
  -d '{"code":"test"}'
```

### Bridge Configuration Issues

```bash
# Validate YAML syntax
python -c "import yaml; yaml.safe_load(open('config/bridge-config.yaml'))"

# Check bridge can load config
wizelit-sdk run-bridge --config config/bridge-config.yaml --dry-run
```

## Next Steps

1. **Extend Tools**: Add more CLI tools in `tools/`
2. **Add Endpoints**: Extend HTTP service in `services/code-processor/server.js`
3. **Update Config**: Register new tools in `config/bridge-config.yaml`
4. **Test Integration**: Use `test.js` to verify
5. **Deploy**: Follow deployment guide in main README

---

For more information, see:

- [Main README](README.md)
- [Bridge Configuration](config/bridge-config.yaml)
- [Universal Bridge Docs](../wizelit-sdk/examples/NODEJS_INDEX.md)
