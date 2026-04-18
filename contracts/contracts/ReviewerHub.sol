// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

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
        Recommendation recommendation;
        uint8 severityScore;
        string encryptedNotes;
        uint64 assignedAt;
        uint64 votedAt;
    }

    mapping(uint256 => mapping(address => ReviewerAssignment)) public assignments;
    mapping(uint256 => address[]) public assignedReviewers;
    mapping(uint256 => uint256) public approvalThreshold;
    mapping(address => uint256[]) private reviewerCases;

    event ReviewerAssigned(uint256 indexed caseId, address indexed reviewer, address indexed assigner);
    event VoteSubmitted(
        uint256 indexed caseId,
        address indexed reviewer,
        Recommendation recommendation,
        uint8 severityScore
    );
    event ConsensusReached(
        uint256 indexed caseId,
        uint256 approvals,
        uint256 rejects,
        uint256 escalations
    );

    modifier onlyAdmin() {
        require(accessControl.isAdmin(msg.sender), "Admin only");
        _;
    }

    constructor(address accessControlAddress, address coreAddress) {
        require(accessControlAddress != address(0) && coreAddress != address(0), "Invalid addresses");
        accessControl = LeakProofAccessControl(accessControlAddress);
        core = LeakProofCore(coreAddress);
    }

    function assignReviewer(uint256 caseId, address reviewer) external onlyAdmin {
        require(reviewer != address(0), "Invalid reviewer");
        require(accessControl.isReviewer(reviewer), "Reviewer role required");
        require(core.caseExists(caseId), "Invalid case ID");
        require(assignments[caseId][reviewer].reviewer == address(0), "Already assigned");

        assignments[caseId][reviewer] = ReviewerAssignment({
            reviewer: reviewer,
            caseId: caseId,
            hasVoted: false,
            recommendation: Recommendation.None,
            severityScore: 0,
            encryptedNotes: "",
            assignedAt: uint64(block.timestamp),
            votedAt: 0
        });

        assignedReviewers[caseId].push(reviewer);
        reviewerCases[reviewer].push(caseId);

        if (approvalThreshold[caseId] == 0) {
            approvalThreshold[caseId] = 2;
        }

        core.registerReviewerAssignment(caseId, reviewer);

        emit ReviewerAssigned(caseId, reviewer, msg.sender);
    }

    function submitVote(
        uint256 caseId,
        Recommendation recommendation,
        uint8 severityScore,
        string calldata encryptedNotes
    ) external {
        ReviewerAssignment storage assignment = assignments[caseId][msg.sender];

        require(assignment.reviewer == msg.sender, "Not assigned");
        require(!assignment.hasVoted, "Already voted");
        require(recommendation != Recommendation.None, "Recommendation required");
        require(severityScore >= 1 && severityScore <= 5, "Severity out of range");

        assignment.hasVoted = true;
        assignment.recommendation = recommendation;
        assignment.severityScore = severityScore;
        assignment.encryptedNotes = encryptedNotes;
        assignment.votedAt = uint64(block.timestamp);

        emit VoteSubmitted(caseId, msg.sender, recommendation, severityScore);

        _recomputeConsensus(caseId);
    }

    function _recomputeConsensus(uint256 caseId) internal {
        address[] storage reviewers = assignedReviewers[caseId];
        uint32 approvals = 0;
        uint32 rejects = 0;
        uint32 escalations = 0;
        uint32 votes = 0;
        uint32 severityTotal = 0;
        LeakProofCore.CaseStatus currentStatus = core.getCaseStatus(caseId);

        for (uint256 i = 0; i < reviewers.length; i++) {
            ReviewerAssignment storage assignment = assignments[caseId][reviewers[i]];
            if (!assignment.hasVoted) {
                continue;
            }

            votes += 1;
            severityTotal += assignment.severityScore;

            if (assignment.recommendation == Recommendation.Approve) {
                approvals += 1;
            } else if (assignment.recommendation == Recommendation.Reject) {
                rejects += 1;
            } else if (assignment.recommendation == Recommendation.Escalate) {
                escalations += 1;
            }
        }

        uint8 averageSeverity = votes == 0 ? 0 : uint8(severityTotal / votes);
        core.recordVoteTally(caseId, votes, approvals, rejects, escalations, averageSeverity);

        if (escalations > 0) {
            if (currentStatus != LeakProofCore.CaseStatus.Escalated) {
                core.updateStatus(caseId, LeakProofCore.CaseStatus.Escalated);
            }
        } else if (approvals >= approvalThreshold[caseId]) {
            if (currentStatus != LeakProofCore.CaseStatus.Verified) {
                core.updateStatus(caseId, LeakProofCore.CaseStatus.Verified);
            }
            emit ConsensusReached(caseId, approvals, rejects, escalations);
        } else if (rejects >= approvalThreshold[caseId]) {
            if (currentStatus != LeakProofCore.CaseStatus.Rejected) {
                core.updateStatus(caseId, LeakProofCore.CaseStatus.Rejected);
            }
            emit ConsensusReached(caseId, approvals, rejects, escalations);
        } else if (votes > 0) {
            if (currentStatus != LeakProofCore.CaseStatus.UnderReview) {
                core.updateStatus(caseId, LeakProofCore.CaseStatus.UnderReview);
            }
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
        address[] storage reviewers = assignedReviewers[caseId];
        for (uint256 i = 0; i < reviewers.length; i++) {
            ReviewerAssignment storage assignment = assignments[caseId][reviewers[i]];
            if (!assignment.hasVoted) {
                continue;
            }

            votes += 1;
            if (assignment.recommendation == Recommendation.Approve) {
                approvals += 1;
            } else if (assignment.recommendation == Recommendation.Reject) {
                rejects += 1;
            } else if (assignment.recommendation == Recommendation.Escalate) {
                escalations += 1;
            }
        }
    }

    function getReviewerVotes(uint256 caseId)
        external
        view
        returns (
            address[] memory reviewers,
            bool[] memory voted,
            uint8[] memory recommendations,
            uint8[] memory severityScores
        )
    {
        address[] storage reviewerList = assignedReviewers[caseId];
        uint256 length = reviewerList.length;

        reviewers = new address[](length);
        voted = new bool[](length);
        recommendations = new uint8[](length);
        severityScores = new uint8[](length);

        for (uint256 i = 0; i < length; i++) {
            ReviewerAssignment storage assignment = assignments[caseId][reviewerList[i]];
            reviewers[i] = assignment.reviewer;
            voted[i] = assignment.hasVoted;
            recommendations[i] = uint8(assignment.recommendation);
            severityScores[i] = assignment.severityScore;
        }
    }

    function getAssignedCases(address reviewer) external view returns (uint256[] memory) {
        return reviewerCases[reviewer];
    }

    function isReviewerAssigned(uint256 caseId, address reviewer) external view returns (bool) {
        return assignments[caseId][reviewer].reviewer == reviewer;
    }
}
