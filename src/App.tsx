import { useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { readTextFile, writeTextFile } from "@tauri-apps/api/fs";
import { open, save } from "@tauri-apps/api/dialog";
import "./App.css";
import { useHotkeys } from "react-hotkeys-hook";

type Method = "GET" | "POST" | "PUT" | "DELETE";
type Section = "urlMethod" | "body" | "response";
interface SavedRequest {
  method: Method;
  url: string;
  body: string;
  sendBody: boolean;
}

const MethodArray = ["GET", "POST", "PUT", "DELETE"] as const;

function App() {
  // TODO(reno): the url/body params are test values
  const [url, setUrl] = useState("http://localhost:9200/_search");
  const [body, setBody] = useState("");
  const [method, setMethod] = useState<Method>("POST");
  const [response, setResponse] = useState("Response");
  const [sendBody, setSendBody] = useState(true);
  const [activeSection, setActiveSection] = useState<Section>("urlMethod");

  const bodyInputRef = useRef<HTMLTextAreaElement>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);
  const methodInputRef = useRef<HTMLSelectElement>(null);

  useHotkeys("mod+enter", () => makeRequest());
  useHotkeys("1", () => setActiveSection("urlMethod"));
  useHotkeys("2", () => setActiveSection("body"));
  useHotkeys("3", () => setActiveSection("response"));

  useHotkeys("i", (e) => {
    if (activeSection === "body") {
      // focus the body
      if (bodyInputRef.current) {
        e.preventDefault();
        bodyInputRef.current.focus();
      }
    } else if (activeSection === "urlMethod") {
      if (urlInputRef.current) {
        e.preventDefault();
        urlInputRef.current.focus();
      }
    }
  });

  useHotkeys("j", () => {
    if (activeSection === "urlMethod") {
      if (methodInputRef.current) {
        const i = MethodArray.indexOf(method);
        let newIndex = i + 1;
        if (newIndex >= MethodArray.length) {
          // wrap around
          newIndex = 0;
        }
        setMethod(MethodArray[newIndex]);
      }
    }
  });

  useHotkeys(
    "esc",
    () => {
      if (document.activeElement) {
        const ele = document.activeElement as HTMLElement;
        ele.blur();
      }
    },
    { enableOnFormTags: true }
  );

  useHotkeys("mod+s", async () => {
    // Save the request
    const reqToSave: SavedRequest = {
      url,
      method,
      body,
      sendBody,
    };
    const filePath = await save({});
    if (!filePath) {
      console.error("couldn't get filepath", filePath);
      return;
    }
    await writeTextFile(filePath, JSON.stringify(reqToSave));
  });

  useHotkeys("mod+o", async () => {
    const filePath = await open({
      multiple: false,
      filters: [{ name: "JSON File", extensions: ["json"] }],
    });
    if (filePath && !Array.isArray(filePath)) {
      const fileData = await readTextFile(filePath);
      // TODO(reno): zod parse/validate this
      const { body, url, method, sendBody }: SavedRequest =
        JSON.parse(fileData);
      // restore into the current state
      setBody(body);
      setUrl(url);
      setMethod(method);
      setSendBody(sendBody);
    }
  });

  async function makeRequest() {
    // TODO(reno): Some sort of loading indicator
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
      <p>Active Section: {activeSection}</p>
      <div className="container">
        <div className="row">
          <select
            name="method"
            id="method"
            value={method}
            // TODO(reno): Parse this w/ zod?
            onChange={(e) => setMethod(e.target.value as Method)}
            style={{ flex: 1 }}
            ref={methodInputRef}
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
            ref={urlInputRef}
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
              ref={bodyInputRef}
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
