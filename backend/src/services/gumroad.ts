import { request } from 'undici'
import { config } from '../config'
import { withRetry } from './replicate'

export interface LicenseVerificationResult {
  valid: boolean
  email?: string
  raw?: any
}

/**
 * Verifies a Gumroad license key
 * @param licenseKey - The license key to verify
 * @returns Verification result with validity status and email if valid
 */
export async function verifyLicense(
  licenseKey: string
): Promise<LicenseVerificationResult> {
  return withRetry(
    async () => {
      const form = new URLSearchParams()
      form.append('product_permalink', config.gumroad.productPermalink)
      form.append('license_key', licenseKey)

      const response = await request(
        'https://api.gumroad.com/v2/licenses/verify',
        {
          method: 'POST',
          body: form.toString(),
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      )

      const data: any = await response.body.json()

      // Check if the license is valid
      // Valid means: success=true, not refunded, not chargebacked
      const isValid =
        data?.success === true &&
        data?.purchase?.refunded === false &&
        data?.purchase?.chargebacked === false

      return {
        valid: isValid,
        email: isValid ? data?.purchase?.email : undefined,
        raw: data,
      }
    },
    {
      maxRetries: 1, // Retry once for Gumroad
      initialDelay: 1000,
      timeout: 30000,
    }
  )
}
