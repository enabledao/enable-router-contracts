import { BN, constants, expectEvent, expectRevert } from 'openzeppelin-test-helpers';

const { expect } = require('chai');

const Pausable = artifacts.require('Router');

const getLastBlockTime = async () => {
  await time.advanceBlock();
  return await time.latest();
};

contract('Pausable', accounts => {
  let pausable;

  beforeEach(async () => {
    pausable = await Pausable.new();
    await pausable.initialize(accounts[0]);
  });

  it('Pausable should deploy successfully', async () => {
    assert.exists(pausable.address, 'Pausable was not successfully deployed');
  });

  it('should pause successfully', async () => {
    const receipt = await pausable.pause();
    await expectEvent(receipt, 'Paused', { account: accounts[0] });
    await expectRevert(
      pausable.routeFunds(
        constants.ZERO_ADDRESS,
        1,
        false,
        [accounts[1]],
        [
          new BN(10)
            .pow(new BN(18))
            .mul(new BN(5))
            .div(new BN(100))
        ]
      ),
      'Pausable: paused'
    );
  });
});
