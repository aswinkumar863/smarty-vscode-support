import { commands, ConfigurationTarget, ExtensionContext, languages, window, workspace } from "vscode";
import { LanguageClient } from "vscode-languageclient/node";

import { createLanguageClient } from "./client";
import { setConfiguration } from "./configuration";

import { setLanguageConfiguration } from "./language/configuration";
import { DocumentLinkProvider } from "./language/documentLink";
import { HighlightDecoration } from "./language/decoration";
import { FormattingProvider } from "./language/formatter";
import { HoverProvider } from "./language/hover";

import { promptToShowReleaseNotes } from "./utils";
import * as CONSTANT from "./constants";

let client: LanguageClient;

export function activate(context: ExtensionContext): void {

	let { activeTextEditor } = window;

	// Set comfiguration
	setConfiguration();

	let smartyDecoration: HighlightDecoration;
	
	if (activeTextEditor) {
		// Create decoration for highlight (if enabled)
		smartyDecoration = new HighlightDecoration(activeTextEditor);
		setLanguageConfiguration(activeTextEditor);
	}

	// Subscribe to document change
	window.onDidChangeActiveTextEditor(editor => {
		activeTextEditor = editor;
		if (editor) {
			smartyDecoration?.updateDecorations(activeTextEditor);
			setLanguageConfiguration(activeTextEditor);
		}
	}, null, context.subscriptions);

	workspace.onDidChangeTextDocument(event => {
		if (activeTextEditor && event.document === activeTextEditor.document) {
			smartyDecoration?.triggerUpdateDecorations(activeTextEditor);
		}
	}, null, context.subscriptions);

	// Reset
	function reset() {
		smartyDecoration?.dispose();

		// reset configuration
		setConfiguration();

		// Receate decoration for highlight (if enabled)
		smartyDecoration = new HighlightDecoration(activeTextEditor);
	}

	// Subscribe to configuration change
	workspace.onDidChangeConfiguration(event => {
		const configs: Array<any> = ["editor", "html.format", "smarty"];
		configs.some(config => event.affectsConfiguration(config)) && reset();
	});

	// Language document formatting providers
	languages.registerDocumentFormattingEditProvider(CONSTANT.languageId, new FormattingProvider());
	languages.registerDocumentRangeFormattingEditProvider(CONSTANT.languageId, new FormattingProvider());

	// Language document link provider
	languages.registerDocumentLinkProvider(CONSTANT.languageId, new DocumentLinkProvider());

	// Language document hover provider
	languages.registerHoverProvider(CONSTANT.languageId, new HoverProvider());

	// Command to toggle highlight decoration
	commands.registerCommand(CONSTANT.toggleHighlightCommand, () => {
		const getConfig = workspace.getConfiguration('smarty');
		getConfig.update('highlight', !getConfig.get('highlight'), ConfigurationTarget.Global);
	});

	// Prompt to show release notes on extension updated
	promptToShowReleaseNotes(context);
	
	// Create the language client and start the client.
	client = createLanguageClient(context);
	client.start();
}

export function deactivate(): Thenable<void> | undefined {
	// Stop the language client.
	return client?.stop();
}