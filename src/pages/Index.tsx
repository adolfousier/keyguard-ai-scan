
import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScanProgress } from "@/components/ScanProgress";
import { ScanResults } from "@/components/ScanResults";
import { scannerClient } from "@/lib/scanner-client";
import { ScanResult, ScanProgress as ScanProgressType } from "@/types/scan";
import { analytics } from "@/lib/analytics";
import { 
  Shield, 
  Search, 
  Zap, 
  Brain, 
  Github, 
  Star,
  CheckCircle,
  AlertTriangle,
  Globe,
  Lock,
  Cpu,
  BarChart3
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

const Index = () => {
  const navigate = useNavigate();
  const [url, setUrl] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState<ScanProgressType | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);

  useEffect(() => {
    analytics.trackPageView('landing');
  }, []);

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
    
    // Force immediate navigation for testing
    console.log('Navigating to results page');
    navigate('/scan-results?id=test-123');
  };

  const resetScan = useCallback(() => {
    setUrl("");
    setScanResult(null);
    setScanProgress(null);
    setIsScanning(false);
  }, []);

  if (scanResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
        <div className="container mx-auto px-4 py-8">
          <ScanResults result={scanResult} onNewScan={resetScan} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">KeyGuard AI Scan</h2>
              <p className="text-sm text-gray-600">Open-source API key security scanner</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="hidden md:flex">
              <Star className="h-3 w-3 mr-1" />
              Free & Open Source
            </Badge>
            <Button variant="outline" size="sm" className="text-gray-900 border-gray-300 hover:bg-purple-600 hover:text-white hover:border-purple-600" asChild>
              <a href="https://github.com/adolfousier/keyguard-ai-scan" target="_blank" rel="noopener noreferrer">
                <Github className="h-4 w-4 mr-2" />
                GitHub
              </a>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 pb-12">
        {/* Hero Section */}
        <section className="text-center mb-12" aria-labelledby="hero-heading">
          <div className="max-w-4xl mx-auto">
            <h1 id="hero-heading" className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Detect & Fix
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> API Key Leaks </span>
              Instantly
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Professional open-source security scanner that detects exposed API keys across websites. 
              Advanced AI-powered analysis identifies vulnerabilities from AWS, Google Cloud, GitHub, Stripe, and 100+ other services.
            </p>
            
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <Badge variant="secondary" className="px-4 py-2">
                <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                100+ API Key Types
              </Badge>
              <Badge variant="secondary" className="px-4 py-2">
                <Brain className="h-4 w-4 mr-2 text-purple-600" />
                AI-Powered Analysis
              </Badge>
              <Badge variant="secondary" className="px-4 py-2">
                <Zap className="h-4 w-4 mr-2 text-yellow-600" />
                Real-time Scanning
              </Badge>
            </div>
          </div>
        </section>

        {/* Scan Interface */}
        <Card className="max-w-2xl mx-auto mb-12 shadow-lg border-0 bg-white/80 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-center flex items-center justify-center space-x-2">
              <Search className="h-5 w-5 text-blue-600" />
              <span>Start Security Scan</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isScanning && scanProgress ? (
              <ScanProgress progress={scanProgress} />
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="url" className="text-sm font-medium text-gray-700">
                    Website URL
                  </label>
                  <Input
                    id="url"
                    type="url"
                    placeholder="https://your-website.com"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleScan()}
                    className="text-lg py-3"
                    disabled={isScanning}
                  />
                  <p className="text-xs text-gray-500">
                    Enter any website URL to scan for exposed API keys and security vulnerabilities
                  </p>
                </div>
                
                <Button 
                  onClick={async () => {
                    if (!url.trim() || isScanning) return;
                    
                    setIsScanning(true);
                    try {
                      const scanResult = await scannerClient.startScan({ url });
                      navigate(`/scan-results?id=${scanResult.id}`);
                    } catch (error) {
                      console.error('Scan error:', error);
                      setIsScanning(false);
                      toast({
                        title: "Scan Failed",
                        description: "Unable to start the scan. Please try again.",
                        variant: "destructive",
                      });
                    }
                  }}
                  disabled={isScanning || !url.trim()}
                  className="w-full py-3 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isScanning ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Analyzing Website...
                    </>
                  ) : (
                    <>
                      <Shield className="h-5 w-5 mr-2" />
                      Start Security Scan
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Features Grid */}
        <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12" aria-labelledby="features-heading">
          <h2 id="features-heading" className="sr-only">KeyGuard AI Scan Features</h2>
          <Card className="border-0 bg-white/60 backdrop-blur">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Globe className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Comprehensive API Key Detection</h3>
              </div>
              <p className="text-gray-600">
                Advanced pattern matching scans HTML, JavaScript, CSS, and network requests for 100+ API key types from AWS, Google Cloud, GitHub, Stripe, OpenAI, and other major cloud providers.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white/60 backdrop-blur">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Brain className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900">AI-Powered Security Recommendations</h3>
              </div>
              <p className="text-gray-600">
                Receive intelligent, context-aware security recommendations and remediation steps powered by advanced AI models for immediate vulnerability fixes.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white/60 backdrop-blur">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Lock className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Privacy First</h3>
              </div>
              <p className="text-gray-600">
                No data stored permanently. Open-source code you can trust and audit yourself.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white/60 backdrop-blur">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Zap className="h-6 w-6 text-yellow-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Lightning Fast</h3>
              </div>
              <p className="text-gray-600">
                Advanced scanning algorithms complete most website analyses in under 30 seconds.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white/60 backdrop-blur">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Smart Detection</h3>
              </div>
              <p className="text-gray-600">
                Advanced entropy analysis and pattern matching reduces false positives while catching real threats.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white/60 backdrop-blur">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-indigo-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Detailed Reports</h3>
              </div>
              <p className="text-gray-600">
                Export comprehensive reports in multiple formats for security audits and compliance.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Call to Action */}
        <Card className="max-w-4xl mx-auto border-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Ready to Secure Your Website?</h2>
            <p className="text-lg mb-6 opacity-90">
              Join thousands of developers and security teams using KeyGuard AI Scan to protect their web applications from dangerous API key exposures and security vulnerabilities.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" onClick={() => setUrl("https://")}>
                <Shield className="h-5 w-5 mr-2" />
                Start Free Scan
              </Button>
              <Button size="lg" variant="outline" className="bg-white text-gray-900 border-white hover:bg-purple-600 hover:text-white hover:border-purple-600" asChild>
                <a href="https://github.com/adolfousier/keyguard-ai-scan" target="_blank" rel="noopener noreferrer">
                  <Github className="h-5 w-5 mr-2" />
                  View on GitHub
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <footer className="border-t bg-white/80 backdrop-blur mt-12">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-gray-600">
            <p className="mb-2">
              Built with ❤️ by the security team • 
              <a href="https://meetneura.ai" className="text-blue-600 hover:underline ml-1">
                Neura AI
              </a>
            </p>
            <p className="text-sm">
              Help protect the web, one scan at a time.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
