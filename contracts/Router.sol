pragma solidity 0.5.11;

import '@openzeppelin/contracts-ethereum-package/contracts/lifecycle/Pausable.sol';


contract Router is Pausable {

    uint256 public fee;

    function checkForFee (
        address paymentToken,
        uint8 payments,
        uint256[] memory values
      ) internal returns (bool) {
      uint256 total=fee;
      if (paymentToken == address(0)) {
        for(uint t=0; t< payments; t++) {
          total = total + values[t];
        }
      }
      return msg.value >= total;
    }

    function initialize(address pauser) public initializer {
        Pausable.initialize(pauser);
    }

    function updateFee (uint256 __fee) public onlyPauser {
        fee = __fee;
    }

    function routeFunds(
        address paymentToken,
        uint8 payments,
        bool revertOnError,
        address[] memory recipients,
        uint256[] memory values
    ) public payable whenNotPaused {
      require(checkForFee(
             paymentToken,
             payments,
             values
      ), 'Insufficient funds, is fee included?');

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
