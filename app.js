/**
 * Sherlock Holmes: The Sepolia Dossier — Group 2 Web3 Frontend (ethers.js v6)
 * Connects HTML interface to the SherlockTreasureHunt contract on Ethereum Sepolia.
 */

// ============================================================================
// 1. CONFIGURATION — PASTE YOUR DEPLOYED SEPOLIA CONTRACT ADDRESS BELOW
// ============================================================================
const DEFAULT_CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000000";
const SEPOLIA_CHAIN_ID = 11155111n;
const SEPOLIA_CHAIN_HEX = "0xaa36a7";
const STORAGE_KEY_CONTRACT = "sherlock_sepolia_contract_address_v1";

// Target Keccak-256 hashes stored on-chain in Game.sol
const LEVEL_HASHES = [
  "0x0d0ca3abd02760d948ae7217285ad25325d0ae2700c2eca9e5b6710dc6d43363", // Case #1: "221b"
  "0xa91db06ad5c29a93db96e5e6558ea66d191c50b7c58e2bf4ae2b0d7b4d9e23f7", // Case #2: "footprints"
  "0xf17280f6bc66c3c21b7c5a38cae0b2879a82687129cb71944e29620f311430d7"  // Case #3: "moriarty"
];

const DEMO_ANSWERS = ["221b", "footprints", "moriarty"];

// Embedded ABI matching abi.json and Game.sol (works both on GitHub Pages and local file://)
const CONTRACT_ABI = [
  "function TOTAL_LEVELS() view returns (uint8)",
  "function MAX_MISTAKES() view returns (uint8)",
  "function startInvestigation()",
  "function submitAnswer(uint8 level, string answer) returns (bool isCorrect)",
  "function resetInvestigation()",
  "function progress(address player) view returns (uint256)",
  "function hasFinished(address player) view returns (bool)",
  "function getDetective(address player) view returns (bool isInvestigating, uint8 currentLevel, uint8 mistakes, uint8 maxMistakes, bool finished, uint256 startedAt, uint256 finishedAt, uint256 completionTime, uint256 totalSolvedRuns)",
  "function getLevelHash(uint8 level) view returns (bytes32)",
  "function getLeaderboard() view returns (tuple(address detective, uint8 mistakes, uint256 completionTime, uint256 finishedAt)[])",
  "event InvestigationStarted(address indexed detective, uint256 timestamp)",
  "event LevelCompleted(address indexed detective, uint8 indexed newLevel, uint256 timestamp)",
  "event WrongDeduction(address indexed detective, uint8 indexed attemptedLevel, uint8 mistakesUsed, uint8 mistakesRemaining)",
  "event QuestFinished(address indexed detective, uint8 mistakesUsed, uint256 completionTimeSeconds, uint256 timestamp)",
  "event InvestigationReset(address indexed detective, uint256 timestamp)"
];

// ============================================================================
// 2. APPLICATION STATE
// ============================================================================
let provider = null;
let signer = null;
let userAddress = null;
let contractAddress = DEFAULT_CONTRACT_ADDRESS;
let contract = null;
let isSandboxMode = false;
let timerInterval = null;

// Current detective state cached from blockchain (or sandbox)
let detectiveState = {
  isInvestigating: false,
  currentLevel: 0,
  mistakes: 0,
  maxMistakes: 3,
  finished: false,
  startedAt: 0,
  finishedAt: 0,
  completionTime: 0,
  totalSolvedRuns: 0
};

// Local sandbox state for testing UI before Sepolia deployment
const sandboxDetectives = {};
const sandboxLeaderboard = [];

// ============================================================================
// 3. INITIALIZATION & INPUT NORMALIZATION
// ============================================================================
function normalizeAnswer(rawInput) {
  return String(rawInput || "").trim().toLowerCase();
}

function computeKeccakHash(normalizedStr) {
  if (!normalizedStr || typeof ethers === "undefined") return null;
  try {
    return ethers.keccak256(ethers.toUtf8Bytes(normalizedStr));
  } catch (_) {
    return null;
  }
}

function shortAddress(addr) {
  if (!addr || addr.length < 10) return addr || "Unknown";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function formatDuration(seconds) {
  const sec = Math.max(0, Number(seconds) || 0);
  const mins = Math.floor(sec / 60);
  const rem = sec % 60;
  return `${String(mins).padStart(2, "0")}:${String(rem).padStart(2, "0")}`;
}

function initContractAddress() {
  const params = new URLSearchParams(window.location.search);
  const urlContract = params.get("contract");
  const savedContract = localStorage.getItem(STORAGE_KEY_CONTRACT);

  if (urlContract && ethers.isAddress(urlContract)) {
    contractAddress = urlContract;
  } else if (savedContract && ethers.isAddress(savedContract)) {
    contractAddress = savedContract;
  } else {
    contractAddress = DEFAULT_CONTRACT_ADDRESS;
  }

  const input = document.getElementById("contractAddressInput");
  if (contractAddress && contractAddress !== "0x0000000000000000000000000000000000000000") {
    input.value = contractAddress;
  }
  updateEtherscanContractLink();
}

function updateEtherscanContractLink() {
  const link = document.getElementById("etherscanContractLink");
  if (hasValidDeployedContract()) {
    link.href = `https://sepolia.etherscan.io/address/${contractAddress}`;
    link.textContent = `Contract ${shortAddress(contractAddress)} ↗`;
  } else {
    link.href = "https://sepolia.etherscan.io/";
    link.textContent = "Sepolia Etherscan ↗";
  }
}

function hasValidDeployedContract() {
  return (
    typeof ethers !== "undefined" &&
    ethers.isAddress(contractAddress) &&
    contractAddress.toLowerCase() !== "0x0000000000000000000000000000000000000000"
  );
}

// ============================================================================
// 4. METAMASK & SEPOLIA CONNECTION
// ============================================================================
async function connectWallet() {
  if (!window.ethereum) {
    showBanner(
      "error",
      "MetaMask Required",
      "MetaMask browser extension was not detected. Install MetaMask or enable Sandbox Mode to preview the UI."
    );
    return;
  }

  try {
    showBanner("pending", "Connecting Wallet...", "Please approve the connection request in MetaMask.", null, true);

    provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);

    const network = await provider.getNetwork();
    updateNetworkBadge(network.chainId);

    if (network.chainId !== SEPOLIA_CHAIN_ID) {
      showBanner(
        "warning",
        "Wrong Network Selected",
        `MetaMask is connected to Chain ID ${network.chainId.toString()}. Please switch MetaMask to Ethereum Sepolia (11155111).`
      );
      return;
    }

    signer = await provider.getSigner();
    userAddress = await signer.getAddress();

    document.getElementById("connectWalletBtn").textContent = `🦊 ${shortAddress(userAddress)}`;
    document.getElementById("statWallet").textContent = shortAddress(userAddress);

    if (hasValidDeployedContract() && !isSandboxMode) {
      contract = new ethers.Contract(contractAddress, CONTRACT_ABI, signer);
      await refreshAllState();
      showBanner(
        "success",
        "Connected to Ethereum Sepolia",
        `Wallet ${shortAddress(userAddress)} connected. Progress loaded from smart contract ${shortAddress(contractAddress)}.`
      );
    } else if (isSandboxMode) {
      await refreshAllState();
      showBanner(
        "warning",
        "Wallet Connected (Sandbox Simulation Mode)",
        "You are currently in local Sandbox Mode. Deploy Game.sol to Sepolia and paste the contract address above for on-chain transactions."
      );
    } else {
      showBanner(
        "warning",
        "Wallet Connected — Contract Address Needed",
        "MetaMask is on Sepolia! Paste your deployed Game.sol Sepolia contract address in the bar above (or click 'Sandbox Mode' to test locally)."
      );
    }
  } catch (err) {
    showBanner("error", "Wallet Connection Failed", parseReadableError(err));
  }
}

function updateNetworkBadge(chainId) {
  const badge = document.getElementById("networkBadge");
  const switchBtn = document.getElementById("switchNetworkBtn");

  if (isSandboxMode) {
    badge.className = "badge network-warn";
    badge.textContent = "🧪 Sandbox Mode (Local)";
    switchBtn.style.display = "none";
    return;
  }

  if (chainId === SEPOLIA_CHAIN_ID) {
    badge.className = "badge network-ok";
    badge.textContent = "● Sepolia (11155111)";
    switchBtn.style.display = "none";
  } else {
    badge.className = "badge network-warn";
    badge.textContent = `● Wrong Network (${chainId ? chainId.toString() : "Unknown"})`;
    switchBtn.style.display = "inline-flex";
  }
}

async function switchToSepolia() {
  if (!window.ethereum) return;
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: SEPOLIA_CHAIN_HEX }]
    });
    await connectWallet();
  } catch (switchError) {
    // Error code 4902 means Sepolia is not added to MetaMask yet
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: SEPOLIA_CHAIN_HEX,
              chainName: "Ethereum Sepolia Testnet",
              nativeCurrency: { name: "Sepolia ETH", symbol: "ETH", decimals: 18 },
              rpcUrls: ["https://rpc.sepolia.org"],
              blockExplorerUrls: ["https://sepolia.etherscan.io"]
            }
          ]
        });
        await connectWallet();
      } catch (addErr) {
        showBanner("error", "Could Not Add Sepolia", parseReadableError(addErr));
      }
    } else {
      showBanner("error", "Network Switch Rejected", parseReadableError(switchError));
    }
  }
}

// ============================================================================
// 5. READING STATE FROM BLOCKCHAIN (OR SANDBOX)
// ============================================================================
async function refreshAllState() {
  await Promise.all([loadDetectiveState(), loadLeaderboard()]);
  renderDashboardAndCases();
}

async function loadDetectiveState() {
  const activeAddr = userAddress || "0xDEMO0000000000000000000000000000000221B";

  if (isSandboxMode) {
    if (!sandboxDetectives[activeAddr]) {
      sandboxDetectives[activeAddr] = {
        isInvestigating: false,
        currentLevel: 0,
        mistakes: 0,
        maxMistakes: 3,
        finished: false,
        startedAt: 0,
        finishedAt: 0,
        completionTime: 0,
        totalSolvedRuns: 0
      };
    }
    detectiveState = { ...sandboxDetectives[activeAddr] };
    return;
  }

  if (!contract || !userAddress) return;

  try {
    const data = await contract.getDetective(userAddress);
    detectiveState = {
      isInvestigating: Boolean(data[0]),
      currentLevel: Number(data[1]),
      mistakes: Number(data[2]),
      maxMistakes: Number(data[3]),
      finished: Boolean(data[4]),
      startedAt: Number(data[5]),
      finishedAt: Number(data[6]),
      completionTime: Number(data[7]),
      totalSolvedRuns: Number(data[8])
    };
  } catch (err) {
    showBanner("error", "Failed to Read Contract State", parseReadableError(err));
  }
}

async function loadLeaderboard() {
  const tbody = document.getElementById("leaderboardBody");

  try {
    let entries = [];
    if (isSandboxMode) {
      entries = [...sandboxLeaderboard];
    } else if (contract) {
      const rawEntries = await contract.getLeaderboard();
      entries = rawEntries.map((item) => ({
        detective: item.detective || item[0],
        mistakes: Number(item.mistakes ?? item[1]),
        completionTime: Number(item.completionTime ?? item[2]),
        finishedAt: Number(item.finishedAt ?? item[3])
      }));
    } else {
      return;
    }

    // Sort by fewest mistakes first, then fastest completion time
    entries.sort((a, b) => {
      if (a.mistakes !== b.mistakes) return a.mistakes - b.mistakes;
      return a.completionTime - b.completionTime;
    });

    if (entries.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; color: var(--text-muted);">
            No detectives have completed all 3 cases yet. Be the first!
          </td>
        </tr>`;
      return;
    }

    tbody.innerHTML = entries
      .map((entry, idx) => {
        const medal = idx === 0 ? "🥇 1" : idx === 1 ? "🥈 2" : idx === 2 ? "🥉 3" : `${idx + 1}`;
        const dateStr = entry.finishedAt
          ? new Date(entry.finishedAt * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          : "—";
        const explorerUrl = `https://sepolia.etherscan.io/address/${entry.detective}`;
        return `
          <tr>
            <td><strong>${medal}</strong></td>
            <td class="mono"><a href="${explorerUrl}" target="_blank" rel="noopener noreferrer">${shortAddress(entry.detective)}</a></td>
            <td>${entry.mistakes} / 3</td>
            <td class="mono">${formatDuration(entry.completionTime)}</td>
            <td>${dateStr}</td>
          </tr>`;
      })
      .join("");
  } catch (err) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; color: #fca5a5;">
          Could not load leaderboard: ${parseReadableError(err)}
        </td>
      </tr>`;
  }
}

// ============================================================================
// 6. STATE-CHANGING TRANSACTIONS (START, SUBMIT ANSWER, RESET)
// ============================================================================
async function handleStartInvestigation() {
  if (!ensureReadyForWrite()) return;

  if (isSandboxMode) {
    const activeAddr = userAddress || "0xDEMO0000000000000000000000000000000221B";
    const d = sandboxDetectives[activeAddr];
    if (d.isInvestigating) {
      const msg = "Investigation already started. Solve the active case or reset.";
      showBanner("error", "Rejected by Contract Rule (require)", msg);
      appendTxLog("startInvestigation()", "Rejected (require)", null);
      return;
    }
    d.isInvestigating = true;
    d.currentLevel = 0;
    d.mistakes = 0;
    d.finished = false;
    d.startedAt = Math.floor(Date.now() / 1000);
    d.finishedAt = 0;
    d.completionTime = 0;
    await refreshAllState();
    showBanner("success", "Investigation Started (Sandbox)", "Case #1 is now open and the timer has started.");
    appendTxLog("startInvestigation()", "InvestigationStarted Event", null);
    return;
  }

  try {
    showBanner("pending", "Waiting for MetaMask Signature...", "Confirm startInvestigation() in MetaMask.", null, true);
    const tx = await contract.startInvestigation();
    showBanner(
      "pending",
      "Transaction Submitted to Sepolia...",
      `Waiting for block confirmation (${shortAddress(tx.hash)})...`,
      `https://sepolia.etherscan.io/tx/${tx.hash}`,
      true
    );

    await tx.wait();
    await refreshAllState();

    showBanner(
      "success",
      "Investigation Officially Opened!",
      "InvestigationStarted event recorded on Ethereum Sepolia.",
      `https://sepolia.etherscan.io/tx/${tx.hash}`
    );
    appendTxLog("startInvestigation()", "✅ InvestigationStarted", tx.hash);
  } catch (err) {
    const reason = parseReadableError(err);
    showBanner("error", "Transaction Rejected", reason);
    appendTxLog("startInvestigation()", `❌ Rejected: ${reason}`, err?.transactionHash || null);
  }
}

async function handleSubmitAnswer(levelIndex, customAnswer = null) {
  if (!ensureReadyForWrite()) return;

  const inputEl = document.getElementById(`answerInput${levelIndex}`);
  const rawAnswer = customAnswer !== null ? customAnswer : inputEl ? inputEl.value : "";
  const normalized = normalizeAnswer(rawAnswer);

  if (!normalized) {
    showBanner("warning", "Empty Deduction", "Please enter an answer before submitting to the blockchain.");
    return;
  }

  // SANDBOX EXECUTION
  if (isSandboxMode) {
    executeSandboxSubmit(levelIndex, normalized);
    return;
  }

  // LIVE SEPOLIA BLOCKCHAIN EXECUTION
  try {
    const prevLevel = detectiveState.currentLevel;
    const prevMistakes = detectiveState.mistakes;

    showBanner(
      "pending",
      "Waiting for MetaMask Signature...",
      `Submitting normalized answer "${normalized}" for Case #${levelIndex + 1}...`,
      null,
      true
    );

    const tx = await contract.submitAnswer(levelIndex, normalized);
    const txUrl = `https://sepolia.etherscan.io/tx/${tx.hash}`;

    showBanner(
      "pending",
      "Waiting for Sepolia Confirmation...",
      `Transaction ${shortAddress(tx.hash)} broadcast. Waiting for block inclusion...`,
      txUrl,
      true
    );

    await tx.wait();
    await refreshAllState();

    if (detectiveState.currentLevel > prevLevel) {
      if (detectiveState.finished) {
        showBanner(
          "success",
          "🏆 All 3 Cases Solved! QuestFinished Event Emitted!",
          `Congratulations! You solved the full Sepolia Dossier in ${formatDuration(detectiveState.completionTime)} with ${detectiveState.mistakes} mistake(s).`,
          txUrl
        );
        appendTxLog(`submitAnswer(${levelIndex}, "${normalized}")`, "🏆 QuestFinished (Level 3/3)", tx.hash);
      } else {
        showBanner(
          "success",
          `✅ Case #${levelIndex + 1} Solved!`,
          `Correct deduction! LevelCompleted event recorded on Sepolia. Case #${detectiveState.currentLevel + 1} is now unlocked.`,
          txUrl
        );
        appendTxLog(`submitAnswer(${levelIndex}, "${normalized}")`, `✅ LevelCompleted (${detectiveState.currentLevel}/3)`, tx.hash);
      }
    } else if (detectiveState.mistakes > prevMistakes) {
      const rem = Math.max(0, detectiveState.maxMistakes - detectiveState.mistakes);
      showBanner(
        "warning",
        `⚠️ Wrong Deduction! Progress Unchanged (${detectiveState.mistakes}/3 Mistakes)`,
        `The contract verified your hash and recorded a mistake (WrongDeduction event). ${rem} attempt(s) remaining before case lock.`,
        txUrl
      );
      appendTxLog(
        `submitAnswer(${levelIndex}, "${normalized}")`,
        `⚠️ WrongDeduction (Mistake ${detectiveState.mistakes}/3)`,
        tx.hash
      );
    }
  } catch (err) {
    const reason = parseReadableError(err);
    showBanner("error", "Transaction Rejected by Smart Contract", reason);
    appendTxLog(`submitAnswer(${levelIndex}, "${normalized}")`, `❌ Reverted: ${reason}`, err?.transactionHash || null);
  }
}

async function handleResetInvestigation() {
  if (!ensureReadyForWrite()) return;

  if (isSandboxMode) {
    const activeAddr = userAddress || "0xDEMO0000000000000000000000000000000221B";
    const d = sandboxDetectives[activeAddr];
    d.isInvestigating = true;
    d.currentLevel = 0;
    d.mistakes = 0;
    d.finished = false;
    d.startedAt = Math.floor(Date.now() / 1000);
    d.finishedAt = 0;
    d.completionTime = 0;
    await refreshAllState();
    showBanner("success", "Investigation Reset (Sandbox)", "Mistakes cleared and progress reset to Case #1.");
    appendTxLog("resetInvestigation()", "InvestigationReset Event", null);
    return;
  }

  try {
    showBanner("pending", "Waiting for MetaMask Signature...", "Confirm resetInvestigation() in MetaMask.", null, true);
    const tx = await contract.resetInvestigation();
    const txUrl = `https://sepolia.etherscan.io/tx/${tx.hash}`;

    showBanner("pending", "Resetting Investigation on Sepolia...", "Waiting for transaction confirmation...", txUrl, true);
    await tx.wait();
    await refreshAllState();

    showBanner("success", "Investigation Reset!", "Your mistake counter and active case progress have been reset to Case #1.", txUrl);
    appendTxLog("resetInvestigation()", "↺ InvestigationReset", tx.hash);
  } catch (err) {
    const reason = parseReadableError(err);
    showBanner("error", "Reset Rejected", reason);
    appendTxLog("resetInvestigation()", `❌ Rejected: ${reason}`, null);
  }
}

// ============================================================================
// 7. SANDBOX SIMULATION ENGINE (MIRRORS Game.sol EXACTLY)
// ============================================================================
function executeSandboxSubmit(levelIndex, normalized) {
  const activeAddr = userAddress || "0xDEMO0000000000000000000000000000000221B";
  const d = sandboxDetectives[activeAddr];

  if (levelIndex < 0 || levelIndex >= 3) {
    const msg = "Invalid case number: must be 0, 1, or 2.";
    showBanner("error", "Rejected by Contract Rule (require)", msg);
    appendTxLog(`submitAnswer(${levelIndex}, "${normalized}")`, `❌ Reverted: ${msg}`, null);
    return;
  }
  if (d.finished) {
    const msg = "All 3 cases are already solved! Call resetInvestigation() to play again.";
    showBanner("error", "Rejected by Contract Rule (require)", msg);
    appendTxLog(`submitAnswer(${levelIndex}, "${normalized}")`, `❌ Reverted: ${msg}`, null);
    return;
  }
  if (d.mistakes >= 3) {
    const msg = "Case closed: 3 mistakes limit reached! Call resetInvestigation() to start a fresh inquiry.";
    showBanner("error", "Rejected by Contract Rule (require)", msg);
    appendTxLog(`submitAnswer(${levelIndex}, "${normalized}")`, `❌ Reverted: ${msg}`, null);
    return;
  }
  if (levelIndex < d.currentLevel) {
    const msg = "Case already completed! A solved level cannot be counted a second time.";
    showBanner("error", "Rejected by Contract Rule (require)", msg);
    appendTxLog(`submitAnswer(${levelIndex}, "${normalized}")`, `❌ Reverted: ${msg}`, null);
    return;
  }
  if (levelIndex > d.currentLevel) {
    const msg = "Case locked! You must solve earlier cases in sequential order first.";
    showBanner("error", "Rejected by Contract Rule (require)", msg);
    appendTxLog(`submitAnswer(${levelIndex}, "${normalized}")`, `❌ Reverted: ${msg}`, null);
    return;
  }

  if (!d.isInvestigating) {
    d.isInvestigating = true;
    d.startedAt = Math.floor(Date.now() / 1000);
  }

  const submittedHash = computeKeccakHash(normalized);
  if (submittedHash === LEVEL_HASHES[levelIndex]) {
    d.currentLevel += 1;
    if (d.currentLevel === 3) {
      d.finished = true;
      d.finishedAt = Math.floor(Date.now() / 1000);
      d.completionTime = Math.max(1, d.finishedAt - d.startedAt);
      d.totalSolvedRuns += 1;

      const existingIdx = sandboxLeaderboard.findIndex((e) => e.detective === activeAddr);
      const entry = {
        detective: activeAddr,
        mistakes: d.mistakes,
        completionTime: d.completionTime,
        finishedAt: d.finishedAt
      };
      if (existingIdx === -1) sandboxLeaderboard.push(entry);
      else sandboxLeaderboard[existingIdx] = entry;

      refreshAllState();
      showBanner(
        "success",
        "🏆 All 3 Cases Solved! (Sandbox)",
        `Master Consulting Detective status achieved in ${formatDuration(d.completionTime)}!`
      );
      appendTxLog(`submitAnswer(${levelIndex}, "${normalized}")`, "🏆 QuestFinished (3/3)", null);
    } else {
      refreshAllState();
      showBanner("success", `✅ Case #${levelIndex + 1} Solved! (Sandbox)`, `Case #${d.currentLevel + 1} is now unlocked.`);
      appendTxLog(`submitAnswer(${levelIndex}, "${normalized}")`, `✅ LevelCompleted (${d.currentLevel}/3)`, null);
    }
  } else {
    d.mistakes += 1;
    const rem = 3 - d.mistakes;
    refreshAllState();
    showBanner(
      "warning",
      `⚠️ Wrong Deduction! (${d.mistakes}/3 Mistakes)`,
      `Incorrect answer "${normalized}". Progress remains at ${d.currentLevel}/3. ${rem} attempt(s) left.`
    );
    appendTxLog(`submitAnswer(${levelIndex}, "${normalized}")`, `⚠️ WrongDeduction (Mistake ${d.mistakes}/3)`, null);
  }
}

// ============================================================================
// 8. UI RENDERING & LIVE TIMER
// ============================================================================
function renderDashboardAndCases() {
  const { isInvestigating, currentLevel, mistakes, maxMistakes, finished, startedAt, completionTime, totalSolvedRuns } =
    detectiveState;

  // Rank label
  const rankNames = [
    "Constable (Case #1 Active)",
    "Junior Inspector (Case #2 Active)",
    "Senior Inspector (Case #3 Active)",
    "🏆 Master Consulting Detective"
  ];
  document.getElementById("statRank").textContent = isInvestigating || finished
    ? `Rank: ${rankNames[Math.min(currentLevel, 3)]}`
    : "Rank: Unregistered Detective";

  // Progress
  document.getElementById("statProgress").textContent = `${currentLevel} / 3`;
  document.getElementById("statProgressSub").textContent = finished
    ? "All Cases Completed!"
    : `Current Task: Case #${currentLevel + 1}`;

  // Mistakes
  document.getElementById("statMistakes").textContent = `${mistakes} / ${maxMistakes}`;
  const remaining = Math.max(0, maxMistakes - mistakes);
  const icons = "🔍 ".repeat(remaining) + "❌ ".repeat(mistakes);
  document.getElementById("statLives").textContent =
    remaining > 0 ? `${icons.trim()} (${remaining} left)` : "❌ Case Suspended (Reset Required)";

  // Runs
  document.getElementById("statRuns").textContent = `Completed Dossiers: ${totalSolvedRuns}`;

  // Evidence Trail Steps
  for (let i = 0; i < 3; i++) {
    const stepEl = document.getElementById(`step${i}`);
    stepEl.className = "trail-step";
    if (currentLevel > i) stepEl.classList.add("done");
    else if (currentLevel === i && !finished) stepEl.classList.add("active");
  }
  const step3El = document.getElementById("step3");
  step3El.className = finished ? "trail-step done" : "trail-step";

  // Victory Banner
  const victoryCard = document.getElementById("victoryCard");
  if (finished) {
    victoryCard.classList.add("show");
    document.getElementById("victorySummary").textContent = `Wallet: ${
      userAddress || "Sandbox Detective"
    } | Mistakes Used: ${mistakes}/3 | Completion Time: ${formatDuration(completionTime)}`;
  } else {
    victoryCard.classList.remove("show");
  }

  // Render the 3 Case Cards
  for (let i = 0; i < 3; i++) {
    const card = document.getElementById(`caseCard${i}`);
    const statusPill = document.getElementById(`caseStatus${i}`);
    const input = document.getElementById(`answerInput${i}`);
    const btn = document.getElementById(`submitBtn${i}`);

    card.className = "case-card";
    if (i < currentLevel) {
      card.classList.add("solved-case");
      statusPill.className = "status-pill solved";
      statusPill.textContent = "✓ Solved";
      input.disabled = false; // Left enabled so students can test re-submitting solved level!
      btn.textContent = `✓ Case #${i + 1} Solved (Click to Test Re-Submit)`;
      btn.className = "btn btn-outline";
    } else if (i === currentLevel && !finished) {
      card.classList.add("active-case");
      statusPill.className = "status-pill open";
      statusPill.textContent = mistakes >= maxMistakes ? "Suspended (3 Mistakes)" : "Active Case";
      input.disabled = false;
      input.placeholder = `Enter deduction for Case #${i + 1}...`;
      btn.textContent = `🔏 Submit Deduction #${i + 1} (On-Chain)`;
      btn.className = "btn btn-gold";
    } else {
      card.classList.add("locked-case");
      statusPill.className = "status-pill locked";
      statusPill.textContent = "Locked";
      input.disabled = false;
      input.placeholder = `Locked — Solve Case #${i} first`;
      btn.textContent = `🔒 Locked (Submit to Test require() Revert)`;
      btn.className = "btn btn-outline";
    }
  }

  // Live Timer
  if (timerInterval) clearInterval(timerInterval);
  const timerEl = document.getElementById("statTimer");
  if (finished) {
    timerEl.textContent = formatDuration(completionTime);
  } else if (isInvestigating && startedAt > 0) {
    const updateClock = () => {
      const nowSec = Math.floor(Date.now() / 1000);
      timerEl.textContent = formatDuration(Math.max(0, nowSec - startedAt));
    };
    updateClock();
    timerInterval = setInterval(updateClock, 1000);
  } else {
    timerEl.textContent = "00:00";
  }
}

// ============================================================================
// 9. HELPERS, LOGGING & ERROR PARSING
// ============================================================================
function ensureReadyForWrite() {
  if (isSandboxMode) return true;
  if (!userAddress || !signer) {
    showBanner("warning", "Connect MetaMask First", "Click 'Connect MetaMask' in the top right corner (or enable Sandbox Mode).");
    return false;
  }
  if (!hasValidDeployedContract()) {
    showBanner(
      "warning",
      "Contract Address Not Set",
      "Paste your deployed Sepolia contract address in the bar above and click 'Load Contract', or toggle 'Sandbox Mode' to test locally."
    );
    return false;
  }
  return true;
}

function parseReadableError(err) {
  if (!err) return "Unknown error occurred.";
  if (err.reason) return err.reason;
  if (err.shortMessage) return err.shortMessage;
  if (err?.info?.error?.message) return err.info.error.message;
  if (err.message) {
    const match = err.message.match(/execution reverted:\s*"?([^"\n]+)"?/i);
    if (match && match[1]) return match[1];
    return err.message;
  }
  return String(err);
}

function showBanner(type, title, message, etherscanUrl = null, showSpinner = false) {
  const banner = document.getElementById("txBanner");
  const spinner = document.getElementById("txSpinner");
  const titleEl = document.getElementById("txBannerTitle");
  const msgEl = document.getElementById("txBannerMessage");
  const linkEl = document.getElementById("txBannerLink");

  banner.className = `tx-banner show ${type}`;
  spinner.style.display = showSpinner ? "block" : "none";
  titleEl.textContent = title;
  msgEl.textContent = message;

  if (etherscanUrl) {
    linkEl.href = etherscanUrl;
    linkEl.style.display = "inline-flex";
  } else {
    linkEl.style.display = "none";
  }
}

function appendTxLog(actionText, resultText, txHash = null) {
  const tbody = document.getElementById("txLogBody");
  if (tbody.querySelector("td[colspan='3']")) {
    tbody.innerHTML = "";
  }
  const tr = document.createElement("tr");
  const proofHtml = txHash
    ? `<a href="https://sepolia.etherscan.io/tx/${txHash}" target="_blank" rel="noopener noreferrer">${shortAddress(txHash)} ↗</a>`
    : `<span style="color: var(--text-muted);">${isSandboxMode ? "Sandbox Sim" : "Call / Revert"}</span>`;

  tr.innerHTML = `
    <td class="mono">${actionText}</td>
    <td>${resultText}</td>
    <td class="mono">${proofHtml}</td>
  `;
  tbody.prepend(tr);
}

// ============================================================================
// 10. EVENT LISTENERS & DOM SETUP
// ============================================================================
window.addEventListener("DOMContentLoaded", () => {
  initContractAddress();
  renderDashboardAndCases();

  // Wallet & Network buttons
  document.getElementById("connectWalletBtn").addEventListener("click", connectWallet);
  document.getElementById("switchNetworkBtn").addEventListener("click", switchToSepolia);

  // Close banner
  document.getElementById("txBannerClose").addEventListener("click", () => {
    document.getElementById("txBanner").classList.remove("show");
  });

  // Save/load contract address
  document.getElementById("saveContractBtn").addEventListener("click", async () => {
    const val = document.getElementById("contractAddressInput").value.trim();
    if (!ethers.isAddress(val)) {
      showBanner("error", "Invalid Ethereum Address", "Please enter a valid 0x... Sepolia smart contract address.");
      return;
    }
    contractAddress = val;
    localStorage.setItem(STORAGE_KEY_CONTRACT, contractAddress);
    updateEtherscanContractLink();

    if (signer && !isSandboxMode) {
      contract = new ethers.Contract(contractAddress, CONTRACT_ABI, signer);
      await refreshAllState();
      showBanner("success", "Contract Loaded", `Connected to Sepolia contract ${shortAddress(contractAddress)}.`);
    } else {
      showBanner("success", "Contract Address Saved", `Address ${shortAddress(contractAddress)} saved. Connect MetaMask to interact.`);
    }
  });

  // Reload state from blockchain
  document.getElementById("reloadStateBtn").addEventListener("click", async () => {
    await refreshAllState();
    showBanner("success", "State Reloaded", "Latest progress and leaderboard fetched from storage.");
  });

  // Toggle Sandbox Mode
  document.getElementById("toggleSandboxBtn").addEventListener("click", async (e) => {
    isSandboxMode = !isSandboxMode;
    e.currentTarget.textContent = isSandboxMode ? "🧪 Sandbox Mode: ON" : "🧪 Sandbox Mode: OFF";
    updateNetworkBadge(null);
    await refreshAllState();
    showBanner(
      isSandboxMode ? "warning" : "success",
      isSandboxMode ? "Sandbox Simulation Mode Enabled" : "Live Ethereum Sepolia Mode Enabled",
      isSandboxMode
        ? "All actions now simulate Game.sol locally in your browser without requiring Sepolia gas."
        : "Switched back to live Ethereum Sepolia smart contract mode."
    );
  });

  // Start / Reset / Refresh Leaderboard buttons
  document.getElementById("startInvestigationBtn").addEventListener("click", handleStartInvestigation);
  document.getElementById("resetInvestigationBtn").addEventListener("click", handleResetInvestigation);
  document.getElementById("refreshLeaderboardBtn").addEventListener("click", loadLeaderboard);

  // Clue buttons
  document.querySelectorAll("[data-clue-btn]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = btn.getAttribute("data-clue-btn");
      const clueEl = document.getElementById(`clueText${idx}`);
      clueEl.classList.toggle("visible");
    });
  });

  // Live Normalization & Keccak-256 preview on inputs
  document.querySelectorAll("[data-level-input]").forEach((input) => {
    const idx = Number(input.getAttribute("data-level-input"));
    input.addEventListener("input", () => {
      const norm = normalizeAnswer(input.value);
      const hash = computeKeccakHash(norm);
      const previewEl = document.getElementById(`normPreview${idx}`);
      const matches = hash && hash.toLowerCase() === LEVEL_HASHES[idx].toLowerCase();
      previewEl.innerHTML = norm
        ? `Normalized: <code>"${norm}"</code> | Hash: <code>${hash ? hash.slice(0, 12) + "..." + hash.slice(-4) : "—"}</code> ${
            matches ? "✅" : ""
          }`
        : `Normalized: <span>(type answer)</span> | Target Hash: <code>${LEVEL_HASHES[idx].slice(0, 10)}...${LEVEL_HASHES[
            idx
          ].slice(-4)}</code>`;
    });

    input.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") {
        handleSubmitAnswer(idx);
      }
    });
  });

  // Submit buttons for each level
  document.querySelectorAll("[data-submit-level]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.getAttribute("data-submit-level"));
      handleSubmitAnswer(idx);
    });
  });

  // Inspector's Verification Lab (3 Mandatory Tests)
  document.getElementById("runPositiveTestBtn").addEventListener("click", () => {
    const lvl = Math.min(detectiveState.currentLevel, 2);
    const input = document.getElementById(`answerInput${lvl}`);
    input.value = DEMO_ANSWERS[lvl].toUpperCase() + "  "; // Demonstrates uppercase + spaces normalization!
    input.dispatchEvent(new Event("input"));
    input.focus();
    showBanner(
      "success",
      `Positive Test Prepared for Case #${lvl + 1}`,
      `Filled "${input.value}" (with uppercase & trailing spaces to prove normalization). Click 'Submit Deduction #${lvl + 1}' to unlock the next level!`
    );
  });

  document.getElementById("runWrongAnswerTestBtn").addEventListener("click", () => {
    const lvl = Math.min(detectiveState.currentLevel, 2);
    const input = document.getElementById(`answerInput${lvl}`);
    input.value = "watson";
    input.dispatchEvent(new Event("input"));
    handleSubmitAnswer(lvl, "watson");
  });

  document.getElementById("runRepeatLevelTestBtn").addEventListener("click", () => {
    // If player has solved at least Case #1 (currentLevel >= 1), try re-submitting Case #1 (level 0).
    // If player is still on Case #1 (currentLevel == 0), try skipping ahead to Case #3 (level 2).
    const testLevel = detectiveState.currentLevel >= 1 ? 0 : 2;
    handleSubmitAnswer(testLevel, DEMO_ANSWERS[testLevel]);
  });

  // Listen for MetaMask account or chain changes
  if (window.ethereum) {
    window.ethereum.on("accountsChanged", () => connectWallet());
    window.ethereum.on("chainChanged", () => window.location.reload());
  }
});
