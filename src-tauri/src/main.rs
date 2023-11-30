// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

#[tokio::main]

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
async fn make_request(url: &str, body: &str) -> String {
    let client = reqwest::Client::new();
    let res = client.post(url.to_owned())
        .body(body.to_owned())
        .header("Content-Type", "application/json")
        .send()
        .await;
    match res {
        Ok(result) => {
            match result.text().await {
                Ok (text_result) => {
                    text_result
                }
                Err(e) => panic!("error unwrapping text: {}", e)
            }
        }
        Err(e) => {
            panic!("error making request: {}", e)
        }
    }
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![make_request])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
