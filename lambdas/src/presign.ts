import { APIGatewayProxyHandler } from 'aws-lambda'
import { S3 } from 'aws-sdk'

const s3 = new S3({ region: process.env.AWS_REGION || 'us-east-1', signatureVersion: 'v4' })

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}') as { filename?: string, contentType?: string }
    if (!body.filename || !body.contentType) return { statusCode: 400, body: JSON.stringify({ error: 'filename and contentType required' }) }

    const bucket = process.env.UPLOAD_BUCKET as string
    const key = `uploads/${Date.now()}-${body.filename}`

    const url = await s3.getSignedUrlPromise('putObject', {
      Bucket: bucket,
      Key: key,
      ContentType: body.contentType,
      Expires: 60 * 5
    })

    return { statusCode: 200, body: JSON.stringify({ url, key }) }
  } catch (e: any) {
    return { statusCode: 500, body: JSON.stringify({ error: e?.message || 'presign failed' }) }
  }
}
