'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { CASE_CATEGORY } from '@/lib/contracts';
import { uploadFileToIPFS, uploadJsonToIPFS } from '@/lib/pinata';
import { EMPTY_DIGEST, sha256File, sha256Text, shortAddress } from '@/lib/report-utils';
import { useCreateCase } from '@/hooks/useCaseRegistry';
import { useCofheClient } from '@/hooks/useCofheClient';
import type { ReportPayload } from '@/types';

const categoryIcons: Record<number, JSX.Element> = {
  0: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  1: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
  2: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" /></svg>,
  3: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
  4: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  5: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>,
  6: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>,
};

export default function SubmitReport() {
  const { isConnected, address } = useAccount();
  const { createCase, isPending, txHash } = useCreateCase();
  const { encryptUint8, isReady: cofheReady } = useCofheClient();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState(3);
  const [category, setCategory] = useState(0);
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [statusLine, setStatusLine] = useState('');
  const [error, setError] = useState('');
  const [submittedCaseId, setSubmittedCaseId] = useState<number | null>(null);
  const [submittedHash, setSubmittedHash] = useState<`0x${string}` | null>(null);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setSeverity(3);
    setCategory(0);
    setEvidenceFile(null);
    setStatusLine('');
    setError('');
    setSubmittedCaseId(null);
    setSubmittedHash(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSubmittedCaseId(null);

    if (!address) {
      setError('Connect your wallet before submitting a report.');
      return;
    }

    if (!title.trim() || !description.trim()) {
      setError('Title and description are required.');
      return;
    }

    if (evidenceFile && evidenceFile.size > 10 * 1024 * 1024) {
      setError('Evidence files must be 10MB or smaller.');
      return;
    }

    try {
      const reportPayload: ReportPayload = {
        title: title.trim(),
        description: description.trim(),
        category,
        createdAt: new Date().toISOString(),
        reporterAddress: address,
        evidenceName: evidenceFile?.name,
      };

      setStatusLine('Uploading report payload to IPFS...');
      const reportCid = await uploadJsonToIPFS(reportPayload);
      const reportDigest = await sha256Text(JSON.stringify(reportPayload));

      let evidenceCid = '';
      let evidenceDigest = EMPTY_DIGEST;

      if (evidenceFile) {
        setStatusLine('Uploading evidence to IPFS...');
        evidenceCid = await uploadFileToIPFS(evidenceFile, evidenceFile.name);
        evidenceDigest = await sha256File(evidenceFile);
      }

      setStatusLine('Encrypting confidential severity with CoFHE...');
      const reporterSeverity = await encryptUint8(severity);

      setStatusLine('Submitting the case on-chain...');
      const result = await createCase({
        reportCid,
        reportDigest,
        category,
        reporterSeverity,
        evidenceCid,
        evidenceDigest,
      });

      setSubmittedCaseId(result.caseId);
      setSubmittedHash(result.hash);
      setStatusLine('Report confirmed on-chain.');
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Unable to submit the report.');
      setStatusLine('');
    }
  };

  return (
    <div className="min-h-screen bg-[#050508]">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/3 w-[700px] h-[700px] bg-gradient-to-br from-blue-600/15 to-purple-600/10 rounded-full blur-[180px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-gradient-to-br from-cyan-600/10 to-emerald-600/10 rounded-full blur-[150px]" />
      </div>

      {/* Navigation */}
      <nav className="navbar-glass fixed top-0 left-0 right-0 z-50 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center">
              <span className="text-xl">🔒</span>
            </div>
            <span className="text-xl font-bold gradient-text">LeakProof</span>
          </Link>
          <ConnectButton />
        </div>
      </nav>

      <main className="relative pt-28 pb-16 px-6 max-w-3xl mx-auto">
        {/* Back Link */}
        <Link href="/reporter/dashboard" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-8">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to dashboard
        </Link>

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="gradient-text">Submit</span> a Report
          </h1>
          <p className="text-gray-400">
            Your report is encrypted and stored securely. Only authorized reviewers can access your submission.
          </p>
        </div>

        {!isConnected ? (
          <div className="glass-card p-12 text-center">
            <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
              <svg className="w-12 h-12 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-3">Connect Your Wallet</h2>
            <p className="text-gray-400 mb-8">Connect your wallet to submit a confidential report.</p>
            <ConnectButton />
          </div>
        ) : submittedCaseId ? (
          <div className="glass-card p-8 text-center">
            <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center glow-blue">
              <svg className="w-12 h-12 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-sm uppercase tracking-widest text-emerald-400 mb-2">Confirmed</div>
            <h2 className="text-4xl font-bold mb-4">Case #{submittedCaseId} is Live</h2>
            <p className="text-gray-400 mb-6">
              Reporter: <span className="text-white font-mono">{shortAddress(address)}</span>
            </p>
            <div className="p-4 rounded-2xl bg-black/30 border border-white/10 text-left mb-8">
              <div className="text-xs text-gray-500 mb-1">Transaction Hash</div>
              <div className="font-mono text-sm text-sky-400 break-all">{submittedHash || txHash}</div>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/reporter/dashboard" className="btn-primary flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                View My Cases
              </Link>
              <button onClick={resetForm} className="btn-secondary flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Submit Another
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div className="glass-card p-6">
              <label className="block text-sm font-medium text-gray-400 mb-3">Report Title</label>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Brief summary of the issue"
                className="input-modern"
                required
              />
            </div>

            {/* Category */}
            <div className="glass-card p-6">
              <label className="block text-sm font-medium text-gray-400 mb-4">Category</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {CASE_CATEGORY.map((label, index) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setCategory(index)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all ${category === index ? 'bg-blue-500/15 border-blue-500/30 text-blue-300' : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'}`}
                  >
                    <span className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                      {categoryIcons[index]}
                    </span>
                    <span className="text-sm font-medium">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="glass-card p-6">
              <label className="block text-sm font-medium text-gray-400 mb-3">Description</label>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Describe what happened, who was involved, and why it matters..."
                className="input-modern min-h-[200px] resize-none"
                required
              />
            </div>

            {/* Severity */}
            <div className="glass-card p-6">
              <label className="block text-sm font-medium text-gray-400 mb-4">Reported Severity</label>
              <div className="flex items-center gap-3">
                {[1, 2, 3, 4, 5].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setSeverity(level)}
                    className={`w-14 h-14 rounded-xl font-semibold text-lg transition-all ${severity === level ? 'bg-gradient-to-br from-blue-500 to-purple-500 text-white shadow-lg shadow-purple-500/25 scale-105' : 'bg-white/5 border border-white/10 text-gray-400 hover:border-white/20'}`}
                  >
                    {level}
                  </button>
                ))}
                <div className="ml-4 text-sm text-gray-500">
                  {severity === 1 && 'Low Impact'}
                  {severity === 2 && 'Minor Issue'}
                  {severity === 3 && 'Moderate'}
                  {severity === 4 && 'High Priority'}
                  {severity === 5 && 'Critical'}
                </div>
              </div>
            </div>

            {/* Evidence */}
            <div className="glass-card p-6">
              <label className="block text-sm font-medium text-gray-400 mb-3">Evidence (Optional)</label>
              <div className="border-2 border-dashed border-white/10 rounded-2xl p-8 text-center hover:border-white/20 transition-colors">
                <input
                  type="file"
                  onChange={(event) => setEvidenceFile(event.target.files?.[0] ?? null)}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                  className="hidden"
                  id="evidence-upload"
                />
                <label htmlFor="evidence-upload" className="cursor-pointer">
                  {evidenceFile ? (
                    <div className="flex items-center justify-center gap-3">
                      <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-emerald-300">{evidenceFile.name}</span>
                    </div>
                  ) : (
                    <>
                      <svg className="w-10 h-10 mx-auto text-gray-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="text-gray-400 mb-1">Drop file here or click to browse</p>
                      <p className="text-xs text-gray-500">PDF, DOC, JPG, PNG up to 10MB</p>
                    </>
                  )}
                </label>
              </div>
            </div>

            {/* Status & Error */}
            {statusLine && (
              <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-300 flex items-center gap-3">
                <div className="w-5 h-5 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                {statusLine}
              </div>
            )}

            {error && (
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 flex items-center gap-3">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!isConnected || isPending || !cofheReady}
              className="btn-primary w-full py-5 text-lg flex items-center justify-center gap-3"
            >
              {isPending ? (
                <>
                  <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Waiting for wallet confirmation...
                </>
              ) : !cofheReady ? (
                <>
                  <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Connecting to encrypted network...
                </>
              ) : (
                <>
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Submit Confidentially
                </>
              )}
            </button>

            {/* Privacy Notice */}
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-white/5 border border-white/10">
              <svg className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <p className="text-sm text-gray-400">
                Your report is encrypted with FHE before reaching the blockchain. Only authorized reviewers can decrypt and view your submission.
              </p>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
