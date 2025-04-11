use actix_cors::Cors;
use actix_web::{web, App, HttpResponse, HttpServer, Responder};
use gl_client::{
    credentials::{Nobody, Device},
    node::ClnClient,
    pb::cln::OfferRequest,
    scheduler::Scheduler,
    signer::Signer,
};
use serde::{Deserialize, Serialize};
use std::fs;
use bitcoin::Network;
use std::env;
use dotenv::dotenv;
use rand::rng;
use rand::RngCore;
use std::time::{SystemTime, UNIX_EPOCH};
use base64::{Engine as _, engine::general_purpose};

#[derive(Deserialize)]
struct CreateOfferRequest {
    expiry: Option<u32>, 
}

#[derive(Serialize)]
struct ApiResponse {
    success: bool,
    message: String,
    data: Option<serde_json::Value>,
}

// Function to load either environment variables or certificate files
fn load_certificates() -> Result<(Vec<u8>, Vec<u8>), String> {
    // Try to load from .env file first
    if let Ok(_) = dotenv() {
        println!("Loaded .env file");
    } else {
        // If that fails, try .env.base64
        match dotenv::from_filename(".env.base64") {
            Ok(_) => println!("Loaded .env.base64 file"),
            Err(e) => println!("Note: No env file loaded: {}", e),
        }
    }
    
    // Try to get cert content from environment variable
    let cert_content = match env::var("GL_CERT_CONTENT") {
        Ok(content) => {
            println!("Using certificate from GL_CERT_CONTENT environment variable");
            // Check if content is Base64 encoded
            match general_purpose::STANDARD.decode(&content) {
                Ok(decoded) => {
                    println!("Decoded Base64 certificate content");
                    decoded
                },
                Err(_) => {
                    // Not Base64, use as-is
                    println!("Using raw certificate content");
                    content.into_bytes()
                }
            }
        },
        Err(_) => {
            // Fallback to file
            let cert_path = env::var("GL_CERT_PATH").unwrap_or_else(|_| "client.crt".to_string());
            println!("GL_CERT_CONTENT not found, trying to read from file: {}", cert_path);
            match fs::read(&cert_path) {
                Ok(content) => {
                    println!("Loaded certificate from file: {}", cert_path);
                    content
                },
                Err(e) => return Err(format!("Failed to read certificate from {}: {}", cert_path, e)),
            }
        }
    };
    
    // Try to get key content from environment variable
    let key_content = match env::var("GL_KEY_CONTENT") {
        Ok(content) => {
            println!("Using key from GL_KEY_CONTENT environment variable");
            // Check if content is Base64 encoded
            match general_purpose::STANDARD.decode(&content) {
                Ok(decoded) => {
                    println!("Decoded Base64 key content");
                    decoded
                },
                Err(_) => {
                    // Not Base64, use as-is
                    println!("Using raw key content");
                    content.into_bytes()
                }
            }
        },
        Err(_) => {
            // Fallback to file
            let key_path = env::var("GL_KEY_PATH").unwrap_or_else(|_| "client-key.pem".to_string());
            println!("GL_KEY_CONTENT not found, trying to read from file: {}", key_path);
            match fs::read(&key_path) {
                Ok(content) => {
                    println!("Loaded key from file: {}", key_path);
                    content
                },
                Err(e) => return Err(format!("Failed to read key from {}: {}", key_path, e)),
            }
        }
    };
    
    // Debug log the lengths to avoid printing sensitive data
    println!("Certificate loaded: {} bytes", cert_content.len());
    println!("Key loaded: {} bytes", key_content.len());
    
    Ok((cert_content, key_content))
}

async fn create_offer(query: web::Query<CreateOfferRequest>) -> impl Responder {
    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs();
    println!("[{}] /api/create-offer called", timestamp);
    println!("[{}] Received expiry: {:?}", timestamp, query.expiry);
    
    // Load certificates
    let (developer_cert, developer_key) = match load_certificates() {
        Ok((cert, key)) => (cert, key),
        Err(e) => {
            println!("[{}] ❌ Failed: {}", timestamp, e);
            return HttpResponse::InternalServerError().json(ApiResponse {
                success: false,
                message: e,
                data: None,
            });
        }
    };
    
    let developer_creds = Nobody {
        cert: developer_cert,
        key: developer_key,
        ..Nobody::default()
    };

    let network = Network::Bitcoin;
    let scheduler = match Scheduler::new(network, developer_creds.clone()).await {
        Ok(s) => s,
        Err(e) => {
            println!("[{}] ❌ Failed: Could not create scheduler - {}", timestamp, e);
            return HttpResponse::InternalServerError().json(ApiResponse {
                success: false,
                message: format!("Failed to create scheduler: {}", e),
                data: None,
            });
        }
    };

    let mut seed = [0u8; 32];
    rng().fill_bytes(&mut seed);

    let signer = match Signer::new(seed.to_vec(), network, developer_creds) {
        Ok(s) => s,
        Err(e) => {
            println!("[{}] ❌ Failed: Could not create signer - {}", timestamp, e);
            return HttpResponse::InternalServerError().json(ApiResponse {
                success: false,
                message: format!("Failed to create signer: {}", e),
                data: None,
            });
        }
    };

    let registration = match scheduler.register(&signer, None).await {
        Ok(r) => r,
        Err(e) => {
            println!("[{}] ❌ Failed: Could not register node - {}", timestamp, e);
            return HttpResponse::InternalServerError().json(ApiResponse {
                success: false,
                message: format!("Failed to register node: {}", e),
                data: None,
            });
        }
    };

    let device_creds = Device::from_bytes(registration.creds);
    let scheduler = match scheduler.authenticate(device_creds).await {
        Ok(s) => s,
        Err(e) => {
            println!("[{}] ❌ Failed: Could not authenticate - {}", timestamp, e);
            return HttpResponse::InternalServerError().json(ApiResponse {
                success: false,
                message: format!("Failed to authenticate: {}", e),
                data: None,
            });
        }
    };

    let mut node: ClnClient = match scheduler.node().await {
        Ok(n) => n,
        Err(e) => {
            println!("[{}] ❌ Failed: Could not get node - {}", timestamp, e);
            return HttpResponse::InternalServerError().json(ApiResponse {
                success: false,
                message: format!("Failed to get node: {}", e),
                data: None,
            });
        }
    };

    let offer_request = OfferRequest {
        amount: "any".to_string(),
        description: Some("Shopstr username registration".to_string()),
        issuer: Some("".to_string()),
        label: Some("".to_string()),
        absolute_expiry: query.expiry.map(|e| {
            let now = SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_secs();
            let expiry = now + e as u64;
            println!("[{}] Setting expiry to: {} (now: {}, duration: {})", timestamp, expiry, now, e);
            expiry
        }),
        recurrence_base: None,
        recurrence_paywindow: None,
        recurrence_limit: None,
        single_use: None,
        quantity_max: Some(0),
        recurrence: None,
        recurrence_start_any_period: None, // Added required field
    };

    match node.offer(offer_request).await {
        Ok(offer) => {
            println!("[{}] ✅ Success: BOLT 12 offer created", timestamp);
            println!("[{}] Offer response: {:?}", timestamp, offer.get_ref());
            HttpResponse::Ok().json(ApiResponse {
                success: true,
                message: "BOLT 12 offer created successfully".to_string(),
                data: Some(serde_json::json!({
                    "offer": offer.get_ref().bolt12,
                })),
            })
        },
        Err(e) => {
            println!("[{}] ❌ Failed: Could not create offer - {}", timestamp, e);
            HttpResponse::InternalServerError().json(ApiResponse {
                success: false,
                message: format!("Failed to create offer: {}", e),
                data: None,
            })
        },
    }
}

async fn health_check() -> impl Responder {
    // Try to load certificates to check if they're available
    let certs_loaded = match load_certificates() {
        Ok(_) => true,
        Err(_) => false,
    };
    
    HttpResponse::Ok().json(ApiResponse {
        success: true,
        message: "Greenlight backend API is healthy".to_string(),
        data: Some(serde_json::json!({
            "status": "ok",
            "timestamp": SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_secs(),
            "config": {
                "certificates_loaded": certs_loaded
            }
        })),
    })
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    println!("🚀 Greenlight backend starting on 0.0.0.0:8081");
    
    // Check if certificates can be loaded
    match load_certificates() {
        Ok(_) => println!("✅ Certificates loaded successfully"),
        Err(e) => println!("⚠️ Warning: {}", e),
    }
    
    HttpServer::new(|| {
        let cors = Cors::default()
            .allow_any_origin()
            .allow_any_method()
            .allow_any_header()
            .max_age(3600);

        App::new()
            .wrap(cors)
            .route("/api/create-offer", web::get().to(create_offer))
            .route("/health", web::get().to(health_check))
    })
    .bind("0.0.0.0:8081")?
    .run()
    .await
}
