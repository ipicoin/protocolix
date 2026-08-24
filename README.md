# Protocolix

Capacitor application scaffold for a future IPI mobile wallet, with checked-in
Android and iOS projects and a small browser shell.

## What the source implements

- Capacitor 8 projects for Android and iOS;
- IPI application identifiers and native launch assets;
- a Vite-built web shell; and
- the default Capacitor camera demonstration.

The current application does **not** implement accounts, key generation or
storage, chain identity, balances, transaction construction, signing, recovery,
NFC, secure-element access, or an IPI network connection. The repository name
and native targets describe its intended integration role, not completed wallet
behavior.

## Development

The current Capacitor and Vite dependency graph requires Node.js `>=22.12.0`;
the verified audit environment used Node 24.

```sh
npm install
npm start
npm run build
npm run sync
```

`npm run build` currently produces the web bundle. `npm run sync` copies web
assets and plugin configuration into the native projects after dependencies are
installed. There is no application test suite yet; the generated native example
tests do not exercise wallet behavior.

## Intended integration boundary

Protocolix is expected to consume a separately reviewed wallet/key layer and to
present network identity, signer intent, messages, fees, and recovery behavior
before it can become a wallet. Research around P-256/R1, WebAuthn, NFC, or
hardware-backed keys belongs behind explicit platform interfaces and threat
models; adding a plugin is not evidence that those paths are secure.

## Development status

**Prototype scaffold.** The web shell builds, but this is not a wallet release
and must not be used to protect assets. A supported release requires implemented
wallet behavior, deterministic tests, secure storage and recovery design,
dependency review, protected release signing, migration procedures, and an
independent security assessment.

Never commit signing keys, recovery phrases, API secrets, or production wallet
material. Report security-sensitive findings through the organization
[security policy](https://github.com/ipicoin/.github/blob/main/SECURITY.md).

## License

Licensed under [Apache License 2.0](LICENSE).
