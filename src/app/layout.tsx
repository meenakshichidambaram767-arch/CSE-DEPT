import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ToastProvider } from '@/components/ui/Toast';
import { SessionProvider } from '@/context/SessionContext';
import { DataProvider } from '@/context/DataContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SIET CSE — Student Activity Management System',
  description:
    'CSE Department Activity Hub for managing Projects, Internships, Hackathons, and HOD Approvals at Sri Shakthi Institute of Engineering and Technology.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light" style={{ colorScheme: 'light' }}>
      <body className={`${inter.className} min-h-screen bg-slate-50/70 text-slate-900 flex flex-col selection:bg-emerald-200`}>
        <ToastProvider>
          <SessionProvider>
            <DataProvider>
              <div className="flex-1 flex flex-col">
                {children}
              </div>
            </DataProvider>
          </SessionProvider>
        </ToastProvider>
      </body>
    </html>
  );
}

