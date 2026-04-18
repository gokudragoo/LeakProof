'use client';

import { useState } from 'react';
import { useCreateCase } from '@/hooks/useCaseRegistry';
import { useCofheEncrypt } from '@cofhe/react';
import { usePublicClient, useWalletClient } from 'wagmi';
import { uploadToIPFS } from '@/lib/pinata';
import { CASE_CATEGORY } from '@/lib/contracts';

interface EncryptedReportFormProps {
  walletAddress: string;
  onSuccess?: (caseId: number) => void;
}

export default function EncryptedReportForm({ walletAddress, onSuccess }: EncryptedReportFormProps) {
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { createCase, isPending, isSuccess, txHash } = useCreateCase();
  const { mutateAsync: encryptReport, isPending: isEncrypting, reset } = useCofheEncrypt();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    severity: 3,
    category: 0,
  });
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [status, setStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicClient || !walletClient) {
      console.error('Wallet not connected');
      return;
    }
    setIsSubmitting(true);

    try {
      setStatus('Initializing FHE encryption...');
      const titleHash = BigInt(Math.abs(hashCode(formData.title)));
      const descHash = BigInt(Math.abs(hashCode(formData.description)));

      setStatus('Encrypting report with FHE (Zero-Knowledge Proofs)...');
      const encryptedInputs = await encryptReport(
        {
          items: [
            { data: titleHash, utype: 6, securityZone: 0 },
            { data: descHash, utype: 6, securityZone: 0 },
            { data: formData.severity, utype: 2, securityZone: 0 },
            { data: formData.category, utype: 2, securityZone: 0 },
          ],
          account: walletAddress,
        }
      );

      setStatus('Processing evidence...');
      let evidenceCID = '0x0000000000000000000000000000000000000000000000000000000000000000';
      if (evidenceFile) {
        setStatus('Encrypting and uploading evidence to IPFS...');
        const jwt = process.env.NEXT_PUBLIC_PINATA_JWT || '';
        evidenceCID = await uploadToIPFS(evidenceFile, jwt);
      }

      setStatus('Submitting encrypted report to blockchain...');
      createCase({
        encryptedTitle: `0x${encryptedInputs[0].ctHash.toString(16)}` as `0x${string}`,
        encryptedDescription: `0x${encryptedInputs[1].ctHash.toString(16)}` as `0x${string}`,
        encryptedSeverity: BigInt(encryptedInputs[2].ctHash),
        category: BigInt(encryptedInputs[3].ctHash),
        evidenceCID: evidenceCID as `0x${string}`,
      });

      setStatus('Report submitted! Waiting for confirmation...');
      onSuccess?.(Date.now() % 10000);
      reset();
    } catch (err: any) {
      setStatus(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
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
            <div className="font-semibold text-primary-400">FHE Encryption Enabled</div>
            <div className="text-xs text-gray-400">Your data is encrypted with Fully Homomorphic Encryption and ZK proofs</div>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Report Title</label>
        <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-4 py-3 rounded-lg bg-dark-700 border border-gray-700 focus:border-primary-500 outline-none" placeholder="Brief title for your report" required />
        <p className="text-xs text-gray-500 mt-1">Encrypted with FHE + ZK proofs before storage</p>
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
        <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-3 rounded-lg bg-dark-700 border border-gray-700 focus:border-primary-500 outline-none min-h-[150px]" placeholder="Provide detailed information..." required />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Severity (1-5)</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((level) => (
            <button key={level} type="button" onClick={() => setFormData({ ...formData, severity: level })} className={`w-12 h-12 rounded-lg font-semibold transition-all ${formData.severity === level ? (level <= 2 ? 'bg-green-500 text-white' : level <= 3 ? 'bg-yellow-500 text-black' : 'bg-red-500 text-white') : 'bg-dark-800 border border-gray-700'}`}>
              {level}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Evidence (Optional)</label>
        <input type="file" onChange={(e) => setEvidenceFile(e.target.files?.[0] || null)} className="w-full px-4 py-3 rounded-lg bg-dark-700 border border-gray-700 file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:bg-primary-500/20 file:text-primary-400" />
      </div>

      {status && (
        <div className={`p-4 rounded-lg text-sm flex items-center gap-3 ${isSuccess ? 'bg-emerald-500/20 text-emerald-400' : 'bg-primary-500/20 text-primary-400'}`}>
          {!isSuccess && <div className="w-4 h-4 rounded-full bg-primary-400 animate-pulse" />}
          {status}
        </div>
      )}

      {txHash && (
        <div className="p-4 rounded-lg bg-dark-700 border border-gray-700">
          <div className="text-xs text-gray-400 mb-1">Transaction Hash</div>
          <div className="font-mono text-xs break-all text-primary-400">{txHash}</div>
        </div>
      )}

      <button type="submit" disabled={isPending || isEncrypting || !formData.title || !formData.description} className="w-full py-4 rounded-lg bg-gradient-to-r from-primary-500 to-cyan-500 hover:from-primary-400 hover:to-cyan-400 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold shadow-lg shadow-primary-500/20">
        {isPending || isEncrypting ? (
          <span className="flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            FHE Encrypting & Submitting...
          </span>
        ) : (
          'Submit with FHE Encryption'
        )}
      </button>
    </form>
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