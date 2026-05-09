import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { Linkedin, Upload, FileText, CheckCircle } from 'lucide-react';
import { parseCV } from '@/lib/cv-parser-api';
import { ParsedData } from '@/lib/pdf-parser';

interface LinkedInImportProps {
  onImport: (data: ParsedData, pdfFile: File) => void;
  currentCV?: string;
  onCVRemove?: () => void;
  onParsingStart?: () => void;
  onParsingEnd?: () => void;
}

export const LinkedInImport: React.FC<LinkedInImportProps> = ({ onImport, currentCV, onCVRemove, onParsingStart, onParsingEnd }) => {
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState<string>('');
  const { toast } = useToast();

  const handlePDFUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    console.log('PDF upload started, file:', file);
    
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
    
    // Show helpful message
    toast({
      title: 'CV Uploaded Successfully!',
      description: 'Please review each section and save at the bottom to continue.',
      duration: 5000,
    });

    try {
      console.log('Calling parseCV API...');
      // Parse PDF using FastAPI microservice
      const parsedData = await parseCV(file);
      
      console.log('Parsed CV data from FastAPI:', parsedData);
      
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
        if (onParsingEnd) onParsingEnd();
        return;
      }

      // Pass parsed data and PDF file to parent
      onImport(parsedData, file);
      
      toast({
        title: 'CV data extracted successfully!',
        description: 'Please review the pre-filled information (Skills Profile, Work, Education, etc.) in each section when you\'re ready.',
        duration: 5000,
      });
      
      if (onParsingEnd) onParsingEnd();
      
    } catch (error) {
      console.error('PDF upload error:', error);
      if (onParsingEnd) onParsingEnd();
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

        {currentCV && !fileName && (
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-talendeur-orange/10 to-talendeur-primary/10 border border-talendeur-primary/20 rounded-lg">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-talendeur-primary" />
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-900">CV uploaded</span>
                <span className="text-xs text-gray-600">
                  {decodeURIComponent(currentCV.split('/').pop()?.split('-').slice(1).join('-') || 'CV')} • {new Date(parseInt(currentCV.match(/(\d{13})/)?.[1] || '0')).toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <a
                href={currentCV}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm px-3 py-1 bg-gradient-to-r from-talendeur-orange to-talendeur-primary text-white rounded hover:opacity-90 transition-opacity"
              >
                Download
              </a>
              {onCVRemove && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onCVRemove}
                  className="text-talendeur-primary hover:text-talendeur-primary/80 text-xs"
                >
                  Remove
                </Button>
              )}
            </div>
          </div>
        )}

        {fileName && (
          <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-talendeur-orange/10 to-talendeur-primary/10 border border-talendeur-primary/20 rounded-lg">
            <CheckCircle className="w-5 h-5 text-talendeur-primary" />
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-900">{fileName}</span>
              <span className="text-xs text-gray-600">Ready to upload - Click Save to confirm</span>
            </div>
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
