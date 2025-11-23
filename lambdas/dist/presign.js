"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const aws_sdk_1 = require("aws-sdk");
const s3 = new aws_sdk_1.S3({ region: process.env.AWS_REGION || 'us-east-1', signatureVersion: 'v4' });
const handler = async (event) => {
    try {
        const body = JSON.parse(event.body || '{}');
        if (!body.filename || !body.contentType)
            return { statusCode: 400, body: JSON.stringify({ error: 'filename and contentType required' }) };
        const bucket = process.env.UPLOAD_BUCKET;
        const key = `uploads/${Date.now()}-${body.filename}`;
        const url = await s3.getSignedUrlPromise('putObject', {
            Bucket: bucket,
            Key: key,
            ContentType: body.contentType,
            Expires: 60 * 5
        });
        return { statusCode: 200, body: JSON.stringify({ url, key }) };
    }
    catch (e) {
        return { statusCode: 500, body: JSON.stringify({ error: e?.message || 'presign failed' }) };
    }
};
exports.handler = handler;
