import type { Metadata } from 'next';
import { Inter, Maven_Pro } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/components/AuthProvider';

const inter = Inter({ subsets: ['latin'] });
const mavenPro = Maven_Pro({ 
  subsets: ['latin'],
  variable: '--font-maven-pro',
  weight: ['400', '500', '600', '700', '800', '900']
});

export const metadata: Metadata = {
  title: 'Suggestion Box',
  description: 'Anonymous suggestion platform for feedback and ideas',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${mavenPro.variable}`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}