# Monad Meme Top 10 Index (TOP10)
## Whitepaper v1.0

---

## 1. Overview

The Monad Meme Top 10 Index (TOP10) is an immutable, on-chain index token designed to represent a fixed snapshot of the Monad meme ecosystem at genesis.

Unlike actively managed or governance-controlled index products, TOP10 is fully ownerless and permanently locked at deployment.

---

## 2. Design Philosophy

TOP10 follows three core principles:

1. **Immutability**  
   Once deployed, neither the index composition nor its logic can be changed.

2. **Trust Minimization**  
   No admin keys, no governance votes, no upgrade paths.

3. **Economic Enforcement**  
   Fair pricing is maintained through minting and redemption at on-chain Net Asset Value (NAV), enforced by arbitrage.

---

## 3. Index Composition

- The index consists of **10 ERC-20 tokens** selected at genesis.
- Each constituent is assigned an **equal weight**.
- Composition and weights are permanently fixed.

This design intentionally avoids oracle dependency or dynamic rebalancing risks.

---

## 4. Minting & Redemption

### Minting
Users may mint TOP10 by supplying the required proportional amounts of each constituent token.

The contract:
- Calculates required inputs based on total supply
- Transfers assets atomically
- Mints TOP10 to the caller

### Redemption
Users may redeem TOP10 by burning index tokens to receive underlying assets proportionally.

This mechanism ensures:
- NAV-anchored pricing
- Continuous arbitrage efficiency
- Permissionless exit

---

## 5. Price Discovery

Market price discovery occurs through decentralized liquidity pools (e.g., TOP10/WMON).

If market price deviates from NAV:
- Minting occurs when price > NAV
- Redemption occurs when price < NAV

This arbitrage loop naturally enforces fair valuation without governance or intervention.

---

## 6. Rebalancing Philosophy

TOP10 does **not** rebalance.

It represents:
- A historical snapshot
- A fixed financial primitive
- A base layer index

Future indexes may be deployed as separate versions rather than modifying TOP10.

---

## 7. Risks

- Smart contract risk
- Liquidity risk
- Volatility of constituent assets
- No active management or safeguards

Users are responsible for understanding these risks before participation.

---

## 8. Conclusion

TOP10 is a minimal, immutable index designed to outlive trends, governance cycles, and operator risk.

Its value lies in permanence, transparency, and permissionless financial engineering.

---

**Contract Address**
0x6c07bd691bdBB30e081c20D2d26901A1f8A5F99F

**Bundled Tokens*

0xc09C8242Eb21B24298303799Bb5Af402A2957777)); // PEPE
      
0x7DB552eEb6b77a6babe6e0A739b5382CD653CC3e)); // GMONAD
        
0xA7b3F394B9AAbA67f2543a8c1A0F753cC68d7777)); // GONAD
       
0x788571E0E5067Adea87e6BA22a2b738fFDf48888)); // UNIT
       
0xB744F5CDb792d8187640214C4A1c9aCE29af7777)); // MOONSHI
       
0x81D61e48BCe95aB2Cd16Ced67B8d4aaf682B8350)); // BURNBANK
       
0x7131ECA3401F58371cfb4c3b27aA07837cF77777)); // LISA
       
0x350035555E10d9AfAF1566AaebfCeD5BA6C27777)); // CHOG
       
0x42a4aA89864A794dE135B23C6a8D2E05513d7777)); // SHRAMP

0x81A224F8A62f52BdE942dBF23A56df77A10b7777)); // EMONAD
