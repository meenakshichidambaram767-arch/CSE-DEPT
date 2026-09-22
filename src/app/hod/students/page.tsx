'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HODStudentsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/hod/records');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[50vh] text-center p-6">
      <div className="text-xs text-[#586658]">
        Redirecting to Master Records &amp; Student Directory...
      </div>
    </div>
  );
}

