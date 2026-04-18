'use client';

import { useState } from 'react';
import { getPermissionLevelLabel } from '@/lib/contracts';
import { useDisclosureCtrl } from '@/hooks/useDisclosureCtrl';

interface DisclosurePanelProps {
  caseId: number;
  isAdmin: boolean;
}

export default function DisclosurePanel({ caseId, isAdmin }: DisclosurePanelProps) {
  const { grantAccess, isPending } = useDisclosureCtrl();
  const [selectedAddress, setSelectedAddress] = useState('');
  const [permissionLevel, setPermissionLevel] = useState(2);
  const [message, setMessage] = useState('');

  const handleGrantAccess = async () => {
    if (!selectedAddress || !isAdmin) {
      return;
    }

    try {
      await grantAccess(caseId, selectedAddress, permissionLevel);
      setMessage(`${getPermissionLevelLabel(permissionLevel)} access granted.`);
      setSelectedAddress('');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to grant access.');
    }
  };

  return (
    <div className="p-6 rounded-xl bg-dark-700/50 border border-emerald-500/30">
      <h3 className="text-lg font-semibold mb-4">Disclosure control</h3>

      <div className="space-y-4">
        <input
          type="text"
          value={selectedAddress}
          onChange={(event) => setSelectedAddress(event.target.value)}
          placeholder="0x..."
          className="w-full px-4 py-3 rounded-lg bg-dark-800 border border-gray-700 focus:border-emerald-500 outline-none"
        />

        <div className="grid grid-cols-2 gap-2">
          {[1, 2, 3, 4].map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setPermissionLevel(level)}
              className={`px-3 py-3 rounded-lg border ${permissionLevel === level ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300' : 'border-gray-700 bg-dark-800'}`}
            >
              {getPermissionLevelLabel(level)}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={handleGrantAccess}
          disabled={!selectedAddress || !isAdmin || isPending}
          className="w-full py-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-600 text-white font-medium"
        >
          {isPending ? 'Waiting for wallet...' : 'Grant access'}
        </button>

        {message ? (
          <div className="p-3 rounded-lg bg-emerald-500/20 text-emerald-300 text-sm text-center">
            {message}
          </div>
        ) : null}
      </div>
    </div>
  );
}
