import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Navigation from "@/components/Navigation";
import { useDarkMode } from "@/hooks/use-dark-mode";
import { 
  Shield, 
  ArrowLeft, 
  Clock,
  MapPin,
  TrendingUp,
  CheckCircle,
  XCircle,
  Brain,
  Copy,
  AlertTriangle
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { scannerClient } from "@/lib/scanner-client";
import { ScanResult } from "@/types/scan";
import { toast } from "@/hooks/use-toast";
import { ShareButton } from "@/components/ShareButton";
import { ExportButton } from "@/components/ExportButton";

const ScanResultsPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const scanId = searchParams.get('id');
  const [result, setResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize dark mode detection
  useDarkMode();

  useEffect(() => {
    if (!scanId) {
      navigate('/');
      return;
    }

    const pollResults = async () => {
      try {
        const scanResult = await scannerClient.getScanResult(scanId);
        
        // Transform backend response to frontend types
        const transformedResult: ScanResult = {
          id: scanResult.id,
          url: scanResult.url,
          startTime: new Date(scanResult.start_time),
          endTime: scanResult.end_time ? new Date(scanResult.end_time) : undefined,
          status: scanResult.status as any,
          findings: scanResult.findings.map(f => ({
            id: f.id,
            type: f.key_type,
            value: f.value,
            location: f.location,
            severity: f.severity as any,
            description: f.description,
            recommendation: f.recommendation,
            context: f.context,
            lineNumber: f.line_number,
            confidence: f.confidence
          })),
          totalChecks: scanResult.total_checks,
          completedChecks: scanResult.completed_checks,
          aiRecommendations: scanResult.ai_recommendations,
          summary: scanResult.summary
        };

        setResult(transformedResult);
        
        // If still scanning, continue polling
        if (scanResult.status === 'scanning') {
          setTimeout(pollResults, 2000);
        } else {
          setLoading(false);
        }
      } catch (err) {
        setError('Failed to load scan results');
        console.error('Error fetching scan result:', err);
        setLoading(false);
      }
    };

    pollResults();
  }, [scanId, navigate]);

  const copyAIResponse = () => {
    if (result) {
      let content = '';
      
      // Add AI recommendations if available
      if (result.aiRecommendations) {
        content += `# AI Security Audit\n\n${result.aiRecommendations}\n\n`;
      }
      
      // Add security findings
      content += `# Security Findings\n\n`;
      if (result.findings.length === 0) {
        content += 'No security issues found. Excellent!';
      } else {
        result.findings.forEach((finding, index) => {
          content += `## Finding ${index + 1}: ${finding.type}\n`;
          content += `**Severity:** ${finding.severity.toUpperCase()}\n`;
          content += `**Description:** ${finding.description}\n`;
          content += `**Location:** ${finding.location}${finding.lineNumber ? ` (Line ${finding.lineNumber})` : ''}\n`;
          content += `**Detected Value:** \`${finding.value}\`\n`;
          content += `**Context:** \`${finding.context}\`\n`;
          if (finding.recommendation) {
            content += `**Recommendation:** ${finding.recommendation}\n`;
          }
          content += `**Confidence:** ${finding.confidence}%\n\n`;
        });
      }
      
      navigator.clipboard.writeText(content);
      toast({
        title: "Copied!",
        description: "Complete security analysis copied to clipboard",
      });
    }
  };

  if (loading || (result && result.status === 'scanning')) {
    const progress = result ? 
      (result.totalChecks > 0 ? (result.completedChecks / result.totalChecks * 100) : 50) : 0;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-950 dark:to-purple-950">
        <Navigation />
        <div className="pt-20">
          <div className="container mx-auto px-4 py-8">
          <Card className="max-w-2xl mx-auto bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-0">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-white">
                <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400 animate-pulse" />
                <span>Scanning in Progress</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-6">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 dark:border-blue-400 mx-auto"></div>
                
                {result && (
                  <div className="space-y-4">
                    <div className="text-lg font-medium text-gray-900 dark:text-white">
                      Analyzing: {result.url}
                    </div>
                    
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      {result.completedChecks} of {result.totalChecks || '?'} checks completed ({Math.round(progress)}%)
                    </div>
                  </div>
                )}
                
                {!result && (
                  <div className="space-y-2">
                    <div className="text-lg font-medium text-gray-900">Initializing scan...</div>
                    <div className="text-sm text-gray-600">Please wait while we analyze your website</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-950 dark:to-purple-950 flex items-center justify-center">
        <Navigation />
        <div className="pt-20 flex items-center justify-center w-full h-full">
        <Card className="max-w-md mx-auto bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-0">
          <CardContent className="p-6 text-center">
            <XCircle className="h-12 w-12 text-red-500 dark:text-red-400 mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Error Loading Results</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">{error || 'Scan results not found'}</p>
            <Button onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Scanner
            </Button>
          </CardContent>
        </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-950 dark:to-purple-950">
      <Navigation />
      <div className="pt-20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button variant="outline" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            New Scan
          </Button>
          <div className="flex space-x-2">
            <ExportButton result={result} />
            <ShareButton result={result} />
          </div>
        </div>

        {/* Summary Card */}
        <Card className="mb-8 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-0">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-white">
              <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              <span>Security Audit Scan Results</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{result.summary.total}</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Total Findings</div>
              </div>
              <div className="text-center p-4 bg-red-50 dark:bg-red-900/30 rounded-lg">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {result.summary.critical + result.summary.high}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">High Priority</div>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/30 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {result.summary.medium + result.summary.low}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Lower Priority</div>
              </div>
            </div>

            <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-300">
              <div className="flex items-center space-x-1">
                <MapPin className="h-4 w-4" />
                <span>{result.url}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>{result.startTime.toLocaleString()}</span>
              </div>
              <div className="flex items-center space-x-1">
                <TrendingUp className="h-4 w-4" />
                <span>{result.completedChecks} checks completed</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Analysis Section */}
        {result.aiRecommendations && (
          <Card className="mb-8 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-0">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-white">
                  <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 dark:from-purple-400 dark:to-blue-400 rounded-lg">
                    <Brain className="h-5 w-5 text-white" />
                  </div>
                  <span>AI Security Audit</span>
                  <Badge className="bg-gradient-to-r from-purple-500 to-blue-500 dark:from-purple-400 dark:to-blue-400 text-white">
                    Powered by AI
                  </Badge>
                </CardTitle>
                <Button variant="outline" size="sm" onClick={copyAIResponse}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Full Report
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-gray-800 dark:via-gray-700 dark:to-gray-600 rounded-xl p-6 border border-purple-200 dark:border-gray-600">
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown
                    components={{
                      h1: ({node, ...props}) => (
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 pb-2 border-b border-purple-200 dark:border-gray-600" {...props} />
                      ),
                      h2: ({node, ...props}) => (
                        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3 mt-6 flex items-center" {...props}>
                          <div className="w-1 h-6 bg-gradient-to-b from-purple-500 to-blue-500 rounded-full mr-3"></div>
                          {props.children}
                        </h2>
                      ),
                      h3: ({node, ...props}) => (
                        <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2 mt-4 flex items-center" {...props}>
                          <div className="w-2 h-2 bg-purple-400 rounded-full mr-2"></div>
                          {props.children}
                        </h3>
                      ),
                      p: ({node, ...props}) => (
                        <p className="text-gray-700 dark:text-gray-300 mb-3 leading-relaxed" {...props} />
                      ),
                      ul: ({node, ...props}) => (
                        <ul className="space-y-2 mb-4" {...props} />
                      ),
                      ol: ({node, ...props}) => (
                        <ol className="space-y-2 mb-4" {...props} />
                      ),
                      li: ({node, ...props}) => (
                        <li className="text-gray-700 dark:text-gray-300 flex items-start" {...props}>
                          <div className="w-1.5 h-1.5 bg-purple-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                          <span>{props.children}</span>
                        </li>
                      ),
                      code: ({node, ...props}) => {
                        const isCodeBlock = props.className?.includes('language-');
                        return isCodeBlock ? (
                          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm font-mono overflow-x-auto my-4 border border-gray-700">
                            <code {...props} />
                          </div>
                        ) : (
                          <code className="bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200 px-2 py-1 rounded text-sm font-mono" {...props} />
                        );
                      },
                      blockquote: ({node, ...props}) => (
                        <div className="border-l-4 border-purple-400 bg-purple-50 dark:bg-purple-900/30 pl-4 py-3 rounded-r-lg mb-4">
                          <blockquote className="text-purple-800 dark:text-purple-200 italic" {...props} />
                        </div>
                      ),
                      strong: ({node, ...props}) => (
                        <strong className="font-semibold text-gray-900 dark:text-white bg-yellow-100 dark:bg-yellow-900/50 px-1 rounded" {...props} />
                      ),
                    }}
                  >
                    {result.aiRecommendations}
                  </ReactMarkdown>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Findings Section */}
        <Card className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-0">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Security Findings</CardTitle>
          </CardHeader>
          <CardContent>
            {result.findings.length === 0 ? (
              <div className="text-center py-8">
                <div className="bg-green-100 dark:bg-green-900/30 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Security Issues Found</h3>
                <p className="text-gray-600 dark:text-gray-300 max-w-md mx-auto">
                  Excellent! No exposed API Keys & security issues or security vulnerabilities were detected during the scan.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {result.findings.map((finding) => (
                  <div key={finding.id} className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-red-200 dark:border-red-800/50 rounded-xl p-6 shadow-sm">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                          <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white text-lg">{finding.type}</h4>
                          <p className="text-gray-600 dark:text-gray-300">{finding.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="destructive">
                          {finding.severity.toUpperCase()}
                        </Badge>
                        <Badge variant="outline">
                          {finding.confidence}% confidence
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Location</span>
                        <span className="text-sm text-gray-900 dark:text-white">{finding.location}</span>
                        {finding.lineNumber && (
                          <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">(Line {finding.lineNumber})</span>
                        )}
                      </div>
                      
                      <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Detected Value</span>
                        <code className="text-sm bg-white dark:bg-gray-700 px-2 py-1 rounded border dark:border-gray-600 font-mono text-red-600 dark:text-red-400">
                          {finding.value}
                        </code>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg mb-4">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Code Context</span>
                      <code className="text-sm bg-white dark:bg-gray-700 p-3 rounded border dark:border-gray-600 block font-mono text-gray-800 dark:text-gray-200 overflow-x-auto">
                        {finding.context}
                      </code>
                    </div>

                    {finding.recommendation && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 p-4 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          <span className="text-sm font-medium text-blue-900 dark:text-blue-300">Recommended Action</span>
                        </div>
                        <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">{finding.recommendation}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  );
};

export default ScanResultsPage;