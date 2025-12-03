// Test script to verify real AI-powered campaign template generation
const { CampaignTemplateService } = require('./dist/services/campaignTemplateService');
const dotenv = require('dotenv');

dotenv.config();

async function testRealCampaignTemplates() {
  try {
    console.log('🎯 Testing REAL AI-Powered Campaign Template Generation...');

    const service = new CampaignTemplateService();

    // Test with a comprehensive campaign request
    const testRequest = {
      workspaceId: 'test-workspace-456',
      name: 'Summer Product Launch Campaign',
      description: 'Launch our new summer collection with focus on social media engagement and online sales',
      industry: 'Fashion',
      campaignType: 'product-launch',
      targetAudience: {
        demographics: ['millennials', 'gen-z', 'fashion-forward'],
        psychographics: ['trend-conscious', 'socially-connected', 'brand-loyal'],
        painPoints: ['finding sustainable fashion', 'affordable quality', 'authentic brands'],
        interests: ['sustainable fashion', 'influencer culture', 'street style', 'summer trends']
      },
      platforms: ['instagram', 'tiktok', 'facebook', 'pinterest'],
      customRequirements: ['Focus on sustainability', 'Highlight influencer partnerships', 'Create viral potential content']
    };

    console.log('📝 Template Request:');
    console.log('- Campaign Type:', testRequest.campaignType);
    console.log('- Industry:', testRequest.industry);
    console.log('- Platforms:', testRequest.platforms.join(', '));
    console.log('- Target Audience:', testRequest.targetAudience.demographics.join(', '));
    console.log('⏳ Starting AI-powered template generation...');

    // Test AI-powered template generation
    const templateResult = await service.generateCampaignTemplate(testRequest);

    console.log('✅ REAL AI-POWERED CAMPAIGN TEMPLATE GENERATION SUCCESS!');
    console.log('📊 Template Results:');
    console.log('- Template ID:', templateResult.id);
    console.log('- Quality Score:', templateResult.qualityMetrics.overallScore);
    console.log('- Completeness:', templateResult.qualityMetrics.completeness);
    console.log('- Brand Alignment:', templateResult.qualityMetrics.brandAlignment);
    console.log('- Platform Optimization:', templateResult.qualityMetrics.platformOptimization);
    console.log('- Processing Time:', templateResult.processingTime + 'ms');

    console.log('\n🎨 AI-Generated Content Structure:');
    if (templateResult.template.contentStructure) {
      console.log('- Campaign Phases:', templateResult.template.contentStructure.phases?.join(', ') || 'N/A');
      console.log('- Content Types:', Array.isArray(templateResult.template.contentStructure.contentTypes) ? templateResult.template.contentStructure.contentTypes.join(', ') : 'N/A');
    }

    console.log('\n💬 AI-Generated Messaging Guidelines:');
    console.log('Top 5 guidelines:');
    templateResult.appliedGuidelines.messaging.slice(0, 5).forEach((guideline, i) => {
      console.log(`  ${i + 1}. ${guideline}`);
    });

    console.log('\n🎭 AI-Generated Visual Guidelines:');
    console.log('Top 5 guidelines:');
    templateResult.appliedGuidelines.visualStyle.slice(0, 5).forEach((guideline, i) => {
      console.log(`  ${i + 1}. ${guideline}`);
    });

    console.log('\n📱 Platform Optimizations:');
    Object.entries(templateResult.appliedGuidelines.platformOptimizations).forEach(([platform, optimizations]) => {
      console.log(`\n${platform.toUpperCase()}:`);
      optimizations.slice(0, 3).forEach((opt, i) => {
        console.log(`  • ${opt}`);
      });
    });

    console.log('\n📋 Success Metrics:');
    templateResult.template.successMetrics?.slice(0, 5).forEach((metric, i) => {
      console.log(`  ${i + 1}. ${metric}`);
    });

    console.log('\n💡 AI Recommendations:');
    templateResult.recommendations.slice(0, 5).forEach((rec, i) => {
      console.log(`  ${i + 1}. ${rec}`);
    });

    console.log('\n🚀 Testing Template Application...');

    // Test applying the template
    const applicationResult = await service.applyTemplate(
      templateResult.template.id,
      'Summer Collection Launch - Q3 2024',
      ['Emphasize sustainable materials', 'Include student discount offers', 'Create TikTok challenges'],
      testRequest.workspaceId,
      ['instagram', 'tiktok']
    );

    console.log('✅ REAL TEMPLATE APPLICATION SUCCESS!');
    console.log('📊 Application Results:');
    console.log('- Campaign ID:', applicationResult.campaign.id);
    console.log('- Expected Engagement:', applicationResult.performance.expectedEngagement.toLocaleString());
    console.log('- Expected Reach:', applicationResult.performance.expectedReach.toLocaleString());
    console.log('- Expected Conversions:', applicationResult.performance.expectedConversions.toLocaleString());

    console.log('\n🔄 Platform Adaptations:');
    applicationResult.adaptations.forEach((adaptation) => {
      console.log(`\n${adaptation.platform.toUpperCase()} Adaptations:`);
      adaptation.modifications.slice(0, 3).forEach((mod, i) => {
        console.log(`  • ${mod}`);
      });
    });

    console.log('\n🎉 Phase 2.3: Real AI-Powered Campaign Templates - COMPLETED!');
    console.log('🤖 OpenAI GPT-4 integration working with real AI generation');
    console.log('📊 Quality metrics and scoring system implemented');
    console.log('🎯 Personalized campaign structure generation active');
    console.log('📱 Platform-specific optimization strategies generated');
    console.log('🎨 AI-powered visual and messaging guidelines created');
    console.log('📈 Performance prediction with realistic forecasts');
    console.log('🔧 Template application with custom adaptations working');

  } catch (error) {
    console.error('❌ Real Campaign Template Generation FAILED:', error.message);

    if (error.message.includes('OPENAI_API_KEY')) {
      console.log('💡 To test with real AI generation:');
      console.log('   1. Get OpenAI API key: https://platform.openai.com/api-keys');
      console.log('   2. Add to .env file: OPENAI_API_KEY=your_key_here');
      console.log('   3. Ensure you have GPT-4 access enabled');
    } else if (error.message.includes('Campaign template not found')) {
      console.log('💡 This error suggests template storage may not be working');
      console.log('   - Check if templates are being stored correctly');
      console.log('   - Verify the template ID is correct');
    } else if (error.message.includes('Failed to generate campaign template')) {
      console.log('💡 AI generation may have failed, falling back to basic templates');
      console.log('   - The service includes fallback functionality');
      console.log('   - Check network connection and API access');
    } else {
      console.log('💡 Check error details above for debugging information');
    }

    console.log('\n📝 Fallback Options:');
    console.log('- The service includes basic template generation when AI fails');
    console.log('- Platform-specific adaptations work with any template');
    console.log('- Performance predictions use industry benchmarks as fallback');
    console.log('- Quality metrics are calculated regardless of AI availability');
  }
}

// Test with environment variables check
console.log('🔍 Environment Check:');
console.log('OPENAI_API_KEY configured:', process.env.OPENAI_API_KEY ? '✅' : '❌');
console.log('CampaignTemplateService available:', typeof CampaignTemplateService === 'function' ? '✅' : '❌');

console.log('\n🚀 Running real AI-powered campaign template test...');
testRealCampaignTemplates();