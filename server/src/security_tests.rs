use serde::{Deserialize, Serialize};
use reqwest::Client;
use anyhow::Result;
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct VulnerabilityTest {
    pub test_name: String,
    pub status: String,
    pub severity: String,
    pub description: String,
    pub recommendation: String,
    pub details: HashMap<String, String>,
}

pub async fn perform_active_security_tests(client: &Client, base_url: &str) -> Result<Vec<VulnerabilityTest>> {
    let mut tests = Vec::new();
    println!("🛡️ Starting active security tests for: {}", base_url);
    
    // Test 1: Security Headers Analysis
    println!("🔍 Running security headers test...");
    tests.extend(test_security_headers(client, base_url).await?);
    
    // Test 2: Information Disclosure
    println!("🔍 Running information disclosure test...");
    tests.extend(test_information_disclosure(client, base_url).await?);
    
    // Test 3: Directory Traversal (Read-only)
    println!("🔍 Running directory traversal test...");
    tests.extend(test_directory_traversal(client, base_url).await?);
    
    // Test 4: Development/Debug Endpoints
    println!("🔍 Running debug endpoints test...");
    tests.extend(test_debug_endpoints(client, base_url).await?);
    
    // Test 5: CORS Configuration
    println!("🔍 Running CORS configuration test...");
    tests.extend(test_cors_configuration(client, base_url).await?);
    
    // Test 6: SSL/TLS Configuration
    println!("🔍 Running SSL/TLS configuration test...");
    tests.extend(test_ssl_configuration(client, base_url).await?);
    
    // Test 7: Common Misconfigurations
    println!("🔍 Running common misconfigurations test...");
    tests.extend(test_common_misconfigurations(client, base_url).await?);
    
    println!("✅ Active security tests completed: {} total tests", tests.len());
    Ok(tests)
}

async fn test_security_headers(client: &Client, base_url: &str) -> Result<Vec<VulnerabilityTest>> {
    let mut tests = Vec::new();
    
    let response = client.get(base_url).send().await?;
    let headers = response.headers();
    
    // Check for missing security headers
    let security_headers = [
        ("content-security-policy", "CSP", "Prevents XSS and code injection attacks"),
        ("x-frame-options", "X-Frame-Options", "Prevents clickjacking attacks"),
        ("x-content-type-options", "X-Content-Type-Options", "Prevents MIME type sniffing"),
        ("strict-transport-security", "HSTS", "Enforces HTTPS connections"),
        ("referrer-policy", "Referrer-Policy", "Controls referrer information"),
        ("permissions-policy", "Permissions-Policy", "Controls browser features"),
    ];
    
    for (header, name, description) in security_headers {
        let status = if headers.contains_key(header) {
            "pass"
        } else {
            "fail"
        };
        
        tests.push(VulnerabilityTest {
            test_name: format!("{} Header", name),
            status: status.to_string(),
            severity: if status == "fail" { "medium".to_string() } else { "info".to_string() },
            description: format!("Security header check: {}", description),
            recommendation: if status == "fail" {
                format!("Implement {} header to improve security", name)
            } else {
                "Header properly configured".to_string()
            },
            details: HashMap::from([("header".to_string(), header.to_string())]),
        });
    }
    
    Ok(tests)
}

async fn test_information_disclosure(client: &Client, base_url: &str) -> Result<Vec<VulnerabilityTest>> {
    let mut tests = Vec::new();
    
    let error_paths = [
        "/nonexistent-page-404",
        "/admin/login",
        "/api/nonexistent",
    ];
    
    for path in error_paths {
        let test_url = format!("{}{}", base_url.trim_end_matches('/'), path);
        
        if let Ok(response) = client.get(&test_url).send().await {
            let status_code = response.status().as_u16();
            let body = response.text().await.unwrap_or_default();
            
            // Check for information disclosure in error pages
            let has_disclosure = body.to_lowercase().contains("stack trace") ||
                               body.to_lowercase().contains("debug") ||
                               body.to_lowercase().contains("exception") ||
                               body.contains("at line") ||
                               body.contains("file not found:");
            
            if has_disclosure {
                tests.push(VulnerabilityTest {
                    test_name: "Information Disclosure".to_string(),
                    status: "fail".to_string(),
                    severity: "medium".to_string(),
                    description: "Error pages reveal sensitive information".to_string(),
                    recommendation: "Configure custom error pages that don't expose system details".to_string(),
                    details: HashMap::from([
                        ("path".to_string(), path.to_string()),
                        ("status_code".to_string(), status_code.to_string()),
                    ]),
                });
            }
        }
    }
    
    Ok(tests)
}

async fn test_directory_traversal(client: &Client, base_url: &str) -> Result<Vec<VulnerabilityTest>> {
    let mut tests = Vec::new();
    
    // First, get the main page content to compare against (for catch-all detection)
    let main_page_response = client.get(base_url).send().await?;
    let main_page_content = main_page_response.text().await.unwrap_or_default();
    let main_page_length = main_page_content.len();
    let main_page_title = if main_page_content.contains("<title>") {
        main_page_content.split("<title>").nth(1)
            .and_then(|s| s.split("</title>").next())
            .unwrap_or("")
    } else {
        ""
    };
    println!("🔍 Main page: {} bytes, title: '{}'", main_page_length, main_page_title);
    
    let sensitive_paths = [
        // Environment files
        "/.env",
        "/api/.env",
        "/.env.local",
        "/.env.production",
        
        // Config files
        "/config.json",
        "/config.yaml",
        "/config.yml",
        "/config.toml",
        "/api/config.json",
        "/api/config.yaml",
        "/api/config.yml",
        "/api/config.toml",
        
        // Debug files
        "/api/debug.yaml",
        "/api/debug.yml",
        "/api/debug.json",
        "/debug.yaml",
        "/debug.yml",
        "/debug.json",
        
        // Package files
        "/package.json",
        "/composer.json",
        "/requirements.txt",
        "/Cargo.toml",
        
        // Git files
        "/.git/config",
        "/.gitignore",
        
        // Backup and admin
        "/backup",
        "/admin",
        "/phpmyadmin",
        "/wp-admin",
        
        // Standard files (only if they contain actual content)
        "/robots.txt",
        "/sitemap.xml",
    ];
    
    let mut accessible_paths = Vec::new();
    println!("🔍 Testing {} sensitive paths for directory traversal", sensitive_paths.len());
    
    for path in sensitive_paths {
        let test_url = format!("{}{}", base_url.trim_end_matches('/'), path);
        println!("🔍 Testing path: {}", test_url);
        
        match client.get(&test_url).send().await {
            Ok(response) => {
                let status_code = response.status().as_u16();
                println!("📊 Response for {}: {} ({})", path, status_code, response.status());
                
                if status_code == 200 {
                    let body = response.text().await.unwrap_or_default();
                    println!("📄 Body length for {}: {} bytes", path, body.len());
                    
                    // Check if this is the same content as main page (catch-all route)
                    let is_same_as_main = body.len() == main_page_length && 
                                         body.contains(main_page_title) &&
                                         main_page_title.len() > 5;
                    
                    // Check if this is a custom 404 page (any of these indicators)
                    let is_custom_404 = body.contains("404") || 
                                       body.contains("Not Found") || 
                                       body.contains("Page Not Found") ||
                                       body.contains("Do you think this is a mistake") ||
                                       body.contains("page not found") ||
                                       body.contains("PAGE NOT FOUND");
                    
                    // Check if this is HTML content (likely not a config file)
                    let is_html_content = body.contains("<!DOCTYPE html>") || 
                                         body.contains("<html") ||
                                         body.contains("<head>");
                    
                    if is_same_as_main || is_custom_404 || is_html_content {
                        println!("🔄 Path {} returns HTML/404 page (not a config file)", path);
                        continue;
                    }
                    
                    // Check if it's actually sensitive content based on file type and content
                    let is_sensitive = match path {
                        // Environment files
                        p if p.contains(".env") => {
                            body.contains("=") && 
                            (body.contains("KEY") || body.contains("SECRET") || body.contains("TOKEN") || body.contains("PASSWORD"))
                        },
                        
                        // Config files
                        p if p.contains("config.json") => {
                            body.starts_with("{") && body.contains("config") && !body.contains("<html")
                        },
                        p if p.contains("config.yaml") || p.contains("config.yml") => {
                            (body.contains(":") && body.contains("config")) && !body.contains("<html")
                        },
                        p if p.contains("config.toml") => {
                            body.contains("[") && body.contains("]") && !body.contains("<html")
                        },
                        
                        // Debug files
                        p if p.contains("debug") => {
                            (body.contains("debug") || body.contains("DEBUG")) && !body.contains("<html")
                        },
                        
                        // Package files
                        "/package.json" => {
                            body.contains("dependencies") || body.contains("scripts") || body.contains("\"name\"")
                        },
                        p if p.contains("composer.json") => {
                            body.contains("require") && body.starts_with("{")
                        },
                        "/requirements.txt" => {
                            body.contains("==") || body.contains(">=")
                        },
                        "/Cargo.toml" => {
                            body.contains("[package]") || body.contains("[dependencies]")
                        },
                        
                        // Git files
                        "/.git/config" => {
                            body.contains("[core]") || body.contains("repository")
                        },
                        "/.gitignore" => {
                            body.contains("node_modules") || body.contains("*.log")
                        },
                        
                        // Admin interfaces
                        "/admin" => {
                            body.to_lowercase().contains("admin") && 
                            (body.contains("login") || body.contains("dashboard")) &&
                            !body.contains("<html")
                        },
                        "/phpmyadmin" => {
                            body.contains("phpMyAdmin") || body.contains("pma_")
                        },
                        "/wp-admin" => {
                            body.contains("WordPress") || body.contains("wp-login")
                        },
                        
                        // Standard files (only if they're actual files, not HTML)
                        "/robots.txt" => {
                            body.starts_with("User-agent:") || body.contains("Disallow:")
                        },
                        "/sitemap.xml" => {
                            body.starts_with("<?xml") && body.contains("<urlset")
                        },
                        
                        // Backup files
                        "/backup" => {
                            !body.contains("<html") && body.len() > 100
                        },
                        
                        _ => false,
                    };
                    
                    if is_sensitive {
                        println!("⚠️ SENSITIVE FILE FOUND: {} (content type detected)", path);
                        accessible_paths.push(path);
                    } else {
                        println!("✅ File {} accessible but not sensitive content", path);
                    }
                } else {
                    println!("✅ Path {} properly protected ({})", path, status_code);
                }
            },
            Err(e) => {
                println!("❌ Error testing {}: {}", path, e);
            }
        }
    }
    
    if !accessible_paths.is_empty() {
        println!("🚨 CREATING SENSITIVE FILE EXPOSURE FINDING: {:?}", accessible_paths);
        tests.push(VulnerabilityTest {
            test_name: "Sensitive File Exposure".to_string(),
            status: "fail".to_string(),
            severity: "high".to_string(),
            description: format!("Sensitive files are publicly accessible: {}", accessible_paths.join(", ")),
            recommendation: format!("Immediately restrict access to these files: {}. Configure server to deny access to sensitive file patterns.", accessible_paths.join(", ")),
            details: HashMap::from([
                ("accessible_paths".to_string(), accessible_paths.join(", ")),
                ("count".to_string(), accessible_paths.len().to_string()),
            ]),
        });
    } else {
        println!("✅ No sensitive files found accessible");
        tests.push(VulnerabilityTest {
            test_name: "Directory Traversal Protection".to_string(),
            status: "pass".to_string(),
            severity: "info".to_string(),
            description: "No sensitive files found publicly accessible".to_string(),
            recommendation: "Continue monitoring for exposed files".to_string(),
            details: HashMap::new(),
        });
    }
    
    Ok(tests)
}

async fn test_debug_endpoints(client: &Client, base_url: &str) -> Result<Vec<VulnerabilityTest>> {
    let mut tests = Vec::new();
    
    let debug_endpoints = [
        "/debug",
        "/test",
        "/dev",
        "/api/debug",
        "/api/test",
        "/health",
        "/status",
        "/info",
        "/.well-known/security.txt",
    ];
    
    let mut exposed_endpoints = Vec::new();
    println!("🔍 Testing {} debug endpoints", debug_endpoints.len());
    
    for endpoint in debug_endpoints {
        let test_url = format!("{}{}", base_url.trim_end_matches('/'), endpoint);
        println!("🔍 Testing debug endpoint: {}", test_url);
        
        match client.get(&test_url).send().await {
            Ok(response) => {
                let status_code = response.status().as_u16();
                println!("📊 Debug endpoint {}: {} ({})", endpoint, status_code, response.status());
                
                if status_code == 200 {
                    let body = response.text().await.unwrap_or_default();
                    println!("📄 Debug body length for {}: {} bytes", endpoint, body.len());
                    
                    // Check if this is a custom 404 page (any of these indicators)
                    let is_custom_404 = body.contains("404") || 
                                       body.contains("Not Found") || 
                                       body.contains("Page Not Found") ||
                                       body.contains("Do you think this is a mistake") ||
                                       body.contains("page not found") ||
                                       body.contains("PAGE NOT FOUND");
                    
                    let is_likely_catchall = body.contains("<!DOCTYPE html>") && 
                                            body.contains("<html") && 
                                            (body.len() < 2000 || is_custom_404);
                    
                    if is_likely_catchall || is_custom_404 {
                        println!("🔄 Debug endpoint {} returns HTML 404 page or catch-all route", endpoint);
                        continue;
                    }
                    
                    // Check if it reveals actual debug information (not HTML content)
                    let has_debug_info = !body.contains("<html") && (
                        body.to_lowercase().contains("debug") ||
                        body.to_lowercase().contains("version") ||
                        body.to_lowercase().contains("environment") ||
                        body.to_lowercase().contains("status") ||
                        (body.starts_with("{") && body.contains("\"version\"")) ||
                        (body.starts_with("{") && body.contains("\"status\"")) ||
                        body.contains("uptime") ||
                        body.contains("memory")
                    );
                    
                    if has_debug_info {
                        println!("⚠️ DEBUG INFO EXPOSED: {} (actual debug content detected)", endpoint);
                        exposed_endpoints.push(endpoint);
                    } else {
                        println!("✅ Endpoint {} accessible but no debug info", endpoint);
                    }
                } else {
                    println!("✅ Debug endpoint {} properly protected ({})", endpoint, status_code);
                }
            },
            Err(e) => {
                println!("❌ Error testing debug endpoint {}: {}", endpoint, e);
            }
        }
    }
    
    if !exposed_endpoints.is_empty() {
        tests.push(VulnerabilityTest {
            test_name: "Debug Endpoint Exposure".to_string(),
            status: "fail".to_string(),
            severity: "medium".to_string(),
            description: "Debug or development endpoints are publicly accessible".to_string(),
            recommendation: "Disable debug endpoints in production or restrict access".to_string(),
            details: HashMap::from([
                ("exposed_endpoints".to_string(), exposed_endpoints.join(", ")),
            ]),
        });
    }
    
    Ok(tests)
}

async fn test_cors_configuration(client: &Client, base_url: &str) -> Result<Vec<VulnerabilityTest>> {
    let mut tests = Vec::new();
    
    // Test CORS with a preflight request
    let response = client
        .request(reqwest::Method::OPTIONS, base_url)
        .header("Origin", "https://evil.com")
        .header("Access-Control-Request-Method", "POST")
        .send()
        .await;
    
    if let Ok(resp) = response {
        let headers = resp.headers();
        
        if let Some(allow_origin) = headers.get("access-control-allow-origin") {
            let origin_value = allow_origin.to_str().unwrap_or("");
            
            if origin_value == "*" {
                tests.push(VulnerabilityTest {
                    test_name: "CORS Misconfiguration".to_string(),
                    status: "fail".to_string(),
                    severity: "medium".to_string(),
                    description: "CORS allows all origins (*)".to_string(),
                    recommendation: "Restrict CORS to specific trusted domains".to_string(),
                    details: HashMap::from([
                        ("allow_origin".to_string(), origin_value.to_string()),
                    ]),
                });
            } else {
                tests.push(VulnerabilityTest {
                    test_name: "CORS Configuration".to_string(),
                    status: "pass".to_string(),
                    severity: "info".to_string(),
                    description: "CORS is properly configured".to_string(),
                    recommendation: "Continue monitoring CORS configuration".to_string(),
                    details: HashMap::new(),
                });
            }
        }
    }
    
    Ok(tests)
}

async fn test_ssl_configuration(client: &Client, base_url: &str) -> Result<Vec<VulnerabilityTest>> {
    let mut tests = Vec::new();
    
    // Check if HTTPS is enforced
    if base_url.starts_with("http://") {
        tests.push(VulnerabilityTest {
            test_name: "HTTPS Enforcement".to_string(),
            status: "fail".to_string(),
            severity: "high".to_string(),
            description: "Website is not using HTTPS".to_string(),
            recommendation: "Implement HTTPS and redirect all HTTP traffic to HTTPS".to_string(),
            details: HashMap::new(),
        });
    } else {
        // Test HTTP to HTTPS redirect
        let http_url = base_url.replace("https://", "http://");
        
        if let Ok(response) = client.get(&http_url).send().await {
            let status_code = response.status().as_u16();
            
            if status_code >= 300 && status_code < 400 {
                tests.push(VulnerabilityTest {
                    test_name: "HTTPS Redirect".to_string(),
                    status: "pass".to_string(),
                    severity: "info".to_string(),
                    description: "HTTP traffic is properly redirected to HTTPS".to_string(),
                    recommendation: "Continue enforcing HTTPS redirects".to_string(),
                    details: HashMap::new(),
                });
            } else {
                tests.push(VulnerabilityTest {
                    test_name: "HTTPS Redirect".to_string(),
                    status: "fail".to_string(),
                    severity: "medium".to_string(),
                    description: "HTTP traffic is not redirected to HTTPS".to_string(),
                    recommendation: "Configure server to redirect all HTTP requests to HTTPS".to_string(),
                    details: HashMap::new(),
                });
            }
        }
    }
    
    Ok(tests)
}

async fn test_common_misconfigurations(client: &Client, base_url: &str) -> Result<Vec<VulnerabilityTest>> {
    let mut tests = Vec::new();
    
    // Test for server information disclosure
    if let Ok(response) = client.get(base_url).send().await {
        let headers = response.headers();
        
        if let Some(server) = headers.get("server") {
            let server_value = server.to_str().unwrap_or("");
            
            if server_value.to_lowercase().contains("apache") ||
               server_value.to_lowercase().contains("nginx") ||
               server_value.to_lowercase().contains("iis") {
                tests.push(VulnerabilityTest {
                    test_name: "Server Information Disclosure".to_string(),
                    status: "fail".to_string(),
                    severity: "low".to_string(),
                    description: "Server header reveals server software information".to_string(),
                    recommendation: "Hide or modify server header to prevent information disclosure".to_string(),
                    details: HashMap::from([
                        ("server_header".to_string(), server_value.to_string()),
                    ]),
                });
            }
        }
        
        // Check for X-Powered-By header
        if let Some(powered_by) = headers.get("x-powered-by") {
            tests.push(VulnerabilityTest {
                test_name: "Technology Disclosure".to_string(),
                status: "fail".to_string(),
                severity: "low".to_string(),
                description: "X-Powered-By header reveals technology stack".to_string(),
                recommendation: "Remove X-Powered-By header to prevent technology disclosure".to_string(),
                details: HashMap::from([
                    ("powered_by".to_string(), powered_by.to_str().unwrap_or("").to_string()),
                ]),
            });
        }
    }
    
    Ok(tests)
}

pub fn calculate_security_score(vulnerability_tests: &[VulnerabilityTest], api_findings: &[crate::scanner::ApiKeyFinding]) -> u32 {
    let mut score = 100u32;
    
    // Deduct points for API key findings
    for finding in api_findings {
        match finding.severity.as_str() {
            "critical" => score = score.saturating_sub(25),
            "high" => score = score.saturating_sub(15),
            "medium" => score = score.saturating_sub(10),
            "low" => score = score.saturating_sub(5),
            _ => {},
        }
    }
    
    // Deduct points for failed vulnerability tests
    for test in vulnerability_tests {
        if test.status == "fail" {
            match test.severity.as_str() {
                "critical" => score = score.saturating_sub(20),
                "high" => score = score.saturating_sub(12),
                "medium" => score = score.saturating_sub(8),
                "low" => score = score.saturating_sub(3),
                _ => {},
            }
        }
    }
    
    score
}

pub fn check_compliance_status(security_headers: &HashMap<String, String>, vulnerability_tests: &[VulnerabilityTest]) -> HashMap<String, String> {
    let mut compliance = HashMap::new();
    
    // Check OWASP compliance
    let has_csp = security_headers.contains_key("content-security-policy");
    let has_hsts = security_headers.contains_key("strict-transport-security");
    let has_frame_options = security_headers.contains_key("x-frame-options");
    
    let owasp_score = if has_csp && has_hsts && has_frame_options {
        "Good"
    } else if has_csp || has_hsts {
        "Partial"
    } else {
        "Poor"
    };
    
    compliance.insert("OWASP".to_string(), owasp_score.to_string());
    
    // Check SSL/TLS compliance
    let ssl_tests_passed = vulnerability_tests.iter()
        .filter(|test| test.test_name.contains("HTTPS") || test.test_name.contains("SSL"))
        .all(|test| test.status == "pass");
    
    let ssl_score = if ssl_tests_passed { "Good" } else { "Poor" };
    compliance.insert("SSL/TLS".to_string(), ssl_score.to_string());
    
    // Check overall security posture
    let failed_tests = vulnerability_tests.iter().filter(|test| test.status == "fail").count();
    let security_posture = match failed_tests {
        0 => "Excellent",
        1..=3 => "Good",
        4..=7 => "Fair",
        _ => "Poor",
    };
    
    compliance.insert("Security Posture".to_string(), security_posture.to_string());
    
    compliance
}