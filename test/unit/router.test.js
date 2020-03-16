import { balance, BN, constants, expectRevert, time } from 'openzeppelin-test-helpers';

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
    false,
    [accounts[2], accounts[3], accounts[4], accounts[5], accounts[6]],
    [
      DECIMAL_SHIFT.mul(new BN(1)).div(new BN(100)), // 0.01eth
      DECIMAL_SHIFT.mul(new BN(2)).div(new BN(100)), // 0.02eth
      DECIMAL_SHIFT.mul(new BN(3)).div(new BN(100)), // 0.03eth
      DECIMAL_SHIFT.mul(new BN(4)).div(new BN(100)), // 0.04eth
      DECIMAL_SHIFT.mul(new BN(5)).div(new BN(100)) // 0.05eth
    ]
  ];
  const etherRouteParams = revertOnError =>
    [constants.ZERO_ADDRESS, ...routeParams].map((x, id) => (id === 2 && revertOnError ? true : x));
  const tokenRouteParams = revertOnError =>
    [paymentToken.address, ...routeParams].map((x, id) => (id === 2 && revertOnError ? true : x));

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
    await router.initialize(accounts[0]);
  });

  it('Router should deploy successfully', async () => {
    assert.exists(router.address, 'Router was not successfully deployed');
  });

  it('PaymentToken should deploy successfully', async () => {
    assert.exists(paymentToken.address, 'PaymentToken was not successfully deployed');
  });

  it('should fail on incorrect parameters and conditions', async () => {
    const userBalance = await balance.current(accounts[0]);
    const total = etherRouteParams()[4].reduce((a, b) => a.add(b), new BN(0));
    expect(userBalance).to.be.bignumber.gte(total, 'Insufficient funds on account');
    //ETH route
    await expectRevert(
      router.routeFunds(...etherRouteParams(true), { value: weiValue('0') }),
      'Failed routing'
    );
  });

  it('should fail on test incorrect token route paramaters and conditions', async () => {
    const userAllowance = await paymentToken.allowance(accounts[0], router.address);
    expect(userAllowance).to.be.bignumber.gte(new BN(0), 'Incorrect allowance on account');
    const total = tokenRouteParams()[4].reduce((a, b) => a.add(b), new BN(0));

    //ERC20 route
    await expectRevert(
      router.routeFunds(...tokenRouteParams(true), { value: weiValue('0') }),
      'Failed routing'
    );

    await paymentToken.approve(
      router.address,
      total.sub(DECIMAL_SHIFT.mul(new BN(1)).div(new BN(100)))
    );

    await expectRevert(
      router.routeFunds(...tokenRouteParams(true), { value: weiValue('0') }),
      'Failed routing'
    );
  });

  it('should fail to routeFunds without fee', async () => {
    const params = [constants.ZERO_ADDRESS, 1, false, [accounts[2]], [0]];
    const txOpts = { value: 0 };
    const fee = DECIMAL_SHIFT.mul(new BN(5)).div(new BN(10));

    const setFee = await router.fee.call();

    await router.updateFee(fee);
    await expectRevert(router.routeFunds(...params, txOpts), 'revert');
  });

  it('should fail to routeFunds with insufficient fee', async () => {
    const total = etherRouteParams()[4].reduce((a, b) => a.add(b), new BN(0));
    const txOpts = { value: total };
    const fee = DECIMAL_SHIFT.mul(new BN(5)).div(new BN(10));

    const setFee = await router.fee.call();

    await router.updateFee(fee);

    expect(await router.fee.call()).to.be.bignumber.eq(fee, 'Incorrect fee value set');
    await expectRevert(router.routeFunds(...etherRouteParams(true), txOpts), 'revert');
  });

  it('should fail to route token Funds without fee', async () => {
    const total = tokenRouteParams()[4].reduce((a, b) => a.add(b), new BN(0));
    await paymentToken.approve(router.address, total);
    const userAllowance = await paymentToken.allowance.call(accounts[0], router.address);
    const fee = DECIMAL_SHIFT.mul(new BN(5)).div(new BN(10));

    await paymentToken.mint(accounts[0], total);
    const setFee = await router.fee.call();

    await router.updateFee(fee);
    await expectRevert(router.routeFunds(...tokenRouteParams()), 'revert');
  });

  it('successfully routeFunds', async () => {
    const userBalance = await balance.current(accounts[0]);
    const total = etherRouteParams()[4].reduce((a, b) => a.add(b), new BN(0));
    expect(userBalance).to.be.bignumber.gte(total, 'Insufficient funds on account');

    const balances = await Promise.all(etherRouteParams()[3].map(user => balance.current(user)));

    const receipt = await router.routeFunds(...etherRouteParams(), { value: total });
    const gasPrice = (await web3.eth.getTransaction(receipt.tx)).gasPrice;

    const newBalance = await balance.current(accounts[0]);
    const newBalances = await Promise.all(etherRouteParams()[3].map(user => balance.current(user)));

    expect(newBalance).to.be.bignumber.eq(
      new BN(userBalance)
        .sub(new BN(total))
        .sub(new BN(receipt.receipt.cumulativeGasUsed).mul(new BN(gasPrice))),
      'Excess Funds used on transaction'
    );

    const expectedBalances = balances.map((bal, ind) =>
      new BN(bal).add(new BN(etherRouteParams()[4][ind]))
    );
    expect(newBalances).to.deep.equal(expectedBalances, 'Incorrectly routed funds');
  });

  it('successfully route token Funds', async () => {
    const total = tokenRouteParams()[4].reduce((a, b) => a.add(b), new BN(0));
    await paymentToken.approve(router.address, total);
    const userAllowance = await paymentToken.allowance.call(accounts[0], router.address);
    expect(userAllowance).to.be.bignumber.gte(new BN(0), 'Incorrect allowance on account');
    await paymentToken.mint(accounts[0], total);
    const userBalance = await paymentToken.balanceOf.call(accounts[0]);
    expect(userBalance).to.be.bignumber.gte(total, 'Insufficient funds on account');

    const balances = await Promise.all(
      tokenRouteParams()[3].map(user => paymentToken.balanceOf.call(user))
    );

    const receipt = await router.routeFunds(...tokenRouteParams());

    const newBalance = await paymentToken.balanceOf.call(accounts[0]);
    const newBalances = await Promise.all(
      tokenRouteParams()[3].map(user => paymentToken.balanceOf.call(user))
    );

    expect(newBalance).to.be.bignumber.eq(
      new BN(userBalance).sub(new BN(total)),
      'Excess Funds used on transaction'
    );

    const expectedBalances = balances.map((bal, ind) =>
      new BN(bal).add(new BN(tokenRouteParams()[4][ind]))
    );
    expect(newBalances.map(b => b.toString())).to.deep.equal(
      expectedBalances.map(b => b.toString()),
      'Incorrectly routed funds'
    );
  });

  it('successfully routeAllorNoneFunds', async () => {
    const userBalance = await balance.current(accounts[0]);
    const total = etherRouteParams()[4].reduce((a, b) => a.add(b), new BN(0));
    expect(userBalance).to.be.bignumber.gte(total, 'Insufficient funds on account');

    const balances = await Promise.all(etherRouteParams()[3].map(user => balance.current(user)));

    const receipt = await router.routeFunds(...etherRouteParams(), { value: total });
    const gasPrice = (await web3.eth.getTransaction(receipt.tx)).gasPrice;

    const newBalance = await balance.current(accounts[0]);
    const newBalances = await Promise.all(etherRouteParams()[3].map(user => balance.current(user)));

    expect(newBalance).to.be.bignumber.eq(
      new BN(userBalance)
        .sub(new BN(total))
        .sub(new BN(receipt.receipt.cumulativeGasUsed).mul(new BN(gasPrice))),
      'Excess Funds used on transaction'
    );

    const expectedBalances = balances.map((bal, ind) =>
      new BN(bal).add(new BN(etherRouteParams()[4][ind]))
    );
    expect(newBalances).to.deep.equal(expectedBalances, 'Incorrectly routed funds');
  });

  it('successfully routeAllorNone token Funds', async () => {
    const total = tokenRouteParams(true)[4].reduce((a, b) => a.add(b), new BN(0));
    await paymentToken.approve(router.address, total);
    const userAllowance = await paymentToken.allowance.call(accounts[0], router.address);
    expect(userAllowance).to.be.bignumber.gte(new BN(0), 'Incorrect allowance on account');
    await paymentToken.mint(accounts[0], total);
    const userBalance = await paymentToken.balanceOf.call(accounts[0]);
    expect(userBalance).to.be.bignumber.gte(total, 'Insufficient funds on account');

    const balances = await Promise.all(
      tokenRouteParams(true)[3].map(user => paymentToken.balanceOf.call(user))
    );

    const receipt = await router.routeFunds(...tokenRouteParams(true));

    const newBalance = await paymentToken.balanceOf.call(accounts[0]);
    const newBalances = await Promise.all(
      tokenRouteParams(true)[3].map(user => paymentToken.balanceOf.call(user))
    );

    expect(newBalance).to.be.bignumber.eq(
      new BN(userBalance).sub(new BN(total)),
      'Excess Funds used on transaction'
    );

    const expectedBalances = balances.map((bal, ind) =>
      new BN(bal).add(new BN(tokenRouteParams(true)[4][ind]))
    );
    expect(newBalances.map(b => b.toString())).to.deep.equal(
      expectedBalances.map(b => b.toString()),
      'Incorrectly routed funds'
    );
  });

  it('should successfully updateFee', async () => {
    const feeAmount = DECIMAL_SHIFT.mul(new BN(1)).div(new BN(100));

    const fee = await router.fee.call();
    expect(fee).to.be.bignumber.eq(new BN(0));
    await router.updateFee(feeAmount);
    expect(await router.fee.call()).to.be.bignumber.eq(feeAmount);
  });

  it('should successfully updateAdmin', async () => {
    expectRevert(router.updateAdmin(accounts[2]), '');

    // const fee = await router.fee.call();
    // expect(fee).to.be.bignumber.eq(new BN(0));
    // await router.updateFee(feeAmount);
    // expect(await router.fee.call()).to.be.bignumber.eq(feeAmount);
  });
});
