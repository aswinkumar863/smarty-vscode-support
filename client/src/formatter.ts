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

	beautifySmarty(docText) {
		var _a, _b, _c;
		const startedRegions = [];
		const embeddedRegExp = /<(script|style)[\s\S]*?>[\s\S]*?<\/(script|style)>/g;
		const smartyRegExp = /^.*{{?.([^{}]|{([^{}])*})*}}?.*$/gm;
		docText = docText.replace(embeddedRegExp, match => {
			return match.replace(smartyRegExp, "/* beautify ignore:start */$&/* beautify ignore:end */");
		});
		const regionTag = {
			foldStartRegex: /{{?(block|capture|for|foreach|function|if|literal|section|setfilter|strip|while)[^}]*}?/,
			foldMiddleRegex: /{{?(else(if)?|foreachelse)[^}]*}?/,
			foldEndRegex: /{{?\/(block|capture|for|foreach|function|if|literal|section|setfilter|strip|while)[^}]*}?/,
		};
		const beautifyOptions = this.getBeautifyOptions();
		let formatted = beautify(docText, beautifyOptions);
		const lines = formatted.split("\n");
		const indent_char = beautifyOptions.indent_with_tabs ? "	" : " ".repeat(beautifyOptions.indent_size);
		for (let i = 0; i < lines.length; i++) {
			let line = lines[i];
			let reapeat = startedRegions.length;
			let startMatch = (_a = line.match(regionTag.foldStartRegex)) !== null && _a !== void 0 ? _a : [];
			let middleMatch = (_b = line.match(regionTag.foldMiddleRegex)) !== null && _b !== void 0 ? _b : [];
			let endMatch = (_c = line.match(regionTag.foldEndRegex)) !== null && _c !== void 0 ? _c : [];
			if (startMatch.length) {
				startedRegions.push(startMatch[0]);
			} else if (middleMatch.length) {
				reapeat--;
			} else if (endMatch.length) {
				startedRegions.pop();
				reapeat--;
			}
			if (startMatch[1] && (startMatch[1] == endMatch[1])) {
				startedRegions.pop();
			} else if ((startMatch.length + middleMatch.length + endMatch.length) > 2) {
				lines.splice(i, 1, ...lines[i].split('\n'));
			}
			lines[i] = indent_char.repeat(Math.max(0, reapeat)) + lines[i]
				.replace(/\/\* beautify ignore:(start|end) \*\/(\s+)?/g, "");
		}
		formatted = lines.join("\n").replace(/\/\* beautify ignore:(start|end) \*\/([ ])?/g, "");
		return formatted;
	}

	getBeautifyOptions() {
		const options = {
			indent_size: CONFIG.tabSize,
			indent_with_tabs: !CONFIG.insertSpaces,
			indent_handlebars: false,
			indent_inner_html: true,
			jslint_happy: false,
			brace_style: "collapse-preserve-inline"
		};

		return options;
	}
}
