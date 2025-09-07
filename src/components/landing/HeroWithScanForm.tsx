import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Brain, Zap, Globe, Search, Loader2, AlertTriangle } from "lucide-react";
import { analytics } from "@/lib/analytics";
import { apiClient } from "@/lib/api-client";
import { toast } from "@/hooks/use-toast";

interface HeroWithScanFormProps {
  isScanning: boolean;
  setIsScanning: (scanning: boolean) => void;
}

const HeroWithScanForm = ({ isScanning, setIsScanning }: HeroWithScanFormProps) => {
  const navigate = useNavigate();
  const [url, setUrl] = useState("");

  const handleScan = async () => {
    console.log('BUTTON CLICKED - handleScan called');
    
    if (!url.trim()) {
      console.log('No URL provided');
      toast({
        title: "URL Required",
        description: "Please enter a website URL to scan.",
        variant: "destructive",
      });
      return;
    }

    if (isScanning) {
      console.log('Already scanning, ignoring click');
      return;
    }
    
    console.log('Starting scan for:', url);
    setIsScanning(true);
    analytics.trackScanStarted(url);
    
    try {
      // Call the real backend API to start the scan
      const scanResult = await apiClient.startScan({ url });
      console.log('Scan started successfully:', scanResult);
      
      // Navigate to results page with the real scan ID
      navigate(`/scan-results?id=${scanResult.id}`);
    } catch (error) {
      console.error('Scan failed:', error);
      setIsScanning(false);
      
      // Show error to user
      toast({
        title: "Scan Failed",
        description: error instanceof Error ? error.message : "Failed to start scan. Please try again.",
        variant: "destructive",
      });
      
      // Track the failure
      analytics.trackScanFailed(url, error instanceof Error ? error.message : "Unknown error");
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
    <section className="pt-32 pb-12 px-4" aria-labelledby="hero-heading">
      <div className="max-w-7xl mx-auto">
        {/* Desktop Layout: Hero Left, Scan Form Right */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          
          {/* Hero Content - Left Side */}
          <div className="text-center lg:text-left">
            <h1 id="hero-heading" className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
              Detect & Fix
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> API Key Leaks </span>
              Instantly
            </h1>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
              Professional open-source security scanner that detects exposed API keys across websites. 
              Identifies vulnerabilities over 100+ services.
            </p>
            
            <div className="flex flex-wrap justify-center lg:justify-start gap-4 mb-8">
              <Badge variant="secondary" className="px-4 py-2 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                100+ API Key Types
              </Badge>
              <Badge variant="secondary" className="px-4 py-2 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                <Brain className="h-4 w-4 mr-2 text-purple-600" />
                AI-Powered Analysis
              </Badge>
              <Badge variant="secondary" className="px-4 py-2 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                <Zap className="h-4 w-4 mr-2 text-yellow-600" />
                Instant Results
              </Badge>
              <Badge variant="secondary" className="px-4 py-2 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                <Globe className="h-4 w-4 mr-2 text-blue-600" />
                Deep Web Scan
              </Badge>
            </div>
          </div>

          {/* Scan Form - Right Side */}
          <div className="w-full" id="scan-form">
            <Card className="shadow-2xl border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white flex items-center justify-center">
                  <Search className="h-6 w-6 mr-2 text-blue-600" />
                  Start Security Scan
                </CardTitle>
                <p className="text-gray-600 dark:text-gray-300 mt-2">
                  Enter any website URL to scan for exposed API keys and security vulnerabilities
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
                      Start Free Security Scan
                    </>
                  )}
                </Button>

                <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                  <p>✓ Free forever • ✓ No registration required • ✓ Instant results</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroWithScanForm;