// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./AccessControl.sol";

contract ReputationRegistry is AccessControl {
    LeakProofAccessControl public immutable accessControl;
    address public core;

    struct ReporterProfile {
        uint32 totalReports;
        uint32 verifiedReports;
        uint32 rejectedReports;
        uint32 escalatedReports;
        uint32 credibilityScore;
        uint64 lastReportAt;
        bool exists;
    }

    struct ReviewerProfile {
        uint32 totalReviews;
        uint32 accurateVotes;
        uint32 missedVotes;
        uint32 avgSeverityGiven;
        uint64 lastReviewAt;
        bool exists;
    }

    struct CaseReputationImpact {
        uint256 caseId;
        int256 reporterDeltaSigned;
        int256 reviewerDeltaSigned;
        bool applied;
    }

    mapping(address => ReporterProfile) private reporterProfiles;
    mapping(address => ReviewerProfile) private reviewerProfiles;
    mapping(address => uint256) private reporterCommitments;
    mapping(uint256 => CaseReputationImpact) private caseImpacts;
    mapping(address => uint256) private reporterCommitmentCount;
    mapping(address => mapping(uint256 => bytes32)) private reporterCommitmentsByIndex;

    uint256 private constant MAX_SCORE = 1000;
    uint256 private constant TRUSTED_THRESHOLD = 700;
    uint256 private constant SUSPICIOUS_THRESHOLD = 200;

    event ReporterCommitmentCreated(address indexed reporter, bytes32 commitment);
    event ReporterCommitmentUsed(address indexed reporter, bytes32 commitment);
    event ReporterProfileUpdated(address indexed reporter, uint32 credibilityScore);
    event ReviewerProfileUpdated(address indexed reviewer, uint32 accurateVotes, uint32 totalReviews);
    event ReputationImpactApplied(uint256 indexed caseId, address indexed reporter, int256 delta);
    event ReviewerAccuracyRecorded(uint256 indexed caseId, address indexed reviewer, bool accurate);
    event CoreUpdated(address indexed core);

    modifier onlyAdmin() {
        require(accessControl.isAdmin(msg.sender), "Admin only");
        _;
    }

    modifier onlyCoreOrAdmin() {
        require(msg.sender == core || accessControl.isAdmin(msg.sender), "Core or admin only");
        _;
    }

    constructor(address accessControlAddress) {
        require(accessControlAddress != address(0), "Invalid address");
        accessControl = LeakProofAccessControl(accessControlAddress);
    }

    function setCore(address coreAddress) external onlyAdmin {
        require(coreAddress != address(0), "Invalid core");
        core = coreAddress;
        emit CoreUpdated(coreAddress);
    }

    function createReporterCommitment() external returns (bytes32 commitment) {
        bytes32 hash = keccak256(
            abi.encodePacked(
                msg.sender,
                block.chainid,
                block.timestamp,
                block.prevrandao,
                reporterCommitmentCount[msg.sender]
            )
        );
        reporterCommitments[msg.sender] = uint256(hash);
        reporterCommitmentCount[msg.sender] += 1;
        reporterCommitmentsByIndex[msg.sender][reporterCommitmentCount[msg.sender]] = hash;
        emit ReporterCommitmentCreated(msg.sender, hash);
        return hash;
    }

    function useReporterCommitment(bytes32 commitment) external returns (bool valid) {
        if (reporterCommitments[msg.sender] != uint256(commitment)) {
            return false;
        }
        reporterCommitments[msg.sender] = 0;
        emit ReporterCommitmentUsed(msg.sender, commitment);
        return true;
    }

    function getReporterCommitment(address reporter) external view returns (bytes32) {
        return bytes32(reporterCommitments[reporter]);
    }

    function initReporterProfile(address reporter) external {
        require(!reporterProfiles[reporter].exists, "Profile exists");
        reporterProfiles[reporter] = ReporterProfile({
            totalReports: 0,
            verifiedReports: 0,
            rejectedReports: 0,
            escalatedReports: 0,
            credibilityScore: 500,
            lastReportAt: 0,
            exists: true
        });
    }

    function recordReportSubmission(address reporter) external onlyCoreOrAdmin {
        ReporterProfile storage profile = reporterProfiles[reporter];
        if (!profile.exists) {
            profile.exists = true;
            profile.credibilityScore = 500;
        }
        profile.totalReports += 1;
        profile.lastReportAt = uint64(block.timestamp);
    }

    function recordCaseOutcome(uint256 caseId, address reporter, uint8 outcome) external onlyCoreOrAdmin {
        CaseReputationImpact storage impact = caseImpacts[caseId];
        require(!impact.applied, "Already applied");

        ReporterProfile storage profile = reporterProfiles[reporter];
        if (!profile.exists) {
            profile.exists = true;
            profile.credibilityScore = 500;
        }

        int256 signedDelta;
        if (outcome == 4) {
            profile.verifiedReports += 1;
            signedDelta = 30;
        } else if (outcome == 6) {
            profile.rejectedReports += 1;
            signedDelta = profile.totalReports > 3 ? int256(-50) : int256(-10);
        } else if (outcome == 3) {
            profile.escalatedReports += 1;
            signedDelta = 20;
        } else {
            signedDelta = 0;
        }

        if (signedDelta != 0) {
            uint256 newScore;
            if (signedDelta > 0) {
                newScore = uint256(profile.credibilityScore) + uint256(signedDelta);
            } else {
                uint256 abs = uint256(-signedDelta);
                newScore = profile.credibilityScore >= abs ? profile.credibilityScore - abs : 0;
            }
            if (newScore > MAX_SCORE) {
                newScore = MAX_SCORE;
            }
            profile.credibilityScore = uint32(newScore);
        }

        impact.caseId = caseId;
        impact.reporterDeltaSigned = signedDelta;
        impact.applied = true;

        emit ReputationImpactApplied(caseId, reporter, signedDelta);
        emit ReporterProfileUpdated(reporter, profile.credibilityScore);
    }

    function recordReviewerAccuracy(uint256 caseId, address reviewer, bool accurate) external onlyAdmin {
        ReviewerProfile storage profile = reviewerProfiles[reviewer];
        if (!profile.exists) {
            profile.exists = true;
            profile.accurateVotes = 0;
            profile.totalReviews = 0;
            profile.missedVotes = 0;
            profile.avgSeverityGiven = 0;
        }

        profile.totalReviews += 1;
        if (accurate) {
            profile.accurateVotes += 1;
        }

        CaseReputationImpact storage impact = caseImpacts[caseId];
        impact.reviewerDeltaSigned = accurate ? int256(25) : int256(-12);
        impact.caseId = caseId;

        emit ReviewerAccuracyRecorded(caseId, reviewer, accurate);
        emit ReviewerProfileUpdated(reviewer, profile.accurateVotes, profile.totalReviews);
    }

    function recordReviewerMissedVote(address reviewer) external onlyAdmin {
        ReviewerProfile storage profile = reviewerProfiles[reviewer];
        if (profile.exists) {
            profile.missedVotes += 1;
        }
    }

    function recordSeverityScore(address reviewer, uint8 severityScore) external onlyAdmin {
        ReviewerProfile storage profile = reviewerProfiles[reviewer];
        if (profile.exists && profile.totalReviews > 0) {
            uint256 totalSeverity = uint256(profile.avgSeverityGiven) * (profile.totalReviews - 1);
            totalSeverity += severityScore;
            profile.avgSeverityGiven = uint32(totalSeverity / profile.totalReviews);
        }
    }

    function getReporterProfile(address reporter)
        external
        view
        returns (
            uint32 totalReports,
            uint32 verifiedReports,
            uint32 rejectedReports,
            uint32 escalatedReports,
            uint32 credibilityScore,
            uint64 lastReportAt,
            bool isTrusted,
            bool isSuspicious
        )
    {
        ReporterProfile storage profile = reporterProfiles[reporter];
        return (
            profile.totalReports,
            profile.verifiedReports,
            profile.rejectedReports,
            profile.escalatedReports,
            profile.credibilityScore,
            profile.lastReportAt,
            profile.credibilityScore >= TRUSTED_THRESHOLD,
            profile.credibilityScore <= SUSPICIOUS_THRESHOLD
        );
    }

    function getReviewerProfile(address reviewer)
        external
        view
        returns (
            uint32 totalReviews,
            uint32 accurateVotes,
            uint32 missedVotes,
            uint32 accuracyRate,
            uint32 avgSeverityGiven
        )
    {
        ReviewerProfile storage profile = reviewerProfiles[reviewer];
        uint256 computedAccuracyRate = profile.totalReviews > 0
            ? (uint256(profile.accurateVotes) * 1000) / profile.totalReviews
            : 0;
        return (
            profile.totalReviews,
            profile.accurateVotes,
            profile.missedVotes,
            uint32(computedAccuracyRate),
            profile.avgSeverityGiven
        );
    }

    function isReporterTrusted(address reporter) external view returns (bool) {
        return reporterProfiles[reporter].credibilityScore >= TRUSTED_THRESHOLD;
    }

    function isReporterSuspicious(address reporter) external view returns (bool) {
        return reporterProfiles[reporter].credibilityScore <= SUSPICIOUS_THRESHOLD;
    }

    function getCaseReputationImpact(uint256 caseId) external view returns (int256 reporterDelta, int256 reviewerDelta, bool applied) {
        CaseReputationImpact storage impact = caseImpacts[caseId];
        return (impact.reporterDeltaSigned, impact.reviewerDeltaSigned, impact.applied);
    }
}
