export interface HighlightColorConfig {
	light?: string,
	dark?: string
}

export interface Configuration {
	highlight?: boolean,
	highlightColor?: HighlightColorConfig,
	tabSize?: number,
	insertSpaces?: boolean,
	indentInnerHtml?: boolean,
	maxPreserveNewLines?: number | null,
	preserveNewLines?: boolean,
	wrapLineLength?: number,
	wrapAttributes?: string,
	endWithNewline?: boolean
}

export interface FormattingComments {
	smarty: string[],
	html: string[],
	css: string[]
}

export interface FormattingTags {
	start: Set<string>,
	middle: Set<string>,
	end: Set<string>
}