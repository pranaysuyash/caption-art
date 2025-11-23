import { SSM } from 'aws-sdk'

const ssm = new SSM({ region: process.env.AWS_REGION || 'us-east-1' })

export async function getParam(name: string, decrypt = true): Promise<string> {
  const res = await ssm.getParameter({ Name: name, WithDecryption: decrypt }).promise()
  const val = res.Parameter?.Value
  if (!val) throw new Error(`Missing SSM param: ${name}`)
  return val
}
