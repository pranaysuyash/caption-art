// Test script to verify real multi-format implementation
const { MultiFormatService } = require('./dist/services/multiFormatService');
const dotenv = require('dotenv');

dotenv.config();

async function testRealMultiFormat() {
  try {
    console.log('🚀 Testing REAL Multi-Format Image Generation...');

    const service = new MultiFormatService();

    const request = {
      sourceAssetId: 'test-asset-123',
      workspaceId: 'test-workspace-456',
      outputFormats: ['square', 'story'],
      platforms: {
        square: ['instagram'],
        story: ['instagram', 'tiktok']
      },
      synthesisMode: 'balanced'
    };

    console.log('📝 Request:', JSON.stringify(request, null, 2));
    console.log('⏳ Starting real image generation...');

    // Test with a simple request
    const result = await service.generateMultiFormatOutputs(
      request,
      null, // asset
      null, // brandKit
      null, // campaign
      null  // captionVariation
    );

    console.log('✅ REAL MULTI-FORMAT GENERATION SUCCESS!');
    console.log('📊 Results:');
    console.log('- Generated', result.outputs.length, 'format outputs');

    result.outputs.forEach((output, index) => {
      const format = Object.keys(output.formats)[0];
      console.log(`  ${index + 1}. ${format.toUpperCase()}:`, output.formats[format].url);
      console.log(`     Quality Score:`, output.qualityMetrics.overallScore);
      console.log(`     Dimensions:`, output.formats[format].dimensions);
    });

    console.log('🎉 Phase 2.1: REAL Multi-Format Generation - COMPLETED!');

  } catch (error) {
    console.error('❌ Real Multi-Format Generation FAILED:', error.message);

    if (error.message.includes('OPENAI_API_KEY')) {
      console.log('💡 To test with real AI image generation:');
      console.log('   1. Get OpenAI API key: https://platform.openai.com/api-keys');
      console.log('   2. Add to .env file: OPENAI_API_KEY=your_key_here');
      console.log('   3. Ensure you have DALL-E 3 access enabled');
    } else if (error.message.includes('All image generation methods failed')) {
      console.log('💡 Fallback options:');
      console.log('   - Add REPLICATE_API_TOKEN to use Stable Diffusion');
      console.log('   - Check network connection');
    }
  }
}

// Test with environment variables check
console.log('🔍 Environment Check:');
console.log('OPENAI_API_KEY configured:', process.env.OPENAI_API_KEY ? '✅' : '❌');
console.log('REPLICATE_API_TOKEN configured:', process.env.REPLICATE_API_TOKEN ? '✅' : '❌');

if (process.env.OPENAI_API_KEY) {
  console.log('\n🚀 Running test with configured AI services...');
  testRealMultiFormat();
} else {
  console.log('\n⚠️  Skipping test - no API keys configured');
  console.log('   Set OPENAI_API_KEY in .env to test real image generation');
}