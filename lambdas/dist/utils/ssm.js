"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getParam = void 0;
const aws_sdk_1 = require("aws-sdk");
const ssm = new aws_sdk_1.SSM({ region: process.env.AWS_REGION || 'us-east-1' });
async function getParam(name, decrypt = true) {
    const res = await ssm.getParameter({ Name: name, WithDecryption: decrypt }).promise();
    const val = res.Parameter?.Value;
    if (!val)
        throw new Error(`Missing SSM param: ${name}`);
    return val;
}
exports.getParam = getParam;
