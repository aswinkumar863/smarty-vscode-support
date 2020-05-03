import * as path from "path";
import {
    DecorationOptions,
    ExtensionContext,
    Hover,
    languages,
    MarkdownString,
    Range,
    TextDocument,
    window,
    workspace,
} from "vscode";
import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind } from "vscode-languageclient";

import { BeautifyHTMLFormatter } from "./formatter";

export const CONFIG: any = {};
const snippets = require("../../snippets/snippets.json");

let smartyDecoration: any;
let editorRegistration: any;
let docRegistration: any;

let client: LanguageClient;

export function activate(context: ExtensionContext) {

	let timeout: NodeJS.Timer | undefined = undefined;
	let { activeTextEditor } = window;

	function setup() {
		const getConfig = workspace.getConfiguration();

		Object.assign(CONFIG, {
			highlight: getConfig.get("smarty.highlight") as Boolean,
			highlightColor: getConfig.get("smarty.highlightColor") as Object,
			tabSize: getConfig.get("editor.tabSize") as Number,
			insertSpaces: getConfig.get("editor.insertSpaces") as Boolean
		});

		// validate highlightColor setting
		const hexRegex = /^#([A-Fa-f0-9]{8})$/i
		if (!hexRegex.test(CONFIG.highlightColor.light)) {
			CONFIG.highlightColor.light = "#FFFA0040";
			window.showWarningMessage("Invalid value for smarty.highlightColor.light setting (Default applied)");
		}
		if (!hexRegex.test(CONFIG.highlightColor.dark)) {
			CONFIG.highlightColor.dark = "#FFFFFF25";
			window.showWarningMessage("Invalid value for smarty.highlightColor.dark setting (Default applied)");
		}

		smartyDecoration && smartyDecoration.dispose();
		editorRegistration && editorRegistration.dispose();
		docRegistration && docRegistration.dispose();

		if (!CONFIG.highlight) {
			return;
		}

		// decorator type for smarty tag highlight
		smartyDecoration = window.createTextEditorDecorationType({
			light: { backgroundColor: CONFIG.highlightColor.light },
			dark: { backgroundColor: CONFIG.highlightColor.dark },
		});

		if (activeTextEditor) {
			triggerUpdateDecorations();
		}

		editorRegistration = window.onDidChangeActiveTextEditor(editor => {
			activeTextEditor = editor;
			if (editor) {
				updateDecorations();
			}
		}, null, context.subscriptions);

		docRegistration = workspace.onDidChangeTextDocument(event => {
			if (activeTextEditor && event.document === activeTextEditor.document) {
				triggerUpdateDecorations();
			}
		}, null, context.subscriptions);
	}

	// sets smarty background decoration
	function updateDecorations() {
		if (!activeTextEditor || activeTextEditor.document.languageId !== "smarty") {
			return;
		}
		const smartyRegExp = /{[^}\n\s]([^{}]|{[^{}]*})*}/g;
		const docText = activeTextEditor.document.getText();
		const smartyTags: DecorationOptions[] = [];

		let match;
		while (match = smartyRegExp.exec(docText)) {
			const startPos = activeTextEditor.document.positionAt(match.index);
			const endPos = activeTextEditor.document.positionAt(match.index + match[0].length);
			const range = new Range(startPos, endPos);
			const rangeTxt = activeTextEditor.document.getText(range);
			const decoration = { range };

			// checking tag inside literal
			const prevRange = smartyTags[smartyTags.length - 1];
			const prevRangeTxt = prevRange ? activeTextEditor.document.getText(prevRange.range) : "";
			if (!prevRangeTxt.includes("{literal}") || rangeTxt.includes("{/literal}")) {
				smartyTags.push(decoration);
			}
		}
		activeTextEditor.setDecorations(smartyDecoration, smartyTags);
	}

	function triggerUpdateDecorations() {
		if (timeout) {
			clearTimeout(timeout);
			timeout = undefined;
		}
		timeout = setTimeout(updateDecorations, 500);
	}

	// smarty document formatting providers
	languages.registerDocumentFormattingEditProvider(
		{ scheme: "file", language: "smarty" },
		new BeautifyHTMLFormatter()
	);

	languages.registerDocumentRangeFormattingEditProvider(
		{ scheme: "file", language: "smarty" },
		new BeautifyHTMLFormatter()
	);

	// subscribe to configuration change
	workspace.onDidChangeConfiguration(event => {
		let affected = event.affectsConfiguration("smarty.highlight") ||
			event.affectsConfiguration("smarty.highlightColor") ||
			event.affectsConfiguration("editor.tabSize") ||
			event.affectsConfiguration("editor.insertSpaces");
		if (affected) {
			setup();
		}
	});

	// smarty document hover provider
	languages.registerHoverProvider("smarty", {
		provideHover(document, position, token) {
			const range = document.getWordRangeAtPosition(position);
			const word = document.getText(range);
			const line = document.lineAt(position).text;

			if (!new RegExp("{/?" + word + "\\b").test(line) || !snippets[word]) {
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
			const contents = new MarkdownString(text);
			return new Hover(contents);
		}
	});
	
	startClient(context);
	setup();
}

export function deactivate(): Thenable<void> | undefined {
	if (!client) {
		return undefined;
	}
	return client.stop();
}

function startClient(context: ExtensionContext) {
	// The server is implemented in node
	let serverModule = context.asAbsolutePath(
		path.join("server", "out", "server.js")
	);
	// The debug options for the server
	// --inspect=6009: runs the server in Node"s Inspector mode so VS Code can attach to the server for debugging
	let debugOptions = { execArgv: ["--nolazy", "--inspect=6009"] };

	// If the extension is launched in debug mode then the debug server options are used
	// Otherwise the run options are used
	let serverOptions: ServerOptions = {
		run: { module: serverModule, transport: TransportKind.ipc },
		debug: {
			module: serverModule,
			transport: TransportKind.ipc,
			options: debugOptions
		}
	};

	// Options to control the language client
	let clientOptions: LanguageClientOptions = {
		// Register the server for plain text documents
		documentSelector: [{ scheme: "file", language: "smarty" }]
	};

	// Create the language client and start the client.
	client = new LanguageClient(
		"languageServerExample",
		"Language Server Example",
		serverOptions,
		clientOptions
	);

	// Start the client. This will also launch the server
	client.start();
}

export function fullDocumentRange(document: TextDocument): Range {
	const lastLineId = document.lineCount - 1;
	return new Range(0, 0, lastLineId, document.lineAt(lastLineId).text.length);
}
