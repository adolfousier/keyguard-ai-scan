import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Brain, Zap, BarChart3, Globe, Cpu } from "lucide-react";

const FeaturesSection = () => {
  const features = [
    {
      icon: Lock,
      title: "Advanced Detection",
      description: "Detects API keys from 100+ services including AWS, Google Cloud, GitHub, Stripe, and many more",
      color: "text-blue-600"
    },
    {
      icon: Brain,
      title: "AI-Powered Analysis",
      description: "Machine learning algorithms provide intelligent recommendations to secure your exposed credentials",
      color: "text-purple-600"
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Complete security scans in seconds with real-time progress tracking and instant results",
      color: "text-yellow-600"
    },
    {
      icon: BarChart3,
      title: "Detailed Reports",
      description: "Comprehensive security reports with severity levels, recommendations, and actionable insights",
      color: "text-green-600"
    },
    {
      icon: Globe,
      title: "Deep Web Crawling",
      description: "Scans not just the main page but crawls through your entire website structure for hidden keys",
      color: "text-cyan-600"
    },
    {
      icon: Cpu,
      title: "Open Source",
      description: "Fully open-source with transparent algorithms - inspect, modify, and contribute to the codebase",
      color: "text-red-600"
    }
  ];

  return (
    <section className="py-12 px-4" id="features">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Comprehensive Security Scanning
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Protect your applications with enterprise-grade security scanning powered by AI and machine learning
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card 
              key={index}
              className="group hover:shadow-2xl transition-all duration-300 border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm hover:scale-105"
            >
              <CardHeader className="text-center pb-4">
                <div className={`mx-auto p-4 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 w-fit mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className={`h-8 w-8 ${feature.color}`} />
                </div>
                <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-center">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;