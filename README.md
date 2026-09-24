# The Causal Barbell — Part 1: The Multiplicative Indictment

Interactive calculator for [Capital Misallocation](https://capitalmisallocation.com).  
Live: **https://longshort.capitalmisallocation.com**

How much alpha does a long-short book need to beat the index? You supply the assumptions. The arithmetic does not negotiate.

Five tabs: fee decomposition, sensitivity grid, terminal-wealth Monte Carlo, liquidation cascade, Shiller rolling windows.

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
