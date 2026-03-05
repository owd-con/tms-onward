import { createCrudHook, useNoopLazyQuery } from "../hooks/createCrudHook";
import { useGetPresignedURLMutation } from "./api";

/**
 * TMS Driver - Upload Hook
 *
 * Upload hook using presigned URL pattern:
 * 1. Request presigned URL from backend
 * 2. Upload file directly to S3 using the presigned URL
 * 3. Return the final file URL
 */
export const useUpload = createCrudHook({
  useLazyGetQuery: useNoopLazyQuery,
  entityName: "upload",
  customOperations: {
    getPresignedURL: {
      hook: useGetPresignedURLMutation,
      errorMessage: "Failed to get presigned URL",
      requiresId: false,
    },
  },
});

/**
 * Upload file directly to S3 using presigned URL
 * @param presignedUrl - The presigned URL from backend
 * @param file - The file to upload
 * @returns The final file URL after upload
 */
export async function uploadFileToS3(
  presignedUrl: string,
  file: File,
): Promise<string> {
  const response = await fetch(presignedUrl, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": file.type,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to upload file: ${response.statusText}`);
  }

  // Extract file URL from presigned URL (remove query params)
  const url = new URL(presignedUrl);
  return url.origin + url.pathname;
}
