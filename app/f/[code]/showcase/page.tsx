'use client';

import PasswordGate from '@/components/PasswordGate';
import { useParams } from 'next/navigation';

export default function ShowcasePage() {
  const params = useParams<{ code: string }>();
  const code = (params?.code as string) || '';

  return (
    <PasswordGate code={code}>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-8">
        <div className="bg-white rounded-lg shadow-md p-10 text-center max-w-md w-full">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Showcase</h1>
          <p className="text-gray-600">Coming soooonn...</p>
        </div>
      </div>
    </PasswordGate>
  );
}
