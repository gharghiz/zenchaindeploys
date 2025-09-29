(async () => {
  const connectBtn = document.getElementById('connectBtn');
  const deployBtn = document.getElementById('deployBtn');
  const ctorInput = document.getElementById('ctorInput');
  const statusEl = document.getElementById('status');
  const loadingEl = document.getElementById('loading');
  const resultEl = document.getElementById('result');
  const copyBtn = document.getElementById('copyBtn');

  const ZENCHAIN_CHAIN_ID = 8408;
  const ZTC_BYTECODE = "0x608060405234801561001057600080fd5b5060405161010038038061010083398101604090815281516020808301518382015181600052602060002090601f016020900481019282601f1061007257805160ff19168380011785556100a4565b828001600101855582156100a4579182015b828111156100a3578251825591602001919060010190610088565b5b5090506100b191906100b5565b5090565b6100c791905b808211156100c35760008160009055506001016100ab565b5090565b90565b610173806100d36000396000f3fe60806040526004361061003f5760003560e01c806370a082311461004457806370a08231146100c4578063a9059cbb146100f0575b600080fd5b34801561005057600080fd5b506100596100fe565b604051610066919061017c565b60405180910390f35b3480156100d057600080fd5b506100d961010a565b6040516100e6919061017c565b60405180910390f35b3480156100fc57600080fd5b50610105610130565b604051610112919061017c565b60405180910390f35b6000816000905550600054600160a060020a031681565b600081600090555060008054600160a060020a031681565b60008135905061014f8161016e565b92915050565b60006020828403121561016b5761016a610169565b5b600061017984828501610140565b91505092915050565b600080fd5b61018d81610165565b811461019857600080fd5b50565b6000813590506101aa81610184565b92915050565b6000602082840312156101c6576101c5610169565b5b60006101d4848285016101a1565b91505092915050565b6101e681610173565b82525050565b600060208201905061020160008301846101dd565b92915050565b600081519050919050565b6000819050919050565b610221816101fe565b811461022c57600080fd5b50565b60008135905061023e81610218565b92915050565b600080fd5b61025281610165565b811461025d57600080fd5b5056fea2646970667358221220c6c4d8f27aa6f5f47b7ecf2eaffed5f12211a3b2b76f5941216f2aa7f4fa146064736f6c63430008090033";
  const ZTC_ABI = [];

  let provider = null;
  let signer = null;
  let userAddress = null;

  function parseCtorInput(text) {
    if (!text) return null;
    try {
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) throw new Error('Constructor args must be a JSON array');
      return parsed;
    } catch (err) {
      throw new Error('Constructor args JSON invalid: ' + (err.message || err));
    }
  }

  async function connectWallet() {
    try {
      if (!window.ethereum) throw new Error('MetaMask not found');
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
      const chainId = parseInt(chainIdHex, 16);
      if (chainId !== ZENCHAIN_CHAIN_ID) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x' + ZENCHAIN_CHAIN_ID.toString(16) }]
          });
        } catch (switchErr) {
          try {
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
          } catch (addErr) { throw addErr; }
        }
      }
      provider = new ethers.BrowserProvider(window.ethereum);
      signer = await provider.getSigner();
      userAddress = await signer.getAddress();
      statusEl.innerText = 'Connected: ' + userAddress;
      connectBtn.innerText = 'Wallet Connected';
    } catch (err) {
      statusEl.innerText = 'Connect error: ' + (err.message || err);
    }
  }

  async function deployContract() {
    try {
      if (!signer) await connectWallet();
      const ctorArgs = parseCtorInput(ctorInput.value) || [];
      loadingEl.style.display = 'block';
      resultEl.style.display = 'none';
      copyBtn.style.display = 'none';
      const factory = new ethers.ContractFactory(ZTC_ABI, ZTC_BYTECODE, signer);
      const contract = await factory.deploy(...ctorArgs);
      statusEl.innerText = `Tx sent: ${contract.deployTransaction.hash}`;
      await contract.wait();
      loadingEl.style.display = 'none';
      resultEl.style.display = 'block';
      copyBtn.style.display = 'inline-block';
      resultEl.innerText = `Contract Address: ${contract.target || contract.address}\nTx Hash: ${contract.deployTransaction.hash}`;
      copyBtn.onclick = () => navigator.clipboard.writeText(resultEl.innerText);
    } catch (err) {
      loadingEl.style.display = 'none';
      statusEl.innerText = 'Deploy error: ' + (err.message || err);
    }
  }

  connectBtn.onclick = connectWallet;
  deployBtn.onclick = deployContract;
})();