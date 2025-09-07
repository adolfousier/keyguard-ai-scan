import { Badge } from "@/components/ui/badge";
import { CheckCircle, Brain, Zap, Globe } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="text-center py-20 px-4" aria-labelledby="hero-heading">
      <div className="max-w-4xl mx-auto">
        <h1 id="hero-heading" className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
          Detect & Fix
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> API Key Leaks </span>
          Instantly
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
          Professional open-source security scanner that detects exposed API keys across websites. 
          Advanced AI-powered analysis identifies vulnerabilities from AWS, Google Cloud, GitHub, Stripe, and 100+ other services.
        </p>
        
        <div className="flex flex-wrap justify-center gap-4 mb-12">
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
    </section>
  );
};

export default HeroSection;