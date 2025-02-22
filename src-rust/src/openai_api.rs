use reqwest::Client;
use serde::{Deserialize, Serialize};
use serde_json::json;
use std::error::Error;
use wasm_bindgen::prelude::*;

const BASE_URL: &str = "https://api.openai.com/v1";

#[derive(Serialize, Deserialize)]
pub struct FileUploadResponse {
    id: String,
    object: String,
    bytes: u64,
    created_at: u64,
    filename: String,
    purpose: String,
}

#[derive(Serialize, Deserialize)]
pub struct AssistantResponse {
    id: String,
    object: String,
    created_at: u64,
    name: Option<String>,
    description: Option<String>,
    model: String,
    instructions: Option<String>,
    tools: Vec<serde_json::Value>,
}

#[derive(Serialize, Deserialize)]
pub struct ThreadResponse {
    id: String,
    object: String,
    created_at: u64,
    metadata: Option<serde_json::Value>,
}

#[derive(Serialize, Deserialize)]
pub struct MessageResponse {
    id: String,
    object: String,
    created_at: u64,
    thread_id: String,
    role: String,
    content: Vec<serde_json::Value>,
    file_ids: Option<Vec<String>>,
    assistant_id: Option<String>,
    run_id: Option<String>,
}

#[derive(Serialize, Deserialize)]
pub struct RunResponse {
    id: String,
    object: String,
    created_at: u64,
    thread_id: String,
    assistant_id: String,
    status: String,
    started_at: Option<u64>,
    expires_at: Option<u64>,
    completed_at: Option<u64>,
    model: String,
    instructions: Option<String>,
    tools: Vec<serde_json::Value>,
}

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
        .header("OpenAI-Beta", "assistants=v2")
        .json(&json!({
            "model": model,
            "input": input
        }))
        .send()
        .await?;

    let text = response.text().await?;
    Ok(text)
}

#[wasm_bindgen]
pub async fn call_chat_completion(
    api_key: &str,
    messages: &str,
    model: &str,
) -> Result<String, JsValue> {
    let client = Client::new();
    let messages: Vec<serde_json::Value> =
        serde_json::from_str(messages).map_err(|e| JsValue::from_str(&e.to_string()))?;

    let response = client
        .post(&format!("{}/chat/completions", BASE_URL))
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .json(&json!({
            "model": model,
            "messages": messages,
            "stream": false
        }))
        .send()
        .await
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let text = response
        .text()
        .await
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    Ok(text)
}

#[wasm_bindgen]
pub async fn upload_file(
    api_key: &str,
    file_data: &[u8],
    filename: &str,
) -> Result<String, JsValue> {
    let client = Client::new();
    let form = reqwest::multipart::Form::new()
        .part(
            "file",
            reqwest::multipart::Part::bytes(file_data.to_vec()).file_name(filename.to_string()),
        )
        .text("purpose", "assistants");

    let response = client
        .post(&format!("{}/files", BASE_URL))
        .header("Authorization", format!("Bearer {}", api_key))
        .header("OpenAI-Beta", "assistants=v2")
        .multipart(form)
        .send()
        .await
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let text = response
        .text()
        .await
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    Ok(text)
}

#[wasm_bindgen]
pub async fn create_assistant(
    api_key: &str,
    name: &str,
    instructions: &str,
    model: &str,
) -> Result<String, JsValue> {
    let client = Client::new();

    let assistant_response = client
        .post(&format!("{}/assistants", BASE_URL))
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .header("OpenAI-Beta", "assistants=v2")
        .json(&json!({
            "name": name,
            "instructions": instructions,
            "model": model,
            "tools": [{"type": "file_search"}],
        }))
        .send()
        .await
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    // Read and log the full response body
    let response_text = assistant_response
        .text()
        .await
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let assistant: AssistantResponse =
        serde_json::from_str(&response_text).map_err(|e| JsValue::from_str(&e.to_string()))?;

    Ok(assistant.id)
}

#[wasm_bindgen]
pub async fn create_thread(api_key: &str) -> Result<String, JsValue> {
    let client = Client::new();
    let thread_response = client
        .post(&format!("{}/threads", BASE_URL))
        .header("Authorization", format!("Bearer {}", api_key))
        .header("OpenAI-Beta", "assistants=v2")
        .send()
        .await
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let thread: ThreadResponse = thread_response
        .json()
        .await
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    Ok(thread.id)
}

#[wasm_bindgen]
pub async fn create_message(
    api_key: &str,
    thread_id: &str,
    content: &str,
    file_ids_json: &str,
) -> Result<String, JsValue> {
    let client = Client::new();
    let file_ids: Vec<String> =
        serde_json::from_str(file_ids_json).map_err(|e| JsValue::from_str(&e.to_string()))?;

    let response = client
        .post(&format!("{}/threads/{}/messages", BASE_URL, thread_id))
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .header("OpenAI-Beta", "assistants=v2")
        .json(&json!({
            "role": "user",
            "content": content,
            "attachments": file_ids.iter().map(|file_id| json!({
                "file_id": file_id,
                "tools": [{"type": "file_search"}]
            })).collect::<Vec<_>>()
        }))
        .send()
        .await
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let text = response
        .text()
        .await
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    Ok(text)
}

#[wasm_bindgen]
pub async fn run_assistant(
    api_key: &str,
    thread_id: &str,
    assistant_id: &str,
) -> Result<String, JsValue> {
    let client = Client::new();
    let run_response = client
        .post(&format!("{}/threads/{}/runs", BASE_URL, thread_id))
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .header("OpenAI-Beta", "assistants=v2")
        .json(&json!({
            "assistant_id": assistant_id
        }))
        .send()
        .await
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let run: RunResponse = run_response
        .json()
        .await
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    Ok(run.id)
}

#[wasm_bindgen]
pub async fn list_messages(api_key: &str, thread_id: &str) -> Result<String, JsValue> {
    let client = Client::new();
    let messages_response = client
        .get(&format!("{}/threads/{}/messages", BASE_URL, thread_id))
        .header("Authorization", format!("Bearer {}", api_key))
        .header("OpenAI-Beta", "assistants=v2")
        .send()
        .await
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let text = messages_response
        .text()
        .await
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    Ok(text)
}

#[wasm_bindgen]
pub async fn process_image(api_key: &str, image_url: &str) -> Result<String, JsValue> {
    let client = Client::new();
    let response = client
        .post(&format!("{}/chat/completions", BASE_URL))
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .json(&json!({
            "model": "gpt-4o-mini",
            "messages": [{
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": "Please analyze this image and provide a description along with key details."
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": image_url
                        }
                    }
                ]
            }],
            "max_tokens": 300
        }))
        .send()
        .await
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let text = response
        .text()
        .await
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    Ok(text)
}

#[wasm_bindgen]
pub async fn process_file(
    api_key: &str,
    file_id: &str,
    assistant_id: &str,
    thread_id: &str,
) -> Result<String, JsValue> {
    let client = Client::new();

    // Create a message in the thread
    let message_response = client
        .post(&format!("{}/threads/{}/messages", BASE_URL, thread_id))
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .header("OpenAI-Beta", "assistants=v2")
        .json(&json!({
            "role": "user",
            "content": "Please process this file and provide a comprehensive summary with key details.",
            "attachments": [{
                "file_id": file_id,
                "tools": [{"type": "file_search"}]
            }]
        }))
        .send()
        .await
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let message: MessageResponse = message_response
        .json()
        .await
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    // Run the assistant
    let run_response = client
        .post(&format!("{}/threads/{}/runs", BASE_URL, thread_id))
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .header("OpenAI-Beta", "assistants=v2")
        .json(&json!({
            "assistant_id": assistant_id
        }))
        .send()
        .await
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let run: RunResponse = run_response
        .json()
        .await
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    Ok(run.id)
}

#[wasm_bindgen]
pub async fn check_run(api_key: &str, thread_id: &str, run_id: &str) -> Result<String, JsValue> {
    let client = Client::new();
    let mut status = "queued".to_string();

    while status == "queued" || status == "in_progress" {
        let run_status_response = client
            .get(&format!(
                "{}/threads/{}/runs/{}",
                BASE_URL, thread_id, run_id
            ))
            .header("Authorization", format!("Bearer {}", api_key))
            .header("OpenAI-Beta", "assistants=v2")
            .send()
            .await
            .map_err(|e| JsValue::from_str(&e.to_string()))?;

        let run_status: RunResponse = run_status_response
            .json()
            .await
            .map_err(|e| JsValue::from_str(&e.to_string()))?;

        status = run_status.status;
    }

    Ok(status)
}

#[wasm_bindgen]
pub async fn get_message(api_key: &str, thread_id: &str) -> Result<String, JsValue> {
    let client = Client::new();
    let messages_response = client
        .get(&format!("{}/threads/{}/messages", BASE_URL, thread_id))
        .header("Authorization", format!("Bearer {}", api_key))
        .header("OpenAI-Beta", "assistants=v2")
        .send()
        .await
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    let text = messages_response
        .text()
        .await
        .map_err(|e| JsValue::from_str(&e.to_string()))?;

    Ok(text)
}
