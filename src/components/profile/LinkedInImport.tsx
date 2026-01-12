import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { Linkedin, Upload, FileText, CheckCircle } from 'lucide-react';
import { parsePDF, ParsedData } from '@/lib/pdf-parser';

interface LinkedInImportProps {
  onImport: (data: ParsedData, pdfFile: File) => void;
}

export const LinkedInImport: React.FC<LinkedInImportProps> = ({ onImport }) => {
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState<string>('');
  const { toast } = useToast();

  const handlePDFUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    if (!file) return;
    
    if (file.type !== 'application/pdf') {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a PDF file',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    setFileName(file.name);

    try {
      // Parse PDF and extract data
      const parsedData = await parsePDF(file);
      
      console.log('Parsed PDF data:', parsedData);
      
      // Check if we extracted any meaningful data
      const hasData = 
        parsedData.profile.firstName ||
        parsedData.education.length > 0 ||
        parsedData.workExperience.length > 0 ||
        parsedData.certifications.length > 0 ||
        parsedData.skills.length > 0;

      if (!hasData) {
        toast({
          title: 'No data found',
          description: 'Could not extract data from PDF. Please check the file or enter manually.',
          variant: 'destructive',
        });
        return;
      }

      // Pass parsed data and PDF file to parent
      onImport(parsedData, file);
      
      toast({
        title: 'PDF imported successfully',
        description: `Extracted data from ${file.name}. Review and edit the pre-filled information below.`,
      });
      
    } catch (error) {
      console.error('PDF upload error:', error);
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Could not parse PDF',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Linkedin className="w-5 h-5" />
          Import from LinkedIn or CV
        </CardTitle>
        <CardDescription>
          Upload your LinkedIn profile PDF or CV to auto-fill your profile
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription>
            <strong>How to download your LinkedIn profile as PDF:</strong>
            <ol className="list-decimal list-inside mt-2 space-y-1">
              <li>Go to your LinkedIn profile page</li>
              <li>Click on <strong>"Resources"</strong> button</li>
              <li>Select <strong>"Save to PDF"</strong></li>
              <li>Once downloaded, upload the PDF file below</li>
            </ol>
            <div className="mt-3 pt-3 border-t">
              <strong>Or upload your existing CV/Resume (PDF format)</strong>
            </div>
          </AlertDescription>
        </Alert>

        {fileName && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-sm text-green-800">
              {fileName} uploaded successfully
            </span>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <input
            type="file"
            id="linkedin-pdf-upload"
            accept=".pdf"
            className="hidden"
            onChange={handlePDFUpload}
            disabled={uploading}
          />
          <label htmlFor="linkedin-pdf-upload">
            <Button
              type="button"
              disabled={uploading}
              className="w-full bg-gradient-to-r from-white via-talendeur-orange to-talendeur-primary hover:opacity-90 cursor-pointer"
              onClick={() => document.getElementById('linkedin-pdf-upload')?.click()}
            >
              {uploading ? (
                <>
                  <Upload className="w-4 h-4 mr-2 animate-pulse" />
                  Parsing PDF...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  Upload LinkedIn PDF or CV
                </>
              )}
            </Button>
          </label>
        </div>
      </CardContent>
    </Card>
  );
};
