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
