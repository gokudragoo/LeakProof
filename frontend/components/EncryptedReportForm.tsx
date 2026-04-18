'use client';

import { useState } from 'react';
import { useCreateCase } from '@/hooks/useCaseRegistry';
import { deriveKeyFromWallet, encryptField } from '@/lib/cofhe';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const key = deriveKeyFromWallet(walletAddress, Date.now().toString());

      const encryptedTitle = encryptField(formData.title, key);
      const encryptedDesc = encryptField(formData.description, key);

      let evidenceCID = '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`;

      if (evidenceFile) {
        setStatus('Uploading encrypted evidence...');
        const jwt = process.env.NEXT_PUBLIC_PINATA_JWT || '';
        const cid = await uploadToIPFS(evidenceFile, jwt);
        evidenceCID = cid as `0x${string}`;
      }

      setStatus('Submitting encrypted report...');

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
      setStatus(`Error: ${err.message}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">Encrypted Title</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full px-4 py-3 rounded-lg bg-dark-700 border border-gray-700 focus:border-primary-500 outline-none"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Category</label>
        <select
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: parseInt(e.target.value) })}
          className="w-full px-4 py-3 rounded-lg bg-dark-700 border border-gray-700 focus:border-primary-500 outline-none"
        >
          {Object.entries(CASE_CATEGORY).filter(([k]) => !isNaN(Number(k))).map(([key, label]) => (
            <option key={key} value={key}>{label as string}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Encrypted Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-4 py-3 rounded-lg bg-dark-700 border border-gray-700 focus:border-primary-500 outline-none min-h-[150px]"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Severity (1-5)</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setFormData({ ...formData, severity: level })}
              className={`w-12 h-12 rounded-lg font-semibold ${
                formData.severity === level
                  ? level <= 2 ? 'bg-green-500 text-white' : level <= 3 ? 'bg-yellow-500 text-black' : 'bg-red-500 text-white'
                  : 'bg-dark-700 border border-gray-700'
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Evidence (Optional)</label>
        <input
          type="file"
          onChange={(e) => setEvidenceFile(e.target.files?.[0] || null)}
          className="w-full px-4 py-3 rounded-lg bg-dark-700 border border-gray-700"
        />
      </div>

      {status && (
        <div className="p-3 rounded-lg bg-primary-500/20 text-primary-400 text-sm">
          {status}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full py-4 rounded-lg bg-primary-500 hover:bg-primary-600 disabled:bg-gray-600 text-white font-semibold"
      >
        {isPending ? 'Encrypting & Submitting...' : 'Submit Encrypted Report'}
      </button>
    </form>
  );
}