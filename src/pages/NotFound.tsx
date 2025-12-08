
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import MainLayout from '@/components/layout/MainLayout';

const NotFound: React.FC = () => {
  return (
    <MainLayout>
      <div className="container mx-auto py-20 px-4 text-center">
        <div className="max-w-md mx-auto">
          <h1 className="text-9xl font-bold text-talendeur-primary mb-6">404</h1>
          <h2 className="text-3xl font-bold mb-4">Page Not Found</h2>
          <p className="text-muted-foreground mb-8">
            The page you are looking for doesn't exist or has been moved.
          </p>
          <Link to="/">
            <Button className="bg-talendeur-primary hover:bg-talendeur-primary-dark">
              Return Home
            </Button>
          </Link>
        </div>
      </div>
    </MainLayout>
  );
};

export default NotFound;
