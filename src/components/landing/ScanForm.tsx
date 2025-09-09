import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Loader2, AlertTriangle } from "lucide-react";
import { analytics } from "@/lib/analytics";

interface ScanFormProps {
  isScanning: boolean;
  setIsScanning: (scanning: boolean) => void;
}

const ScanForm = ({ isScanning, setIsScanning }: ScanFormProps) => {
  const navigate = useNavigate();
  const [url, setUrl] = useState("");

  const handleScan = async () => {
    console.log('BUTTON CLICKED - handleScan called');
    
    if (!url.trim()) {
      console.log('No URL provided');
      return;
    }

    if (isScanning) {
      console.log('Already scanning, ignoring click');
      return;
    }
    
    console.log('Starting scan for:', url);
    setIsScanning(true);
    analytics.trackEvent('scan_started', { url });
    
    try {
      // Use real backend API
      const { scannerClient } = await import('@/lib/scanner-client');
      const result = await scannerClient.startScan({ url });
      console.log('Scan started successfully:', result);
      navigate(`/scan-results?id=${result.id}`);
    } catch (error) {
      console.error('Failed to start scan:', error);
      setIsScanning(false);
      // TODO: Show error message to user
    }
  };

  const validateUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const isValidUrl = url.trim() && validateUrl(url);

  return (
    <section className="py-16 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-2xl border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white flex items-center justify-center">
              <Search className="h-6 w-6 mr-2 text-blue-600" />
              Start Security Audit Scan
            </CardTitle>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Enter any website URL to scan for exposed API Keys & security issues and security vulnerabilities
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="relative">
                <Input
                  type="url"
                  placeholder="https://example.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !isScanning && isValidUrl) {
                      handleScan();
                    }
                  }}
                  className="pl-12 py-6 text-lg border-2 border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl"
                  disabled={isScanning}
                />
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>
              
              {url && !isValidUrl && (
                <div className="flex items-center text-amber-600 dark:text-amber-400 text-sm">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Please enter a valid URL (including https://)
                </div>
              )}
            </div>

            <Button 
              onClick={handleScan}
              disabled={isScanning || !isValidUrl}
              className="w-full py-6 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {isScanning ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Scanning Website...
                </>
              ) : (
                <>
                  <Search className="h-5 w-5 mr-2" />
                  Start Free Security Audit Scan
                </>
              )}
            </Button>

            <div className="text-center text-sm text-gray-500 dark:text-gray-400">
              <p>✓ Free forever • ✓ No registration required • ✓ Instant results</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default ScanForm;