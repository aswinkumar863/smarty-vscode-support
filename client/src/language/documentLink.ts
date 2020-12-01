import { CancellationToken, DocumentLink, Range, TextDocument, Uri, workspace } from 'vscode';
import * as path from 'path';

export class DocumentLinkProvider implements DocumentLinkProvider {

	async provideDocumentLinks(document: TextDocument, token: CancellationToken) {
		const results: DocumentLink[] = [];
		const text: string = document.getText();
		const linkPattern: RegExp = /(?<=file=['"]).*\.tpl/g;

		for (let match: RegExpExecArray; match = linkPattern.exec(text); match) {
			const uri = path.posix.normalize(match[0]?.replace(/^[/]?/, '/'));

			const targets = await workspace.findFiles('**' + uri, null, 1);

			// To create file if path not found
			if (!targets.length) {
				const docdir = path.dirname(document.uri.path);
				const pathresolved = path.posix.resolve(docdir, match[0]?.replace(/^[/]?/, ''));
				targets.push(Uri.parse(pathresolved));
			}

			const range = new Range(
				document.positionAt(match.index),
				document.positionAt(match.index + match[0].length)
			);
			const doumentlink = new DocumentLink(range, targets[0]);

			results.push(doumentlink);
		}
		return results;
	}

}