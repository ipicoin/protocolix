/**
 * qr.js — pomocnik renderujący kod QR dla adresu (Fala 3).
 *
 * Stan obecny: PLACEHOLDER (bez zależności zewnętrznych). Rysuje ramkę i
 * skrócony adres, aby ekrany były kompletne wizualnie.
 *
 * TODO(fala3): dołączyć lekki generator QR (np. pakiet `qrcode`) i podmienić
 * ciało renderQrInto na realny render do <canvas>. Kontrakt funkcji bez zmian.
 */

/**
 * Renderuje reprezentację QR danego tekstu do kontenera.
 * @param {HTMLElement} container element docelowy (czyszczony przy każdym renderze).
 * @param {string} text zwykle adres ipi1...
 */
export function renderQrInto(container, text) {
	if (!container) return;
	const short = text && text.length > 16 ? `${text.slice(0, 10)}…${text.slice(-6)}` : text || "";
	container.innerHTML = `
		<div style="width:180px;height:180px;margin:0 auto;border:2px dashed #bbb;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-direction:column;color:#999;font-size:0.8em;text-align:center;padding:8px;box-sizing:border-box;">
			<div style="font-size:2em;">▦</div>
			<div>QR (placeholder)</div>
			<div style="font-family:monospace;margin-top:6px;word-break:break-all;">${short}</div>
		</div>
	`;
}
