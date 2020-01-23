pragma solidity 0.5.11;

import "zos-lib/contracts/Initializable.sol";

contract Router is Initializable {

  function initialize(
    ) external initializer {
    }

  function routeFunds (address paymentToken, uint8 payments, address[] memory recipients, uint256[] memory values)
  public payable {
    for (uint8 i = 0; i< payments; i++) {
      if (paymentToken == address(0)) {
        bytes memory payload = abi.encodePacked(uint(0));
        (bool success,) = recipients[i].call.value(values[i])(payload);
      } else {
        bytes memory payload = abi.encodeWithSignature('transferFrom(address,address,uint256)', msg.sender, recipients[i] , values[i]);
        (bool success,) = paymentToken.call(payload);
      }
    }
  }
}
