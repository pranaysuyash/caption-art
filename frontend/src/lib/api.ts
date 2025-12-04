import apiFetch from './api/httpClient';

/**
 * A generic function to make API calls.
 * @param path The API endpoint path (e.g., '/api/caption').
 * @param body The request body.
 * @returns The JSON response from the API.
 */
export async function callApi<T>(path: string, body: any): Promise<T> {
  const response = await apiFetch(path, {
    method: 'POST',
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response
      .json()
      .catch(() => ({ message: 'API request failed' }));
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
export async function getPresignedUrl(
  filename: string,
  contentType: string
): Promise<{ url: string; key: string }> {
  return callApi<{ url: string; key: string }>('/api/presign', {
    filename,
    contentType,
  });
}

/**
 * Verifies a license key.
 * @param licenseKey The license key to verify.
 * @returns An object indicating whether the key is valid.
 */
export async function verifyLicense(
  licenseKey: string
): Promise<{ ok: boolean }> {
  return callApi<{ ok: boolean }>('/api/verify', { licenseKey });
}

/**
 * Gets caption suggestions for an image.
 * @param imageUrl The image URL (S3 URL, data URI, or HTTP(S) URL).
 * @param tone The tone/style for caption generation.
 * @returns An object containing the base caption and creative variants.
 */
export async function getCaptions(
  imageUrl: string,
  tone: string
): Promise<{ baseCaption: string; variants: string[] }> {
  return callApi<{ baseCaption: string; variants: string[] }>('/api/caption', {
    imageUrl,
    tone,
  });
}

/**
 * Gets a mask for an image.
 * @param imageUrl The image URL (S3 URL, data URI, or HTTP(S) URL).
 * @returns An object containing the URL to the mask image.
 */
export async function getMask(imageUrl: string): Promise<{ maskUrl: string }> {
  return callApi<{ maskUrl: string }>('/api/mask', { imageUrl });
}
