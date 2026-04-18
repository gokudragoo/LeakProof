// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./AccessControl.sol";
import "./LeakProofCore.sol";

contract ReviewerHub {
    LeakProofAccessControl public accessControl;
    LeakProofCore public core;

    struct ReviewerAssignment {
        address reviewer;
        uint256 caseId;
        bool hasVoted;
        bytes encryptedVote;
        bytes encryptedScore;
        bytes encryptedNotes;
        uint256 timestamp;
    }

    mapping(uint256 => mapping(address => ReviewerAssignment)) public assignments;
    mapping(uint256 => address[]) public assignedReviewers;
    mapping(uint256 => uint256) public approvalThreshold;

    event ReviewerAssigned(uint256 indexed caseId, address indexed reviewer, address indexed assigner);
    event VoteSubmitted(uint256 indexed caseId, address indexed reviewer);
    event ConsensusReached(uint256 indexed caseId, uint256 approvals);

    constructor(address _accessControl, address _core) {
        require(_accessControl != address(0) && _core != address(0), "Invalid addresses");
        accessControl = LeakProofAccessControl(_accessControl);
        core = LeakProofCore(_core);
    }

    function assignReviewer(uint256 _caseId, address _reviewer) external {
        require(_reviewer != address(0), "Invalid reviewer address");
        require(accessControl.isAdmin(msg.sender) || accessControl.isAdmin(_reviewer),
            "Must be admin to assign reviewers"
        );

        require(_caseId > 0, "Invalid case ID");

        assignments[_caseId][_reviewer] = ReviewerAssignment({
            reviewer: _reviewer,
            caseId: _caseId,
            hasVoted: false,
            encryptedVote: "",
            encryptedScore: "",
            encryptedNotes: "",
            timestamp: block.timestamp
        });

        assignedReviewers[_caseId].push(_reviewer);

        if (approvalThreshold[_caseId] == 0) {
            approvalThreshold[_caseId] = 2;
        }

        emit ReviewerAssigned(_caseId, _reviewer, msg.sender);
    }

    function submitVote(
        uint256 _caseId,
        bytes memory _encryptedVote,
        bytes memory _encryptedScore,
        bytes memory _encryptedNotes
    ) external {
        require(assignments[_caseId][msg.sender].reviewer == msg.sender, "Not assigned to this case");
        require(!assignments[_caseId][msg.sender].hasVoted, "Already voted");

        assignments[_caseId][msg.sender].hasVoted = true;
        assignments[_caseId][msg.sender].encryptedVote = _encryptedVote;
        assignments[_caseId][msg.sender].encryptedScore = _encryptedScore;
        assignments[_caseId][msg.sender].encryptedNotes = _encryptedNotes;

        emit VoteSubmitted(_caseId, msg.sender);

        uint256 voteCount = getVoteCount(_caseId);
        if (voteCount >= approvalThreshold[_caseId]) {
            checkConsensus(_caseId);
        }
    }

    function getVoteCount(uint256 _caseId) public view returns (uint256) {
        uint256 count = 0;
        address[] storage reviewers = assignedReviewers[_caseId];
        for (uint256 i = 0; i < reviewers.length; i++) {
            if (assignments[_caseId][reviewers[i]].hasVoted) {
                count++;
            }
        }
        return count;
    }

    function getReviewerVotes(uint256 _caseId) external view returns (address[] memory, bool[] memory, bytes[] memory) {
        address[] storage reviewers = assignedReviewers[_caseId];
        uint256 length = reviewers.length;

        address[] memory reviewerAddrs = new address[](length);
        bool[] memory voted = new bool[](length);
        bytes[] memory votes = new bytes[](length);

        for (uint256 i = 0; i < length; i++) {
            reviewerAddrs[i] = reviewers[i];
            voted[i] = assignments[_caseId][reviewers[i]].hasVoted;
            votes[i] = assignments[_caseId][reviewers[i]].encryptedVote;
        }

        return (reviewerAddrs, voted, votes);
    }

    function checkConsensus(uint256 _caseId) internal {
        uint256 approveCount = 0;
        address[] storage reviewers = assignedReviewers[_caseId];

        for (uint256 i = 0; i < reviewers.length; i++) {
            ReviewerAssignment storage assignment = assignments[_caseId][reviewers[i]];
            if (assignment.hasVoted && assignment.encryptedVote.length > 0) {
                approveCount++;
            }
        }

        if (approveCount >= approvalThreshold[_caseId]) {
            emit ConsensusReached(_caseId, approveCount);
            try core.updateStatus(_caseId, LeakProofCore.CaseStatus.Verified) {} catch {}
        }
    }

    function getAssignedCases(address _reviewer) external view returns (uint256[] memory) {
        // This is a simplified view - in production would need indexed storage
        return new uint256[](0);
    }

    function setApprovalThreshold(uint256 _caseId, uint256 _threshold) external {
        require(accessControl.isAdmin(msg.sender), "Must be admin");
        require(_threshold > 0, "Threshold must be positive");
        approvalThreshold[_caseId] = _threshold;
    }
}