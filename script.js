const connectBtn = document.getElementById('connectBtn');
const deployBtn = document.getElementById('deployBtn');
const statusEl = document.getElementById('status');
const loadingEl = document.getElementById('loading');
const resultEl = document.getElementById('result');
const copyBtn = document.getElementById('copyBtn');

const ZENCHAIN_CHAIN_ID = 8408;
const ZTC_BYTECODE = "0x608060405234801561001057600080fd5b5060405161010038038061010083398101604090815281516020808301518382015181600052602060002090601f016020900481019282601f1061007257805160ff19168380011785556100a4565b828001600101855582156100a4579182015b828111156100a3578251825591602001919060010190610088565b5b5090506100b191906100b5565b5090565b6100c791905b808211156100c35760008160009055506001016100ab565b5090565b90565b610173806100d36000396000f3fe60806040526004361061003f5760003560e01c806370a082311461004457806...";
const ZTC_ABI = []; // فارغ لأن Deploy مباشر بلا args

let provider;
let signer;

async function connectWallet() {
  try {
    if (!window.ethereum) throw new Error("No Ethereum wallet found. Install MetaMask or Rabby.");

    // هذا السطر هو اللي يطلق نافذة المحفظة
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    const userAddress = accounts[0];

    // التأكد من الشبكة
    const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
    const chainId = parseInt(chainIdHex, 16);

    if (chainId !== ZENCHAIN_CHAIN_ID) {
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x' + ZENCHAIN_CHAIN_ID.toString(16) }]
        });
      } catch (switchErr) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: '0x' + ZENCHAIN_CHAIN_ID.toString(16),
            chainName: 'ZenChain Testnet',
            nativeCurrency: { name: 'ZTC', symbol: 'ZTC', decimals: 18 },
            rpcUrls: ['https://zenchain-testnet.api.onfinality.io/public'],
            blockExplorerUrls: ['https://explorer.zenchain.io/']
          }]
        });
      }
    }

    // بعد ما يتأكد من الشبكة، نربط signer و provider
    provider = new ethers.BrowserProvider(window.ethereum);
    signer = await provider.getSigner();

    statusEl.innerText = 'Connected: ' + userAddress;
    connectBtn.innerText = 'Wallet Connected ✅';
  } catch (err) {
    statusEl.innerText = 'Connect error: ' + (err.message || err);
  }
}

async function deployContract() {
  try {
    if (!signer) await connectWallet();

    loadingEl.style.display = 'block';
    resultEl.style.display = 'none';
    copyBtn.style.display = 'none';

    const factory = new ethers.ContractFactory(ZTC_ABI, ZTC_BYTECODE, signer);
    const contract = await factory.deploy();

    statusEl.innerText = `Tx sent: ${contract.deployTransaction.hash}`;
    await contract.wait();

    loadingEl.style.display = 'none';
    resultEl.style.display = 'block';
    copyBtn.style.display = 'inline-block';
    resultEl.innerText = `Contract Address: ${contract.address}\nTx Hash: ${contract.deployTransaction.hash}`;

    copyBtn.onclick = () => navigator.clipboard.writeText(resultEl.innerText);
  } catch (err) {
    loadingEl.style.display = 'none';
    statusEl.innerText = 'Deploy error: ' + (err.message || err);
  }
}

connectBtn.onclick = connectWallet;
deployBtn.onclick = deployContract;

// تحديث عند تغيير الحساب أو الشبكة
if (window.ethereum) {
  window.ethereum.on('accountsChanged', () => connectWallet());
  window.ethereum.on('chainChanged', () => window.location.reload());
}
