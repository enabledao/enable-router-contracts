import { BN, expectEvent, expectRevert, time } from 'openzeppelin-test-helpers';

const { expect } = require('chai');

const Router = artifacts.require('Router');
const PaymentToken = artifacts.require('StandaloneERC20');

const paymentTokenParams = {
  name: 'PaymentToken',
  symbol: 'PAY',
  decimals: new BN(18)
};

const getLastBlockTime = async () => {
  await time.advanceBlock();
  return await time.latest();
};

contract('Router', accounts => {
  let router;
  let paymentToken;

  beforeEach(async () => {
    paymentToken = await PaymentToken.new();
    await paymentToken.initialize(
      paymentTokenParams.name,
      paymentTokenParams.symbol,
      paymentTokenParams.decimals,
      [accounts[0]], // minters
      [] // pausers
    );

    router = await Router.new();
    await router.initialize();
  });

  it('Crowdloan should deploy successfully', async () => {
    assert.exists(router.address, 'Router was not successfully deployed');
  });

  it('PaymentToken should deploy successfully', async () => {
    assert.exists(paymentToken.address, 'PaymentToken was not successfully deployed');
  });
});
