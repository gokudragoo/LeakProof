// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/governance/utils/IVotes.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./AccessControl.sol";

contract LeakProofDAO {
    LeakProofAccessControl public immutable accessControl;
    IVotes public immutable governanceToken;
    IERC20 public immutable governanceERC20;

    enum ProposalState { Pending, Active, Defeated, Succeeded, Queued, Expired, Executed }

    struct Proposal {
        address proposer;
        bytes32 descriptionHash;
        uint256 snapshotBlock;
        uint256 startTime;
        uint256 endTime;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        uint256 quorumVotes;
        bytes32 actionsHash;
        bool executed;
        bool cancelled;
        bytes32 queuedAt;
        ProposalState state;
    }

    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => string) public proposalDescriptions;
    mapping(uint256 => address[]) private proposalTargets;
    mapping(uint256 => uint256[]) private proposalValues;
    mapping(uint256 => bytes[]) private proposalCalldatas;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    mapping(uint256 => mapping(address => uint8)) public voteRecord;
    uint256 public proposalCount;
    uint256 public votingDelay = 1 days;
    uint256 public votingPeriod = 7 days;
    uint256 public quorumPercentage = 4;
    uint256 public proposalCooldown = 1 days;
    mapping(address => uint256) public lastProposalTime;

    uint256 public platformFee;
    uint256 public reviewerRewardBP;
    uint32 public caseApprovalThreshold;
    uint32 public maxReviewersPerCase;

    event ProposalCreated(uint256 indexed proposalId, address proposer, bytes32 descriptionHash, uint256 startTime, uint256 endTime);
    event VoteCast(uint256 indexed proposalId, address voter, uint8 voteType, uint256 weight);
    event ProposalExecuted(uint256 indexed proposalId);
    event ProposalDefeated(uint256 indexed proposalId);
    event ProposalSucceeded(uint256 indexed proposalId);
    event PlatformFeeUpdated(uint256 newFee);
    event ReviewerRewardUpdated(uint256 newRewardBP);
    event CaseThresholdUpdated(uint32 newThreshold);
    event MaxReviewersUpdated(uint32 newMax);

    modifier onlyAdmin() {
        require(accessControl.isAdmin(msg.sender), "Admin only");
        _;
    }

    modifier onlyGovernanceOrAdmin() {
        require(msg.sender == address(this) || accessControl.isAdmin(msg.sender), "Governance only");
        _;
    }

    modifier onlyTokenHolder() {
        require(governanceToken.getVotes(msg.sender) > 0, "No voting power");
        _;
    }

    constructor(address tokenAddress, address accessControlAddress) {
        require(tokenAddress != address(0) && accessControlAddress != address(0), "Invalid addresses");
        accessControl = LeakProofAccessControl(accessControlAddress);
        governanceToken = IVotes(tokenAddress);
        governanceERC20 = IERC20(tokenAddress);
    }

    function propose(
        address[] calldata targets,
        uint256[] calldata values,
        bytes[] calldata calldatas,
        string calldata description
    ) external onlyTokenHolder returns (uint256) {
        require(
            targets.length == values.length && values.length == calldatas.length,
            "Action length mismatch"
        );
        require(targets.length > 0, "Proposal actions required");
        require(
            lastProposalTime[msg.sender] + proposalCooldown <= block.timestamp,
            "Cooldown active"
        );

        uint256 proposalId = proposalCount++;
        bytes32 descriptionHash = keccak256(bytes(description));
        uint256 snapshotBlock = block.number == 0 ? 0 : block.number - 1;
        uint256 start = block.timestamp + votingDelay;
        uint256 end = start + votingPeriod;
        uint256 quorum = (governanceToken.getPastTotalSupply(snapshotBlock) * quorumPercentage) / 100;

        proposals[proposalId] = Proposal({
            proposer: msg.sender,
            descriptionHash: descriptionHash,
            snapshotBlock: snapshotBlock,
            startTime: start,
            endTime: end,
            forVotes: 0,
            againstVotes: 0,
            abstainVotes: 0,
            quorumVotes: quorum,
            actionsHash: keccak256(abi.encode(targets, values, calldatas)),
            executed: false,
            cancelled: false,
            queuedAt: 0,
            state: ProposalState.Pending
        });
        proposalDescriptions[proposalId] = description;
        proposalTargets[proposalId] = targets;
        proposalValues[proposalId] = values;
        proposalCalldatas[proposalId] = calldatas;

        lastProposalTime[msg.sender] = block.timestamp;
        emit ProposalCreated(proposalId, msg.sender, descriptionHash, start, end);

        return proposalId;
    }

    function castVote(uint256 proposalId, uint8 voteType) external {
        require(voteType <= 2, "Invalid vote type");
        require(!hasVoted[proposalId][msg.sender], "Already voted");

        Proposal storage proposal = proposals[proposalId];
        require(block.timestamp >= proposal.startTime, "Voting not started");
        require(block.timestamp <= proposal.endTime, "Voting ended");
        require(!proposal.executed && !proposal.cancelled, "Proposal inactive");

        uint256 weight = governanceToken.getPastVotes(msg.sender, proposal.snapshotBlock);
        require(weight > 0, "No voting power");

        hasVoted[proposalId][msg.sender] = true;
        voteRecord[proposalId][msg.sender] = voteType;

        if (voteType == 1) {
            proposal.forVotes += weight;
        } else if (voteType == 2) {
            proposal.againstVotes += weight;
        } else {
            proposal.abstainVotes += weight;
        }

        emit VoteCast(proposalId, msg.sender, voteType, weight);
    }

    function finalizeProposal(uint256 proposalId) external {
        _finalizeProposal(proposalId);
    }

    function _finalizeProposal(uint256 proposalId) internal returns (ProposalState) {
        Proposal storage proposal = proposals[proposalId];
        if (proposal.executed) {
            return ProposalState.Executed;
        }
        if (proposal.cancelled) {
            return ProposalState.Expired;
        }
        if (block.timestamp < proposal.startTime) {
            return ProposalState.Pending;
        }
        if (block.timestamp <= proposal.endTime) {
            return ProposalState.Active;
        }
        if (proposal.state == ProposalState.Succeeded || proposal.state == ProposalState.Defeated) {
            return proposal.state;
        }

        uint256 totalVotes = proposal.forVotes + proposal.againstVotes + proposal.abstainVotes;
        if (totalVotes < proposal.quorumVotes) {
            proposal.state = ProposalState.Defeated;
            emit ProposalDefeated(proposalId);
        } else if (proposal.forVotes > proposal.againstVotes) {
            proposal.state = ProposalState.Succeeded;
            emit ProposalSucceeded(proposalId);
        } else {
            proposal.state = ProposalState.Defeated;
            emit ProposalDefeated(proposalId);
        }

        return proposal.state;
    }

    function executeProposal(uint256 proposalId) external returns (bytes[] memory) {
        Proposal storage proposal = proposals[proposalId];
        require(_finalizeProposal(proposalId) == ProposalState.Succeeded, "Proposal not succeeded");
        require(!proposal.executed, "Already executed");

        address[] storage targets = proposalTargets[proposalId];
        uint256[] storage values = proposalValues[proposalId];
        bytes[] storage calldatas = proposalCalldatas[proposalId];
        require(targets.length > 0, "Proposal actions missing");
        require(
            proposal.actionsHash == keccak256(abi.encode(targets, values, calldatas)),
            "Proposal actions changed"
        );

        proposal.executed = true;
        proposal.state = ProposalState.Executed;

        bytes[] memory results = new bytes[](targets.length);
        for (uint256 i = 0; i < targets.length; i++) {
            (bool success, bytes memory data) = targets[i].call{value: values[i]}(calldatas[i]);
            results[i] = data;
            require(success, "Proposal call failed");
        }

        emit ProposalExecuted(proposalId);
        return results;
    }

    function cancelProposal(uint256 proposalId) external onlyAdmin {
        proposals[proposalId].cancelled = true;
        proposals[proposalId].state = ProposalState.Expired;
    }

    function setPlatformFee(uint256 newFee) external onlyGovernanceOrAdmin {
        platformFee = newFee;
        emit PlatformFeeUpdated(newFee);
    }

    function setReviewerReward(uint256 newRewardBP) external onlyGovernanceOrAdmin {
        require(newRewardBP <= 1000, "Cannot exceed 10%");
        reviewerRewardBP = newRewardBP;
        emit ReviewerRewardUpdated(newRewardBP);
    }

    function setCaseApprovalThreshold(uint32 newThreshold) external onlyGovernanceOrAdmin {
        require(newThreshold >= 1 && newThreshold <= 10, "Threshold out of range");
        caseApprovalThreshold = newThreshold;
        emit CaseThresholdUpdated(newThreshold);
    }

    function setMaxReviewersPerCase(uint32 newMax) external onlyGovernanceOrAdmin {
        require(newMax >= 1 && newMax <= 20, "Max reviewers out of range");
        maxReviewersPerCase = newMax;
        emit MaxReviewersUpdated(newMax);
    }

    function getProposalState(uint256 proposalId) external view returns (ProposalState) {
        Proposal storage proposal = proposals[proposalId];
        if (proposal.executed) return ProposalState.Executed;
        if (proposal.cancelled) return ProposalState.Expired;
        if (block.timestamp < proposal.startTime) return ProposalState.Pending;
        if (block.timestamp <= proposal.endTime) return ProposalState.Active;
        if (proposal.state == ProposalState.Succeeded || proposal.state == ProposalState.Defeated) {
            return proposal.state;
        }

        uint256 totalVotes = proposal.forVotes + proposal.againstVotes + proposal.abstainVotes;
        if (totalVotes >= proposal.quorumVotes && proposal.forVotes > proposal.againstVotes) {
            return ProposalState.Succeeded;
        }

        return ProposalState.Defeated;
    }

    function getProposalVotes(uint256 proposalId) external view returns (uint256 forVotes, uint256 againstVotes, uint256 abstainVotes) {
        Proposal storage proposal = proposals[proposalId];
        return (proposal.forVotes, proposal.againstVotes, proposal.abstainVotes);
    }

    function getProposalActions(uint256 proposalId)
        external
        view
        returns (address[] memory targets, uint256[] memory values, bytes[] memory calldatas)
    {
        return (proposalTargets[proposalId], proposalValues[proposalId], proposalCalldatas[proposalId]);
    }

    receive() external payable {}
}
