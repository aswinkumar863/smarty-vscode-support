import { CharacterPair, languages, TextEditor } from "vscode";

import * as CONSTANT from "../constants";

export function setLanguageConfiguration(activeTextEditor: TextEditor): void {
	let pair: CharacterPair = ["{*", "*}"];

	const doubleBraceRegExp = /({{\*.*?\*}})|{{[^}\n\s]([^{}]|{[^{}]*})*}}/m;
	const docText = activeTextEditor.document.getText();

	if (doubleBraceRegExp.exec(docText)) {
		pair = ["{{*", "*}}"];
	}

	languages.setLanguageConfiguration(CONSTANT.languageId, {
		comments: { blockComment: pair }
	});
}