export interface Config {
  env: string
  port: number
  replicate: {
    apiToken: string
    blipModel: string
    rembgModel: string
  }
  openai: {
    apiKey: string
    model: string
    temperature: number
  }
  gumroad: {
    productPermalink: string
    accessToken?: string
  }
  cors: {
    origin: string | string[]
  }
}

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

export const config: Config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),
  replicate: {
    apiToken: requireEnv('REPLICATE_API_TOKEN'),
    blipModel:
      process.env.REPLICATE_BLIP_MODEL ||
      'salesforce/blip:2e1dddc8621f72155f24cf2e0adbde548458d3cab9f00c0139eea840d0ac4746',
    rembgModel:
      process.env.REPLICATE_REMBG_MODEL ||
      'cjwbw/rembg:fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003',
  },
  openai: {
    apiKey: requireEnv('OPENAI_API_KEY'),
    model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
    temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.8'),
  },
  gumroad: {
    productPermalink: requireEnv('GUMROAD_PRODUCT_PERMALINK'),
    accessToken: process.env.GUMROAD_ACCESS_TOKEN,
  },
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
  },
}
