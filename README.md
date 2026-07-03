## Created with Capacitor Create App

This app was created using [`@capacitor/create-app`](https://github.com/ionic-team/create-capacitor-app),
and comes with a very minimal shell for building an app.

### Running this example

To run the provided example, you can use `npm start` command.

```bash
npm start
```


- [the R1 system](https://chainway.us/Products/Info/135)
- [article about asymetric security in NFC implementations of transactional systems](https://www.researchgate.net/publication/260655435_Security-Enabled_Near-Field_Communication_Tag_With_Flexible_Architecture_Supporting_Asymmetric_Cryptography)

## Wallet integration (Fala 3)

Warstwa integracji portfela mobilnego z rdzeniem `wallet-core` (SSOT:
`@ipicoin/wallet-core`) i RPC IPI (`https://ipicoin.eu/rpc`, denom `nipi`).
Ponieważ Capacitor pakuje web assets, całość jest współdzielonym JS w `src/`.

- `src/wallet/` — serwis owijający wallet-core (`wallet-service.js`),
  bezpieczne przechowywanie mnemonika (`storage.js`) oraz architektura
  (`src/wallet/README.md`). Kontrakt: `createWallet`, `restore`, `getAddress`
  (prefiks `ipi`), `getBalance`, `send` (w `nipi`).
- `src/screens/` — szkice ekranów: `<ipi-wallet-screen>` (saldo+adres+QR),
  `<ipi-send-screen>`, `<ipi-receive-screen>` (patrz `src/screens/README.md`).

Stan: serwis w trybie STUB do czasu publikacji `@ipicoin/wallet-core` —
miejsca zależne od rdzenia oznaczone `TODO(fala3)`. Szczegóły i przepływy:
[`src/wallet/README.md`](src/wallet/README.md). Issue: #3.