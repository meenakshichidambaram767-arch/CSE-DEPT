import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ToastProvider } from '@/components/ui/Toast';
import { SessionProvider } from '@/context/SessionContext';
import { DataProvider } from '@/context/DataContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SIET CSE — Student OD & Activity Management System',
  description:
    'CSE Department Activity Hub for managing On-Duty Clearances, Projects, Internships, Hackathons, and HOD Approvals at Sri Shakthi Institute of Engineering and Technology.',
  icons: {
    icon: '/images/siet-logo.png',
    shortcut: '/images/siet-logo.png',
    apple: '/images/siet-logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light" style={{ colorScheme: 'light' }}>
      <body className={`${inter.className} min-h-screen bg-[#f7f9f5] text-[#172017] flex flex-col selection:bg-[#fed403] selection:text-[#064024]`}>
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

