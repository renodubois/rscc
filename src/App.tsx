import { useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { readTextFile, writeTextFile } from "@tauri-apps/api/fs";
import { open, save } from "@tauri-apps/api/dialog";
import "./App.css";
import { useHotkeys } from "react-hotkeys-hook";
import { z } from "zod";
import { Store } from "tauri-plugin-store-api";
import { Request } from "./Request";
import { Header } from "./types";

type Method = "GET" | "POST" | "PUT" | "DELETE";
type Section = "urlMethod" | "body" | "response";

const store = new Store(".request");
const envs = new Store(".environments");

const parseBody = (
  body: string,
  envVars: z.infer<typeof EnvironmentSchema>
) => {
  return body.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
    if (envVars[varName]) {
      return envVars[varName];
    }

    // If not found, return the original match
    return match;
  });
};

const SavedRequestSchema = z.object({
  // TODO(reno): Can I make this use the Method type instead of defining a union like this?
  method: z.union([
    z.literal("GET"),
    z.literal("POST"),
    z.literal("PUT"),
    z.literal("DELETE"),
  ]),
  url: z.string(),
  body: z.string(),
  sendBody: z.boolean(),
});
type SavedRequest = z.infer<typeof SavedRequestSchema>;

const EnvironmentSchema = z.object({}).catchall(z.string());
type EnvironmentStore = Array<z.infer<typeof EnvironmentSchema>>;

const MethodArray = ["GET", "POST", "PUT", "DELETE"] as const;

function App() {
  // TODO(reno): the url/body params are test values
  const [url, setUrl] = useState("http://localhost:9200/_search");
  const [body, setBody] = useState("");
  const [method, setMethod] = useState<Method>("POST");
  const [response, setResponse] = useState("Response");
  const [sendBody, setSendBody] = useState(true);
  const [activeSection, setActiveSection] = useState<Section>("urlMethod");
  const [environments, setEnvironments] = useState<EnvironmentStore>([
    {
      apiKey: "testkey",
    },
  ]);
  const [envVars, setEnvVars] = useState<{ [k: string]: string }>({});
  const [headers, setHeaders] = useState<Header[]>([
    { key: "Content-Type", value: "application/json" },
	{ key: "Authorization", value: "ApiKey fakekey" },
	{ key: "test key", value: "asdfljsadfljaksdflkjds" }
  ]);

  useEffect(() => {
    // TODO(reno): when I have multiple environments, put them together here
    let newEnvVars = {};
    environments.forEach((env) => {
      newEnvVars = { ...newEnvVars, ...env };
    });
    setEnvVars(newEnvVars);
  }, environments);

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

  useHotkeys("k", () => {
    if (activeSection === "urlMethod") {
      if (methodInputRef.current) {
        const i = MethodArray.indexOf(method);
        let newIndex = i - 1;
        if (newIndex < 0) {
          // wrap around
          newIndex = MethodArray.length - 1;
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
      try {
        const fileData = await readTextFile(filePath);

        const request = SavedRequestSchema.parse(JSON.parse(fileData));
        const { body, url, method, sendBody } = request;
        // restore into the current state
        setBody(body);
        setUrl(url);
        setMethod(method);
        setSendBody(sendBody);
        store.set("request", request);
      } catch (e) {
        console.error(
          "Couldn't read file, or file didn't match expected schema"
        );
      }
    }
  });

  async function makeRequest() {
    // TODO(reno): Some sort of loading indicator
    if (sendBody) {
      const parsedBody = parseBody(body, envVars);
      console.debug(parsedBody);
      try {
        setResponse(
          await invoke("make_request", {
            url,
            body: parsedBody,
            methodStr: method,
            headers,
          })
        );
      } catch (err) {
        setResponse(err as unknown as string);
      }
    } else {
      setResponse(
        await invoke("make_request", {
          url,
          body: "",
          methodStr: method,
          headers,
        })
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
          <Request
            ref={bodyInputRef}
            isActive={activeSection === "body"}
            body={body}
            sendBody={sendBody}
            headers={headers}
            setBody={setBody}
            setSendBody={setSendBody}
            setHeaders={setHeaders}
          />
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
