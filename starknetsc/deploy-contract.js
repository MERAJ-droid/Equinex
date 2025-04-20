const { Provider, Account, Contract, stark, uint256, shortString } = require("starknet");
const fs = require("fs");

async function deployContract() {
  // Initialize provider
  const provider = new Provider({ sequencer: { network: "sepolia-testnet" } });
  
  // Initialize account with your private key
  const privateKey = "0x0319eee5239dcbc36233c26d3abd37aa23abc2a9be2afd3e0d8c8a52e18e4b8d"; // Replace with your actual private key
  const accountAddress = "0x012a63c2F6f70DEaf46DCEcb579F513d32B609F3FbbbCc07e9B35a659b4a34B9"; // Replace with your wallet address
  
  const account = new Account(provider, accountAddress, privateKey);
  
  // Deployment parameters from your ArgentX wallet
  const classHash = "0x036078334509b514626504edc9fb252328d1a240e4e948bef8d0c08dff45927f";
  const constructorCalldata = [
    "0", 
    "1834393531443047863796586356486846464529608331973590844453152574398117942281", 
    "0", 
    "0", 
    "2819611878561038782234987028836065990456106670432080199293085121446959629452"
  ];
  const salt = stark.randomAddress(); // Generate a new salt
  const expectedAddress = "0x012a63c2f6f70deaf46dcecb579f513d32b609f3fbbbcc07e9b35a659b4a34b9";
  
  console.log("Deploying contract...");
  
  try {
    // Deploy the contract
    const deployResponse = await account.deployContract({
      classHash,
      constructorCalldata,
      salt,
      unique: true
    });
    
    console.log("Deployment transaction hash:", deployResponse.transaction_hash);
    
    // Wait for the transaction to be confirmed
    console.log("Waiting for transaction to be confirmed...");
    await provider.waitForTransaction(deployResponse.transaction_hash);
    
    console.log("Contract deployed successfully!");
    console.log("Contract Address:", deployResponse.contract_address);
    
    // Verify the address matches the expected address
    if (deployResponse.contract_address.toLowerCase() === expectedAddress.toLowerCase()) {
      console.log("✅ Contract address matches the expected address");
    } else {
      console.log("⚠️ Contract address does not match the expected address");
      console.log("Expected:", expectedAddress);
      console.log("Actual:", deployResponse.contract_address);
    }
    
    // Save the deployment info to a file
    const deploymentInfo = {
      contractAddress: deployResponse.contract_address,
      transactionHash: deployResponse.transaction_hash,
      classHash: classHash,
      salt: salt,
      constructorCalldata: constructorCalldata,
      timestamp: new Date().toISOString()
    };
    
    fs.writeFileSync(
      "deployment-result.json",
      JSON.stringify(deploymentInfo, null, 2)
    );
    
    console.log("Deployment info saved to deployment-result.json");
    
    return deployResponse.contract_address;
  } catch (error) {
    console.error("Deployment failed:", error);
    throw error;
  }
}

deployContract()
  .then((contractAddress) => {
    console.log("Deployment completed with contract address:", contractAddress);
    process.exit(0);
  })
  .catch((error) => {
    console.error("Deployment script failed:", error);
    process.exit(1);
  });
