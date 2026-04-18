// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./AccessControl.sol";

contract LeakProofCore {
    LeakProofAccessControl public accessControl;

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
        bytes encryptedTitle;
        bytes encryptedDescription;
        uint8 encryptedSeverity;
        uint8 category;
        bytes32 evidenceCID;
        address reporter;
        CaseStatus status;
        uint256 createdAt;
        uint256 updatedAt;
        uint256 reviewerCount;
        uint256 approvalCount;
    }

    uint256 public caseCount;
    mapping(uint256 => Case) public cases;
    mapping(uint256 => address[]) public caseReviewers;

    event CaseCreated(
        uint256 indexed caseId,
        address indexed reporter,
        CaseStatus status,
        uint256 timestamp
    );

    event StatusUpdated(
        uint256 indexed caseId,
        CaseStatus oldStatus,
        CaseStatus newStatus,
        address indexed updater
    );

    constructor(address _accessControl) {
        require(_accessControl != address(0), "Invalid access control address");
        accessControl = LeakProofAccessControl(_accessControl);
    }

    function createCase(
        bytes memory _encryptedTitle,
        bytes memory _encryptedDescription,
        uint8 _encryptedSeverity,
        uint8 _category,
        bytes32 _evidenceCID
    ) external returns (uint256) {
        require(_encryptedTitle.length > 0, "Title required");
        require(_encryptedDescription.length > 0, "Description required");
        require(_category < 7, "Invalid category");

        caseCount++;
        uint256 newCaseId = caseCount;

        Case storage newCase = cases[newCaseId];
        newCase.encryptedTitle = _encryptedTitle;
        newCase.encryptedDescription = _encryptedDescription;
        newCase.encryptedSeverity = _encryptedSeverity;
        newCase.category = _category;
        newCase.evidenceCID = _evidenceCID;
        newCase.reporter = msg.sender;
        newCase.status = CaseStatus.Submitted;
        newCase.createdAt = block.timestamp;
        newCase.updatedAt = block.timestamp;

        emit CaseCreated(newCaseId, msg.sender, CaseStatus.Submitted, block.timestamp);
        return newCaseId;
    }

    function updateStatus(uint256 _caseId, CaseStatus _newStatus) external {
        require(_caseId > 0 && _caseId <= caseCount, "Invalid case ID");
        Case storage caseItem = cases[_caseId];
        CaseStatus oldStatus = caseItem.status;

        require(
            accessControl.isAdmin(msg.sender) ||
            accessControl.isReviewer(msg.sender) ||
            caseItem.reporter == msg.sender,
            "Not authorized to update status"
        );

        require(_newStatus > oldStatus || _newStatus == CaseStatus.Escalated || _newStatus == CaseStatus.Closed,
            "Cannot revert status"
        );

        caseItem.status = _newStatus;
        caseItem.updatedAt = block.timestamp;

        emit StatusUpdated(_caseId, oldStatus, _newStatus, msg.sender);
    }

    function getCase(uint256 _caseId) external view returns (
        bytes memory,
        bytes memory,
        uint8,
        uint8,
        bytes32,
        address,
        uint256,
        uint256,
        CaseStatus
    ) {
        require(_caseId > 0 && _caseId <= caseCount, "Invalid case ID");
        Case storage c = cases[_caseId];
        return (
            c.encryptedTitle,
            c.encryptedDescription,
            c.encryptedSeverity,
            c.category,
            c.evidenceCID,
            c.reporter,
            c.createdAt,
            c.updatedAt,
            c.status
        );
    }

    function getCaseReviewers(uint256 _caseId) external view returns (address[] memory) {
        require(_caseId > 0 && _caseId <= caseCount, "Invalid case ID");
        return caseReviewers[_caseId];
    }

    function setCaseApprovalCount(uint256 _caseId, uint256 _count) external {
        require(_caseId > 0 && _caseId <= caseCount, "Invalid case ID");
        require(accessControl.isReviewer(msg.sender), "Must be reviewer");
        cases[_caseId].approvalCount = _count;
    }

    function getCaseStatus(uint256 _caseId) external view returns (CaseStatus) {
        require(_caseId > 0 && _caseId <= caseCount, "Invalid case ID");
        return cases[_caseId].status;
    }

    function getCasesByStatus(CaseStatus _status) external view returns (uint256[] memory) {
        uint256 count = 0;
        for (uint256 i = 1; i <= caseCount; i++) {
            if (cases[i].status == _status) count++;
        }

        uint256[] memory result = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 1; i <= caseCount; i++) {
            if (cases[i].status == _status) {
                result[index++] = i;
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
}