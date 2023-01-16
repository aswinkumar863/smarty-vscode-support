import { CancellationToken, DocumentLink, Range, TextDocument, Uri, workspace } from 'vscode';
import * as path from 'path';

export class DocumentLinkProvider implements DocumentLinkProvider {

	async provideDocumentLinks(document: TextDocument, token: CancellationToken) {
		const results: DocumentLink[] = [];
		const text: string = document.getText();
		const linkPattern: RegExp = /(?<=['"]).*\.tpl(?=['"])/g;

		for (let match: RegExpExecArray; match = linkPattern.exec(text); match) {

			// Get position in document
			const range = new Range(
				document.positionAt(match.index),
				document.positionAt(match.index + match[0].length)
			);

			// Get target file path
			const fPath = match[0];

			// Current file directory path
			const docdir = path.dirname(document.uri.path);

			// Handle relative paths
			if (fPath.startsWith('./') || fPath.startsWith('../')) {
				const absPath = path.posix.resolve(docdir, fPath);

				results.push(
					new DocumentLink(range, Uri.parse(absPath))
				);

				continue;
			}

			const uri = path.posix.normalize(match[0]?.replace(/^[/]?/, '/'));

			const targets = await workspace.findFiles('**' + uri, null, 1);

			// To create file if path not found
			if (!targets.length) {
				const pathresolved = path.posix.resolve(docdir, match[0]?.replace(/^[/]?/, ''));
				targets.push(Uri.parse(pathresolved));
			}

			const doumentlink = new DocumentLink(range, targets[0]);

			results.push(doumentlink);
		}
		return results;
	}

}