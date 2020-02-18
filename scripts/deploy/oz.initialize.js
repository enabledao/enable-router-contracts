require('dotenv').config();

const App = artifacts.require('App');
const Router = artifacts.require('Router');

const ENABLE_ROUTER_PACKAGE = '@enabledao/enable-router-contracts';
const { constants } = require('openzeppelin-test-helpers');
const { appCreate, getOZNetworkConfigByName } = require('../../test/helper');

function activeNetwork() {
  const networkIndex = process.argv.lastIndexOf('--network');
  if (networkIndex < 2) {
    return 'development';
  }
  return process.argv[networkIndex + 1];
}

function givenPauser(accounts) {
  const pauserIndex = process.argv.lastIndexOf('--pauser');
  if (pauserIndex < 2) {
    return constants.ZERO_ADDRESS;
  }
  const pauser = process.argv[pauserIndex + 1];
  return +pauser == pauser ? accounts[pauser] : pauser;
}

function activeNetworkName() {
  return activeNetwork() === 'development' ? `dev-${App.network_id}` : activeNetwork();
}

function getFactory(contract) {
  const ozNetworkConfig = getOZNetworkConfigByName(activeNetworkName());
  const factories = ozNetworkConfig.proxies[`${ENABLE_ROUTER_PACKAGE}/${contract}`];
  return factories[factories.length - 1];
}

async function initializeRouter(routerAddress, pauser) {
  const router = await Router.at(routerAddress);
  return router.initialize(pauser);
}

module.exports = async () => {
  try {
    const accounts = await web3.eth.getAccounts();
    const routerAddress = getFactory('Router').address;
    console.log('Router to initialize:', routerAddress);
    console.log('pauser:', givenPauser(accounts));
    const initializeTx = await initializeRouter(routerAddress, givenPauser(accounts));
    console.log('initializeTx:', initializeTx.tx);
    console.log(initializeTx.receipt.status ? 'Success!!' : 'Failure...');
  } catch (e) {
    console.error(e);
  }
  process.exit();
};
