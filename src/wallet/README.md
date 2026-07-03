# Warstwa portfela (Fala 3)

Ten katalog zawiera **warstwę integracji web** portfela mobilnego Protocolix.
Capacitor pakuje web assets (`src/` → `dist/`) do natywnego kontenera Android/iOS,
więc cała logika portfela żyje tu jako JavaScript i jest współdzielona przez obie
platformy.

## Zasada nadrzędna: jedno źródło prawdy (SSOT)

Cała kryptografia — generowanie mnemonika, derywacja kluczy (BIP39/BIP44),
budowa i podpisywanie transakcji cosmos-sdk — należy do **`wallet-core.js`**,
publikowanego jako pakiet **`@ipicoin/wallet-core`**.

Aplikacja mobilna **nie reimplementuje** kryptografii. `wallet-service.js` jest
cienkim adapterem, który:

- deleguje operacje kryptograficzne do `@ipicoin/wallet-core`,
- buduje i wysyła zapytania RPC (`https://ipicoin.eu/rpc`),
- eksponuje stabilny kontrakt dla ekranów (`src/screens/`).

> Stan obecny: pakiet `@ipicoin/wallet-core` nie jest jeszcze opublikowany.
> Serwis działa w trybie **STUB** — kontrakt API jest gotowy, a miejsca
> zależne od rdzenia rzucają `WalletCoreNotLinked`. Po publikacji wystarczy
> odkomentować `import * as walletCore from "@ipicoin/wallet-core"` w
> `wallet-service.js` (patrz znaczniki `TODO(fala3)`).

## Konfiguracja łańcucha (chainconfig)

`DEFAULT_CHAIN_CONFIG` w `wallet-service.js`:

| pole            | wartość                     | opis                                  |
| --------------- | --------------------------- | ------------------------------------- |
| `chainId`       | `ipi-mainnet-2`             | identyfikator łańcucha (SSOT)          |
| `rpcUrl`        | `https://ipicoin.eu/rpc`    | endpoint RPC                          |
| `addressPrefix` | `ipi`                       | prefiks bech32 adresów (`ipi1...`)    |
| `denom`         | `nipi`                      | denominacja bazowa (najmniejsza)      |
| `displayDenom`  | `IPI`                       | denominacja prezentacyjna             |
| `decimals`      | `9`                         | `1 IPI = 10^9 nipi` (do potwierdzenia)|

## Pliki

- **`wallet-service.js`** — serwis owijający wallet-core:
  `createWallet`, `restore`, `getAddress`, `getBalance`, `send`, plus konwersje
  `toDisplayAmount` / `toBaseAmount`. Singleton przez `getWalletService()`.
- **`storage.js`** — bezpieczne przechowywanie mnemonika (patrz niżej).
- ekrany konsumujące serwis: `../screens/`.

## Przepływy

### Wallet (podgląd)
1. Ekran wywołuje `getWalletService()`.
2. Jeśli mnemonik jest w magazynie → `restore(mnemonic)`; inaczej ekran onboardingu.
3. `getAddress()` → adres `ipi1...` (renderowany jako QR).
4. `getBalance()` → odczyt RPC salda w `nipi`, `toDisplayAmount()` → prezentacja w IPI.

### Send
1. Walidacja adresu odbiorcy (prefiks `ipi1`) i kwoty.
2. Kwota z UI (IPI) → `toBaseAmount()` → `nipi`.
3. `send({ to, amount, memo })` → podpis przez wallet-core → broadcast RPC.
4. Zwrot `txHash`.

### Receive
1. `getAddress()` → adres.
2. Render QR + przycisk kopiowania.

## Bezpieczne przechowywanie mnemonika

`storage.js` implementuje warstwę abstrakcji z kolejnością preferencji:

1. **Natywny bezpieczny magazyn** — iOS Keychain / Android Keystore. **TODO** —
   docelowy mechanizm, klucz szyfrujący związany z bezpiecznym elementem urządzenia.
2. **`@capacitor/preferences`** — trwały, ale nie szyfrowany sprzętowo (fallback).
3. **`localStorage`** — wyłącznie tryb dev w przeglądarce, **nigdy** w produkcji.

Zasady:
- Mnemonik nie jest logowany ani wysyłany po sieci.
- W produkcji mnemonik jest szyfrowany przed zapisem (klucz z bezpiecznego elementu).
- Odblokowanie sekretu (biometria / hardware-backed key) opisane w **`AUTH.md`**
  (TODO — dokument do dostarczenia w kolejnej fali; tu tylko punkt zaczepienia).

## Powiązania

- Issue: `ipicoin/protocolix#3` — [Fala 3] Mobile wallet spięty z wallet-core + ipi-rpc.
- Deklaracja: `ipicoin/universal-independency-declaration#1`.
