'use client';

import { useState, useRef } from 'react';
import { uploadFileToIPFS } from '@/lib/pinata';

interface EvidenceUploaderProps {
  walletAddress: string;
  onUploadComplete?: (cid: string) => void;
}

export default function EvidenceUploader({ walletAddress, onUploadComplete }: EvidenceUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [cid, setCid] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async () => {
    if (!file) {
      return;
    }

    setIsUploading(true);
    setUploadStatus(`Uploading from ${walletAddress.slice(0, 6)}...`);

    try {
      const result = await uploadFileToIPFS(file, file.name);
      setCid(result);
      setUploadStatus('Evidence uploaded successfully.');
      onUploadComplete?.(result);
    } catch (error) {
      setUploadStatus(error instanceof Error ? error.message : 'Upload failed.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-white/10 rounded-2xl p-8 text-center hover:border-sky-500/50 transition-colors cursor-pointer"
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          className="hidden"
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
        />

        <p className="text-gray-400">
          {file ? `${file.name} selected` : 'Click or drag files to upload'}
        </p>
      </div>

      {file ? (
        <button
          type="button"
          onClick={handleUpload}
          disabled={isUploading}
          className="w-full py-3 rounded-2xl bg-sky-500 hover:bg-sky-600 disabled:bg-gray-600 text-white font-medium transition-colors"
        >
          {isUploading ? 'Uploading...' : 'Upload to IPFS'}
        </button>
      ) : null}

      {uploadStatus ? (
        <div className="p-3 rounded-2xl bg-sky-500/20 text-sky-300 text-sm">{uploadStatus}</div>
      ) : null}

      {cid ? (
        <div className="p-3 rounded-2xl bg-slate-950/50 border border-white/10">
          <div className="text-xs text-gray-400 mb-1">IPFS CID</div>
          <div className="font-mono text-sm break-all">{cid}</div>
        </div>
      ) : null}
    </div>
  );
}
