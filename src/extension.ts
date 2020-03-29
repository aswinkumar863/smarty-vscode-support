import * as vscode from "vscode";
import {
	DocumentFormattingEditProvider,
	TextDocument,
	FormattingOptions,
	CancellationToken,
	ProviderResult,
	TextEdit,
	Range,
	DocumentRangeFormattingEditProvider
} from "vscode";

const beautify = require("js-beautify").html;
const snippets = require("../snippets/snippets.json");

const CONFIG: any = {};
let smartyDecoration: any;
let editorRegistration: any;
let docRegistration: any;

// this method is called when vs code is activated
export function activate(context: vscode.ExtensionContext) {

	let timeout: NodeJS.Timer | undefined = undefined;
	let { activeTextEditor } = vscode.window;

	function setup() {
		const getConfig = vscode.workspace.getConfiguration();

		Object.assign(CONFIG, {
			highlight: getConfig.get("smarty.highlight") as Boolean,
			highlightColor: getConfig.get("smarty.highlightColor") as Object,
			tabSize: getConfig.get("editor.tabSize") as Number,
			insertSpaces: getConfig.get("editor.insertSpaces") as Boolean
		});

		// validate highlightColor setting
		const hexRegex = /^#([A-Fa-f0-9]{8})$/ig
		if (!hexRegex.test(CONFIG.highlightColor.light)) {
			CONFIG.highlightColor.light = "#FFFA0040";
			vscode.window.showWarningMessage('Invalid value for smarty.highlightColor.light setting (Default applied)');
		}
		if (!hexRegex.test(CONFIG.highlightColor.dark)) {
			CONFIG.highlightColor.dark = "#FFFFFF25";
			vscode.window.showWarningMessage('Invalid value for smarty.highlightColor.dark setting (Default applied)');
		}

		smartyDecoration && smartyDecoration.dispose();
		editorRegistration && editorRegistration.dispose();
		docRegistration && docRegistration.dispose();

		if (!CONFIG.highlight) {
			return;
		}

		// decorator type for smarty tag highlight
		smartyDecoration = vscode.window.createTextEditorDecorationType({
			light: { backgroundColor: CONFIG.highlightColor.light },
			dark: { backgroundColor: CONFIG.highlightColor.dark },
		});

		if (activeTextEditor) {
			triggerUpdateDecorations();
		}

		editorRegistration = vscode.window.onDidChangeActiveTextEditor(editor => {
			activeTextEditor = editor;
			if (editor) {
				updateDecorations();
			}
		}, null, context.subscriptions);

		docRegistration = vscode.workspace.onDidChangeTextDocument(event => {
			if (activeTextEditor && event.document === activeTextEditor.document) {
				triggerUpdateDecorations();
			}
		}, null, context.subscriptions);
	}
	setup();

	// sets smarty background decoration
	function updateDecorations() {
		if (!activeTextEditor || activeTextEditor.document.languageId !== "smarty") {
			return;
		}
		const regEx = /{%?[^} \n].+?%?}/gi;
		const text = activeTextEditor.document.getText();
		const largeNumbers: vscode.DecorationOptions[] = [];
		let match;
		while (match = regEx.exec(text)) {
			const startPos = activeTextEditor.document.positionAt(match.index);
			const endPos = activeTextEditor.document.positionAt(match.index + match[0].length);
			const decoration = { range: new vscode.Range(startPos, endPos) };
			largeNumbers.push(decoration);
		}
		activeTextEditor.setDecorations(smartyDecoration, largeNumbers);
	}

	function triggerUpdateDecorations() {
		if (timeout) {
			clearTimeout(timeout);
			timeout = undefined;
		}
		timeout = setTimeout(updateDecorations, 500);
	}

	// smarty document formatting providers
	vscode.languages.registerDocumentFormattingEditProvider(
		{ scheme: "file", language: "smarty" },
		new BeautifyHTMLFormatter()
	);

	vscode.languages.registerDocumentRangeFormattingEditProvider(
		{ scheme: "file", language: "smarty" },
		new BeautifyHTMLFormatter()
	);

	// subscribe to configuration change
	vscode.workspace.onDidChangeConfiguration(event => {
		let affected = event.affectsConfiguration("smarty.highlight") ||
			event.affectsConfiguration("smarty.highlightColor") ||
			event.affectsConfiguration("editor.tabSize") ||
			event.affectsConfiguration("editor.insertSpaces");
		if (affected) {
			setup();
		}
	});

	// smarty document hover provider
	vscode.languages.registerHoverProvider("smarty", {
		provideHover(document, position, token) {
			const range = document.getWordRangeAtPosition(position);
			const word = document.getText(range);
			const line = document.lineAt(position).text;

			if (!new RegExp("{" + word + "\\b").test(line) || !snippets[word]) {
				return null;
			}

			const snippet = snippets[word];

			if (!snippet.description.length) {
				return null;
			}

			let text = `${snippet.description}`;
			if (snippet.reference) {
				text += `\\\n\\\n[Smarty Reference](${snippet.reference})`;
			}
			const contents = new vscode.MarkdownString(text);
			return new vscode.Hover(contents);
		}
	});

}

// this method is called when your extension is deactivated
export function deactivate() {
	smartyDecoration && smartyDecoration.dispose();
	editorRegistration && editorRegistration.dispose();
	docRegistration && docRegistration.dispose();
}

function fullDocumentRange(document: TextDocument): Range {
	const lastLineId = document.lineCount - 1;
	return new Range(0, 0, lastLineId, document.lineAt(lastLineId).text.length);
}

class BeautifyHTMLFormatter implements DocumentFormattingEditProvider, DocumentRangeFormattingEditProvider {

	provideDocumentRangeFormattingEdits(document: TextDocument, range: Range, _options: FormattingOptions, _token: CancellationToken): ProviderResult<TextEdit[]> {

		const text = document.getText(range);
		const beautifyOptions = this.getBeautifyOptions(document.uri.fsPath);
		const formatted = beautify(text, beautifyOptions);

		return [TextEdit.replace(range, formatted)];
	}

	provideDocumentFormattingEdits(document: TextDocument, _options: FormattingOptions, _token: CancellationToken): ProviderResult<TextEdit[]> {
		const { activeTextEditor } = vscode.window;
		if (activeTextEditor && activeTextEditor.document.languageId === "smarty") {
			const text = document.getText();

			const beautifyOptions = this.getBeautifyOptions(document.uri.fsPath);
			const formatted = beautify(text, beautifyOptions);

			const range = fullDocumentRange(document);
			return [TextEdit.replace(range, formatted)];
		}
	}

	getBeautifyOptions(path: string) {
		const options = {
			indent_size: CONFIG.tabSize,
			indent_with_tabs: !CONFIG.insertSpaces,
			templating: ["handlebars"]
		};
		return options;
	}
}