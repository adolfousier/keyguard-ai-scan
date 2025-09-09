
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, Copy, Check, Shield, AlertTriangle, CheckCircle, Lightbulb, Lock, Zap } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface AIRecommendationsProps {
  recommendations: string;
  hasFindings?: boolean;
}

export const AIRecommendations = ({ recommendations, hasFindings = false }: AIRecommendationsProps) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(recommendations);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };



  return (
    <Card className="border-l-4 border-l-purple-500 dark:border-l-purple-400 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-0">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/30 dark:to-blue-900/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
              <Brain className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                AI Security Audit
              </CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                {hasFindings ? 'Vulnerability Assessment & Remediation' : 'Security Best Practices Review'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={hasFindings ? "destructive" : "secondary"} className="px-3 py-1">
              {hasFindings ? (
                <>
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Action Required
                </>
              ) : (
                <>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  All Clear
                </>
              )}
            </Badge>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={copyToClipboard}
              disabled={copied}
              className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2 text-green-600" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Report
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="prose prose-sm max-w-none">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
              <Zap className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium text-blue-900 text-sm">AI-Powered</p>
                <p className="text-xs text-blue-700">Advanced Analysis</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
              <Shield className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-green-900 text-sm">Security Focused</p>
                <p className="text-xs text-green-700">Best Practices</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg">
              <Lightbulb className="h-5 w-5 text-orange-600" />
              <div>
                <p className="font-medium text-orange-900 text-sm">Actionable</p>
                <p className="text-xs text-orange-700">Step-by-Step</p>
              </div>
            </div>
          </div>
          
          <div className="markdown-content bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <ReactMarkdown
              components={{
                h1: ({node, ...props}) => (
                  <div className="flex items-center space-x-2 mb-6">
                    <Lock className="h-6 w-6 text-red-600" />
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white border-b-2 border-red-200 dark:border-red-800 pb-1" {...props} />
                  </div>
                ),
                h2: ({node, ...props}) => (
                  <div className="flex items-center space-x-2 mb-4 mt-8">
                    <div className="w-2 h-6 bg-blue-500 rounded"></div>
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200" {...props} />
                  </div>
                ),
                h3: ({node, ...props}) => (
                  <div className="flex items-center space-x-2 mb-3 mt-6">
                    <div className="w-1.5 h-5 bg-purple-400 rounded"></div>
                    <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300" {...props} />
                  </div>
                ),
                p: ({node, ...props}) => <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed" {...props} />,
                ul: ({node, ...props}) => <ul className="space-y-2 mb-6" {...props} />,
                ol: ({node, ...props}) => <ol className="space-y-2 mb-6" {...props} />,
                li: ({node, ...props}) => (
                  <li className="flex items-start space-x-2 text-gray-700 dark:text-gray-300">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span {...props} />
                  </li>
                ),
                code: ({node, ...props}) => {
                  const isCodeBlock = props.className?.includes('language-');
                  return isCodeBlock ? (
                    <div className="relative">
                      <code className="block bg-gray-900 text-green-400 p-4 rounded-lg text-sm font-mono overflow-x-auto border" {...props} />
                      <div className="absolute top-2 right-2">
                        <Badge variant="secondary" className="text-xs">Code</Badge>
                      </div>
                    </div>
                  ) : (
                    <code className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm font-mono border" {...props} />
                  );
                },
                blockquote: ({node, ...props}) => (
                  <div className="border-l-4 border-yellow-400 bg-yellow-50 p-4 rounded-r-lg mb-6">
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <blockquote className="text-yellow-800 font-medium" {...props} />
                    </div>
                  </div>
                ),
                strong: ({node, ...props}) => <strong className="font-bold text-gray-900 dark:text-white bg-yellow-100 dark:bg-yellow-900/50 px-1 rounded" {...props} />,
              }}
            >
              {recommendations}
            </ReactMarkdown>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border">
          <div className="flex items-start space-x-2">
            <Lightbulb className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Important Notice</p>
              <p className="text-xs text-gray-600 leading-relaxed">
                These recommendations are AI-generated based on security best practices and should be reviewed by your security team. 
                Always test changes in a development environment first. KeyGuard AI Scan provides guidance but implementation decisions remain your responsibility.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
