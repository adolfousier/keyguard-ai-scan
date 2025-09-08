
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};
use reqwest::Client;
use scraper::{Html, Selector};
use regex::Regex;
use anyhow::Result;
use std::collections::HashMap;

use crate::database::Database;
use crate::ai_service::AIService;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ScanRequest {
    pub url: String,
    pub user_id: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ScanResult {
    pub id: String,
    pub user_id: Option<String>,
    pub url: String,
    pub status: String,
    pub start_time: DateTime<Utc>,
    pub end_time: Option<DateTime<Utc>>,
    pub findings: Vec<ApiKeyFinding>,
    pub total_checks: u32,
    pub completed_checks: u32,
    pub ai_recommendations: Option<String>,
    pub summary: ScanSummary,
    pub security_analysis: Option<SecurityAnalysis>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ScanProgress {
    pub stage: String,
    pub progress: u32,
    pub message: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ApiKeyFinding {
    pub id: String,
    pub key_type: String,
    pub value: String,
    pub location: String,
    pub severity: String,
    pub description: String,
    pub recommendation: Option<String>,
    pub context: String,
    pub line_number: Option<u32>,
    pub confidence: f32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ScanSummary {
    pub critical: u32,
    pub high: u32,
    pub medium: u32,
    pub low: u32,
    pub total: u32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SecurityAnalysis {
    pub frameworks: Vec<String>,
    pub security_headers: HashMap<String, String>,
    pub third_party_services: Vec<String>,
    pub technologies: Vec<String>,
    pub potential_endpoints: Vec<String>,
    pub external_resources: Vec<String>,
    pub form_actions: Vec<String>,
    pub meta_tags: HashMap<String, String>,
}

#[derive(Debug)]
struct ApiPattern {
    name: String,
    pattern: Regex,
    severity: String,
    description: String,
    provider: String,
}

pub async fn start_scan(db: &Database, request: ScanRequest) -> Result<ScanResult> {
    let scan_id = Uuid::new_v4().to_string();
    let start_time = Utc::now();
    
    let result = ScanResult {
        id: scan_id.clone(),
        user_id: request.user_id.clone(),
        url: request.url.clone(),
        status: "scanning".to_string(),
        start_time,
        end_time: None,
        findings: Vec::new(),
        total_checks: 0,
        completed_checks: 0,
        ai_recommendations: None,
        summary: ScanSummary {
            critical: 0,
            high: 0,
            medium: 0,
            low: 0,
            total: 0,
        },
        security_analysis: None,
    };

    // Save initial scan state
    db.save_scan_result(&result).await?;

    // Start scanning process in background
    let db_clone = db.clone();
    let scan_id_clone = scan_id.clone();
    let request_clone = request.clone();
    tokio::spawn(async move {
        if let Err(e) = perform_scan(db_clone, scan_id_clone, request_clone).await {
            eprintln!("Scan failed: {}", e);
        }
    });

    Ok(result)
}

async fn perform_scan(db: Database, scan_id: String, request: ScanRequest) -> Result<()> {
    println!("🔍 Starting scan for: {}", request.url);
    let client = Client::new();
    let patterns = get_api_patterns();
    
    // Update progress
    update_progress(&db, &scan_id, "Fetching website content", 10).await?;
    println!("📡 Fetching content from: {}", request.url);
    
    // Fetch main page
    let response = client.get(&request.url).send().await?;
    println!("✅ Response received, status: {}", response.status());
    let html_content = response.text().await?;
    println!("📝 HTML content length: {} bytes", html_content.len());
    
    update_progress(&db, &scan_id, "Analyzing HTML content", 30).await?;
    
    // Perform comprehensive security analysis
    let security_analysis = analyze_security_context(&html_content, &request.url)?;
    println!("🔒 Security analysis completed: {} frameworks, {} technologies, {} services detected", 
             security_analysis.frameworks.len(), security_analysis.technologies.len(), security_analysis.third_party_services.len());
    
    // Parse HTML and extract URLs synchronously
    let (script_urls, inline_scripts, css_urls) = {
        let document = Html::parse_document(&html_content);
        
        // Extract script URLs
        let script_selector = Selector::parse("script[src]").unwrap();
        let script_urls: Vec<String> = document.select(&script_selector)
            .filter_map(|element| element.value().attr("src"))
            .map(|src| resolve_url(&request.url, src))
            .collect();
        
        // Extract inline scripts
        let inline_script_selector = Selector::parse("script:not([src])").unwrap();
        let inline_scripts: Vec<String> = document.select(&inline_script_selector)
            .map(|element| element.inner_html())
            .collect();
        
        // Extract CSS URLs
        let css_selector = Selector::parse("link[rel='stylesheet']").unwrap();
        let css_urls: Vec<String> = document.select(&css_selector)
            .filter_map(|element| element.value().attr("href"))
            .map(|href| resolve_url(&request.url, href))
            .collect();
        
        (script_urls, inline_scripts, css_urls)
    }; // document is dropped here
    
    let mut findings = Vec::new();
    let mut total_checks = 0;
    
    // Scan HTML content
    total_checks += 1;
    let html_findings = scan_text_content(&html_content, "HTML", &patterns);
    println!("🔍 HTML scan found {} potential issues", html_findings.len());
    findings.extend(html_findings);
    
    update_progress(&db, &scan_id, "Scanning JavaScript files", 50).await?;
    
    // Scan external JavaScript files
    for script_url in &script_urls {
        total_checks += 1;
        if let Ok(script_response) = client.get(script_url).send().await {
            if let Ok(script_content) = script_response.text().await {
                let src = script_url.split('/').last().unwrap_or(script_url);
                findings.extend(scan_text_content(&script_content, &format!("JavaScript: {}", src), &patterns));
            }
        }
    }
    
    // Scan inline JavaScript
    for script_content in &inline_scripts {
        total_checks += 1;
        findings.extend(scan_text_content(script_content, "Inline JavaScript", &patterns));
    }
    
    update_progress(&db, &scan_id, "Scanning CSS files", 70).await?;
    
    // Scan CSS files
    for css_url in &css_urls {
        total_checks += 1;
        if let Ok(css_response) = client.get(css_url).send().await {
            if let Ok(css_content) = css_response.text().await {
                let href = css_url.split('/').last().unwrap_or(css_url);
                findings.extend(scan_text_content(&css_content, &format!("CSS: {}", href), &patterns));
            }
        }
    }
    
    update_progress(&db, &scan_id, "Generating AI recommendations", 90).await?;
    println!("🤖 Total findings before AI analysis: {}", findings.len());
    
    // Generate AI recommendations with comprehensive security analysis
    let ai_service = AIService::new();
    let content_summary = format!(
        "Website: {}\n\n## Comprehensive Security Analysis\n\n### Content Analysis\n- HTML: {} bytes\n- JavaScript files: {}\n- CSS files: {}\n- Inline scripts: {}\n\n### Technology Stack Detected\n- Frameworks: {}\n- Technologies: {}\n- Third-party Services: {}\n\n### Security-Relevant Findings\n- External Resources: {} detected\n- Potential API Endpoints: {}\n- Form Actions: {}\n- Meta Tags: {} analyzed\n\n### Sample Code Analysis\n\nHTML snippet:\n{}\n\nJavaScript snippet:\n{}\n\n### Security Scan Results\n- API Key Findings: {} issues detected\n- Pattern Matches: {} total patterns scanned\n\n### Detailed Security Context\n- Detected Frameworks: {:?}\n- Detected Technologies: {:?}\n- Third-party Services: {:?}\n- External Resources: {:?}\n- Potential API Endpoints: {:?}",
        request.url,
        html_content.len(),
        script_urls.len(),
        css_urls.len(),
        inline_scripts.len(),
        if security_analysis.frameworks.is_empty() { "None detected".to_string() } else { security_analysis.frameworks.join(", ") },
        if security_analysis.technologies.is_empty() { "None detected".to_string() } else { security_analysis.technologies.join(", ") },
        if security_analysis.third_party_services.is_empty() { "None detected".to_string() } else { security_analysis.third_party_services.join(", ") },
        security_analysis.external_resources.len(),
        security_analysis.potential_endpoints.len(),
        security_analysis.form_actions.len(),
        security_analysis.meta_tags.len(),
        &html_content[..html_content.len().min(1000)],
        if !inline_scripts.is_empty() { &inline_scripts[0][..inline_scripts[0].len().min(500)] } else { "No inline scripts" },
        findings.len(),
        patterns.len(),
        security_analysis.frameworks,
        security_analysis.technologies,
        security_analysis.third_party_services,
        security_analysis.external_resources.iter().take(10).collect::<Vec<_>>(),
        security_analysis.potential_endpoints
    );
    let ai_recommendations = ai_service.generate_recommendations(&findings, &request.url, Some(&content_summary)).await?;
    println!("✨ AI recommendations generated successfully");
    
    // Calculate summary
    let summary = calculate_summary(&findings);
    
    // Update final result
    let end_time = Utc::now();
    let url_clone = request.url.clone();
    let final_result = ScanResult {
        id: scan_id.clone(),
        user_id: request.user_id,
        url: request.url,
        status: "completed".to_string(),
        start_time: db.get_scan_result(&scan_id).await?.unwrap().start_time,
        end_time: Some(end_time),
        findings,
        total_checks,
        completed_checks: total_checks,
        ai_recommendations: Some(ai_recommendations),
        summary,
        security_analysis: Some(security_analysis),
    };
    
    match db.save_scan_result(&final_result).await {
        Ok(_) => println!("✅ Scan result saved to database successfully"),
        Err(e) => {
            println!("❌ Failed to save scan result to database: {}", e);
            return Err(e);
        }
    }
    
    match update_progress(&db, &scan_id, "Scan completed", 100).await {
        Ok(_) => println!("✅ Progress updated successfully"),
        Err(e) => println!("⚠️ Failed to update progress: {}", e),
    }
    
    println!("✅ Scan completed successfully for: {}", url_clone);
    println!("📊 Final summary: {} total findings", final_result.summary.total);
    println!("🔍 AI recommendations length: {} chars", final_result.ai_recommendations.as_ref().map(|s| s.len()).unwrap_or(0));
    
    Ok(())
}

fn get_api_patterns() -> Vec<ApiPattern> {
    vec![
        // AWS Keys
        ApiPattern {
            name: "AWS Access Key".to_string(),
            pattern: Regex::new(r"AKIA[0-9A-Z]{16}").unwrap(),
            severity: "critical".to_string(),
            description: "Amazon Web Services access key detected".to_string(),
            provider: "AWS".to_string(),
        },
        ApiPattern {
            name: "AWS Secret Key".to_string(),
            pattern: Regex::new(r"(?i)(?:aws[_\-]?secret|secret[_\-]?access[_\-]?key)[=:\s]*([a-zA-Z0-9+/]{40})").unwrap(),
            severity: "critical".to_string(),
            description: "AWS secret access key detected".to_string(),
            provider: "AWS".to_string(),
        },
        ApiPattern {
            name: "AWS Session Token".to_string(),
            pattern: Regex::new(r"AQoEXAMPLEH4aoAH0gNCAPyJxz4BlCFFxWNE1OPTgk5TthT\+rJrR").unwrap(),
            severity: "high".to_string(),
            description: "AWS session token detected".to_string(),
            provider: "AWS".to_string(),
        },
        
        // GitHub Keys
        ApiPattern {
            name: "GitHub Token".to_string(),
            pattern: Regex::new(r"ghp_[a-zA-Z0-9]{36}").unwrap(),
            severity: "high".to_string(),
            description: "GitHub personal access token detected".to_string(),
            provider: "GitHub".to_string(),
        },
        ApiPattern {
            name: "GitHub OAuth Token".to_string(),
            pattern: Regex::new(r"gho_[a-zA-Z0-9]{36}").unwrap(),
            severity: "high".to_string(),
            description: "GitHub OAuth token detected".to_string(),
            provider: "GitHub".to_string(),
        },
        ApiPattern {
            name: "GitHub App Token".to_string(),
            pattern: Regex::new(r"(ghu|ghs)_[a-zA-Z0-9]{36}").unwrap(),
            severity: "high".to_string(),
            description: "GitHub app token detected".to_string(),
            provider: "GitHub".to_string(),
        },
        
        // OpenAI Keys
        ApiPattern {
            name: "OpenAI API Key".to_string(),
            pattern: Regex::new(r"sk-[a-zA-Z0-9]{20}T3BlbkFJ[a-zA-Z0-9]{20}").unwrap(),
            severity: "high".to_string(),
            description: "OpenAI API key detected".to_string(),
            provider: "OpenAI".to_string(),
        },
        
        // Stripe Keys
        ApiPattern {
            name: "Stripe Secret Key".to_string(),
            pattern: Regex::new(r"sk_(test|live)_[0-9a-zA-Z]{24}").unwrap(),
            severity: "critical".to_string(),
            description: "Stripe secret API key detected".to_string(),
            provider: "Stripe".to_string(),
        },
        ApiPattern {
            name: "Stripe Publishable Key".to_string(),
            pattern: Regex::new(r"pk_(test|live)_[0-9a-zA-Z]{24}").unwrap(),
            severity: "medium".to_string(),
            description: "Stripe publishable key detected".to_string(),
            provider: "Stripe".to_string(),
        },
        
        // Google Cloud Keys
        ApiPattern {
            name: "Google Cloud API Key".to_string(),
            pattern: Regex::new(r"AIza[0-9A-Za-z-_]{35}").unwrap(),
            severity: "high".to_string(),
            description: "Google Cloud Platform API key detected".to_string(),
            provider: "Google Cloud".to_string(),
        },
        ApiPattern {
            name: "Google OAuth Key".to_string(),
            pattern: Regex::new(r"ya29\.[0-9A-Za-z\-_]+").unwrap(),
            severity: "high".to_string(),
            description: "Google OAuth access token detected".to_string(),
            provider: "Google".to_string(),
        },
        
        // Azure Keys
        ApiPattern {
            name: "Azure Subscription Key".to_string(),
            pattern: Regex::new(r"[0-9a-f]{32}").unwrap(),
            severity: "high".to_string(),
            description: "Microsoft Azure subscription key detected".to_string(),
            provider: "Microsoft Azure".to_string(),
        },
        
        // Slack Keys
        ApiPattern {
            name: "Slack Bot Token".to_string(),
            pattern: Regex::new(r"xoxb-[0-9]{11}-[0-9]{11}-[0-9a-zA-Z]{24}").unwrap(),
            severity: "high".to_string(),
            description: "Slack bot token detected".to_string(),
            provider: "Slack".to_string(),
        },
        ApiPattern {
            name: "Slack Webhook".to_string(),
            pattern: Regex::new(r"https://hooks\.slack\.com/services/[A-Z0-9]{9}/[A-Z0-9]{9}/[a-zA-Z0-9]{24}").unwrap(),
            severity: "medium".to_string(),
            description: "Slack webhook URL detected".to_string(),
            provider: "Slack".to_string(),
        },
        
        // Discord Keys
        ApiPattern {
            name: "Discord Bot Token".to_string(),
            pattern: Regex::new(r"[MN][A-Za-z\d]{23}\.[\w-]{6}\.[\w-]{27}").unwrap(),
            severity: "high".to_string(),
            description: "Discord bot token detected".to_string(),
            provider: "Discord".to_string(),
        },
        
        // Twilio Keys
        ApiPattern {
            name: "Twilio API Key".to_string(),
            pattern: Regex::new(r"SK[a-z0-9]{32}").unwrap(),
            severity: "high".to_string(),
            description: "Twilio API key detected".to_string(),
            provider: "Twilio".to_string(),
        },
        
        // SendGrid Keys
        ApiPattern {
            name: "SendGrid API Key".to_string(),
            pattern: Regex::new(r"SG\.[a-zA-Z0-9_\-]{22}\.[a-zA-Z0-9_\-]{43}").unwrap(),
            severity: "high".to_string(),
            description: "SendGrid API key detected".to_string(),
            provider: "SendGrid".to_string(),
        },
        
        // Mailgun Keys
        ApiPattern {
            name: "Mailgun API Key".to_string(),
            pattern: Regex::new(r"key-[a-zA-Z0-9]{32}").unwrap(),
            severity: "high".to_string(),
            description: "Mailgun API key detected".to_string(),
            provider: "Mailgun".to_string(),
        },
        
        // Generic JWT Tokens
        ApiPattern {
            name: "JWT Token".to_string(),
            pattern: Regex::new(r"eyJ[a-zA-Z0-9_\-]*\.eyJ[a-zA-Z0-9_\-]*\.[a-zA-Z0-9_\-]*").unwrap(),
            severity: "medium".to_string(),
            description: "JSON Web Token detected".to_string(),
            provider: "Generic".to_string(),
        },
        
        // Database Connection Strings
        ApiPattern {
            name: "Database Connection String".to_string(),
            pattern: Regex::new(r"(mongodb|mysql|postgresql|postgres)://[^\s]+").unwrap(),
            severity: "critical".to_string(),
            description: "Database connection string detected".to_string(),
            provider: "Database".to_string(),
        },
        
        // Private Keys
        ApiPattern {
            name: "Private Key".to_string(),
            pattern: Regex::new(r"-----BEGIN (RSA )?PRIVATE KEY-----").unwrap(),
            severity: "critical".to_string(),
            description: "Private key detected".to_string(),
            provider: "Cryptography".to_string(),
        },
    ]
}

fn scan_text_content(content: &str, location: &str, patterns: &[ApiPattern]) -> Vec<ApiKeyFinding> {
    let mut findings = Vec::new();
    println!("🔍 Scanning {} with {} patterns in location: {}", 
             if content.len() > 100 { format!("{}... ({} chars)", &content[..100], content.len()) } else { content.to_string() },
             patterns.len(), location);
    
    for pattern in patterns {
        let matches: Vec<_> = pattern.pattern.find_iter(content).collect();
        if !matches.is_empty() {
            println!("⚠️ Found {} matches for pattern '{}' in {}", matches.len(), pattern.name, location);
        }
        
        for mat in matches {
            println!("🔴 API Key detected: {} in {}", pattern.name, location);
            let finding = ApiKeyFinding {
                id: Uuid::new_v4().to_string(),
                key_type: pattern.name.clone(),
                value: mask_key(mat.as_str()),
                location: location.to_string(),
                severity: pattern.severity.clone(),
                description: pattern.description.clone(),
                recommendation: Some(generate_recommendation(&pattern.name, &pattern.provider)),
                context: extract_context(content, mat.start(), mat.end()),
                line_number: Some(calculate_line_number(content, mat.start())),
                confidence: calculate_confidence(mat.as_str()),
            };
            findings.push(finding);
        }
    }
    
    if findings.is_empty() {
        println!("✅ No API keys found in {}", location);
    }
    
    findings
}

fn mask_key(key: &str) -> String {
    if key.len() <= 8 {
        "*".repeat(key.len())
    } else {
        format!("{}...{}", &key[..4], &key[key.len()-4..])
    }
}

fn generate_recommendation(key_type: &str, provider: &str) -> String {
    format!(
        "Immediately revoke this {} from your {} dashboard and generate a new one. \
        Store the new key securely using environment variables or a secrets manager.",
        key_type, provider
    )
}

fn extract_context(content: &str, start: usize, end: usize) -> String {
    let context_start = start.saturating_sub(50);
    let context_end = (end + 50).min(content.len());
    content[context_start..context_end].to_string()
}

fn calculate_line_number(content: &str, position: usize) -> u32 {
    content[..position].chars().filter(|&c| c == '\n').count() as u32 + 1
}

fn calculate_confidence(key: &str) -> f32 {
    // Simple entropy-based confidence calculation
    let entropy = calculate_entropy(key);
    if entropy > 4.5 { 0.95 } else if entropy > 3.5 { 0.8 } else { 0.6 }
}

fn calculate_entropy(s: &str) -> f32 {
    let mut freq = HashMap::new();
    for c in s.chars() {
        *freq.entry(c).or_insert(0) += 1;
    }
    
    let len = s.len() as f32;
    freq.values()
        .map(|&count| {
            let p = count as f32 / len;
            -p * p.log2()
        })
        .sum()
}

fn calculate_summary(findings: &[ApiKeyFinding]) -> ScanSummary {
    let mut summary = ScanSummary {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        total: findings.len() as u32,
    };
    
    for finding in findings {
        match finding.severity.as_str() {
            "critical" => summary.critical += 1,
            "high" => summary.high += 1,
            "medium" => summary.medium += 1,
            "low" => summary.low += 1,
            _ => {}
        }
    }
    
    summary
}

fn resolve_url(base: &str, relative: &str) -> String {
    if relative.starts_with("http") {
        relative.to_string()
    } else if relative.starts_with("//") {
        format!("https:{}", relative)
    } else if relative.starts_with("/") {
        let base_url = url::Url::parse(base).unwrap();
        format!("{}://{}{}", base_url.scheme(), base_url.host_str().unwrap(), relative)
    } else {
        format!("{}/{}", base.trim_end_matches('/'), relative)
    }
}

async fn update_progress(db: &Database, scan_id: &str, message: &str, progress: u32) -> Result<()> {
    let progress_update = ScanProgress {
        stage: message.to_string(),
        progress,
        message: message.to_string(),
    };
    db.update_scan_progress(scan_id, &progress_update).await
}

fn analyze_security_context(html_content: &str, base_url: &str) -> Result<SecurityAnalysis> {
    let document = Html::parse_document(html_content);
    let mut analysis = SecurityAnalysis {
        frameworks: Vec::new(),
        security_headers: HashMap::new(),
        third_party_services: Vec::new(),
        technologies: Vec::new(),
        potential_endpoints: Vec::new(),
        external_resources: Vec::new(),
        form_actions: Vec::new(),
        meta_tags: HashMap::new(),
    };

    // Detect JavaScript frameworks
    if html_content.contains("React") || html_content.contains("_next") || html_content.contains("__NEXT_DATA__") {
        analysis.frameworks.push("Next.js/React".to_string());
    }
    if html_content.contains("Vue") || html_content.contains("vue.js") {
        analysis.frameworks.push("Vue.js".to_string());
    }
    if html_content.contains("angular") || html_content.contains("ng-") {
        analysis.frameworks.push("Angular".to_string());
    }
    if html_content.contains("svelte") {
        analysis.frameworks.push("Svelte".to_string());
    }
    if html_content.contains("webpack") {
        analysis.technologies.push("Webpack".to_string());
    }
    if html_content.contains("vite") {
        analysis.technologies.push("Vite".to_string());
    }

    // Extract meta tags
    let meta_selector = Selector::parse("meta").unwrap();
    for element in document.select(&meta_selector) {
        if let (Some(name), Some(content)) = (element.value().attr("name"), element.value().attr("content")) {
            analysis.meta_tags.insert(name.to_string(), content.to_string());
        }
    }

    // Extract external resources
    let script_selector = Selector::parse("script[src]").unwrap();
    for element in document.select(&script_selector) {
        if let Some(src) = element.value().attr("src") {
            if !src.starts_with("/") && !src.starts_with(base_url) {
                analysis.external_resources.push(src.to_string());
                
                // Detect third-party services
                if src.contains("google") {
                    if !analysis.third_party_services.contains(&"Google Services".to_string()) {
                        analysis.third_party_services.push("Google Services".to_string());
                    }
                }
                if src.contains("facebook") || src.contains("fb.com") {
                    if !analysis.third_party_services.contains(&"Facebook".to_string()) {
                        analysis.third_party_services.push("Facebook".to_string());
                    }
                }
                if src.contains("cloudflare") {
                    if !analysis.third_party_services.contains(&"Cloudflare".to_string()) {
                        analysis.third_party_services.push("Cloudflare".to_string());
                    }
                }
                if src.contains("stripe") {
                    if !analysis.third_party_services.contains(&"Stripe".to_string()) {
                        analysis.third_party_services.push("Stripe".to_string());
                    }
                }
            }
        }
    }

    // Extract CSS external resources
    let css_selector = Selector::parse("link[rel='stylesheet']").unwrap();
    for element in document.select(&css_selector) {
        if let Some(href) = element.value().attr("href") {
            if !href.starts_with("/") && !href.starts_with(base_url) {
                analysis.external_resources.push(href.to_string());
            }
        }
    }

    // Extract form actions (potential endpoints)
    let form_selector = Selector::parse("form[action]").unwrap();
    for element in document.select(&form_selector) {
        if let Some(action) = element.value().attr("action") {
            analysis.form_actions.push(action.to_string());
            if action.starts_with("/api/") || action.starts_with("api/") {
                analysis.potential_endpoints.push(action.to_string());
            }
        }
    }

    // Scan for API endpoints in JavaScript content
    let api_endpoint_patterns = [
        r"/api/[a-zA-Z0-9_\-/]+",
        r"https?://[^/]+/api/[a-zA-Z0-9_\-/]+",
        r"'/(api|v1|v2|v3)/[^']*'",
        r#""/api/[^"]*""#,
    ];

    for pattern in &api_endpoint_patterns {
        if let Ok(regex) = Regex::new(pattern) {
            for cap in regex.find_iter(html_content) {
                let endpoint = cap.as_str().trim_matches('"').trim_matches('\'').to_string();
                if !analysis.potential_endpoints.contains(&endpoint) {
                    analysis.potential_endpoints.push(endpoint);
                }
            }
        }
    }

    // Detect technologies from script sources and content
    if html_content.contains("tailwind") || html_content.contains("tw-") {
        analysis.technologies.push("Tailwind CSS".to_string());
    }
    if html_content.contains("bootstrap") {
        analysis.technologies.push("Bootstrap".to_string());
    }
    if html_content.contains("jquery") {
        analysis.technologies.push("jQuery".to_string());
    }
    if html_content.contains("axios") {
        analysis.technologies.push("Axios".to_string());
    }
    if html_content.contains("fetch(") {
        analysis.technologies.push("Fetch API".to_string());
    }

    // Additional security-relevant detections
    if html_content.contains("gtag") || html_content.contains("google-analytics") {
        analysis.third_party_services.push("Google Analytics".to_string());
    }
    if html_content.contains("hotjar") {
        analysis.third_party_services.push("Hotjar".to_string());
    }
    if html_content.contains("mixpanel") {
        analysis.third_party_services.push("Mixpanel".to_string());
    }
    if html_content.contains("sentry") {
        analysis.third_party_services.push("Sentry".to_string());
    }

    println!("🔍 Security Analysis Results:");
    println!("   📚 Frameworks: {:?}", analysis.frameworks);
    println!("   🔧 Technologies: {:?}", analysis.technologies);
    println!("   🌐 Third-party Services: {:?}", analysis.third_party_services);
    println!("   📡 External Resources: {} found", analysis.external_resources.len());
    println!("   🎯 Potential API Endpoints: {:?}", analysis.potential_endpoints);
    println!("   📝 Meta Tags: {} found", analysis.meta_tags.len());

    Ok(analysis)
}
