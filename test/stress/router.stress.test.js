/**
 * This file stress tests the Priority Queue implementation to get
 * data for submitting 10, 50, 100, 125, 150, 175, 200 1000, 10000 addresses to the router
 */
import { balance, BN, constants, expectRevert, time } from 'openzeppelin-test-helpers';
import { generateAccounts } from '../helper';

const Router = artifacts.require('Router');
const PaymentToken = artifacts.require('StandaloneERC20');

const VERBOSE = true;
const TOKEN_DECIMALS = new BN(18);
const DECIMAL_SHIFT = new BN(10).pow(TOKEN_DECIMALS);

const log = (...msgs) => {
  if (VERBOSE) {
    msgs.map(msg => console.log(msg));
  }
};

const printLine = () => {
  log('--_--'.repeat(3));
};

const printNewLine = () => {
  log('\n');
};
const weiValue = eth => web3.utils.toWei(eth);

const main = async (
  count,
  { router, paymentToken, web3, accounts },
  ethRoute,
  allOrNone = false
) => {
  printNewLine();

  const list = generateAccounts(count).map(wallet => wallet.getChecksumAddressString());

  let most = 0;
  let sum = 0;
  const stressStart = new Date().getTime();

  log(`Route : to ${count} Addresses`);
  printLine();

  const amount = DECIMAL_SHIFT.mul(new BN(1)).div(new BN(100));
  const routeParams = [count, list, list.map(() => amount)];
  const etherRouteParams = [constants.ZERO_ADDRESS, ...routeParams];
  const tokenRouteParams = [paymentToken.address, ...routeParams];

  const total = routeParams[2].reduce((a, b) => a.add(b), new BN(0));

  const contractFunction = allOrNone ? 'routeAllorNoneFunds' : 'routeFunds';

  if (ethRoute) {
    //ETH test route
    log(`ETH route`);
    const userBalance = await balance.current(accounts[0]);
    // expect(userBalance).to.be.bignumber.gte(total, 'Insufficient funds on account');

    const balances = await Promise.all(etherRouteParams[2].map(user => balance.current(user)));
    await router[contractFunction](...etherRouteParams, { value: total });

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
    await router[contractFunction](...tokenRouteParams);

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

  it('should successfully routeFunds to 100 addresses', async () => {
    await main(100, { router, paymentToken, web3, accounts }, true);
  });

  it('should successfully route token Funds to 100 addresses', async () => {
    await main(100, { router, paymentToken, web3, accounts });
  });

  it('should successfully routeFunds to 175 addresses', async () => {
    await main(175, { router, paymentToken, web3, accounts }, true);
  });

  it('should successfully route token Funds to 165 addresses', async () => {
    await main(165, { router, paymentToken, web3, accounts });
  });

  it('should successfully routeFunds to 191 addresses', async () => {
    await main(191, { router, paymentToken, web3, accounts }, true);
  });

  it('should successfully route token Funds to 166 addresses', async () => {
    await main(166, { router, paymentToken, web3, accounts });
  });

  it('should successfully routeAllorNoneFunds to 10 addresses', async () => {
    await main(10, { router, paymentToken, web3, accounts }, true, true);
  });

  it('should successfully routeAllorNoneFunds token Funds to 10 addresses', async () => {
    await main(10, { router, paymentToken, web3, accounts }, null, true);
  });

  it('should successfully routeAllorNoneFunds to 100 addresses', async () => {
    await main(100, { router, paymentToken, web3, accounts }, true, true);
  });

  it('should successfully routeAllorNone token Funds to 100 addresses', async () => {
    await main(100, { router, paymentToken, web3, accounts }, null, true);
  });

  it('should successfully routeAllorNoneFunds to 175 addresses', async () => {
    await main(175, { router, paymentToken, web3, accounts }, true, true);
  });

  it('should successfully routeAllorNone token Funds to 165 addresses', async () => {
    await main(165, { router, paymentToken, web3, accounts }, null, true);
  });

  it('should successfully routeAllorNoneFunds to 191 addresses', async () => {
    await main(191, { router, paymentToken, web3, accounts }, true, true);
  });

  it('should successfully routeAllorNone token Funds to 166 addresses', async () => {
    await main(166, { router, paymentToken, web3, accounts });
  });
});
