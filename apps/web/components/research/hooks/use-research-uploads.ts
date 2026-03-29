"use client";

import { ChangeEvent, DragEvent, useCallback, useState } from "react";
import { mergeUploadedFiles } from "@/components/research/lib/research-page-helpers";
import { UploadedResearchFile, uploadResearchFile } from "@/lib/research";

type UseResearchUploadsOptions = {
  onBeforeUpload?: () => void;
};

export function useResearchUploads(options?: UseResearchUploadsOptions) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedResearchFile[]>([]);
  const [uploadedFileIds, setUploadedFileIds] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [isDragActive, setIsDragActive] = useState(false);

  const onBeforeUpload = options?.onBeforeUpload;

  const uploadFiles = useCallback(
    async (files: File[]) => {
      if (!files.length) return;

      onBeforeUpload?.();
      setUploadError("");
      setIsUploading(true);

      const batchIds: string[] = [];
      const batchFiles: UploadedResearchFile[] = [];
      const failedUploads: string[] = [];

      for (const file of files) {
        try {
          const uploaded = await uploadResearchFile(file);

          if (!uploaded.uploadedFileIds.length) {
            throw new Error("Upload thành công nhưng chưa nhận được uploaded_file_ids.");
          }

          batchIds.push(...uploaded.uploadedFileIds);

          if (uploaded.files.length) {
            batchFiles.push(...uploaded.files);
          } else {
            batchFiles.push(
              ...uploaded.uploadedFileIds.map((id) => ({
                id,
                name: file.name,
                size: file.size
              }))
            );
          }
        } catch (uploadException) {
          const message = uploadException instanceof Error ? uploadException.message : "Upload thất bại.";
          failedUploads.push(`${file.name}: ${message}`);
        }
      }

      if (batchIds.length) {
        setUploadedFileIds((prev) => Array.from(new Set([...prev, ...batchIds])));
        setUploadedFiles((prev) => mergeUploadedFiles(prev, batchFiles));
      }

      if (failedUploads.length) {
        setUploadError(
          failedUploads.length === 1
            ? failedUploads[0]
            : `${failedUploads[0]} (+${failedUploads.length - 1} file lỗi khác)`
        );
      }

      if (!batchIds.length && !failedUploads.length) {
        setUploadError("Không nhận được dữ liệu uploaded_file_ids từ server.");
      }

      setIsUploading(false);
    },
    [onBeforeUpload]
  );

  const onUploadInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files ? Array.from(event.target.files) : [];
      event.currentTarget.value = "";
      void uploadFiles(files);
    },
    [uploadFiles]
  );

  const onDropUpload = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragActive(false);
      const files = Array.from(event.dataTransfer.files ?? []);
      void uploadFiles(files);
    },
    [uploadFiles]
  );

  const onDragOverUpload = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragActive(true);
  }, []);

  const onDragEnterUpload = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragActive(true);
  }, []);

  const onDragLeaveUpload = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!event.currentTarget.contains(event.relatedTarget as Node)) {
      setIsDragActive(false);
    }
  }, []);

  const onRemoveUploadedFile = useCallback((fileId: string) => {
    setUploadedFileIds((prev) => prev.filter((id) => id !== fileId));
    setUploadedFiles((prev) => prev.filter((item) => item.id !== fileId));
    setUploadError("");
  }, []);

  const onClearUploadedFiles = useCallback(() => {
    setUploadedFileIds([]);
    setUploadedFiles([]);
    setUploadError("");
  }, []);

  return {
    uploadedFiles,
    uploadedFileIds,
    isUploading,
    uploadError,
    isDragActive,
    onUploadInputChange,
    onDropUpload,
    onDragOverUpload,
    onDragEnterUpload,
    onDragLeaveUpload,
    onRemoveUploadedFile,
    onClearUploadedFiles
  };
}
