// utils::environment_settings

use std::env;

pub struct EnvironmentSettings {
    pub jwt_secret: String,
    pub neura_router_api_key: String,
    pub neura_router_api_url: String,
    pub neura_router_api_model: String,
}

impl EnvironmentSettings {
    pub fn load() -> Self {
        Self {
            jwt_secret: env::var("JWT_SECRET")
                .expect("JWT_SECRET must be set"),
            neura_router_api_key: env::var("NEURA_ROUTER_API_KEY")
                .expect("NEURA_ROUTER_API_KEY must be set"),
            neura_router_api_url: env::var("NEURA_ROUTER_API_URL")
                .unwrap_or_else(|_| "https://api.meetneura.ai/v1/router/parallel".to_string()),
            neura_router_api_model: env::var("NEURA_ROUTER_API_MODEL")
                .unwrap_or_else(|_| "openrouter/qwen/qwen3-coder:free".to_string()),
        }
    }
}