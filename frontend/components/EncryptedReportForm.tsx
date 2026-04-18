'use client';

import { useState } from 'react';
import { useCreateCase } from '@/hooks/useCaseRegistry';
import { deriveKeyFromWallet, bytesToHex } from '@/lib/cofhe';
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const caseKeyId = Date.now().toString();
      const key = await deriveKeyFromWallet(walletAddress, caseKeyId);

      const encrypt = async (text: string) => {
        const encrypted = await import('@/lib/cofhe').then(m => m.encryptField(text, key));
        return `0x${bytesToHex(encrypted)}` as `0x${string}`;
      };

      setStatus('Encrypting report data...');
      const [encryptedTitle, encryptedDesc] = await Promise.all([
        encrypt(formData.title),
        encrypt(formData.description),
      ]);

      let evidenceCID = '0x0000000000000000000000000000000000000000000000000000000000000000';
      if (evidenceFile) {
        setStatus('Encrypting and uploading evidence...');
        const jwt = process.env.NEXT_PUBLIC_PINATA_JWT || '';
        const key2 = await deriveKeyFromWallet(walletAddress, caseKeyId + 'evidence');
        const encrypted = await import('@/lib/cofhe').then(m => m.encryptBytes(
          new Uint8Array(await evidenceFile.arrayBuffer()),
          key2
        ));
        const blob = new Blob([encrypted], { type: 'application/octet-stream' });
        const encryptedFile = new File([blob], evidenceFile.name + '.enc', { type: 'application/octet-stream' });
        evidenceCID = await uploadToIPFS(encryptedFile, jwt);
      }

      setStatus('Submitting encrypted report to blockchain...');

      createCase({
        encryptedTitle,
        encryptedDescription: encryptedDesc,
        encryptedSeverity: BigInt(formData.severity),
        category: BigInt(formData.category),
        evidenceCID: evidenceCID as `0x${string}`,
      });

      setCaseId(Date.now() % 10000);
      setStatus('Report submitted! Waiting for confirmation...');
      onSuccess?.(caseId ?? 0);
    } catch (err: any) {
      setStatus(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">Report Title</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full px-4 py-3 rounded-lg bg-dark-700 border border-gray-700 focus:border-primary-500 outline-none"
          placeholder="Brief title for your report"
          required
        />
        <p className="text-xs text-gray-500 mt-1">This will be AES-256 encrypted before storage</p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Category</label>
        <select
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: parseInt(e.target.value) })}
          className="w-full px-4 py-3 rounded-lg bg-dark-700 border border-gray-700 focus:border-primary-500 outline-none"
        >
          {Object.entries(CASE_CATEGORY).filter(([k]) => !isNaN(Number(k))).map(([key, label]) => (
            <option key={key} value={key}>{String(label)}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Encrypted Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-4 py-3 rounded-lg bg-dark-700 border border-gray-700 focus:border-primary-500 outline-none min-h-[150px]"
          placeholder="Provide detailed information about the incident..."
          required
        />
        <p className="text-xs text-gray-500 mt-1">End-to-end encrypted with your wallet key</p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Severity Level (1-5)</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setFormData({ ...formData, severity: level })}
              className={`w-12 h-12 rounded-lg font-semibold transition-all ${
                formData.severity === level
                  ? level <= 2 ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
                    : level <= 3 ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/30'
                    : 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                  : 'bg-dark-800 border border-gray-700 hover:border-gray-600'
              }`}
            >
              {level}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {formData.severity <= 2 ? 'Low impact' : formData.severity <= 3 ? 'Medium impact' : 'High impact'}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Evidence Files (Optional)</label>
        <input
          type="file"
          onChange={(e) => setEvidenceFile(e.target.files?.[0] || null)}
          className="w-full px-4 py-3 rounded-lg bg-dark-700 border border-gray-700 file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:bg-primary-500/20 file:text-primary-400 file:font-medium"
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
        />
        <p className="text-xs text-gray-500 mt-1">Files will be AES-256 encrypted before IPFS upload</p>
      </div>

      {status && (
        <div className={`p-4 rounded-lg text-sm flex items-center gap-3 ${
          isSuccess ? 'bg-emerald-500/20 text-emerald-400' : 'bg-primary-500/20 text-primary-400'
        }`}>
          <div className={`w-4 h-4 rounded-full ${
            isSuccess ? 'bg-emerald-400' : 'bg-primary-400 animate-pulse'
          }`} />
          {status}
        </div>
      )}

      {txHash && (
        <div className="p-4 rounded-lg bg-dark-700 border border-gray-700">
          <div className="text-xs text-gray-400 mb-1">Transaction Hash</div>
          <div className="font-mono text-xs break-all text-primary-400">{txHash}</div>
        </div>
      )}

      <button
        type="submit"
        disabled={isPending || isSubmitting || !formData.title || !formData.description}
        className="w-full py-4 rounded-lg bg-gradient-to-r from-primary-500 to-cyan-500 hover:from-primary-400 hover:to-cyan-400 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-semibold transition-all shadow-lg shadow-primary-500/20"
      >
        {isPending ? (
          <span className="flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Encrypting & Submitting...
          </span>
        ) : (
          'Submit Encrypted Report'
        )}
      </button>
    </form>
  );
}
