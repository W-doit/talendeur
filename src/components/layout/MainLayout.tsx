
import React, { ReactNode } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import PwaInstallBanner from '@/components/PwaInstallBanner';

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen overflow-x-hidden">
      <Navbar />
      <main className="flex-grow pb-24 sm:pb-0 min-w-0">{children}</main>
      <Footer />
      <PwaInstallBanner />
    </div>
  );
};

export default MainLayout;
