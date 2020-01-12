require('@babel/register');
require('@babel/polyfill');
const networks = require('./networks.js');

// Create your own key for Production environments (https://infura.io/)

module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!
  networks: networks.networks,
  mocha: {
    reporter: 'eth-gas-reporter',
    useColors: true
  },
  compilers: {
    solc: {
      version: '0.5.11'
    }
  }
};
