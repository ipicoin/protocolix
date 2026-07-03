/**
 * send-screen.js — ekran wysyłki (Fala 3).
 * Formularz: adres odbiorcy + kwota (IPI) + memo. Kwota jest konwertowana do
 * nipi przez serwis przed wywołaniem send(). Konsumuje getWalletService().
 */
import { getWalletService } from "../wallet/wallet-service.js";

window.customElements.define(
	"ipi-send-screen",
	class extends HTMLElement {
		constructor() {
			super();
			const root = this.attachShadow({ mode: "open" });
			root.innerHTML = `
				<style>
					:host { display:block; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif; }
					.card { padding:20px; display:flex; flex-direction:column; gap:12px; }
					label { font-size:0.85em; color:#555; }
					input { width:100%; padding:10px; border:1px solid #ddd; border-radius:6px; box-sizing:border-box; }
					button { padding:12px; background:#31d53d; color:#fff; border:0; border-radius:6px; cursor:pointer; font-size:1em; }
					.status { font-size:0.85em; min-height:1.2em; }
					.status.err { color:#c00; }
					.status.ok { color:#080; word-break:break-all; }
				</style>
				<div class="card">
					<h2>Wyślij</h2>
					<label>Adres odbiorcy (ipi1...)<input id="to" placeholder="ipi1..." /></label>
					<label>Kwota (IPI)<input id="amount" type="text" inputmode="decimal" placeholder="0.0" /></label>
					<label>Memo (opcjonalne)<input id="memo" /></label>
					<button id="send">Wyślij</button>
					<div class="status" id="status"></div>
				</div>
			`;
		}

		connectedCallback() {
			this.svc = getWalletService();
			this.shadowRoot.querySelector("#send").addEventListener("click", () => this.submit());
		}

		async submit() {
			const statusEl = this.shadowRoot.querySelector("#status");
			const to = this.shadowRoot.querySelector("#to").value.trim();
			const amountIpi = this.shadowRoot.querySelector("#amount").value.trim();
			const memo = this.shadowRoot.querySelector("#memo").value.trim();
			statusEl.className = "status";
			statusEl.textContent = "Wysyłanie...";
			try {
				const amountNipi = this.svc.toBaseAmount(amountIpi);
				const { txHash } = await this.svc.send({ to, amount: amountNipi, memo });
				statusEl.className = "status ok";
				statusEl.textContent = `OK — tx: ${txHash}`;
			} catch (err) {
				statusEl.className = "status err";
				statusEl.textContent = err.message;
			}
		}
	},
);
