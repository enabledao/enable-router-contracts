import Wallet from 'ethereumjs-wallet';
import { networks } from '../truffle-config';
import fs from 'fs';

const generateAccount = function() {
  return Wallet.generate();
};

const generateAccounts = function(count = 1) {
  return new Array(count).fill(' ').map(() => {
    return generateAccount();
  });
};

function resolveNetworkFilename(networkId) {
  return (
    Object.keys(networks).find(n => networks[n].network_id.toString() === networkId.toString()) ||
    `dev-${networkId}`
  );
}

function getAppArtifact() {
  return artifacts.require('App');
}
/*
 *  Get zos config info for specified networkId.
 */
function getOZNetworkConfigByName(networkName) {
  const zosNetworkFile = fs.readFileSync(`./.openzeppelin/${networkName}.json`);
  return JSON.parse(zosNetworkFile);
}

/*
 *  Get zos config info for specified networkId.
 */
function getOZNetworkConfig(networkId) {
  const networkName = resolveNetworkFilename(networkId);
  return getOZNetworkConfigByName(networkName);
}

function getOZProjectConfig() {
  return JSON.parse(fs.readFileSync('./openzeppelin/project.json'));
}

function getAppAddress() {
  const App = getAppArtifact();
  const currentNetworkId = App.network_id;
  const ozNetworkConfig = getOZNetworkConfig(currentNetworkId);
  return ozNetworkConfig.app.address;
}

// Helper function for creating instances via current App contract
async function appCreate(packageName, contractName, admin, data) {
  const App = getAppArtifact();
  const appAddress = getAppAddress();

  const app = await App.at(appAddress);
  const tx = await app.create(packageName, contractName, admin, data);
  const createdEvent = expectEvent.inLogs(tx.logs, 'ProxyCreated');
  return createdEvent.args.proxy;
}

module.exports = {
  appCreate,
  getAppAddress,
  generateAccounts,
  getOZNetworkConfig,
  getOZNetworkConfigByName,
  resolveNetworkFilename
};
