import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Github, Star } from "lucide-react";

const Navigation = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className="
      fixed top-0 left-0 right-0 z-50 
      backdrop-blur-md bg-white/70 dark:bg-gray-900/70 
      border border-gray-200/20 dark:border-gray-700/20
      rounded-b-3xl
      shadow-sm
      transition-all duration-300 ease-in-out
    ">
      <div className="container mx-auto px-4">
        <div className={`
          flex items-center justify-between transition-all duration-300
          ${isScrolled ? 'py-3' : 'py-6'}
        `}>
          {/* Logo Section */}
          <div 
            className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => navigate('/')}
          >
            <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                KeyGuard AI
              </h2>
              <p className="text-xs text-gray-600 dark:text-gray-400 hidden sm:block">
                API Security Scanner
              </p>
            </div>
          </div>

          {/* Navigation Items */}
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-6 mr-4">
              
            </div>

            <Badge 
              variant="outline" 
              className="hidden sm:flex border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-gray-50/50 dark:bg-gray-800/50 backdrop-blur-sm"
            >
              <Star className="h-3 w-3 mr-1" />
              Free & Open Source
            </Badge>

            <Button 
              variant="outline" 
              size="sm" 
              className="
                relative overflow-hidden border border-gray-300 dark:border-gray-600 
                bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm
                text-gray-900 dark:text-gray-100
                hover:bg-gradient-to-r hover:from-blue-600 hover:to-purple-600 
                hover:text-white hover:border-transparent
                transition-all duration-300 ease-in-out
                rounded-xl px-4 py-2
                shadow-sm hover:shadow-md
              " 
              asChild
            >
              <a 
                href="https://github.com/adolfousier/keyguard-ai-scan" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Github className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">GitHub</span>
                <span className="sm:hidden">Code</span>
              </a>
            </Button>

            {/* Mobile menu button could be added here */}
          </div>
        </div>
        
        {/* Bottom border with rounded corners */}
        <div className={`
          h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent
          rounded-full transition-opacity duration-300
          ${isScrolled ? 'opacity-100' : 'opacity-0'}
        `} />
      </div>
    </nav>
  );
};

export default Navigation;