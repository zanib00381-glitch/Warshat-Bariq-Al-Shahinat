import QRCode from "qrcode";

/**
 * QR code for a card's verification URL, as an inline SVG string.
 * No quiet zone here — the card adds its own white margin (as in the reference PDF).
 * Deterministic from the URL, so it's rendered on demand instead of stored.
 * Works on the server and in the browser (the admin list exports PDFs client-side).
 */
export function qrSvgFor(url: string): Promise<string> {
  return QRCode.toString(url, { type: "svg", errorCorrectionLevel: "M", margin: 0 });
}
