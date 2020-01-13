pragma solidity 0.5.11;

import "zos-lib/contracts/Initializable.sol";

import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/IERC20.sol";

contract Router is Initializable {

  function initialize(
    ) external initializer {
    }

  function _testForSufficientFunds (address paymentToken, uint256 total)
  internal view {
    if (paymentToken == address(0)) {
      require(msg.value >= total, 'Insufficient Funds for route');
      require(msg.value == total, 'Excess ETH for route');
    } else {
      IERC20 token = IERC20(paymentToken);
      uint256 allowance = token.allowance(msg.sender , address(this));
      require(allowance >= total, 'Insufficient permission');

      uint256 balance = token.balanceOf(msg.sender);
      require(balance >= total, 'Insufficient Funds for route');
    }
  }

//Call function with `call` to test if parameters are correct
  function dryRouteFunds (address paymentToken, uint8 payments, address[] memory recipients, uint256[] memory values)
  public payable  {
    uint256 total;
    for (uint8 i = 0; i< payments; i++) {
      total = total + values[i];
    }
    _testForSufficientFunds(paymentToken, total);
    revert('Revert at function end');//Revert to ensure accidental send transactions are reverted
  }

  function routeFunds (address paymentToken, uint8 payments, address[] memory recipients, uint256[] memory values)
  public payable {
    for (uint8 i = 0; i< payments; i++) {
      if (paymentToken == address(0)) {
        bytes memory payload = abi.encodePacked(uint(0));
        (bool success,) = recipients[i].call.value(values[i])(payload);
      } else {
        IERC20 token = IERC20(paymentToken);
        bytes memory payload = abi.encodeWithSignature('transfer(address,uint256)', recipients[i] , values[i]);
        (bool success,) = paymentToken.call(payload);
      }
    }
  }
}
