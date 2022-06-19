import * as path from "path";
import { ExtensionContext, env } from "vscode";
import { LanguageClient, LanguageClientOptions, ServerOptions, TransportKind } from "vscode-languageclient/node";

import * as CONSTANT from "./constants";

export function createLanguageClient(context: ExtensionContext) {
	// The server is implemented in node
	let root = env.uiKind === 1 ? "node" : "web";
	let serverModule = context.asAbsolutePath(
		path.join("server", "dist", root, "nodeServerMain.js")
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
		documentSelector: [CONSTANT.languageId],
		initializationOptions: {
			dataPaths: [],
			embeddedLanguages: { css: true, javascript: true }
		}
	};

	// Create the language client.
	return new LanguageClient(
		CONSTANT.languageId,
		CONSTANT.languageServerName,
		serverOptions,
		clientOptions
	);
}
