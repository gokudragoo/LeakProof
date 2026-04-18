'use client';

import { useState } from 'react';
import { CASE_CATEGORY } from '@/lib/contracts';
import { uploadFileToIPFS, uploadJsonToIPFS } from '@/lib/pinata';
import { EMPTY_DIGEST, sha256File, sha256Text } from '@/lib/report-utils';
import { useCreateCase } from '@/hooks/useCaseRegistry';
import type { ReportPayload } from '@/types';

interface EncryptedReportFormProps {
  walletAddress: string;
  onSuccess?: (caseId: number) => void;
}

export default function EncryptedReportForm({ walletAddress, onSuccess }: EncryptedReportFormProps) {
  const { createCase, isPending } = useCreateCase();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState(3);
  const [category, setCategory] = useState(0);
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [status, setStatus] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      const payload: ReportPayload = {
        title,
        description,
        severity,
        category,
        createdAt: new Date().toISOString(),
        reporterAddress: walletAddress,
        evidenceName: evidenceFile?.name,
      };

      setStatus('Uploading report payload...');
      const reportCid = await uploadJsonToIPFS(payload);
      const reportDigest = await sha256Text(JSON.stringify(payload));

      let evidenceCid = '';
      let evidenceDigest = EMPTY_DIGEST;

      if (evidenceFile) {
        setStatus('Uploading evidence...');
        evidenceCid = await uploadFileToIPFS(evidenceFile, evidenceFile.name);
        evidenceDigest = await sha256File(evidenceFile);
      }

      setStatus('Submitting on-chain...');
      const result = await createCase({
        reportCid,
        reportDigest,
        category,
        evidenceCid,
        evidenceDigest,
      });

      setStatus(`Case #${result.caseId} confirmed.`);
      onSuccess?.(result.caseId);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to submit report.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <input
        type="text"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        className="w-full px-4 py-3 rounded-lg bg-dark-700 border border-gray-700 focus:border-primary-500 outline-none"
        placeholder="Report title"
        required
      />

      <select
        value={category}
        onChange={(event) => setCategory(Number(event.target.value))}
        className="w-full px-4 py-3 rounded-lg bg-dark-700 border border-gray-700 focus:border-primary-500 outline-none"
      >
        {CASE_CATEGORY.map((label, index) => (
          <option key={label} value={index}>
            {label}
          </option>
        ))}
      </select>

      <textarea
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        className="w-full px-4 py-3 rounded-lg bg-dark-700 border border-gray-700 focus:border-primary-500 outline-none min-h-[150px]"
        placeholder="Describe the incident"
        required
      />

      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((level) => (
          <button
            key={level}
            type="button"
            onClick={() => setSeverity(level)}
            className={`w-12 h-12 rounded-lg font-semibold ${severity === level ? 'bg-primary-500 text-white' : 'bg-dark-800 border border-gray-700'}`}
          >
            {level}
          </button>
        ))}
      </div>

      <input
        type="file"
        onChange={(event) => setEvidenceFile(event.target.files?.[0] ?? null)}
        className="w-full px-4 py-3 rounded-lg bg-dark-700 border border-gray-700"
      />

      {status ? (
        <div className="p-4 rounded-lg bg-primary-500/20 text-primary-300 text-sm">{status}</div>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="w-full py-4 rounded-lg bg-gradient-to-r from-primary-500 to-cyan-500 hover:from-primary-400 hover:to-cyan-400 disabled:from-gray-600 text-white font-semibold"
      >
        {isPending ? 'Waiting for wallet...' : 'Submit report'}
      </button>
    </form>
  );
}
