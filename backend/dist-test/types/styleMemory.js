"use strict";
/**
 * V4 Style Memory + Templates System
 *
 * Automatic learning of client visual identity, style profile persistence,
 * template management system, and creative consistency scoring.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.INDUSTRY_TEMPLATES = exports.LEARNING_CONFIG = void 0;
// Learning Configuration
exports.LEARNING_CONFIG = {
    minSampleSize: 10,
    confidenceThreshold: 0.75,
    updateFrequency: 'weekly', // daily, weekly, monthly
    retentionPeriod: 90, // days
    maxProfilesPerBrand: 5,
    templateMatching: {
        maxResults: 10,
        minCompatibilityScore: 0.6,
        weighting: {
            visual: 0.3,
            content: 0.4,
            performance: 0.2,
            platform: 0.1
        }
    },
    consistencyScoring: {
        weights: {
            visual: 0.4,
            content: 0.35,
            platform: 0.25
        },
        thresholds: {
            excellent: 90,
            good: 75,
            fair: 60,
            poor: 40
        }
    }
};
// Industry Templates
exports.INDUSTRY_TEMPLATES = {
    ecommerce: {
        objectives: ['conversion', 'awareness'],
        commonPatterns: ['urgency', 'social-proof', 'scarcity', 'benefit-focused'],
        colorTendencies: ['vibrant', 'high-contrast', 'trust-inducing'],
        ctas: ['Buy Now', 'Shop Today', 'Limited Offer', 'Add to Cart']
    },
    saas: {
        objectives: ['consideration', 'conversion'],
        commonPatterns: ['problem-solution', 'feature-benefit', 'case-study', 'demo-offer'],
        colorTendencies: ['professional', 'tech-forward', 'clean', 'corporate'],
        ctas: ['Start Free Trial', 'Book Demo', 'Learn More', 'Get Started']
    },
    healthcare: {
        objectives: ['awareness', 'consideration'],
        commonPatterns: ['trust-building', 'educational', 'empathy', 'expertise'],
        colorTendencies: ['calming', 'professional', 'medical', 'clean'],
        ctas: ['Book Appointment', 'Learn More', 'Find Provider', 'Contact Us']
    },
    finance: {
        objectives: ['consideration', 'conversion'],
        commonPatterns: ['security', 'growth', 'trust', 'expertise'],
        colorTendencies: ['conservative', 'stable', 'professional', 'corporate'],
        ctas: ['Open Account', 'Learn More', 'Get Started', 'Talk to Advisor']
    }
};
