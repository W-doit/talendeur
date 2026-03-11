
import React, { ReactNode } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import FeedbackButton from '@/components/FeedbackButton';

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
      <FeedbackButton />
    </div>
  );
};

export default MainLayout;
