import { workspace } from 'vscode';
import { Configuration, HighlightColorConfig } from "./interfaces";

export const CONFIG: Configuration = {};

export function setConfiguration(): void {
	const getConfig = workspace.getConfiguration();

	Object.assign(CONFIG, {
		highlight: getConfig.get("smarty.highlight"),
		highlightColor: getConfig.get("smarty.highlightColor") as HighlightColorConfig,
		tabSize: getConfig.get("editor.tabSize"),
		insertSpaces: getConfig.get("editor.insertSpaces"),
		indentInnerHtml: getConfig.get("html.format.indentInnerHtml"),
		maxPreserveNewLines: getConfig.get("html.format.maxPreserveNewLines"),
		preserveNewLines: getConfig.get("html.format.preserveNewLines"),
		wrapLineLength: getConfig.get("html.format.wrapLineLength"),
		wrapAttributes: getConfig.get("html.format.wrapAttributes"),
		endWithNewline: getConfig.get("html.format.endWithNewline"),
	});
}