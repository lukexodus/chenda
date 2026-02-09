/**
 * Phase 7 Test Runner
 * Systematically executes all test files and collects results
 * 
 * Usage: node src/test-runner.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

// Test results tracker
const results = {
  total: 0,
  passed: 0,
  failed: 0,
  duration: 0,
  tests: []
};

/**
 * Find all test files recursively
 */
function findTestFiles(dir) {
  const testFiles = [];
  
  function traverse(currentPath) {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);
      
      if (entry.isDirectory()) {
        traverse(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.test.js')) {
        testFiles.push(fullPath);
      }
    }
  }
  
  traverse(dir);
  return testFiles.sort();
}

/**
 * Execute a single test file
 */
function runTest(testFile) {
  const relativePath = path.relative(process.cwd(), testFile);
  const startTime = Date.now();
  
  console.log(`\n${colors.cyan}${'='.repeat(80)}${colors.reset}`);
  console.log(`${colors.bold}${colors.blue}Testing: ${relativePath}${colors.reset}`);
  console.log(`${colors.cyan}${'='.repeat(80)}${colors.reset}\n`);
  
  try {
    // Execute test file and capture output
    const output = execSync(`node "${testFile}"`, {
      encoding: 'utf8',
      stdio: 'pipe',
      maxBuffer: 10 * 1024 * 1024 // 10MB buffer
    });
    
    const duration = Date.now() - startTime;
    
    // Parse test results from output
    const passedMatch = output.match(/Passed:\s*(\d+)/);
    const failedMatch = output.match(/Failed:\s*(\d+)/);
    const totalMatch = output.match(/Total:\s*(\d+)/);
    
    const passed = passedMatch ? parseInt(passedMatch[1]) : 1;
    const failed = failedMatch ? parseInt(failedMatch[1]) : 0;
    const total = totalMatch ? parseInt(totalMatch[1]) : 1;
    
    // Check for scenarios completed
    const scenarioMatches = output.match(/Completed Scenarios:/);
    const hasScenarios = scenarioMatches !== null;
    
    results.tests.push({
      file: relativePath,
      status: failed === 0 ? 'PASSED' : 'FAILED',
      passed,
      failed,
      total,
      duration,
      hasScenarios
    });
    
    results.total += total;
    results.passed += passed;
    results.failed += failed;
    results.duration += duration;
    
    console.log(output);
    
    if (failed === 0) {
      console.log(`\n${colors.green}${colors.bold}✓ TEST PASSED${colors.reset} (${duration}ms)`);
    } else {
      console.log(`\n${colors.red}${colors.bold}✗ TEST FAILED${colors.reset} (${duration}ms)`);
    }
    
    return failed === 0;
    
  } catch (error) {
    const duration = Date.now() - startTime;
    
    results.tests.push({
      file: relativePath,
      status: 'ERROR',
      passed: 0,
      failed: 1,
      total: 1,
      duration,
      error: error.message
    });
    
    results.total += 1;
    results.failed += 1;
    results.duration += duration;
    
    console.error(`\n${colors.red}${colors.bold}✗ TEST ERROR${colors.reset}`);
    console.error(error.stdout || error.message);
    
    return false;
  }
}

/**
 * Print final summary
 */
function printSummary() {
  console.log(`\n\n${colors.cyan}${'='.repeat(80)}${colors.reset}`);
  console.log(`${colors.bold}${colors.blue}PHASE 7 TESTING & VALIDATION SUMMARY${colors.reset}`);
  console.log(`${colors.cyan}${'='.repeat(80)}${colors.reset}\n`);
  
  // Test file results
  console.log(`${colors.bold}Test File Results:${colors.reset}\n`);
  
  const maxFileLength = Math.max(...results.tests.map(t => t.file.length));
  
  for (const test of results.tests) {
    const statusColor = test.status === 'PASSED' ? colors.green : colors.red;
    const statusSymbol = test.status === 'PASSED' ? '✓' : '✗';
    const padding = ' '.repeat(maxFileLength - test.file.length + 2);
    
    console.log(
      `${statusColor}${statusSymbol}${colors.reset} ${test.file}${padding}` +
      `${test.passed}/${test.total} passed  ${colors.yellow}${test.duration}ms${colors.reset}`
    );
    
    if (test.hasScenarios) {
      console.log(`  ${colors.cyan}└─ Integration scenarios completed${colors.reset}`);
    }
  }
  
  // Overall statistics
  console.log(`\n${colors.bold}Overall Statistics:${colors.reset}\n`);
  
  const passRate = results.total > 0 ? ((results.passed / results.total) * 100).toFixed(1) : 0;
  const avgDuration = results.tests.length > 0 ? (results.duration / results.tests.length).toFixed(1) : 0;
  
  console.log(`  Test Files:      ${results.tests.length}`);
  console.log(`  Total Tests:     ${results.total}`);
  console.log(`  ${colors.green}Passed:          ${results.passed}${colors.reset}`);
  console.log(`  ${colors.red}Failed:          ${results.failed}${colors.reset}`);
  console.log(`  Pass Rate:       ${passRate}%`);
  console.log(`  Total Duration:  ${results.duration}ms`);
  console.log(`  Avg per File:    ${avgDuration}ms`);
  
  // Final verdict
  console.log(`\n${colors.bold}Phase 7 Validation Status:${colors.reset}\n`);
  
  if (results.failed === 0) {
    console.log(`  ${colors.green}${colors.bold}✓ ALL TESTS PASSED${colors.reset}`);
    console.log(`  ${colors.green}✓ Phase 7 Testing & Validation: COMPLETE${colors.reset}`);
  } else {
    console.log(`  ${colors.red}${colors.bold}✗ SOME TESTS FAILED${colors.reset}`);
    console.log(`  ${colors.yellow}⚠ Review failed tests and fix issues${colors.reset}`);
  }
  
  console.log(`\n${colors.cyan}${'='.repeat(80)}${colors.reset}\n`);
}

/**
 * Main execution
 */
function main() {
  console.log(`${colors.bold}${colors.cyan}Phase 7: Testing & Validation${colors.reset}`);
  console.log(`${colors.cyan}Starting comprehensive test suite...${colors.reset}\n`);
  
  const startTime = Date.now();
  const srcDir = path.join(__dirname);
  
  // Find all test files
  const testFiles = findTestFiles(srcDir);
  
  console.log(`${colors.blue}Found ${testFiles.length} test files${colors.reset}\n`);
  
  // Run each test
  for (const testFile of testFiles) {
    runTest(testFile);
  }
  
  // Print summary
  printSummary();
  
  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { findTestFiles, runTest, results };
