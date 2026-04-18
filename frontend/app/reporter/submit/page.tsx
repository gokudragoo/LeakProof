'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from 'next/link';
import { useCreateCase } from '@/hooks/useCaseRegistry';
import { deriveKeyFromWallet, encryptField } from '@/lib/cofhe';
import { uploadToIPFS } from '@/lib/pinata';
import { CASE_CATEGORY } from '@/lib/contracts';

export default function SubmitReport() {
  const { isConnected, address } = useAccount();
  const { createCase, isPending, isSuccess, txHash } = useCreateCase();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    severity: '3',
    category: '0',
  });
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [caseId, setCaseId] = useState<number | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setUploadProgress('');

    if (!address) {
      setError('Please connect your wallet first');
      return;
    }

    try {
      const key = deriveKeyFromWallet(address, Date.now().toString());
      const encryptedTitle = encryptField(formData.title, key);
      const encryptedDesc = encryptField(formData.description, key);

      let evidenceCID = '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`;

      if (evidenceFile) {
        setUploadProgress('Encrypting and uploading evidence...');
        setIsUploading(true);
        const jwt = process.env.NEXT_PUBLIC_PINATA_JWT || '';
        const cid = await uploadToIPFS(evidenceFile, jwt);
        evidenceCID = cid as `0x${string}`;
        setIsUploading(false);
        setUploadProgress('Evidence uploaded successfully');
      }

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
    } catch (err: any) {
      setIsUploading(false);
      setError(`Failed to submit report: ${err.message}`);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-dark-900">
        <header className="border-b border-gray-800 bg-dark-800/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <Link href="/" className="flex items-center gap-2">
              <svg className="w-8 h-8 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="text-xl font-bold gradient-text">LeakProof X</span>
            </Link>
            <ConnectButton />
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 py-20">
          <div className="text-center">
            <div className="w-24 h-24 rounded-full bg-primary-500/20 flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-4">Connect Your Wallet</h1>
            <p className="text-gray-400 mb-6">Connect your wallet to submit a confidential report</p>
            <ConnectButton />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900">
      <header className="border-b border-gray-800 bg-dark-800/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/reporter/dashboard" className="flex items-center gap-2">
            <svg className="w-8 h-8 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span className="text-xl font-bold gradient-text">LeakProof X</span>
          </Link>
          <ConnectButton />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {caseId || isSuccess ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold mb-4 gradient-text">Report Submitted Successfully!</h1>
            <p className="text-gray-400 mb-2">Your encrypted report has been submitted to the blockchain.</p>
            {txHash && (
              <p className="text-sm text-gray-500 mt-2">
                Transaction: {txHash}
              </p>
            )}
            <div className="mt-8 flex gap-4 justify-center">
              <Link
                href="/reporter/dashboard"
                className="px-6 py-3 rounded-lg bg-primary-500 hover:bg-primary-600 text-white font-medium transition-colors"
              >
                View Dashboard
              </Link>
              <button
                onClick={() => setCaseId(null)}
                className="px-6 py-3 rounded-lg bg-dark-700 hover:bg-dark-600 text-white font-medium transition-colors"
              >
                Submit Another
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <Link href="/reporter/dashboard" className="text-gray-400 hover:text-white flex items-center gap-2 mb-4">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Dashboard
              </Link>
              <h1 className="text-3xl font-bold mb-2">Submit Confidential Report</h1>
              <p className="text-gray-400">All data is encrypted client-side before being stored on-chain</p>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400">
                {error}
              </div>
            )}

            {uploadProgress && (
              <div className="mb-6 p-4 rounded-lg bg-primary-500/20 border border-primary-500/30 text-primary-400">
                {uploadProgress}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Report Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg bg-dark-700 border border-gray-700 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-colors"
                  placeholder="Brief title of the incident"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg bg-dark-700 border border-gray-700 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-colors"
                >
                  {Object.entries(CASE_CATEGORY).filter(([k]) => !isNaN(Number(k))).map(([key, label]) => (
                    <option key={key} value={key}>{label as string}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Detailed Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg bg-dark-700 border border-gray-700 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-colors min-h-[200px]"
                  placeholder="Provide detailed information about the incident..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Severity Level (1-5)</label>
                <div className="flex gap-4">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setFormData({ ...formData, severity: level.toString() })}
                      className={`w-12 h-12 rounded-lg font-semibold transition-colors ${
                        formData.severity === level.toString()
                          ? level <= 2 ? 'bg-green-500 text-white' : level <= 3 ? 'bg-yellow-500 text-black' : 'bg-red-500 text-white'
                          : 'bg-dark-700 border border-gray-700 hover:border-primary-500'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  1 = Minor, 2 = Low, 3 = Medium, 4 = High, 5 = Critical
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Evidence Files (Optional)</label>
                <div className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center hover:border-primary-500 transition-colors">
                  <input
                    type="file"
                    onChange={(e) => setEvidenceFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="evidence-upload"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                  <label htmlFor="evidence-upload" className="cursor-pointer">
                    <svg className="w-12 h-12 mx-auto mb-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-gray-400">
                      {evidenceFile ? evidenceFile.name : 'Click to upload evidence files'}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">PDF, DOC, JPG, PNG up to 10MB</p>
                  </label>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-primary-500/10 border border-primary-500/20">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-primary-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <p className="text-sm text-gray-400">
                    <strong className="text-primary-400">Privacy Notice:</strong> Your report will be encrypted client-side before submission. Only your wallet address will be stored as the reporter identifier.
                  </p>
                </div>
              </div>

              <button
                type="submit"
                disabled={isPending || isUploading}
                className="w-full py-4 rounded-lg bg-primary-500 hover:bg-primary-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold transition-colors"
              >
                {isPending ? 'Submitting...' : isUploading ? 'Uploading Evidence...' : 'Submit Encrypted Report'}
              </button>
            </form>
          </>
        )}
      </main>
    </div>
  );
}