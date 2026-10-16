/**
 * Sherlock Holmes: The Sepolia Dossier — Group 2 Web3 Frontend (ethers.js v6)
 * Skeuomorphic Victorian Desk + Guided 3-Step Onboarding & 3 Mandatory Grading Tests
 */

// ============================================================================
// 1. CONFIGURATION — PASTE YOUR DEPLOYED SEPOLIA CONTRACT ADDRESS BELOW
// ============================================================================
const DEFAULT_CONTRACT_ADDRESS = "0x961694129afe8508fdaf8ce324ef23d281902f5c";
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

const CASES = [
  {
    level: 0,
    numeral: "I",
    tabTitle: "CASE I · BAKER ST.",
    title: "Case I: The Baker Street Cipher",
    story:
      "“A rain-stained dispatch from Irene Adler arrived at midnight. Confirm our Baker Street headquarters code to unseal the first lock.”",
    riddle:
      "Enter the famous Baker Street door number followed immediately by its apartment letter (4 characters, no spaces).",
    clue: "Answer Hint: Two hundred twenty-one, second letter of the alphabet → 221b",
    hash: LEVEL_HASHES[0],
    svg: `
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="44" stroke="#d4af37" stroke-width="2" stroke-dasharray="3 2"/>
        <rect x="28" y="16" width="44" height="68" rx="22" stroke="#f5dc8b" stroke-width="2.5"/>
        <circle cx="50" cy="42" r="10" stroke="#f5dc8b" stroke-width="2.5"/>
        <path d="M45 49 L42 72 L58 72 L55 49" stroke="#f5dc8b" stroke-width="2.5" fill="rgba(212,175,55,0.2)"/>
        <text x="50" y="29" text-anchor="middle" fill="#d4af37" font-family="Georgia" font-size="9" font-weight="bold">221</text>
      </svg>`
  },
  {
    level: 1,
    numeral: "II",
    tabTitle: "CASE II · THAMES DOCK",
    title: "Case II: The Thames Mud Specimen",
    story:
      "“At East India Docks, the vault door was forced open. No weapon remained, yet the wet riverbank clay betrayed the culprit’s escape.”",
    riddle:
      "The more of us you leave behind, the more Sherlock finds. You make us with every step, yet never hold us. What are we? (plural noun)",
    clue: "Answer Hint: Boot impressions in the mud (10 letters, plural) → footprints",
    hash: LEVEL_HASHES[1],
    svg: `
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="44" stroke="#d4af37" stroke-width="2" stroke-dasharray="3 2"/>
        <ellipse cx="42" cy="36" rx="11" ry="16" transform="rotate(-12 42 36)" stroke="#f5dc8b" stroke-width="2.5" fill="rgba(212,175,55,0.18)"/>
        <rect x="34" y="55" width="14" height="11" rx="4" transform="rotate(-12 41 60)" stroke="#f5dc8b" stroke-width="2.2"/>
        <circle cx="64" cy="64" r="16" stroke="#d4af37" stroke-width="2.5"/>
        <line x1="75" y1="75" x2="86" y2="86" stroke="#f5dc8b" stroke-width="3.5" stroke-linecap="round"/>
      </svg>`
  },
  {
    level: 2,
    numeral: "III",
    tabTitle: "CASE III · THE CRYPTEX",
    title: "Case III: The Reichenbach Cryptex",
    story:
      "“Inside the subterranean treasury lies a brass cylinder engraved with the Caesar cipher NPSJBSUZ (+1 alphabet shift) signed by our arch-nemesis.”",
    riddle:
      "Shift each letter of NPSJBSUZ back by 1 position in the alphabet to name the ‘Napoleon of Crime’.",
    clue: "Answer Hint: N→M, P→O, S→R, J→I, B→A, S→R, U→T, Z→Y → moriarty",
    hash: LEVEL_HASHES[2],
    svg: `
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="44" stroke="#d4af37" stroke-width="2" stroke-dasharray="3 2"/>
        <rect x="20" y="32" width="60" height="36" rx="6" stroke="#f5dc8b" stroke-width="2.5" fill="rgba(212,175,55,0.15)"/>
        <line x1="35" y1="32" x2="35" y2="68" stroke="#d4af37" stroke-width="2"/>
        <line x1="50" y1="32" x2="50" y2="68" stroke="#d4af37" stroke-width="2"/>
        <line x1="65" y1="32" x2="65" y2="68" stroke="#d4af37" stroke-width="2"/>
        <circle cx="15" cy="50" r="5" stroke="#f5dc8b" stroke-width="2"/>
        <circle cx="85" cy="50" r="5" stroke="#f5dc8b" stroke-width="2"/>
        <text x="50" y="54" text-anchor="middle" fill="#f5dc8b" font-family="monospace" font-size="11" font-weight="bold">M·O·R·I</text>
      </svg>`
  }
];

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
// 2. STATE
// ============================================================================
let provider = null;
let signer = null;
let userAddress = null;
let contractAddress = DEFAULT_CONTRACT_ADDRESS;
let contract = null;
let isSandboxMode = false;
let timerInterval = null;
let selectedCaseIndex = 0;
let drafts = ["", "", ""];
let testsPassed = { 1: false, 2: false, 3: false };

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

const sandboxDetectives = {};
const sandboxLeaderboard = [];

// ============================================================================
// 3. EPHEMERAL AMBIENT VISUAL ENGINE (100% Non-Blocking, pointer-events: none)
// ============================================================================
const ephemeralSparks = [];

function initEphemeralCanvas() {
  const canvas = document.getElementById("ephemeralCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  resize();
  window.addEventListener("resize", resize);

  const motes = Array.from({ length: 26 }, () => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    r: Math.random() * 1.6 + 0.5,
    vx: (Math.random() - 0.5) * 0.22,
    vy: -Math.random() * 0.26 - 0.06,
    phase: Math.random() * Math.PI * 2
  }));

  function renderFrame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const m of motes) {
      m.x += m.vx;
      m.y += m.vy;
      m.phase += 0.025;
      if (m.y < -10) m.y = canvas.height + 10;
      if (m.x < -10) m.x = canvas.width + 10;
      if (m.x > canvas.width + 10) m.x = -10;

      const alpha = 0.16 + Math.sin(m.phase) * 0.12;
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(250, 227, 156, ${Math.max(0.03, alpha)})`;
      ctx.fill();
    }

    for (let i = ephemeralSparks.length - 1; i >= 0; i--) {
      const p = ephemeralSparks[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.06;
      p.life -= 0.028;

      if (p.life <= 0) {
        ephemeralSparks.splice(i, 1);
        continue;
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fillStyle = p.color.replace("ALPHA", p.life.toFixed(2));
      ctx.fill();
    }

    requestAnimationFrame(renderFrame);
  }

  requestAnimationFrame(renderFrame);

  window.addEventListener(
    "pointerdown",
    (ev) => {
      spawnEphemeralSparks(ev.clientX, ev.clientY, 7, "gold");
    },
    { passive: true }
  );
}

function spawnEphemeralSparks(x, y, count = 12, palette = "gold") {
  const colorTemplate =
    palette === "crimson"
      ? "rgba(239, 68, 68, ALPHA)"
      : palette === "emerald"
      ? "rgba(52, 211, 153, ALPHA)"
      : "rgba(250, 227, 156, ALPHA)";

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 2.6 + 0.6;
    ephemeralSparks.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 0.8,
      size: Math.random() * 2.8 + 1.2,
      life: 1,
      color: colorTemplate
    });
  }
}

function triggerPageBreeze() {
  const spread = document.getElementById("dossierSpread");
  if (!spread) return;
  spread.classList.remove("page-breeze");
  void spread.offsetWidth;
  spread.classList.add("page-breeze");
}

function triggerEphemeralWaxStamp(isGood, text) {
  const stamp = document.getElementById("ephemeralStampFx");
  if (!stamp) return;
  stamp.className = "ephemeral-stamp-fx";
  stamp.innerHTML = `<span>${text}</span>`;
  void stamp.offsetWidth;
  stamp.classList.add(isGood ? "stamp-good" : "stamp-bad");

  const rect = stamp.getBoundingClientRect();
  if (rect.width > 0) {
    spawnEphemeralSparks(
      rect.left + rect.width / 2,
      rect.top + rect.height / 2,
      18,
      isGood ? "emerald" : "crimson"
    );
  }
}

function triggerTypewriterPulse() {
  const box = document.getElementById("apparatusBox");
  const tape = document.getElementById("liveCipherTape");
  if (box) {
    box.classList.remove("key-struck");
    void box.offsetWidth;
    box.classList.add("key-struck");
  }
  if (tape) {
    tape.classList.remove("tape-glint");
    void tape.offsetWidth;
    tape.classList.add("tape-glint");
  }
}

function markTestPassed(testNumber) {
  testsPassed[testNumber] = true;
  const card = document.getElementById(`testCard${testNumber}`);
  const badge = document.getElementById(`testBadge${testNumber}`);
  if (card) card.classList.add("test-passed");
  if (badge) badge.textContent = "✅ PASSED!";
}

// ============================================================================
// 4. UTILITIES & NORMALIZATION
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

function hasValidDeployedContract() {
  return (
    typeof ethers !== "undefined" &&
    ethers.isAddress(contractAddress) &&
    contractAddress.toLowerCase() !== "0x0000000000000000000000000000000000000000"
  );
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
  updateEtherscanLinks();
}

function updateEtherscanLinks() {
  const link = document.getElementById("etherscanContractLink");
  const victoryBtn = document.getElementById("victoryEtherscanBtn");
  const url = hasValidDeployedContract()
    ? `https://sepolia.etherscan.io/address/${contractAddress}`
    : "https://sepolia.etherscan.io/";

  link.href = url;
  link.textContent = hasValidDeployedContract() ? `Contract ${shortAddress(contractAddress)} ↗` : "Etherscan ↗";
  if (victoryBtn) victoryBtn.href = url;
}

// ============================================================================
// 5. METAMASK & SEPOLIA CONNECTION
// ============================================================================
async function connectWallet() {
  if (!window.ethereum) {
    showBanner(
      "error",
      "MetaMask Not Found",
      "Install MetaMask or click '🧪 Instant Sandbox' in Step 1 to test without a wallet."
    );
    return;
  }

  try {
    showBanner("pending", "Awaiting Signature", "Approve wallet connection in MetaMask...", null, true);

    provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);

    const network = await provider.getNetwork();
    updateNetworkLamp(network.chainId);

    if (network.chainId !== SEPOLIA_CHAIN_ID) {
      showBanner(
        "warning",
        "Wrong Network",
        `Connected to Chain ID ${network.chainId.toString()}. Click '⚡ Switch to Sepolia' in the top bar.`
      );
      return;
    }

    signer = await provider.getSigner();
    userAddress = await signer.getAddress();

    document.getElementById("connectWalletBtn").textContent = `🦊 ${shortAddress(userAddress)}`;
    document.getElementById("onboardConnectBtn").textContent = `✓ ${shortAddress(userAddress)}`;
    document.getElementById("statWallet").textContent = shortAddress(userAddress);

    if (hasValidDeployedContract() && !isSandboxMode) {
      contract = new ethers.Contract(contractAddress, CONTRACT_ABI, signer);
      await refreshAllState(true);
      showBanner(
        "success",
        "Ready to Play on Sepolia!",
        `Wallet ${shortAddress(userAddress)} connected to contract ${shortAddress(contractAddress)}.`
      );
    } else if (isSandboxMode) {
      await refreshAllState(true);
      showBanner("warning", "Sandbox Active", "Testing locally. Toggle Sandbox OFF to use Sepolia.");
    } else {
      renderDeskUI();
      showBanner(
        "warning",
        "Step 1 Done! Now Complete Step 2",
        "Click '🚀 1-Click Deploy Game.sol to Sepolia' in Step 2 (or paste your deployed 0x... address)."
      );
    }
  } catch (err) {
    showBanner("error", "Connection Rejected", parseReadableError(err));
  }
}

async function enableSandboxMode() {
  isSandboxMode = true;
  document.getElementById("toggleSandboxBtn").textContent = "🧪 Sandbox: ON";
  document.getElementById("onboardSandboxBtn").textContent = "✓ Sandbox Active";
  updateNetworkLamp(null);
  await refreshAllState(true);
  showBanner(
    "success",
    "Instant Sandbox Mode Ready!",
    "You can now solve Cases I → II → III or click '▶ Run Test #1, #2, #3' below immediately!"
  );
}

function updateNetworkLamp(chainId) {
  const badge = document.getElementById("networkBadge");
  const text = document.getElementById("networkText");
  const switchBtn = document.getElementById("switchNetworkBtn");

  if (isSandboxMode) {
    badge.className = "network-lamp network-ok";
    text.textContent = "Sandbox Ready";
    switchBtn.style.display = "none";
    return;
  }

  if (chainId === SEPOLIA_CHAIN_ID) {
    badge.className = "network-lamp network-ok";
    text.textContent = "Sepolia (11155111)";
    switchBtn.style.display = "none";
  } else {
    badge.className = "network-lamp";
    text.textContent = chainId ? `Chain ${chainId.toString()}` : "Disconnected";
    switchBtn.style.display = chainId ? "inline-flex" : "none";
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
        showBanner("error", "Sepolia Add Failed", parseReadableError(addErr));
      }
    } else {
      showBanner("error", "Switch Cancelled", parseReadableError(switchError));
    }
  }
}

// ============================================================================
// 6. BLOCKCHAIN / SANDBOX STATE READS
// ============================================================================
async function refreshAllState(autoFocusActiveCase = false) {
  await Promise.all([loadDetectiveState(), loadLeaderboard()]);
  if (autoFocusActiveCase) {
    selectedCaseIndex = Math.min(detectiveState.currentLevel, 2);
    triggerPageBreeze();
  }
  renderDeskUI();
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
    showBanner("error", "Contract Read Error", parseReadableError(err));
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

    entries.sort((a, b) => (a.mistakes !== b.mistakes ? a.mistakes - b.mistakes : a.completionTime - b.completionTime));

    if (entries.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; color: #9c8a6b;">
            No detectives recorded on the Honour Roll yet. Solve all 3 cases!
          </td>
        </tr>`;
      return;
    }

    tbody.innerHTML = entries
      .map((entry, idx) => {
        const badge = idx === 0 ? "🥇 I" : idx === 1 ? "🥈 II" : idx === 2 ? "🥉 III" : `${idx + 1}`;
        const dateStr = entry.finishedAt
          ? new Date(entry.finishedAt * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          : "—";
        const explorerUrl = `https://sepolia.etherscan.io/address/${entry.detective}`;
        return `
          <tr>
            <td><strong>${badge}</strong></td>
            <td><a href="${explorerUrl}" target="_blank" rel="noopener noreferrer">${shortAddress(entry.detective)}</a></td>
            <td>${entry.mistakes} / 3</td>
            <td>${formatDuration(entry.completionTime)}</td>
            <td>${dateStr}</td>
          </tr>`;
      })
      .join("");
  } catch (err) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; color: #fca5a5;">
          Leaderboard read failed: ${parseReadableError(err)}
        </td>
      </tr>`;
  }
}

// ============================================================================
// 7. STATE-CHANGING TRANSACTIONS
// ============================================================================
async function handleStartInvestigation() {
  if (!ensureReadyForWrite()) return;

  if (isSandboxMode) {
    const activeAddr = userAddress || "0xDEMO0000000000000000000000000000000221B";
    const d = sandboxDetectives[activeAddr];
    if (d.isInvestigating) {
      const msg = "Investigation already started. Solve the active case or reset.";
      triggerEphemeralWaxStamp(false, "REVERTED");
      showBanner("error", "Rejected by Contract (require)", msg);
      appendTxLog("startInvestigation()", `❌ Reverted: ${msg}`, null);
      return;
    }
    d.isInvestigating = true;
    d.currentLevel = 0;
    d.mistakes = 0;
    d.finished = false;
    d.startedAt = Math.floor(Date.now() / 1000);
    d.finishedAt = 0;
    d.completionTime = 0;
    await refreshAllState(true);
    triggerEphemeralWaxStamp(true, "OPENED · 221B");
    showBanner("success", "Dossier Unsealed (Sandbox)", "Case I is open and your pocket-watch chronometer is running.");
    appendTxLog("startInvestigation()", "✅ InvestigationStarted", null);
    return;
  }

  try {
    showBanner("pending", "Sign in MetaMask", "Confirm startInvestigation() in your wallet...", null, true);
    const tx = await contract.startInvestigation();
    const txUrl = `https://sepolia.etherscan.io/tx/${tx.hash}`;

    showBanner("pending", "Confirming on Sepolia", `Waiting for block (${shortAddress(tx.hash)})...`, txUrl, true);
    await tx.wait();
    await refreshAllState(true);

    triggerEphemeralWaxStamp(true, "OPENED · 221B");
    showBanner("success", "Dossier Opened On-Chain", "InvestigationStarted event recorded on Sepolia.", txUrl);
    appendTxLog("startInvestigation()", "✅ InvestigationStarted", tx.hash);
  } catch (err) {
    const reason = parseReadableError(err);
    triggerEphemeralWaxStamp(false, "REJECTED");
    showBanner("error", "Transaction Rejected", reason);
    appendTxLog("startInvestigation()", `❌ Rejected: ${reason}`, err?.transactionHash || null);
  }
}

async function handleSubmitAnswer(levelIndex, customAnswer = null) {
  if (!ensureReadyForWrite()) return;

  const inputEl = document.getElementById("deductionInput");
  const rawAnswer = customAnswer !== null ? customAnswer : inputEl.value;
  const normalized = normalizeAnswer(rawAnswer);

  if (!normalized) {
    showBanner("warning", "Empty Deduction", "Type an answer or click '✨ Auto-Fill Correct Answer' first.");
    return;
  }

  if (isSandboxMode) {
    executeSandboxSubmit(levelIndex, normalized);
    return;
  }

  try {
    const prevLevel = detectiveState.currentLevel;
    const prevMistakes = detectiveState.mistakes;

    showBanner(
      "pending",
      "Sign Deduction in MetaMask",
      `Submitting "${normalized}" for Case ${CASES[levelIndex].numeral}...`,
      null,
      true
    );

    const tx = await contract.submitAnswer(levelIndex, normalized);
    const txUrl = `https://sepolia.etherscan.io/tx/${tx.hash}`;

    showBanner("pending", "Sepolia Verifying Hash", `Waiting for block inclusion (${shortAddress(tx.hash)})...`, txUrl, true);
    await tx.wait();

    drafts[levelIndex] = "";
    inputEl.value = "";
    await refreshAllState(true);

    if (detectiveState.currentLevel > prevLevel) {
      markTestPassed(1);
      triggerEphemeralWaxStamp(true, detectiveState.finished ? "MASTER · SEAL" : "VERIFIED");
      if (detectiveState.finished) {
        showBanner(
          "success",
          "🏆 Vault Unlocked! QuestFinished!",
          `All 3 cases solved in ${formatDuration(detectiveState.completionTime)} with ${detectiveState.mistakes} mistake(s).`,
          txUrl
        );
        appendTxLog(`submitAnswer(${levelIndex}, "${normalized}")`, "🏆 QuestFinished (3/3)", tx.hash);
      } else {
        showBanner(
          "success",
          `✅ Test #1 Passed! Case ${CASES[levelIndex].numeral} Solved!`,
          `LevelCompleted emitted! Progress increased to ${detectiveState.currentLevel}/3.`,
          txUrl
        );
        appendTxLog(`submitAnswer(${levelIndex}, "${normalized}")`, `✅ LevelCompleted (${detectiveState.currentLevel}/3)`, tx.hash);
      }
    } else if (detectiveState.mistakes > prevMistakes) {
      markTestPassed(2);
      triggerEphemeralWaxStamp(false, "SEAL CRACKED");
      const rem = Math.max(0, detectiveState.maxMistakes - detectiveState.mistakes);
      showBanner(
        "warning",
        `⚠️ Test #2 Passed! Wrong Answer Did Not Advance Progress (${detectiveState.mistakes}/3 Mistakes)`,
        `Progress stayed at ${detectiveState.currentLevel}/3 and 1 Wax Seal cracked (${rem} left).`,
        txUrl
      );
      appendTxLog(`submitAnswer(${levelIndex}, "${normalized}")`, `⚠️ WrongDeduction (${detectiveState.mistakes}/3)`, tx.hash);
    }
  } catch (err) {
    const reason = parseReadableError(err);
    if (
      reason.toLowerCase().includes("already completed") ||
      reason.toLowerCase().includes("locked") ||
      reason.toLowerCase().includes("already solved") ||
      reason.toLowerCase().includes("limit reached")
    ) {
      markTestPassed(3);
    }
    triggerEphemeralWaxStamp(false, "REVERTED");
    showBanner("error", `❌ Rejected by Smart Contract require(): ${reason}`, "Mandatory Negative Test verified!");
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
    drafts = ["", "", ""];
    await refreshAllState(true);
    triggerEphemeralWaxStamp(true, "RESET · 221B");
    showBanner("success", "Dossier Reset (Sandbox)", "All 3 red wax seals restored. Returned to Case I.");
    appendTxLog("resetInvestigation()", "↺ InvestigationReset", null);
    return;
  }

  try {
    showBanner("pending", "Sign Reset in MetaMask", "Confirm resetInvestigation()...", null, true);
    const tx = await contract.resetInvestigation();
    const txUrl = `https://sepolia.etherscan.io/tx/${tx.hash}`;

    showBanner("pending", "Resetting on Sepolia", "Waiting for block confirmation...", txUrl, true);
    await tx.wait();
    drafts = ["", "", ""];
    await refreshAllState(true);

    triggerEphemeralWaxStamp(true, "RESET · 221B");
    showBanner("success", "Dossier Reset On-Chain", "All 3 wax seals restored and progress set to Case I.", txUrl);
    appendTxLog("resetInvestigation()", "↺ InvestigationReset", tx.hash);
  } catch (err) {
    const reason = parseReadableError(err);
    triggerEphemeralWaxStamp(false, "REJECTED");
    showBanner("error", "Reset Rejected", reason);
    appendTxLog("resetInvestigation()", `❌ Rejected: ${reason}`, null);
  }
}

// ============================================================================
// 8. SANDBOX ENGINE (MIRRORS Game.sol EXACTLY)
// ============================================================================
function executeSandboxSubmit(levelIndex, normalized) {
  const activeAddr = userAddress || "0xDEMO0000000000000000000000000000000221B";
  const d = sandboxDetectives[activeAddr];

  if (d.finished) {
    const msg = "All 3 cases are already solved! Call resetInvestigation() to play again.";
    markTestPassed(3);
    triggerEphemeralWaxStamp(false, "REVERTED");
    showBanner("error", "✅ Test #3 Passed! Rejected by Contract require()", msg);
    appendTxLog(`submitAnswer(${levelIndex}, "${normalized}")`, `❌ Reverted: ${msg}`, null);
    return;
  }
  if (d.mistakes >= 3) {
    const msg = "Case closed: 3 mistakes limit reached! Call resetInvestigation() to start a fresh inquiry.";
    markTestPassed(3);
    triggerEphemeralWaxStamp(false, "REVERTED");
    showBanner("error", "✅ Test #3 Passed! Rejected by Contract require()", msg);
    appendTxLog(`submitAnswer(${levelIndex}, "${normalized}")`, `❌ Reverted: ${msg}`, null);
    return;
  }
  if (levelIndex < d.currentLevel) {
    const msg = "Case already completed! A solved level cannot be counted a second time.";
    markTestPassed(3);
    triggerEphemeralWaxStamp(false, "REVERTED");
    showBanner("error", "✅ Test #3 Passed! Rejected by Contract require()", msg);
    appendTxLog(`submitAnswer(${levelIndex}, "${normalized}")`, `❌ Reverted: ${msg}`, null);
    return;
  }
  if (levelIndex > d.currentLevel) {
    const msg = "Case locked! You must solve earlier cases in sequential order first.";
    markTestPassed(3);
    triggerEphemeralWaxStamp(false, "LOCKED");
    showBanner("error", "✅ Test #3 Passed! Rejected by Contract require()", msg);
    appendTxLog(`submitAnswer(${levelIndex}, "${normalized}")`, `❌ Reverted: ${msg}`, null);
    return;
  }

  if (!d.isInvestigating) {
    d.isInvestigating = true;
    d.startedAt = Math.floor(Date.now() / 1000);
  }

  const submittedHash = computeKeccakHash(normalized);
  if (submittedHash === LEVEL_HASHES[levelIndex]) {
    markTestPassed(1);
    drafts[levelIndex] = "";
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

      refreshAllState(true);
      triggerEphemeralWaxStamp(true, "MASTER · SEAL");
      showBanner("success", "🏆 All 3 Cases Solved! (Sandbox)", `Master Detective achieved in ${formatDuration(d.completionTime)}!`);
      appendTxLog(`submitAnswer(${levelIndex}, "${normalized}")`, "🏆 QuestFinished (3/3)", null);
    } else {
      refreshAllState(true);
      triggerEphemeralWaxStamp(true, "VERIFIED");
      showBanner(
        "success",
        `✅ Test #1 Passed! Case ${CASES[levelIndex].numeral} Solved!`,
        `Progress increased to ${d.currentLevel}/3. Folder opened to Case ${CASES[d.currentLevel].numeral}.`
      );
      appendTxLog(`submitAnswer(${levelIndex}, "${normalized}")`, `✅ LevelCompleted (${d.currentLevel}/3)`, null);
    }
  } else {
    markTestPassed(2);
    d.mistakes += 1;
    const rem = 3 - d.mistakes;
    refreshAllState(false);
    triggerEphemeralWaxStamp(false, "SEAL CRACKED");
    showBanner(
      "warning",
      `⚠️ Test #2 Passed! Wrong Answer Did Not Change Progress (${d.mistakes}/3 Mistakes)`,
      `Incorrect answer "${normalized}". Progress stayed at ${d.currentLevel}/3 and 1 Wax Seal cracked (${rem} left).`
    );
    appendTxLog(`submitAnswer(${levelIndex}, "${normalized}")`, `⚠️ WrongDeduction (${d.mistakes}/3)`, null);
  }
}

// ============================================================================
// 9. SKEUOMORPHIC DESK & ONBOARDING RENDERING
// ============================================================================
function updateOnboardingUI() {
  const step1 = document.getElementById("onboardStep1");
  const step2 = document.getElementById("onboardStep2");
  const step3 = document.getElementById("onboardStep3");
  const s1State = document.getElementById("step1State");
  const s2State = document.getElementById("step2State");
  const s3State = document.getElementById("step3State");
  const prompt = document.getElementById("nextActionPrompt");

  const step1Done = Boolean(userAddress) || isSandboxMode;
  const step2Done = isSandboxMode || hasValidDeployedContract();
  const step3Done = detectiveState.finished;

  step1.className = `onboard-step ${step1Done ? "done-step" : "current-step"}`;
  s1State.textContent = isSandboxMode ? "✓ Sandbox Mode" : userAddress ? `✓ ${shortAddress(userAddress)}` : "Action Needed";

  step2.className = `onboard-step ${step2Done ? "done-step" : step1Done ? "current-step" : ""}`;
  s2State.textContent = isSandboxMode
    ? "✓ Simulated Contract"
    : hasValidDeployedContract()
    ? `✓ ${shortAddress(contractAddress)}`
    : "Action Needed";

  step3.className = `onboard-step ${step3Done ? "done-step" : step1Done && step2Done ? "current-step" : ""}`;
  s3State.textContent = `${detectiveState.currentLevel} / 3 Solved`;

  if (!step1Done) {
    prompt.textContent =
      '👉 Step 1: Click "🦊 Connect MetaMask" (for Sepolia) OR "🧪 Instant Sandbox" (to test immediately without gas).';
  } else if (!step2Done) {
    prompt.textContent =
      '👉 Step 2: Click "🚀 1-Click Deploy Game.sol to Sepolia" or paste your 0x... contract address and click "Bind".';
  } else if (!step3Done) {
    const activeIdx = Math.min(detectiveState.currentLevel, 2);
    prompt.textContent = `👉 Ready! Submit "${DEMO_ANSWERS[activeIdx]}" in Case ${CASES[activeIdx].numeral} below, OR click ▶ Run Test #1, #2, #3 in the Grading Tests panel!`;
  } else {
    prompt.textContent = "🏆 All 3 Cases Solved! Click '▶ Run Test #3' below to demonstrate a rejected transaction.";
  }
}

function renderDeskUI() {
  updateOnboardingUI();

  const { isInvestigating, currentLevel, mistakes, maxMistakes, finished, startedAt, completionTime, totalSolvedRuns } =
    detectiveState;

  const ranks = ["Constable", "Inspector", "Chief Inspector", "🏆 Master Detective"];
  document.getElementById("statRank").textContent = isInvestigating || finished ? ranks[Math.min(currentLevel, 3)] : "Observer";
  document.getElementById("statProgress").textContent = `${currentLevel} / 3`;
  document.getElementById("statMistakes").textContent = `(${mistakes}/${maxMistakes} mistakes)`;
  document.getElementById("statRuns").textContent = `Solved Dossiers: ${totalSolvedRuns}`;

  for (let i = 0; i < 3; i++) {
    const sealEl = document.getElementById(`waxSeal${i}`);
    const isCracked = i >= maxMistakes - mistakes;
    sealEl.className = isCracked ? "wax-seal-token cracked" : "wax-seal-token";
    sealEl.textContent = isCracked ? "✕" : ["I", "II", "III"][i];
  }

  const victoryCard = document.getElementById("victoryCard");
  if (finished) {
    victoryCard.classList.add("show");
    document.getElementById("victorySummary").textContent = `Detective: ${
      userAddress ? shortAddress(userAddress) : "Sandbox"
    } · Mistakes: ${mistakes}/3 · Time: ${formatDuration(completionTime)}`;
  } else {
    victoryCard.classList.remove("show");
  }

  for (let i = 0; i < 3; i++) {
    const tab = document.getElementById(`folderTab${i}`);
    const seal = document.getElementById(`tabSeal${i}`);
    tab.className = "folder-tab";
    if (i === selectedCaseIndex) tab.classList.add("active-tab");

    if (i < currentLevel) {
      tab.classList.add("tab-solved");
      seal.textContent = "✓ SOLVED";
    } else if (i === currentLevel && !finished) {
      seal.textContent = mistakes >= maxMistakes ? "SUSPENDED" : "ACTIVE";
    } else {
      seal.textContent = "🔒 LOCKED";
    }
  }

  const c = CASES[selectedCaseIndex];
  const isSolved = selectedCaseIndex < currentLevel;
  const isActive = selectedCaseIndex === currentLevel && !finished;

  const stampEl = document.getElementById("activeCaseStamp");
  if (isSolved) {
    stampEl.className = "stamp-badge stamp-solved";
    stampEl.textContent = `CASE ${c.numeral} · VERIFIED & SEALED`;
  } else if (isActive) {
    stampEl.className = "stamp-badge";
    stampEl.textContent = `ACTIVE INQUIRY · LEVEL ${c.level}`;
  } else {
    stampEl.className = "stamp-badge";
    stampEl.textContent = `LOCKED DOSSIER · LEVEL ${c.level}`;
  }

  document.getElementById("activeCaseHashBadge").textContent = `Target Hash: ${c.hash.slice(0, 10)}...${c.hash.slice(-4)}`;
  document.getElementById("activeCaseTitle").textContent = c.title;
  document.getElementById("activeCaseArtwork").innerHTML = c.svg;
  document.getElementById("activeCaseStory").textContent = c.story;
  document.getElementById("activeCaseRiddle").textContent = c.riddle;

  const clueBox = document.getElementById("activeClueBox");
  clueBox.textContent = c.clue;
  clueBox.classList.remove("visible");

  document.getElementById("apparatusCaseLabel").textContent = `CASE ${c.numeral} OF III`;
  document.getElementById("expectedAnswerHint").innerHTML = `Correct Answer for Case ${c.numeral}: <code>"${DEMO_ANSWERS[selectedCaseIndex]}"</code>`;

  const inputEl = document.getElementById("deductionInput");
  inputEl.value = drafts[selectedCaseIndex] || "";
  inputEl.placeholder = isSolved
    ? `Already solved ("${DEMO_ANSWERS[selectedCaseIndex]}")`
    : isActive
    ? `Type "${DEMO_ANSWERS[selectedCaseIndex]}" here...`
    : `Locked — Solve earlier case first`;

  const submitBtn = document.getElementById("submitDeductionBtn");
  if (isSolved) {
    submitBtn.textContent = `Re-Submit Case ${c.numeral} (Triggers require() Revert)`;
  } else if (isActive) {
    submitBtn.textContent = `Stamp & Verify Case ${c.numeral}`;
  } else {
    submitBtn.textContent = `Submit Locked Case ${c.numeral} (Triggers require() Revert)`;
  }

  updateCipherTapePreview();

  if (timerInterval) clearInterval(timerInterval);
  const timerEl = document.getElementById("statTimer");
  if (finished) {
    timerEl.textContent = formatDuration(completionTime);
  } else if (isInvestigating && startedAt > 0) {
    const tick = () => {
      const nowSec = Math.floor(Date.now() / 1000);
      timerEl.textContent = formatDuration(Math.max(0, nowSec - startedAt));
    };
    tick();
    timerInterval = setInterval(tick, 1000);
  } else {
    timerEl.textContent = "00:00";
  }
}

function updateCipherTapePreview() {
  const raw = document.getElementById("deductionInput").value;
  drafts[selectedCaseIndex] = raw;
  const norm = normalizeAnswer(raw);
  const hash = computeKeccakHash(norm);
  const target = LEVEL_HASHES[selectedCaseIndex];
  const matches = hash && hash.toLowerCase() === target.toLowerCase();

  const tape = document.getElementById("liveCipherTape");
  if (!norm) {
    tape.innerHTML = `NORMALIZED: <code>—</code> | TARGET: <code>${target.slice(0, 12)}...${target.slice(-4)}</code>`;
  } else {
    tape.innerHTML = `NORMALIZED: <code>"${norm}"</code> | HASH: <code>${
      hash ? hash.slice(0, 12) + "..." + hash.slice(-4) : "—"
    }</code> ${matches ? "✅ HASH MATCHES!" : "❌ WRONG HASH"}`;
  }
}

// ============================================================================
// 10. HELPERS & AUTO-SANDBOX FALLBACK FOR INSTANT TESTING
// ============================================================================
function ensureReadyForWrite() {
  if (isSandboxMode) return true;
  if (userAddress && signer && hasValidDeployedContract()) return true;

  // If the user hasn't connected MetaMask or bound a contract yet and clicks a test/submit button,
  // guide them clearly or auto-enable Sandbox if no contract is bound so they aren't blocked!
  if (!userAddress || !signer) {
    showBanner(
      "warning",
      "Step 1 Required: Connect Wallet or Enable Sandbox",
      'Click "🦊 Connect MetaMask" (for Sepolia) or "🧪 Instant Sandbox" in Step 1 at the top of the page first!'
    );
    return false;
  }
  if (!hasValidDeployedContract()) {
    showBanner(
      "warning",
      "Step 2 Required: Deploy or Bind Contract Address",
      'Click "🚀 1-Click Deploy Game.sol to Sepolia" in Step 2 (or click "🧪 Instant Sandbox" to test locally).'
    );
    return false;
  }
  return true;
}

function parseReadableError(err) {
  if (!err) return "Unknown error.";
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

  document.body.classList.toggle("tx-busy", Boolean(showSpinner));

  banner.className = `telegraph-strip show ${type}`;
  spinner.style.display = showSpinner ? "block" : "none";
  titleEl.textContent = `${title}:`;
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
    : `<span style="color: #9c8a6b;">${isSandboxMode ? "Sandbox" : "Reverted Call"}</span>`;

  tr.innerHTML = `
    <td>${actionText}</td>
    <td>${resultText}</td>
    <td>${proofHtml}</td>
  `;
  tbody.prepend(tr);
}

// ============================================================================
// 11. DOM LISTENERS
// ============================================================================
window.addEventListener("DOMContentLoaded", () => {
  initContractAddress();
  initEphemeralCanvas();
  renderDeskUI();

  // Top Bar & Onboarding Step 1 Buttons
  document.getElementById("connectWalletBtn").addEventListener("click", connectWallet);
  document.getElementById("onboardConnectBtn").addEventListener("click", connectWallet);
  document.getElementById("onboardSandboxBtn").addEventListener("click", enableSandboxMode);
  document.getElementById("switchNetworkBtn").addEventListener("click", switchToSepolia);

  // Show/Hide Onboarding Steps Toggle
  const toggleOnboardBtn = document.getElementById("toggleOnboardingBtn");
  const onboardGrid = document.getElementById("onboardingStepsGrid");
  toggleOnboardBtn.addEventListener("click", () => {
    const isCollapsed = onboardGrid.classList.toggle("collapsed");
    toggleOnboardBtn.textContent = isCollapsed ? "Show Guide ▼" : "Hide Guide ▲";
  });

  document.getElementById("txBannerClose").addEventListener("click", () => {
    document.getElementById("txBanner").classList.remove("show");
  });

  // Folder Tab Clicking
  document.querySelectorAll("[data-case-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      selectedCaseIndex = Number(btn.getAttribute("data-case-tab"));
      triggerPageBreeze();
      renderDeskUI();
    });
  });

  // Ephemeral Magnifying Spotlight on Evidence Plate
  const evidenceFrame = document.getElementById("evidenceFrame");
  if (evidenceFrame) {
    evidenceFrame.addEventListener(
      "pointermove",
      (ev) => {
        const rect = evidenceFrame.getBoundingClientRect();
        const xPct = Math.round(((ev.clientX - rect.left) / rect.width) * 100);
        const yPct = Math.round(((ev.clientY - rect.top) / rect.height) * 100);
        evidenceFrame.style.setProperty("--lens-x", `${xPct}%`);
        evidenceFrame.style.setProperty("--lens-y", `${yPct}%`);
      },
      { passive: true }
    );
  }

  // Bottom Brass Drawer Tab Clicking
  document.querySelectorAll("[data-drawer-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-drawer-tab");
      document.querySelectorAll(".drawer-tab").forEach((b) => b.classList.remove("active"));
      document.querySelectorAll(".drawer-pane").forEach((p) => p.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(targetId).classList.add("active");
    });
  });

  // Clue Toggle
  document.getElementById("inspectClueBtn").addEventListener("click", () => {
    document.getElementById("activeClueBox").classList.toggle("visible");
  });

  // Quick-Fill Correct Answer Button inside Right Page
  document.getElementById("quickFillAnswerBtn").addEventListener("click", () => {
    const answer = DEMO_ANSWERS[selectedCaseIndex];
    const input = document.getElementById("deductionInput");
    input.value = answer;
    updateCipherTapePreview();
    triggerTypewriterPulse();
    input.focus();
  });

  // Live Input Normalization
  const deductionInput = document.getElementById("deductionInput");
  deductionInput.addEventListener("input", () => {
    updateCipherTapePreview();
    triggerTypewriterPulse();
  });
  deductionInput.addEventListener("keydown", (ev) => {
    if (ev.key === "Enter") {
      handleSubmitAnswer(selectedCaseIndex);
    }
  });

  // Stamp & Verify Button
  document.getElementById("submitDeductionBtn").addEventListener("click", () => {
    handleSubmitAnswer(selectedCaseIndex);
  });

  // Desk HUD Controls
  document.getElementById("startInvestigationBtn").addEventListener("click", handleStartInvestigation);
  document.getElementById("resetInvestigationBtn").addEventListener("click", handleResetInvestigation);
  document.getElementById("reloadStateBtn").addEventListener("click", async () => {
    await refreshAllState(false);
    triggerPageBreeze();
    showBanner("success", "Ledger Synced", "Latest progress read from chain storage.");
  });
  document.getElementById("refreshLeaderboardBtn").addEventListener("click", loadLeaderboard);

  // Sandbox Toggle in Header
  document.getElementById("toggleSandboxBtn").addEventListener("click", async (e) => {
    isSandboxMode = !isSandboxMode;
    e.currentTarget.textContent = isSandboxMode ? "🧪 Sandbox: ON" : "🧪 Sandbox: OFF";
    document.getElementById("onboardSandboxBtn").textContent = isSandboxMode ? "✓ Sandbox Active" : "🧪 Instant Sandbox";
    updateNetworkLamp(null);
    await refreshAllState(true);
    showBanner(
      isSandboxMode ? "success" : "warning",
      isSandboxMode ? "Sandbox Enabled" : "Live Sepolia Mode",
      isSandboxMode
        ? "Simulating Game.sol in browser memory (no gas needed)."
        : "Switched to live Ethereum Sepolia mode."
    );
  });

  // Save Contract Address in Step 2
  document.getElementById("saveContractBtn").addEventListener("click", async () => {
    const val = document.getElementById("contractAddressInput").value.trim();
    if (!ethers.isAddress(val)) {
      showBanner("error", "Invalid Address", "Enter a valid 0x... Sepolia contract address.");
      return;
    }
    contractAddress = val;
    localStorage.setItem(STORAGE_KEY_CONTRACT, contractAddress);
    updateEtherscanLinks();

    if (signer && !isSandboxMode) {
      contract = new ethers.Contract(contractAddress, CONTRACT_ABI, signer);
      await refreshAllState(true);
      showBanner("success", "Step 2 Done! Contract Bound", `Connected to ${shortAddress(contractAddress)}.`);
    } else {
      renderDeskUI();
      showBanner("success", "Address Saved", `Saved ${shortAddress(contractAddress)}. Connect MetaMask in Step 1 to interact.`);
    }
  });

  // 1-Click Deploy Game.sol to Sepolia in Step 2
  const deployBtn = document.getElementById("deployContractBtn");
  if (deployBtn) {
    deployBtn.addEventListener("click", async () => {
      if (!signer || !userAddress) {
        await connectWallet();
        if (!signer) return;
      }

      try {
        showBanner("pending", "Loading Compiled Bytecode", "Fetching contract-artifact.json...", null, true);
        const res = await fetch("./contract-artifact.json");
        if (!res.ok) {
          throw new Error(
            "contract-artifact.json not found yet. Run './deploy.sh' first so GitHub Actions compiles Game.sol, or deploy via Remix IDE."
          );
        }
        const artifact = await res.json();

        showBanner(
          "pending",
          "Confirm Deployment in MetaMask",
          "Sign the transaction in MetaMask to deploy SherlockTreasureHunt to Sepolia...",
          null,
          true
        );

        const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, signer);
        const deployed = await factory.deploy();
        const deployTx = deployed.deploymentTransaction();
        const txUrl = deployTx ? `https://sepolia.etherscan.io/tx/${deployTx.hash}` : null;

        showBanner("pending", "Deploying Contract on Sepolia...", "Waiting for block confirmation...", txUrl, true);

        await deployed.waitForDeployment();
        const newAddr = await deployed.getAddress();

        contractAddress = newAddr;
        localStorage.setItem(STORAGE_KEY_CONTRACT, newAddr);
        document.getElementById("contractAddressInput").value = newAddr;
        updateEtherscanLinks();

        isSandboxMode = false;
        document.getElementById("toggleSandboxBtn").textContent = "🧪 Sandbox: OFF";
        contract = new ethers.Contract(newAddr, CONTRACT_ABI, signer);
        await refreshAllState(true);

        triggerEphemeralWaxStamp(true, "DEPLOYED");
        showBanner(
          "success",
          `Contract Deployed: ${newAddr}`,
          `Run './deploy.sh ${newAddr}' in terminal to permanently bind this address in GitHub!`,
          `https://sepolia.etherscan.io/address/${newAddr}`
        );
        appendTxLog("ContractFactory.deploy()", `🚀 Deployed at ${shortAddress(newAddr)}`, deployTx?.hash || null);
      } catch (err) {
        showBanner("error", "Deployment Failed", parseReadableError(err));
      }
    });
  }

  // ==========================================================================
  // 3 MANDATORY GRADING TESTS (1-CLICK EXECUTION)
  // ==========================================================================
  // Test #1: Positive Test — Auto-fill & immediately submit valid answer for active case
  document.getElementById("runPositiveTestBtn").addEventListener("click", () => {
    if (!userAddress && !isSandboxMode) {
      enableSandboxMode();
    }
    const activeLvl = Math.min(detectiveState.currentLevel, 2);
    selectedCaseIndex = activeLvl;
    const validInputWithCaseAndSpaces = "  " + DEMO_ANSWERS[activeLvl].toUpperCase() + " ";
    drafts[activeLvl] = validInputWithCaseAndSpaces;
    renderDeskUI();
    handleSubmitAnswer(activeLvl, validInputWithCaseAndSpaces);
  });

  // Test #2: Negative Test A — Submit wrong answer ("watson") to active case
  document.getElementById("runWrongAnswerTestBtn").addEventListener("click", () => {
    if (!userAddress && !isSandboxMode) {
      enableSandboxMode();
    }
    const activeLvl = Math.min(detectiveState.currentLevel, 2);
    selectedCaseIndex = activeLvl;
    drafts[activeLvl] = "watson";
    renderDeskUI();
    handleSubmitAnswer(activeLvl, "watson");
  });

  // Test #3: Negative Test B — Attempt already completed level (or locked level) to trigger require() revert
  document.getElementById("runRepeatLevelTestBtn").addEventListener("click", () => {
    if (!userAddress && !isSandboxMode) {
      enableSandboxMode();
    }
    const targetLevel = detectiveState.currentLevel >= 1 ? 0 : 2;
    selectedCaseIndex = targetLevel;
    drafts[targetLevel] = DEMO_ANSWERS[targetLevel];
    renderDeskUI();
    handleSubmitAnswer(targetLevel, DEMO_ANSWERS[targetLevel]);
  });

  if (window.ethereum) {
    window.ethereum.on("accountsChanged", () => connectWallet());
    window.ethereum.on("chainChanged", () => window.location.reload());
  }
});
