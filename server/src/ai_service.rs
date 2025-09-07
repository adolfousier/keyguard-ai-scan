
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
struct AIResponse {
    choices: Vec<Choice>,
}

#[derive(Deserialize)]
struct Choice {
    message: MessageResponse,
}

#[derive(Deserialize)]
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
                    "Analyze this website for security vulnerabilities:\n\n{}\n\nNo API keys found. Provide security analysis and recommendations.",
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
                    content: "You are a cybersecurity expert specializing in API key leaking and overall cybersecurity. 
                    Take into consideration as frontend and backend security practices from 2025 including the following:
                    ### API Security Best Practices

                    Here is a list of API security best practices to consider:

                    1. **Rate Limiting**: Implement rate limiting that considers both IP address and user ID to prevent abuse from multiple devices and IPs.
                    2. **Non-Default Database Ports**: Use non-default ports for databases (e.g., PostgreSQL: 5432 -> a different port; MySQL: 3306 -> a different port; Redis: 6379 -> a different port; MongoDB: 27017 -> a different port) to make it harder for attackers to scan and exploit.
                    3. **Input Validation**: Validate user input beyond format checking, ensuring it makes business sense (e.g., age: 13-120; role: only allowed values).
                    4. **Secure Session Management**: Implement:
                        * 30-minute session timeout (not 24 hours)
                        * HttpOnly cookies (prevent JavaScript theft)
                        * HTTPS only in production
                        * SameSite strict to prevent CSRF
                    5. **API Versioning**: Implement API versioning to:
                        * Keep old insecure endpoints alive during migration
                        * Add deprecation warnings to old versions
                        * Force migration with incentives, not breaking changes
                    6. **Log Security Events**: Log:
                        * Failed login attempts
                        * Unusual API usage patterns
                        * Slow database queries
                        * Multiple requests from the same IP
                    7. **Database Query Monitoring**: Monitor:
                        * Query timeout limits
                        * Expensive operations
                        * Log queries that take longer than 1 second
                        * Alert on suspicious query patterns
                    8. **Error Handling**: Handle errors by:
                        * Returning generic error messages in production (e.g., 'Internal server error')
                        * Logging detailed errors internally
                        * Never exposing stack traces to users
                    9. **Prioritize Security**: Remember that your backend is only as secure as your laziest security decision, and implementing these best practices can stop 90% of attacks on your APIs.

                    Provide specific, actionable recommendations for fixing exposed API keys.
                ".to_string(),
                },
                Message {
                    role: "user".to_string(),
                    content: prompt.to_string(),
                },
            ],
            max_tokens: 8192,
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
            Ok("# Security Analysis\n\nThe AI service returned an empty response. This could indicate:\n\n1. **API Configuration Issue** - Check your NEURA_ROUTER API key and model settings\n2. **Rate Limiting** - The service may be temporarily unavailable\n3. **Model Issue** - The selected model may not be responding properly\n\n## Recommendations\n\n- Verify your API credentials\n- Try again in a few minutes\n- Check the service status".to_string())
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
            "Security Scan Results for: {}\n\n\
            Exposed API Keys Found:\n{}{}\n\n\
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

    fn generate_no_findings_response(&self, url: &str) -> String {
        format!(
            "# ✅ Security Scan Results for {}\n\n\
            ## Excellent News!\n\n\
            No exposed API keys were detected during the scan. Your website appears to follow \n\
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
