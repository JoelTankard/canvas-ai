use reqwest::Client;
use serde_json::json;
use std::error::Error;

const BASE_URL: &str = "https://api.openai.com/v1";

pub async fn call_completion_api(
    api_key: &str,
    prompt: &str,
    model: &str,
    max_tokens: u32,
) -> Result<String, Box<dyn Error>> {
    let client = Client::new();
    let response = client
        .post(&format!("{}/completions", BASE_URL))
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .json(&json!({
            "model": model,
            "prompt": prompt,
            "max_tokens": max_tokens
        }))
        .send()
        .await?;

    let text = response.text().await?;
    Ok(text)
}

pub async fn call_assistance_api(
    api_key: &str,
    input: &str,
    model: &str,
) -> Result<String, Box<dyn Error>> {
    let client = Client::new();
    let response = client
        .post(&format!("{}/assistances", BASE_URL))
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .json(&json!({
            "model": model,
            "input": input
        }))
        .send()
        .await?;

    let text = response.text().await?;
    Ok(text)
}
