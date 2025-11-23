"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const replicate_1 = __importDefault(require("replicate"));
const openai_1 = __importDefault(require("openai"));
const aws_sdk_1 = require("aws-sdk");
const ssm_1 = require("./utils/ssm");
const s3 = new aws_sdk_1.S3({ region: process.env.AWS_REGION || 'us-east-1' });
async function loadSecrets() {
    const [replicateToken, openaiKey] = await Promise.all([
        (0, ssm_1.getParam)(process.env.SSM_REPLICATE_TOKEN_NAME || '/caption-art/REPLICATE_API_TOKEN'),
        (0, ssm_1.getParam)(process.env.SSM_OPENAI_KEY_NAME || '/caption-art/OPENAI_API_KEY')
    ]);
    return { replicateToken, openaiKey };
}
async function getSignedUrlForS3Object(bucket, key) {
    return s3.getSignedUrl('getObject', { Bucket: bucket, Key: key, Expires: 60 * 5 });
}
const handler = async (event) => {
    try {
        const body = JSON.parse(event.body || '{}');
        if (!body.s3Key)
            return { statusCode: 400, body: JSON.stringify({ error: 's3Key required' }) };
        const bucket = process.env.UPLOAD_BUCKET;
        const imageUrl = await getSignedUrlForS3Object(bucket, body.s3Key);
        const { replicateToken, openaiKey } = await loadSecrets();
        const replicate = new replicate_1.default({ auth: replicateToken });
        const blipOutput = await replicate.run('andreasjansson/blip-image-captioning:3f0e8a3f1f1e8e1f', { input: { image: imageUrl } });
        const base = blipOutput.trim();
        const openai = new openai_1.default({ apiKey: openaiKey });
        const prompt = `You are a creative copywriter for image captions. Given a base caption, produce 5 concise, catchy variants for social posts. Keep 4-10 words each. Avoid hashtags, avoid quotes. If keywords are provided, weave 1-2 in naturally. Base: "${base}". Keywords: ${(body.keywords || []).join(', ')}`;
        const res = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.9,
        });
        const text = res.choices[0]?.message?.content || '';
        const variants = text.split(/\n|\r/).map(s => s.replace(/^[-*\d.\s]+/, '').trim()).filter(Boolean).slice(0, 5);
        return { statusCode: 200, body: JSON.stringify({ base, variants }) };
    }
    catch (e) {
        return { statusCode: 500, body: JSON.stringify({ error: e?.message || 'caption failed' }) };
    }
};
exports.handler = handler;
