// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SherlockTreasureHunt (Group 2 — Digital Treasure Hunt)
 * @notice Blockchain detective puzzle game for Ethereum Sepolia.
 *         Players solve 3 consecutive Sherlock Holmes cases.
 *         Includes input normalization, 3-mistake limit, timer, and on-chain leaderboard.
 */
contract SherlockTreasureHunt {
    uint8 public constant TOTAL_LEVELS = 3;
    uint8 public constant MAX_MISTAKES = 3;

    // Precomputed keccak256 hashes of normalized (lowercase, trimmed) answers:
    // Case #1 (index 0): keccak256("221b")       = 0x0d0ca3abd02760d948ae7217285ad25325d0ae2700c2eca9e5b6710dc6d43363
    // Case #2 (index 1): keccak256("footprints") = 0xa91db06ad5c29a93db96e5e6558ea66d191c50b7c58e2bf4ae2b0d7b4d9e23f7
    // Case #3 (index 2): keccak256("moriarty")   = 0xf17280f6bc66c3c21b7c5a38cae0b2879a82687129cb71944e29620f311430d7
    bytes32[3] private answerHashes;

    struct Detective {
        bool isInvestigating;
        uint8 currentLevel;      // 0 = Case #1, 1 = Case #2, 2 = Case #3, 3 = All Solved
        uint8 mistakes;          // Mistakes made in current run (max 3)
        bool hasFinished;        // True once all 3 cases are solved
        uint256 startedAt;       // Timestamp when investigation started
        uint256 finishedAt;      // Timestamp when Case #3 was solved
        uint256 completionTime;  // Total seconds to solve all 3 cases
        uint256 totalSolvedRuns; // Number of times this wallet completed the full dossier
    }

    struct LeaderboardEntry {
        address detective;
        uint8 mistakes;
        uint256 completionTime;
        uint256 finishedAt;
    }

    mapping(address => Detective) private detectives;
    mapping(address => uint256) private leaderboardIndex; // 1-based index into leaderboard array
    LeaderboardEntry[] private leaderboard;

    // Events for Etherscan verification and frontend updates
    event InvestigationStarted(address indexed detective, uint256 timestamp);
    event LevelCompleted(address indexed detective, uint8 indexed newLevel, uint256 timestamp);
    event WrongDeduction(address indexed detective, uint8 indexed attemptedLevel, uint8 mistakesUsed, uint8 mistakesRemaining);
    event QuestFinished(address indexed detective, uint8 mistakesUsed, uint256 completionTimeSeconds, uint256 timestamp);
    event InvestigationReset(address indexed detective, uint256 timestamp);

    constructor() {
        answerHashes[0] = 0x0d0ca3abd02760d948ae7217285ad25325d0ae2700c2eca9e5b6710dc6d43363; // "221b"
        answerHashes[1] = 0xa91db06ad5c29a93db96e5e6558ea66d191c50b7c58e2bf4ae2b0d7b4d9e23f7; // "footprints"
        answerHashes[2] = 0xf17280f6bc66c3c21b7c5a38cae0b2879a82687129cb71944e29620f311430d7; // "moriarty"
    }

    /**
     * @notice State-Changing Function #1: Officially opens the detective's case file and starts the timer.
     */
    function startInvestigation() external {
        Detective storage d = detectives[msg.sender];
        require(!d.isInvestigating, "Investigation already started. Solve the active case or reset.");

        d.isInvestigating = true;
        d.currentLevel = 0;
        d.mistakes = 0;
        d.hasFinished = false;
        d.startedAt = block.timestamp;
        d.finishedAt = 0;
        d.completionTime = 0;

        emit InvestigationStarted(msg.sender, block.timestamp);
    }

    /**
     * @notice State-Changing Function #2: Submits an answer for a specific case level (0, 1, or 2).
     * @param level The 0-based case index (0 = Case #1, 1 = Case #2, 2 = Case #3).
     * @param answer The player's answer string (normalized on-chain for case/whitespace safety).
     * @return isCorrect True if the answer unlocked the next level, false if a mistake was recorded.
     */
    function submitAnswer(uint8 level, string calldata answer) external returns (bool isCorrect) {
        Detective storage d = detectives[msg.sender];

        // Security & Game Rule Checks (require)
        require(level < TOTAL_LEVELS, "Invalid case number: must be 0, 1, or 2.");
        require(!d.hasFinished, "All 3 cases are already solved! Call resetInvestigation() to play again.");
        require(
            d.mistakes < MAX_MISTAKES,
            "Case closed: 3 mistakes limit reached! Call resetInvestigation() to start a fresh inquiry."
        );
        require(
            level >= d.currentLevel,
            "Case already completed! A solved level cannot be counted a second time."
        );
        require(
            level == d.currentLevel,
            "Case locked! You must solve earlier cases in sequential order first."
        );

        // Normalize input (trim spaces & convert ASCII uppercase to lowercase)
        bytes memory normalized = _normalize(answer);
        require(normalized.length > 0, "Answer cannot be empty.");

        // Auto-start timer if player submits Case #1 directly without calling startInvestigation()
        if (!d.isInvestigating) {
            d.isInvestigating = true;
            d.startedAt = block.timestamp;
            emit InvestigationStarted(msg.sender, block.timestamp);
        }

        bytes32 submittedHash = keccak256(normalized);

        if (submittedHash == answerHashes[level]) {
            d.currentLevel += 1;
            emit LevelCompleted(msg.sender, d.currentLevel, block.timestamp);

            if (d.currentLevel == TOTAL_LEVELS) {
                d.hasFinished = true;
                d.finishedAt = block.timestamp;
                d.completionTime = block.timestamp >= d.startedAt ? (block.timestamp - d.startedAt) : 0;
                d.totalSolvedRuns += 1;

                _recordLeaderboard(msg.sender, d.mistakes, d.completionTime, d.finishedAt);
                emit QuestFinished(msg.sender, d.mistakes, d.completionTime, d.finishedAt);
            }
            return true;
        } else {
            d.mistakes += 1;
            uint8 remaining = MAX_MISTAKES - d.mistakes;
            emit WrongDeduction(msg.sender, level, d.mistakes, remaining);
            return false;
        }
    }

    /**
     * @notice State-Changing Function #3: Resets the caller's current progress and mistake counter
     *         so they can retry after hitting the 3-mistake limit or replay the dossier.
     */
    function resetInvestigation() external {
        Detective storage d = detectives[msg.sender];
        require(
            d.isInvestigating || d.currentLevel > 0 || d.mistakes > 0,
            "Nothing to reset: start an investigation first."
        );

        d.isInvestigating = true;
        d.currentLevel = 0;
        d.mistakes = 0;
        d.hasFinished = false;
        d.startedAt = block.timestamp;
        d.finishedAt = 0;
        d.completionTime = 0;

        emit InvestigationReset(msg.sender, block.timestamp);
    }

    // =========================================================================
    // View / Data-Reading Functions
    // =========================================================================

    /**
     * @notice Returns the number of completed levels (0 to 3) for a player wallet.
     */
    function progress(address player) external view returns (uint256) {
        return detectives[player].currentLevel;
    }

    /**
     * @notice Returns true if the player has completed all 3 cases in their active dossier.
     */
    function hasFinished(address player) external view returns (bool) {
        return detectives[player].hasFinished;
    }

    /**
     * @notice Returns the full detective state for a given wallet address.
     */
    function getDetective(address player)
        external
        view
        returns (
            bool isInvestigating,
            uint8 currentLevel,
            uint8 mistakes,
            uint8 maxMistakes,
            bool finished,
            uint256 startedAt,
            uint256 finishedAt,
            uint256 completionTime,
            uint256 totalSolvedRuns
        )
    {
        Detective storage d = detectives[player];
        return (
            d.isInvestigating,
            d.currentLevel,
            d.mistakes,
            MAX_MISTAKES,
            d.hasFinished,
            d.startedAt,
            d.finishedAt,
            d.completionTime,
            d.totalSolvedRuns
        );
    }

    /**
     * @notice Returns the stored bytes32 answer hash for a level (demonstrates public state inspection).
     */
    function getLevelHash(uint8 level) external view returns (bytes32) {
        require(level < TOTAL_LEVELS, "Invalid level");
        return answerHashes[level];
    }

    /**
     * @notice Returns all leaderboard entries of detectives who solved the full dossier.
     */
    function getLeaderboard() external view returns (LeaderboardEntry[] memory) {
        return leaderboard;
    }

    // =========================================================================
    // Internal Helpers
    // =========================================================================

    function _recordLeaderboard(
        address detective,
        uint8 mistakesUsed,
        uint256 timeTaken,
        uint256 finishedTime
    ) internal {
        uint256 idx = leaderboardIndex[detective];
        if (idx == 0) {
            leaderboard.push(
                LeaderboardEntry({
                    detective: detective,
                    mistakes: mistakesUsed,
                    completionTime: timeTaken,
                    finishedAt: finishedTime
                })
            );
            leaderboardIndex[detective] = leaderboard.length;
        } else {
            LeaderboardEntry storage existing = leaderboard[idx - 1];
            // Update entry if the new run had fewer mistakes or faster time
            if (
                mistakesUsed < existing.mistakes ||
                (mistakesUsed == existing.mistakes && timeTaken < existing.completionTime)
            ) {
                existing.mistakes = mistakesUsed;
                existing.completionTime = timeTaken;
                existing.finishedAt = finishedTime;
            }
        }
    }

    /**
     * @dev Trims leading/trailing ASCII whitespace and converts uppercase A-Z to lowercase a-z.
     */
    function _normalize(string calldata input) internal pure returns (bytes memory) {
        bytes calldata raw = bytes(input);
        uint256 start = 0;
        uint256 end = raw.length;

        while (start < end && _isWhitespace(raw[start])) {
            start++;
        }
        while (end > start && _isWhitespace(raw[end - 1])) {
            end--;
        }

        uint256 len = end - start;
        bytes memory result = new bytes(len);

        for (uint256 i = 0; i < len; i++) {
            bytes1 ch = raw[start + i];
            if (ch >= 0x41 && ch <= 0x5A) {
                // Convert 'A'-'Z' to 'a'-'z'
                result[i] = bytes1(uint8(ch) + 32);
            } else {
                result[i] = ch;
            }
        }
        return result;
    }

    function _isWhitespace(bytes1 ch) internal pure returns (bool) {
        return ch == 0x20 || ch == 0x09 || ch == 0x0A || ch == 0x0D;
    }
}
