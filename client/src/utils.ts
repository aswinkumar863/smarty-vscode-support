import { env, ExtensionContext, Range, TextDocument, Uri, window } from 'vscode';
import * as CONSTANT from "./constants";

const packageJson = require("../../package.json");

export function fullDocumentRange(document: TextDocument): Range {
	const endLineNumber = document.lineCount - 1;
	const endLineText = document.lineAt(endLineNumber).text;
	return new Range(0, 0, endLineNumber, endLineText.length);
}

export function promptToShowReleaseNotes(context: ExtensionContext): void {
	const currentVersion = getExtensionVersion();
	const lastSeenVersion = context.globalState.get(CONSTANT.lastSeenVersionKey, '');

	if (!versionIsNewer(lastSeenVersion, currentVersion)) {
		return;
	}

	context.globalState.update(CONSTANT.lastSeenVersionKey, currentVersion);
	
	window.showInformationMessage(
		`Smarty extension has been updated to v${currentVersion}. Please check the changelog and star on Github`,
		`Visit Github`,
	).then(() => {
		const uri = Uri.parse(packageJson.repository.url);
		env.openExternal(uri);
	});
}

export function versionIsNewer(oldVersion: string, newVersion: string): boolean {
	return !!newVersion.localeCompare(oldVersion, undefined, {
		numeric: true,
		sensitivity: 'base'
	});
}

export function getExtensionVersion(): string {
	return packageJson.version;
}