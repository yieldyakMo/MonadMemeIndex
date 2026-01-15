import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@6.13.4/+esm";

// ========= CONFIG =========
// Confirm this is your deployed TOP10 contract:
const TOP10_ADDRESS = "0x6c07bd691bdBB30e081c20D2d26901A1f8A5F99F";

// The fixed basket order you gave me:
const BASKET = [
  { symbol: "PEPE",    address: "0xc09C8242Eb21B24298303799Bb5Af402A2957777" },
  { symbol: "GMONAD",  address: "0x7DB552eEb6b77a6babe6e0A739b5382CD653CC3e" },
  { symbol: "GONAD",   address: "0xA7b3F394B9AAbA67f2543a8c1A0F753cC68d7777" },
  { symbol: "UNIT",    address: "0x788571E0E5067Adea87e6BA22a2b738fFDf48888" },
  { symbol: "MOONSHI", address: "0xB744F5CDb792d8187640214C4A1c9aCE29af7777" },
  { symbol: "BBNK",    address: "0x81D61e48BCe95aB2Cd16Ced67B8d4aaf682B8350" },
  { symbol: "LISA",    address: "0x7131ECA3401F58371cfb4c3b27aA07837cF77777" },
  { symbol: "CHOG",    address: "0x350035555E10d9AfAF1566AaebfCeD5BA6C27777" },
  { symbol: "SHRAMP",  address: "0x42a4aA89864A794dE135B23C6a8D2E05513d7777" },
  { symbol: "EMONAD",  address: "0x81A224F8A62f52BdE942dBF23A56df77A10b7777" },
];

// Minimal ERC20 ABI for balances/allowances/approvals
const ERC20_ABI = [
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 value) returns (bool)",
];

// Your TOP10 ABI (trimmed to only what we need)
const TOP10_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function quoteMint(uint256 shares) view returns (uint256[10])",
  "function mint(uint256 shares, uint256[10] maxAmountsIn)",
  "function quoteRedeem(uint256 shares) view returns (uint256[10])",
  "function redeem(uint256 shares, uint256[10] minAmountsOut)",
  "function totalSupply() view returns (uint256)",
];

// ========= UI helpers =========
const $ = (id) => document.getElementById(id);
const log = (msg) => { $("debug").textContent = msg; };

let provider, signer, wallet, top10;

function fmtUnits(x, decimals) {
  try { return ethers.formatUnits(x, decimals); } catch { return String(x); }
}

function parseShares(input) {
  if (!input || !input.trim()) throw new Error("Enter shares first.");
  // shares are in TOP10 token units => use TOP10 decimals
  return input.trim();
}

async function connect() {
  if (!window.ethereum) throw new Error("MetaMask not found.");
  provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  signer = await provider.getSigner();
  wallet = await signer.getAddress();

  top10 = new ethers.Contract(TOP10_ADDRESS, TOP10_ABI, signer);

  $("wallet").textContent = wallet;
  $("contractAddr").textContent = TOP10_ADDRESS;

  $("btnRefresh").disabled = false;
  $("btnQuoteMint").disabled = false;
  $("btnQuoteRedeem").disabled = false;

  log("Connected.");
}

async function refresh() {
  const [n, s, d] = await Promise.all([top10.name(), top10.symbol(), top10.decimals()]);
  log(`Connected to ${n} (${s}), decimals=${d}`);
}

async function buildTokenMeta() {
  // pull decimals for each token once
  const metas = [];
  for (const t of BASKET) {
    const erc = new ethers.Contract(t.address, ERC20_ABI, provider);
    const dec = await erc.decimals();
    metas.push({ ...t, decimals: Number(dec), erc });
  }
  return metas;
}

function renderQuote(containerId, title, rows) {
  const html = `
    <div class="muted" style="margin: 8px 0 10px 0;">${title}</div>
    <table>
      <thead>
        <tr><th>Token</th><th>Required</th><th>Your allowance</th><th>Status</th></tr>
      </thead>
      <tbody>
        ${rows.map(r => `
          <tr>
            <td>${r.symbol}</td>
            <td>${r.requiredHuman}</td>
            <td>${r.allowanceHuman}</td>
            <td class="${r.ok ? "ok" : "bad"}">${r.ok ? "OK" : "Needs approval"}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
  $(containerId).innerHTML = html;
}

async function quoteMint() {
  $("mintStatus").textContent = "";
  $("btnApproveNeeded").disabled = true;
  $("btnMint").disabled = true;

  const meta = await buildTokenMeta();
  const top10Dec = await top10.decimals();

  const sharesStr = parseShares($("mintShares").value);
  const shares = ethers.parseUnits(sharesStr, top10Dec);

    const amountsInRO = await top10.quoteMint(shares);
    const amountsIn = amountsInRO.map(x => x); // clone (now mutable)

  const rows = [];
  let anyNeeds = false;

  for (let i = 0; i < 10; i++) {
    const m = meta[i];
    const required = amountsIn[i];

    const allowance = await m.erc.allowance(wallet, TOP10_ADDRESS);
    const ok = allowance >= required;

    rows.push({
      symbol: m.symbol,
      requiredRaw: required,
      requiredHuman: fmtUnits(required, m.decimals),
      allowanceRaw: allowance,
      allowanceHuman: fmtUnits(allowance, m.decimals),
      ok,
      token: m,
    });

    if (!ok) anyNeeds = true;
  }

  window.__mintQuote = { shares, meta, rows, amountsIn };

  renderQuote("mintQuote", "Required basket amounts for this mint:", rows);

  $("btnApproveNeeded").disabled = !anyNeeds;
  $("btnMint").disabled = anyNeeds; // only enable mint when approvals are already ok
  $("mintStatus").textContent = anyNeeds
    ? "Approvals needed before mint."
    : "All approvals look good — you can mint.";
}

async function approveNeeded() {
  const q = window.__mintQuote;
  if (!q) throw new Error("Quote first.");

  $("mintStatus").textContent = "Approving tokens (one-by-one)…";

  for (const r of q.rows) {
    if (r.ok) continue;

    // Approve exactly required amount (safe + simple).
    // You can change to MaxUint256 later if you want.
    const tx = await r.token.erc.connect(signer).approve(TOP10_ADDRESS, r.requiredRaw);
    $("mintStatus").textContent = `Approving ${r.symbol}…`;
    await tx.wait();
  }

  $("mintStatus").textContent = "Approvals done. Re-quote to confirm.";
  $("btnMint").disabled = true;
}

async function mint() {
  const q = window.__mintQuote;
  if (!q) throw new Error("Quote first.");

  $("mintStatus").textContent = "Sending mint transaction…";
  const tx = await top10.mint(q.shares, q.amountsIn);
  $("mintStatus").textContent = `Mint submitted: ${tx.hash}`;
  await tx.wait();
  $("mintStatus").textContent = "Mint confirmed ✅";
}

async function quoteRedeem() {
  $("redeemStatus").textContent = "";
  $("btnRedeem").disabled = true;

  const meta = await buildTokenMeta();
  const top10Dec = await top10.decimals();

  const sharesStr = parseShares($("redeemShares").value);
  const shares = ethers.parseUnits(sharesStr, top10Dec);

  const amountsOut = await top10.quoteRedeem(shares);

  const rows = [];
  for (let i = 0; i < 10; i++) {
    const m = meta[i];
    const out = amountsOut[i];
    rows.push({
      symbol: m.symbol,
      requiredHuman: fmtUnits(out, m.decimals),
      allowanceHuman: "—",
      ok: true,
    });
  }

  window.__redeemQuote = { shares, amountsOut };

  renderQuote("redeemQuote", "You will receive approximately:", rows);
  $("btnRedeem").disabled = false;
}

async function redeem() {
  const q = window.__redeemQuote;
  if (!q) throw new Error("Quote first.");

  // For now: minAmountsOut = quoted amountsOut (no slippage buffer).
  // If you want safety, use e.g. 0.5% buffer.
  const minAmountsOut = q.amountsOut;

  $("redeemStatus").textContent = "Sending redeem transaction…";
  const tx = await top10.redeem(q.shares, minAmountsOut);
  $("redeemStatus").textContent = `Redeem submitted: ${tx.hash}`;
  await tx.wait();
  $("redeemStatus").textContent = "Redeem confirmed ✅";
}

$("contractAddr").textContent = TOP10_ADDRESS;

$("btnConnect").onclick = async () => { try { await connect(); } catch (e) { log(String(e)); } };
$("btnRefresh").onclick = async () => { try { await refresh(); } catch (e) { log(String(e)); } };
$("btnQuoteMint").onclick = async () => { try { await quoteMint(); } catch (e) { log(String(e)); } };
$("btnApproveNeeded").onclick = async () => { try { await approveNeeded(); } catch (e) { log(String(e)); } };
$("btnMint").onclick = async () => { try { await mint(); } catch (e) { log(String(e)); } };
$("btnQuoteRedeem").onclick = async () => { try { await quoteRedeem(); } catch (e) { log(String(e)); } };
$("btnRedeem").onclick = async () => { try { await redeem(); } catch (e) { log(String(e)); } };

