mod openai_api;
mod utils;

use wasm_bindgen::prelude::*;

use reqwest::Client;
use serde_json::Value;

pub use openai_api::*;

#[wasm_bindgen]
extern "C" {
    fn alert(s: &str);
}

#[wasm_bindgen]
pub fn greet() -> String {
    alert("Hello, src-rust!");
    String::from("Hello, src-rust!")
}

#[wasm_bindgen]
pub async fn fetch_geolocation() -> JsValue {
    println!("Fetching geolocation");

    let url = "https://get.geojs.io/v1/ip.json";
    let client = Client::new();

    let result = match client.get(url).send().await {
        Ok(response) => match response.text().await {
            Ok(text) => match serde_json::from_str::<Value>(&text) {
                Ok(json) => json["ip"].as_str().unwrap_or("127.0.0.1").to_string(),
                Err(_) => "127.0.0.1".to_string(), // Fallback IP if JSON fails
            },
            Err(_) => "127.0.0.1".to_string(),
        },
        Err(_) => "127.0.0.1".to_string(),
    };

    println!("IP: {}", result);
    JsValue::from_str(&result)
}
