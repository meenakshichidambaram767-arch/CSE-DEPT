'use client';

import React from 'react';
import { AppShell } from '@/components/layout/AppShell';

export default function HodLayout({ children }: { children: React.ReactNode }) {
  return <AppShell role="HOD">{children}</AppShell>;
}
