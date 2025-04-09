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

async fn create_offer(query: web::Query<CreateOfferRequest>) -> impl Responder {
    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs();
    println!("[{}] /api/create-offer called", timestamp);
    println!("[{}] Received expiry: {:?}", timestamp, query.expiry);
    
    dotenv().ok();
    
    let cert_path = env::var("GL_CERT_PATH").unwrap_or_else(|_| "client.crt".to_string());
    let key_path = env::var("GL_KEY_PATH").unwrap_or_else(|_| "client-key.pem".to_string());
    
    let developer_cert = match fs::read(&cert_path) {
        Ok(cert) => cert,
        Err(_) => {
            println!("[{}] ❌ Failed: Developer certificate not found", timestamp);
            return HttpResponse::InternalServerError().json(ApiResponse {
                success: false,
                message: format!("Developer certificate not found at {}", cert_path),
                data: None,
            });
        }
    };
    
    let developer_key = match fs::read(&key_path) {
        Ok(key) => key,
        Err(_) => {
            println!("[{}] ❌ Failed: Developer key not found", timestamp);
            return HttpResponse::InternalServerError().json(ApiResponse {
                success: false,
                message: format!("Developer key not found at {}", key_path),
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
        description: "Shopstr username registration".to_string(),
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

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    println!("🚀 Greenlight backend starting on 0.0.0.0:8081");
    HttpServer::new(|| {
        let cors = Cors::default()
            .allow_any_origin()
            .allow_any_method()
            .allow_any_header()
            .max_age(3600);

        App::new()
            .wrap(cors)
            .route("/api/create-offer", web::get().to(create_offer))
    })
    .bind("0.0.0.0:8081")?
    .run()
    .await
}
