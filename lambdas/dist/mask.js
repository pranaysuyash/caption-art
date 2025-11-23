"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const replicate_1 = __importDefault(require("replicate"));
const aws_sdk_1 = require("aws-sdk");
const ssm_1 = require("./utils/ssm");
const s3 = new aws_sdk_1.S3({ region: process.env.AWS_REGION || 'us-east-1' });
async function loadSecrets() {
    const replicateToken = await (0, ssm_1.getParam)(process.env.SSM_REPLICATE_TOKEN_NAME || '/caption-art/REPLICATE_API_TOKEN');
    return { replicateToken };
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
        const { replicateToken } = await loadSecrets();
        const replicate = new replicate_1.default({ auth: replicateToken });
        const output = await replicate.run('cjwbw/rembg:1.4.1', { input: { image: imageUrl } });
        return { statusCode: 200, body: JSON.stringify({ maskPngUrl: output }) };
    }
    catch (e) {
        return { statusCode: 500, body: JSON.stringify({ error: e?.message || 'mask failed' }) };
    }
};
exports.handler = handler;
