import { ReactNode } from 'react';
import { Inter } from 'next/font/google';
import '@/styles/globals.css';
import Provider from '@/app/provider';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Tic Tac Toe Online',
  description: 'Play Tic Tac Toe online with friends',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang='en'>
      <body className={inter.className}>
        <Provider>
          {children}
        </Provider>
      </body>
    </html>
  );
}
