# 🕵️‍♂️ Sherlock Holmes: The Sepolia Dossier
**Group 2 · Digital Treasure Hunt & Logic Riddle Game on Ethereum Sepolia**

A decentralized detective puzzle game built on the **Ethereum Sepolia Testnet** using **Solidity (`0.8.20`)**, **Ethers.js v6**, **MetaMask**, and **GitHub Pages**. Players step into 221B Baker Street as consulting detectives and must solve three consecutive forensic riddles to unlock Professor Moriarty’s vault.

---

## 📋 1. Official Instructor Submission Block

> Copy and fill in the bracketed links below once you deploy to Sepolia and push to GitHub Pages:

```text
Grupa: 2 (Digital Treasure Hunt / Digitālās dārgumu medības)
Spēles nosaukums: Sherlock Holmes: The Sepolia Dossier
Dalībnieku lomas:
  1. [Student 1 Name] — Game Design, Narrative & Riddles
  2. [Student 2 Name] — Solidity Smart Contract Developer (Game.sol)
  3. [Student 3 Name] — Web3 / Ethers.js & MetaMask Integration (app.js)
  4. [Student 4 Name] — Frontend UI/UX & GitHub Pages Deployment (index.html, style.css)
  5. [Student 5 Name] — QA Testing (2+ Wallets), Etherscan Verification & Security Analysis
GitHub repozitorijs: https://github.com/ho1yspirt/bis-game
Spēles publiskā lapa: https://ho1yspirt.github.io/bis-game/
Sepolia līgums: 0x[YOUR_DEPLOYED_SEPOLIA_CONTRACT_ADDRESS]
Etherscan darījums: https://sepolia.etherscan.io/tx/0x[YOUR_SAMPLE_TX_HASH]
Kas darbojas:
  - 3 sequential Sherlock Holmes riddles verified on-chain via keccak256(bytes32) hashes
  - Both client-side and on-chain input normalization (trim whitespace + lowercase conversion)
  - Separate per-wallet state tracking (level progress, mistakes counter, investigation timer)
  - 3-mistake limit + resetInvestigation() function + On-chain Leaderboard (+5 Bonus feature)
  - Full state persistence on page reload directly from Ethereum Sepolia
Kas vēl nedarbojas / ierobežojumi:
  - Public blockchain limitation: storage slots and submitted transaction calldata are publicly visible on Etherscan (documented in Security Analysis below).
Kādi 3 testi izpildīti:
  1. Positive Test: Submitting correct answers ("221b", "footprints", "moriarty") unlocks the next level and grants Master Detective status on Level 3 (emits LevelCompleted & QuestFinished).
  2. Negative Test #1: Submitting an incorrect answer ("watson") increments the mistake counter (emits WrongDeduction) and does NOT increase level progress; reaching 3 mistakes locks further submissions via require().
  3. Negative Test #2: Attempting to re-submit an already completed level (e.g. Case #1 while on Case #2) or solve out of order is rejected by Solidity require().
```

---

## 🎯 2. Game Rules & State Machine

```
[Unregistered] ──startInvestigation()──► [Case #1 (Level 0)]
                                                │
                              submitAnswer(0, "221b") [Correct]
                                                ▼
                                         [Case #2 (Level 1)]
                                                │
                              submitAnswer(1, "footprints") [Correct]
                                                ▼
                                         [Case #3 (Level 2)]
                                                │
                              submitAnswer(2, "moriarty") [Correct]
                                                ▼
                                  🏆 [Master Detective (Level 3)]
                                     (Recorded on Leaderboard)
```

* **Goal:** Solve 3 consecutive Sherlock Holmes riddles on the Ethereum Sepolia blockchain with fewer than 3 mistakes.
* **Player Actions (Write Transactions):**
  1. `startInvestigation()` — Opens the player's detective dossier on-chain and starts their completion timer (`block.timestamp`).
  2. `submitAnswer(uint8 level, string answer)` — Normalizes the submitted string, hashes it with `keccak256`, and compares it against `answerHashes[level]`.
  3. `resetInvestigation()` — Clears the caller's mistake counter and resets current case progress to Level `0` so they can retry if locked out or improve their leaderboard time.
* **Forbidden Actions (Enforced by Solidity `require()`):**
  * Submitting an answer for a **completed level** (`level < currentLevel`) $\rightarrow$ Reverts with `"Case already completed! A solved level cannot be counted a second time."`
  * Submitting an answer for a **locked future level** (`level > currentLevel`) $\rightarrow$ Reverts with `"Case locked! You must solve earlier cases in sequential order first."`
  * Submitting an answer after making **3 wrong deductions** (`mistakes >= 3`) $\rightarrow$ Reverts with `"Case closed: 3 mistakes limit reached! Call resetInvestigation() to start a fresh inquiry."`
  * Submitting an **empty answer** (`normalized.length == 0`) $\rightarrow$ Reverts with `"Answer cannot be empty."`
* **Input Normalization Alignment (HTML + Solidity):**
  * To prevent uppercase/lowercase or accidental space issues, **both** `app.js` (`answer.trim().toLowerCase()`) and `Game.sol` (`_normalize(answer)`) strip leading/trailing whitespace and convert ASCII `A–Z` to `a–z` before hashing.

---

## 🧩 3. The Three Cases & On-Chain `bytes32` Hashes

| Level Index | Case Title | Riddle Summary | Normalized Answer | On-Chain `keccak256` Hash (`bytes32`) |
| :---: | :--- | :--- | :---: | :--- |
| **`0` (Case #1)** | **The Baker Street Cipher** | Street number and apartment letter of Sherlock Holmes’s London residence | `"221b"` | `0x0d0ca3abd02760d948ae7217285ad25325d0ae2700c2eca9e5b6710dc6d43363` |
| **`1` (Case #2)** | **The Thames Mud Evidence** | *"The more of us you leave behind, the more Sherlock finds. You make us with every step..."* | `"footprints"` | `0xa91db06ad5c29a93db96e5e6558ea66d191c50b7c58e2bf4ae2b0d7b4d9e23f7` |
| **`2` (Case #3)** | **The Napoleon of Crime** | Decode Caesar cipher `NPSJBSUZ` (shift each letter back by `-1`) | `"moriarty"` | `0xf17280f6bc66c3c21b7c5a38cae0b2879a82687129cb71944e29620f311430d7` |

---

## 🧪 4. Three Mandatory Tests (Verification Guide)

### Test 1 — Positive Scenario (Solving & Advancing Levels)
1. Connect **Wallet A** on Sepolia and click **Start Official Investigation** (or submit Case #1 directly).
2. Enter `"  221B "` (testing case + space normalization) in **Case #1** and click **Submit Deduction #1**.
3. Confirm in MetaMask $\rightarrow$ `LevelCompleted(detective, 1, timestamp)` event is emitted and progress updates to `1 / 3`.
4. Submit `"footprints"` for **Case #2** (`2 / 3`) and `"moriarty"` for **Case #3** (`3 / 3`).
5. Verify `hasFinished(walletA) == true`, the Victory Banner appears, and Wallet A is added to the **Scotland Yard Leaderboard**.
6. Reload the browser page (`F5`) $\rightarrow$ Progress (`3 / 3`) and Leaderboard are read directly from the Sepolia contract.

### Test 2 — Negative Scenario A (Incorrect Answer & 3-Mistake Limit)
1. Switch to **Wallet B** in MetaMask and connect.
2. In **Case #1**, submit an incorrect answer such as `"watson"` (or click **Send Wrong Answer** in the Inspector’s Verification Lab).
3. After transaction confirmation:
   * `progress(walletB)` remains `0 / 3` (does **not** increase).
   * `mistakes` increases from `0` to `1 / 3` and `WrongDeduction` event is emitted.
4. If 3 wrong answers are submitted (`3 / 3` mistakes), any 4th `submitAnswer` call is **rejected (`revert`)** by `require(d.mistakes < MAX_MISTAKES)` until `resetInvestigation()` is called.

### Test 3 — Negative Scenario B (Completed Level Cannot Be Counted Twice)
1. Using a wallet that has already solved **Case #1** (`currentLevel >= 1`), attempt to call `submitAnswer(0, "221b")` again (or click **Trigger `require()` Revert** in the Verification Lab).
2. The smart contract rejects the transaction with:
   > `execution reverted: "Case already completed! A solved level cannot be counted a second time."`

---

## 🔐 5. Security & Scientific Issue: Why Public Blockchains Have No Secret Data

As required by the Group 2 specification, our team analyzed why storing puzzle answers or hashes on a public blockchain is suitable for a **Web3 state-machine lab**, but **not** for a confidential exam system:

1. **No Private Storage on the EVM:** Marking `bytes32[3] private answerHashes` as `private` only prevents *other smart contracts* from reading the variable directly. Every Ethereum node stores the full contract state tree publicly, so anyone can read storage slots `0, 1, 2` using `eth_getStorageAt`.
2. **Offline Dictionary Attacks on Hashes:** Because `keccak256` is a fast cryptographic hash function and riddle answers are human-readable words, an user can run an offline dictionary brute-force script against the `bytes32` hash without spending gas.
3. **Public Transaction Calldata on Etherscan:** When the first player calls `submitAnswer(0, "221b")`, the plaintext string `"221b"` is permanently broadcast in the transaction's input calldata and is visible to everyone on **Sepolia Etherscan**.
4. **How Production Web3 Games Solve This:** Real-world on-chain puzzle games use a **Commit-Reveal scheme** (`keccak256(abi.encodePacked(msg.sender, answer, salt))`) or **Zero-Knowledge Proofs (zk-SNARKs)** so players prove they know the preimage of the hash without ever revealing the plaintext answer in transaction calldata.

---

## 🚀 6. Quick Deployment Guide (Remix $\rightarrow$ Sepolia $\rightarrow$ GitHub Pages)

### Step A: Deploy `Game.sol` to Ethereum Sepolia via Remix
1. Open [Remix IDE](https://remix.ethereum.org/).
2. Create a new file named `Game.sol` and paste the contents of [`Game.sol`](./Game.sol).
3. In the **Solidity Compiler** tab, select compiler version **`0.8.20`** (or any `0.8.20+`) and click **Compile Game.sol**.
4. In the **Deploy & Run Transactions** tab:
   * First test in **Remix VM (Cancun)** to verify functions for free.
   * Switch Environment to **Injected Provider - MetaMask** (ensure MetaMask is on **Sepolia Testnet** with test ETH).
   * Select contract **`SherlockTreasureHunt`** and click **Deploy**.
   * Confirm the deployment transaction in MetaMask and copy your **Deployed Contract Address (`0x...`)**.

### Step B: Connect the Contract Address & Publish to GitHub Pages
1. Open [`app.js`](./app.js) and replace line 8:
   ```js
   const DEFAULT_CONTRACT_ADDRESS = "0xYOUR_DEPLOYED_SEPOLIA_ADDRESS";
   ```
   *(Tip: You can also paste the contract address directly into the top bar of the webpage and click **Load Contract**!)*
2. Push all 6 files (`index.html`, `style.css`, `app.js`, `Game.sol`, `abi.json`, `README.md`) to a **public GitHub repository**.
3. In GitHub, go to **Settings $\rightarrow$ Pages $\rightarrow$ Build and deployment**:
   * Source: **Deploy from a branch**
   * Branch: **`main` / `/(root)`** $\rightarrow$ **Save**.
4. Wait ~60 seconds and open `https://<your-username>.github.io/<your-repo>/`.

---

## 🎤 7. 6–8 Minute Classroom Demonstration Script (5 Students)

* **Minute 0:00–1:15 (Student 1 — Game Design Lead):** Explain the Sherlock Holmes theme, the 3 sequential cases, input normalization rules, and the 3-mistake limit + leaderboard bonus feature.
* **Minute 1:15–3:00 (Student 2 — Solidity Developer):** Show `Game.sol`, highlighting `bytes32[3] private answerHashes`, `_normalize()`, `submitAnswer()`, `require()` guards, and events (`LevelCompleted`, `WrongDeduction`, `QuestFinished`).
* **Minute 3:00–4:45 (Student 3 — Web3 Developer):** Open the public GitHub Pages link, connect MetaMask on Sepolia, show live input normalization (`" 221B "` $\rightarrow$ `"221b"`), and execute a live `submitAnswer` transaction.
* **Minute 4:45–6:00 (Student 4 — Frontend & UX Lead):** Refresh the page (`F5`) to prove state is re-read from Sepolia, show the updated Evidence Trail, Investigation Timer, and Scotland Yard Leaderboard.
* **Minute 6:00–7:30 (Student 5 — QA & Security Analyst):** Click **Trigger `require()` Revert** to show a rejected operation on an already-solved level, open the transaction & events tab on **Sepolia Etherscan**, and explain why public blockchains have no secret data.

---

## 🤖 Tools Used
* **Remix IDE & Solidity `0.8.20`** — Smart contract compilation and Sepolia deployment.
* **Ethers.js v6 & MetaMask** — Browser wallet provider and transaction signing.
* **AI Coding Assistant (Antigravity)** — Used for scaffolding the UI layout, Solidity string normalization helper, and documentation structure; all contract rules and test cases verified by the group.
