
use axum::{
    extract::{Path, State},
    http::{StatusCode, Method},
    response::Json,
    routing::{get, post},
    Router,
};
use serde::{Deserialize, Serialize};
use tower_http::cors::{Any, CorsLayer};

mod database;
mod scanner;
mod auth;
mod ai_service;
mod utils;
mod security_tests;

use database::Database;
use scanner::{ScanRequest, ScanResult, ScanProgress};
use auth::{AuthService, Claims};

#[derive(Clone)]
pub struct AppState {
    db: Database,
    auth: AuthService,
}

#[derive(Serialize)]
struct ApiResponse<T> {
    success: bool,
    data: Option<T>,
    message: Option<String>,
}

impl<T> ApiResponse<T> {
    fn success(data: T) -> Self {
        Self {
            success: true,
            data: Some(data),
            message: None,
        }
    }

    #[allow(dead_code)]
    fn error(message: String) -> Self {
        Self {
            success: false,
            data: None,
            message: Some(message),
        }
    }
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tracing_subscriber::fmt::init();
    dotenv::dotenv().ok();

    println!("💾 Initializing database...");
    let database = Database::new().await?;
    println!("✅ Database initialized successfully");
    
    println!("🔐 Initializing auth service...");
    let auth = AuthService::new();
    println!("✅ Auth service initialized");
    
    let state = AppState {
        db: database,
        auth,
    };

    let cors = CorsLayer::new()
        .allow_methods([Method::GET, Method::POST, Method::PUT, Method::DELETE])
        .allow_headers(Any)
        .allow_origin(Any);

    let app = Router::new()
        .route("/api/health", get(health_check))
        .route("/api/scan", post(start_scan))
        .route("/api/scan/:id", get(get_scan_result))
        .route("/api/scan/:id/progress", get(get_scan_progress))
        .route("/api/auth/register", post(register))
        .route("/api/auth/login", post(login))
        .route("/api/user/scans", get(get_user_scans))
        .layer(cors)
        .with_state(state);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:11112").await?;
    println!("🚀 KeyGuard Backend running on http://0.0.0.0:11112");
    
    axum::serve(listener, app).await?;
    Ok(())
}

async fn health_check() -> Json<ApiResponse<String>> {
    Json(ApiResponse::success("KeyGuard API is healthy".to_string()))
}

async fn start_scan(
    State(state): State<AppState>,
    Json(request): Json<ScanRequest>,
) -> Result<Json<ApiResponse<ScanResult>>, StatusCode> {
    match scanner::start_scan(&state.db, request).await {
        Ok(result) => Ok(Json(ApiResponse::success(result))),
        Err(e) => {
            eprintln!("Scan error: {}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

async fn get_scan_result(
    Path(id): Path<String>,
    State(state): State<AppState>,
) -> Result<Json<ApiResponse<ScanResult>>, StatusCode> {
    match state.db.get_scan_result(&id).await {
        Ok(Some(result)) => Ok(Json(ApiResponse::success(result))),
        Ok(None) => Err(StatusCode::NOT_FOUND),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}

async fn get_scan_progress(
    Path(id): Path<String>,
    State(state): State<AppState>,
) -> Result<Json<ApiResponse<ScanProgress>>, StatusCode> {
    match state.db.get_scan_progress(&id).await {
        Ok(Some(progress)) => Ok(Json(ApiResponse::success(progress))),
        Ok(None) => Err(StatusCode::NOT_FOUND),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}

#[derive(Deserialize)]
struct AuthRequest {
    email: String,
    password: String,
}

#[derive(Serialize)]
struct AuthResponse {
    token: String,
    user_id: String,
}

async fn register(
    State(state): State<AppState>,
    Json(request): Json<AuthRequest>,
) -> Result<Json<ApiResponse<AuthResponse>>, StatusCode> {
    match state.auth.register(&state.db, &request.email, &request.password).await {
        Ok((token, user_id)) => Ok(Json(ApiResponse::success(AuthResponse { token, user_id }))),
        Err(e) => {
            eprintln!("Registration error: {}", e);
            Err(StatusCode::BAD_REQUEST)
        }
    }
}

async fn login(
    State(state): State<AppState>,
    Json(request): Json<AuthRequest>,
) -> Result<Json<ApiResponse<AuthResponse>>, StatusCode> {
    match state.auth.login(&state.db, &request.email, &request.password).await {
        Ok((token, user_id)) => Ok(Json(ApiResponse::success(AuthResponse { token, user_id }))),
        Err(_) => Err(StatusCode::UNAUTHORIZED),
    }
}

async fn get_user_scans(
    State(state): State<AppState>,
    claims: Claims,
) -> Result<Json<ApiResponse<Vec<ScanResult>>>, StatusCode> {
    match state.db.get_user_scans(&claims.sub).await {
        Ok(scans) => Ok(Json(ApiResponse::success(scans))),
        Err(_) => Err(StatusCode::INTERNAL_SERVER_ERROR),
    }
}
