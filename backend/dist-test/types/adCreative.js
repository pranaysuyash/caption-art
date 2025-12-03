"use strict";
/**
 * V3 Ad Creative System - Slot-based Structure
 *
 * Defines the standardized slot-based format for ad creatives with
 * multiple variations and platform-specific adaptations.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PLATFORM_GUIDELINES = exports.FUNNEL_STAGE_STRATEGIES = exports.SLOT_CONFIGS = void 0;
// Slot Configuration
exports.SLOT_CONFIGS = {
    headline: {
        maxLength: {
            instagram: 30,
            facebook: 50,
            linkedin: 60
        },
        bestPractices: [
            'Keep it short and punchy',
            'Use strong action words',
            'Include value proposition',
            'Ask questions to engage'
        ]
    },
    subheadline: {
        maxLength: {
            instagram: 20,
            facebook: 30,
            linkedin: 40
        },
        bestPractices: [
            'Support the headline',
            'Add specific details',
            'Create curiosity',
            'Mention key benefits'
        ]
    },
    body: {
        maxLength: {
            instagram: 125,
            facebook: 300,
            linkedin: 500
        },
        bestPractices: [
            'Focus on benefits over features',
            'Use social proof',
            'Include specific numbers/results',
            'Address pain points'
        ]
    },
    cta: {
        maxLength: {
            instagram: 20,
            facebook: 25,
            linkedin: 30
        },
        bestPractices: [
            'Use action-oriented language',
            'Create urgency',
            'Be specific about next step',
            'Remove friction'
        ]
    },
    primaryText: {
        maxLength: {
            instagram: 2200,
            facebook: 50000,
            linkedin: 1300
        },
        bestPractices: [
            'Hook in first sentence',
            'Use emojis strategically',
            'Include hashtags',
            'Tag relevant accounts'
        ]
    }
};
// Funnel Stage Strategies
exports.FUNNEL_STAGE_STRATEGIES = {
    top: {
        focus: 'Awareness and education',
        keyElements: ['Problem identification', 'Brand introduction', 'Value proposition'],
        tone: ['Educational', 'Inspirational', 'Curiosity-driven'],
        ctaTypes: ['Learn More', 'Discover', 'Explore']
    },
    middle: {
        focus: 'Consideration and comparison',
        keyElements: ['Solution benefits', 'Social proof', 'Differentiation'],
        tone: ['Informative', 'Persuasive', 'Trust-building'],
        ctaTypes: ['Get Started', 'Try Now', 'Compare']
    },
    bottom: {
        focus: 'Conversion and action',
        keyElements: ['Urgency', 'Specific offer', 'Risk reversal'],
        tone: ['Urgent', 'Direct', 'Confident'],
        ctaTypes: ['Buy Now', 'Sign Up', 'Book Demo']
    }
};
// Platform-specific Guidelines
exports.PLATFORM_GUIDELINES = {
    instagram: {
        characterLimits: { headline: 30, body: 125, cta: 20 },
        visualPriority: 'High',
        bestPractices: [
            'First line is crucial (appears before "See More")',
            'Use emojis strategically',
            'Include relevant hashtags (5-10 max)',
            'Tag accounts and locations'
        ]
    },
    facebook: {
        characterLimits: { headline: 50, body: 300, cta: 25 },
        visualPriority: 'Medium-High',
        bestPractices: [
            'Lead with value proposition',
            'Use link preview effectively',
            'Include social proof',
            'Consider carousel for multiple points'
        ]
    },
    linkedin: {
        characterLimits: { headline: 60, body: 500, cta: 30 },
        visualPriority: 'Medium',
        bestPractices: [
            'Professional tone with personality',
            'Lead with insights or data',
            'Use relevant hashtags (3-5)',
            'Tag companies and individuals'
        ]
    }
};
