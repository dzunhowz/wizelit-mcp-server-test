#!/usr/bin/env node

/**
 * Test script for wizelit-mcp-server-test
 * Tests both CLI tools and HTTP service
 */

const { spawn } = require('child_process');
const http = require('http');

// Test data
const TEST_CODE = 'function test() { var x = 1; eval("test"); return x; }';
const FORMATTED_CODE = 'function   badly_formatted(){return 1}';

// Colors for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60));
}

// Test CLI tool
function testCLI(toolName, args) {
  return new Promise((resolve, reject) => {
    log(`\nTesting: ${toolName}`, 'blue');
    
    const proc = spawn('node', [toolName, ...args]);
    let output = '';
    let error = '';
    
    proc.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    proc.stderr.on('data', (data) => {
      error += data.toString();
    });
    
    proc.on('close', (code) => {
      if (code === 0) {
        try {
          const result = JSON.parse(output);
          log('✓ Success', 'green');
          console.log(JSON.stringify(result, null, 2));
          resolve(result);
        } catch (e) {
          log(`✗ Failed to parse output: ${e.message}`, 'red');
          console.log('Raw output:', output);
          reject(e);
        }
      } else {
        log(`✗ Failed with code ${code}`, 'red');
        console.log('Error:', error);
        reject(new Error(error));
      }
    });
  });
}

// Test HTTP endpoint
function testHTTP(endpoint, method, data) {
  return new Promise((resolve, reject) => {
    log(`\nTesting: ${method} ${endpoint}`, 'blue');
    
    const postData = data ? JSON.stringify(data) : '';
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: endpoint,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = http.request(options, (res) => {
      let output = '';
      
      res.on('data', (chunk) => {
        output += chunk.toString();
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(output);
          if (res.statusCode === 200) {
            log('✓ Success', 'green');
            console.log(JSON.stringify(result, null, 2));
            resolve(result);
          } else {
            log(`✗ Failed with status ${res.statusCode}`, 'red');
            console.log(result);
            reject(new Error(`HTTP ${res.statusCode}`));
          }
        } catch (e) {
          log(`✗ Failed to parse response: ${e.message}`, 'red');
          console.log('Raw output:', output);
          reject(e);
        }
      });
    });
    
    req.on('error', (error) => {
      log(`✗ Request failed: ${error.message}`, 'red');
      log('Make sure HTTP service is running: npm start', 'yellow');
      reject(error);
    });
    
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

// Check if HTTP service is running
function checkHTTPService() {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:3000/health', (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => {
      resolve(false);
    });
    req.setTimeout(2000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

// Main test function
async function runTests() {
  log('\n🧪 Wizelit MCP Server Test Suite', 'cyan');
  log('Testing CLI tools and HTTP service\n', 'cyan');
  
  let cliPassed = 0;
  let cliFailed = 0;
  let httpPassed = 0;
  let httpFailed = 0;
  
  // Test CLI Tools
  logSection('📋 Testing CLI Tools (Subprocess Integration)');
  
  const cliTests = [
    ['tools/analyze-code.js', [TEST_CODE]],
    ['tools/format-code.js', [FORMATTED_CODE]],
    ['tools/validate-code.js', [TEST_CODE]]
  ];
  
  for (const [tool, args] of cliTests) {
    try {
      await testCLI(tool, args);
      cliPassed++;
    } catch (error) {
      cliFailed++;
    }
  }
  
  // Test HTTP Service
  logSection('🌐 Testing HTTP Service');
  
  const httpRunning = await checkHTTPService();
  
  if (!httpRunning) {
    log('\n⚠️  HTTP service is not running', 'yellow');
    log('Start it with: npm start', 'yellow');
    log('Skipping HTTP tests\n', 'yellow');
  } else {
    const httpTests = [
      ['/health', 'GET', null],
      ['/process', 'POST', { code: TEST_CODE, operations: ['validate', 'analyze'] }],
      ['/analyze', 'POST', { code: TEST_CODE, deep: false, include_suggestions: true }],
      ['/format', 'POST', { code: FORMATTED_CODE }]
    ];
    
    for (const [endpoint, method, data] of httpTests) {
      try {
        await testHTTP(endpoint, method, data);
        httpPassed++;
      } catch (error) {
        httpFailed++;
      }
    }
  }
  
  // Summary
  logSection('📊 Test Summary');
  
  console.log(`\nCLI Tools (Subprocess):`);
  log(`  ✓ Passed: ${cliPassed}`, cliPassed > 0 ? 'green' : 'reset');
  log(`  ✗ Failed: ${cliFailed}`, cliFailed > 0 ? 'red' : 'reset');
  
  if (httpRunning) {
    console.log(`\nHTTP Service:`);
    log(`  ✓ Passed: ${httpPassed}`, httpPassed > 0 ? 'green' : 'reset');
    log(`  ✗ Failed: ${httpFailed}`, httpFailed > 0 ? 'red' : 'reset');
  }
  
  const totalPassed = cliPassed + httpPassed;
  const totalFailed = cliFailed + httpFailed;
  
  console.log(`\nTotal:`);
  log(`  ✓ Passed: ${totalPassed}`, totalPassed > 0 ? 'green' : 'reset');
  log(`  ✗ Failed: ${totalFailed}`, totalFailed > 0 ? 'red' : 'reset');
  
  console.log('\n' + '='.repeat(60));
  
  if (totalFailed === 0) {
    log('\n✨ All tests passed!', 'green');
  } else {
    log(`\n⚠️  ${totalFailed} test(s) failed`, 'yellow');
  }
  
  console.log();
  
  process.exit(totalFailed > 0 ? 1 : 0);
}

// Run tests
runTests().catch((error) => {
  log(`\n💥 Test suite crashed: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
