/**
 * wallet-service.js — Fala 3: warstwa integracji mobile <-> wallet-core.
 *
 * Ten serwis jest CIENKIM adapterem. Cała logika kryptograficzna (mnemonik,
 * derywacja kluczy, podpisywanie i broadcast transakcji) należy do SSOT:
 * `wallet-core.js` publikowanego jako pakiet `@ipicoin/wallet-core`.
 *
 * REALNY surface wallet-core (default export):
 *   import walletCore from "@ipicoin/wallet-core";
 *   const { Operations, Models } = walletCore;
 *   Operations.generateWalletKey()            -> cosmjs DirectSecp256k1HdWallet
 *   Operations.importWalletByMnemonic(mnemo)  -> cosmjs DirectSecp256k1HdWallet
 *   Operations.sendAmount(fromWallet, toAddress, tokenAmount, chainConfig, message?, feeCalc?)
 *        -> SAM podpisuje i broadcastuje (SigningStargateClient.sendTokens)
 *
 * Uwagi wynikające z realnego API:
 *  - portfel to obiekt cosmjs — NIE ma metody `getAddress()`; adres pobiera się
 *    przez `(await wallet.getAccounts())[0].address`,
 *  - `generateWalletKey()` sam generuje 24-słowny mnemonik (parametr entropii
 *    jest po stronie rdzenia); mnemonik odczytujemy z `wallet.mnemonic`,
 *  - `sendAmount(...)` nie zwraca osobnego "signed tx" do ręcznego broadcastu —
 *    całość dzieje się w rdzeniu; my tylko przekazujemy argumenty i czytamy hash.
 *
 * Dopóki pakiet nie jest opublikowany, ten plik działa w trybie STUB:
 *  - eksponuje stabilny kontrakt API dla ekranów (src/screens/*),
 *  - saldo (odczyt) działa bez rdzenia — przez LCD (REST) łańcucha,
 *  - operacje zależne od kryptografii rzucają `WalletCoreNotLinked`.
 */

/**
 * TODO(fala3): po publikacji pakietu odkomentuj import i zwróć go w loadWalletCore().
 *
 *   import walletCore from "@ipicoin/wallet-core";
 *
 * Do czasu publikacji `loadWalletCore()` zwraca null, co sygnalizuje, że rdzeń
 * kryptograficzny nie jest jeszcze spięty (STUB). Kontrakt tej klasy się nie zmienia.
 */

/**
 * Konfiguracja łańcucha IPI (SSOT dla parametrów sieci).
 * @typedef {Object} ChainConfig
 * @property {string} chainId       Identyfikator łańcucha (cosmos sdk).
 * @property {string} rpcUrl        Endpoint Tendermint RPC (JSON-RPC) — używany przez rdzeń do broadcastu.
 * @property {string} restUrl       Endpoint LCD (REST, cosmos-sdk gRPC-gateway) — używany do odczytu sald.
 * @property {string} addressPrefix Prefiks bech32 adresów.
 * @property {string} denom         Denominacja bazowa (najmniejsza jednostka).
 * @property {string} displayDenom  Denominacja prezentacyjna (ticker widoczny).
 * @property {number} decimals      Liczba miejsc po przecinku (denom -> display).
 */

/** @type {ChainConfig} */
export const DEFAULT_CHAIN_CONFIG = {
	chainId: "ipi-mainnet-2",
	// Tendermint RPC (JSON-RPC): abci_query / broadcast_tx_sync. Broadcast idzie
	// przez rdzeń (SigningStargateClient) — nie budujemy własnych ścieżek REST na RPC.
	rpcUrl: "https://ipicoin.eu/rpc",
	// LCD / REST (cosmos-sdk): /cosmos/bank/v1beta1/balances/{addr} itd.
	// TODO(fala3): potwierdzić realny endpoint LCD z infrastrukturą IPI.
	restUrl: "https://ipicoin.eu/lcd",
	addressPrefix: "ipi",
	// Denom bazowy (base). Ticker widoczny to IPI (uppercase) — patrz displayDenom.
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
 * Po odkomentowaniu importu na górze pliku ma zwracać `walletCore`
 * (default export z polami `Operations` i `Models`).
 * @returns {{Operations:object, Models:object}|null} moduł wallet-core albo null gdy niespięty.
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
		/** @type {{Operations:object, Models:object}|null} */
		this.core = loadWalletCore();
		/** @type {?object} bieżący portfel cosmjs (DirectSecp256k1HdWallet). */
		this.wallet = null;
	}

	/** @returns {boolean} czy rdzeń kryptograficzny jest spięty. */
	isCoreLinked() {
		return this.core !== null;
	}

	/**
	 * Zwraca `Operations` z rdzenia albo rzuca WalletCoreNotLinked.
	 * @param {string} operation nazwa operacji (do komunikatu błędu).
	 * @returns {object}
	 */
	#ops(operation) {
		if (!this.core || !this.core.Operations) throw new WalletCoreNotLinked(operation);
		return this.core.Operations;
	}

	/**
	 * Tworzy nowy portfel. Rdzeń (`Operations.generateWalletKey`) sam generuje
	 * 24-słowny mnemonik — zwracamy go do bezpiecznego zapisania przez warstwę UI.
	 * @returns {Promise<{address:string, mnemonic:string}>}
	 */
	async createWallet() {
		const ops = this.#ops("createWallet");
		// generateWalletKey() -> cosmjs DirectSecp256k1HdWallet (sam derywuje mnemonik).
		this.wallet = await ops.generateWalletKey();
		const mnemonic = this.wallet.mnemonic;
		return { address: await this.getAddress(), mnemonic };
	}

	/**
	 * Odtwarza portfel z mnemonika przez rdzeń.
	 * @param {string} mnemonic 12/24 słowa BIP39.
	 * @returns {Promise<{address:string}>}
	 */
	async restore(mnemonic) {
		const ops = this.#ops("restore");
		if (typeof mnemonic !== "string" || mnemonic.trim().split(/\s+/).length < 12) {
			throw new Error("Nieprawidłowy mnemonik (oczekiwano 12 lub 24 słów).");
		}
		// importWalletByMnemonic(mnemonic) -> cosmjs DirectSecp256k1HdWallet.
		this.wallet = await ops.importWalletByMnemonic(mnemonic.trim());
		return { address: await this.getAddress() };
	}

	/**
	 * Zwraca adres bech32 z prefiksem `ipi`.
	 * Portfel cosmjs NIE ma `getAddress()` — adres przez getAccounts().
	 * @returns {Promise<string>}
	 */
	async getAddress() {
		if (!this.wallet) throw new Error("Brak aktywnego portfela — użyj createWallet/restore.");
		const accounts = await this.wallet.getAccounts();
		const address = accounts && accounts[0] && accounts[0].address;
		if (!address) throw new Error("Portfel nie zwrócił żadnego konta.");
		if (!address.startsWith(`${this.chainConfig.addressPrefix}1`)) {
			throw new Error(`Adres nie ma oczekiwanego prefiksu "${this.chainConfig.addressPrefix}".`);
		}
		return address;
	}

	/**
	 * Pobiera saldo przez LCD (REST) łańcucha — czysty odczyt, bez rdzenia.
	 * GET {restUrl}/cosmos/bank/v1beta1/balances/{addr}
	 * @param {string} [address] domyślnie adres aktywnego portfela.
	 * @returns {Promise<{denom:string, amount:string, display:string}>}
	 */
	async getBalance(address) {
		const addr = address || (await this.getAddress());
		const base = this.chainConfig.restUrl.replace(/\/$/, "");
		const url = `${base}/cosmos/bank/v1beta1/balances/${encodeURIComponent(addr)}`;
		// TODO(fala3): rozważyć @capacitor/http dla natywnego stosu sieciowego.
		const res = await fetch(url, {
			method: "GET",
			headers: { accept: "application/json" },
		});
		if (!res.ok) {
			throw new Error(`LCD balances zwróciło HTTP ${res.status}`);
		}
		const data = await res.json();
		// Kształt: { balances: [{ denom, amount }, ...], pagination: {...} }
		const balances = (data && data.balances) || [];
		const entry = balances.find((b) => b && b.denom === this.chainConfig.denom);
		const amount = (entry && entry.amount) || "0";
		return {
			denom: this.chainConfig.denom,
			amount: String(amount),
			display: this.toDisplayAmount(amount),
		};
	}

	/**
	 * Wysyła środki (nipi) na adres odbiorcy.
	 * Rdzeń (`Operations.sendAmount`) SAM podpisuje i broadcastuje transakcję —
	 * nie ma osobnego kroku "zwróć signed tx i wyślij przez RPC".
	 * @param {object} params
	 * @param {string} params.to      adres odbiorcy (ipi1...).
	 * @param {string|number} params.amount kwota w `nipi` (najmniejsza jednostka).
	 * @param {string} [params.memo]  opcjonalne memo/wiadomość.
	 * @returns {Promise<{txHash:string}>}
	 */
	async send({ to, amount, memo = "" }) {
		const ops = this.#ops("send");
		if (!this.wallet) throw new Error("Brak aktywnego portfela — użyj createWallet/restore.");
		if (typeof to !== "string" || !to.startsWith(`${this.chainConfig.addressPrefix}1`)) {
			throw new Error("Nieprawidłowy adres odbiorcy.");
		}
		const amt = String(amount);
		if (!/^\d+$/.test(amt) || amt === "0") {
			throw new Error("Kwota musi być dodatnią liczbą całkowitą w nipi.");
		}
		// sendAmount(fromWallet, toAddress, tokenAmount, chainConfig, message?, feeCalc?)
		// — rdzeń używa chainConfig.denom + rpcUrl (SigningStargateClient), podpisuje i broadcastuje.
		const result = memo
			? await ops.sendAmount(this.wallet, to, amt, this.chainConfig, memo)
			: await ops.sendAmount(this.wallet, to, amt, this.chainConfig);
		// cosmjs sendTokens -> DeliverTxResponse.transactionHash
		const txHash = (result && (result.transactionHash || result.txHash || result.txhash)) || "";
		return { txHash };
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
