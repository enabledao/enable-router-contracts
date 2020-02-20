require('dotenv').config();

const { constants } = require('openzeppelin-test-helpers');

const App = artifacts.require('App');
const Router = artifacts.require('Router');

const ENABLE_ROUTER_PACKAGE = '@enabledao/enable-router-contracts';
const { appCreate, getOZNetworkConfigByName } = require('../../test/helper');

function activeNetwork() {
  const networkIndex = process.argv.lastIndexOf('--network');
  if (networkIndex < 2) {
    return 'development';
  }
  return process.argv[networkIndex + 1];
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
  return router.initialize();
}

module.exports = async () => {
  try {
    const routerAddress = getFactory('Router').address;
    console.log('Router to initialize:', routerAddress);
    const initializeTx = await initializeRouter(routerAddress);
    console.log('initializeTx:', initializeTx.tx);
    console.log(initializeTx.receipt.status ? 'Success!!' : 'Failure...');
  } catch (e) {
    console.error(e);
  }
  process.exit();
};
