# The Causal Barbell — Part 1: The Multiplicative Indictment

Interactive calculator for [Capital Misallocation](https://capitalmisallocation.com).  
Live: **https://longshort.capitalmisallocation.com**

How much alpha does a long-short book need to beat the index? You supply the assumptions. The arithmetic does not negotiate.

Seven essay tabs, plus an appendix (Industry float) linked under the tab bar — not one of the seven.

## Locked defaults

- Management fee **1.5%**, not 2.0%. 2.0 is the legacy single-manager case.
- Sharpe screen **1.5**. At the prior (mean 0.10, sd 0.30, skew-normal) that is an **80%** false-positive rate. A screen of 2.0 selects nobody.
- Gross return is net × beta + alpha. Default is 0.5 × 9% + 6% = **10.5%**. No short rebate in that sum.

## Local

```bash
npm install
npm run dev
```

## Deploy

Pushes to `main` deploy on Vercel. Custom domain: `longshort.capitalmisallocation.com`.

GoDaddy DNS (one CNAME on `capitalmisallocation.com`):

| Type  | Name       | Value                 |
|-------|------------|-----------------------|
| CNAME | `longshort` | `cname.vercel-dns.com` |
