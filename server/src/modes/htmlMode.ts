import { LanguageMode, LanguageService as HTMLLanguageService, Position, TextDocument } from '../languageModes';

export function getHTMLMode(htmlLanguageService: HTMLLanguageService): LanguageMode {
	return {
		getId() {
			return 'html';
		},
		doComplete(document: TextDocument, position: Position) {
			return htmlLanguageService.doComplete(
				document,
				position,
				htmlLanguageService.parseHTMLDocument(document)
			);
		},
		doHover(document: TextDocument, position: Position) {
			return htmlLanguageService.doHover(
				document, 
				position, 
				htmlLanguageService.parseHTMLDocument(document)
			);
		},
		findDocumentHighlight(document: TextDocument, position: Position) {
			return htmlLanguageService.findDocumentHighlights(
				document, 
				position, 
				htmlLanguageService.parseHTMLDocument(document)
			);
		},
		onDocumentRemoved(_document: TextDocument) {},
		dispose() {}
	};
}
