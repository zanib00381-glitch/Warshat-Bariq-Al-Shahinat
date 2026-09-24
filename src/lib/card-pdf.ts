/**
 * Client-side PDF export of the rendered card (no server needed — free-hosting friendly).
 *
 * The on-screen card DOM is rasterized with html-to-image, which lets the browser
 * itself draw the text (via SVG foreignObject). That keeps Arabic letter-joining
 * and bidi ordering correct — html2canvas and @react-pdf don't shape Arabic reliably.
 */
const PAGE_WIDTH_PT = 792; // US Letter landscape, same as the reference PDF
const PAGE_HEIGHT_PT = 612;

/** Downloads the rendered card element as a one-page PDF named after its under-run number. */
export async function downloadCardPdf(cardEl: HTMLElement, underRunNumberFull: string) {
  const fileName = `UPD-Card-${underRunNumberFull.replace(/[^A-Z0-9]/gi, "")}.pdf`;
  const title = `UPD Card ${underRunNumberFull}`;
  const [{ toPng }, { jsPDF }] = await Promise.all([import("html-to-image"), import("jspdf")]);
  await document.fonts.ready;

  // ~290 dpi: sharp text and an easily scannable QR code.
  const png = await toPng(cardEl, {
    pixelRatio: 3,
    backgroundColor: "#ffffff",
    fontEmbedCSS: await fontCssFor(cardEl),
  });

  const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "letter", compress: true });
  pdf.setProperties({ title });
  pdf.addImage(png, "PNG", 0, 0, PAGE_WIDTH_PT, PAGE_HEIGHT_PT, undefined, "FAST");
  pdf.save(fileName);
}

/**
 * Builds @font-face CSS (fonts inlined as data URLs) for only the font files the
 * card needs. Left to itself html-to-image would inline every web font on the
 * page — including the multi-MB Urdu Nastaliq font the card never uses.
 */
async function fontCssFor(root: HTMLElement): Promise<string> {
  const elements = [root, ...root.querySelectorAll<HTMLElement>("*")];
  const families = new Set(
    elements.flatMap((el) => getComputedStyle(el).fontFamily.split(",").map((f) => f.trim().replace(/^["']|["']$/g, ""))),
  );
  const codePoints = new Set([...(root.textContent ?? "")].map((c) => c.codePointAt(0)!));

  const faces: CSSFontFaceRule[] = [];
  for (const sheet of document.styleSheets) {
    let rules: CSSRuleList;
    try {
      rules = sheet.cssRules;
    } catch {
      continue; // cross-origin stylesheet
    }
    for (const rule of rules) {
      if (!(rule instanceof CSSFontFaceRule)) continue;
      const family = rule.style.getPropertyValue("font-family").trim().replace(/^["']|["']$/g, "");
      if (families.has(family) && coversAny(rule.style.getPropertyValue("unicode-range"), codePoints)) {
        faces.push(rule);
      }
    }
  }

  const css = await Promise.all(
    faces.map(async (rule) => {
      const url = rule.style.getPropertyValue("src").match(/url\(["']?([^"')]+)["']?\)/)?.[1];
      if (!url) return "";
      const dataUrl = await toDataUrl(new URL(url, rule.parentStyleSheet?.href ?? location.href).href);
      return rule.cssText.replace(/src:[^;]+;/, `src: url("${dataUrl}");`);
    }),
  );
  return css.join("\n");
}

/** True when a CSS `unicode-range` (e.g. "U+0-FF, U+131") covers any of the code points. */
function coversAny(unicodeRange: string, codePoints: Set<number>): boolean {
  if (!unicodeRange.trim()) return true;
  return unicodeRange.split(",").some((part) => {
    const [from, to = from] = part.trim().replace(/^U\+/i, "").split("-");
    const lo = parseInt(from.replace(/\?/g, "0"), 16);
    const hi = parseInt(to.replace(/\?/g, "F"), 16);
    for (const cp of codePoints) if (cp >= lo && cp <= hi) return true;
    return false;
  });
}

async function toDataUrl(url: string): Promise<string> {
  const blob = await (await fetch(url)).blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/**
 * Copies text on every browser we care about: the async Clipboard API where
 * available (HTTPS, modern browsers), otherwise a hidden-textarea fallback that
 * also works on older iOS Safari and on plain-http LAN testing.
 */
export async function copyText(text: string): Promise<boolean> {
  if (navigator.clipboard?.writeText && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // permission denied / document not focused — try the fallback
    }
  }
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", ""); // no on-screen keyboard on mobile
  Object.assign(area.style, { position: "fixed", top: "0", left: "0", opacity: "0", fontSize: "16px" }); // 16px: no iOS zoom
  document.body.appendChild(area);
  const selection = document.getSelection();
  const previous = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
  area.focus();
  area.select();
  area.setSelectionRange(0, text.length); // iOS ignores select()
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }
  area.remove();
  if (previous) {
    selection?.removeAllRanges();
    selection?.addRange(previous);
  }
  return ok;
}
