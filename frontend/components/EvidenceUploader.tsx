'use client';

import { useState, useRef } from 'react';
import { uploadToIPFS } from '@/lib/pinata';

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setCid(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setUploadStatus('Encrypting and uploading evidence...');

    try {
      const jwt = process.env.NEXT_PUBLIC_PINATA_JWT || '';
      const result = await uploadToIPFS(file, jwt);

      setCid(result);
      setUploadStatus('Evidence uploaded successfully!');
      onUploadComplete?.(result);
    } catch (err: any) {
      setUploadStatus(`Upload failed: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center hover:border-primary-500/50 transition-colors cursor-pointer"
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          className="hidden"
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
        />

        {file ? (
          <div className="flex items-center justify-center gap-3">
            <svg className="w-8 h-8 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <div className="text-left">
              <div className="font-medium">{file.name}</div>
              <div className="text-sm text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
            </div>
          </div>
        ) : (
          <>
            <svg className="w-12 h-12 mx-auto mb-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-gray-400">Click or drag files to upload</p>
            <p className="text-xs text-gray-500 mt-2">PDF, DOC, JPG, PNG, TXT up to 10MB</p>
          </>
        )}
      </div>

      {file && (
        <button
          onClick={handleUpload}
          disabled={isUploading}
          className="w-full py-3 rounded-lg bg-primary-500 hover:bg-primary-600 disabled:bg-gray-600 text-white font-medium transition-colors"
        >
          {isUploading ? 'Uploading...' : 'Upload to IPFS'}
        </button>
      )}

      {uploadStatus && (
        <div className={`p-3 rounded-lg text-sm ${cid ? 'bg-emerald-500/20 text-emerald-400' : 'bg-primary-500/20 text-primary-400'}`}>
          {uploadStatus}
        </div>
      )}

      {cid && (
        <div className="p-3 rounded-lg bg-dark-700 border border-gray-700">
          <div className="text-xs text-gray-400 mb-1">IPFS CID</div>
          <div className="font-mono text-sm break-all">{cid}</div>
        </div>
      )}
    </div>
  );
}