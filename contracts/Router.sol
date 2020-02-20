pragma solidity 0.5.11;

import 'zos-lib/contracts/Initializable.sol';

contract Router is Initializable {
    function initialize() external initializer {}

    function routeFunds(
        address paymentToken,
        uint8 payments,
        bool revertOnError,
        address[] memory recipients,
        uint256[] memory values
    ) public payable {
        for (uint8 i = 0; i < payments; i++) {
          bool success;
            if (paymentToken == address(0)) {//ETH transfer
                bytes memory payload = abi.encodePacked(uint256(0));
                (success, ) = recipients[i].call.value(values[i])(payload);
            } else {//ER20 Token transfer
                bytes memory payload = abi.encodeWithSignature(
                    'transferFrom(address,address,uint256)',
                    msg.sender,
                    recipients[i],
                    values[i]
                );
                (success, ) = paymentToken.call(payload);
            }
            if (revertOnError && !success) {
              revert('Failed routing');
            }
        }
    }
}
