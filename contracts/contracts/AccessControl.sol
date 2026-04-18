// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract LeakProofAccessControl is AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant REVIEWER_ROLE = keccak256("REVIEWER_ROLE");
    bytes32 public constant REPORTER_ROLE = keccak256("REPORTER_ROLE");

    event RoleGranted(address indexed account, bytes32 role, address indexed grantor);
    event RoleRevoked(address indexed account, bytes32 role);

    constructor(address initialAdmin) {
        require(initialAdmin != address(0), "Invalid admin address");
        _grantRole(DEFAULT_ADMIN_ROLE, initialAdmin);
        _grantRole(ADMIN_ROLE, initialAdmin);
    }

    function grantAdminRole(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(account != address(0), "Invalid address");
        _grantRole(ADMIN_ROLE, account);
        emit RoleGranted(account, ADMIN_ROLE, msg.sender);
    }

    function grantReviewerRole(address account) external onlyRole(ADMIN_ROLE) {
        require(account != address(0), "Invalid address");
        _grantRole(REVIEWER_ROLE, account);
        emit RoleGranted(account, REVIEWER_ROLE, msg.sender);
    }

    function grantReporterRole(address account) external onlyRole(ADMIN_ROLE) {
        require(account != address(0), "Invalid address");
        _grantRole(REPORTER_ROLE, account);
        emit RoleGranted(account, REPORTER_ROLE, msg.sender);
    }

    function revokeRole(bytes32 role, address account) public override onlyRole(getRoleAdmin(role)) {
        require(role != DEFAULT_ADMIN_ROLE && role != ADMIN_ROLE, "Cannot revoke admin roles");
        super.revokeRole(role, account);
        emit RoleRevoked(account, role);
    }

    function isAdmin(address account) public view returns (bool) {
        return hasRole(ADMIN_ROLE, account) || hasRole(DEFAULT_ADMIN_ROLE, account);
    }

    function isReviewer(address account) public view returns (bool) {
        return hasRole(REVIEWER_ROLE, account);
    }

    function isReporter(address account) public view returns (bool) {
        return hasRole(REPORTER_ROLE, account);
    }
}