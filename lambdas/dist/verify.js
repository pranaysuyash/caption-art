"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const ssm_1 = require("./utils/ssm");
const undici_1 = require("undici");
async function loadSecrets() {
    const [productPermalink, gumroadToken] = await Promise.all([
        (0, ssm_1.getParam)(process.env.SSM_GUMROAD_PERMALINK || '/caption-art/GUMROAD_PRODUCT_PERMALINK', false),
        (0, ssm_1.getParam)(process.env.SSM_GUMROAD_ACCESS || '/caption-art/GUMROAD_ACCESS_TOKEN')
    ]);
    return { productPermalink, gumroadToken };
}
const handler = async (event) => {
    try {
        const body = JSON.parse(event.body || '{}');
        if (!body.licenseKey)
            return { statusCode: 400, body: JSON.stringify({ error: 'licenseKey required' }) };
        const { productPermalink } = await loadSecrets();
        const form = new URLSearchParams();
        form.append('product_permalink', productPermalink);
        form.append('license_key', body.licenseKey);
        const resp = await (0, undici_1.request)('https://api.gumroad.com/v2/licenses/verify', { method: 'POST', body: form });
        const data = await resp.body.json();
        const ok = data?.success && data?.purchase?.refunded === false && data?.purchase?.chargebacked === false;
        return { statusCode: 200, body: JSON.stringify({ ok, raw: data }) };
    }
    catch (e) {
        return { statusCode: 500, body: JSON.stringify({ error: e?.message || 'verify failed' }) };
    }
};
exports.handler = handler;
