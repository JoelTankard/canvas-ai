mod utils;

use wasm_bindgen::prelude::*;
use wasm_bindgen_futures::spawn_local;

use reqwest::Client;
use serde::Deserialize;
use serde_json::Value;

#[derive(Deserialize, Debug)]
struct GeoInfo {
    ip: String,
    country: String,
    region: String,
    city: String,
    latitude: String,
    longitude: String,
    organization: String,
}

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
