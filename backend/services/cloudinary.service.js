

import { v2 as cloudinary } from "cloudinary";

// ─── Configure once at module load ───────────────────────────────────────────
function getConfiguredClient() {
  if (process.env.CLOUDINARY_URL) {
    cloudinary.config({ cloudinary_url: process.env.CLOUDINARY_URL });
  } else {
    const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } =
      process.env;

    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
      throw new Error(
        "[Cloudinary] Missing required environment variables: " +
          "CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET"
      );
    }

    cloudinary.config({
      cloud_name: CLOUDINARY_CLOUD_NAME,
      api_key: CLOUDINARY_API_KEY,
      api_secret: CLOUDINARY_API_SECRET,
    });
  }

  return cloudinary;
}

// ─── Upload invoice PDF ───────────────────────────────────────────────────────
/**
 * Uploads a PDF file to Cloudinary under the "invoices/<ownerId>" folder.
 * Uses `type: 'private'` so downloads are always via a signed URL,
 * bypassing Cloudinary's default block on raw PDF delivery.
 *
 * @param {string} filePath   Absolute path to the local PDF file.
 * @param {string} ownerId    Owner ID used to organise files in Cloudinary.
 * @returns {{ secure_url: string, public_id: string }}
 * @throws {Error} If the upload fails.
 */
export async function uploadInvoicePDF(filePath, ownerId) {
  const client = getConfiguredClient();

  console.log("[Cloudinary] Uploading invoice PDF", { filePath, ownerId });

  const result = await client.uploader.upload(filePath, {
    folder: `invoices/${ownerId}`,
    resource_type: "raw",
    type: "private",          // <-- private: requires signed URL to download
    use_filename: true,
    unique_filename: true,
    overwrite: false,
  });

  if (!result || !result.secure_url) {
    throw new Error("[Cloudinary] Upload succeeded but secure_url is missing");
  }

  console.log("[Cloudinary] Upload successful", {
    public_id: result.public_id,
    secure_url: result.secure_url,
  });

  return {
    secure_url: result.secure_url,
    public_id: result.public_id,
  };
}

// ─── Generate signed download URL ────────────────────────────────────────────
/**
 * Generates a short-lived signed download URL for a private Cloudinary PDF.
 * The URL is valid for `expiresInSeconds` (default 15 minutes) and can be
 * opened directly in a browser to download the PDF.
 *
 * Uses the Cloudinary API download endpoint (not the CDN), so it bypasses
 * the "Prevent delivery of PDF" security restriction entirely.
 *
 * @param {string} publicId          Cloudinary public_id of the PDF.
 * @param {number} expiresInSeconds  Expiry in seconds from now (default 900 = 15 min).
 * @returns {string} Signed download URL.
 */
export function getSignedDownloadUrl(publicId, expiresInSeconds = 900) {
  if (!publicId) {
    throw new Error("[Cloudinary] getSignedDownloadUrl: publicId is required");
  }

  const client = getConfiguredClient();
  const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;

  // private_download_url generates: https://api.cloudinary.com/v1_1/<cloud>/raw/download?...
  // This API endpoint is auth-signed and NOT subject to CDN delivery restrictions.
  const signedUrl = client.utils.private_download_url(publicId, "pdf", {
    resource_type: "raw",
    type: "private",
    expires_at: expiresAt,
  });

  console.log("[Cloudinary] Generated signed download URL", {
    publicId,
    expiresAt: new Date(expiresAt * 1000).toISOString(),
  });

  return signedUrl;
}

// ─── Delete invoice PDF ───────────────────────────────────────────────────────
/**
 * Deletes a private raw PDF from Cloudinary by its public_id.
 * Silently resolves if public_id is falsy (nothing to delete).
 *
 * @param {string} publicId   Cloudinary public_id of the PDF to delete.
 * @returns {void}
 */
export async function deleteInvoicePDF(publicId) {
  if (!publicId) {
    console.warn("[Cloudinary] deleteInvoicePDF called with no publicId – skipping");
    return;
  }

  const client = getConfiguredClient();

  try {
    const result = await client.uploader.destroy(publicId, {
      resource_type: "raw",
      type: "private",        // must match the upload type
    });

    console.log("[Cloudinary] PDF deleted", { publicId, result: result.result });
  } catch (err) {
    // Log but do not re-throw – a failed delete should never block the main flow
    console.error("[Cloudinary] Failed to delete PDF", { publicId, error: err.message });
  }
}
