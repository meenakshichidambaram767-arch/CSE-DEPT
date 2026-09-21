'use client';

import React from 'react';
import { AppShell } from '@/components/layout/AppShell';

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return <AppShell role="STUDENT">{children}</AppShell>;
}
