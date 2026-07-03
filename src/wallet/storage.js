/**
 * storage.js — bezpieczne przechowywanie sekretów portfela (Fala 3).
 *
 * Warstwa abstrakcji nad magazynem urządzenia. Kolejność preferencji:
 *  1. Natywny bezpieczny magazyn (Keychain iOS / Keystore Android) — TODO.
 *  2. @capacitor/preferences (persist, ale NIE szyfrowany sprzętowo) — fallback.
 *  3. localStorage — tylko tryb dev w przeglądarce.
 *
 * ⚠️ Mnemonik NIGDY nie trafia do zwykłego localStorage w produkcji.
 * Docelowo klucz szyfrujący pochodzi z bezpiecznego elementu urządzenia
 * (patrz AUTH.md — biometria / hardware-backed key). Patrz TODO(fala3).
 */

const MNEMONIC_KEY = "ipi.wallet.mnemonic";

/**
 * Ładuje @capacitor/preferences jeśli dostępny (środowisko natywne/PWA).
 * @returns {Promise<?object>}
 */
async function loadPreferences() {
	try {
		// TODO(fala3): dodać @capacitor/preferences do package.json dependencies.
		const mod = await import("@capacitor/preferences");
		return mod.Preferences;
	} catch {
		return null;
	}
}

/**
 * Adapter magazynu sekretów. Kontrakt: getMnemonic/setMnemonic/clear.
 */
export class SecureStorage {
	constructor() {
		/** @type {?object} */
		this._prefs = null;
		this._ready = this.#init();
	}

	async #init() {
		this._prefs = await loadPreferences();
	}

	/**
	 * Zapisuje mnemonik.
	 * TODO(fala3): przed zapisem zaszyfrować kluczem z bezpiecznego elementu (AUTH.md).
	 * @param {string} mnemonic
	 */
	async setMnemonic(mnemonic) {
		await this._ready;
		if (this._prefs) {
			await this._prefs.set({ key: MNEMONIC_KEY, value: mnemonic });
			return;
		}
		// Fallback dev-only (przeglądarka). NIE dla produkcji.
		globalThis.localStorage?.setItem(MNEMONIC_KEY, mnemonic);
	}

	/**
	 * Odczytuje mnemonik.
	 * @returns {Promise<?string>}
	 */
	async getMnemonic() {
		await this._ready;
		if (this._prefs) {
			const { value } = await this._prefs.get({ key: MNEMONIC_KEY });
			return value ?? null;
		}
		return globalThis.localStorage?.getItem(MNEMONIC_KEY) ?? null;
	}

	/** Usuwa mnemonik z magazynu (logout / wipe). */
	async clear() {
		await this._ready;
		if (this._prefs) {
			await this._prefs.remove({ key: MNEMONIC_KEY });
			return;
		}
		globalThis.localStorage?.removeItem(MNEMONIC_KEY);
	}
}

export { MNEMONIC_KEY };
