import { join } from 'path';
import * as ts from 'typescript';

import { HTMLDocumentRegions } from '../embeddedSupport';
import { getLanguageModelCache, LanguageModelCache } from '../languageModelCache';
import {
    CompletionItem,
    CompletionItemKind,
    CompletionList,
    Diagnostic,
    DiagnosticSeverity,
    DocumentHighlight,
    DocumentHighlightKind,
    Hover,
    LanguageMode,
    MarkedString,
    Position,
    Range,
    TextDocument,
    TextEdit,
} from '../languageModes';
import { getWordAtText, startsWith } from '../utils/strings';

const JS_WORD_REGEX = /(-?\d*\.\d\w*)|([^\`\~\!\@\#\%\^\&\*\(\)\-\=\+\[\{\]\}\\\|\;\:\'\"\,\.\<\>\/\?\s]+)/g;

let jquery_d_ts = join(__dirname, '../lib/jquery.d.ts'); // when packaged
if (!ts.sys.fileExists(jquery_d_ts)) {
	jquery_d_ts = join(__dirname, '../../lib/jquery.d.ts'); // from source
}

export function getJavaScriptMode(documentRegions: LanguageModelCache<HTMLDocumentRegions>, languageId: 'javascript' | 'typescript'): LanguageMode {
	let jsDocuments = getLanguageModelCache<TextDocument>(10, 60, document => documentRegions.get(document).getEmbeddedDocument(languageId));

	const workingFile = languageId === 'javascript' ? 'vscode://javascript/1.js' : 'vscode://javascript/2.ts'; // the same 'file' is used for all contents

	let compilerOptions: ts.CompilerOptions = { allowNonTsExtensions: true, allowJs: true, lib: ['lib.es6.d.ts'], target: ts.ScriptTarget.Latest, moduleResolution: ts.ModuleResolutionKind.Classic };
	let currentTextDocument: TextDocument;
	let scriptFileVersion: number = 0;
	function updateCurrentTextDocument(doc: TextDocument) {
		if (!currentTextDocument || doc.uri !== currentTextDocument.uri || doc.version !== currentTextDocument.version) {
			currentTextDocument = jsDocuments.get(doc);
			scriptFileVersion++;
		}
	}
	const host: ts.LanguageServiceHost = {
		getCompilationSettings: () => compilerOptions,
		getScriptFileNames: () => [workingFile, jquery_d_ts],
		getScriptKind: (fileName) => fileName.substr(fileName.length - 2) === 'ts' ? ts.ScriptKind.TS : ts.ScriptKind.JS,
		getScriptVersion: (fileName: string) => {
			if (fileName === workingFile) {
				return String(scriptFileVersion);
			}
			return '1'; // default lib an jquery.d.ts are static
		},
		getScriptSnapshot: (fileName: string) => {
			let text = '';
			if (startsWith(fileName, 'vscode:')) {
				if (fileName === workingFile) {
					text = currentTextDocument.getText();
				}
			} else {
				text = ts.sys.readFile(fileName) || '';
			}
			return {
				getText: (start, end) => text.substring(start, end),
				getLength: () => text.length,
				getChangeRange: () => undefined
			};
		},
		getCurrentDirectory: () => '',
		getDefaultLibFileName: (options) => ts.getDefaultLibFilePath(options)
	};
	let jsLanguageService = ts.createLanguageService(host);

	return {
		getId() {
			return languageId;
		},
		doValidation(document: TextDocument): Diagnostic[] {
			updateCurrentTextDocument(document);
			const syntaxDiagnostics: ts.Diagnostic[] = jsLanguageService.getSyntacticDiagnostics(workingFile);
			const semanticDiagnostics = jsLanguageService.getSemanticDiagnostics(workingFile);
			return syntaxDiagnostics.concat(semanticDiagnostics).map((diag: ts.Diagnostic): Diagnostic => {
				return {
					range: convertRange(currentTextDocument, diag),
					severity: DiagnosticSeverity.Error,
					source: languageId,
					message: ts.flattenDiagnosticMessageText(diag.messageText, '\n')
				};
			});
		},
		doComplete(document: TextDocument, position: Position): CompletionList {
			updateCurrentTextDocument(document);
			let offset = currentTextDocument.offsetAt(position);
			let completions = jsLanguageService.getCompletionsAtPosition(workingFile, offset, { includeExternalModuleExports: false, includeInsertTextCompletions: false });
			if (!completions) {
				return { isIncomplete: false, items: [] };
			}
			let replaceRange = convertRange(currentTextDocument, getWordAtText(currentTextDocument.getText(), offset, JS_WORD_REGEX));
			return {
				isIncomplete: false,
				items: completions.entries.map(entry => {
					return {
						uri: document.uri,
						position: position,
						label: entry.name,
						sortText: entry.sortText,
						kind: convertKind(entry.kind),
						textEdit: TextEdit.replace(replaceRange, entry.name),
						data: { // data used for resolving item details (see 'doResolve')
							languageId,
							uri: document.uri,
							offset: offset
						}
					};
				})
			};
		},
		doResolve(document: TextDocument, item: CompletionItem): CompletionItem {
			updateCurrentTextDocument(document);
			let details = jsLanguageService.getCompletionEntryDetails(workingFile, item.data.offset, item.label, undefined, undefined, undefined);
			if (details) {
				item.detail = ts.displayPartsToString(details.displayParts);
				item.documentation = ts.displayPartsToString(details.documentation);
				delete item.data;
			}
			return item;
		},
		doHover(document: TextDocument, position: Position): Hover | null {
			updateCurrentTextDocument(document);
			let info = jsLanguageService.getQuickInfoAtPosition(workingFile, currentTextDocument.offsetAt(position));
			if (info) {
				let contents = ts.displayPartsToString(info.displayParts);
				return {
					range: convertRange(currentTextDocument, info.textSpan),
					contents: MarkedString.fromPlainText(contents)
				};
			}
			return null;
		},
		findDocumentHighlight(document: TextDocument, position: Position): DocumentHighlight[] {
			updateCurrentTextDocument(document);
			const highlights = jsLanguageService.getDocumentHighlights(workingFile, currentTextDocument.offsetAt(position), [workingFile]);
			const out: DocumentHighlight[] = [];
			for (const entry of highlights || []) {
				for (const highlight of entry.highlightSpans) {
					out.push({
						range: convertRange(currentTextDocument, highlight.textSpan),
						kind: highlight.kind === 'writtenReference' ? DocumentHighlightKind.Write : DocumentHighlightKind.Text
					});
				}
			}
			return out;
		},
		onDocumentRemoved(document: TextDocument) {
			jsDocuments.onDocumentRemoved(document);
		},
		dispose() {
			jsLanguageService.dispose();
			jsDocuments.dispose();
		}
	};
}




function convertRange(document: TextDocument, span: { start: number | undefined, length: number | undefined }): Range {
	if (typeof span.start === 'undefined') {
		const pos = document.positionAt(0);
		return Range.create(pos, pos);
	}
	const startPosition = document.positionAt(span.start);
	const endPosition = document.positionAt(span.start + (span.length || 0));
	return Range.create(startPosition, endPosition);
}

function convertKind(kind: string): CompletionItemKind {
	switch (kind) {
		case 'primitive type':
		case 'keyword':
			return CompletionItemKind.Keyword;
		case 'var':
		case 'local var':
			return CompletionItemKind.Variable;
		case 'property':
		case 'getter':
		case 'setter':
			return CompletionItemKind.Field;
		case 'function':
		case 'method':
		case 'construct':
		case 'call':
		case 'index':
			return CompletionItemKind.Function;
		case 'enum':
			return CompletionItemKind.Enum;
		case 'module':
			return CompletionItemKind.Module;
		case 'class':
			return CompletionItemKind.Class;
		case 'interface':
			return CompletionItemKind.Interface;
		case 'warning':
			return CompletionItemKind.File;
	}

	return CompletionItemKind.Property;
}