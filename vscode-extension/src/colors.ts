import * as vscode from "vscode";

/** Matches #rgb, #rgba, #rrggbb, #rrggbbaa hex colors */
const HEX_COLOR_REGEX = /#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g;

/** Matches rgb(...) and rgba(...) */
const RGBA_COLOR_REGEX = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/g;

export class SlideColorProvider implements vscode.DocumentColorProvider {
  provideDocumentColors(
    document: vscode.TextDocument,
    _token: vscode.CancellationToken
  ): vscode.ColorInformation[] {
    const colors: vscode.ColorInformation[] = [];
    const text = document.getText();

    // Scan hex colors
    let match: RegExpExecArray | null;
    while ((match = HEX_COLOR_REGEX.exec(text)) !== null) {
      const hex = match[1];
      const startPos = document.positionAt(match.index);
      const endPos = document.positionAt(match.index + match[0].length);
      const range = new vscode.Range(startPos, endPos);
      const color = parseHex(hex);
      if (color) {
        colors.push(new vscode.ColorInformation(range, color));
      }
    }

    // Scan rgba colors
    while ((match = RGBA_COLOR_REGEX.exec(text)) !== null) {
      const r = parseInt(match[1], 10) / 255;
      const g = parseInt(match[2], 10) / 255;
      const b = parseInt(match[3], 10) / 255;
      const a = match[4] != null ? parseFloat(match[4]) : 1;
      const startPos = document.positionAt(match.index);
      const endPos = document.positionAt(match.index + match[0].length);
      const range = new vscode.Range(startPos, endPos);
      colors.push(new vscode.ColorInformation(range, new vscode.Color(r, g, b, a)));
    }

    return colors;
  }

  provideColorPresentations(
    color: vscode.Color,
    _context: { document: vscode.TextDocument; range: vscode.Range },
    _token: vscode.CancellationToken
  ): vscode.ColorPresentation[] {
    const r = Math.round(color.red * 255);
    const g = Math.round(color.green * 255);
    const b = Math.round(color.blue * 255);
    const a = color.alpha;

    let hex: string;
    if (a < 1) {
      const aHex = Math.round(a * 255).toString(16).padStart(2, "0");
      hex = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}${aHex}`;
    } else {
      hex = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
    }

    const rgba = a < 1
      ? `rgba(${r}, ${g}, ${b}, ${a.toFixed(2)})`
      : `rgb(${r}, ${g}, ${b})`;

    return [
      new vscode.ColorPresentation(hex),
      new vscode.ColorPresentation(rgba),
    ];
  }
}

function parseHex(hex: string): vscode.Color | null {
  if (hex.length === 3) {
    const r = parseInt(hex[0] + hex[0], 16) / 255;
    const g = parseInt(hex[1] + hex[1], 16) / 255;
    const b = parseInt(hex[2] + hex[2], 16) / 255;
    return new vscode.Color(r, g, b, 1);
  }
  if (hex.length === 4) {
    const r = parseInt(hex[0] + hex[0], 16) / 255;
    const g = parseInt(hex[1] + hex[1], 16) / 255;
    const b = parseInt(hex[2] + hex[2], 16) / 255;
    const a = parseInt(hex[3] + hex[3], 16) / 255;
    return new vscode.Color(r, g, b, a);
  }
  if (hex.length === 6) {
    const r = parseInt(hex.slice(0, 2), 16) / 255;
    const g = parseInt(hex.slice(2, 4), 16) / 255;
    const b = parseInt(hex.slice(4, 6), 16) / 255;
    return new vscode.Color(r, g, b, 1);
  }
  if (hex.length === 8) {
    const r = parseInt(hex.slice(0, 2), 16) / 255;
    const g = parseInt(hex.slice(2, 4), 16) / 255;
    const b = parseInt(hex.slice(4, 6), 16) / 255;
    const a = parseInt(hex.slice(6, 8), 16) / 255;
    return new vscode.Color(r, g, b, a);
  }
  return null;
}
