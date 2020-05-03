import {
	CancellationToken,
	DocumentFormattingEditProvider,
	DocumentRangeFormattingEditProvider,
	FormattingOptions,
	ProviderResult,
	Range,
	TextDocument,
	TextEdit
} from "vscode";

import { CONFIG, fullDocumentRange } from "./extension";

const beautify = require("js-beautify").html;

export class BeautifyHTMLFormatter implements DocumentFormattingEditProvider, DocumentRangeFormattingEditProvider {

	provideDocumentRangeFormattingEdits(document: TextDocument, range: Range, _options: FormattingOptions, _token: CancellationToken): ProviderResult<TextEdit[]> {
		const newrange = new Range(range.start.line, 0, range.end.line, range.end.character);
		const text = document.getText(newrange);
		const formatted = this.beautifySmarty(text);

		return [TextEdit.replace(newrange, formatted)];
	}

	provideDocumentFormattingEdits(document: TextDocument, _options: FormattingOptions, _token: CancellationToken): ProviderResult<TextEdit[]> {
		const text = document.getText();
		const formatted = this.beautifySmarty(text);
		const range = fullDocumentRange(document);

		return [TextEdit.replace(range, formatted)];
	}

	beautifySmarty(docText: String) {
		const startedRegions = [];
		const smartyRegExp = /^.*{.([^{}]|{([^{}])*})*}.*$/gm;
		docText = docText.replace(smartyRegExp, "/* beautify ignore:start */$&/* beautify ignore:end */");

		const regionTag = {
			foldStartRegex: /{(block|capture|for|foreach|function|if|literal|section|setfilter|strip|while)\b.*?}/,
			foldMiddleRegex: /{(else(if)?|foreachelse)\b.*?}/,
			foldEndRegex: /{\/(block|capture|for|foreach|function|if|literal|section|setfilter|strip|while)\b}/,
			foldBothRegex: /{\/?(block|capture|for|foreach|function|if|literal|section|setfilter|strip|while|else|elseif|foreachelse)\b.*?}/g
		};
		
		const beautifyOptions = this.getBeautifyOptions();
		let formatted = beautify(docText, beautifyOptions);
		const lines = formatted.split("\n");
		const indent_char = beautifyOptions.indent_with_tabs ? "	" : " ".repeat(beautifyOptions.indent_size);
		let i = 0
		while (lines[i]) {
			let line = lines[i];
			let reapeat = startedRegions.length;

			let startMatch = line.match(regionTag.foldStartRegex) ?? [];
			let middleMatch = line.match(regionTag.foldMiddleRegex) ?? [];
			let endMatch = line.match(regionTag.foldEndRegex) ?? [];

			if (startMatch.length) {
				startedRegions.push(startMatch[0]);
			} else if (middleMatch.length) {
				reapeat--;
			} else if (endMatch.length) {
				startedRegions.pop();
				reapeat--;
			}
			if(startMatch[1] && (startMatch[1] == endMatch[1])) {
				startedRegions.pop();
			} else if((startMatch.length + middleMatch.length + endMatch.length) > 2) {
				let iter = 0;

				const spaces = lines[i].replace(/^( +).*/s, "$1")
				const newLines = lines[i].replace(regionTag.foldBothRegex, match =>  (iter++ ? "\n" + spaces : "") + match).split('\n')
				lines.splice(i, 1, ...newLines);
			}
			
			lines[i] = indent_char.repeat(Math.max(0, reapeat)) + lines[i]
				.replace(/\/\* beautify ignore:(start|end) \*\/(\s+)?/g, "");
			i += 1;
		}
		formatted = lines.join("\n").replace(/\/\* beautify ignore:(start|end) \*\/([ ])?/g, "");
		return formatted;
	}

	getBeautifyOptions() {
		const options = {
			indent_size: CONFIG.tabSize,
			indent_with_tabs: !CONFIG.insertSpaces,
			indent_handlebars: true,
			indent_inner_html: true,
			jslint_happy: false,
			brace_style: "collapse-preserve-inline"
		};

		return options;
	}
}
