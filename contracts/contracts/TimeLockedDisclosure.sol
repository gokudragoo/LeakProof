// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./AccessControl.sol";
import "./LeakProofCore.sol";

enum DisclosureControllerPermissionLevel {
    None,
    OutcomeOnly,
    SummaryOnly,
    FullReport,
    IdentityReveal
}

interface IDisclosureController {
    function grantDisclosureAccessFromTimeLock(uint256 caseId, address grantee, DisclosureControllerPermissionLevel level) external;
}

contract TimeLockedDisclosure is AccessControl {
    LeakProofAccessControl public immutable accessControl;
    LeakProofCore public immutable core;
    IDisclosureController public immutable disclosureController;

    struct DisclosureLock {
        uint256 caseId;
        uint64 unlockTimestamp;
        bool emergencyUnlock;
        bool revoked;
        uint8 requiredApprovals;
        uint8 currentApprovals;
        uint256 createdAt;
        string disclosureType;
        address grantee;
        uint8 permissionLevel;
    }

    struct ApprovalRecord {
        address approver;
        uint64 approvedAt;
        bool recorded;
    }

    struct EmergencyOverride {
        address initiator;
        string reason;
        uint64 initiatedAt;
        bool executed;
        bool cancelled;
    }

    uint256 public constant DEFAULT_LOCK_DURATION = 7 days;
    uint256 public constant MIN_LOCK_DURATION = 1 days;
    uint256 public constant MAX_LOCK_DURATION = 90 days;
    uint256 public constant EMERGENCY_COOLDOWN = 24 hours;

    mapping(uint256 => DisclosureLock) public disclosureLocks;
    mapping(uint256 => address[]) public lockApprovals;
    mapping(uint256 => mapping(address => ApprovalRecord)) public approvalRecords;
    mapping(uint256 => EmergencyOverride) public emergencyOverrides;

    mapping(address => uint256) public lastEmergencyRequest;
    mapping(address => uint256) public emergencyRequestCount;

    bool public emergencyPauseActive;
    uint64 public emergencyPauseInitiatedAt;
    address public emergencyPauser;

    event DisclosureLockCreated(uint256 indexed caseId, uint256 unlockTimestamp, uint8 requiredApprovals, string disclosureType);
    event DisclosureLockApproved(uint256 indexed caseId, address indexed approver, uint8 currentApprovals);
    event DisclosureLockUnlocked(uint256 indexed caseId, address indexed unlocker);
    event DisclosureLockRevoked(uint256 indexed caseId, address indexed revoker);
    event EmergencyOverrideInitiated(uint256 indexed caseId, address indexed initiator, string reason);
    event EmergencyOverrideExecuted(uint256 indexed caseId, address indexed executor);
    event EmergencyOverrideCancelled(uint256 indexed caseId, address indexed canceller);
    event EmergencyPauseActivated(address indexed pauser, uint64 timestamp);
    event EmergencyPauseDeactivated(address indexed deactivator);
    event LockDurationUpdated(uint256 indexed caseId, uint256 newUnlockTimestamp);

    modifier onlyAdmin() {
        require(accessControl.isAdmin(msg.sender), "Admin only");
        _;
    }

    modifier whenNotPaused() {
        require(!emergencyPauseActive, "Emergency pause active");
        _;
    }

    constructor(address accessControlAddress, address coreAddress, address disclosureControllerAddress) {
        require(
            accessControlAddress != address(0) &&
                coreAddress != address(0) &&
                disclosureControllerAddress != address(0),
            "Invalid addresses"
        );
        accessControl = LeakProofAccessControl(accessControlAddress);
        core = LeakProofCore(coreAddress);
        disclosureController = IDisclosureController(disclosureControllerAddress);
    }

    function createDisclosureLock(
        uint256 caseId,
        uint256 lockDuration,
        uint8 requiredApprovals,
        string calldata disclosureType
    ) external onlyAdmin whenNotPaused returns (uint256 unlockTimestamp) {
        return _createDisclosureLock(caseId, lockDuration, requiredApprovals, disclosureType, address(0), 0);
    }

    function createDisclosureLockForAccess(
        uint256 caseId,
        uint256 lockDuration,
        uint8 requiredApprovals,
        string calldata disclosureType,
        address grantee,
        uint8 permissionLevel
    ) external onlyAdmin whenNotPaused returns (uint256 unlockTimestamp) {
        require(grantee != address(0), "Invalid grantee");
        require(permissionLevel > 0 && permissionLevel <= 4, "Invalid permission");
        return _createDisclosureLock(caseId, lockDuration, requiredApprovals, disclosureType, grantee, permissionLevel);
    }

    function _createDisclosureLock(
        uint256 caseId,
        uint256 lockDuration,
        uint8 requiredApprovals,
        string calldata disclosureType,
        address grantee,
        uint8 permissionLevel
    ) internal returns (uint256 unlockTimestamp) {
        require(core.caseExists(caseId), "Invalid case ID");
        require(disclosureLocks[caseId].createdAt == 0, "Lock already exists");

        if (lockDuration == 0) {
            lockDuration = DEFAULT_LOCK_DURATION;
        }
        require(lockDuration >= MIN_LOCK_DURATION && lockDuration <= MAX_LOCK_DURATION, "Invalid duration");

        uint256 unlock = block.timestamp + lockDuration;

        disclosureLocks[caseId] = DisclosureLock({
            caseId: caseId,
            unlockTimestamp: uint64(unlock),
            emergencyUnlock: false,
            revoked: false,
            requiredApprovals: requiredApprovals,
            currentApprovals: 0,
            createdAt: block.timestamp,
            disclosureType: disclosureType,
            grantee: grantee,
            permissionLevel: permissionLevel
        });

        emit DisclosureLockCreated(caseId, unlock, requiredApprovals, disclosureType);
        return unlock;
    }

    function approveDisclosureUnlock(uint256 caseId) external onlyAdmin whenNotPaused {
        DisclosureLock storage lock = disclosureLocks[caseId];
        require(lock.createdAt != 0, "Lock not found");
        require(!lock.revoked, "Lock revoked");
        require(!lock.emergencyUnlock, "Already emergency unlocked");

        ApprovalRecord storage record = approvalRecords[caseId][msg.sender];
        require(!record.recorded, "Already approved");

        record.approver = msg.sender;
        record.approvedAt = uint64(block.timestamp);
        record.recorded = true;
        lockApprovals[caseId].push(msg.sender);
        lock.currentApprovals += 1;

        emit DisclosureLockApproved(caseId, msg.sender, lock.currentApprovals);

        if (block.timestamp >= lock.unlockTimestamp && _approvalsSatisfied(lock)) {
            _executeUnlock(caseId);
        }
    }

    function unlockIfTimeElapsed(uint256 caseId) external whenNotPaused {
        DisclosureLock storage lock = disclosureLocks[caseId];
        require(lock.createdAt != 0, "Lock not found");
        require(!lock.revoked, "Lock revoked");
        require(!lock.emergencyUnlock, "Already unlocked");

        require(block.timestamp >= lock.unlockTimestamp, "Lock period active");
        require(_approvalsSatisfied(lock), "Approvals pending");

        _executeUnlock(caseId);
    }

    function _approvalsSatisfied(DisclosureLock storage lock) internal view returns (bool) {
        return lock.requiredApprovals == 0 || lock.currentApprovals >= lock.requiredApprovals;
    }

    function _executeUnlock(uint256 caseId) internal {
        DisclosureLock storage lock = disclosureLocks[caseId];
        lock.emergencyUnlock = true;
        if (lock.grantee != address(0) && lock.permissionLevel > 0) {
            disclosureController.grantDisclosureAccessFromTimeLock(
                caseId,
                lock.grantee,
                DisclosureControllerPermissionLevel(lock.permissionLevel)
            );
        }
        emit DisclosureLockUnlocked(caseId, msg.sender);
    }

    function revokeDisclosureLock(uint256 caseId) external onlyAdmin {
        DisclosureLock storage lock = disclosureLocks[caseId];
        require(lock.createdAt != 0, "Lock not found");
        require(!lock.emergencyUnlock, "Already unlocked");
        lock.revoked = true;
        emit DisclosureLockRevoked(caseId, msg.sender);
    }

    function updateLockDuration(uint256 caseId, uint256 newDuration) external onlyAdmin {
        require(newDuration >= MIN_LOCK_DURATION && newDuration <= MAX_LOCK_DURATION, "Invalid duration");
        DisclosureLock storage lock = disclosureLocks[caseId];
        require(lock.createdAt != 0, "Lock not found");
        require(!lock.emergencyUnlock && !lock.revoked, "Lock already resolved");

        uint256 newTimestamp = lock.createdAt + newDuration;
        lock.unlockTimestamp = uint64(newTimestamp);
        emit LockDurationUpdated(caseId, newTimestamp);
    }

    function initiateEmergencyOverride(uint256 caseId, string calldata reason) external onlyAdmin whenNotPaused {
        require(core.caseExists(caseId), "Invalid case ID");
        require(bytes(reason).length > 0, "Reason required");
        require(
            lastEmergencyRequest[msg.sender] + EMERGENCY_COOLDOWN <= block.timestamp ||
            emergencyRequestCount[msg.sender] < 3,
            "Emergency rate limited"
        );

        lastEmergencyRequest[msg.sender] = block.timestamp;
        emergencyRequestCount[msg.sender] += 1;

        emergencyOverrides[caseId] = EmergencyOverride({
            initiator: msg.sender,
            reason: reason,
            initiatedAt: uint64(block.timestamp),
            executed: false,
            cancelled: false
        });

        emit EmergencyOverrideInitiated(caseId, msg.sender, reason);
    }

    function executeEmergencyOverride(uint256 caseId) external onlyAdmin whenNotPaused {
        require(core.caseExists(caseId), "Invalid case ID");
        EmergencyOverride storage emergency = emergencyOverrides[caseId];
        require(emergency.initiatedAt != 0, "No emergency pending");
        require(!emergency.executed, "Already executed");
        require(!emergency.cancelled, "Cancelled");
        require(
            emergency.initiatedAt + EMERGENCY_COOLDOWN <= block.timestamp,
            "Cooling period active"
        );

        DisclosureLock storage lock = disclosureLocks[caseId];
        if (lock.createdAt != 0 && !lock.emergencyUnlock && !lock.revoked) {
            _executeUnlock(caseId);
        }

        emergency.executed = true;
        emit EmergencyOverrideExecuted(caseId, msg.sender);
    }

    function cancelEmergencyOverride(uint256 caseId) external onlyAdmin {
        EmergencyOverride storage emergency = emergencyOverrides[caseId];
        require(emergency.initiatedAt != 0, "No emergency pending");
        require(!emergency.executed, "Cannot cancel executed override");
        emergency.cancelled = true;
        emit EmergencyOverrideCancelled(caseId, msg.sender);
    }

    function activateEmergencyPause() external onlyAdmin {
        require(!emergencyPauseActive, "Already paused");
        emergencyPauseActive = true;
        emergencyPauseInitiatedAt = uint64(block.timestamp);
        emergencyPauser = msg.sender;
        emit EmergencyPauseActivated(msg.sender, emergencyPauseInitiatedAt);
    }

    function deactivateEmergencyPause() external onlyAdmin {
        require(emergencyPauseActive, "Not paused");
        emergencyPauseActive = false;
        emit EmergencyPauseDeactivated(msg.sender);
    }

    function getDisclosureLockInfo(uint256 caseId) external view returns (
        uint256 unlockTimestamp,
        bool emergencyUnlock,
        bool revoked,
        uint8 requiredApprovals,
        uint8 currentApprovals,
        uint256 timeRemaining,
        bool canEmergencyUnlock
    ) {
        DisclosureLock storage lock = disclosureLocks[caseId];
        uint256 remaining = lock.unlockTimestamp > block.timestamp
            ? lock.unlockTimestamp - block.timestamp
            : 0;

        bool canUnlock = lock.createdAt != 0 &&
            !lock.revoked &&
            (lock.emergencyUnlock || (remaining == 0 && _approvalsSatisfied(lock)));

        return (
            lock.unlockTimestamp,
            lock.emergencyUnlock,
            lock.revoked,
            lock.requiredApprovals,
            lock.currentApprovals,
            remaining,
            canUnlock
        );
    }

    function getEmergencyOverrideInfo(uint256 caseId) external view returns (
        address initiator,
        string memory reason,
        uint64 initiatedAt,
        bool executed,
        bool cancelled,
        bool canExecute
    ) {
        EmergencyOverride storage emergency = emergencyOverrides[caseId];
        return (
            emergency.initiator,
            emergency.reason,
            emergency.initiatedAt,
            emergency.executed,
            emergency.cancelled,
            emergency.initiatedAt != 0 &&
            !emergency.executed && !emergency.cancelled &&
            emergency.initiatedAt + EMERGENCY_COOLDOWN <= block.timestamp
        );
    }

    function getApprovalAddresses(uint256 caseId) external view returns (address[] memory) {
        return lockApprovals[caseId];
    }

    function hasApproved(uint256 caseId, address approver) external view returns (bool) {
        return approvalRecords[caseId][approver].recorded;
    }
}
