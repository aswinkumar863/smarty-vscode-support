import {
	CancellationToken, DocumentFormattingEditProvider, DocumentRangeFormattingEditProvider, FormattingOptions,
	ProviderResult, Range, TextDocument, TextEdit
} from "vscode";

import { BeautifySmarty } from "./beautify";
import { fullDocumentRange } from "../utils";

export class FormattingProvider implements DocumentFormattingEditProvider, DocumentRangeFormattingEditProvider {

	private SmartyFormatter: BeautifySmarty = new BeautifySmarty();

	provideDocumentRangeFormattingEdits(document: TextDocument, range: Range, _options: FormattingOptions, _token: CancellationToken): ProviderResult<TextEdit[]> {
		const newrange = new Range(range.start.line, 0, range.end.line, range.end.character);
		const text = document.getText(newrange);
		const formatted = this.SmartyFormatter.beautify(text);

		return [TextEdit.replace(newrange, formatted)];
	}

	provideDocumentFormattingEdits(document: TextDocument, _options: FormattingOptions, _token: CancellationToken): ProviderResult<TextEdit[]> {
		const text = document.getText();
		const formatted = this.SmartyFormatter.beautify(text);
		const range = fullDocumentRange(document);

		return [TextEdit.replace(range, formatted)];
	}

}