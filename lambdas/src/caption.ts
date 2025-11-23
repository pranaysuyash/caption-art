import { APIGatewayProxyHandler } from 'aws-lambda'
import Replicate from 'replicate'
import OpenAI from 'openai'
import { S3 } from 'aws-sdk'
import { getParam } from './utils/ssm'

const s3 = new S3({ region: process.env.AWS_REGION || 'us-east-1' })

async function loadSecrets() {
  const [replicateToken, openaiKey] = await Promise.all([
    getParam(process.env.SSM_REPLICATE_TOKEN_NAME || '/caption-art/REPLICATE_API_TOKEN'),
    getParam(process.env.SSM_OPENAI_KEY_NAME || '/caption-art/OPENAI_API_KEY')
  ])
  return { replicateToken, openaiKey }
}

async function getSignedUrlForS3Object(bucket: string, key: string) {
  return s3.getSignedUrl('getObject', { Bucket: bucket, Key: key, Expires: 60 * 5 })
}

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}') as { s3Key?: string, keywords?: string[] }
    if (!body.s3Key) return { statusCode: 400, body: JSON.stringify({ error: 's3Key required' }) }

    const bucket = process.env.UPLOAD_BUCKET as string
    const imageUrl = await getSignedUrlForS3Object(bucket, body.s3Key)

    const { replicateToken, openaiKey } = await loadSecrets()
    const replicate = new Replicate({ auth: replicateToken })
    const blipOutput = await replicate.run(
      'andreasjansson/blip-image-captioning:3f0e8a3f1f1e8e1f',
      { input: { image: imageUrl } }
    )
    const base = (blipOutput as unknown as string).trim()

    const openai = new OpenAI({ apiKey: openaiKey })
    const prompt = `You are a creative copywriter for image captions. Given a base caption, produce 5 concise, catchy variants for social posts. Keep 4-10 words each. Avoid hashtags, avoid quotes. If keywords are provided, weave 1-2 in naturally. Base: "${base}". Keywords: ${(body.keywords||[]).join(', ')}`
    const res = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.9,
    })
    const text = res.choices[0]?.message?.content || ''
    const variants = text.split(/\n|\r/).map(s => s.replace(/^[-*\d.\s]+/, '').trim()).filter(Boolean).slice(0, 5)

    return { statusCode: 200, body: JSON.stringify({ base, variants }) }
  } catch (e: any) {
    return { statusCode: 500, body: JSON.stringify({ error: e?.message || 'caption failed' }) }
  }
}
