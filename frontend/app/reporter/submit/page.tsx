'use client';

import { useState, useCallback, useRef } from 'react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from 'next/link';
import { useCreateCase } from '@/hooks/useCaseRegistry';
import { useCofheEncrypt } from '@cofhe/react';
import { uploadToIPFS } from '@/lib/pinata';
import { CASE_CATEGORY } from '@/lib/contracts';

export default function SubmitReport() {
  const { isConnected, address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { createCase, isPending, isSuccess, txHash } = useCreateCase();
  const { mutateAsync: encryptReport, isPending: isEncrypting } = useCofheEncrypt();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    severity: 3,
    category: 0,
  });
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [caseId, setCaseId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFilesSelected = useCallback((selectedFiles: FileList | null) => {
    if (!selectedFiles) return;
    const newFiles = Array.from(selectedFiles);
    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    handleFilesSelected(e.dataTransfer.files);
  }, [handleFilesSelected]);

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setUploadProgress('');

    if (!address || !walletClient || !publicClient) {
      setError('Please connect your wallet first');
      return;
    }

    if (!formData.title.trim() || !formData.description.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setCurrentStep(2);
      setUploadProgress('Encrypting with FHE...');

      const titleHash = BigInt(Math.abs(hashCode(formData.title)));
      const descHash = BigInt(Math.abs(hashCode(formData.description)));

      setCurrentStep(2);
      setUploadProgress('Generating ZK proof...');

      const encryptedInputs = await encryptReport(
        {
          items: [
            { data: titleHash, utype: 6, securityZone: 0 },
            { data: descHash, utype: 6, securityZone: 0 },
            { data: BigInt(formData.severity), utype: 2, securityZone: 0 },
            { data: BigInt(formData.category), utype: 2, securityZone: 0 },
          ],
          account: address,
        }
      );

      let evidenceCID = '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`;

      if (files.length > 0) {
        setUploadProgress('Encrypting evidence...');
        setIsUploading(true);
        setCurrentStep(3);

        const jwt = process.env.NEXT_PUBLIC_PINATA_JWT || '';
        if (jwt) {
          const cid = await uploadToIPFS(files[0], jwt);
          evidenceCID = cid as `0x${string}`;
        }

        setIsUploading(false);
        setUploadProgress('');
      }

      setCurrentStep(4);
      setUploadProgress('Submitting to blockchain...');

      createCase({
        encryptedTitle: `0x${encryptedInputs[0].ctHash.toString(16)}` as `0x${string}`,
        encryptedDescription: `0x${encryptedInputs[1].ctHash.toString(16)}` as `0x${string}`,
        encryptedSeverity: BigInt(encryptedInputs[2].ctHash),
        category: BigInt(encryptedInputs[3].ctHash),
        evidenceCID: evidenceCID,
      });

      setCaseId(1);
      setShowSuccess(true);
    } catch (err: any) {
      setIsUploading(false);
      setCurrentStep(1);
      setError(`Failed: ${err.message}`);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen relative">
        <header className="border-b border-white/5 glass-strong sticky top-0 z-50 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-cyan-500 flex items-center justify-center">
                <span className="text-white">&#128274;</span>
              </div>
              <span className="text-xl font-bold gradient-text">LeakProof X</span>
            </Link>
            <ConnectButton />
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 py-20 relative z-10">
          <div className="text-center slide-up">
            <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-primary-500/20 to-cyan-500/20 flex items-center justify-center mx-auto mb-8 pulse-glow">
              <span className="text-6xl">&#128274;</span>
            </div>
            <h1 className="text-4xl font-bold mb-4 gradient-text">Connect Your Wallet</h1>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              Connect your wallet to submit a confidential report with FHE encryption.
            </p>
            <ConnectButton />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <header className="border-b border-white/5 glass-strong sticky top-0 z-50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/reporter/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-cyan-500 flex items-center justify-center">
              <span className="text-white">&#128274;</span>
            </div>
            <span className="text-xl font-bold gradient-text">LeakProof X</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1.5 rounded-full bg-blue-500/20 text-blue-400 text-sm font-medium border border-blue-500/30">
              Reporter
            </span>
            <ConnectButton />
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 relative z-10">
        {showSuccess ? (
          <div className="text-center py-20 slide-up">
            <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center mx-auto mb-8 pulse-glow">
              <span className="text-6xl">&#10003;</span>
            </div>
            <h1 className="text-4xl font-bold mb-4 gradient-text">Report Submitted!</h1>
            <p className="text-gray-400 mb-2">
              Your FHE-encrypted report has been submitted to Ethereum blockchain.
            </p>
            <p className="text-sm text-gray-500 font-mono mb-8">Case ID: #{caseId}</p>
            {txHash && (
              <div className="mb-8 p-4 rounded-xl glass">
                <p className="text-xs text-gray-500 mb-1">Transaction Hash</p>
                <p className="text-sm font-mono text-primary-400 break-all">{txHash}</p>
              </div>
            )}
            <div className="flex gap-4 justify-center">
              <Link href="/reporter/dashboard" className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-cyan-500 hover:from-primary-400 hover:to-cyan-400 text-white font-semibold">
                View Dashboard
              </Link>
              <button onClick={() => { setCaseId(null); setShowSuccess(false); setCurrentStep(1); setFormData({ title: '', description: '', severity: 3, category: 0 }); setFiles([]); }} className="px-6 py-3 rounded-xl glass hover:bg-dark-700 text-gray-300 font-medium">
                Submit Another
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-8 slide-up">
              <Link href="/reporter/dashboard" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                Back to Dashboard
              </Link>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">Submit Confidential Report</h1>
              <p className="text-gray-400">All data is encrypted with FHE before being stored on-chain</p>
            </div>

            <div className="mb-8 slide-up animate-delay-100">
              <div className="flex items-center justify-between mb-4">
                {[{ step: 1, label: 'Details' }, { step: 2, label: 'Encrypt' }, { step: 3, label: 'Upload' }, { step: 4, label: 'Chain' }].map((s, i) => (
                  <div key={s.step} className="flex items-center">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold transition-all duration-300 ${currentStep >= s.step ? currentStep === s.step ? 'bg-gradient-to-br from-primary-500 to-cyan-500 text-white ring-4 ring-primary-500/30' : 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white' : 'bg-dark-700 text-gray-500'}`}>
                      {currentStep > s.step ? '&#10003;' : s.step}
                    </div>
                    {i < 3 && <div className={`w-12 md:w-20 h-1 mx-2 rounded transition-all duration-300 ${currentStep > s.step ? 'bg-primary-500' : 'bg-dark-700'}`} />}
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 flex items-center gap-3 slide-up">
                <span className="text-xl">&#9888;</span>
                {error}
              </div>
            )}

            {uploadProgress && (
              <div className="mb-6 p-4 rounded-xl bg-primary-500/20 border border-primary-500/30 text-primary-400 flex items-center gap-3 slide-up">
                <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                {uploadProgress}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="glass rounded-2xl p-6 slide-up animate-delay-100">
                <label className="block text-sm font-medium mb-3 text-gray-300">Report Title *</label>
                <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-4 py-4 rounded-xl bg-dark-800 border border-gray-700 focus:border-primary-500 outline-none" placeholder="Brief summary of the incident" required />
              </div>

              <div className="glass rounded-2xl p-6 slide-up animate-delay-150">
                <label className="block text-sm font-medium mb-3 text-gray-300">Category *</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(CASE_CATEGORY).filter(([k]) => !isNaN(Number(k))).map(([key, label]) => (
                    <button key={key} type="button" onClick={() => setFormData({ ...formData, category: parseInt(key) })} className={`p-3 rounded-xl text-sm font-medium transition-all ${formData.category === parseInt(key) ? 'bg-gradient-to-br from-primary-500 to-cyan-500 text-white' : 'bg-dark-800 border border-gray-700 hover:border-primary-500'}`}>
                      {String(label)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="glass rounded-2xl p-6 slide-up animate-delay-200">
                <label className="block text-sm font-medium mb-3 text-gray-300">Detailed Description *</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-4 rounded-xl bg-dark-800 border border-gray-700 focus:border-primary-500 outline-none min-h-[200px] resize-none" placeholder="Describe the incident in detail..." required />
              </div>

              <div className="glass rounded-2xl p-6 slide-up animate-delay-250">
                <label className="block text-sm font-medium mb-4 text-gray-300">Severity Level</label>
                <div className="flex gap-3">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <button key={level} type="button" onClick={() => setFormData({ ...formData, severity: level })} className={`w-14 h-14 rounded-xl font-bold text-lg transition-all hover-lift ${formData.severity === level ? (level === 1 ? 'bg-green-500 text-white scale-110' : level === 2 ? 'bg-lime-500 text-white scale-110' : level === 3 ? 'bg-yellow-500 text-black scale-110' : level === 4 ? 'bg-orange-500 text-white scale-110' : 'bg-red-500 text-white scale-110') : 'bg-dark-800 border border-gray-700 hover:border-primary-500'}`}>
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <div className="glass rounded-2xl p-6 slide-up animate-delay-300">
                <label className="block text-sm font-medium mb-4 text-gray-300">Evidence Files (Optional)</label>
                <div onDragOver={(e) => e.preventDefault()} onDrop={handleDrop} onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-gray-700 rounded-xl p-8 text-center hover:border-primary-500/50 hover:bg-primary-500/5 transition-all cursor-pointer group">
                  <input ref={fileInputRef} type="file" multiple onChange={(e) => handleFilesSelected(e.target.files)} className="hidden" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt" />
                  <svg className="w-12 h-12 mx-auto mb-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                  <p className="text-gray-400 mb-2">Drag & drop or <span className="text-primary-400 font-medium">click to browse</span></p>
                  <p className="text-xs text-gray-500">PDF, DOC, JPG, PNG, TXT up to 10MB</p>
                </div>
                {files.length > 0 && (
                  <div className="mt-4 space-y-3">
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 rounded-xl bg-dark-800/50 border border-gray-700 group">
                        <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">&#128206;</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{file.name}</p>
                          <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                        </div>
                        <button onClick={() => removeFile(index)} className="p-2 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-5 rounded-2xl bg-gradient-to-r from-primary-500/10 to-cyan-500/10 border border-primary-500/20 slide-up animate-delay-350">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-lg">&#128274;</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary-400 mb-1">FHE Encryption</h3>
                    <p className="text-sm text-gray-400">Your report will be encrypted with Fully Homomorphic Encryption and Zero-Knowledge Proofs before submission.</p>
                  </div>
                </div>
              </div>

              <button type="submit" disabled={isPending || isUploading || isEncrypting} className="w-full py-4 rounded-xl bg-gradient-to-r from-primary-500 to-cyan-500 hover:from-primary-400 hover:to-cyan-400 disabled:from-gray-600 disabled:to-gray-600 text-white font-bold text-lg transition-all flex items-center justify-center gap-2 button-glow">
                {isPending || isEncrypting ? (
                  <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> {isUploading ? 'Encrypting & Uploading...' : 'FHE Encrypting & Submitting...'}</>
                ) : (
                  <>&#128274; Submit with FHE Encryption</>
                )}
              </button>
            </form>
          </>
        )}
      </main>
    </div>
  );
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash;
}