'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function InternshipDetailsRedirect() {
  const params = useParams();
  const router = useRouter();
  useEffect(() => {
    router.replace(`/student/projects/${params.id}`);
  }, [params.id, router]);

  return (
    <div className="p-8 text-center text-xs text-slate-500">
      Loading Activity Details...
    </div>
  );
}
