pragma solidity 0.5.11;

import "zos-lib/contracts/Initializable.sol";

contract Router is Initializable {
  string private constant TOKEN_APPROVAL_SIGNATURE = 'allowance(address,address)';
  string private constant TOKEN_TRANSFER_SIGNATURE = 'transfer(address,uint256)';

  function initialize(
    ) external initializer {
    }

  function _testForSufficientFunds (address paymentToken, uint8 total)
  internal {
    if (paymentToken == address(0)) {
      require(msg.value >= uint256(total), 'Insufficient Funds for route');
    } else {
      bytes memory payload = abi.encodeWithSignature(TOKEN_APPROVAL_SIGNATURE, msg.sender , address(this));
      (,bytes memory returnData) = paymentToken.call(payload);
      uint256 allowance = abi.decode(returnData, (uint));
      require(allowance >= uint256(total), 'Insufficient Funds for route');
    }
  }

//Call function with `call` to test if parameters are correct
  function dryRouteFunds (address paymentToken, uint8 payments, address[] memory recipients, uint8[] memory values)
  public  {
    uint8 total;
    for (uint8 i = 0; i< payments; i++) {
      total = total + values[i];
    }
    _testForSufficientFunds(paymentToken, total);
    revert('Revert at function end');//Revert to ensure accidental send transactions are reverted
  }

  function routeFunds (address paymentToken, uint8 payments, address[] memory recipients, uint8[] memory values)
  public {
    for (uint i = 0; i< payments; i++) {
      if (paymentToken == address(0)) {
        bytes memory payload = abi.encodePacked('');
        (bool success,) = paymentToken.call(payload).value(values[i]);
      } else {
        bytes memory payload = abi.encodeWithSignature(TOKEN_TRANSFER_SIGNATURE, recipients[0] , values[0]);
        (,bytes memory returnData) = paymentToken.call(payload);
        (bool success,) = paymentToken.call(payload).value(values[i]);
      }
    }
  }
}
