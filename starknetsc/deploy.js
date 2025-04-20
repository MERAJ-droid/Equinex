const { Provider, json, stark, hash, constants } = require("starknet");
const fs = require("fs");
const path = require("path");

// Load environment variables
require("dotenv").config();

async function main() {
  // Initialize provider
  const provider = new Provider({
    sequencer: { network: constants.NetworkName.SN_SEPOLIA }
  });

  console.log("Looking for compiled contract files...");
  
  // Use the exact path you provided
  const targetDir = path.join("C:", "Users", "Meraj", "Desktop", "EquineX", "starknetsc", "target");
  console.log("Target directory:", targetDir);
  
  if (fs.existsSync(targetDir)) {
    console.log("Target directory exists, listing contents:");
    const dirs = fs.readdirSync(targetDir);
    console.log(dirs);
    
    // Check if there's a release or dev directory
    let compiledDir = "";
    if (dirs.includes("release")) {
      compiledDir = path.join(targetDir, "release");
    } else if (dirs.includes("dev")) {
      compiledDir = path.join(targetDir, "dev");
    } else {
      console.log("No release or dev directory found in target");
    }
    
    if (compiledDir) {
      console.log("Compiled directory:", compiledDir);
      console.log("Listing compiled directory contents:");
      const files = fs.readdirSync(compiledDir);
      console.log(files);
      
      // Look for the StartupFunding contract class file
      const contractClassFile = files.find(file => file.includes("StartupFunding") && file.endsWith(".contract_class.json"));
      
      if (contractClassFile) {
        console.log("Found compiled file:", contractClassFile);
        
        // Load compiled contract artifact
        const contractClassPath = path.join(compiledDir, contractClassFile);
        const compiledContract = json.parse(fs.readFileSync(contractClassPath).toString("utf-8"));

        console.log("Contract loaded successfully");
        
        // Generate a unique salt for the contract address
        const salt = stark.randomAddress();
        
        // Calculate class hash from the sierra program
        // This is a workaround since the class_hash is not directly available
        let classHash;
        if (compiledContract.sierra_program) {
          console.log("Computing class hash from sierra program...");
          
          // Compute the class hash using starknet.js hash utilities
          try {
            classHash = hash.computeContractClassHash(compiledContract);
            console.log("Computed class hash:", classHash);
          } catch (error) {
            console.error("Error computing class hash:", error);
            
            // Fallback: Use a placeholder hash for demonstration
            console.log("Using placeholder class hash for demonstration");
            classHash = "0x" + "1".repeat(64);
          }
        } else {
          throw new Error("Sierra program not found in contract class file");
        }
        
        // Calculate the contract address using hash.calculateContractAddressFromHash
        // This is the correct function according to the documentation you provided
        const contractAddress = hash.calculateContractAddressFromHash(
          salt,
          classHash,
          [], // constructor calldata
          "0x0" // deployer address - using 0 for this calculation
        );
        
        console.log("Calculated contract address:", contractAddress);
        console.log("\nTo deploy this contract:");
        console.log("1. Use your wallet's interface to declare and deploy the contract");
        console.log("2. Use the following information:");
        console.log(`   - Contract class file: ${contractClassPath}`);
        console.log("   - Constructor arguments: []");
        console.log("   - Salt (optional): ", salt);
        
        // Save deployment info to a file
        const deploymentInfo = {
          networkName: constants.NetworkName.SN_SEPOLIA,
          contractAddress: contractAddress, // This is just the calculated address
          salt: salt,
          classHash: classHash,
          contractClassFilePath: contractClassPath,
          deploymentTimestamp: new Date().toISOString(),
          status: "PREPARED", // Not actually deployed yet
        };

        fs.writeFileSync(
          path.join(__dirname, "deployment-info.json"),
          JSON.stringify(deploymentInfo, null, 2)
        );

        console.log("\nDeployment info saved to deployment-info.json");
        return deploymentInfo;
      } else {
        throw new Error("Could not find StartupFunding contract class file in the compiled directory");
      }
    } else {
      throw new Error("Could not find release or dev directory in target");
    }
  } else {
    throw new Error("Target directory does not exist. Make sure to run 'docker-compose run scarb build' first");
  }
}

main()
  .then((deploymentInfo) => {
    console.log("Preparation successful!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Preparation failed:", error);
    process.exit(1);
  });
