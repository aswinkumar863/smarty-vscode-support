import { TextEditorDecorationType, window, DecorationOptions, Range, TextEditor } from 'vscode';

import { HighlightColorConfig } from "../interfaces";
import { CONFIG } from "../configuration";
import * as CONSTANT from "../constants";

export class HighlightDecoration {
	timeout: NodeJS.Timer | undefined = undefined;
	smartyDecoration: TextEditorDecorationType;

	constructor(activeTextEditor: TextEditor){
		this.createDecoration(activeTextEditor);
	}

	createDecoration(activeTextEditor: TextEditor): TextEditorDecorationType {
		// Highlight feature disabled
		if (!CONFIG.highlight) {
			return;
		}
	
		// validate highlightColor setting
		if (!this.validateHighlightSettings(CONFIG.highlightColor)) {
			return;
		}
	
		// Create decorator type for highlight
		this.smartyDecoration = window.createTextEditorDecorationType({
			light: { backgroundColor: CONFIG.highlightColor.light },
			dark: { backgroundColor: CONFIG.highlightColor.dark },
		});
	
		this.updateDecorations(activeTextEditor);
	}

	validateHighlightSettings(highlightColor: HighlightColorConfig): boolean {
		const hexRegex = /^#([A-Fa-f0-9]{8})$/i;
		if (!hexRegex.test(highlightColor.light)) {
			highlightColor.light = "#FFFA0040";
			window.showWarningMessage("Invalid value for smarty.highlightColor.light setting (Default color applied)");
			return false;
		}
		if (!hexRegex.test(highlightColor.dark)) {
			highlightColor.dark = "#FFFFFF25";
			window.showWarningMessage("Invalid value for smarty.highlightColor.dark setting (Default color applied)");
			return false;
		}
		return true;
	}

	updateDecorations(activeTextEditor: TextEditor): void {
		if (!CONFIG.highlight || activeTextEditor?.document?.languageId !== CONSTANT.languageId) {
			return;
		}
		const smartyRegExp = /({{?\*.*?\*}}?)|{{?[^}\n\s]([^{}]|{[^{}]*})*}}?/g;
		const docText = activeTextEditor.document.getText();
		const smartyTags: DecorationOptions[] = [];
	
		let match: RegExpExecArray;
		while (match = smartyRegExp.exec(docText)) {
			const startPos = activeTextEditor.document.positionAt(match.index);
			const endPos = activeTextEditor.document.positionAt(match.index + match[0].length);
			const range = new Range(startPos, endPos);
			const rangeTxt = activeTextEditor.document.getText(range);
			const decoration = { range };
	
			// checking tag inside literal
			const prevRange = smartyTags[smartyTags.length - 1];
			const prevRangeTxt = prevRange ? activeTextEditor.document.getText(prevRange.range) : "";
			if (!prevRangeTxt.includes("{literal}") || rangeTxt.includes("{/literal}")) {
				smartyTags.push(decoration);
			}
		}
		activeTextEditor.setDecorations(this.smartyDecoration, smartyTags);
	}
	
	triggerUpdateDecorations(activeTextEditor: TextEditor): void {
		if (this.timeout) {
			clearTimeout(this.timeout);
			this.timeout = undefined;
		}
		this.timeout = setTimeout(() => {
			this.updateDecorations(activeTextEditor);
		}, 500);
	}

	dispose(): void {
		this.smartyDecoration?.dispose();
	}
}