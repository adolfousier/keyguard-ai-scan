import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Shield, 
  ArrowLeft, 
  Download, 
  Share, 
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

const ScanResultsPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const scanId = searchParams.get('id');
  const [result, setResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!scanId) {
      navigate('/');
      return;
    }

    const fetchResult = async () => {
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
      } catch (err) {
        setError('Failed to load scan results');
        console.error('Error fetching scan result:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [scanId, navigate]);

  const copyAIResponse = () => {
    if (result?.aiRecommendations) {
      navigator.clipboard.writeText(result.aiRecommendations);
      toast({
        title: "Copied!",
        description: "AI analysis copied to clipboard",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading scan results...</p>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6 text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Error Loading Results</h2>
            <p className="text-gray-600 mb-4">{error || 'Scan results not found'}</p>
            <Button onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Scanner
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button variant="outline" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            New Scan
          </Button>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm">
              <Share className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </div>

        {/* Summary Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-6 w-6 text-blue-600" />
              <span>Security Scan Results</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{result.summary.total}</div>
                <div className="text-sm text-gray-600">Total Findings</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {result.summary.critical + result.summary.high}
                </div>
                <div className="text-sm text-gray-600">High Priority</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {result.summary.medium + result.summary.low}
                </div>
                <div className="text-sm text-gray-600">Lower Priority</div>
              </div>
            </div>

            <div className="flex items-center space-x-4 text-sm text-gray-600">
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
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg">
                    <Brain className="h-5 w-5 text-white" />
                  </div>
                  <span>AI Security Analysis</span>
                  <Badge className="bg-gradient-to-r from-purple-500 to-blue-500 text-white">
                    Powered by AI
                  </Badge>
                </CardTitle>
                <Button variant="outline" size="sm" onClick={copyAIResponse}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Analysis
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 rounded-xl p-6 border border-purple-200">
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown
                    components={{
                      h1: ({node, ...props}) => (
                        <h1 className="text-2xl font-bold text-gray-900 mb-4 pb-2 border-b border-purple-200" {...props} />
                      ),
                      h2: ({node, ...props}) => (
                        <h2 className="text-xl font-semibold text-gray-800 mb-3 mt-6 flex items-center" {...props}>
                          <div className="w-1 h-6 bg-gradient-to-b from-purple-500 to-blue-500 rounded-full mr-3"></div>
                          {props.children}
                        </h2>
                      ),
                      h3: ({node, ...props}) => (
                        <h3 className="text-lg font-medium text-gray-700 mb-2 mt-4 flex items-center" {...props}>
                          <div className="w-2 h-2 bg-purple-400 rounded-full mr-2"></div>
                          {props.children}
                        </h3>
                      ),
                      p: ({node, ...props}) => (
                        <p className="text-gray-700 mb-3 leading-relaxed" {...props} />
                      ),
                      ul: ({node, ...props}) => (
                        <ul className="space-y-2 mb-4" {...props} />
                      ),
                      ol: ({node, ...props}) => (
                        <ol className="space-y-2 mb-4" {...props} />
                      ),
                      li: ({node, ...props}) => (
                        <li className="text-gray-700 flex items-start" {...props}>
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
                          <code className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm font-mono" {...props} />
                        );
                      },
                      blockquote: ({node, ...props}) => (
                        <div className="border-l-4 border-purple-400 bg-purple-50 pl-4 py-3 rounded-r-lg mb-4">
                          <blockquote className="text-purple-800 italic" {...props} />
                        </div>
                      ),
                      strong: ({node, ...props}) => (
                        <strong className="font-semibold text-gray-900 bg-yellow-100 px-1 rounded" {...props} />
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
        <Card>
          <CardHeader>
            <CardTitle>Security Findings</CardTitle>
          </CardHeader>
          <CardContent>
            {result.findings.length === 0 ? (
              <div className="text-center py-8">
                <div className="bg-green-100 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <CheckCircle className="h-10 w-10 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Security Issues Found</h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  Excellent! No exposed API keys or security vulnerabilities were detected during the scan.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {result.findings.map((finding) => (
                  <div key={finding.id} className="bg-white border border-red-200 rounded-xl p-6 shadow-sm">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-red-100 rounded-lg">
                          <AlertTriangle className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 text-lg">{finding.type}</h4>
                          <p className="text-gray-600">{finding.description}</p>
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
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <span className="text-sm font-medium text-gray-700 block mb-1">Location</span>
                        <span className="text-sm text-gray-900">{finding.location}</span>
                        {finding.lineNumber && (
                          <span className="text-sm text-gray-500 ml-2">(Line {finding.lineNumber})</span>
                        )}
                      </div>
                      
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <span className="text-sm font-medium text-gray-700 block mb-1">Detected Value</span>
                        <code className="text-sm bg-white px-2 py-1 rounded border font-mono text-red-600">
                          {finding.value}
                        </code>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-3 rounded-lg mb-4">
                      <span className="text-sm font-medium text-gray-700 block mb-2">Code Context</span>
                      <code className="text-sm bg-white p-3 rounded border block font-mono text-gray-800 overflow-x-auto">
                        {finding.context}
                      </code>
                    </div>

                    {finding.recommendation && (
                      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <Shield className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-900">Recommended Action</span>
                        </div>
                        <p className="text-sm text-blue-800 leading-relaxed">{finding.recommendation}</p>
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
  );
};

export default ScanResultsPage;