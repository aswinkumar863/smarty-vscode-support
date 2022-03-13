import { FormattingOptions } from 'vscode';
import { FormattingLiterals, FormattingTags } from "../interfaces";
import { CONFIG } from "../configuration";

const beautify = require("../js-beautify").html;

export class BeautifySmarty {

	private literals: FormattingLiterals = {
		strings: /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`/,
		smartyComment: /{\*[\s\S]*?\*}/,
		htmlComment: /<!--[\s\S]*?-->/,
		cssComment: /\/\*[\s\S]*?\*\//,
		scriptTemplate: /<script .*?type=['"]text\/template['"].*?>[\s\S]*?<\/script>/
	};

	private tags: FormattingTags = {
		start: new Set(["block", "capture", "for", "foreach", "function", "if", "literal", "section", "setfilter", "strip", "while"]),
		middle: new Set(["else", "elseif", "foreachelse"]),
		end: new Set(["block", "capture", "for", "foreach", "function", "if", "literal", "section", "setfilter", "strip", "while"])
	};

	public beautify(docText: String, options: FormattingOptions): string {
		const embeddedRegExp: RegExp = /(<(?:script|style)[\s\S]*?>)([\s\S]*?)(<\/(?:script|style)>)/g;
		const smartyRegExp: RegExp = /^(?:\t| )*(.*{{?[^}\n\s]}?.*)$/gm;

		// escape smarty literals in script and style
		let isEscaped: boolean = false;
		docText = docText.replace(embeddedRegExp, (match, start, content, end) => {
			if (!content.trim()) {
				return match;
			}
			isEscaped = true;
			return start + content.replace(smartyRegExp, "/* beautify ignore:start */$1/* beautify ignore:end */") + end;
		});

		// format using js-beautify
		const beautifyConfig = this.beautifyConfig(options);
		let formatted = beautify(docText, beautifyConfig);

		// split into lines
		const literalPattern: string = Object.values(this.literals).map(r => r.source).join("|");
		const linkPattern: RegExp = new RegExp(`${literalPattern}|(?<linebreak>\r?\n)|(?<end>$)`, "gm");

		let start: number;
		let lines: string[] = [];
		let match: RegExpExecArray;
		while (match = linkPattern.exec(formatted)) {
			if (match.groups.linebreak !== undefined) {
				lines.push(formatted.substring(start + match.groups.linebreak.length || 0, match.index));
				start = match.index;
			} else if (match.groups.end !== undefined) {
				lines.push(formatted.substring(start, formatted.length).trimLeft());
				break;
			}
		}

		const indent_char = beautifyConfig.indent_with_tabs ? "\t" : " ".repeat(beautifyConfig.indent_size);
		const region = /{{?(\/?)(\w+).*?}}?/g;

		const startedRegions = [];
		let i = 0;

		while (i < lines.length) {
			let line = lines[i];

			// detect smarty tags
			let reapeat = startedRegions.length;

			let startMatch = [];
			let middleMatch = [];
			let endMatch = [];

			let match: RegExpExecArray;
			while (match = region.exec(line)) {
				let [fullmatch, close, tag] = match;

				if (!close && this.tags.start.has(tag)) {
					startMatch.push(fullmatch, tag);
				} else if (!close && this.tags.middle.has(tag)) {
					middleMatch.push(fullmatch, tag);
				} else if (close && this.tags.end.has(tag)) {
					endMatch.push(fullmatch, tag);
				}
			}

			if (startMatch.length) {
				startedRegions.push(startMatch[0]);
			} else if (middleMatch.length) {
				reapeat--;
			} else if (endMatch.length) {
				startedRegions.pop();
				reapeat--;
			}

			// indent smarty block
			if (startMatch[1] && (startMatch[1] == endMatch[1])) {
				startedRegions.pop();
			} else if ((startMatch.length + middleMatch.length + endMatch.length) > 2) {
				let iter = 0;

				const spaces = line.replace(/^([ \t]+).*/s, "$1");
				const newLines = line.replace(region, (match: string) => (iter++ ? "\n" + spaces : "") + match).split("\n");
				lines.splice(i, 1, ...newLines);
			}

			lines[i] = indent_char.repeat(Math.max(0, reapeat)) + lines[i];
			i += 1;
		}

		formatted = lines.join("\n").replace(/^[ \t]+$/gm, "");

		// unescape smarty literals in script and style
		if (isEscaped) {
			formatted = formatted.replace(/\/\*\s+beautify\s+ignore:(start|end)\s+\*\//g, "");
		}

		return formatted;
	}

	private beautifyConfig(options: FormattingOptions) {
		const config = {
			indent_size: options.tabSize,
			indent_with_tabs: !options.insertSpaces,
			indent_handlebars: false,
			indent_inner_html: CONFIG.indentInnerHtml,
			max_preserve_newlines: CONFIG.maxPreserveNewLines,
			preserve_newlines: CONFIG.preserveNewLines,
			wrap_line_length: CONFIG.wrapLineLength,
			wrap_attributes: CONFIG.wrapAttributes,
			brace_style: "collapse,preserve-inline",
			jslint_happy: false,
			indent_empty_lines: true,
			html: {
				end_with_newline: CONFIG.endWithNewline,
				js: { end_with_newline: false },
				css: { end_with_newline: false },
			},
			templating: ["smarty"]
		};

		return config;
	}

}