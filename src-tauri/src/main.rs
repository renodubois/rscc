// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

enum Method {
    Get,
    Post,
    Put,
    Delete,
}

#[tokio::main]
// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
// TODO(reno): Stronger type for method
#[tauri::command]
async fn make_request(url: &str, body: &str, method_str: &str) -> String {
    let method = match method_str {
        "GET" => Method::Get,
        "POST" => Method::Post,
        "PUT" => Method::Put,
        "DELETE" => Method::Delete,
        _ => unreachable!(),
    };
    let client = reqwest::Client::new();
    match method {
        Method::Get => {
            // TODO(reno): I've manually removed the ability to send a body w/
            // a GET request but I should probably handle this differently?
            let res = client
                .get(url.to_owned())
                .header("Content-Type", "application/json")
                .send()
                .await;
            match res {
                Ok(result) => match result.text().await {
                    Ok(text_result) => text_result,
                    Err(e) => panic!("error unwrapping text: {}", e),
                },
                Err(e) => {
                    panic!("error making request: {}", e)
                }
            }
        }
        Method::Post => {
            let res = client
                .post(url.to_owned())
                .body(body.to_owned())
                .header("Content-Type", "application/json")
                .send()
                .await;
            match res {
                Ok(result) => match result.text().await {
                    Ok(text_result) => text_result,
                    Err(e) => panic!("error unwrapping text: {}", e),
                },
                Err(e) => {
                    panic!("error making request: {}", e)
                }
            }
        }
        Method::Put => {
            let res = client
                .put(url.to_owned())
                .body(body.to_owned())
                .header("Content-Type", "application/json")
                .send()
                .await;
            match res {
                Ok(result) => match result.text().await {
                    Ok(text_result) => text_result,
                    Err(e) => panic!("error unwrapping text: {}", e),
                },
                Err(e) => {
                    panic!("error making request: {}", e)
                }
            }
        }
        Method::Delete => {
            let res = client
                .delete(url.to_owned())
                .body(body.to_owned())
                .header("Content-Type", "application/json")
                .send()
                .await;
            match res {
                Ok(result) => match result.text().await {
                    Ok(text_result) => text_result,
                    Err(e) => panic!("error unwrapping text: {}", e),
                },
                Err(e) => {
                    panic!("error making request: {}", e)
                }
            }
        }
    }
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![make_request])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
