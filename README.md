# Protocolix

An experimental Capacitor and Vue mobile-wallet shell for IPI protocol research.

> **Status: pre-alpha.** Protocolix is not a production wallet. Key storage,
> transaction review, chain identity, recovery, device integrity, supply-chain
> security, and release signing have not been documented or audited for real
> assets.

## Current scope

The repository provides a cross-platform application shell with Capacitor
targets for Android and iOS. It is a place to prototype wallet interactions,
including research around hardware-backed P-256/R1 keys and NFC-assisted flows.
Those experiments do not establish that a device, NFC tag, or transaction path
is secure.

Relevant background material includes:

- [Chainway R1 product information](https://chainway.us/Products/Info/135); and
- research on asymmetric cryptography in security-enabled NFC tags
  ([publication](https://www.researchgate.net/publication/260655435_Security-Enabled_Near-Field_Communication_Tag_With_Flexible_Architecture_Supporting_Asymmetric_Cryptography)).

External links are research inputs, not endorsements or security attestations.

## Development

```sh
npm install
npm start
npm test
npm run build
```

After adding or changing native plugins, synchronize platform projects with:

```sh
npm run sync
```

Never commit signing keys, recovery phrases, API secrets, or production wallet
material. Security-sensitive findings must use the private reporting process in
the organization [security policy](https://github.com/ipicoin/.github/blob/main/SECURITY.md).

## Release requirements

A real wallet release requires, at minimum, a reviewed threat model, explicit
chain and transaction displays, deterministic builds where the platform allows
them, protected release signing, recovery and migration tests, dependency
review, independent security assessment, and a public support lifecycle.

## License

Licensed under [Apache License 2.0](LICENSE).
