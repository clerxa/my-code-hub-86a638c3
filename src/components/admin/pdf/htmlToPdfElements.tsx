import { Text, View, StyleSheet } from "@react-pdf/renderer";
import type { Style } from "@react-pdf/types";
import React from "react";

const s = StyleSheet.create({
  paragraph: { marginBottom: 4 },
  bold: { fontFamily: "Helvetica-Bold" },
  italic: { fontFamily: "Helvetica-Oblique" },
  boldItalic: { fontFamily: "Helvetica-BoldOblique" },
  listItem: { flexDirection: "row", marginBottom: 2, paddingLeft: 6 },
  bullet: { width: 10, fontSize: 9 },
});

interface TextStyle {
  bold?: boolean;
  italic?: boolean;
}

function getFontStyle(style: TextStyle): Style {
  if (style.bold && style.italic) return s.boldItalic as Style;
  if (style.bold) return s.bold as Style;
  if (style.italic) return s.italic as Style;
  return {} as Style;
}

function walkInline(node: ChildNode, style: TextStyle): React.ReactNode[] {
  const results: React.ReactNode[] = [];

  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent || "";
    if (text) {
      results.push(
        <Text key={Math.random()} style={getFontStyle(style)}>
          {text}
        </Text>
      );
    }
    return results;
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return results;

  const el = node as Element;
  const tag = el.tagName.toLowerCase();

  const newStyle = { ...style };
  if (tag === "strong" || tag === "b") newStyle.bold = true;
  if (tag === "em" || tag === "i") newStyle.italic = true;

  if (tag === "br") {
    results.push(<Text key={Math.random()}>{"\n"}</Text>);
    return results;
  }

  for (const child of Array.from(el.childNodes)) {
    results.push(...walkInline(child, newStyle));
  }

  return results;
}

export function htmlToPdfElements(
  html: string,
  baseStyle: Style
): React.ReactNode[] {
  if (!html) return [];

  const container = document.createElement("div");
  container.innerHTML = html;

  const elements: React.ReactNode[] = [];

  for (const node of Array.from(container.childNodes)) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = (node.textContent || "").trim();
      if (text) {
        elements.push(
          <Text key={Math.random()} style={baseStyle}>
            {text}
          </Text>
        );
      }
      continue;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) continue;
    const el = node as Element;
    const tag = el.tagName.toLowerCase();

    if (tag === "ul" || tag === "ol") {
      const items = Array.from(el.querySelectorAll("li"));
      items.forEach((li, i) => {
        const bullet = tag === "ol" ? `${i + 1}. ` : "•  ";
        elements.push(
          <View key={Math.random()} style={s.listItem as Style}>
            <Text style={[baseStyle, s.bullet as Style]}>{bullet}</Text>
            <Text style={[baseStyle, { flex: 1 } as Style]}>
              {walkInline(li, {})}
            </Text>
          </View>
        );
      });
      continue;
    }

    const inlineChildren = walkInline(el, {});
    elements.push(
      <Text key={Math.random()} style={[baseStyle, s.paragraph as Style]}>
        {inlineChildren}
      </Text>
    );
  }

  return elements;
}
