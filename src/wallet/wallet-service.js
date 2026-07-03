/**
 * wallet-service.js — Fala 3: warstwa integracji mobile <-> wallet-core.
 *
 * Ten serwis jest CIENKIM adapterem. Cała logika kryptograficzna (mnemonik,
 * derywacja kluczy, podpisywanie transakcji) należy do SSOT: `wallet-core.js`
 * publikowanego jako pakiet `@ipicoin/wallet-core`.
 *
 * Dopóki pakiet nie jest opublikowany, ten plik działa w trybie STUB:
 *  - eksponuje stabilny kontrakt API dla ekranów (src/screens/*),
 *  - waliduje wejścia i buduje zapytania RPC,
 *  - w miejscach zależnych od kryptografii rzuca czytelny błąd `WalletCoreNotLinked`.
 *
 * Gdy `@ipicoin/wallet-core` będzie dostępny, wystarczy podmienić import
 * (patrz TODO poniżej) — kontrakt tej klasy pozostaje bez zmian.
 */

/**
 * TODO(fala3): po publikacji pakietu odkomentuj poniższy import i usuń stub.
 *
 *   import * as walletCore from "@ipicoin/wallet-core";
 *
 * Do czasu publikacji `loadWalletCore()` zwraca stub, który sygnalizuje,
 * że rdzeń kryptograficzny nie jest jeszcze spięty.
 */

/**
 * Konfiguracja łańcucha IPI (SSOT dla parametrów sieci).
 * @typedef {Object} ChainConfig
 * @property {string} chainId       Identyfikator łańcucha (cosmos sdk).
 * @property {string} rpcUrl        Endpoint RPC.
 * @property {string} addressPrefix Prefiks bech32 adresów.
 * @property {string} denom         Denominacja bazowa (najmniejsza jednostka).
 * @property {string} displayDenom  Denominacja prezentacyjna.
 * @property {number} decimals      Liczba miejsc po przecinku (denom -> display).
 */

/** @type {ChainConfig} */
export const DEFAULT_CHAIN_CONFIG = {
	chainId: "ipi-mainnet-2",
	rpcUrl: "https://ipicoin.eu/rpc",
	addressPrefix: "ipi",
	denom: "nipi",
	displayDenom: "IPI",
	// 1 IPI = 10^9 nipi (nano-IPI). TODO(fala3): potwierdzić z chain genesis.
	decimals: 9,
};

/** Rzucany, gdy operacja wymaga rdzenia @ipicoin/wallet-core, a nie jest on spięty. */
export class WalletCoreNotLinked extends Error {
	constructor(operation) {
		super(
			`@ipicoin/wallet-core nie jest jeszcze spięty — operacja "${operation}" ` +
				"wymaga rdzenia kryptograficznego. Patrz TODO(fala3) w wallet-service.js.",
		);
		this.name = "WalletCoreNotLinked";
	}
}

/**
 * Ładuje rdzeń wallet-core. Stub do czasu publikacji pakietu.
 * @returns {object|null} moduł wallet-core albo null gdy niespięty.
 */
function loadWalletCore() {
	// TODO(fala3): return walletCore; — po odkomentowaniu importu na górze pliku.
	return null;
}

/**
 * Serwis portfela. Jedna instancja na aplikację (patrz getWalletService()).
 */
export class WalletService {
	/**
	 * @param {object} [opts]
	 * @param {Partial<ChainConfig>} [opts.chainConfig] nadpisania konfiguracji.
	 * @param {object} [opts.storage] adapter bezpiecznego magazynu (patrz storage.js).
	 */
	constructor(opts = {}) {
		/** @type {ChainConfig} */
		this.chainConfig = { ...DEFAULT_CHAIN_CONFIG, ...(opts.chainConfig || {}) };
		this.storage = opts.storage || null;
		this.core = loadWalletCore();
		/** @type {?object} bieżący portfel w pamięci (adres + uchwyt do rdzenia). */
		this.wallet = null;
	}

	/** @returns {boolean} czy rdzeń kryptograficzny jest spięty. */
	isCoreLinked() {
		return this.core !== null;
	}

	/**
	 * Tworzy nowy portfel (generuje mnemonik przez wallet-core).
	 * @param {object} [opts]
	 * @param {number} [opts.strength=256] entropia mnemonika (12 słów=128, 24=256).
	 * @returns {Promise<{address:string, mnemonic:string}>}
	 */
	async createWallet({ strength = 256 } = {}) {
		if (!this.core) throw new WalletCoreNotLinked("createWallet");
		// TODO(fala3): const mnemonic = this.core.generateMnemonic(strength);
		//             return this.restore(mnemonic);
		const mnemonic = this.core.generateMnemonic(strength);
		return this.restore(mnemonic);
	}

	/**
	 * Odtwarza portfel z mnemonika.
	 * @param {string} mnemonic 12/24 słowa BIP39.
	 * @returns {Promise<{address:string}>}
	 */
	async restore(mnemonic) {
		if (!this.core) throw new WalletCoreNotLinked("restore");
		if (typeof mnemonic !== "string" || mnemonic.trim().split(/\s+/).length < 12) {
			throw new Error("Nieprawidłowy mnemonik (oczekiwano 12 lub 24 słów).");
		}
		// TODO(fala3): this.wallet = await this.core.walletFromMnemonic(mnemonic, {
		//                 prefix: this.chainConfig.addressPrefix,
		//              });
		this.wallet = await this.core.walletFromMnemonic(mnemonic, {
			prefix: this.chainConfig.addressPrefix,
		});
		return { address: await this.getAddress() };
	}

	/**
	 * Zwraca adres bech32 z prefiksem `ipi`.
	 * @returns {Promise<string>}
	 */
	async getAddress() {
		if (!this.wallet) throw new Error("Brak aktywnego portfela — użyj createWallet/restore.");
		// TODO(fala3): return this.wallet.getAddress();
		const address = await this.wallet.getAddress();
		if (!address.startsWith(`${this.chainConfig.addressPrefix}1`)) {
			throw new Error(`Adres nie ma oczekiwanego prefiksu "${this.chainConfig.addressPrefix}".`);
		}
		return address;
	}

	/**
	 * Pobiera saldo z RPC dla podanego (lub aktywnego) adresu.
	 * Zapytanie balance nie wymaga rdzenia kryptograficznego — to zwykły odczyt RPC.
	 * @param {string} [address] domyślnie adres aktywnego portfela.
	 * @returns {Promise<{denom:string, amount:string, display:string}>}
	 */
	async getBalance(address) {
		const addr = address || (await this.getAddress());
		const result = await this.#rpc("bank/balance", {
			address: addr,
			denom: this.chainConfig.denom,
		});
		const amount = (result && result.balance && result.balance.amount) || "0";
		return {
			denom: this.chainConfig.denom,
			amount: String(amount),
			display: this.toDisplayAmount(amount),
		};
	}

	/**
	 * Wysyła środki (nipi) na adres odbiorcy.
	 * Wymaga rdzenia (podpisanie transakcji), transmisja przez RPC.
	 * @param {object} params
	 * @param {string} params.to      adres odbiorcy (ipi1...).
	 * @param {string|number} params.amount kwota w `nipi` (najmniejsza jednostka).
	 * @param {string} [params.memo]  opcjonalne memo.
	 * @returns {Promise<{txHash:string}>}
	 */
	async send({ to, amount, memo = "" }) {
		if (!this.core) throw new WalletCoreNotLinked("send");
		if (!this.wallet) throw new Error("Brak aktywnego portfela — użyj createWallet/restore.");
		if (typeof to !== "string" || !to.startsWith(`${this.chainConfig.addressPrefix}1`)) {
			throw new Error("Nieprawidłowy adres odbiorcy.");
		}
		const amt = String(amount);
		if (!/^\d+$/.test(amt) || amt === "0") {
			throw new Error("Kwota musi być dodatnią liczbą całkowitą w nipi.");
		}
		// TODO(fala3): const signedTx = await this.core.signSend(this.wallet, {
		//                 to, amount: amt, denom: this.chainConfig.denom,
		//                 chainId: this.chainConfig.chainId, memo,
		//              });
		//              const res = await this.#rpc("tx/broadcast", { tx: signedTx });
		const signedTx = await this.core.signSend(this.wallet, {
			to,
			amount: amt,
			denom: this.chainConfig.denom,
			chainId: this.chainConfig.chainId,
			memo,
		});
		const res = await this.#rpc("tx/broadcast", { tx: signedTx });
		return { txHash: (res && res.txhash) || "" };
	}

	/**
	 * Konwersja denom bazowej (nipi) na kwotę prezentacyjną (IPI).
	 * @param {string|number} baseAmount kwota w nipi.
	 * @returns {string}
	 */
	toDisplayAmount(baseAmount) {
		const s = String(baseAmount).padStart(this.chainConfig.decimals + 1, "0");
		const cut = s.length - this.chainConfig.decimals;
		const whole = s.slice(0, cut);
		const frac = s.slice(cut).replace(/0+$/, "");
		return frac ? `${whole}.${frac}` : whole;
	}

	/**
	 * Konwersja kwoty prezentacyjnej (IPI) na denom bazową (nipi).
	 * @param {string|number} displayAmount kwota w IPI.
	 * @returns {string}
	 */
	toBaseAmount(displayAmount) {
		const [whole, frac = ""] = String(displayAmount).split(".");
		const fracPadded = frac.padEnd(this.chainConfig.decimals, "0").slice(0, this.chainConfig.decimals);
		return String(BigInt(`${whole}${fracPadded}`));
	}

	/**
	 * Minimalny klient RPC POST (JSON). Zastąpi go klient z ipi-rpc gdy dojrzeje.
	 * @param {string} path ścieżka względem rpcUrl.
	 * @param {object} body ładunek JSON.
	 * @returns {Promise<object>}
	 */
	async #rpc(path, body) {
		const url = `${this.chainConfig.rpcUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
		// TODO(fala3): rozważyć @capacitor/http dla natywnego stosu sieciowego.
		const res = await fetch(url, {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify(body),
		});
		if (!res.ok) {
			throw new Error(`RPC ${path} zwróciło HTTP ${res.status}`);
		}
		return res.json();
	}
}

/** @type {?WalletService} */
let _singleton = null;

/**
 * Zwraca współdzieloną instancję serwisu (leniwa inicjalizacja).
 * @param {object} [opts] przekazywane do konstruktora przy pierwszym wywołaniu.
 * @returns {WalletService}
 */
export function getWalletService(opts) {
	if (!_singleton) _singleton = new WalletService(opts);
	return _singleton;
}
