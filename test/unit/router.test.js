import { balance, BN, constants, expectEvent, expectRevert, time } from 'openzeppelin-test-helpers';

const { expect } = require('chai');

const Router = artifacts.require('Router');
const PaymentToken = artifacts.require('StandaloneERC20');

const TOKEN_DECIMALS = new BN(18);
const DECIMAL_SHIFT = new BN(10).pow(TOKEN_DECIMALS);

const paymentTokenParams = {
  name: 'PaymentToken',
  symbol: 'PAY',
  decimals: DECIMAL_SHIFT
};

const getLastBlockTime = async () => {
  await time.advanceBlock();
  return await time.latest();
};

contract('Router', accounts => {
  let router;
  let paymentToken;

  const weiValue = eth => web3.utils.toWei(eth);
  const routeParams = [
    5,
    [accounts[2], accounts[3], accounts[4], accounts[5], accounts[6]],
    [
      DECIMAL_SHIFT.mul(new BN(1)).div(new BN(100)), // 0.01eth
      DECIMAL_SHIFT.mul(new BN(2)).div(new BN(100)), // 0.02eth
      DECIMAL_SHIFT.mul(new BN(3)).div(new BN(100)), // 0.03eth
      DECIMAL_SHIFT.mul(new BN(4)).div(new BN(100)), // 0.04eth
      DECIMAL_SHIFT.mul(new BN(5)).div(new BN(100)) // 0.05eth
    ]
  ];
  const etherRouteParams = () => [constants.ZERO_ADDRESS, ...routeParams];
  const tokenRouteParams = () => [paymentToken.address, ...routeParams];

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

  it('Router should deploy successfully', async () => {
    assert.exists(router.address, 'Router was not successfully deployed');
  });

  it('PaymentToken should deploy successfully', async () => {
    assert.exists(paymentToken.address, 'PaymentToken was not successfully deployed');
  });

  it('should fail on incorrect paramaters and conditions', async () => {
    const userBalance = await balance.current(accounts[0]);
    const total = etherRouteParams()[3].reduce((a, b) => a.add(b), new BN(0));
    expect(userBalance).to.be.bignumber.gte(total, 'Insufficient funds on account');

    //ETH route
    await expectRevert(
      router.dryRouteFunds.call(...etherRouteParams(), { value: weiValue('0') }),
      'Insufficient Funds for route'
    );

    await expectRevert(
      router.dryRouteFunds.call(...etherRouteParams(), { value: weiValue('1') }),
      'Excess ETH for route'
    );
  });

  it('should fail on incorrect token route paramaters and conditions', async () => {
    const userAllowance = await paymentToken.allowance(accounts[0], router.address);
    expect(userAllowance).to.be.bignumber.gte(new BN(0), 'Incorrect allowance on account');

    //ERC20 route
    await expectRevert(
      router.dryRouteFunds.call(...tokenRouteParams()),
      'Insufficient Funds for route'
    );
  });

  it('successfully test routeFunds', async () => {
    const userBalance = await balance.current(accounts[0]);
    const total = etherRouteParams()[3].reduce((a, b) => a.add(b), new BN(0));
    expect(userBalance).to.be.bignumber.gte(total, 'Insufficient funds on account');

    await expectRevert(
      router.dryRouteFunds.call(...etherRouteParams(), { value: total }),
      'Revert at function end'
    );

    const newBalance = await balance.current(accounts[0]);
    expect(newBalance).to.be.bignumber.eq(new BN(newBalance), 'Funds used on transaction');
  });

  it('successfully test token routeFunds', async () => {
    const total = etherRouteParams()[3].reduce((a, b) => a.add(b), new BN(0));
    await paymentToken.approve(router.address, total);
    const userAllowance = await paymentToken.allowance(accounts[0], router.address);
    expect(userAllowance).to.be.bignumber.gte(new BN(0), 'Incorrect allowance on account');
    const userBalance = await paymentToken.balanceOf(accounts[0]);

    //ERC20 route
    await expectRevert(router.dryRouteFunds.call(...tokenRouteParams()), 'Revert at function end');
    const newBalance = await paymentToken.balanceOf(accounts[0]);
    expect(userBalance).to.be.bignumber.eq(newBalance, 'Funds used on transaction');
  });

  it('should avoid funds lost to testing routeFunds', async () => {
    const total = etherRouteParams()[3].reduce((a, b) => a.add(b), new BN(0));
    const txOpts = { value: total, gas: 500000 };
    const userBalance = await balance.current(accounts[0]);

    await expectRevert(
      router.dryRouteFunds(...etherRouteParams(), txOpts),
      'Revert at function end'
    );
    const newBalance = await balance.current(accounts[0]);

    expect(newBalance).to.be.bignumber.gte(
      new BN(userBalance).sub(new BN(txOpts.value)),
      'Funds used more than allocated Gas'
    );
  });
});
