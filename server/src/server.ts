import {
    CompletionList,
    createConnection,
    Diagnostic,
    InitializeParams,
    ProposedFeatures,
    TextDocuments,
    TextDocumentSyncKind,
} from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';

import { getLanguageModes, LanguageModes } from './languageModes';

// Create a connection for the server. The connection uses Node's IPC as a transport.
// Also include all preview / proposed LSP features.
let connection = createConnection(ProposedFeatures.all);

// Create a simple text document manager. The text document manager
// supports full document sync only
let documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

let languageModes: LanguageModes;

connection.onInitialize((_params: InitializeParams) => {
	languageModes = getLanguageModes();

	documents.onDidClose(e => {
		languageModes.onDocumentRemoved(e.document);
	});
	connection.onShutdown(() => {
		languageModes.dispose();
	});

	return {
		capabilities: {
			textDocumentSync: TextDocumentSyncKind.Full,
			completionProvider: { resolveProvider: true, triggerCharacters: ['.', ':', '<', '"', '=', '/'] },
			hoverProvider: true,
			documentHighlightProvider: true
		}
	};
});

connection.onInitialized(() => { });

connection.onDidChangeConfiguration(_change => {
	// Revalidate all open text documents
	documents.all().forEach(validateTextDocument);
});

// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent(change => {
	validateTextDocument(change.document);
});

async function validateTextDocument(textDocument: TextDocument) {
	try {
		const version = textDocument.version;
		const diagnostics: Diagnostic[] = [];
		if (textDocument.languageId === 'smarty') {
			const modes = languageModes.getAllModesInDocument(textDocument);
			const latestTextDocument = documents.get(textDocument.uri);
			if (latestTextDocument && latestTextDocument.version === version) {
				// check no new version has come in after in after the async op
				modes.forEach(mode => {
					if (mode.doValidation) {
						mode.doValidation(latestTextDocument).forEach(d => {
							diagnostics.push(d);
						});
					}
				});
				connection.sendDiagnostics({ uri: latestTextDocument.uri, diagnostics });
			}
		}
	} catch (e) {
		connection.console.error(`Error while validating ${textDocument.uri}`);
		connection.console.error(e);
	}
}

connection.onCompletion(async (textDocumentPosition, token) => {
	const document = documents.get(textDocumentPosition.textDocument.uri);
	if (!document) {
		return null;
	}

	const mode = languageModes.getModeAtPosition(document, textDocumentPosition.position);
	if (!mode || !mode.doComplete) {
		return CompletionList.create();
	}
	const doComplete = mode.doComplete!;

	return doComplete(document, textDocumentPosition.position);
});

connection.onCompletionResolve((item, token) => {
	const data = item.data;
	if (data && data.languageId && data.uri) {
		const mode = languageModes.getMode(data.languageId);
		const document = documents.get(data.uri);
		if (mode && mode.doResolve && document) {
			return mode.doResolve(document, item);
		}
	}
	return item;
});

connection.onHover((textDocumentPosition, token) => {
	const document = documents.get(textDocumentPosition.textDocument.uri);
	if (document) {
		const mode = languageModes.getModeAtPosition(document, textDocumentPosition.position);
		if (mode && mode.doHover) {
			return mode.doHover(document, textDocumentPosition.position);
		}
	}
	return null;
});

connection.onDocumentHighlight((documentHighlightParams, token) => {
	const document = documents.get(documentHighlightParams.textDocument.uri);
	if (document) {
		const mode = languageModes.getModeAtPosition(document, documentHighlightParams.position);
		if (mode && mode.findDocumentHighlight) {
			return mode.findDocumentHighlight(document, documentHighlightParams.position);
		}
	}
	return [];
});

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();
