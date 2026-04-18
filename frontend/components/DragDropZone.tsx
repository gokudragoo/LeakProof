'use client';

import { useState, useCallback } from 'react';

interface FileWithPreview {
  file: File;
  preview: string;
  progress: number;
  status: 'pending' | 'uploading' | 'done' | 'error';
}

interface DragDropZoneProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  maxSize?: number;
  maxFiles?: number;
}

export default function DragDropZone({
  onFilesSelected,
  accept = '*',
  maxSize = 10 * 1024 * 1024,
  maxFiles = 5,
}: DragDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<FileWithPreview[]>([]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const processFiles = useCallback((fileList: FileList | null) => {
    if (!fileList) return;
    const newFiles: File[] = [];

    Array.from(fileList).forEach((file) => {
      if (files.length + newFiles.length >= maxFiles) return;
      if (file.size > maxSize) {
        alert(`${file.name} exceeds max size of ${maxSize / 1024 / 1024}MB`);
        return;
      }
      newFiles.push(file);
    });

    const filePreviews = newFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      progress: 0,
      status: 'pending' as const,
    }));

    setFiles((prev) => [...prev, ...filePreviews]);
    onFilesSelected(newFiles);
  }, [files.length, maxFiles, maxSize, onFilesSelected]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  }, [processFiles]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(e.target.files);
  }, [processFiles]);

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
  }, []);

  return (
    <div
      className={`
        relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300
        ${isDragging
          ? 'border-sky-400 bg-sky-500/10 scale-[1.02]'
          : 'border-white/10 hover:border-white/30 bg-slate-950/30'
        }
      `}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <input
        type="file"
        multiple
        accept={accept}
        onChange={handleInputChange}
        className="hidden"
        id="drag-drop-input"
      />

      <label
        htmlFor="drag-drop-input"
        className="cursor-pointer block"
      >
        <div className={`mb-4 transition-transform duration-300 ${isDragging ? 'scale-110' : ''}`}>
          <svg
            className={`w-16 h-16 mx-auto transition-colors duration-300 ${
              isDragging ? 'text-sky-400' : 'text-gray-500'
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
        </div>

        <p className="text-gray-400 mb-2">
          {isDragging ? (
            <span className="text-sky-400 font-medium">Drop files here</span>
          ) : (
            'Drag & drop files or click to browse'
          )}
        </p>
        <p className="text-xs text-gray-500">
          Max {maxFiles} files, up to {maxSize / 1024 / 1024}MB each
        </p>
      </label>

      {files.length > 0 && (
        <div className="mt-6 space-y-3">
          {files.map((fileData, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 rounded-2xl bg-slate-950/50 border border-white/10 group"
            >
              <div className="w-10 h-10 rounded-2xl bg-sky-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{fileData.file.name}</p>
                <p className="text-xs text-gray-500">
                  {(fileData.file.size / 1024).toFixed(1)} KB
                </p>
              </div>

              <button
                onClick={() => removeFile(index)}
                className="p-2 rounded-2xl hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
