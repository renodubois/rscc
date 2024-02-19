// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
struct Header {
    key: String,
    value: String,
}

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
// TODO(reno): Stronger type for method
#[tauri::command]
async fn make_request(
    url: String,
    body: String,
    method_str: String,
    headers: Vec<Header>,
) -> Result<String, String> {
    let client = reqwest::Client::new();
    let method = reqwest::Method::from_bytes(method_str.as_bytes()).unwrap();
    let mut req = client.request(method, url.to_owned());
    for header in headers {
        req = req.header(header.key, header.value);
    }
    if body.len() > 0 {
        req = req.body(body);
    }
    let res = req.send().await;
    match res {
        Ok(res) => match res.text().await {
            Ok(text_result) => Ok(text_result),
            Err(e) => Err(format!("error unwrapping text: {}", e)),
        },
        Err(e) => Err(format!("error making request: {}", e)),
    }
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::default().build())
        .invoke_handler(tauri::generate_handler![make_request])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
