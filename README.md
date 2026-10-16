# ACME checkout — Git mirror of `acme-modular.checkout`

Address entry, delivery choice, payment and order placement — the checkout flow.

This repository and the bit.cloud scope [`acme-modular.checkout`](https://bit.cloud/acme-modular/checkout) stay equal in both directions through [`bit ci sync`](https://github.com/teambit/bit-git-sync). **One repository mirrors one scope.** Components from other ACME scopes arrive as package dependencies.

## The ACME organization: eight scopes, eight repositories

| Scope | Repository | Owns |
| --- | --- | --- |
| `acme-modular.design` | [acme-modular-design](https://github.com/teambit/acme-modular-design) | theme and UI primitives |
| `acme-modular.platform` | [acme-modular-platform](https://github.com/teambit/acme-modular-platform) | entities, HTTP client, data hooks |
| `acme-modular.store` | [acme-modular-store](https://github.com/teambit/acme-modular-store) | catalog, cart, storefront app |
| `acme-modular.checkout` | [acme-modular-checkout](https://github.com/teambit/acme-modular-checkout) | address, delivery, checkout flow |
| `acme-modular.payments` | [acme-modular-payments](https://github.com/teambit/acme-modular-payments) | payment methods, card validation |
| `acme-modular.billing` | [acme-modular-billing](https://github.com/teambit/acme-modular-billing) | invoices, billing history |
| `acme-modular.shipping` | [acme-modular-shipping](https://github.com/teambit/acme-modular-shipping) | delivery options, tracking |
| `acme-modular.accounts` | [acme-modular-accounts](https://github.com/teambit/acme-modular-accounts) | session, sign-in, profile |

## How to change something

| Path | You do | You get |
| --- | --- | --- |
| Git-first | Branch, commit, push, open a pull request. | `bit-adopt-pr` turns the PR into a lane. Every push snaps onto it. |
| Bit-first | `bit lane create`, edit, `bit snap`, `bit export` from any workspace. | A branch and a pull request appear here. |
| Release | Merge the pull request. | `bit-release` releases the new versions to the scope. |

AI agents: read [`AGENTS.md`](./AGENTS.md). Claude Code also loads the `bit-git-sync` skill from `.claude/skills/`.

Setting this up for your own scope: follow [teambit/acme-modular-store](https://github.com/teambit/acme-modular-store#set-it-up-for-your-own-scope).
