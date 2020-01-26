import Wallet from 'ethereumjs-wallet';

const generateAccount = function() {
  return Wallet.generate();
};

const generateAccounts = function(count = 1) {
  return new Array(count).fill(' ').map(() => {
    return generateAccount();
  });
};

module.exports = {
  generateAccounts
};
