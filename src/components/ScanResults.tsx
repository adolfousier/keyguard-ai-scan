
import { ScanResult } from "@/types/scan";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  AlertTriangle, 
  Shield, 
  Clock,
  MapPin,
  TrendingUp,
  CheckCircle,
  XCircle,
  Brain,
  Copy
} from "lucide-react";
import { useState } from "react";
import { AIRecommendations } from "./AIRecommendations";
import { ShareButton } from "./ShareButton";
import { ExportButton } from "./ExportButton";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ScanResultsProps {
  result: ScanResult;
  onNewScan: () => void;
}

export const ScanResults = ({ result, onNewScan }: ScanResultsProps) => {
  const [showRecommendations, setShowRecommendations] = useState(false);
  
  // Debug logging
  console.log('ScanResults received:', {
    aiRecommendations: result.aiRecommendations,
    aiRecommendationsLength: result.aiRecommendations?.length,
    status: result.status,
    findings: result.findings.length
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-black';
      case 'low': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <XCircle className="h-4 w-4" />;
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      case 'medium': return <AlertTriangle className="h-4 w-4" />;
      case 'low': return <CheckCircle className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };


  if (result.status === 'failed') {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-red-600">
            <XCircle className="h-6 w-6" />
            <span>Scan Failed</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            Unable to complete the scan for {result.url}. Please check the URL and try again.
          </p>
          <Button onClick={onNewScan}>Try Again</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-6 w-6 text-blue-600" />
              <span>Scan Results</span>
            </CardTitle>
            <div className="flex space-x-2">
              <ExportButton result={result} />
              <ShareButton result={result} />
            </div>
          </div>
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

          {result.aiRecommendations && (
            <div className="mt-4">
              <Button 
                onClick={() => setShowRecommendations(!showRecommendations)}
                className="w-full"
                variant={showRecommendations ? "outline" : "default"}
              >
                {showRecommendations ? 'Hide' : 'View'} AI Security Audit
              </Button>
            </div>
          )}

          {result.aiRecommendations && (
            <div className="mt-4">
              <Button 
                onClick={() => setShowRecommendations(!showRecommendations)}
                className="w-full"
                variant={showRecommendations ? "outline" : "default"}
              >
                {showRecommendations ? 'Hide' : 'View'} AI Security Audit
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Recommendations */}
      {showRecommendations && result.aiRecommendations && (
        <AIRecommendations 
          recommendations={result.aiRecommendations}
          hasFindings={result.summary.total > 0}
        />
      )}

      {/* AI Recommendations */}
      {showRecommendations && result.aiRecommendations && (
        <AIRecommendations 
          recommendations={result.aiRecommendations}
        />
      )}

      {/* Severity Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Severity Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { level: 'critical', count: result.summary.critical, color: 'red' },
              { level: 'high', count: result.summary.high, color: 'orange' },
              { level: 'medium', count: result.summary.medium, color: 'yellow' },
              { level: 'low', count: result.summary.low, color: 'blue' }
            ].map(({ level, count, color }) => (
              <div key={level} className="text-center p-3 border rounded-lg">
                <div className={`text-2xl font-bold text-${color}-600`}>{count}</div>
                <div className="text-sm capitalize">{level}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Findings List */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Findings & AI Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          {/* AI Recommendations Section */}
          {result.aiRecommendations && result.aiRecommendations.trim() !== "" && (
            <div className="mb-8">
              <div className="flex items-center space-x-2 mb-4">
                <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg">
                  <Brain className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">AI Security Audit</h3>
                <Badge className="bg-gradient-to-r from-purple-500 to-blue-500 text-white">
                  Powered by AI
                </Badge>
              </div>
              
              <div className="bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-gray-800 dark:via-gray-700 dark:to-gray-600 rounded-xl p-6 border border-purple-200 dark:border-gray-600">
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({node, ...props}) => (
                        <h1 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-purple-200" {...props} />
                      ),
                      h2: ({node, ...props}) => (
                        <h2 className="text-lg font-semibold text-gray-800 mb-3 mt-6 flex items-center" {...props}>
                          <div className="w-1 h-6 bg-gradient-to-b from-purple-500 to-blue-500 rounded-full mr-3"></div>
                          {props.children}
                        </h2>
                      ),
                      h3: ({node, ...props}) => (
                        <h3 className="text-base font-medium text-gray-700 mb-2 mt-4 flex items-center" {...props}>
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
                      table: ({node, ...props}) => (
                        <div className="overflow-x-auto my-4">
                          <table className="min-w-full border-collapse border border-gray-300" {...props} />
                        </div>
                      ),
                      thead: ({node, ...props}) => (
                        <thead className="bg-gray-100" {...props} />
                      ),
                      tbody: ({node, ...props}) => (
                        <tbody {...props} />
                      ),
                      tr: ({node, ...props}) => (
                        <tr className="border-b border-gray-200" {...props} />
                      ),
                      th: ({node, ...props}) => (
                        <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-900" {...props} />
                      ),
                      td: ({node, ...props}) => (
                        <td className="border border-gray-300 px-4 py-2 text-gray-700" {...props} />
                      ),
                    }}
                  >
                    {result.aiRecommendations}
                  </ReactMarkdown>
                </div>
                
                <div className="mt-6 flex items-center justify-between pt-4 border-t border-purple-200">
                  <div className="flex items-center space-x-2 text-sm text-purple-600">
                    <Brain className="h-4 w-4" />
                    <span>AI-powered security audit</span>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      navigator.clipboard.writeText(result.aiRecommendations || '');
                    }}
                    className="border-purple-200 text-purple-600 hover:bg-purple-50"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Analysis
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          {/* Findings Section */}
          {result.findings.length === 0 ? (
            <div className="text-center py-8">
              <div className="bg-green-100 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No API Keys Found</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Excellent! No exposed API Keys & security issues were detected during the security scan. 
                Your website follows good security practices.
              </p>
            </div>
          ) : (
            <div>
              <div className="flex items-center space-x-2 mb-6">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                <h3 className="text-lg font-semibold text-gray-900">Security Issues Detected</h3>
                <Badge variant="destructive">{result.findings.length} issues</Badge>
              </div>
              
              <div className="space-y-6">
                {result.findings.map((finding, index) => (
                  <div key={finding.id} className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-red-200 dark:border-red-800/50 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${
                          finding.severity === 'critical' ? 'bg-red-100' :
                          finding.severity === 'high' ? 'bg-orange-100' :
                          finding.severity === 'medium' ? 'bg-yellow-100' : 'bg-blue-100'
                        }`}>
                          {getSeverityIcon(finding.severity)}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 text-lg">{finding.type}</h4>
                          <p className="text-gray-600">{finding.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getSeverityColor(finding.severity)}>
                          {finding.severity.toUpperCase()}
                        </Badge>
                        <Badge variant="outline" className="bg-gray-50">
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
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-center">
        <Button onClick={onNewScan} size="lg">
          Scan Another Website
        </Button>
      </div>
    </div>
  );
};
