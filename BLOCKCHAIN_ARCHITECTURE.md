```markdown
# MetaSpace Blockchain & Economic Architecture

This document describes the blockchain layer for MetaSpace, where gameplay remains off-chain for responsiveness while rewards and ownership transitions are settled asynchronously on-chain.

## Table of Contents

- [System Boundaries](#system-boundaries)
- [Claim Flow](#claim-flow)
- [EIP-712 Signature Model](#eip-712-signature-model)
- [Smart Contract Example](#smart-contract-example)
- [Security and Gas Optimizations](#security-and-gas-optimizations)
- [Recommended Deployment Strategy](#recommended-deployment-strategy)

---

## System Boundaries

To preserve smooth gameplay and eliminate gas friction during combat, MetaSpace keeps the active game loop entirely off-chain.

- Off-chain execution handles movement, combat, collision, enemy behavior, pickups, dungeon progression, and item generation.
- On-chain settlement occurs only when a reward or ownership action is claimed.
- The player receives a signed claim payload and can submit it when convenient, without requiring a blockchain transaction for every gameplay event.

This model preserves low latency while maintaining provable ownership and reward finalization on-chain.

---

## Claim Flow

```text
Player Action --> Server Validation --> Off-Chain Reward Generation --> EIP-712 Signature --> Client Receives Claim
                                                                                     |
                                                                                     v
                                                                              On-Chain Claim
                                                                                     |
                                                                                     v
                                                                              NFT / Asset Mint
```

Typical scenario:

1. A player opens a chest or completes a dungeon objective.
2. The authoritative server verifies world state, inventory, room history, and movement validity.
3. The server creates a signed reward payload using EIP-712.
4. The client receives the signature and may submit it later to the contract.
5. The smart contract verifies the signature, enforces nonce and deadline checks, and mints the entitled asset.

---

## EIP-712 Signature Model

MetaSpace uses an asynchronous signed claim system instead of sending every reward event directly to-chain.

### Why this works

- The server acts as the trusted signer for valid gameplay outcomes.
- The signed payload is structured, typed, and domain-separated using EIP-712.
- The wallet submits the final claim transaction later, preventing gameplay interruptions caused by gas delays.
- The claim can be validated cryptographically without trusting an unverified client.

### Signature payload fields

- player address
- contract address
- token ID
- nonce
- deadline
- signature bytes

This allows the server to produce signed authorization for a reward without exposing the underlying reward logic to the client.

---

## Smart Contract Example

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

interface IDungeonNFT is IERC721 {
    function mint(address to, uint256 tokenId) external;
}

contract MetaSpaceDungeonClaim is EIP712, Ownable {
    using ECDSA for bytes32;

    address public trustedSigner;
    IDungeonNFT public dungeonNFT;

    mapping(bytes32 => bool) public executedNonces;

    bytes32 private constant CLAIM_TYPEHASH = keccak256(
        "ClaimReward(address player,address contractAddress,uint256 tokenId,bytes32 nonce,uint256 deadline)"
    );

    event RewardClaimed(address indexed player, uint256 indexed tokenId, bytes32 nonce);

    constructor(address _trustedSigner, address _nftAddress)
        EIP712("MetaSpaceDungeon", "1")
        Ownable(msg.sender)
    {
        trustedSigner = _trustedSigner;
        dungeonNFT = IDungeonNFT(_nftAddress);
    }

    function setTrustedSigner(address _signer) external onlyOwner {
        trustedSigner = _signer;
    }

    function claimReward(
        uint256 tokenId,
        bytes32 nonce,
        uint256 deadline,
        bytes calldata signature
    ) external {
        require(block.timestamp <= deadline, "Signature expired");
        require(!executedNonces[nonce], "Nonce already redeemed");

        bytes32 structHash = keccak256(
            abi.encode(CLAIM_TYPEHASH, msg.sender, address(this), tokenId, nonce, deadline)
        );

        bytes32 digest = _hashTypedDataV4(structHash);
        address recoveredSigner = digest.recover(signature);

        require(recoveredSigner == trustedSigner, "Invalid server signature");

        executedNonces[nonce] = true;
        dungeonNFT.mint(msg.sender, tokenId);

        emit RewardClaimed(msg.sender, tokenId, nonce);
    }
}
```

This pattern is well suited to reward claims, dungeon completions, and NFT mint events that must be provably tied to valid server-side outcomes.

---

## Security and Gas Optimizations

### Core protections

- EIP-712 typed signatures provide structured validation and reduce ambiguity.
- A nonce mapping prevents replay and double-redemption attempts.
- Expiration deadlines prevent stale claims from being redeemed later.
- Domain separation protects against signature reuse across environments or deployments.

### Gas efficiency

- Reward claims are not posted to-chain during gameplay.
- The contract stores only minimal state: whether a nonce has already been executed.
- The signed payload is verified on-demand only when the user submits the claim.

### Deployment direction

- Target Ethereum Layer 2 networks such as Arbitrum, Base, or Polygon for lower transaction cost.
- Keep the contract logic small and deterministic to reduce validation cost.
- Use a trusted server signer key with strict operational controls and rotation procedures.

---

## Recommended Deployment Strategy

1. Keep gameplay state and simulation authoritative on the Node.js server.
2. Issue EIP-712 rewards only after gameplay validation has passed.
3. Store the signer address in a controlled contract configuration, not in the client.
4. Enforce nonce and expiration checks for every claim.
5. Deploy to a low-cost L2 to make reward minting economically accessible to players.

This architecture separates the user experience layer from the economic settlement layer while preserving trust, security, and scalability.
