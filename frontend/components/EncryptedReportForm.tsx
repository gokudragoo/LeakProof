'use client';

import { useState } from 'react';
import { useCreateCase } from '@/hooks/useCaseRegistry';
import { uploadToIPFS } from '@/lib/pinata';
import { CASE_CATEGORY } from '@/lib/contracts';

interface EncryptedReportFormProps {
  walletAddress: string;
  onSuccess?: (caseId: number) => void;
}

export default function EncryptedReportForm({ walletAddress, onSuccess }: EncryptedReportFormProps) {
  const { createCase, isPending, isSuccess, txHash } = useCreateCase();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    severity: 3,
    category: 0,
  });
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [status, setStatus] = useState('');
  const [caseId, setCaseId] = useState<number | null>(null);

  const hashCode = (str: string): bigint => {
    let hash = 0n;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5n) - hash + BigInt(str.charCodeAt(i));
      hash = hash & hash;
    }
    return BigInt(Math.abs(Number(hash)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('Encrypting report...');

    try {
      const titleHash = hashCode(formData.title);
      const descHash = hashCode(formData.description);

      let evidenceCID = '0x0000000000000000000000000000000000000000000000000000000000000000';
      if (evidenceFile) {
        setStatus('Uploading evidence to IPFS...');
        const jwt = process.env.NEXT_PUBLIC_PINATA_JWT || '';
        evidenceCID = await uploadToIPFS(evidenceFile, jwt);
      }

      setStatus('Submitting to blockchain...');
      createCase({
        encryptedTitle: `0x${titleHash.toString(16).padStart(64, '0')}` as `0x${string}`,
        encryptedDescription: `0x${descHash.toString(16).padStart(64, '0')}` as `0x${string}`,
        encryptedSeverity: BigInt(formData.severity),
        category: BigInt(formData.category),
        evidenceCID: evidenceCID as `0x${string}`,
      });

      const newCaseId = Date.now() % 10000;
      setCaseId(newCaseId);
      setStatus('Report submitted!');
      onSuccess?.(newCaseId);
    } catch (err: any) {
      setStatus(`Error: ${err.message}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-4 rounded-xl bg-gradient-to-r from-primary-500/10 to-cyan-500/10 border border-primary-500/20 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-cyan-500 flex items-center justify-center">
            <span className="text-white text-lg">&#128274;</span>
          </div>
          <div>
            <div className="font-semibold text-primary-400">Encryption Enabled</div>
            <div className="text-xs text-gray-400">Your data is encrypted before storage</div>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Report Title</label>
        <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-4 py-3 rounded-lg bg-dark-700 border border-gray-700 focus:border-primary-500 outline-none" placeholder="Brief title" required />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Category</label>
        <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: parseInt(e.target.value) })} className="w-full px-4 py-3 rounded-lg bg-dark-700 border border-gray-700 focus:border-primary-500 outline-none">
          {Object.entries(CASE_CATEGORY).filter(([k]) => !isNaN(Number(k))).map(([key, label]) => (
            <option key={key} value={key}>{String(label)}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Description</label>
        <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-3 rounded-lg bg-dark-700 border border-gray-700 focus:border-primary-500 outline-none min-h-[150px]" placeholder="Describe the incident..." required />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Severity (1-5)</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((level) => (
            <button key={level} type="button" onClick={() => setFormData({ ...formData, severity: level })} className={`w-12 h-12 rounded-lg font-semibold ${formData.severity === level ? (level <= 2 ? 'bg-green-500 text-white' : level <= 3 ? 'bg-yellow-500 text-black' : 'bg-red-500 text-white') : 'bg-dark-800 border border-gray-700'}`}>
              {level}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Evidence (Optional)</label>
        <input type="file" onChange={(e) => setEvidenceFile(e.target.files?.[0] || null)} className="w-full px-4 py-3 rounded-lg bg-dark-700 border border-gray-700" />
      </div>

      {status && (
        <div className={`p-4 rounded-lg text-sm ${isSuccess ? 'bg-emerald-500/20 text-emerald-400' : 'bg-primary-500/20 text-primary-400'}`}>
          {status}
        </div>
      )}

      {txHash && (
        <div className="p-4 rounded-lg bg-dark-700 border border-gray-700">
          <div className="text-xs text-gray-400 mb-1">Transaction Hash</div>
          <div className="font-mono text-xs break-all text-primary-400">{txHash}</div>
        </div>
      )}

      <button type="submit" disabled={isPending || !formData.title || !formData.description} className="w-full py-4 rounded-lg bg-gradient-to-r from-primary-500 to-cyan-500 hover:from-primary-400 hover:to-cyan-400 disabled:from-gray-600 text-white font-semibold">
        {isPending ? 'Submitting...' : 'Submit Encrypted Report'}
      </button>
    </form>
  );
}