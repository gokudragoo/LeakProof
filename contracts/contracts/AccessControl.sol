// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract LeakProofAccessControl is AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant REVIEWER_ROLE = keccak256("REVIEWER_ROLE");
    bytes32 public constant REPORTER_ROLE = keccak256("REPORTER_ROLE");

    event LeakProofRoleGranted(address indexed account, bytes32 indexed role, address indexed grantor);
    event LeakProofRoleRevoked(address indexed account, bytes32 indexed role);
    event DefaultAdminTransferred(address indexed previousAdmin, address indexed newAdmin);
    event ReviewerRoleRecovered(address indexed compromisedReviewer, address indexed replacementReviewer, address indexed admin);

    constructor(address initialAdmin) {
        require(initialAdmin != address(0), "Invalid admin address");
        _grantRole(DEFAULT_ADMIN_ROLE, initialAdmin);
        _grantRole(ADMIN_ROLE, initialAdmin);
    }

    function grantAdminRole(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(account != address(0), "Invalid address");
        _grantRole(DEFAULT_ADMIN_ROLE, account);
        _grantRole(ADMIN_ROLE, account);
        emit LeakProofRoleGranted(account, ADMIN_ROLE, msg.sender);
    }

    function transferDefaultAdmin(address newAdmin) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newAdmin != address(0), "Invalid address");
        _grantRole(DEFAULT_ADMIN_ROLE, newAdmin);
        _grantRole(ADMIN_ROLE, newAdmin);
        emit DefaultAdminTransferred(msg.sender, newAdmin);
    }

    function rotateDefaultAdmin(address newAdmin, address previousAdmin) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newAdmin != address(0) && previousAdmin != address(0), "Invalid address");
        require(newAdmin != previousAdmin, "Admin unchanged");

        _grantRole(DEFAULT_ADMIN_ROLE, newAdmin);
        _grantRole(ADMIN_ROLE, newAdmin);
        _revokeRole(DEFAULT_ADMIN_ROLE, previousAdmin);
        _revokeRole(ADMIN_ROLE, previousAdmin);

        emit DefaultAdminTransferred(previousAdmin, newAdmin);
        emit LeakProofRoleGranted(newAdmin, ADMIN_ROLE, msg.sender);
        emit LeakProofRoleRevoked(previousAdmin, DEFAULT_ADMIN_ROLE);
        emit LeakProofRoleRevoked(previousAdmin, ADMIN_ROLE);
    }

    function revokeDefaultAdminRole(address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(account != msg.sender, "Use renounceRole");
        _revokeRole(DEFAULT_ADMIN_ROLE, account);
        _revokeRole(ADMIN_ROLE, account);
        emit LeakProofRoleRevoked(account, DEFAULT_ADMIN_ROLE);
        emit LeakProofRoleRevoked(account, ADMIN_ROLE);
    }

    function recoverReviewerRole(address compromisedReviewer, address replacementReviewer)
        external
        onlyRole(ADMIN_ROLE)
    {
        require(compromisedReviewer != address(0), "Invalid compromised reviewer");
        require(replacementReviewer != address(0), "Invalid replacement reviewer");
        require(compromisedReviewer != replacementReviewer, "Reviewer unchanged");

        if (hasRole(REVIEWER_ROLE, compromisedReviewer)) {
            _revokeRole(REVIEWER_ROLE, compromisedReviewer);
            emit LeakProofRoleRevoked(compromisedReviewer, REVIEWER_ROLE);
        }

        _grantRole(REVIEWER_ROLE, replacementReviewer);
        emit LeakProofRoleGranted(replacementReviewer, REVIEWER_ROLE, msg.sender);
        emit ReviewerRoleRecovered(compromisedReviewer, replacementReviewer, msg.sender);
    }

    function grantReviewerRole(address account) external onlyRole(ADMIN_ROLE) {
        require(account != address(0), "Invalid address");
        _grantRole(REVIEWER_ROLE, account);
        emit LeakProofRoleGranted(account, REVIEWER_ROLE, msg.sender);
    }

    function grantReporterRole(address account) external onlyRole(ADMIN_ROLE) {
        require(account != address(0), "Invalid address");
        _grantRole(REPORTER_ROLE, account);
        emit LeakProofRoleGranted(account, REPORTER_ROLE, msg.sender);
    }

    function revokeRole(bytes32 role, address account) public override onlyRole(getRoleAdmin(role)) {
        require(role != DEFAULT_ADMIN_ROLE && role != ADMIN_ROLE, "Cannot revoke admin roles");
        super.revokeRole(role, account);
        emit LeakProofRoleRevoked(account, role);
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
