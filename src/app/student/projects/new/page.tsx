'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RedirectToUnifiedProject() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/student/activities/new?type=PROJECT');
  }, [router]);
  return (
    <div className="p-8 text-center text-xs text-slate-500">
      Redirecting to Unified Activity Submission...
    </div>
  );
}
