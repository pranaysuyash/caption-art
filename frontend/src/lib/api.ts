
const API_BASE_URL = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

/**
 * A generic function to make API calls.
 * @param path The API endpoint path (e.g., '/api/caption').
 * @param body The request body.
 * @returns The JSON response from the API.
 */
export async function callApi<T>(path: string, body: any): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ message: 'API request failed' }));
    throw new Error(errorBody.message || 'API request failed');
  }

  return response.json() as Promise<T>;
}

/**
 * Gets a presigned URL for file uploads.
 * @param filename The name of the file to upload.
 * @param contentType The MIME type of the file.
 * @returns An object containing the presigned URL and the S3 key.
 */
export async function getPresignedUrl(filename: string, contentType:string): Promise<{ url: string; key: string }> {
    return callApi<{url: string, key: string}>('/api/presign', {filename, contentType});
}

/**
 * Verifies a license key.
 * @param licenseKey The license key to verify.
 * @returns An object indicating whether the key is valid.
 */
export async function verifyLicense(licenseKey: string): Promise<{ ok: boolean }> {
    return callApi<{ ok: boolean }>('/api/verify', { licenseKey });
}

/**
 * Gets caption suggestions for an image.
 * @param s3Key The S3 key of the uploaded image.
 * @returns An object containing the base caption and creative variants.
 */
export async function getCaptions(s3Key: string, tone: string): Promise<{ base: string; variants: string[] }> {
    return callApi<{ base: string, variants: string[] }>('/api/caption', { s3Key, tone });
}

/**
 * Gets a mask for an image.
 * @param s3Key The S3 key of the uploaded image.
 * @returns An object containing the URL to the mask image.
 */
export async function getMask(s3Key: string): Promise<{ maskUrl: string }> {
    return callApi<{ maskUrl: string }>('/api/mask', { s3Key });
}
