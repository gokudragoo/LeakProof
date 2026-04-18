// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./AccessControl.sol";

contract LeakProofCore {
    LeakProofAccessControl public immutable accessControl;
    address public reviewerHub;

    enum CaseStatus {
        Submitted,
        UnderReview,
        NeedsEvidence,
        Escalated,
        Verified,
        Closed,
        Rejected
    }

    enum CaseCategory {
        Fraud,
        Harassment,
        Corruption,
        PolicyViolation,
        FinancialMisconduct,
        ComplianceBreach,
        Other
    }

    struct Case {
        string reportCid;
        bytes32 reportDigest;
        uint8 category;
        string evidenceCid;
        bytes32 evidenceDigest;
        address reporter;
        CaseStatus status;
        uint64 createdAt;
        uint64 updatedAt;
        uint32 reviewerCount;
        uint32 voteCount;
        uint32 approvalCount;
        uint32 rejectCount;
        uint32 escalationCount;
        uint8 averageSeverityScore;
        bool exists;
    }

    uint256 public caseCount;
    mapping(uint256 => Case) private cases;
    mapping(uint256 => address[]) private caseReviewers;
    mapping(uint256 => mapping(address => bool)) public reviewerAssigned;
    mapping(address => uint256[]) private reporterCases;

    event ReviewerHubUpdated(address indexed reviewerHub);
    event CaseCreated(
        uint256 indexed caseId,
        address indexed reporter,
        uint8 indexed category,
        string reportCid,
        string evidenceCid,
        uint256 timestamp
    );
    event ReviewerRegistered(uint256 indexed caseId, address indexed reviewer);
    event VoteTallied(
        uint256 indexed caseId,
        uint256 voteCount,
        uint256 approvalCount,
        uint256 rejectCount,
        uint256 escalationCount,
        uint8 averageSeverityScore
    );
    event StatusUpdated(
        uint256 indexed caseId,
        CaseStatus oldStatus,
        CaseStatus newStatus,
        address indexed updater
    );

    modifier onlyAdmin() {
        require(accessControl.isAdmin(msg.sender), "Admin only");
        _;
    }

    modifier onlyReviewerHub() {
        require(msg.sender == reviewerHub, "Reviewer hub only");
        _;
    }

    modifier caseMustExist(uint256 caseId) {
        require(cases[caseId].exists, "Invalid case ID");
        _;
    }

    constructor(address accessControlAddress) {
        require(accessControlAddress != address(0), "Invalid access control");
        accessControl = LeakProofAccessControl(accessControlAddress);
    }

    function setReviewerHub(address reviewerHubAddress) external onlyAdmin {
        require(reviewerHubAddress != address(0), "Invalid reviewer hub");
        reviewerHub = reviewerHubAddress;
        emit ReviewerHubUpdated(reviewerHubAddress);
    }

    function createCase(
        string calldata reportCid,
        bytes32 reportDigest,
        uint8 category,
        string calldata evidenceCid,
        bytes32 evidenceDigest
    ) external returns (uint256) {
        require(bytes(reportCid).length > 0, "Report CID required");
        require(category <= uint8(CaseCategory.Other), "Invalid category");

        caseCount += 1;
        uint256 newCaseId = caseCount;

        cases[newCaseId] = Case({
            reportCid: reportCid,
            reportDigest: reportDigest,
            category: category,
            evidenceCid: evidenceCid,
            evidenceDigest: evidenceDigest,
            reporter: msg.sender,
            status: CaseStatus.Submitted,
            createdAt: uint64(block.timestamp),
            updatedAt: uint64(block.timestamp),
            reviewerCount: 0,
            voteCount: 0,
            approvalCount: 0,
            rejectCount: 0,
            escalationCount: 0,
            averageSeverityScore: 0,
            exists: true
        });

        reporterCases[msg.sender].push(newCaseId);

        emit CaseCreated(newCaseId, msg.sender, category, reportCid, evidenceCid, block.timestamp);
        return newCaseId;
    }

    function registerReviewerAssignment(uint256 caseId, address reviewer)
        external
        onlyReviewerHub
        caseMustExist(caseId)
    {
        require(reviewer != address(0), "Invalid reviewer");
        require(!reviewerAssigned[caseId][reviewer], "Reviewer already assigned");

        reviewerAssigned[caseId][reviewer] = true;
        caseReviewers[caseId].push(reviewer);
        cases[caseId].reviewerCount += 1;
        cases[caseId].updatedAt = uint64(block.timestamp);

        if (cases[caseId].status == CaseStatus.Submitted) {
            _setStatus(caseId, CaseStatus.UnderReview, msg.sender);
        }

        emit ReviewerRegistered(caseId, reviewer);
    }

    function recordVoteTally(
        uint256 caseId,
        uint32 voteCount,
        uint32 approvalCount,
        uint32 rejectCount,
        uint32 escalationCount,
        uint8 averageSeverityScore
    ) external onlyReviewerHub caseMustExist(caseId) {
        Case storage caseItem = cases[caseId];
        caseItem.voteCount = voteCount;
        caseItem.approvalCount = approvalCount;
        caseItem.rejectCount = rejectCount;
        caseItem.escalationCount = escalationCount;
        caseItem.averageSeverityScore = averageSeverityScore;
        caseItem.updatedAt = uint64(block.timestamp);

        emit VoteTallied(caseId, voteCount, approvalCount, rejectCount, escalationCount, averageSeverityScore);
    }

    function updateStatus(uint256 caseId, CaseStatus newStatus) external caseMustExist(caseId) {
        Case storage caseItem = cases[caseId];

        bool canCloseAsReporter =
            msg.sender == caseItem.reporter &&
            newStatus == CaseStatus.Closed &&
            (
                caseItem.status == CaseStatus.Verified ||
                caseItem.status == CaseStatus.Rejected ||
                caseItem.status == CaseStatus.Escalated
            );

        require(
            accessControl.isAdmin(msg.sender) || msg.sender == reviewerHub || canCloseAsReporter,
            "Not authorized"
        );

        _setStatus(caseId, newStatus, msg.sender);
    }

    function _setStatus(uint256 caseId, CaseStatus newStatus, address updater) internal {
        Case storage caseItem = cases[caseId];
        CaseStatus oldStatus = caseItem.status;
        require(oldStatus != newStatus, "Status unchanged");

        if (newStatus == CaseStatus.Closed) {
            require(
                oldStatus == CaseStatus.Verified ||
                    oldStatus == CaseStatus.Rejected ||
                    oldStatus == CaseStatus.Escalated,
                "Cannot close yet"
            );
        }

        caseItem.status = newStatus;
        caseItem.updatedAt = uint64(block.timestamp);

        emit StatusUpdated(caseId, oldStatus, newStatus, updater);
    }

    function getCase(uint256 caseId)
        external
        view
        caseMustExist(caseId)
        returns (
            string memory reportCid,
            bytes32 reportDigest,
            uint8 category,
            string memory evidenceCid,
            bytes32 evidenceDigest,
            address reporter,
            uint256 createdAt,
            uint256 updatedAt,
            CaseStatus status,
            uint256 reviewerCount,
            uint256 voteCount,
            uint256 approvalCount,
            uint256 rejectCount,
            uint256 escalationCount,
            uint8 averageSeverityScore
        )
    {
        Case storage caseItem = cases[caseId];
        return (
            caseItem.reportCid,
            caseItem.reportDigest,
            caseItem.category,
            caseItem.evidenceCid,
            caseItem.evidenceDigest,
            caseItem.reporter,
            caseItem.createdAt,
            caseItem.updatedAt,
            caseItem.status,
            caseItem.reviewerCount,
            caseItem.voteCount,
            caseItem.approvalCount,
            caseItem.rejectCount,
            caseItem.escalationCount,
            caseItem.averageSeverityScore
        );
    }

    function getCaseStatus(uint256 caseId) external view caseMustExist(caseId) returns (CaseStatus) {
        return cases[caseId].status;
    }

    function getCaseReporter(uint256 caseId) external view caseMustExist(caseId) returns (address) {
        return cases[caseId].reporter;
    }

    function getCaseReviewers(uint256 caseId)
        external
        view
        caseMustExist(caseId)
        returns (address[] memory)
    {
        return caseReviewers[caseId];
    }

    function getCasesByReporter(address reporter) external view returns (uint256[] memory) {
        return reporterCases[reporter];
    }

    function getCasesByStatus(CaseStatus status) external view returns (uint256[] memory) {
        uint256 count = 0;
        for (uint256 i = 1; i <= caseCount; i++) {
            if (cases[i].exists && cases[i].status == status) {
                count += 1;
            }
        }

        uint256[] memory result = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 1; i <= caseCount; i++) {
            if (cases[i].exists && cases[i].status == status) {
                result[index] = i;
                index += 1;
            }
        }
        return result;
    }

    function getAllCases() external view returns (uint256[] memory) {
        uint256[] memory result = new uint256[](caseCount);
        for (uint256 i = 1; i <= caseCount; i++) {
            result[i - 1] = i;
        }
        return result;
    }

    function caseExists(uint256 caseId) external view returns (bool) {
        return cases[caseId].exists;
    }
}
