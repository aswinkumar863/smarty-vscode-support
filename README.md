# Smarty Template for Visual Studio Code

[![Latest Release](https://vsmarketplacebadge.apphb.com/version-short/aswinkumar863.smarty-template-support.svg)](https://marketplace.visualstudio.com/items?itemName=aswinkumar863.smarty-template-support)
[![Installs](https://vsmarketplacebadge.apphb.com/installs/aswinkumar863.smarty-template-support.svg)](https://marketplace.visualstudio.com/items?itemName=aswinkumar863.smarty-template-support)
[![Rating](https://vsmarketplacebadge.apphb.com/rating-short/aswinkumar863.smarty-template-support.svg)](https://marketplace.visualstudio.com/items?itemName=aswinkumar863.smarty-template-support#review-details)
![GitHub closed issues](https://img.shields.io/github/issues-closed/aswinkumar863/smarty-vscode-support?color=blue)

Provides [Smarty Template](https://www.smarty.net/) support to Visual Studio Code.

## Features

* Syntax highlighting
* Snippet completion
* Code formatting
* Code folding
* Comment toggling
* Bracket autoclosing
* Bracket autosurrounding
* Hover documentation

## What it looks like

![Settings](images/preview.gif)

## Requirements

* VS Code `1.42.0` or higher

## Extension Settings


![Settings](images/settings-preview.png)

* **`smarty.highlight`**: Enable/disable highlight decoration of smarty tags documents.
* **`smarty.highlightColor`**: Highlight decoration color based on dark/light theme kind.

**For example:**

```
"smarty.highhlight": true,
"smarty.highlightColor": {
    "dark": "#FFFFFF25",
    "light": "#FFFA0040"
}
```

**For Netbeans Theme:**

![Netbeans Theme](images/netbeans-theme-preview.png)

Copy and Paste the following into your user `settings.json`

```
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
                "foreground": "#D17C32",
                "fontStyle": "bold"
            }
        }
    ]
}
```

## Known Issues

Due to the formatter is HTML based, code formatting applies only to `HTML/CSS/JS` of document.

Submit the [issues](https://github.com/aswinkumar863/smarty-vscode-support/issues) if you find any bug or have any suggestion.

## Release Notes

Detailed release notes are available [here](CHANGELOG.md).

