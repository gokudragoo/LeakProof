'use client';

import { useState } from 'react';
import { useDisclosureCtrl } from '@/hooks/useDisclosureCtrl';

interface DisclosurePanelProps {
  caseId: number;
  isAdmin: boolean;
}

export default function DisclosurePanel({ caseId, isAdmin }: DisclosurePanelProps) {
  const { grantAccess, isPending } = useDisclosureCtrl();

  const [selectedAddress, setSelectedAddress] = useState('');
  const [permissionLevel, setPermissionLevel] = useState(1);
  const [granted, setGranted] = useState(false);

  const permissionLevels = [
    { value: 1, label: 'Outcome Only', description: 'Can see final decision' },
    { value: 2, label: 'Summary Only', description: 'Can see case summary' },
    { value: 3, label: 'Full Report', description: 'Can see full report details' },
    { value: 4, label: 'Identity Reveal', description: 'Can reveal reporter identity' },
  ];

  const handleGrantAccess = () => {
    if (selectedAddress && isAdmin) {
      grantAccess(caseId, selectedAddress, permissionLevel);
      setGranted(true);
      setTimeout(() => setGranted(false), 3000);
    }
  };

  return (
    <div className="p-6 rounded-xl bg-dark-700/50 border border-emerald-500/30">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        Disclosure Control
      </h3>

      <p className="text-sm text-gray-400 mb-6">
        Grant limited access to specific addresses. Only authorized parties can decrypt case data.
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Address</label>
          <input
            type="text"
            value={selectedAddress}
            onChange={(e) => setSelectedAddress(e.target.value)}
            placeholder="0x..."
            className="w-full px-4 py-3 rounded-lg bg-dark-800 border border-gray-700 focus:border-emerald-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Permission Level</label>
          <div className="space-y-2">
            {permissionLevels.map((level) => (
              <button
                key={level.value}
                type="button"
                onClick={() => setPermissionLevel(level.value)}
                className={`w-full p-3 rounded-lg text-left transition-colors ${
                  permissionLevel === level.value
                    ? 'bg-emerald-500/20 border border-emerald-500/50'
                    : 'bg-dark-800 border border-gray-700 hover:border-emerald-500/30'
                }`}
              >
                <div className="font-medium">{level.label}</div>
                <div className="text-xs text-gray-400">{level.description}</div>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleGrantAccess}
          disabled={!selectedAddress || !isAdmin || isPending}
          className="w-full py-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-600 text-white font-medium"
        >
          {isPending ? 'Granting Access...' : 'Grant Disclosure Access'}
        </button>

        {granted && (
          <div className="p-3 rounded-lg bg-emerald-500/20 text-emerald-400 text-sm text-center">
            Access granted successfully!
          </div>
        )}
      </div>
    </div>
  );
}