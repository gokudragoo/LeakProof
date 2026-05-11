// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/governance/utils/IVotes.sol";

contract LeakProofToken is ERC20, IVotes {
    uint256 public constant INITIAL_SUPPLY = 100_000_000 * 10 ** 18;

    mapping(address => address) private _delegates;
    mapping(address => mapping(uint256 => uint256)) private _pastVotes;
    mapping(uint256 => uint256) private _pastTotalSupply;

    constructor() ERC20("LeakProof Governance Token", "LPROOF") {
        _mint(msg.sender, INITIAL_SUPPLY);
    }

    function delegates(address account) external view returns (address) {
        return _delegates[account];
    }

    function delegate(address delegatee) external {
        _delegate(msg.sender, delegatee);
    }

    function delegateBySig(address, uint256, uint256, uint8, bytes32, bytes32) external pure {
        revert("Not implemented");
    }

    function getVotes(address account) public view returns (uint256) {
        return balanceOf(account);
    }

    function getPastVotes(address account, uint256 timepoint) public view returns (uint256) {
        return _pastVotes[account][timepoint];
    }

    function getPastTotalSupply(uint256 timepoint) public view returns (uint256) {
        return _pastTotalSupply[timepoint];
    }

    function _delegate(address delegator, address delegatee) internal {
        _delegates[delegator] = delegatee;
    }
}
