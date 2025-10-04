import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Github } from "lucide-react";

interface CTASectionProps {
  onStartScan: () => void;
}

const CTASection = ({ onStartScan }: CTASectionProps) => {
  return (
    <section className="py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <Card className="border-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-2xl">
          <CardContent className="p-8 text-center">
            <h3 className="text-2xl md:text-3xl font-bold mb-4">Ready for Automated Penetration Testing?</h3>
            <p className="text-lg mb-6 opacity-90 leading-relaxed">
              Join security professionals using KeyGuard AI to perform comprehensive vulnerability assessments with OWASP-compliant testing, security header analysis, and AI-powered exploit detection.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                variant="secondary" 
                onClick={onStartScan}
                className="bg-white text-gray-900 hover:bg-gray-100"
              >
                <Shield className="h-5 w-5 mr-2" />
                Start Free Pentest
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="bg-transparent text-white border-white hover:bg-white hover:text-gray-900" 
                asChild
              >
                <a href="https://github.com/adolfousier/keyguard-ai-scan" target="_blank" rel="noopener noreferrer">
                  <Github className="h-5 w-5 mr-2" />
                  View on GitHub
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default CTASection;