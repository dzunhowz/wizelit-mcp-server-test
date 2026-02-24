# Wizelit MCP Server Test

A test project demonstrating Node.js integration with the Wizelit platform using the Universal MCP Bridge. This project showcases both **subprocess (CLI)** and **HTTP service** integration patterns.

## 🎯 Overview

This project provides JavaScript code processing tools that can be invoked through the Universal MCP Bridge:

- **Code Analysis**: Security scanning, quality checks, complexity metrics
- **Code Formatting**: Prettier-based code formatting
- **Code Validation**: Syntax checking and structure validation
- **Batch Processing**: Multi-operation code processing via HTTP

## 📋 Prerequisites

- Node.js >= 16.0.0
- Python >= 3.9 (for wizelit-sdk)
- wizelit-sdk with Universal Bridge support

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Start HTTP Service (Optional)

```bash
npm start
# Service will run on http://localhost:3000
```

### 3. Test CLI Tools Directly

```bash
# Analyze code
node tools/analyze-code.js 'function test() { eval("x"); }'

# Format code
node tools/format-code.js 'function   test(){return 1}'

# Validate code
node tools/validate-code.js 'function test() { return 1; }'
```

### 4. Run via Universal Bridge

```bash
# From wizelit-sdk directory
wizelit-sdk run-bridge --config ../wizelit-mcp-server-test/config/bridge-config.yaml
```

## 📁 Project Structure

```
wizelit-mcp-server-test/
├── config/
│   └── bridge-config.yaml      # Universal Bridge configuration
├── tools/                       # CLI tools (subprocess integration)
│   ├── analyze-code.js         # Code analyzer
│   ├── format-code.js          # Code formatter
│   └── validate-code.js        # Code validator
├── services/                    # HTTP services
│   └── code-processor/
│       └── server.js           # Express HTTP service
├── package.json
└── README.md
```

## 🛠️ Available Tools

### CLI Tools (Subprocess Adapter)

#### 1. `analyze_code_cli`
Analyzes JavaScript code for issues and metrics.

**Input:**
```json
{
  "code": "function test() { eval('x'); }"
}
```

**Output:**
```json
{
  "metrics": { "lines": 1, "complexity": 1 },
  "issues": [
    { "severity": "high", "message": "Use of eval()", "category": "security" }
  ],
  "summary": { "total_issues": 1, "high": 1, "medium": 0, "low": 0 }
}
```

#### 2. `format_code_cli`
Formats JavaScript code using Prettier.

**Input:**
```json
{
  "code": "function   test(){return 1}",
  "options": { "tabWidth": 2, "semi": true }
}
```

**Output:**
```json
{
  "original": "function   test(){return 1}",
  "formatted": "function test() {\n  return 1;\n}\n",
  "changed": true,
  "stats": { "before_lines": 1, "after_lines": 3, "changes": 1 }
}
```

#### 3. `validate_code_cli`
Validates JavaScript code syntax.

**Input:**
```json
{
  "code": "function test() { return 1; }",
  "strict": false
}
```

**Output:**
```json
{
  "valid": true,
  "errors": [],
  "warnings": [],
  "summary": { "total_issues": 0 }
}
```

### HTTP Tools (HTTP Adapter)

#### 4. `process_code`
Processes code with multiple operations.

**Endpoint:** `POST http://localhost:3000/process`

**Input:**
```json
{
  "code": "function test() { return 1; }",
  "operations": ["validate", "analyze"]
}
```

#### 5. `analyze_code_deep`
Deep code analysis with suggestions.

**Endpoint:** `POST http://localhost:3000/analyze`

**Input:**
```json
{
  "code": "function complex() { ... }",
  "deep": true,
  "include_suggestions": true
}
```

#### 6. `format_code_http`
Format code via HTTP service.

**Endpoint:** `POST http://localhost:3000/format`

#### 7. `health_check`
Check service health status.

**Endpoint:** `GET http://localhost:3000/health`

## 🧪 Testing

### Test CLI Tools

```bash
# Test analyzer
npm run test:analyze

# Test formatter
npm run test:format

# Test validator
npm run test:validate
```

### Test HTTP Service

```bash
# Start service
npm start

# In another terminal, test endpoints
curl -X POST http://localhost:3000/process \
  -H "Content-Type: application/json" \
  -d '{"code":"function test(){return 1}","operations":["validate","analyze"]}'

curl http://localhost:3000/health
```

### Test via Universal Bridge

```bash
# Start HTTP service first
npm start

# In another terminal, run bridge
cd ../wizelit-sdk
wizelit-sdk run-bridge --config ../wizelit-mcp-server-test/config/bridge-config.yaml

# The bridge will expose all tools via MCP protocol
```

## 📝 Configuration

Edit `config/bridge-config.yaml` to:

- Add/remove tools
- Change adapter types (subprocess ↔ HTTP)
- Adjust timeouts
- Configure HTTP endpoints
- Set MCP server options

### Example: Adding a New CLI Tool

```yaml
tools:
  - name: "my_new_tool"
    description: "My new Node.js tool"
    adapter_type: "subprocess"
    config:
      command: ["node", "tools/my-tool.js"]
      timeout: 30
    input_schema:
      type: "object"
      properties:
        input:
          type: "string"
      required: ["input"]
```

### Example: Adding a New HTTP Endpoint

```yaml
tools:
  - name: "my_http_tool"
    description: "My HTTP-based tool"
    adapter_type: "http"
    config:
      url: "http://localhost:3000/my-endpoint"
      method: "POST"
      timeout: 60
    input_schema:
      type: "object"
      properties:
        data:
          type: "string"
      required: ["data"]
```

## 🔍 Integration Patterns

### Pattern 1: Simple CLI Tool (Recommended for Quick Tools)

**Use when:**
- Simple, stateless operations
- No shared state needed
- Fast execution (< 30s)

**Example:** Code validation, formatting

### Pattern 2: HTTP Service (Recommended for Complex Operations)

**Use when:**
- Long-running operations
- Shared state/caching needed
- Multiple related endpoints
- Need streaming responses

**Example:** Deep analysis, batch processing

### Pattern 3: Hybrid (Best for Complete Solutions)

**Use both:**
- CLI tools for quick operations
- HTTP service for complex operations
- Bridge coordinates both seamlessly

**This project demonstrates the hybrid pattern!**

## 🐛 Troubleshooting

### CLI Tools Not Working

```bash
# Check Node.js version
node --version  # Should be >= 16.0.0

# Test tool directly
node tools/analyze-code.js 'function test() {}'

# Check permissions (macOS/Linux)
chmod +x tools/*.js
```

### HTTP Service Not Starting

```bash
# Check if port 3000 is in use
lsof -i :3000

# Use different port
PORT=3001 npm start
```

### Bridge Not Finding Tools

```bash
# Check config path
wizelit-sdk run-bridge --config $(pwd)/config/bridge-config.yaml

# Verify config syntax
python -c "import yaml; yaml.safe_load(open('config/bridge-config.yaml'))"
```

## 📚 Documentation

- [Universal Bridge Documentation](../wizelit-sdk/examples/NODEJS_INDEX.md)
- [Node.js Quick Start](../wizelit-sdk/examples/NODEJS_QUICKSTART.md)
- [Architecture Guide](../wizelit-sdk/examples/ARCHITECTURE.md)

## 🤝 Contributing

This is a test project demonstrating integration patterns. Feel free to:

1. Add new tools in `tools/`
2. Add new endpoints in `services/code-processor/server.js`
3. Update `config/bridge-config.yaml` to register new tools
4. Test thoroughly before deploying

## 📄 License

Same as parent wizelit-sdk project.

## 🔗 Related Projects

- [wizelit-sdk](../wizelit-sdk) - Main Python SDK with Universal Bridge
- [wizelit](../wizelit) - Wizelit platform
- [wizelit-mcp-server-samples](../wizelit-mcp-server-samples) - More MCP server examples

---

**Built with ❤️ for the Wizelit platform**
