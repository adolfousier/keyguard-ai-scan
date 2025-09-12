
# KeyGuard AI Scan

## Overview

KeyGuard AI Scan is a comprehensive, open-source security tool that performs deep website secutity audit, detecting exposed API keys, security vulnerabilities, and providing AI-powered recommendations with any OpenAI compatible endpoint for remediation. Built with modern technologies and designed for both developers and security teams, it helps identify and fix security exposures, technology stack vulnerabilities, and architectural security issues that could lead to security breaches.

## 🚀 Features

### 🔍 Comprehensive Security Scanning
- **Real-time Website Scanning**: Progressive scan with live updates and detailed progress tracking
- **Deep Multi-Layer Analysis**: Scans HTML, JavaScript, CSS, inline scripts, and external resources
- **100+ API Key Types**: Detects AWS, Google Cloud, GitHub, Stripe, OpenAI, Discord, Slack, and many more
- **Advanced Pattern Matching**: Regex patterns with entropy analysis and confidence scoring
- **Context-Aware Detection**: Distinguishes between real keys and test/dummy values
- **Technology Stack Analysis**: Identifies frameworks (React, Vue, Angular), build tools (Webpack, Vite), and libraries
- **Third-Party Service Detection**: Discovers integrated services (Google Analytics, Stripe, Sentry, Hotjar)
- **Security Architecture Assessment**: Analyzes external resources, API endpoints, form actions, and meta tags
- **Framework-Specific Vulnerabilities**: Tailored security checks based on detected technology stack

### 🛡️ Active Vulnerability Testing
- **Security Headers Analysis**: Tests for CSP, HSTS, X-Frame-Options, and other critical security headers
- **Information Disclosure Detection**: Identifies sensitive data exposure in error pages and responses
- **Directory Traversal Testing**: Safe read-only checks for exposed sensitive files (.env, config files, etc.)
- **Debug Endpoint Discovery**: Detects publicly accessible development and debug endpoints
- **CORS Configuration Validation**: Tests Cross-Origin Resource Sharing policies for misconfigurations
- **SSL/TLS Security Assessment**: Validates HTTPS implementation and HTTP-to-HTTPS redirects
- **Server Misconfiguration Detection**: Identifies information disclosure through server headers
- **Security Score Calculation**: Comprehensive scoring system (0-100) based on all security findings
- **Compliance Status Checking**: OWASP, SSL/TLS, and overall security posture assessment

### 🤖 AI-Powered Security Intelligence
- **Smart Recommendations**: NEURA_ROUTER or any OpenAI SDK compatible integration for context-aware security audit
- **Comprehensive Security Assessment**: Analyzes technology stack, architecture patterns, and security implementations
- **Vulnerability Test Analysis**: AI interprets active security test results and prioritizes remediation
- **Severity Classification**: Automatic risk assessment (Critical, High, Medium, Low) with confidence scoring
- **Actionable Remediation**: Detailed, step-by-step fix instructions with immediate and long-term actions
- **Modern Security Best Practices**: 2025 security guidelines including CSP, SRI, HTTPS, secure headers
- **Framework-Specific Guidance**: Tailored recommendations for React/Next.js, Vue.js, Angular, and static sites
- **Technology-Aware Analysis**: Custom security advice based on detected frameworks, build tools, and services
- **Architecture Security Review**: Recommendations for API security, third-party integrations, and data flow
- **Compliance Guidance**: OWASP, GDPR, and industry standard compliance recommendations
- **Security Score Interpretation**: Detailed analysis of security posture with prioritized improvement roadmap

### 📊 Professional Reporting
- **Interactive Dashboard**: Visual reporting with findings breakdown and security score display
- **Comprehensive Security Reports**: Detailed vulnerability test results with pass/fail status
- **Export Options**: PDF, JSON, CSV report generation with full security analysis
- **Shareable Results**: Secure sharing of scan results with executive summaries
- **Historical Tracking**: User account with scan history and security score trends
- **Real-time Progress**: Live updates during scanning process with active testing phases
- **Compliance Reporting**: OWASP, SSL/TLS, and security posture compliance status
- **Executive Summaries**: High-level security overview for management and stakeholders

### 🔐 Enterprise Security
- **User Authentication**: JWT-based secure sessions
- **Rate Limiting**: Protection against abuse
- **Data Privacy**: No permanent storage of sensitive data
- **HTTPS Encryption**: All communications encrypted
- **Audit Logging**: Comprehensive activity tracking

## 🏗️ Architecture

### Frontend Stack
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and builds
- **Styling**: Tailwind CSS + Shadcn/ui components
- **State Management**: TanStack Query for server state
- **Icons**: Lucide React for consistent iconography

### Backend Stack
- **Language**: Rust for performance and safety
- **Database**: LibSQL for lightweight, fast data storage
- **Web Framework**: Axum for async HTTP services
- **Authentication**: JWT with bcrypt password hashing
- **AI Integration**: NEURA_ROUTER (OpenAI SDK compatible) with enhanced secutity audit
- **HTTP Client**: Reqwest for comprehensive web content analysis
- **Security Engine**: Advanced pattern matching with entropy analysis and technology detection
- **Content Parser**: HTML/CSS/JavaScript analysis with framework and library detection
- **Vulnerability Testing Engine**: Active security testing with 7+ comprehensive test categories
- **Security Scoring System**: Automated security posture assessment with compliance checking

### Infrastructure
- **Containerization**: Docker with multi-stage builds
- **Orchestration**: Docker Compose for local development
- **Ports**: Frontend (11111), Backend (11112)
- **Database**: Persistent LibSQL with file-based storage (production-ready for scaling)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Rust 1.75+ (for backend development)
- Docker and Docker Compose (recommended)

### Using Docker (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd keyguard-ai-scan
   ```

2. **Set environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your NEURA_ROUTER_API_KEY
   ```

3. **Start the services**
   ```bash
   docker-compose up --build
   ```

4. **Access the application**
   - Frontend: http://localhost:11111
   - Backend API: http://localhost:11112

### Manual Development Setup

#### Frontend Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

#### Backend Setup
```bash
# Navigate to server directory
cd server

# Build and run
cargo run
```

## 🔧 Configuration

### Environment Variables

#### Frontend (.env)
```bash
VITE_API_URL=http://localhost:11112
```

#### Backend (server/.env)
```bash
JWT_SECRET=your-secure-jwt-secret
NEURA_ROUTER_API_KEY=your-neura-router-api-key
NEURA_ROUTER_API_URL=https://api.neura-router.com/v1
RUST_LOG=info
```

### Open AI Compatible API Keys Setup

1. **NEURA_ROUTER Integration**
   - Sign up at Neura Router or use your favotive AI platform
   - Generate API key
   - Add to environment variables

2. **Production Deployment**
   - Use strong JWT secret (32+ characters)
   - Enable HTTPS in production
   - Configure proper CORS origins

## 📖 API Documentation

### Core Endpoints

#### Scanning
- `POST /api/scan` - Start new scan
- `GET /api/scan/:id` - Get scan results
- `GET /api/scan/:id/progress` - Get scan progress

#### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/user/scans` - Get user's scan history

#### Health
- `GET /api/health` - Service health check

### Request/Response Examples

#### Start Scan
```json
POST /api/scan
{
  "url": "https://example.com",
  "user_id": "optional-user-id"
}
```

#### Scan Response
```json
{
  "success": true,
  "data": {
    "id": "scan-uuid",
    "url": "https://example.com",
    "status": "scanning",
    "findings": [],
    "summary": {
      "critical": 0,
      "high": 0,
      "medium": 0,
      "low": 0,
      "total": 0
    },
    "security_analysis": {
      "frameworks": ["React", "Next.js"],
      "technologies": ["Webpack", "Tailwind CSS"],
      "third_party_services": ["Google Analytics", "Stripe"],
      "potential_endpoints": ["/api/users", "/api/auth"],
      "external_resources": ["https://cdn.example.com/script.js"],
      "form_actions": ["/api/contact"],
      "meta_tags": {"viewport": "width=device-width"},
      "vulnerability_tests": [
        {
          "test_name": "CSP Header",
          "status": "fail",
          "severity": "medium",
          "description": "Content Security Policy header missing",
          "recommendation": "Implement CSP header to prevent XSS attacks"
        }
      ],
      "security_score": 75,
      "compliance_status": {
        "OWASP": "Partial",
        "SSL/TLS": "Good",
        "Security Posture": "Fair"
      }
    },
    "ai_recommendations": "Comprehensive security audit with vulnerability analysis..."
  }
}
```

## 🧪 Testing

### Frontend Testing
```bash
npm run test
npm run test:coverage
```

### Backend Testing
```bash
cd server
cargo test
cargo test --release
```

### Integration Testing
```bash
docker-compose -f docker-compose.test.yml up --build
```

## 🚀 Deployment

### Production Docker Build
```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Deploy to production
docker-compose -f docker-compose.prod.yml up -d
```

### Manual Production Setup
1. Build frontend: `npm run build`
2. Build backend: `cd server && cargo build --release`
3. Configure reverse proxy (nginx/traefik)
4. Set up SSL certificates
5. Configure monitoring and logging

## 🔐 Security Considerations

### Data Privacy
- **No Permanent Storage**: Scan results stored temporarily
- **Encryption**: All data transmission via HTTPS
- **User Control**: Clear data retention policies
- **Anonymization**: No PII stored without consent

### Comprehensive Security Audit
- **Multi-Layer Scanning**: Analyzes HTML, JavaScript, CSS, and external resources
- **Active Vulnerability Testing**: 7+ categories of security tests including headers, CORS, SSL/TLS
- **Technology Stack Assessment**: Framework and library security evaluation
- **Third-Party Risk Analysis**: Evaluates security implications of integrated services
- **Architecture Security Review**: API endpoints, external dependencies, and data flow analysis
- **Modern Security Standards**: 2025 best practices including CSP, SRI, and secure headers
- **Security Scoring**: Automated assessment with 0-100 security score and compliance status
- **Information Disclosure Testing**: Safe detection of sensitive file exposure and debug endpoints

### Scanning Ethics
- **Rate Limiting**: Prevents abuse of target websites
- **Robots.txt**: Respects website scanning preferences
- **Legal Compliance**: GDPR, CCPA compliant
- **Responsible Disclosure**: Security-focused approach
- **Non-Intrusive Analysis**: Read-only content analysis without active exploitation

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

### Code Standards
- **Frontend**: ESLint + Prettier configuration
- **Backend**: Rustfmt + Clippy linting
- **Testing**: Minimum 80% code coverage
- **Documentation**: Comprehensive inline docs

## 📊 Analytics & Monitoring

### Built-in Analytics
- **Scan Metrics**: Success rates, duration, findings
- **User Behavior**: Feature usage, engagement patterns
- **Performance**: Response times, error rates
- **Security**: Vulnerability trends, detection accuracy

### Monitoring Stack
- **Logging**: Structured logs with tracing
- **Metrics**: Custom metrics for business KPIs
- **Alerting**: Error rate and performance alerts
- **Health Checks**: Automated service monitoring

## 🆘 Support

### Documentation
- **API Reference**: Comprehensive endpoint documentation
- **Developer Guide**: Setup and customization instructions
- **Security Guide**: Best practices and compliance
- **Troubleshooting**: Common issues and solutions

### Community
- **Issues**: GitHub Issues for bug reports
- **Discussions**: Feature requests and questions
- **Discord**: Real-time community support
- **Security**: security@keyguard.dev for vulnerabilities

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📝 Changelog

### v0.2.1 (2025-09-12)
- **Active Vulnerability Testing Engine**: Comprehensive security testing with 7+ test categories including security headers, information disclosure, directory traversal, debug endpoints, CORS, SSL/TLS, and server misconfigurations
- **Security Scoring System**: Automated 0-100 security score calculation based on API key findings and vulnerability test results
- **Compliance Assessment**: OWASP, SSL/TLS, and overall security posture compliance checking with detailed status reporting
- **Enhanced AI Security Analysis**: Updated AI system to interpret active vulnerability test results and provide prioritized remediation recommendations
- **Modular Security Testing Architecture**: Organized security tests into dedicated module (security_tests.rs) for maintainability and extensibility
- **Advanced Security Headers Testing**: Comprehensive analysis of CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, and Permissions-Policy headers
- **Safe Information Disclosure Detection**: Non-intrusive testing for sensitive data exposure in error pages and debug information
- **Directory Traversal Protection Validation**: Read-only checks for exposed sensitive files (.env, config.json, .git/config, etc.)
- **CORS Security Validation**: Preflight request testing to identify overly permissive CORS configurations
- **SSL/TLS Implementation Assessment**: HTTPS enforcement and HTTP-to-HTTPS redirect validation
- **Server Fingerprinting Protection**: Detection of information disclosure through server headers and technology stack exposure
- **Executive Security Reporting**: Enhanced reporting with security scores, compliance status, and prioritized remediation roadmaps

### v0.2.0 (2025-09-11)
- **Comprehensive Secutity Audit Engine**: Completely redesigned scanning engine to detect not just API keys but comprehensive security vulnerabilities and architectural issues
- **Technology Stack Detection**: Advanced detection of frameworks (React, Vue, Angular, Next.js), build tools (Webpack, Vite), CSS frameworks (Tailwind, Bootstrap), and JavaScript libraries
- **Third-Party Service Analysis**: Identifies and analyzes security implications of integrated services (Google Analytics, Stripe, Sentry, Hotjar, Mixpanel, Cloudflare)
- **Security Architecture Assessment**: Deep analysis of external resources, potential API endpoints, form actions, meta tags, and security headers
- **Enhanced AI Security Expert**: Upgraded AI system prompt with 2025 modern security best practices including CSP, SRI, HTTPS everywhere, secure headers, and zero-trust architecture
- **Framework-Specific Security Recommendations**: Tailored security advice based on detected technology stack (React XSS prevention, Vue template injection, Angular sanitization)
- **Advanced Pattern Matching**: Improved API key detection with 20+ service patterns, entropy analysis, and confidence scoring
- **Comprehensive Content Analysis**: Enhanced scanning of HTML content, inline scripts, external JavaScript/CSS files with detailed security context
- **Security Context Extraction**: Intelligent extraction of security-relevant information including potential endpoints, external dependencies, and technology fingerprinting
- **Professional Security Reporting**: Detailed secutity audit reports with technology stack breakdown, vulnerability assessment, and prioritized remediation steps

### v0.1.9 (2025-09-10)
- **Real Backend Integration**: Replaced all mockup data and frontend scanning with real Rust backend API integration
- **Enhanced User Experience**: Added Enter key support to both scan forms for faster form submission
- **Code Cleanup**: Removed unused mockup files (scanner.ts, ai-recommendations.ts, HeroSection.tsx) for cleaner codebase
- **Navigation Improvements**: Made navigation logo clickable to return to main page with hover effects
- **Frontend Optimization**: Fixed scan form to use actual backend API calls instead of test navigation
- **Production Ready**: Eliminated all mock data ensuring real scan counts and authentic results
- **Error Handling**: Improved error handling with proper user feedback during scan failures
- **Performance**: Streamlined frontend by removing duplicate components and unused code

### v0.1.8 (2025-09-10)
- **Persistent Database Storage**: Fixed shared scan result URLs not persisting after app restart by switching from in-memory to file-based database storage
- **Docker Volume Integration**: Added persistent volume mounting for database files in Docker containers to ensure data survives container restarts
- **Environment Configuration**: Added DATABASE_PATH environment variable for configurable database file location
- **Production Deployment**: Enhanced Docker configuration with proper data persistence for production environments
- **Database File Management**: Added database files to .gitignore to prevent committing persistent data
- **Container Optimization**: Updated Dockerfile to create data directory structure for reliable database storage

### v0.1.7 (2025-09-09)
- **Professional Share & Export System**: Implemented comprehensive modular sharing and export functionality
- **Advanced Export Formats**: Added Markdown, JSON, and CSV export options with branded professional reports
- **Smart Social Sharing**: Integrated Twitter/X, LinkedIn, Facebook sharing with branded previews and security status
- **Dark Mode Optimization**: Fixed AI Secutity Audit white background issues for complete dark mode compatibility
- **Docker Networking Fixes**: Resolved production deployment networking issues between frontend and backend containers
- **Enhanced Reporting**: Comprehensive markdown reports with executive summaries, findings breakdowns, and AI recommendations
- **Clipboard Integration**: One-click URL copying with native device sharing support
- **Analytics Integration**: Added tracking for sharing and export events to understand user engagement
- **Modular Architecture**: Created reusable ShareButton and ExportButton components for easy maintenance
- **Professional Branding**: Consistent KeyGuard branding across all shared content and exported reports

### v0.1.6
- **Complete Frontend Architecture Overhaul**: Completely reorganized landing page into modular, maintainable components
- **Modern Navigation System**: Implemented sticky navigation with glassmorphism design, backdrop blur, and automatic dark mode detection
- **Responsive Hero Layout**: Combined hero section and scan form into elegant desktop side-by-side layout with mobile-first responsive design
- **Component Organization**: Split landing page into dedicated components (HeroWithScanForm, FeaturesSection, CTASection, Footer) for better maintainability
- **Dark Mode Implementation**: Added automatic system preference detection with seamless light/dark mode switching across all components
- **Enhanced User Experience**: Improved spacing, visual hierarchy, and interactive elements with smooth animations and transitions
- **Docker Build Optimization**: Fixed Rust version compatibility issues and OpenSSL static linking for musl targets
- **Production Configuration**: Updated Vite config with proper host allowlist and TypeScript error resolution
- **API Client Improvements**: Enhanced production/development URL handling with automatic environment detection
- **Build System Fixes**: Resolved TypeScript compilation errors and improved development workflow

### v0.1.5
- **Domain Updates**: Updated all URLs to keyguard.meetneura.ai domain
- **Date Corrections**: Fixed all dates to current date (2025-09-07)
- **Security.txt Updates**: Extended expiration to 2026-09-07
- **Contact Information**: Updated to security@meetneura.ai
- **Sitemap Refresh**: Updated lastmod dates to current
- **Humans.txt Updates**: Refreshed team information and dates

### v0.1.4
- **SEO Optimization**: Added comprehensive OpenGraph meta tags and Twitter cards
- **Search Engine Enhancement**: Implemented structured data (JSON-LD) for better search visibility
- **Sitemap Integration**: Added XML sitemap for improved search engine crawling
- **PWA Support**: Added web app manifest for progressive web app capabilities
- **Social Media Ready**: Optimized og.png image integration for social sharing
- **Meta Tags Enhancement**: Added proper keywords, canonical URLs, and theme colors
- **Robots.txt Optimization**: Updated with sitemap reference and proper crawling directives
- **Mobile Optimization**: Enhanced viewport and mobile-first meta configurations

### v0.1.3
- **Critical Bug Fixes**: Fixed non-functional scan button and navigation issues
- **UI/UX Improvements**: Added real-time scanning progress with visual progress bar
- **Results Display**: Fixed scan results page to properly show AI recommendations and findings
- **Navigation Flow**: Implemented proper scan-to-results page flow with loading states
- **Polling System**: Added automatic result polling for real-time scan status updates
- **Error Handling**: Improved error handling and user feedback during scan failures
- **Performance**: Optimized frontend-backend communication and state management

### v0.1.2
- **Enhanced AI Integration**: Improved NEURA_ROUTER integration with better error handling
- **Backend Improvements**: Enhanced scanner module with better pattern matching
- **Database Optimizations**: Improved LibSQL integration and query performance
- **Authentication Enhancements**: Strengthened JWT handling and user session management
- **Frontend Updates**: Better AI recommendations display and user experience
- **Configuration**: Updated environment variables and API endpoints
- **Build System**: Improved Vite configuration and development workflow
- **Security**: Enhanced input validation and sanitization

### v0.1.1
- README documentation updates
- Minor bug fixes and improvements

### v0.1.0
- Initial release with core scanning functionality
- Basic AI-powered recommendations
- User authentication system
- Docker containerization

## 🙏 Acknowledgments

- **Shadcn/ui**: Beautiful, accessible React components
- **NEURA_ROUTER**: AI-powered recommendation engine
- **Rust Community**: Amazing ecosystem and libraries
- **Security Researchers**: Vulnerability patterns and best practices

---

**KeyGuard AI Scan** - Securing the web, one API key at a time. 🔐✨
