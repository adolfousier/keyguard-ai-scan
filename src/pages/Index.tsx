import { useState, useEffect } from "react";
import { ScanResults } from "@/components/ScanResults";
import Navigation from "@/components/Navigation";
import HeroWithScanForm from "@/components/landing/HeroWithScanForm";
import FeaturesSection from "@/components/landing/FeaturesSection";
import CTASection from "@/components/landing/CTASection";
import Footer from "@/components/Footer";
import { ScanResult } from "@/types/scan";
import { analytics } from "@/lib/analytics";
import { useDarkMode } from "@/hooks/use-dark-mode";

const Index = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  
  // Initialize dark mode detection
  useDarkMode();

  useEffect(() => {
    analytics.trackPageView('landing');
  }, []);

  const resetScan = () => {
    setScanResult(null);
    setIsScanning(false);
  };

  const scrollToScanForm = () => {
    const scanFormElement = document.getElementById('scan-form');
    if (scanFormElement) {
      scanFormElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (scanResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-950 dark:to-purple-950">
        <Navigation />
        <div className="pt-20">
          <div className="container mx-auto px-4 py-8">
            <ScanResults result={scanResult} onNewScan={resetScan} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-950 dark:to-purple-950">
      <Navigation />
      
      {/* Main Content with proper spacing from fixed nav */}
      <div className="pt-20">
        <div className="container mx-auto">
          <HeroWithScanForm isScanning={isScanning} setIsScanning={setIsScanning} />
          <FeaturesSection />
          <CTASection onStartScan={scrollToScanForm} />
        </div>
        <Footer />
      </div>
    </div>
  );
};

export default Index;