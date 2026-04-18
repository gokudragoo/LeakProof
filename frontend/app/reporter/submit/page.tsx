'use client';

import { useState, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from 'next/link';
import { useCreateCase } from '@/hooks/useCaseRegistry';
import { deriveKeyFromWallet, encryptField } from '@/lib/cofhe';
import { uploadToIPFS } from '@/lib/pinata';
import { CASE_CATEGORY } from '@/lib/contracts';
import DragDropZone from '@/components/DragDropZone';

export default function SubmitReport() {
  const { isConnected, address } = useAccount();
  const { createCase, isPending, isSuccess, txHash } = useCreateCase();

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

  const handleFilesSelected = useCallback((selectedFiles: File[]) => {
    setFiles(selectedFiles);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setUploadProgress('');

    if (!address) {
      setError('Please connect your wallet first');
      return;
    }

    if (!formData.title.trim() || !formData.description.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setCurrentStep(2);
      const key = deriveKeyFromWallet(address, Date.now().toString());
      const encryptedTitle = encryptField(formData.title, key);
      const encryptedDesc = encryptField(formData.description, key);

      let evidenceCID = '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`;

      if (files.length > 0) {
        setUploadProgress('Encrypting and uploading evidence...');
        setIsUploading(true);
        setCurrentStep(3);
        const jwt = process.env.NEXT_PUBLIC_PINATA_JWT || '';
        const cid = await uploadToIPFS(files[0], jwt);
        evidenceCID = cid as `0x${string}`;
        setIsUploading(false);
        setUploadProgress('');
      }

      setCurrentStep(4);
      setUploadProgress('Submitting encrypted report to blockchain...');

      const encryptedTitleBytes = `0x${Buffer.from(encryptedTitle).toString('hex')}` as `0x${string}`;
      const encryptedDescBytes = `0x${Buffer.from(encryptedDesc).toString('hex')}` as `0x${string}`;

      createCase({
        encryptedTitle: encryptedTitleBytes,
        encryptedDescription: encryptedDescBytes,
        encryptedSeverity: BigInt(formData.severity),
        category: BigInt(formData.category),
        evidenceCID: evidenceCID,
      });

      setCaseId(1);
    } catch (err: any) {
      setIsUploading(false);
      setCurrentStep(1);
      setError(`Failed to submit report: ${err.message}`);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen relative">
        <header className="border-b border-white/5 glass-strong sticky top-0 z-50 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-cyan-500 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <span className="text-xl font-bold gradient-text">LeakProof X</span>
            </Link>
            <ConnectButton />
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 py-20 relative z-10">
          <div className="text-center slide-up">
            <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-primary-500/20 to-cyan-500/20 flex items-center justify-center mx-auto mb-8 pulse-glow">
              <svg className="w-16 h-16 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold mb-4">Connect Your Wallet</h1>
            <p className="text-gray-400 mb-8">Connect your wallet to submit a confidential report</p>
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
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <span className="text-xl font-bold gradient-text">LeakProof X</span>
          </Link>
          <ConnectButton />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 relative z-10">
        {caseId || isSuccess ? (
          <div className="text-center py-20 slide-up">
            <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center mx-auto mb-8 pulse-glow">
              <svg className="w-16 h-16 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold mb-4 gradient-text">Report Submitted!</h1>
            <p className="text-gray-400 mb-2">Your encrypted report has been submitted to the blockchain.</p>
            {txHash && (
              <p className="text-sm text-gray-500 mt-2 font-mono">Tx: {txHash?.slice(0, 20)}...</p>
            )}
            <div className="mt-8 flex gap-4 justify-center">
              <Link
                href="/reporter/dashboard"
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-cyan-500 hover:from-primary-400 hover:to-cyan-400 text-white font-semibold transition-all hover-lift"
              >
                View Dashboard
              </Link>
              <button
                onClick={() => { setCaseId(null); setCurrentStep(1); }}
                className="px-6 py-3 rounded-xl glass hover:bg-dark-700 text-white font-medium transition-colors"
              >
                Submit Another
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-8 slide-up">
              <Link href="/reporter/dashboard" className="text-gray-400 hover:text-white flex items-center gap-2 mb-4 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Dashboard
              </Link>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">Submit Confidential Report</h1>
              <p className="text-gray-400">All data is encrypted client-side before being stored on-chain</p>
            </div>

            {/* Progress Steps */}
            <div className="mb-8 slide-up animate-delay-100">
              <div className="flex items-center justify-between mb-4">
                {[
                  { step: 1, label: 'Details' },
                  { step: 2, label: 'Encrypt' },
                  { step: 3, label: 'Upload' },
                  { step: 4, label: 'Submit' },
                ].map((s, i) => (
                  <div key={s.step} className="flex items-center">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-semibold transition-all duration-300 ${
                      currentStep >= s.step
                        ? 'bg-gradient-to-br from-primary-500 to-cyan-500 text-white'
                        : 'bg-dark-700 text-gray-500'
                    }`}>
                      {currentStep > s.step ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : s.step}
                    </div>
                    {i < 3 && (
                      <div className={`w-16 md:w-24 h-1 mx-2 rounded transition-all duration-300 ${
                        currentStep > s.step ? 'bg-primary-500' : 'bg-dark-700'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Enter Details</span>
                <span>Encrypt Data</span>
                <span>Upload Evidence</span>
                <span>Submit Chain</span>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 flex items-center gap-3 slide-up">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
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
              {/* Title */}
              <div className="glass rounded-2xl p-6 slide-up animate-delay-100">
                <label className="block text-sm font-medium mb-3 text-gray-300">Report Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-4 rounded-xl bg-dark-800 border border-gray-700 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-all duration-300"
                  placeholder="Brief title of the incident"
                  required
                />
              </div>

              {/* Category */}
              <div className="glass rounded-2xl p-6 slide-up animate-delay-150">
                <label className="block text-sm font-medium mb-3 text-gray-300">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: parseInt(e.target.value) })}
                  className="w-full px-4 py-4 rounded-xl bg-dark-800 border border-gray-700 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-all duration-300"
                >
                  {Object.entries(CASE_CATEGORY).filter(([k]) => !isNaN(Number(k))).map(([key, label]) => (
                    <option key={key} value={key} className="bg-dark-800">{label as string}</option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div className="glass rounded-2xl p-6 slide-up animate-delay-200">
                <label className="block text-sm font-medium mb-3 text-gray-300">Detailed Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-4 rounded-xl bg-dark-800 border border-gray-700 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-all duration-300 min-h-[200px] resize-none"
                  placeholder="Provide detailed information about the incident..."
                  required
                />
              </div>

              {/* Severity */}
              <div className="glass rounded-2xl p-6 slide-up animate-delay-250">
                <label className="block text-sm font-medium mb-4 text-gray-300">Severity Level (1-5)</label>
                <div className="flex gap-3">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setFormData({ ...formData, severity: level })}
                      className={`w-14 h-14 rounded-xl font-bold transition-all duration-300 hover-lift ${
                        formData.severity === level
                          ? level === 1 ? 'bg-green-500 text-white scale-110' : level === 2 ? 'bg-lime-500 text-white scale-110' : level === 3 ? 'bg-yellow-500 text-black scale-110' : level === 4 ? 'bg-orange-500 text-white scale-110' : 'bg-red-500 text-white scale-110'
                          : 'bg-dark-800 border border-gray-700 hover:border-primary-500'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>Minor</span>
                  <span>Low</span>
                  <span>Medium</span>
                  <span>High</span>
                  <span>Critical</span>
                </div>
              </div>

              {/* Evidence Upload */}
              <div className="glass rounded-2xl p-6 slide-up animate-delay-300">
                <label className="block text-sm font-medium mb-4 text-gray-300">Evidence Files (Optional)</label>
                <DragDropZone
                  onFilesSelected={handleFilesSelected}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                  maxSize={10 * 1024 * 1024}
                  maxFiles={5}
                />
              </div>

              {/* Privacy Notice */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-primary-500/10 to-cyan-500/10 border border-primary-500/20 slide-up animate-delay-350">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary-400 mb-1">Privacy Notice</h3>
                    <p className="text-sm text-gray-400 leading-relaxed">
                      Your report will be encrypted client-side before submission. Only your wallet address will be stored as the reporter identifier. You will receive a case ID to track your report status.
                    </p>
                  </div>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isPending || isUploading}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-primary-500 to-cyan-500 hover:from-primary-400 hover:to-cyan-400 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-semibold transition-all duration-300 hover-lift flex items-center justify-center gap-2 button-glow"
              >
                {isPending ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : isUploading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Uploading Evidence...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Submit Encrypted Report
                  </>
                )}
              </button>
            </form>
          </>
        )}
      </main>
    </div>
  );
}