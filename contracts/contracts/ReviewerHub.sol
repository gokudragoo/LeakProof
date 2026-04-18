// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {FHE, InEuint8, ebool, euint8, euint32} from "@fhenixprotocol/cofhe-contracts/FHE.sol";

import "./AccessControl.sol";
import "./LeakProofCore.sol";

contract ReviewerHub {
    LeakProofAccessControl public immutable accessControl;
    LeakProofCore public immutable core;

    enum Recommendation {
        None,
        Approve,
        Reject,
        Escalate
    }

    struct ReviewerAssignment {
        address reviewer;
        uint256 caseId;
        bool hasVoted;
        euint8 encryptedRecommendation;
        euint8 encryptedSeverityScore;
        string encryptedNotes;
        uint64 assignedAt;
        uint64 votedAt;
    }

    struct CaseConsensus {
        euint32 approvals;
        euint32 rejects;
        euint32 escalations;
        euint32 severityTotal;
        euint8 averageSeverityScore;
        bool published;
    }

    euint8 private immutable APPROVE_CODE;
    euint8 private immutable REJECT_CODE;
    euint8 private immutable ESCALATE_CODE;
    euint8 private immutable ONE8;
    euint8 private immutable FIVE8;
    euint32 private immutable ZERO32;
    euint32 private immutable ONE32;

    mapping(uint256 => mapping(address => ReviewerAssignment)) public assignments;
    mapping(uint256 => address[]) public assignedReviewers;
    mapping(uint256 => uint256) public approvalThreshold;
    mapping(address => uint256[]) private reviewerCases;
    mapping(uint256 => CaseConsensus) private consensuses;

    event ReviewerAssigned(uint256 indexed caseId, address indexed reviewer, address indexed assigner);
    event VoteSubmitted(uint256 indexed caseId, address indexed reviewer);
    event ConsensusPublished(
        uint256 indexed caseId,
        uint256 approvals,
        uint256 rejects,
        uint256 escalations,
        uint8 averageSeverityScore
    );
    event ConfidentialSummaryAuthorized(uint256 indexed caseId, address indexed viewer);

    modifier onlyAdmin() {
        require(accessControl.isAdmin(msg.sender), "Admin only");
        _;
    }

    constructor(address accessControlAddress, address coreAddress) {
        require(accessControlAddress != address(0) && coreAddress != address(0), "Invalid addresses");
        accessControl = LeakProofAccessControl(accessControlAddress);
        core = LeakProofCore(coreAddress);

        APPROVE_CODE = FHE.asEuint8(uint8(Recommendation.Approve));
        REJECT_CODE = FHE.asEuint8(uint8(Recommendation.Reject));
        ESCALATE_CODE = FHE.asEuint8(uint8(Recommendation.Escalate));
        ONE8 = FHE.asEuint8(1);
        FIVE8 = FHE.asEuint8(5);
        ZERO32 = FHE.asEuint32(0);
        ONE32 = FHE.asEuint32(1);

        FHE.allowThis(APPROVE_CODE);
        FHE.allowThis(REJECT_CODE);
        FHE.allowThis(ESCALATE_CODE);
        FHE.allowThis(ONE8);
        FHE.allowThis(FIVE8);
        FHE.allowThis(ZERO32);
        FHE.allowThis(ONE32);
    }

    function assignReviewer(uint256 caseId, address reviewer) external onlyAdmin {
        require(reviewer != address(0), "Invalid reviewer");
        require(accessControl.isReviewer(reviewer), "Reviewer role required");
        require(core.caseExists(caseId), "Invalid case ID");
        require(assignments[caseId][reviewer].reviewer == address(0), "Already assigned");

        _ensureConsensusInitialized(caseId);

        assignments[caseId][reviewer] = ReviewerAssignment({
            reviewer: reviewer,
            caseId: caseId,
            hasVoted: false,
            encryptedRecommendation: FHE.asEuint8(0),
            encryptedSeverityScore: FHE.asEuint8(0),
            encryptedNotes: "",
            assignedAt: uint64(block.timestamp),
            votedAt: 0
        });

        FHE.allowThis(assignments[caseId][reviewer].encryptedRecommendation);
        FHE.allowThis(assignments[caseId][reviewer].encryptedSeverityScore);

        assignedReviewers[caseId].push(reviewer);
        reviewerCases[reviewer].push(caseId);

        if (approvalThreshold[caseId] == 0) {
            approvalThreshold[caseId] = 2;
        }

        core.registerReviewerAssignment(caseId, reviewer);
        _grantConsensusAccess(caseId, reviewer);

        emit ReviewerAssigned(caseId, reviewer, msg.sender);
    }

    function submitVote(
        uint256 caseId,
        InEuint8 calldata recommendationInput,
        InEuint8 calldata severityScoreInput,
        string calldata encryptedNotes
    ) external {
        ReviewerAssignment storage assignment = assignments[caseId][msg.sender];

        require(assignment.reviewer == msg.sender, "Not assigned");
        require(!assignment.hasVoted, "Already voted");

        _ensureConsensusInitialized(caseId);

        euint8 recommendation = _normalizeRecommendation(FHE.asEuint8(recommendationInput));
        euint8 severityScore = _clampSeverity(FHE.asEuint8(severityScoreInput));

        assignment.hasVoted = true;
        assignment.encryptedRecommendation = recommendation;
        assignment.encryptedSeverityScore = severityScore;
        assignment.encryptedNotes = encryptedNotes;
        assignment.votedAt = uint64(block.timestamp);

        FHE.allowThis(assignment.encryptedRecommendation);
        FHE.allowThis(assignment.encryptedSeverityScore);
        FHE.allow(assignment.encryptedRecommendation, msg.sender);
        FHE.allow(assignment.encryptedSeverityScore, msg.sender);

        _recomputeConsensus(caseId, msg.sender);

        emit VoteSubmitted(caseId, msg.sender);
    }

    function authorizeVoteSummaryAccess(uint256 caseId) external {
        require(core.caseExists(caseId), "Invalid case ID");
        require(
            accessControl.isAdmin(msg.sender) ||
                core.getCaseReporter(caseId) == msg.sender ||
                assignments[caseId][msg.sender].reviewer == msg.sender,
            "Not authorized"
        );

        _grantConsensusAccess(caseId, msg.sender);
        emit ConfidentialSummaryAuthorized(caseId, msg.sender);
    }

    function publishConsensus(
        uint256 caseId,
        uint32 approvals,
        uint32 rejects,
        uint32 escalations,
        uint8 averageSeverityScore,
        bytes[] calldata signatures
    ) external onlyAdmin {
        require(core.caseExists(caseId), "Invalid case ID");
        require(signatures.length == 4, "Expected 4 signatures");

        CaseConsensus storage consensus = consensuses[caseId];
        require(FHE.isInitialized(consensus.approvals), "Consensus unavailable");
        require(!consensus.published, "Consensus already published");

        uint32 voteCount = uint32(getVoteCount(caseId));
        require(approvals + rejects + escalations == voteCount, "Vote tally mismatch");

        require(FHE.verifyDecryptResult(consensus.approvals, approvals, signatures[0]), "Invalid approvals proof");
        require(FHE.verifyDecryptResult(consensus.rejects, rejects, signatures[1]), "Invalid rejects proof");
        require(FHE.verifyDecryptResult(consensus.escalations, escalations, signatures[2]), "Invalid escalations proof");
        require(
            FHE.verifyDecryptResult(consensus.averageSeverityScore, averageSeverityScore, signatures[3]),
            "Invalid severity proof"
        );

        consensus.published = true;
        core.recordVoteTally(caseId, voteCount, approvals, rejects, escalations, averageSeverityScore);

        LeakProofCore.CaseStatus currentStatus = core.getCaseStatus(caseId);
        LeakProofCore.CaseStatus nextStatus = LeakProofCore.CaseStatus.UnderReview;

        if (escalations > 0) {
            nextStatus = LeakProofCore.CaseStatus.Escalated;
        } else if (approvals >= approvalThreshold[caseId]) {
            nextStatus = LeakProofCore.CaseStatus.Verified;
        } else if (rejects >= approvalThreshold[caseId]) {
            nextStatus = LeakProofCore.CaseStatus.Rejected;
        }

        if (nextStatus != currentStatus) {
            core.updateStatus(caseId, nextStatus);
        }

        emit ConsensusPublished(caseId, approvals, rejects, escalations, averageSeverityScore);
    }

    function _ensureConsensusInitialized(uint256 caseId) internal {
        CaseConsensus storage consensus = consensuses[caseId];
        if (!FHE.isInitialized(consensus.approvals)) {
            consensus.approvals = FHE.asEuint32(0);
            consensus.rejects = FHE.asEuint32(0);
            consensus.escalations = FHE.asEuint32(0);
            consensus.severityTotal = FHE.asEuint32(0);
            consensus.averageSeverityScore = FHE.asEuint8(0);

            FHE.allowThis(consensus.approvals);
            FHE.allowThis(consensus.rejects);
            FHE.allowThis(consensus.escalations);
            FHE.allowThis(consensus.severityTotal);
            FHE.allowThis(consensus.averageSeverityScore);
        }
    }

    function _grantConsensusAccess(uint256 caseId, address viewer) internal {
        CaseConsensus storage consensus = consensuses[caseId];
        if (!FHE.isInitialized(consensus.approvals)) {
            return;
        }

        FHE.allow(consensus.approvals, viewer);
        FHE.allow(consensus.rejects, viewer);
        FHE.allow(consensus.escalations, viewer);
        FHE.allow(consensus.averageSeverityScore, viewer);
    }

    function _normalizeRecommendation(euint8 value) internal returns (euint8) {
        ebool isApprove = FHE.eq(value, APPROVE_CODE);
        ebool isReject = FHE.eq(value, REJECT_CODE);
        return FHE.select(isApprove, APPROVE_CODE, FHE.select(isReject, REJECT_CODE, ESCALATE_CODE));
    }

    function _clampSeverity(euint8 value) internal returns (euint8) {
        ebool belowRange = FHE.lt(value, ONE8);
        ebool aboveRange = FHE.gt(value, FIVE8);
        return FHE.select(belowRange, ONE8, FHE.select(aboveRange, FIVE8, value));
    }

    function _recomputeConsensus(uint256 caseId, address latestReviewer) internal {
        CaseConsensus storage consensus = consensuses[caseId];
        ReviewerAssignment storage assignment = assignments[caseId][latestReviewer];

        euint32 approveIncrement = FHE.select(FHE.eq(assignment.encryptedRecommendation, APPROVE_CODE), ONE32, ZERO32);
        euint32 rejectIncrement = FHE.select(FHE.eq(assignment.encryptedRecommendation, REJECT_CODE), ONE32, ZERO32);
        euint32 escalationIncrement = FHE.select(FHE.eq(assignment.encryptedRecommendation, ESCALATE_CODE), ONE32, ZERO32);

        consensus.approvals = FHE.add(consensus.approvals, approveIncrement);
        consensus.rejects = FHE.add(consensus.rejects, rejectIncrement);
        consensus.escalations = FHE.add(consensus.escalations, escalationIncrement);
        consensus.severityTotal = FHE.add(consensus.severityTotal, FHE.asEuint32(assignment.encryptedSeverityScore));

        FHE.allowThis(consensus.approvals);
        FHE.allowThis(consensus.rejects);
        FHE.allowThis(consensus.escalations);
        FHE.allowThis(consensus.severityTotal);

        uint32 voteCount = uint32(getVoteCount(caseId));
        if (voteCount > 0) {
            consensus.averageSeverityScore = FHE.asEuint8(
                FHE.div(consensus.severityTotal, FHE.asEuint32(voteCount))
            );
            FHE.allowThis(consensus.averageSeverityScore);
        }

        address[] storage reviewers = assignedReviewers[caseId];
        for (uint256 i = 0; i < reviewers.length; i++) {
            _grantConsensusAccess(caseId, reviewers[i]);
        }

        core.recordVoteProgress(caseId, voteCount);

        LeakProofCore.CaseStatus currentStatus = core.getCaseStatus(caseId);
        if (
            currentStatus != LeakProofCore.CaseStatus.UnderReview &&
            currentStatus != LeakProofCore.CaseStatus.Verified &&
            currentStatus != LeakProofCore.CaseStatus.Rejected &&
            currentStatus != LeakProofCore.CaseStatus.Escalated
        ) {
            core.updateStatus(caseId, LeakProofCore.CaseStatus.UnderReview);
        }
    }

    function setApprovalThreshold(uint256 caseId, uint256 threshold) external onlyAdmin {
        require(core.caseExists(caseId), "Invalid case ID");
        require(threshold > 0, "Threshold must be positive");
        approvalThreshold[caseId] = threshold;
    }

    function getVoteCount(uint256 caseId) public view returns (uint256) {
        address[] storage reviewers = assignedReviewers[caseId];
        uint256 count = 0;
        for (uint256 i = 0; i < reviewers.length; i++) {
            if (assignments[caseId][reviewers[i]].hasVoted) {
                count += 1;
            }
        }
        return count;
    }

    function getVoteSummary(uint256 caseId)
        external
        view
        returns (uint256 approvals, uint256 rejects, uint256 escalations, uint256 votes)
    {
        votes = getVoteCount(caseId);

        (
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            approvals,
            rejects,
            escalations,
            
        ) = core.getCase(caseId);
    }

    function getReviewerVoteStates(uint256 caseId)
        external
        view
        returns (address[] memory reviewers, bool[] memory voted)
    {
        address[] storage reviewerList = assignedReviewers[caseId];
        uint256 length = reviewerList.length;

        reviewers = new address[](length);
        voted = new bool[](length);

        for (uint256 i = 0; i < length; i++) {
            ReviewerAssignment storage assignment = assignments[caseId][reviewerList[i]];
            reviewers[i] = assignment.reviewer;
            voted[i] = assignment.hasVoted;
        }
    }

    function getEncryptedVoteSummary(uint256 caseId)
        external
        view
        returns (euint32 approvals, euint32 rejects, euint32 escalations, euint8 averageSeverityScore)
    {
        CaseConsensus storage consensus = consensuses[caseId];
        return (
            consensus.approvals,
            consensus.rejects,
            consensus.escalations,
            consensus.averageSeverityScore
        );
    }

    function getAssignedCases(address reviewer) external view returns (uint256[] memory) {
        return reviewerCases[reviewer];
    }

    function isReviewerAssigned(uint256 caseId, address reviewer) external view returns (bool) {
        return assignments[caseId][reviewer].reviewer == reviewer;
    }
}
