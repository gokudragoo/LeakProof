// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./AccessControl.sol";
import "./LeakProofCore.sol";

contract DisclosureController {
    LeakProofAccessControl public accessControl;
    LeakProofCore public core;

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
        bool used;
        uint256 grantedAt;
        uint256 expiresAt;
    }

    struct DisclosureRequest {
        address requester;
        uint256 caseId;
        PermissionLevel requestedLevel;
        bool approved;
        uint256 timestamp;
    }

    mapping(uint256 => mapping(address => PermissionLevel)) public casePermissions;
    mapping(uint256 => DisclosurePermission[]) public disclosureLog;
    mapping(uint256 => mapping(address => bool)) public identityRevealed;

    event PermissionGranted(
        uint256 indexed caseId,
        address indexed grantee,
        PermissionLevel level,
        address indexed granter
    );
    event PermissionRevoked(uint256 indexed caseId, address indexed grantee);
    event DisclosureRequested(
        uint256 indexed caseId,
        address indexed requester,
        PermissionLevel level
    );

    constructor(address _accessControl, address _core) {
        require(_accessControl != address(0) && _core != address(0), "Invalid addresses");
        accessControl = LeakProofAccessControl(_accessControl);
        core = LeakProofCore(_core);
    }

    function grantDisclosureAccess(
        uint256 _caseId,
        address _grantee,
        PermissionLevel _level
    ) external {
        require(_grantee != address(0), "Invalid grantee");
        require(uint8(_level) > 0 && uint8(_level) <= 4, "Invalid permission level");
        require(accessControl.isAdmin(msg.sender), "Must be admin");

        casePermissions[_caseId][_grantee] = _level;

        disclosureLog[_caseId].push(DisclosurePermission({
            grantee: _grantee,
            caseId: _caseId,
            level: _level,
            used: false,
            grantedAt: block.timestamp,
            expiresAt: block.timestamp + 30 days
        }));

        emit PermissionGranted(_caseId, _grantee, _level, msg.sender);
    }

    function revokeDisclosureAccess(uint256 _caseId, address _grantee) external {
        require(accessControl.isAdmin(msg.sender), "Must be admin");
        casePermissions[_caseId][_grantee] = PermissionLevel.None;
        emit PermissionRevoked(_caseId, _grantee);
    }

    function requestDisclosure(uint256 _caseId, PermissionLevel _level) external {
        require(uint8(_level) > 0, "Invalid permission level");

        DisclosureRequest memory request = DisclosureRequest({
            requester: msg.sender,
            caseId: _caseId,
            requestedLevel: _level,
            approved: false,
            timestamp: block.timestamp
        });

        emit DisclosureRequested(_caseId, msg.sender, _level);
    }

    function getPermissionLevel(uint256 _caseId, address _grantee) external view returns (PermissionLevel) {
        return casePermissions[_caseId][_grantee];
    }

    function getDisclosureLog(uint256 _caseId) external view returns (DisclosurePermission[] memory) {
        return disclosureLog[_caseId];
    }

    function revealIdentity(uint256 _caseId, address _reporter) external {
        require(
            casePermissions[_caseId][msg.sender] >= PermissionLevel.IdentityReveal ||
            accessControl.isAdmin(msg.sender),
            "Not authorized for identity reveal"
        );

        identityRevealed[_caseId][_reporter] = true;
    }

    function hasIdentityRevealed(uint256 _caseId, address _reporter) external view returns (bool) {
        return identityRevealed[_caseId][_reporter];
    }

    function canAccessCase(address _user, uint256 _caseId) external view returns (bool, PermissionLevel) {
        if (accessControl.isAdmin(_user)) {
            return (true, PermissionLevel.FullReport);
        }

        PermissionLevel level = casePermissions[_caseId][_user];
        return (uint8(level) > 0, level);
    }
}