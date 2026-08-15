// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract EchoPass {
    uint256 private constant _SECP256K1_HALF_ORDER =
        0x7fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a0;

    struct EventDetails {
        uint64 endsAt;
        uint96 reward;
        uint256 remainingBudget;
        bool exists;
    }

    address public immutable organizer;
    address public immutable voucherSigner;

    mapping(bytes32 eventId => EventDetails details) private _events;
    mapping(bytes32 eventId => mapping(address claimant => bool claimed))
        private _claims;

    event PresenceClaimed(
        bytes32 indexed eventId,
        address indexed claimant,
        uint256 reward
    );
    event EventFundsWithdrawn(
        bytes32 indexed eventId,
        address indexed recipient,
        uint256 amount
    );

    constructor(address signer) {
        require(signer != address(0), "invalid signer");
        organizer = msg.sender;
        voucherSigner = signer;
    }

    function createEvent(
        bytes32 eventId,
        uint64 endsAt,
        uint96 reward
    ) external payable {
        require(msg.sender == organizer, "only organizer");
        require(eventId != bytes32(0), "invalid event id");
        require(!_events[eventId].exists, "event already exists");
        require(endsAt > block.timestamp, "invalid event window");
        require(msg.value >= reward, "insufficient event funding");

        _events[eventId] = EventDetails({
            endsAt: endsAt,
            reward: reward,
            remainingBudget: msg.value,
            exists: true
        });
    }

    function claim(
        bytes32 eventId,
        uint64 validUntil,
        bytes32 signalHash,
        bytes calldata signature
    ) external {
        EventDetails storage details = _events[eventId];
        require(details.exists, "event not found");
        require(block.timestamp <= details.endsAt, "event ended");
        require(block.timestamp <= validUntil, "voucher expired");
        require(!_claims[eventId][msg.sender], "already claimed");

        bytes32 digest = keccak256(
            abi.encode(
                block.chainid,
                address(this),
                eventId,
                msg.sender,
                signalHash,
                validUntil
            )
        );
        require(_recover(digest, signature) == voucherSigner, "invalid voucher");

        uint256 reward = uint256(details.reward);
        require(
            details.remainingBudget >= reward,
            "event reward exhausted"
        );
        _claims[eventId][msg.sender] = true;
        details.remainingBudget -= reward;

        if (reward != 0) {
            (bool sent, ) = payable(msg.sender).call{value: reward}("");
            require(sent, "reward transfer failed");
        }

        emit PresenceClaimed(eventId, msg.sender, reward);
    }

    function withdrawEventFunds(
        bytes32 eventId,
        address payable recipient
    ) external {
        require(msg.sender == organizer, "only organizer");
        EventDetails storage details = _events[eventId];
        require(details.exists, "event not found");
        require(block.timestamp > details.endsAt, "event active");
        require(recipient != address(0), "invalid recipient");

        uint256 amount = details.remainingBudget;
        require(amount != 0, "no event funds");
        details.remainingBudget = 0;

        (bool sent, ) = recipient.call{value: amount}("");
        require(sent, "withdrawal failed");

        emit EventFundsWithdrawn(eventId, recipient, amount);
    }

    function eventBalance(bytes32 eventId) external view returns (uint256) {
        return _events[eventId].remainingBudget;
    }

    function hasClaimed(
        bytes32 eventId,
        address claimant
    ) external view returns (bool) {
        return _claims[eventId][claimant];
    }

    function _recover(
        bytes32 digest,
        bytes calldata signature
    ) private pure returns (address) {
        if (signature.length != 65) {
            return address(0);
        }

        bytes32 r;
        bytes32 s;
        uint8 v;
        assembly ("memory-safe") {
            r := calldataload(signature.offset)
            s := calldataload(add(signature.offset, 32))
            v := byte(0, calldataload(add(signature.offset, 64)))
        }

        if (uint256(s) > _SECP256K1_HALF_ORDER || (v != 27 && v != 28)) {
            return address(0);
        }

        bytes32 signedDigest = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", digest)
        );
        return ecrecover(signedDigest, v, r, s);
    }
}
