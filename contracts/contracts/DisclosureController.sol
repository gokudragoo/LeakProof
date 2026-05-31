// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./AccessControl.sol";
import "./LeakProofCore.sol";

contract DisclosureController {
    LeakProofAccessControl public immutable accessControl;
    LeakProofCore public immutable core;
    address public timeLockController;

    enum PermissionLevel {
        None,
        OutcomeOnly,
        SummaryOnly,
        FullReport,
        IdentityReveal
    }

    struct DisclosurePermission {
        address grantee;
        uint256 caseId;
        PermissionLevel level;
        bool revoked;
        uint256 grantedAt;
        uint256 expiresAt;
    }

    struct DisclosureRequest {
        address requester;
        uint256 caseId;
        PermissionLevel requestedLevel;
        bool approved;
        bool resolved;
        uint256 timestamp;
    }

    mapping(uint256 => mapping(address => PermissionLevel)) public casePermissions;
    mapping(uint256 => mapping(address => uint256)) public permissionExpiresAt;
    mapping(uint256 => DisclosurePermission[]) private permissionLog;
    mapping(uint256 => DisclosureRequest[]) private disclosureRequests;
    mapping(uint256 => mapping(address => bool)) private identityRevealed;

    event PermissionGranted(
        uint256 indexed caseId,
        address indexed grantee,
        PermissionLevel level,
        address indexed granter
    );
    event PermissionRevoked(uint256 indexed caseId, address indexed grantee);
    event DisclosureRequested(uint256 indexed caseId, address indexed requester, PermissionLevel level);
    event DisclosureRequestResolved(uint256 indexed caseId, uint256 indexed requestIndex, bool approved);
    event IdentityRevealAuthorized(uint256 indexed caseId, address indexed reporter, address indexed revealer);
    event TimeLockControllerUpdated(address indexed controller);

    modifier onlyAdmin() {
        require(accessControl.isAdmin(msg.sender), "Admin only");
        _;
    }

    modifier onlyTimeLockController() {
        require(msg.sender == timeLockController, "Time-lock only");
        _;
    }

    constructor(address accessControlAddress, address coreAddress) {
        require(accessControlAddress != address(0) && coreAddress != address(0), "Invalid addresses");
        accessControl = LeakProofAccessControl(accessControlAddress);
        core = LeakProofCore(coreAddress);
    }

    function grantDisclosureAccess(
        uint256 caseId,
        address grantee,
        PermissionLevel level
    ) external onlyAdmin {
        _grantDisclosureAccess(caseId, grantee, level, msg.sender);
    }

    function setTimeLockController(address controller) external onlyAdmin {
        require(controller != address(0), "Invalid controller");
        timeLockController = controller;
        emit TimeLockControllerUpdated(controller);
    }

    function grantDisclosureAccessFromTimeLock(
        uint256 caseId,
        address grantee,
        PermissionLevel level
    ) external onlyTimeLockController {
        _grantDisclosureAccess(caseId, grantee, level, msg.sender);
    }

    function _grantDisclosureAccess(
        uint256 caseId,
        address grantee,
        PermissionLevel level,
        address granter
    ) internal {
        require(core.caseExists(caseId), "Invalid case ID");
        require(grantee != address(0), "Invalid grantee");
        require(level != PermissionLevel.None, "Invalid level");

        uint256 expiresAt = block.timestamp + 30 days;
        casePermissions[caseId][grantee] = level;
        permissionExpiresAt[caseId][grantee] = expiresAt;
        permissionLog[caseId].push(
            DisclosurePermission({
                grantee: grantee,
                caseId: caseId,
                level: level,
                revoked: false,
                grantedAt: block.timestamp,
                expiresAt: expiresAt
            })
        );

        emit PermissionGranted(caseId, grantee, level, granter);
    }

    function revokeDisclosureAccess(uint256 caseId, address grantee) external onlyAdmin {
        require(core.caseExists(caseId), "Invalid case ID");
        casePermissions[caseId][grantee] = PermissionLevel.None;
        delete permissionExpiresAt[caseId][grantee];

        DisclosurePermission[] storage permissions = permissionLog[caseId];
        for (uint256 i = permissions.length; i > 0; i--) {
            if (permissions[i - 1].grantee == grantee && !permissions[i - 1].revoked) {
                permissions[i - 1].revoked = true;
                break;
            }
        }

        emit PermissionRevoked(caseId, grantee);
    }

    function requestDisclosure(uint256 caseId, PermissionLevel level) external {
        require(core.caseExists(caseId), "Invalid case ID");
        require(level != PermissionLevel.None, "Invalid level");

        disclosureRequests[caseId].push(
            DisclosureRequest({
                requester: msg.sender,
                caseId: caseId,
                requestedLevel: level,
                approved: false,
                resolved: false,
                timestamp: block.timestamp
            })
        );

        emit DisclosureRequested(caseId, msg.sender, level);
    }

    function resolveDisclosureRequest(uint256 caseId, uint256 requestIndex, bool approved) external onlyAdmin {
        require(core.caseExists(caseId), "Invalid case ID");
        require(requestIndex < disclosureRequests[caseId].length, "Invalid request");

        DisclosureRequest storage requestItem = disclosureRequests[caseId][requestIndex];
        require(!requestItem.resolved, "Already resolved");

        requestItem.resolved = true;
        requestItem.approved = approved;

        if (approved) {
            uint256 expiresAt = block.timestamp + 30 days;
            casePermissions[caseId][requestItem.requester] = requestItem.requestedLevel;
            permissionExpiresAt[caseId][requestItem.requester] = expiresAt;
            permissionLog[caseId].push(
                DisclosurePermission({
                    grantee: requestItem.requester,
                    caseId: caseId,
                    level: requestItem.requestedLevel,
                    revoked: false,
                    grantedAt: block.timestamp,
                    expiresAt: expiresAt
                })
            );
        }

        emit DisclosureRequestResolved(caseId, requestIndex, approved);
    }

    function revealIdentity(uint256 caseId, address reporter) external {
        require(core.caseExists(caseId), "Invalid case ID");
        require(reporter == core.getCaseReporter(caseId), "Reporter mismatch");
        require(
            accessControl.isAdmin(msg.sender) || _activePermissionLevel(caseId, msg.sender) == PermissionLevel.IdentityReveal,
            "Not authorized"
        );

        identityRevealed[caseId][reporter] = true;
        emit IdentityRevealAuthorized(caseId, reporter, msg.sender);
    }

    function getPermissionLevel(uint256 caseId, address grantee) external view returns (PermissionLevel) {
        return _activePermissionLevel(caseId, grantee);
    }

    function getDisclosureLog(uint256 caseId) external view returns (DisclosurePermission[] memory) {
        return permissionLog[caseId];
    }

    function getDisclosureRequests(uint256 caseId) external view returns (DisclosureRequest[] memory) {
        return disclosureRequests[caseId];
    }

    function hasIdentityRevealed(uint256 caseId, address reporter) external view returns (bool) {
        return identityRevealed[caseId][reporter];
    }

    function canAccessCase(address user, uint256 caseId) external view returns (bool, PermissionLevel) {
        if (!core.caseExists(caseId)) {
            return (false, PermissionLevel.None);
        }

        if (accessControl.isAdmin(user)) {
            return (true, PermissionLevel.FullReport);
        }

        if (core.getCaseReporter(caseId) == user) {
            return (true, PermissionLevel.FullReport);
        }

        PermissionLevel level = _activePermissionLevel(caseId, user);
        return (level != PermissionLevel.None, level);
    }

    function _activePermissionLevel(uint256 caseId, address grantee) internal view returns (PermissionLevel) {
        PermissionLevel level = casePermissions[caseId][grantee];
        if (level == PermissionLevel.None) {
            return PermissionLevel.None;
        }

        uint256 expiresAt = permissionExpiresAt[caseId][grantee];
        if (expiresAt == 0 || expiresAt < block.timestamp) {
            return PermissionLevel.None;
        }

        return level;
    }
}
