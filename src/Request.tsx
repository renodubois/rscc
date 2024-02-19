import React, { forwardRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { KeyValueList } from "./KeyValueList";
import { Header } from "./types";

type CurrentTab = "body" | "headers";
interface Props {
	isActive: boolean;
	body: string;
	sendBody: boolean;
	headers: Header[];
	setBody: React.Dispatch<string>;
	setSendBody: React.Dispatch<boolean>;
	setHeaders: React.Dispatch<Header[]>;
}

export const Request = forwardRef<HTMLTextAreaElement, Props>(
	({ isActive, body, sendBody, headers, setBody, setSendBody, setHeaders }, ref) => {
		const [currentTab, setCurrentTab] = useState<CurrentTab>("body");

		// I only have two tabs right now, so this is sort of silly logic.
		useHotkeys("]", () => {
			if (isActive) {
				const nextTab = currentTab === "body" ? "headers" : "body";
				setCurrentTab(nextTab);
			}
		});
		useHotkeys("[", () => {
			if (isActive) {
				const prevTab = currentTab === "body" ? "headers" : "body";
				setCurrentTab(prevTab);
			}
		});
		useHotkeys(" ", (e) => {
			if (isActive) {
				// toggle sending body
				e.preventDefault();
				setSendBody(!sendBody);
			}
		})


		if (currentTab === "body") {
			return (
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
						ref={ref}
					/>
				</div>
			);
		}

		// index of current element

		if (currentTab === "headers") {
			return (
				<div
					style={{
						width: "50vw",
						margin: "1em 1em 1em 0",
						display: "flex",
						flexDirection: "column",
					}}
				>
					<KeyValueList rows={headers} setRows={setHeaders} />
				</div>
			);
		}
	}
);
