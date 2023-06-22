# Smarty Template for Visual Studio Code

[![Latest Release](https://img.shields.io/visual-studio-marketplace/v/aswinkumar863.smarty-template-support?logo=visual-studio-code&label=Smarty%20Template%20Support)](https://marketplace.visualstudio.com/items?itemName=aswinkumar863.smarty-template-support)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/aswinkumar863.smarty-template-support)](https://marketplace.visualstudio.com/items?itemName=aswinkumar863.smarty-template-support)
[![Rating](https://img.shields.io/visual-studio-marketplace/r/aswinkumar863.smarty-template-support)](https://marketplace.visualstudio.com/items?itemName=aswinkumar863.smarty-template-support&ssr=false#review-details)
[![GitHub Stars](https://img.shields.io/github/stars/aswinkumar863/smarty-vscode-support?logo=github)](https://github.com/aswinkumar863/smarty-vscode-support)
[![GitHub closed issues](https://img.shields.io/github/issues-closed/aswinkumar863/smarty-vscode-support)](https://github.com/aswinkumar863/smarty-vscode-support/issues)

This extension provides [Smarty Template](https://www.smarty.net/) support for Visual Studio Code. 
Supports `{...}` and `{{...}}` delimiters. Available for both VSCode [desktop](https://code.visualstudio.com/Download) and [web](https://vscode.dev/).

## Features

* Syntax highlighting
* Snippet completion
* Code formatting
* Code folding
* Code navigation
* Comment toggling
* Bracket autoclosing
* Bracket autosurrounding
* Hover documentation
* Auto Indentation

## What it looks like

![Settings](images/preview.gif)

## Requirements

* VS Code `1.43.0` or higher

## Extension Settings


![Settings](images/settings-preview.png)

* **`smarty.highlight`**: Enable/disable highlight decoration of smarty tags documents.
* **`smarty.highlightColor`**: Highlight decoration color based on dark/light theme kind.

**For example:**

```jsonc
"smarty.highhlight": true,
"smarty.highlightColor": {
  "dark": "#FFFFFF25",
  "light": "#FFFA0040"
}
```

## Formatting Settings

Here is the list of native vscode settings used in smarty document formatting.

```jsonc
{
  // The number of spaces a tab is equal to.
  "editor.tabSize": 4,

  // Indent using spaces.
  "editor.insertSpaces": true,

  // End with a newline.
  "html.format.endWithNewline": false,

  // Indent `<head>` and `<body>` sections.
  "html.format.indentInnerHtml": false,

  // Maximum number of line breaks to be preserved in one chunk. Use `null` for unlimited.
  "html.format.maxPreserveNewLines": null,

  // Controls whether existing line breaks before elements should be preserved.
  "html.format.preserveNewLines": true,

  // Wrap attributes.
  //  - auto: Wrap attributes only when line length is exceeded.
  //  - force: Wrap each attribute except first.
  //  - force-aligned: Wrap each attribute except first and keep aligned.
  //  - force-expand-multiline: Wrap each attribute.
  //  - aligned-multiple: Wrap when line length is exceeded, align attributes vertically.
  //  - preserve: Preserve wrapping of attributes.
  //  - preserve-aligned: Preserve wrapping of attributes but align.
  "html.format.wrapAttributes": "auto",

  // Maximum amount of characters per line (0 = disable).
  "html.format.wrapLineLength": 120
}
```

## User Settings

**For Emmet Abbreviations:**

Paste the following into your `settings.json`

```jsonc
"emmet.includeLanguages": {
  "smarty": "html"
}
```

**For Netbeans Style Theme:**

![Netbeans Theme](images/netbeans-theme-preview.png)

Paste the following into your `settings.json`

<details>
  <summary>Click to expand settings!</summary>
  
  ```jsonc
  "editor.tokenColorCustomizations": {
    "textMateRules": [
      {
        "scope": [
          "punctuation.section.embedded.begin.smarty",
          "punctuation.section.embedded.end.smarty"
        ],
        "settings": {
          "foreground": "#FFA500",
          "fontStyle": "bold"
        }
      },
      {
        "scope": [
          "keyword.control.smarty",
          "support.function.built-in.smarty"
        ],
        "settings": {
          "foreground": "#16A016",
          "fontStyle": "bold"
        }
      },
      {
        "scope": ["variable.parameter.smarty"],
        "settings": {
          "foreground": "#AE23A3",
          "fontStyle": "bold"
        }
      },
      {
        "scope": ["source.smarty"],
        "settings": {
          "foreground": "#D17C32"
        }
      }
    ]
  }
  ```
</details>

## Issues

Submit the [issues](https://github.com/aswinkumar863/smarty-vscode-support/issues) if you find any bug or have any suggestion.

## Release Notes

Detailed release notes are available [here](CHANGELOG.md).
