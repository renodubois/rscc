import { Dispatch, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";

type Row = { key: string; value: string; };
interface Props {
	rows: Row[];
	setRows: Dispatch<Row[]>;
}

export const KeyValueList = ({ rows, setRows }: Props) => {
	const [activeRow, setActiveRow] = useState(0);
	const keyRef = useRef<HTMLInputElement>(null);
	const valueRef = useRef<HTMLInputElement>(null);

	useHotkeys('j', () => {
		if ((activeRow + 1) < rows.length) {
			setActiveRow(prevActive => prevActive + 1);
		}
	});

	useHotkeys('k', () => {
		const nextIndex = activeRow - 1;
		if (nextIndex >= 0) {
			setActiveRow(nextIndex);
		}
	});

	useHotkeys('e', (e) => {
		if (keyRef.current) {
			e.preventDefault();
			keyRef.current.focus();
		}
	});

	useHotkeys('i', (e) => {
		if (valueRef.current) {
			e.preventDefault();
			valueRef.current.focus();
		}
	});

	useHotkeys("esc", () => {
		if (document.activeElement) {
			const ele = document.activeElement as HTMLElement;
			ele.blur();
		}
	}, { enableOnFormTags: true });

	useHotkeys("a", () => {
		setRows([...rows, { key: "", value: "" }]);
	});

	useHotkeys("d", () => {
		const newRows = rows.filter((_, i) => i !== activeRow);
		setRows(newRows);
	});

	

	return (
		<div>
			{
				rows.map((r, i) => {
					const key_id = `header_${i}_key`;
					const value_id = `header_${i}_value`;
					const active = activeRow === i;
					const activeStyles = active ? { border: "1px solid blue" } : {};

					return (
						<div style={{ display: "flex", ...activeStyles }} key={i}>
							<input
								name={key_id}
								id={key_id}
								value={r.key}
								ref={active ? keyRef : null}
								onChange={(e) => {
									const newRows = [...rows];
									newRows[i].key = e.target.value;
									setRows(newRows);
								}}
							/>
							<input
								name={value_id}
								id={value_id}
								value={r.value}
								ref={active ? valueRef : null}
								onChange={(e) => {
									const newRows = [...rows];
									newRows[i].value = e.target.value;
									setRows(newRows);
								}}
							/>
						</div>
					);
				})
			}
		</div>
	);
}
