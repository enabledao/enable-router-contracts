pragma solidity 0.5.11;

import '@openzeppelin/contracts-ethereum-package/contracts/lifecycle/Pausable.sol';

contract Router is Pausable {
    function initialize(address pauser) public initializer {
      Pausable.initialize(pauser);
    }

    function routeFunds(
        address paymentToken,
        uint8 payments,
        address[] memory recipients,
        uint256[] memory values
    ) public payable whenNotPaused {
        for (uint8 i = 0; i < payments; i++) {
            if (paymentToken == address(0)) {
                bytes memory payload = abi.encodePacked(uint256(0));
                (bool success, ) = recipients[i].call.value(values[i])(payload);
            } else {
                bytes memory payload = abi.encodeWithSignature(
                    'transferFrom(address,address,uint256)',
                    msg.sender,
                    recipients[i],
                    values[i]
                );
                (bool success, ) = paymentToken.call(payload);
            }
        }
    }
}
