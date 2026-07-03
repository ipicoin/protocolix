/**
 * receive-screen.js — ekran odbioru (Fala 3).
 * Pokazuje adres portfela jako QR + tekst z przyciskiem kopiowania.
 */
import { getWalletService } from "../wallet/wallet-service.js";
import { renderQrInto } from "./qr.js";

window.customElements.define(
	"ipi-receive-screen",
	class extends HTMLElement {
		constructor() {
			super();
			const root = this.attachShadow({ mode: "open" });
			root.innerHTML = `
				<style>
					:host { display:block; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif; }
					.card { padding:20px; text-align:center; }
					.addr { font-family:monospace; font-size:0.85em; word-break:break-all; color:#333; background:#f4f4f4; padding:8px; border-radius:6px; margin:12px 0; }
					button { padding:10px 14px; background:#31d53d; color:#fff; border:0; border-radius:6px; cursor:pointer; }
					.status { font-size:0.85em; color:#080; min-height:1.2em; }
				</style>
				<div class="card">
					<h2>Odbierz</h2>
					<div id="qr"></div>
					<div class="addr" id="address">brak portfela</div>
					<button id="copy">Kopiuj adres</button>
					<div class="status" id="status"></div>
				</div>
			`;
		}

		connectedCallback() {
			this.svc = getWalletService();
			this.shadowRoot.querySelector("#copy").addEventListener("click", () => this.copy());
			this.load();
		}

		async load() {
			const addrEl = this.shadowRoot.querySelector("#address");
			try {
				this.address = await this.svc.getAddress();
				addrEl.textContent = this.address;
				renderQrInto(this.shadowRoot.querySelector("#qr"), this.address);
			} catch (err) {
				addrEl.textContent = err.message;
			}
		}

		async copy() {
			const statusEl = this.shadowRoot.querySelector("#status");
			try {
				await navigator.clipboard.writeText(this.address || "");
				statusEl.textContent = "Skopiowano.";
			} catch {
				statusEl.textContent = "Nie udało się skopiować.";
			}
		}
	},
);
