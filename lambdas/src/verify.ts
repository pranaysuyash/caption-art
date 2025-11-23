import { APIGatewayProxyHandler } from 'aws-lambda'
import { getParam } from './utils/ssm'
import { request } from 'undici'

async function loadSecrets() {
  const [productPermalink, gumroadToken] = await Promise.all([
    getParam(process.env.SSM_GUMROAD_PERMALINK || '/caption-art/GUMROAD_PRODUCT_PERMALINK', false),
    getParam(process.env.SSM_GUMROAD_ACCESS || '/caption-art/GUMROAD_ACCESS_TOKEN')
  ])
  return { productPermalink, gumroadToken }
}

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}') as { licenseKey?: string }
    if (!body.licenseKey) return { statusCode: 400, body: JSON.stringify({ error: 'licenseKey required' }) }

    const { productPermalink } = await loadSecrets()

    const form = new URLSearchParams()
    form.append('product_permalink', productPermalink)
    form.append('license_key', body.licenseKey)

    const resp = await request('https://api.gumroad.com/v2/licenses/verify', { method: 'POST', body: form as any })
    const data: any = await resp.body.json()

    const ok = data?.success && data?.purchase?.refunded === false && data?.purchase?.chargebacked === false
    return { statusCode: 200, body: JSON.stringify({ ok, raw: data }) }
  } catch (e: any) {
    return { statusCode: 500, body: JSON.stringify({ error: e?.message || 'verify failed' }) }
  }
}
