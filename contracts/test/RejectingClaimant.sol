// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IEchoPass {
    function claim(
        bytes32 eventId,
        uint64 validUntil,
        bytes32 signalHash,
        bytes calldata signature
    ) external;
}

contract RejectingClaimant {
    function claim(
        address echoPass,
        bytes32 eventId,
        uint64 validUntil,
        bytes32 signalHash,
        bytes calldata signature
    ) external {
        IEchoPass(echoPass).claim(
            eventId,
            validUntil,
            signalHash,
            signature
        );
    }

    receive() external payable {
        revert("MON rejected");
    }
}
