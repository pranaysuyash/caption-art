import { APIGatewayProxyHandler } from 'aws-lambda'
import Replicate from 'replicate'
import { S3 } from 'aws-sdk'
import { getParam } from './utils/ssm'

const s3 = new S3({ region: process.env.AWS_REGION || 'us-east-1' })

async function loadSecrets() {
  const replicateToken = await getParam(process.env.SSM_REPLICATE_TOKEN_NAME || '/caption-art/REPLICATE_API_TOKEN')
  return { replicateToken }
}

async function getSignedUrlForS3Object(bucket: string, key: string) {
  return s3.getSignedUrl('getObject', { Bucket: bucket, Key: key, Expires: 60 * 5 })
}

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}') as { s3Key?: string }
    if (!body.s3Key) return { statusCode: 400, body: JSON.stringify({ error: 's3Key required' }) }

    const bucket = process.env.UPLOAD_BUCKET as string
    const imageUrl = await getSignedUrlForS3Object(bucket, body.s3Key)

    const { replicateToken } = await loadSecrets()
    const replicate = new Replicate({ auth: replicateToken })

    const output = await replicate.run(
      'cjwbw/rembg:1.4.1',
      { input: { image: imageUrl } }
    )

    return { statusCode: 200, body: JSON.stringify({ maskPngUrl: output }) }
  } catch (e: any) {
    return { statusCode: 500, body: JSON.stringify({ error: e?.message || 'mask failed' }) }
  }
}
