'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ViewFestival() {
  const [code, setCode] = useState('');
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const c = code.trim().toUpperCase();
    if (!c || c.length < 4) return;
    router.push(`/f/${c}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-md w-full max-w-md p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">View a Festival</h1>
        <p className="text-sm text-gray-600 mb-6 text-center">Enter the festival code shared by your admin</p>
        <form onSubmit={handleSubmit}>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter festival code (e.g., 8 letters)"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4 uppercase"
          />
          <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700">
            Continue
          </button>
        </form>
      </div>
    </div>
  );
}
