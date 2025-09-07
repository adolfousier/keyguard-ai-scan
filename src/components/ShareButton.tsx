import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Share, 
  Twitter, 
  Linkedin, 
  Facebook, 
  Copy, 
  Check,
  Link
} from "lucide-react";
import { ScanResult } from "@/types/scan";
import { analytics } from "@/lib/analytics";
import { toast } from "@/hooks/use-toast";

interface ShareButtonProps {
  result: ScanResult;
  size?: "sm" | "default" | "lg";
  variant?: "default" | "outline" | "secondary" | "ghost";
}

export const ShareButton = ({ result, size = "sm", variant = "outline" }: ShareButtonProps) => {
  const [copied, setCopied] = useState(false);

  const shareUrl = `${window.location.origin}/scan-results?id=${result.id}`;
  const shareTitle = `Security Scan Results for ${result.url}`;
  const shareDescription = `Found ${result.summary.total} security findings. ${
    result.summary.total === 0 
      ? "✅ No vulnerabilities detected!" 
      : `⚠️ ${result.summary.critical + result.summary.high} high priority issues found.`
  }`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      analytics.trackResultsShared();
      toast({
        title: "Link Copied!",
        description: "Scan results URL has been copied to clipboard.",
      });
    } catch (err) {
      console.error('Failed to copy:', err);
      toast({
        title: "Copy Failed",
        description: "Unable to copy link to clipboard.",
        variant: "destructive",
      });
    }
  };

  const shareToTwitter = () => {
    const text = encodeURIComponent(`${shareTitle}\n\n${shareDescription}\n\nScan powered by KeyGuard AI`);
    const url = encodeURIComponent(shareUrl);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
    analytics.trackResultsShared();
  };

  const shareToLinkedIn = () => {
    const url = encodeURIComponent(shareUrl);
    const title = encodeURIComponent(shareTitle);
    const summary = encodeURIComponent(shareDescription);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}&title=${title}&summary=${summary}`, '_blank');
    analytics.trackResultsShared();
  };

  const shareToFacebook = () => {
    const url = encodeURIComponent(shareUrl);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
    analytics.trackResultsShared();
  };

  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareDescription,
          url: shareUrl,
        });
        analytics.trackResultsShared();
      } catch (err) {
        // User cancelled or share failed
        console.log('Share cancelled or failed:', err);
      }
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size}>
          <Share className="h-4 w-4 mr-2" />
          Share
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-2 border-b">
          <p className="text-sm font-medium text-gray-900 dark:text-white">Share Scan Results</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Share this security analysis with others
          </p>
        </div>

        <DropdownMenuItem onClick={copyToClipboard} className="cursor-pointer">
          <div className="flex items-center space-x-3 w-full">
            {copied ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Link className="h-4 w-4" />
            )}
            <div className="flex-1">
              <span className="text-sm font-medium">
                {copied ? 'Copied!' : 'Copy Link'}
              </span>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Copy URL to clipboard
              </p>
            </div>
          </div>
        </DropdownMenuItem>

        {navigator.share && (
          <DropdownMenuItem onClick={nativeShare} className="cursor-pointer">
            <div className="flex items-center space-x-3 w-full">
              <Share className="h-4 w-4" />
              <div className="flex-1">
                <span className="text-sm font-medium">Share</span>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Use device share menu
                </p>
              </div>
            </div>
          </DropdownMenuItem>
        )}

        <div className="border-t my-1"></div>

        <DropdownMenuItem onClick={shareToTwitter} className="cursor-pointer">
          <div className="flex items-center space-x-3 w-full">
            <Twitter className="h-4 w-4 text-blue-500" />
            <div className="flex-1">
              <span className="text-sm font-medium">Twitter</span>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Share on X (Twitter)
              </p>
            </div>
          </div>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={shareToLinkedIn} className="cursor-pointer">
          <div className="flex items-center space-x-3 w-full">
            <Linkedin className="h-4 w-4 text-blue-700" />
            <div className="flex-1">
              <span className="text-sm font-medium">LinkedIn</span>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Share on LinkedIn
              </p>
            </div>
          </div>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={shareToFacebook} className="cursor-pointer">
          <div className="flex items-center space-x-3 w-full">
            <Facebook className="h-4 w-4 text-blue-600" />
            <div className="flex-1">
              <span className="text-sm font-medium">Facebook</span>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Share on Facebook
              </p>
            </div>
          </div>
        </DropdownMenuItem>

        <div className="px-2 py-2 border-t">
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="text-xs">
              {result.summary.total} findings
            </Badge>
            <Badge 
              variant={result.summary.total === 0 ? "secondary" : "destructive"} 
              className="text-xs"
            >
              {result.summary.total === 0 ? "Secure" : "Issues Found"}
            </Badge>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};