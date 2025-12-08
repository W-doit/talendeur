import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { Linkedin, Loader2 } from 'lucide-react';
import { initiateLinkedInAuth, isLinkedInCallback, handleLinkedInCallback, mapLinkedInToProfile } from '@/lib/linkedin-import';

interface LinkedInImportProps {
  onImport: (data: unknown) => void;
}

export const LinkedInImport: React.FC<LinkedInImportProps> = ({ onImport }) => {
  const [importing, setImporting] = useState(false);
  const { toast } = useToast();

  const handleOAuthCallback = React.useCallback(async (code: string, state: string) => {
    setImporting(true);

    try {
      const linkedInData = await handleLinkedInCallback(code, state);
      
      if (!linkedInData) {
        throw new Error('Failed to fetch LinkedIn data');
      }
      
      // Map to our schema
      const profileData = mapLinkedInToProfile(linkedInData);
      
      // Pass to parent
      onImport(profileData);
      
      toast({
        title: 'LinkedIn connected',
        description: 'Your profile has been imported from LinkedIn',
      });
    } catch (error) {
      console.error('LinkedIn import error:', error);
      toast({
        title: 'Import failed',
        description: error instanceof Error ? error.message : 'Could not import LinkedIn data',
        variant: 'destructive',
      });
    } finally {
      setImporting(false);
    }
  }, [onImport, toast]);

  useEffect(() => {
    // Check if we're returning from LinkedIn OAuth
    const callback = isLinkedInCallback();
    if (callback) {
      handleOAuthCallback(callback.code, callback.state);
    }
  }, [handleOAuthCallback]);

  const handleConnectLinkedIn = () => {
    initiateLinkedInAuth();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Linkedin className="w-5 h-5" />
          Import from LinkedIn
        </CardTitle>
        <CardDescription>
          Connect your LinkedIn account to auto-fill your profile
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription>
            <strong>How it works:</strong>
            <ol className="list-decimal list-inside mt-2 space-y-1">
              <li>Click "Connect LinkedIn" below</li>
              <li>Log in to LinkedIn and grant permission</li>
              <li>Your profile data will be imported automatically</li>
            </ol>
          </AlertDescription>
        </Alert>

        <Button
          onClick={handleConnectLinkedIn}
          disabled={importing}
          className="w-full bg-[#0A66C2] hover:bg-[#004182]"
        >
          {importing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Importing...
            </>
          ) : (
            <>
              <Linkedin className="w-4 h-4 mr-2" />
              Connect LinkedIn
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
