/**
 * wallet-screen.js — ekran główny portfela (Fala 3).
 * Pokazuje saldo, adres i QR. Konsumuje getWalletService() z warstwy wallet/.
 *
 * Zgodny ze stackiem repo: vanilla custom element + shadow DOM (jak
 * capacitor-welcome.js). Brak zależności od frameworka.
 */
import { getWalletService } from "../wallet/wallet-service.js";
import { renderQrInto } from "./qr.js";

window.customElements.define(
	"ipi-wallet-screen",
	class extends HTMLElement {
		constructor() {
			super();
			const root = this.attachShadow({ mode: "open" });
			root.innerHTML = `
				<style>
					:host { display:block; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif; }
					.card { padding:20px; }
					.balance { font-size:2em; font-weight:700; color:#111; }
					.denom { font-size:0.5em; color:#666; margin-left:6px; }
					.addr { font-family:monospace; font-size:0.85em; word-break:break-all; color:#333; background:#f4f4f4; padding:8px; border-radius:6px; }
					.qr { margin:16px 0; }
					.hint { color:#999; font-size:0.85em; }
					button { padding:10px 14px; background:#31d53d; color:#fff; border:0; border-radius:6px; cursor:pointer; }
				</style>
				<div class="card">
					<div><span class="balance" id="balance">—</span><span class="denom" id="denom">IPI</span></div>
					<p class="hint">Twój adres:</p>
					<div class="addr" id="address">brak portfela</div>
					<div class="qr" id="qr"></div>
					<button id="refresh">Odśwież saldo</button>
				</div>
			`;
		}

		connectedCallback() {
			this.svc = getWalletService();
			this.shadowRoot.querySelector("#refresh").addEventListener("click", () => this.refresh());
			this.refresh();
		}

		async refresh() {
			const addrEl = this.shadowRoot.querySelector("#address");
			const balEl = this.shadowRoot.querySelector("#balance");
			try {
				const address = await this.svc.getAddress();
				addrEl.textContent = address;
				renderQrInto(this.shadowRoot.querySelector("#qr"), address);
				const bal = await this.svc.getBalance(address);
				balEl.textContent = bal.display;
				this.shadowRoot.querySelector("#denom").textContent = this.svc.chainConfig.displayDenom;
			} catch (err) {
				// Typowe przed spięciem @ipicoin/wallet-core (WalletCoreNotLinked).
				addrEl.textContent = err.message;
				balEl.textContent = "—";
			}
		}
	},
);
