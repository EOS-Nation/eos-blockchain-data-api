# 🚧 Deprecation Notice

dfuse services will be discontinued on **September 25, 2024**, as Pinax transitions to more advanced and efficient solutions for Antelope blockchain data sourcing. We encourage all users to migrate to Pinax's new services, including **Substreams, Firehose**, and comprehensive blockchain data services supporting dozens of chains like EOS, WAX, and Telos. Dfuse users can start building with a **FREE Pinax Pro Plan**.

Learn more and get started at https://pinax.network.

# EOS - Blockchain Data for Analytics
[![Firehose](https://github.com/EOS-Nation/eos-blockchain-data/actions/workflows/firehose.yml/badge.svg)](https://github.com/EOS-Nation/eos-blockchain-data/actions/workflows/firehose.yml)

> Aggregates historical EOS blockchain data & outputs result into JSON format (using [dfuse **Firehose**](https://dfuse.eosnation.io/))

## Chains

- [x] EOS
- [ ] Telos
- [ ] WAX
- [ ] UX

## Data

**Transactions**
- [x] Transactions
- [x] Actions
- [x] CPU usage
- [x] NET usage
- [x] Hourly active accounts

**EOS transfers**
- [ ] Transfer volume

**Accounts**
- [ ] New Addresses
- [ ] RAM purchase
- [ ] Powerup purchase

**Staking**
- [ ] Staked EOS
- [ ] Un-staked EOS
- [ ] REX deposits
- [ ] REX withdraws

### `dfuse` TOKEN

- https://dfuse.eosnation.io

### `.env`

```env
# Required
DFUSE_TOKEN="<DFUSE TOKEN>"

# Optional
DFUSE_FIREHOSE_NETWORK="eos.firehose.eosnation.io"
```
