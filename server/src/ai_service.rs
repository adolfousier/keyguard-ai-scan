
use serde::{Deserialize, Serialize};
use anyhow::Result;
use reqwest::Client;

use crate::scanner::ApiKeyFinding;
use crate::utils::environment_settings::EnvironmentSettings;

#[derive(Serialize)]
struct AIRequest {
    model: String,
    messages: Vec<Message>,
    max_tokens: u32,
    temperature: f32,
    stream: bool,
}

#[derive(Serialize)]
struct Message {
    role: String,
    content: String,
}

#[derive(Deserialize)]
#[allow(dead_code)]
struct AIResponse {
    choices: Vec<Choice>,
}

#[derive(Deserialize)]
#[allow(dead_code)]
struct Choice {
    message: MessageResponse,
}

#[derive(Deserialize)]
#[allow(dead_code)]
struct MessageResponse {
    content: String,
}

pub struct AIService {
    client: Client,
    api_key: String,
    base_url: String,
    model: String,
}

impl AIService {
    pub fn new() -> Self {
        let settings = EnvironmentSettings::load();
        Self {
            client: Client::new(),
            api_key: settings.neura_router_api_key,
            base_url: settings.neura_router_api_url,
            model: settings.neura_router_api_model,
        }
    }

    pub async fn generate_recommendations(&self, findings: &[ApiKeyFinding], url: &str, content_summary: Option<&str>) -> Result<String> {
        let prompt = if findings.is_empty() {
            println!("📋 No findings detected, calling AI for clean report: {}", url);
            if let Some(content) = content_summary {
                format!(
                    "Analyze this website for security vulnerabilities:\n\n{}\n\nNo API keys found. Provide secutity audit and recommendations.",
                    content
                )
            } else {
                format!("Security scan completed for {}. No API keys found. Provide security recommendations.", url)
            }
        } else {
            println!("🤖 Generating AI recommendations for {} findings", findings.len());
            self.build_prompt(findings, url, content_summary)
        };
        
        // ALWAYS call the real AI service - NO MOCKS, NO FALLBACKS
        println!("🚀 CALLING REAL NEURA_ROUTER API...");
        self.call_ai_service(&prompt).await
    }

    async fn call_ai_service(&self, prompt: &str) -> Result<String> {
        println!("🚀 CALLING AI SERVICE AT: {}", self.base_url);
        println!("🤖 USING MODEL: {}", self.model);
        println!("🔑 API KEY: {}...{} (length: {})", &self.api_key[..10], &self.api_key[self.api_key.len()-10..], self.api_key.len());
        println!("📝 PROMPT: {}", &prompt[..200.min(prompt.len())]);
        
        let request = AIRequest {
            model: self.model.clone(),
            messages: vec![
                Message {
                    role: "system".to_string(),
                    content: "You are a cybersecurity expert specializing in comprehensive web application security audit. You analyze websites for API key leaks, security vulnerabilities, and provide actionable recommendations based on detected technologies, frameworks, security patterns, and active vulnerability testing results.
                    Be careful with API Keys false positives such as '.js' or just numberic with non numberic numbers, you should detect any anomalies from the initial scan.

                    ## Analysis Focus Areas

                    ### 1. API Key & Secret Detection
                    - Identify exposed API Keys & security issues, tokens, and secrets in frontend code
                    - Analyze patterns for 20+ major services (AWS, Google, GitHub, Stripe, etc.)
                    - Assess severity and potential impact of exposed credentials
                    - Provide immediate remediation steps

                    ### 2. Active Vulnerability Testing Results
                    - Security headers analysis (CSP, HSTS, X-Frame-Options, etc.)
                    - Information disclosure in error pages
                    - Directory traversal and sensitive file exposure
                    - Debug/development endpoint exposure
                    - CORS configuration assessment
                    - SSL/TLS configuration validation
                    - Common server misconfigurations
                    - Overall security score and compliance status

                    ### 3. Technology Stack Security Assessment
                    - Framework-specific security recommendations (React, Vue, Angular, Next.js)
                    - Build tool security considerations (Webpack, Vite)
                    - CSS framework vulnerabilities (Tailwind, Bootstrap)
                    - Third-party service integration risks

                    ### 4. Architecture & Implementation Analysis
                    - Client-side security patterns and anti-patterns
                    - API endpoint exposure through frontend code
                    - External resource loading security implications
                    - Form security and CSRF protection
                    - Meta tag security audit

                    ### 5. Modern Security Best Practices (2025)
                    - **Content Security Policy (CSP)**: Implement strict CSP headers to prevent XSS
                    - **Subresource Integrity (SRI)**: Use SRI for all external resources
                    - **HTTPS Everywhere**: Ensure all resources load over HTTPS
                    - **Secure Headers**: Implement security headers (HSTS, X-Frame-Options, etc.)
                    - **API Security**: Follow OWASP API Security Top 10
                    - **Supply Chain Security**: Monitor and audit all dependencies
                    - **Zero-Trust Architecture**: Never trust, always verify
                    - **Runtime Security**: Implement runtime application self-protection

                    ### 6. Framework-Specific Security
                    - **React/Next.js**: XSS prevention, server-side rendering security, hydration attacks
                    - **Vue.js**: Template injection, directive security
                    - **Angular**: Sanitization, dependency injection security
                    - **Static Sites**: CDN security, build-time vulnerabilities

                    ### 7. Third-Party Service Security
                    - Analytics tracking privacy implications
                    - CDN security considerations
                    - Payment processor integration security
                    - Social media integration risks
                    - Error tracking service data exposure

                    ### 8. Vulnerability Test Analysis
                    - Interpret active security test results with specific details
                    - Extract and highlight specific files, paths, or configurations found
                    - Prioritize failed tests by severity and impact
                    - Provide specific remediation for each failed test with exact file paths
                    - Explain compliance implications (OWASP, GDPR, etc.)
                    - Recommend security monitoring and detection strategies
                    - When reporting file exposure, always specify which exact files were found accessible

                    ## Response Format
                    Provide comprehensive, prioritized recommendations with:
                    1. **Executive Summary** - Overall security posture and key findings
                    2. **Critical Issues** - Failed security tests requiring immediate attention
                    3. **API Key Findings** - Exposed credentials and remediation steps
                    4. **Security Configuration** - Header and server configuration improvements
                    5. **Technology-Specific Recommendations** - Based on detected stack
                    6. **Architecture Improvements** - Long-term security enhancements
                    7. **Compliance & Standards** - Industry best practices and compliance status
                    8. **Monitoring & Detection** - Ongoing security measures

                    Always provide specific, actionable steps tailored to the detected technology stack, failed security tests, and security findings. Include security score interpretation and prioritized remediation roadmap.
                ".to_string(),
                },
                Message {
                    role: "user".to_string(),
                    content: prompt.to_string(),
                },
            ],
            max_tokens: 262100,
            temperature: 0.7,
            stream: true,
        };

        let url = format!("{}/chat/completions", self.base_url);
        println!("📡 MAKING REQUEST TO: {}", url);
        println!("📦 REQUEST PAYLOAD: {}", serde_json::to_string_pretty(&request).unwrap_or_else(|_| "Failed to serialize".to_string()));
        
        let response = self.client
            .post(&url)
            .header("Authorization", format!("Bearer {}", self.api_key))
            .header("Content-Type", "application/json")
            .json(&request)
            .send()
            .await?;

        let status = response.status();
        println!("📊 RESPONSE STATUS: {}", status);
        
        if !status.is_success() {
            let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
            println!("❌ AI SERVICE ERROR RESPONSE: {}", error_text);
            return Err(anyhow::anyhow!("AI service request failed with status: {} - {}", status, error_text));
        }

        let response_text = response.text().await?;
        println!("📨 RAW RESPONSE: {}", &response_text[..response_text.len().min(200)]);
        
        // NEURA_ROUTER always returns streaming data, parse it directly
        self.parse_streaming_response(&response_text)
    }

    fn parse_streaming_response(&self, response_text: &str) -> Result<String> {
        let mut content = String::new();
        println!("🔍 Parsing streaming response with {} lines", response_text.lines().count());
        
        for (i, line) in response_text.lines().enumerate() {
            if line.starts_with("data: ") {
                let data_part = line[6..].trim(); // Remove "data: " prefix and trim
                
                if data_part == "[DONE]" {
                    println!("✅ Found [DONE] marker at line {}", i);
                    break;
                }
                
                if data_part.is_empty() {
                    continue;
                }
                
                match serde_json::from_str::<serde_json::Value>(data_part) {
                    Ok(json) => {
                        if let Some(choices) = json.get("choices").and_then(|c| c.as_array()) {
                            if let Some(choice) = choices.first() {
                                if let Some(delta) = choice.get("delta").and_then(|d| d.as_object()) {
                                    if let Some(text) = delta.get("content").and_then(|c| c.as_str()) {
                                        content.push_str(text);
                                        print!("{}", text);
                                    }
                                }
                            }
                        }
                    },
                    Err(e) => {
                        println!("⚠️ Failed to parse JSON chunk at line {}: {} - Data: {}", i, e, data_part);
                        continue;
                    }
                }
            }
        }
        
        println!(""); // New line after streaming output
        
        if content.is_empty() {
            println!("⚠️ No content extracted from streaming response");
            Ok("# Security Audit\n\nThe AI service returned an empty response. This could indicate:\n\n1. **API Configuration Issue** - Check your NEURA_ROUTER API key and model settings\n2. **Rate Limiting** - The service may be temporarily unavailable\n3. **Model Issue** - The selected model may not be responding properly\n\n## Recommendations\n\n- Verify your API credentials\n- Try again in a few minutes\n- Check the service status".to_string())
        } else {
            println!("✅ Successfully parsed streaming response, content length: {}", content.len());
            Ok(content)
        }
    }

    fn build_prompt(&self, findings: &[ApiKeyFinding], url: &str, content_summary: Option<&str>) -> String {
        let findings_summary = findings.iter()
            .map(|f| format!("- {} ({}) in {}: {}", f.key_type, f.severity, f.location, f.description))
            .collect::<Vec<_>>()
            .join("\n");

        let content_section = if let Some(content) = content_summary {
            format!("\n\nWebsite Content Analysis:\n{}", content)
        } else {
            String::new()
        };
        
        format!(
            "Security Audit Scan Results for: {}\n\n\
            exposed API Keys & security issues Found:\n{}{}\n\n\
            Please provide:\n\
            1. Immediate remediation steps for each finding\n\
            2. Best practices to prevent future exposures\n\
            3. Security implementation recommendations\n\
            4. Risk assessment and priority guidance\n\
            5. Analysis of the website content for additional security concerns\n\n\
            Format the response in clear sections with actionable steps.",
            url, findings_summary, content_section
        )
    }

    #[allow(dead_code)]
    fn generate_mock_recommendations(&self, findings: &[ApiKeyFinding], url: &str) -> String {
        let has_critical = findings.iter().any(|f| f.severity == "critical");
        let has_high = findings.iter().any(|f| f.severity == "high");
        
        let critical_count = findings.iter().filter(|f| f.severity == "critical").count();
        let high_count = findings.iter().filter(|f| f.severity == "high").count();
        let medium_count = findings.iter().filter(|f| f.severity == "medium").count();
        let low_count = findings.iter().filter(|f| f.severity == "low").count();

        format!(
            "# 🚨 Security Recommendations for {}\n\n\
            ## Immediate Actions Required\n\n\
            {}\n\n\
            ## Remediation Steps\n\n\
            ### 1. Key Rotation Process\n\
            1. **Generate new keys** in your service provider dashboard\n\
            2. **Update environment variables** in your deployment system\n\
            3. **Revoke old keys** only after confirming new keys work\n\
            4. **Monitor logs** for any failed authentication attempts\n\n\
            ### 2. Secure Storage Implementation\n\
            - Use environment variables for all API keys\n\
            - Implement proper secrets management (HashiCorp Vault, AWS Secrets Manager)\n\
            - Never commit keys to version control\n\
            - Use different keys for development, staging, and production\n\n\
            ### 3. Code Security Best Practices\n\
            - Implement proper .gitignore rules for config files\n\
            - Use linting rules to detect potential key exposures\n\
            - Regular security audits of your codebase\n\
            - Employee training on secure coding practices\n\n\
            ## Prevention Strategies\n\n\
            ### Frontend Security\n\
            - Never expose secret keys in client-side code\n\
            - Use public/publishable keys where appropriate\n\
            - Implement proper API proxy patterns for sensitive operations\n\
            - Regular dependency scanning for vulnerabilities\n\n\
            ### Backend Security\n\
            - Implement proper authentication middleware\n\
            - Use least-privilege access principles\n\
            - Regular key rotation schedules\n\
            - Monitor API usage for anomalies\n\n\
            ## Risk Assessment\n\n\
            **Overall Risk Level**: {}\n\
            **Estimated Fix Time**: {}\n\
            **Priority Score**: {}/100\n\n\
            ## Findings Summary\n\
            - Critical: {}\n\
            - High: {}\n\
            - Medium: {}\n\
            - Low: {}\n\n\
            ## Next Steps\n\
            1. Address critical findings immediately\n\
            2. Implement secure storage for all keys\n\
            3. Set up monitoring and alerting\n\
            4. Schedule regular security reviews\n\
            5. Consider implementing automated scanning in CI/CD pipeline\n\n\
            *This analysis was generated by KeyGuard AI Scan.*",
            url,
            if has_critical {
                "### 🔴 CRITICAL - Take Action Now\n\
                Multiple critical API keys detected. These keys must be revoked immediately \n\
                to prevent unauthorized access and potential financial damage.\n\n\
                ### 🟡 HIGH PRIORITY - Fix Today\n\
                High-severity keys detected that could lead to data breaches or service disruption."
            } else if has_high {
                "### 🟡 HIGH PRIORITY - Fix Today\n\
                High-severity keys detected that could lead to data breaches or service disruption."
            } else {
                "### ✅ No Critical Issues Found\n\
                Medium and low severity issues detected. Address these to improve security posture."
            },
            if has_critical { "HIGH" } else if has_high { "MEDIUM-HIGH" } else { "MEDIUM" },
            if critical_count > 0 { "1-2 hours" } else { "2-4 hours" },
            findings.len() * 10,
            critical_count,
            high_count,
            medium_count,
            low_count
        )
    }

    #[allow(dead_code)]
    fn generate_no_findings_response(&self, url: &str) -> String {
        format!(
            "# ✅ Security Audit Scan Results for {}\n\n\
            ## Excellent News!\n\n\
            No exposed API Keys & security issues were detected during the scan. Your website appears to follow \n\
            good security practices for API key management.\n\n\
            ## Recommendations for Continued Security\n\n\
            ### 1. Regular Security Audits\n\
            - Schedule monthly security scans\n\
            - Implement automated security testing in CI/CD\n\
            - Regular dependency vulnerability scanning\n\n\
            ### 2. Best Practices to Maintain\n\
            - Continue using environment variables for secrets\n\
            - Regular key rotation schedules\n\
            - Proper access controls and authentication\n\
            - Security-focused code reviews\n\n\
            ### 3. Additional Security Measures\n\
            - Implement Content Security Policy (CSP)\n\
            - Use HTTPS everywhere\n\
            - Regular backup and disaster recovery testing\n\
            - Employee security training\n\n\
            **Keep up the excellent security practices!**\n\n\
            *Scan completed by KeyGuard AI Scan - No action required.*",
            url
        )
    }
}
