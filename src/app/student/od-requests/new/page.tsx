'use client';

import React, { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function NewODRequestRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const query = searchParams.toString();
    const target = query ? `/student/apply-od?${query}` : '/student/apply-od';
    router.replace(target);
  }, [router, searchParams]);

  return (
    <div className="py-24 text-center text-xs text-[#586658]">
      <div className="w-5 h-5 mx-auto mb-2 border-2 border-[#0a5c36] border-t-transparent rounded-full animate-spin" />
      Redirecting to canonical OD Application form (/student/apply-od)...
    </div>
  );
}

export default function NewODRequestRedirectPage() {
  return (
    <Suspense fallback={<div className="py-24 text-center text-xs text-[#586658]">Loading...</div>}>
      <NewODRequestRedirect />
    </Suspense>
  );
}
