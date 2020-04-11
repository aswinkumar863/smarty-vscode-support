import { LanguageService as CSSLanguageService } from 'vscode-css-languageservice';

import { HTMLDocumentRegions } from '../embeddedSupport';
import { LanguageModelCache } from '../languageModelCache';
import { LanguageMode, Position, TextDocument } from '../languageModes';

export function getCSSMode(
	cssLanguageService: CSSLanguageService,
	documentRegions: LanguageModelCache<HTMLDocumentRegions>
): LanguageMode {
	return {
		getId() {
			return 'css';
		},
		doValidation(document: TextDocument) {
			const embedded = documentRegions.get(document).getEmbeddedDocument('css');
			const stylesheet = cssLanguageService.parseStylesheet(embedded);
			return cssLanguageService.doValidation(embedded, stylesheet);
		},
		doComplete(document: TextDocument, position: Position) {
			const embedded = documentRegions.get(document).getEmbeddedDocument('css');
			const stylesheet = cssLanguageService.parseStylesheet(embedded);
			return cssLanguageService.doComplete(embedded, position, stylesheet);
		},
		doHover(document: TextDocument, position: Position) {
			const embedded = documentRegions.get(document).getEmbeddedDocument('css');
			const stylesheet = cssLanguageService.parseStylesheet(embedded);
			return cssLanguageService.doHover(embedded, position, stylesheet);
		},
		findDocumentHighlight(document: TextDocument, position: Position) {
			const embedded = documentRegions.get(document).getEmbeddedDocument('css');
			const stylesheet = cssLanguageService.parseStylesheet(embedded);
			return cssLanguageService.findDocumentHighlights(embedded, position, stylesheet);
		},
		onDocumentRemoved(_document: TextDocument) { },
		dispose() { }
	};
}
