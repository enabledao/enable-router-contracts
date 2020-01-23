/**
 * This file stress tests the Priority Queue implementation to get
 * data for submitting 10, 50, 100, 125, 150, 175, 200 1000, 10000 addresses to the router
 */
const Router = artifacts.require('Router');
const PaymentToken = artifacts.require('StandaloneERC20');
import { balance, BN, constants, expectRevert, time } from 'openzeppelin-test-helpers';

const VERBOSE = true;
const TOKEN_DECIMALS = new BN(18);
const DECIMAL_SHIFT = new BN(10).pow(TOKEN_DECIMALS);

const log = (...msgs) => {
  if (VERBOSE) {
    msgs.map(msg => console.log(msg));
  }
};

const printLine = () => {
  log('--**--'.repeat(12));
};

const printNewLine = () => {
  log('\n');
};
const weiValue = eth => web3.utils.toWei(eth);

const main = async (count, { router, paymentToken, web3, accounts }, ethRoute) => {
  log(`Router address: ${router.address}`);
  printLine();

  const startAddr = '0x2ffd48cc061331d071a1a8178cfc2a3863d56d4e';
  const nextAddr = addr => {
    let a = new BN(addr);
    a = a.add(new BN('1'));
    a = web3.utils.toHex(a);
    if (a.length > 64) {
      throw new Error('ERROR: ADDRESS OVERFLOW.. EXITING');
    }
    return a;
  };

  const buildList = num => {
    let l = [];

    let curAddr = startAddr;
    let curVal;
    for (let i = 0; i <= num; i++) {
      curVal = Math.floor(Math.random() * 10000);
      curAddr = nextAddr(curAddr);
      l.push({
        addr: curAddr,
        val: curVal
      });
    }
    return l;
  };

  const list = buildList(count);

  let most = 0;
  let sum = 0;
  const stressStart = new Date().getTime();

  printNewLine();
  printLine();
  log(`Route : to ${count} Addresses`);

  const amount = DECIMAL_SHIFT.mul(new BN(1)).div(new BN(100));
  const routeParams = [count, list, list.map(() => amount)];
  const etherRouteParams = [constants.ZERO_ADDRESS, ...routeParams];
  const tokenRouteParams = [paymentToken.address, ...routeParams];

  const total = routeParams[2].reduce((a, b) => a.add(b), new BN(0));

  if (ethRoute) {
    //ETH test route
    log(`ETH route`);
    const userBalance = await balance.current(accounts[0]);
    // expect(userBalance).to.be.bignumber.gte(total, 'Insufficient funds on account');

    const balances = await Promise.all(etherRouteParams[2].map(user => balance.current(user)));
    await router.routeFunds(...etherRouteParams, { value: total });

    const newBalances = await Promise.all(etherRouteParams[2].map(user => balance.current(user)));

    const expectedBalances = balances.map((bal, ind) =>
      new BN(bal).add(new BN(etherRouteParams[3][ind]))
    );
    expect(newBalances).to.deep.equal(expectedBalances, 'Incorrectly routed funds');
  } else {
    //TOken test route
    log(`Token route`);

    await paymentToken.approve(router.address, total);
    const userAllowance = await paymentToken.allowance.call(accounts[0], router.address);
    // expect(userAllowance).to.be.bignumber.eq(total, 'Incorrect allowance on account');

    await paymentToken.mint(accounts[0], total);
    const tokenBalance = await paymentToken.balanceOf.call(accounts[0]);
    // expect(tokenBalance).to.be.bignumber.gte(total, 'Insufficient funds on account');

    const tokenBalances = await Promise.all(
      tokenRouteParams[2].map(user => paymentToken.balanceOf.call(user))
    );
    await router.routeFunds(...tokenRouteParams);

    const newBalances = await Promise.all(
      tokenRouteParams[2].map(user => paymentToken.balanceOf.call(user))
    );

    const expectedBalances = tokenBalances.map((bal, ind) =>
      new BN(bal).add(new BN(tokenRouteParams[3][ind]))
    );
    expect(newBalances.map(b => b.toString())).to.deep.equal(
      expectedBalances.map(b => b.toString()),
      'Incorrectly routed funds'
    );
  }
};

contract('Stress Router', accounts => {
  let router;
  let paymentToken;

  const paymentTokenParams = {
    name: 'PaymentToken',
    symbol: 'PAY',
    decimals: DECIMAL_SHIFT
  };

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

  it('should successfully routeFunds to 10 addresses', async () => {
    await main(10, { router, paymentToken, web3, accounts }, true);
  });

  it('should successfully route token Funds to 10 addresses', async () => {
    await main(10, { router, paymentToken, web3, accounts });
  });
});
