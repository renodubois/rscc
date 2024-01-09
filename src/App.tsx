import { useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import "./App.css";

type Method = "GET" | "POST" | "PUT" | "DELETE";

function App() {
  // TODO(reno): the url/body params are test values
  const [url, setUrl] = useState("http://localhost:9200/_search");
  const [body, setBody] = useState("");
  const [method, setMethod] = useState<Method>("POST");
  const [response, setResponse] = useState("Response");
  const [sendBody, setSendBody] = useState(true);

  async function makeRequest() {
    // Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
    if (sendBody) {
      setResponse(
        await invoke("make_request", { url, body, methodStr: method })
      );
    } else {
      setResponse(
        await invoke("make_request", { url, body: "", methodStr: method })
      );
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        makeRequest();
      }}
    >
      <div className="container">
        <div className="row">
            <select
              name="method"
              id="method"
              value={method}
              // TODO(reno): Parse this w/ zod?
              onChange={(e) => setMethod(e.target.value as Method)}
              style={{ flex: 1 }}
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
            </select>
          <input
            id="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="URL"
            style={{ flex: 10 }}
          />

          <button type="submit">Make request</button>
          <br />
        </div>
        <div style={{ overflow: "hidden" }} className="body-row">
          <div
            style={{
              width: "50vw",
              margin: "1em 1em 1em 0",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <label htmlFor="sendBody">Send body?</label>
            <input
              type="checkbox"
              name="sendBody"
              id="sendBody"
              checked={sendBody}
              onChange={(e) => setSendBody(e.target.checked)}
            />
            <textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Body"
              style={{ flex: 1, padding: "1em 2em 2em 2em" }}
            />
          </div>
          <pre
            id="response"
            style={{
              textAlign: "left",
              width: "48vw",
              overflow: "scroll",
              padding: "1em 2em 2em 2em",
              margin: "1em 0 1em 1em",
            }}
          >
            <code style={{ wordWrap: "break-word", whiteSpace: "pre-wrap" }}>
              {response}
            </code>
          </pre>
        </div>
      </div>
    </form>
  );
}

export default App;
