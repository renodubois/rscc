import { useState } from "react";
import reactLogo from "./assets/react.svg";
import { invoke } from "@tauri-apps/api/tauri";
import "./App.css";

function App() {
  const [url, setUrl] = useState("");
  const [body, setBody] = useState("");
  const [response, setResponse] = useState("");

  async function makeRequest() {
    // Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
	setResponse(await invoke("make_request", { url, body}));
  }

  return (
    <div className="container">
      <h1>rscc</h1>

      <p>Click on the Tauri, Vite, and React logos to learn more.</p>

      <div className="row">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            makeRequest();
          }}
        >
          <input
            id="url"
            onChange={(e) => setUrl(e.currentTarget.value)}
            placeholder="URL"
          />
          <input
            id="body"
            onChange={(e) => setBody(e.currentTarget.value)}
			placeholder="Body"
          />
          <button type="submit">Make request</button>
        </form>
		<br /><p id="response">{response}</p>
      </div>
    </div>
  );
}

export default App;
