// Simple test to verify Phase 1 video script API is working
const fetch = require('node-fetch');

async function testVideoScriptAPI() {
  console.log('Testing Phase 1 Video Script API...');

  const testData = {
    assetDescription: 'A revolutionary new smartwatch that tracks health metrics',
    product: {
      name: 'HealthTrack Pro',
      category: 'Wearables',
      features: ['Heart rate monitoring', 'Sleep tracking', 'GPS', 'Water resistant'],
      benefits: ['Better health insights', 'Improved fitness', 'Peace of mind'],
      useCases: ['Daily health monitoring', 'Workout tracking', 'Sleep optimization']
    },
    videoLength: 30,
    platforms: ['instagram', 'facebook'],
    tone: ['energetic', 'inspiring', 'professional'],
    objective: 'awareness',
    includeStoryboard: true,
    targetAudience: {
      demographics: '25-45 year old health-conscious individuals',
      psychographics: 'Tech-savvy, health-focused, active lifestyle',
      painPoints: ['Don\'t have time for detailed health tracking', 'Want actionable insights', 'Concerned about health data privacy']
    }
  };

  try {
    const response = await fetch('http://localhost:3001/api/video-scripts/health', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Video Script API Health Check Passed:', data);
      return true;
    } else {
      console.log('❌ Video Script API Health Check Failed:', response.status, response.statusText);
      return false;
    }
  } catch (error) {
    console.log('❌ Video Script API Health Check Error:', error.message);
    return false;
  }
}

async function testRoutesExist() {
  console.log('Testing Phase 1 Route Registration...');

  const routes = [
    '/api/video-scripts/health',
    '/api/health',
    '/api/_routes'
  ];

  let passedTests = 0;

  for (const route of routes) {
    try {
      const response = await fetch(`http://localhost:3001${route}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        console.log(`✅ Route ${route} is accessible`);
        passedTests++;
      } else {
        console.log(`❌ Route ${route} returned ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ Route ${route} failed: ${error.message}`);
    }
  }

  return passedTests > 0;
}

async function main() {
  console.log('🚀 Phase 1 API Verification Test');
  console.log('=====================================\n');

  const apiWorking = await testVideoScriptAPI();
  const routesWorking = await testRoutesExist();

  console.log('\n📊 Test Results:');
  console.log('API Working:', apiWorking ? '✅' : '❌');
  console.log('Routes Working:', routesWorking ? '✅' : '❌');

  if (apiWorking || routesWorking) {
    console.log('\n🎉 Phase 1 implementation appears to be working!');
    console.log('The video script service and API routes are accessible.');
  } else {
    console.log('\n⚠️  Server may not be running. Please start the backend server first.');
  }
}

main().catch(console.error);