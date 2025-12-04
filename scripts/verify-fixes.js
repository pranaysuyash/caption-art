#!/usr/bin/env node

/**
 * Verification script for critical fixes
 * Tests that the API parameter mismatch is resolved
 */

const path = require('path');
const fs = require('fs');

console.log('🔍 Verifying Critical Fixes...\n');

let passed = 0;
let failed = 0;

// Test 1: Check frontend API calls use imageUrl
console.log('Test 1: Frontend API calls use imageUrl parameter');
try {
  const apiFile = fs.readFileSync(
    path.join(__dirname, '../frontend/src/lib/api.ts'),
    'utf8'
  );

  if (
    apiFile.includes('getCaptions') &&
    apiFile.includes('imageUrl') &&
    !apiFile.includes('s3Key,')
  ) {
    console.log('  ✅ PASS: getCaptions uses imageUrl\n');
    passed++;
  } else {
    console.log('  ❌ FAIL: getCaptions still uses s3Key\n');
    failed++;
  }

  if (
    apiFile.includes('getMask') &&
    apiFile.includes('imageUrl') &&
    !apiFile.includes('s3Key }')
  ) {
    console.log('  ✅ PASS: getMask uses imageUrl\n');
    passed++;
  } else {
    console.log('  ❌ FAIL: getMask still uses s3Key\n');
    failed++;
  }
} catch (error) {
  console.log(`  ❌ FAIL: Could not read api.ts - ${error.message}\n`);
  failed += 2;
}

// Test 2: Check backend expects imageUrl
console.log('Test 2: Backend validation schemas expect imageUrl');
try {
  const validationFile = fs.readFileSync(
    path.join(__dirname, '../backend/src/schemas/validation.ts'),
    'utf8'
  );

  if (
    validationFile.includes('CaptionRequestSchema') &&
    validationFile.includes('imageUrl:')
  ) {
    console.log('  ✅ PASS: CaptionRequestSchema uses imageUrl\n');
    passed++;
  } else {
    console.log('  ❌ FAIL: CaptionRequestSchema validation incorrect\n');
    failed++;
  }

  if (
    validationFile.includes('MaskRequestSchema') &&
    validationFile.includes('imageUrl:')
  ) {
    console.log('  ✅ PASS: MaskRequestSchema uses imageUrl\n');
    passed++;
  } else {
    console.log('  ❌ FAIL: MaskRequestSchema validation incorrect\n');
    failed++;
  }
} catch (error) {
  console.log(`  ❌ FAIL: Could not read validation.ts - ${error.message}\n`);
  failed += 2;
}

// Test 3: Check API keys removed from frontend
console.log('Test 3: API keys removed from frontend .env.local');
try {
  const envFile = fs.readFileSync(
    path.join(__dirname, '../frontend/.env.local'),
    'utf8'
  );

  if (
    !envFile.includes('VITE_REPLICATE_API_TOKEN=r8_') &&
    !envFile.includes('VITE_OPENAI_API_KEY=sk-') &&
    !envFile.includes('VITE_FAL_API_KEY=')
  ) {
    console.log('  ✅ PASS: API keys removed from frontend\n');
    passed++;
  } else {
    console.log('  ❌ FAIL: API keys still present in frontend .env.local\n');
    failed++;
  }
} catch (error) {
  console.log(`  ❌ FAIL: Could not read .env.local - ${error.message}\n`);
  failed++;
}

// Test 4: Check ErrorBoundary component exists
console.log('Test 4: ErrorBoundary component created');
try {
  const errorBoundaryExists = fs.existsSync(
    path.join(__dirname, '../frontend/src/components/ErrorBoundary.tsx')
  );

  if (errorBoundaryExists) {
    const errorBoundaryFile = fs.readFileSync(
      path.join(__dirname, '../frontend/src/components/ErrorBoundary.tsx'),
      'utf8'
    );

    if (
      errorBoundaryFile.includes('ErrorBoundary') &&
      errorBoundaryFile.includes('componentDidCatch')
    ) {
      console.log('  ✅ PASS: ErrorBoundary component properly implemented\n');
      passed++;
    } else {
      console.log('  ❌ FAIL: ErrorBoundary missing key methods\n');
      failed++;
    }
  } else {
    console.log('  ❌ FAIL: ErrorBoundary component not found\n');
    failed++;
  }
} catch (error) {
  console.log(`  ❌ FAIL: Could not check ErrorBoundary - ${error.message}\n`);
  failed++;
}

// Test 5: Check App.tsx uses ErrorBoundary
console.log('Test 5: App.tsx wrapped with ErrorBoundary');
try {
  const appFile = fs.readFileSync(
    path.join(__dirname, '../frontend/src/App.tsx'),
    'utf8'
  );

  if (
    appFile.includes('import { ErrorBoundary }') &&
    appFile.includes('<ErrorBoundary>')
  ) {
    console.log('  ✅ PASS: App.tsx uses ErrorBoundary\n');
    passed++;
  } else {
    console.log('  ❌ FAIL: App.tsx does not use ErrorBoundary\n');
    failed++;
  }
} catch (error) {
  console.log(`  ❌ FAIL: Could not read App.tsx - ${error.message}\n`);
  failed++;
}

// Test 6: Check default route improved
console.log(
  'Test 6: Default route redirects to playground for unauthenticated users'
);
try {
  const appFile = fs.readFileSync(
    path.join(__dirname, '../frontend/src/App.tsx'),
    'utf8'
  );

  if (
    appFile.includes('/playground') &&
    appFile.match(
      /isAuthenticated\s*\?\s*['"]\/agency\/workspaces['"]\s*:\s*['"]\/playground['"]/
    )
  ) {
    console.log('  ✅ PASS: Default route redirects to playground\n');
    passed++;
  } else {
    console.log('  ❌ FAIL: Default route does not redirect to playground\n');
    failed++;
  }
} catch (error) {
  console.log(`  ❌ FAIL: Could not verify default route - ${error.message}\n`);
  failed++;
}

// Test 7: Check usePlayground hook updated
console.log('Test 7: usePlayground hook constructs imageUrl');
try {
  const hookFile = fs.readFileSync(
    path.join(__dirname, '../frontend/src/hooks/usePlayground.ts'),
    'utf8'
  );

  if (
    hookFile.includes('setImageUrl') &&
    hookFile.includes('const fullImageUrl')
  ) {
    console.log('  ✅ PASS: usePlayground constructs full imageUrl\n');
    passed++;
  } else {
    console.log('  ❌ FAIL: usePlayground does not construct imageUrl\n');
    failed++;
  }
} catch (error) {
  console.log(
    `  ❌ FAIL: Could not read usePlayground.ts - ${error.message}\n`
  );
  failed++;
}

// Summary
console.log('━'.repeat(50));
console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed\n`);

if (failed === 0) {
  console.log('✅ All critical fixes verified successfully!\n');
  process.exit(0);
} else {
  console.log('❌ Some tests failed. Please review the fixes.\n');
  process.exit(1);
}
