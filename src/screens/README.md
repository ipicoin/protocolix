# Ekrany portfela (Fala 3)

Szkice ekranów portfela mobilnego jako vanilla custom elements + shadow DOM —
zgodne ze stackiem repo (patrz `src/js/capacitor-welcome.js`). Brak zależności
od frameworka; każdy ekran konsumuje `getWalletService()` z `../wallet/`.

## Komponenty

| plik                 | element               | rola                                   |
| -------------------- | --------------------- | -------------------------------------- |
| `wallet-screen.js`   | `<ipi-wallet-screen>` | saldo + adres + QR + odśwież           |
| `send-screen.js`     | `<ipi-send-screen>`   | formularz wysyłki (adres, kwota, memo) |
| `receive-screen.js`  | `<ipi-receive-screen>`| adres + QR + kopiuj                    |
| `qr.js`              | —                     | pomocnik QR (placeholder, patrz TODO)  |

## Użycie

```html
<script type="module" src="./screens/wallet-screen.js"></script>
<ipi-wallet-screen></ipi-wallet-screen>
```

Ekrany nie zawierają kryptografii ani wywołań RPC — całość deleguje serwis
`wallet-service.js`. Kwoty w UI są w `IPI`; serwis konwertuje do/z `nipi`
(`toBaseAmount` / `toDisplayAmount`).

## TODO (kolejne fale)
- Nawigacja/tab bar spinająca 3 ekrany (obecnie osobne elementy).
- Realny generator QR w `qr.js` (patrz `TODO(fala3)`).
- Onboarding: tworzenie/odtwarzanie portfela (create/restore).
- Skan QR adresu odbiorcy w `send-screen` (`@capacitor/camera` już w zależnościach).
