'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { CASE_CATEGORY } from '@/lib/contracts';
import { uploadFileToIPFS, uploadJsonToIPFS } from '@/lib/pinata';
import { EMPTY_DIGEST, sha256File, sha256Text, shortAddress } from '@/lib/report-utils';
import { useCreateCase } from '@/hooks/useCaseRegistry';
import type { ReportPayload } from '@/types';

export default function SubmitReport() {
  const { isConnected, address } = useAccount();
  const { createCase, isPending, txHash } = useCreateCase();

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
        severity,
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

      setStatusLine('Submitting the case on-chain...');
      const result = await createCase({
        reportCid,
        reportDigest,
        category,
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
    <div className="min-h-screen relative">
      <header className="border-b border-white/5 glass-strong sticky top-0 z-50 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-xl font-bold gradient-text">
            LeakProof X
          </Link>
          <ConnectButton />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10 relative z-10">
        <div className="mb-8">
          <Link href="/reporter/dashboard" className="text-sm text-gray-400 hover:text-white transition-colors">
            Back to reporter dashboard
          </Link>
          <h1 className="text-4xl font-bold mt-3">Submit a report</h1>
          <p className="text-gray-400 mt-2 max-w-2xl">
            The report body is uploaded to IPFS, hashed in the browser, and the CID plus digest are
            recorded on-chain. You will only see success after the transaction is confirmed.
          </p>
        </div>

        {!isConnected ? (
          <div className="glass rounded-3xl p-8 border border-white/10 text-center">
            <h2 className="text-2xl font-semibold">Connect your wallet to continue</h2>
            <p className="text-gray-400 mt-3">Reporter address is used as the on-chain owner of the case.</p>
          </div>
        ) : null}

        {submittedCaseId ? (
          <div className="glass rounded-3xl p-8 border border-emerald-500/20">
            <div className="text-sm uppercase tracking-[0.25em] text-emerald-300">Confirmed</div>
            <h2 className="text-3xl font-bold mt-3">Case #{submittedCaseId} is live</h2>
            <p className="text-gray-400 mt-3">
              Reporter address: <span className="text-white">{shortAddress(address)}</span>
            </p>
            <div className="mt-6 rounded-2xl bg-slate-950/50 border border-white/10 p-4 text-sm text-gray-400">
              <div>Transaction hash</div>
              <div className="font-mono text-sky-300 break-all mt-2">{submittedHash ?? txHash}</div>
            </div>
            <div className="flex flex-wrap gap-3 mt-6">
              <Link href="/reporter/dashboard" className="px-5 py-3 rounded-2xl bg-gradient-to-r from-sky-500 to-cyan-500 text-white font-semibold">
                View my cases
              </Link>
              <button type="button" onClick={resetForm} className="px-5 py-3 rounded-2xl glass">
                Submit another case
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="glass rounded-3xl p-6 border border-white/10">
              <label className="block text-sm text-gray-400 mb-2">Title</label>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Short summary of the issue"
                className="w-full px-4 py-4 rounded-2xl bg-slate-950/60 border border-white/10 focus:border-sky-500 outline-none"
              />
            </div>

            <div className="glass rounded-3xl p-6 border border-white/10">
              <label className="block text-sm text-gray-400 mb-3">Category</label>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {CASE_CATEGORY.map((label, index) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setCategory(index)}
                    className={`px-4 py-3 rounded-2xl border transition-colors ${category === index ? 'border-sky-500 bg-sky-500/10 text-sky-300' : 'border-white/10 bg-slate-950/40 hover:border-sky-500/40'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="glass rounded-3xl p-6 border border-white/10">
              <label className="block text-sm text-gray-400 mb-2">Description</label>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Describe what happened, who was involved, and why it matters."
                className="w-full min-h-[220px] px-4 py-4 rounded-2xl bg-slate-950/60 border border-white/10 focus:border-sky-500 outline-none resize-none"
              />
            </div>

            <div className="glass rounded-3xl p-6 border border-white/10">
              <label className="block text-sm text-gray-400 mb-3">Severity</label>
              <div className="flex gap-3">
                {[1, 2, 3, 4, 5].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setSeverity(level)}
                    className={`w-12 h-12 rounded-2xl font-semibold border transition-transform ${severity === level ? 'border-sky-500 bg-sky-500/10 text-sky-300 scale-105' : 'border-white/10 bg-slate-950/40'}`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <div className="glass rounded-3xl p-6 border border-white/10">
              <label className="block text-sm text-gray-400 mb-2">Evidence file (optional)</label>
              <input
                type="file"
                onChange={(event) => setEvidenceFile(event.target.files?.[0] ?? null)}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                className="w-full px-4 py-4 rounded-2xl bg-slate-950/60 border border-white/10"
              />
              <p className="text-xs text-gray-500 mt-3">Supported size up to 10MB. CID is stored on-chain as a string.</p>
            </div>

            {statusLine ? (
              <div className="rounded-2xl border border-sky-500/20 bg-sky-500/10 p-4 text-sky-200 text-sm">
                {statusLine}
              </div>
            ) : null}

            {error ? (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-red-300 text-sm">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={!isConnected || isPending}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-sky-500 to-cyan-500 text-white font-semibold disabled:from-gray-600 disabled:to-gray-600"
            >
              {isPending ? 'Waiting for wallet...' : 'Submit report'}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
