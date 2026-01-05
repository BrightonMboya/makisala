'use client';

import { Button } from '@repo/ui/button';
import { Download } from 'lucide-react';
import { useState } from 'react';

export function PDFDownloadButton({ proposalId, title }: { proposalId: string; title?: string }) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch(`/api/proposal/${proposalId}/pdf`);
      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${title || 'proposal'}-${proposalId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download PDF:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Button
      onClick={handleDownload}
      disabled={isDownloading}
      className="fixed bottom-6 right-6 z-50 gap-2 bg-white text-stone-800 shadow-lg hover:bg-stone-50 border border-stone-200"
      size="lg"
    >
      <Download className="h-4 w-4" />
      {isDownloading ? 'Generating...' : 'Download PDF'}
    </Button>
  );
}
