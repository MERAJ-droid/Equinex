"use client";

import React, { createContext, useContext, ReactNode, useEffect, useState } from "react";
import { Provider, Contract, Account, stark } from "starknet";
import StartupFundingABI from "@/abi/StartupFunding.json";
import { uploadToIPFS } from "@/services/ipfs";

const STARKNET_CONTRACT_ADDRESS = "0x2ffc54642a077281f1af9a0dee27de490d988dbd8d4e99b0bd677f053a9a876";

interface StarknetContextType {
  address: string | null; 
  starknetAddress: string;
  starknetContract: any;
  starknetAccount: any;
  starknetProvider: Provider | null;
  connectStarknet: () => Promise<void>;
  createStartup: (title: string, description: string, target: string) => Promise<void>;
  createStartupCampaign: (
    title: string,
    description: string,
    target: string,
    deadline: number,
    image: string,
    video: string,
    equityHolders: { name: string; percentage: bigint }[]
  ) => Promise<void>; // Add this line
  fundStartup: (startupId: number, amount: string) => Promise<void>;
  withdrawStartupFunds: (startupId: number) => Promise<void>; 
  addStartupDocument: (startupId: number, file: File, documentType: string) => Promise<string>;
  getStartupDocuments: (startupId: number) => Promise<any[]>;
  createMilestone: (startupId: number, title: string, description: string, fundAmount: string) => Promise<void>;
  completeMilestone: (startupId: number, milestoneId: number, proofFile: File) => Promise<void>;
  verifyStartup: (startupId: number) => Promise<void>;
  applyForLoan: (amount: string, purpose: string, name: string, duration: number) => Promise<void>;
  fundLoan: (loanId: number, amount: string) => Promise<void>;
  withdrawLoanFunds: (loanId: number) => Promise<void>;
  repayLoan: (loanId: number, amount: string) => Promise<void>;
  getLoanRequests: () => Promise<any[]>;
  createIPAsset: (params: any) => Promise<void>;
  fundIPAsset: (ipAssetId: number, amount: string) => Promise<void>;
  withdrawIPAssetFunds: (ipAssetId: number) => Promise<void>;
  addIPAssetDocument: (ipAssetId: number, file: File, documentType: string) => Promise<string>;
  getIPAssetDocuments: (ipAssetId: number) => Promise<any[]>;
  updateIPAssetMetadata: (ipAssetId: number, updatedMetadata: any) => Promise<boolean>;
  verifyIPAsset: (ipAssetId: number) => Promise<void>;
  getCampaigns: () => Promise<any[]>;
  getInvestorTokens: (investorAddress?: string) => Promise<any[]>;
  hasInvestedInStartup: (startupId: number) => Promise<boolean>;
  getInvestmentAmount: (startupId: number) => Promise<string>;
  refundInvestment: (startupId: number) => Promise<void>;
  submitVerificationRequest: (name: string, email: string, contactInfo: string, socialLink: string) => Promise<void>;
  getVerificationStatus: (address?: string) => Promise<"unverified" | "pending" | "approved" | "rejected">;
  isUserVerified: (address?: string) => Promise<boolean>;
  approveVerificationRequest: (address: string) => Promise<void>;
  rejectVerificationRequest: (address: string) => Promise<void>;
  getAllVerificationRequests: () => Promise<any[]>;
  getVerifiedUsers: () => Promise<any[]>;
  isLoading: boolean;
}

const StarknetContext = createContext<StarknetContextType | undefined>(undefined);

export const StarknetContextProvider = ({ children }: { children: ReactNode }) => {
  const [starknetAddress, setStarknetAddress] = useState<string>("");
  const [starknetContract, setStarknetContract] = useState<any>(null);
  const [starknetAccount, setStarknetAccount] = useState<any>(null);
  const [starknetProvider, setStarknetProvider] = useState<Provider | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    console.log("StartupFunding ABI:", StartupFundingABI); 
    const initializeStarknet = async () => {
      try {
        const provider = new Provider({ sequencer: { network: "sepolia-testnet" } });
        setStarknetProvider(provider);
  
        if (provider) {
          const contract = new Contract(StartupFundingABI, STARKNET_CONTRACT_ADDRESS, provider);
          setStarknetContract(contract);
          console.log("StarkNet contract initialized", contract);
        }
      } catch (error) {
        console.error("Error initializing Starknet provider:", error);
      }
    };
  
    initializeStarknet();
  }, []);

const [walletBalance, setWalletBalance] = useState<string | null>(null);

const connectStarknet = async () => {
  try {
    if (!window.starknet) {
      alert("Please install ArgentX or another StarkNet wallet extension");
      return;
    }

    await window.starknet.enable();
    const userWalletAddress = window.starknet.selectedAddress;

    if (!userWalletAddress) {
      console.error("No wallet address found");
      return;
    }

    setStarknetAddress(userWalletAddress);

    if (!starknetProvider) {
      console.error("StarkNet provider not initialized");
      return;
    }

    const contract = new Contract(StartupFundingABI, STARKNET_CONTRACT_ADDRESS, starknetProvider);
    const account = new Account(starknetProvider, userWalletAddress, window.starknet.provider);

    setStarknetAccount(account);
    contract.connect(account);
    setStarknetContract(contract);

    console.log("Connected to StarkNet wallet", userWalletAddress);
    console.log("StarkNet contract initialized", contract);
  } catch (error) {
    console.error("Error connecting to StarkNet wallet:", error);
  }
};

  

  const createStartup = async (title: string, description: string, target: string): Promise<void> => {
    if (!starknetContract || !starknetAccount) {
      console.error("StarkNet contract or account not initialized");
      return;
    }
  
    try {
      setIsLoading(true);
      const response = await starknetContract.create_startup(
        stark.shortStringToBigInt(title),
        stark.shortStringToBigInt(description),
        BigInt(Math.floor(parseFloat(target) * 10 ** 18)) // Convert target to wei
      );
      await starknetProvider?.waitForTransaction(response.transaction_hash);
      console.log("Startup created successfully", response);
    } catch (error) {
      console.error("Error creating startup:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const createStartupCampaign = async (
    title: string,
    description: string,
    target: string,
    deadline: number,
    image: string,
    video: string,
    equityHolders: { name: string; percentage: bigint }[]
  ): Promise<void> => {
    if (!starknetContract || !starknetAccount) {
      console.error("StarkNet contract or account not initialized");
      return;
    }
  
    try {
      setIsLoading(true);
  
      // Serialize equity holders into a string
      const equityHoldersString = JSON.stringify(
        equityHolders.map((holder) => ({
          name: holder.name,
          percentage: holder.percentage.toString(),
        }))
      );
  
      // Append metadata to the description
      const metadata = {
        deadline: new Date(deadline).toISOString(),
        image,
        video,
        equityHolders: equityHoldersString,
      };
      const metadataString = JSON.stringify(metadata);
      const fullDescription = `${description} #METADATA:${metadataString}#`;
  
      // Call the smart contract's `create_startup` function
      const response = await starknetContract.create_startup(
        stark.shortStringToBigInt(title),
        stark.shortStringToBigInt(fullDescription),
        BigInt(Math.floor(parseFloat(target) * 10 ** 18)) // Convert target to wei
      );
  
      // Wait for the transaction to be confirmed
      await starknetProvider?.waitForTransaction(response.transaction_hash);
      console.log("Startup campaign created successfully", response);
    } catch (error) {
      console.error("Error creating startup campaign:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fundStartup = async (startupId: number, amount: string): Promise<void> => {
    if (!starknetContract || !starknetAccount) {
      console.error("StarkNet contract or account not initialized");
      return;
    }
  
    try {
      setIsLoading(true);
      const response = await starknetContract.fund_startup(
        BigInt(startupId),
        BigInt(Math.floor(parseFloat(amount) * 10 ** 18)) // Convert amount to wei
      );
      await starknetProvider?.waitForTransaction(response.transaction_hash);
      console.log("Startup funded successfully", response);
    } catch (error) {
      console.error("Error funding startup:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const addStartupDocument = async (startupId: number, file: File, documentType: string): Promise<string> => {
    if (!starknetContract || !starknetAccount) {
      console.error("StarkNet contract or account not initialized");
      return "";
    }
  
    try {
      setIsLoading(true);
      const ipfsHash = await uploadToIPFS(file); // Upload file to IPFS
      const response = await starknetContract.add_startup_document(
        BigInt(startupId),
        stark.shortStringToBigInt(ipfsHash),
        stark.shortStringToBigInt(documentType)
      );
      await starknetProvider?.waitForTransaction(response.transaction_hash);
      console.log("Document added successfully", response);
      return ipfsHash;
    } catch (error) {
      console.error("Error adding document:", error);
      return "";
    } finally {
      setIsLoading(false);
    }
  };
  
  const getStartupDocuments = async (startupId: number): Promise<any[]> => {
    if (!starknetContract) {
      console.error("StarkNet contract not initialized");
      return [];
    }
  
    try {
      setIsLoading(true);
      const documentCount = await starknetContract.get_document_count(BigInt(startupId));
      const documents = [];
  
      for (let i = 0; i < Number(documentCount); i++) {
        const ipfsHash = await starknetContract.get_document_hash(BigInt(startupId), BigInt(i));
        const documentType = await starknetContract.get_document_type(BigInt(startupId), BigInt(i));
        documents.push({
          ipfsHash: stark.bigIntToShortString(ipfsHash),
          documentType: stark.bigIntToShortString(documentType),
        });
      }
  
      return documents;
    } catch (error) {
      console.error("Error fetching documents:", error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };
  
  const createMilestone = async (
    startupId: number,
    title: string,
    description: string,
    fundAmount: string
  ): Promise<void> => {
    if (!starknetContract || !starknetAccount) {
      console.error("StarkNet contract or account not initialized");
      return;
    }
  
    try {
      setIsLoading(true);
      const response = await starknetContract.add_startup_milestone(
        BigInt(startupId),
        stark.shortStringToBigInt(title),
        stark.shortStringToBigInt(description),
        BigInt(Math.floor(parseFloat(fundAmount) * 10 ** 18)) // Convert fundAmount to wei
      );
      await starknetProvider?.waitForTransaction(response.transaction_hash);
      console.log("Milestone created successfully", response);
    } catch (error) {
      console.error("Error creating milestone:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const completeMilestone = async (startupId: number, milestoneId: number, proofFile: File): Promise<void> => {
    if (!starknetContract || !starknetAccount) {
      console.error("StarkNet contract or account not initialized");
      return;
    }
  
    try {
      setIsLoading(true);
      const proofHash = await uploadToIPFS(proofFile); // Upload proof file to IPFS
      const response = await starknetContract.complete_milestone(
        BigInt(startupId),
        BigInt(milestoneId),
        stark.shortStringToBigInt(proofHash)
      );
      await starknetProvider?.waitForTransaction(response.transaction_hash);
      console.log("Milestone completed successfully", response);
    } catch (error) {
      console.error("Error completing milestone:", error);
    } finally {
      setIsLoading(false);
    }
  };
const verifyStartup = async (startupId: number): Promise<void> => {
  if (!starknetContract || !starknetAccount) {
    console.error("StarkNet contract or account not initialized");
    return;
  }

  try {
    setIsLoading(true);
    const response = await starknetContract.verify_startup(BigInt(startupId));
    await starknetProvider?.waitForTransaction(response.transaction_hash);
    console.log("Startup verified successfully", response);
  } catch (error) {
    console.error("Error verifying startup:", error);
  } finally {
    setIsLoading(false);
  }
};

const applyForLoan = async (
  amount: string,
  purpose: string,
  name: string,
  duration: number
): Promise<void> => {
  if (!starknetContract || !starknetAccount) {
    console.error("StarkNet contract or account not initialized");
    return;
  }

  try {
    setIsLoading(true);
    const response = await starknetContract.request_loan(
      stark.shortStringToBigInt(name),
      stark.shortStringToBigInt(purpose),
      BigInt(Math.floor(parseFloat(amount) * 10 ** 18)), // Convert amount to wei
      BigInt(duration)
    );
    await starknetProvider?.waitForTransaction(response.transaction_hash);
    console.log("Loan application submitted successfully", response);
  } catch (error) {
    console.error("Error applying for loan:", error);
  } finally {
    setIsLoading(false);
  }
};

const fundLoan = async (loanId: number, amount: string): Promise<void> => {
  if (!starknetContract || !starknetAccount) {
    console.error("StarkNet contract or account not initialized");
    return;
  }

  try {
    setIsLoading(true);
    const response = await starknetContract.fund_loan(
      BigInt(loanId),
      BigInt(Math.floor(parseFloat(amount) * 10 ** 18)) // Convert amount to wei
    );
    await starknetProvider?.waitForTransaction(response.transaction_hash);
    console.log("Loan funded successfully", response);
  } catch (error) {
    console.error("Error funding loan:", error);
  } finally {
    setIsLoading(false);
  }
};

const withdrawLoanFunds = async (loanId: number): Promise<void> => {
  if (!starknetContract || !starknetAccount) {
    console.error("StarkNet contract or account not initialized");
    return;
  }

  try {
    setIsLoading(true);
    const response = await starknetContract.withdraw_funds(BigInt(loanId));
    await starknetProvider?.waitForTransaction(response.transaction_hash);
    console.log("Loan funds withdrawn successfully", response);
  } catch (error) {
    console.error("Error withdrawing loan funds:", error);
  } finally {
    setIsLoading(false);
  }
};

const repayLoan = async (loanId: number, amount: string): Promise<void> => {
  if (!starknetContract || !starknetAccount) {
    console.error("StarkNet contract or account not initialized");
    return;
  }

  try {
    setIsLoading(true);
    const response = await starknetContract.repay_loan(
      BigInt(loanId),
      BigInt(Math.floor(parseFloat(amount) * 10 ** 18)) // Convert amount to wei
    );
    await starknetProvider?.waitForTransaction(response.transaction_hash);
    console.log("Loan repaid successfully", response);
  } catch (error) {
    console.error("Error repaying loan:", error);
  } finally {
    setIsLoading(false);
  }
};

const getLoanRequests = async (): Promise<any[]> => {
  if (!starknetContract) {
    console.error("StarkNet contract not initialized");
    return [];
  }

  try {
    setIsLoading(true);
    const loanCount = await starknetContract.get_loan_request_count();
    const loans = [];

    for (let i = 0; i < Number(loanCount); i++) {
      const loan = await starknetContract.get_loan_request(BigInt(i));
      loans.push({
        requester: loan.requester,
        name: stark.bigIntToShortString(loan.name),
        purpose: stark.bigIntToShortString(loan.purpose),
        amount: (Number(loan.amount) / 10 ** 18).toString(), // Convert from wei
        duration: Number(loan.duration),
        amountCollected: (Number(loan.amount_collected) / 10 ** 18).toString(), // Convert from wei
        repaid: loan.repaid,
      });
    }

    return loans;
  } catch (error) {
    console.error("Error fetching loan requests:", error);
    return [];
  } finally {
    setIsLoading(false);
  }
};
const createIPAsset = async (params: {
  owner: string;
  title: string;
  description: string;
  category: string;
  status: string;
  equityHolders: any[];
  image: string;
  video: string;
  target: string;
  deadline: string;
  registrationNumber: string;
  filingDate: string;
  jurisdiction: string;
  expirationDate: string;
  inventors: string;
  applications: string[];
}): Promise<void> => {
  if (!starknetContract || !starknetAccount) {
    console.error("StarkNet contract or account not initialized");
    return;
  }

  try {
    setIsLoading(true);

    // Create metadata object
    const metadata = {
      category: params.category,
      status: params.status,
      registrationNumber: params.registrationNumber,
      filingDate: params.filingDate,
      jurisdiction: params.jurisdiction,
      expirationDate: params.expirationDate,
      inventors: params.inventors,
      applications: params.applications,
    };

    // Serialize metadata and append to description
    const metadataString = JSON.stringify(metadata);
    const ipDescription = `${params.description} #IP_ASSET #IPMETADATA:${metadataString}#`;
    const ipTitle = `IP: ${params.title}`;

    // Call the create_startup function for IP assets
    const response = await starknetContract.create_startup(
      stark.shortStringToBigInt(ipTitle),
      stark.shortStringToBigInt(ipDescription),
      BigInt(Math.floor(parseFloat(params.target) * 10 ** 18)) // Convert target to wei
    );

    await starknetProvider?.waitForTransaction(response.transaction_hash);
    console.log("IP Asset created successfully", response);
  } catch (error) {
    console.error("Error creating IP asset:", error);
  } finally {
    setIsLoading(false);
  }
};

const fundIPAsset = async (ipAssetId: number, amount: string): Promise<void> => {
  if (!starknetContract || !starknetAccount) {
    console.error("StarkNet contract or account not initialized");
    return;
  }

  try {
    setIsLoading(true);
    const response = await starknetContract.fund_startup(
      BigInt(ipAssetId),
      BigInt(Math.floor(parseFloat(amount) * 10 ** 18)) // Convert amount to wei
    );
    await starknetProvider?.waitForTransaction(response.transaction_hash);
    console.log("IP Asset funded successfully", response);
  } catch (error) {
    console.error("Error funding IP asset:", error);
  } finally {
    setIsLoading(false);
  }
};

const withdrawIPAssetFunds = async (ipAssetId: number): Promise<void> => {
  if (!starknetContract || !starknetAccount) {
    console.error("StarkNet contract or account not initialized");
    return;
  }

  try {
    setIsLoading(true);
    const response = await starknetContract.withdraw_funds(BigInt(ipAssetId));
    await starknetProvider?.waitForTransaction(response.transaction_hash);
    console.log("IP Asset funds withdrawn successfully", response);
  } catch (error) {
    console.error("Error withdrawing IP asset funds:", error);
  } finally {
    setIsLoading(false);
  }
};

const addIPAssetDocument = async (ipAssetId: number, file: File, documentType: string): Promise<string> => {
  if (!starknetContract || !starknetAccount) {
    console.error("StarkNet contract or account not initialized");
    return "";
  }

  try {
    setIsLoading(true);
    const ipfsHash = await uploadToIPFS(file); // Upload file to IPFS
    const response = await starknetContract.add_startup_document(
      BigInt(ipAssetId),
      stark.shortStringToBigInt(ipfsHash),
      stark.shortStringToBigInt(documentType)
    );
    await starknetProvider?.waitForTransaction(response.transaction_hash);
    console.log("Document added to IP Asset successfully", response);
    return ipfsHash;
  } catch (error) {
    console.error("Error adding document to IP asset:", error);
    return "";
  } finally {
    setIsLoading(false);
  }
};

const withdrawStartupFunds = async (startupId: number): Promise<void> => {
  if (!starknetContract || !starknetAccount) {
    console.error("StarkNet contract or account not initialized");
    return;
  }

  try {
    setIsLoading(true);
    const response = await starknetContract.withdraw_funds(BigInt(startupId));
    await starknetProvider?.waitForTransaction(response.transaction_hash);
    console.log("Funds withdrawn successfully", response);
  } catch (error) {
    console.error("Error withdrawing funds:", error);
  } finally {
    setIsLoading(false);
  }
};

const getIPAssetDocuments = async (ipAssetId: number): Promise<any[]> => {
  if (!starknetContract) {
    console.error("StarkNet contract not initialized");
    return [];
  }

  try {
    setIsLoading(true);
    const documentCount = await starknetContract.get_document_count(BigInt(ipAssetId));
    const documents = [];

    for (let i = 0; i < Number(documentCount); i++) {
      const ipfsHash = await starknetContract.get_document_hash(BigInt(ipAssetId), BigInt(i));
      const documentType = await starknetContract.get_document_type(BigInt(ipAssetId), BigInt(i));
      documents.push({
        ipfsHash: stark.bigIntToShortString(ipfsHash),
        documentType: stark.bigIntToShortString(documentType),
      });
    }

    return documents;
  } catch (error) {
    console.error("Error fetching IP asset documents:", error);
    return [];
  } finally {
    setIsLoading(false);
  }
};

const updateIPAssetMetadata = async (
  ipAssetId: number,
  updatedMetadata: {
    category?: string;
    status?: string;
    registrationNumber?: string;
    filingDate?: string;
    jurisdiction?: string;
    expirationDate?: string;
  }
): Promise<boolean> => {
  if (!starknetContract) {
    console.error("StarkNet contract not initialized");
    return false;
  }

  try {
    setIsLoading(true);

    // Fetch existing documents to extract current metadata
    const documents = await getIPAssetDocuments(ipAssetId);
    const metadataDoc = documents.find((doc) => doc.documentType === "ip_metadata_update");

    let currentMetadata = {};
    if (metadataDoc) {
      const response = await fetch(`https://ipfs.io/ipfs/${metadataDoc.ipfsHash}`);
      currentMetadata = await response.json();
    }

    // Merge current metadata with updated metadata
    const newMetadata = { ...currentMetadata, ...updatedMetadata };

    // Upload updated metadata to IPFS
    const metadataBlob = new Blob([JSON.stringify(newMetadata)], { type: "application/json" });
    const metadataFile = new File([metadataBlob], "metadata.json");
    const ipfsHash = await uploadToIPFS(metadataFile);

    // Add the updated metadata as a document
    await addIPAssetDocument(ipAssetId, metadataFile, "ip_metadata_update");

    console.log("IP Asset metadata updated successfully");
    return true;
  } catch (error) {
    console.error("Error updating IP asset metadata:", error);
    return false;
  } finally {
    setIsLoading(false);
  }
};
const verifyIPAsset = async (ipAssetId: number): Promise<void> => {
  if (!starknetContract || !starknetAccount) {
    console.error("StarkNet contract or account not initialized");
    return;
  }

  try {
    setIsLoading(true);
    const response = await starknetContract.verify_startup(BigInt(ipAssetId));
    await starknetProvider?.waitForTransaction(response.transaction_hash);
    console.log("IP Asset verified successfully", response);
  } catch (error) {
    console.error("Error verifying IP asset:", error);
  } finally {
    setIsLoading(false);
  }
};

const getCampaigns = async (): Promise<any[]> => {
  if (!starknetContract) {
    console.error("StarkNet contract not initialized");
    return [];
  }

  try {
    setIsLoading(true);
    const campaignCount = await starknetContract.get_startup_count();
    const campaigns = [];

    for (let i = 0; i < Number(campaignCount); i++) {
      const campaign = await starknetContract.get_startup(BigInt(i));
      campaigns.push({
        owner: campaign.owner,
        title: stark.bigIntToShortString(campaign.title),
        description: stark.bigIntToShortString(campaign.description),
        target: (Number(campaign.target) / 10 ** 18).toString(), // Convert from wei
        amountCollected: (Number(campaign.amount_collected) / 10 ** 18).toString(), // Convert from wei
        isVerified: campaign.is_verified,
      });
    }

    return campaigns;
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    return [];
  } finally {
    setIsLoading(false);
  }
};

const getInvestorTokens = async (investorAddress?: string): Promise<any[]> => {
  if (!starknetContract) {
    console.error("StarkNet contract not initialized");
    return [];
  }

  try {
    setIsLoading(true);
    const address = investorAddress || starknetAddress;
    const tokenCount = await starknetContract.get_investor_token_count(address);
    const tokens = [];

    for (let i = 0; i < Number(tokenCount); i++) {
      const tokenId = await starknetContract.get_investor_token(address, BigInt(i));
      tokens.push({
        tokenId: tokenId.toString(),
      });
    }

    return tokens;
  } catch (error) {
    console.error("Error fetching investor tokens:", error);
    return [];
  } finally {
    setIsLoading(false);
  }
};

const hasInvestedInStartup = async (startupId: number): Promise<boolean> => {
  if (!starknetContract || !starknetAccount) {
    console.error("StarkNet contract or account not initialized");
    return false;
  }

  try {
    const result = await starknetContract.has_investment_in(
      starknetAddress,
      BigInt(startupId)
    );
    return result;
  } catch (error) {
    console.error("Error checking investment in startup:", error);
    return false;
  }
};

const getInvestmentAmount = async (startupId: number): Promise<string> => {
  if (!starknetContract || !starknetAccount) {
    console.error("StarkNet contract or account not initialized");
    return "0";
  }

  try {
    const amount = await starknetContract.get_investment_amount(
      starknetAddress,
      BigInt(startupId)
    );
    return (Number(amount) / 10 ** 18).toString(); // Convert from wei
  } catch (error) {
    console.error("Error fetching investment amount:", error);
    return "0";
  }
};

const refundInvestment = async (startupId: number): Promise<void> => {
  if (!starknetContract || !starknetAccount) {
    console.error("StarkNet contract or account not initialized");
    return;
  }

  try {
    setIsLoading(true);
    const response = await starknetContract.refund_investment(BigInt(startupId));
    await starknetProvider?.waitForTransaction(response.transaction_hash);
    console.log("Investment refunded successfully", response);
  } catch (error) {
    console.error("Error refunding investment:", error);
  } finally {
    setIsLoading(false);
  }
};
const submitVerificationRequest = async (
  name: string,
  email: string,
  contactInfo: string,
  socialLink: string
): Promise<void> => {
  if (!starknetContract || !starknetAccount) {
    console.error("StarkNet contract or account not initialized");
    return;
  }

  try {
    setIsLoading(true);
    const response = await starknetContract.submit_verification_request(
      stark.shortStringToBigInt(name),
      stark.shortStringToBigInt(email),
      stark.shortStringToBigInt(contactInfo),
      stark.shortStringToBigInt(socialLink)
    );
    await starknetProvider?.waitForTransaction(response.transaction_hash);
    console.log("Verification request submitted successfully", response);
  } catch (error) {
    console.error("Error submitting verification request:", error);
  } finally {
    setIsLoading(false);
  }
};

const getVerificationStatus = async (
  address?: string
): Promise<"unverified" | "pending" | "approved" | "rejected"> => {
  if (!starknetContract) {
    console.error("StarkNet contract not initialized");
    return "unverified";
  }

  try {
    const userAddress = address || starknetAddress;
    const status = await starknetContract.get_verification_status(userAddress);
    switch (status) {
      case 0:
        return "unverified";
      case 1:
        return "pending";
      case 2:
        return "approved";
      case 3:
        return "rejected";
      default:
        return "unverified";
    }
  } catch (error) {
    console.error("Error fetching verification status:", error);
    return "unverified";
  }
};

const isUserVerified = async (address?: string): Promise<boolean> => {
  const status = await getVerificationStatus(address);
  return status === "approved";
};

const approveVerificationRequest = async (address: string): Promise<void> => {
  if (!starknetContract || !starknetAccount) {
    console.error("StarkNet contract or account not initialized");
    return;
  }

  try {
    setIsLoading(true);
    const response = await starknetContract.approve_verification_request(address);
    await starknetProvider?.waitForTransaction(response.transaction_hash);
    console.log("Verification request approved successfully", response);
  } catch (error) {
    console.error("Error approving verification request:", error);
  } finally {
    setIsLoading(false);
  }
};

const rejectVerificationRequest = async (address: string): Promise<void> => {
  if (!starknetContract || !starknetAccount) {
    console.error("StarkNet contract or account not initialized");
    return;
  }

  try {
    setIsLoading(true);
    const response = await starknetContract.reject_verification_request(address);
    await starknetProvider?.waitForTransaction(response.transaction_hash);
    console.log("Verification request rejected successfully", response);
  } catch (error) {
    console.error("Error rejecting verification request:", error);
  } finally {
    setIsLoading(false);
  }
};

const getAllVerificationRequests = async (): Promise<any[]> => {
  if (!starknetContract) {
    console.error("StarkNet contract not initialized");
    return [];
  }

  try {
    setIsLoading(true);
    const requestCount = await starknetContract.get_verification_request_count();
    const requests = [];

    for (let i = 0; i < Number(requestCount); i++) {
      const request = await starknetContract.get_verification_request(BigInt(i));
      requests.push({
        address: request.address,
        name: stark.bigIntToShortString(request.name),
        email: stark.bigIntToShortString(request.email),
        contactInfo: stark.bigIntToShortString(request.contact_info),
        socialLink: stark.bigIntToShortString(request.social_link),
        status: request.status, // 0: unverified, 1: pending, 2: approved, 3: rejected
      });
    }

    return requests;
  } catch (error) {
    console.error("Error fetching verification requests:", error);
    return [];
  } finally {
    setIsLoading(false);
  }
};

const getVerifiedUsers = async (): Promise<any[]> => {
  if (!starknetContract) {
    console.error("StarkNet contract not initialized");
    return [];
  }

  try {
    setIsLoading(true);
    const userCount = await starknetContract.get_verified_user_count();
    const users = [];

    for (let i = 0; i < Number(userCount); i++) {
      const user = await starknetContract.get_verified_user(BigInt(i));
      users.push({
        address: user.address,
        name: stark.bigIntToShortString(user.name),
        verificationDate: new Date(Number(user.verification_date) * 1000), // Convert timestamp to date
      });
    }

    return users;
  } catch (error) {
    console.error("Error fetching verified users:", error);
    return [];
  } finally {
    setIsLoading(false);
  }
};

  return (
    <StarknetContext.Provider
      value={{
        address: starknetAddress,
        starknetAddress,
        starknetContract,
        starknetAccount,
        starknetProvider,
        connectStarknet,
        createStartup,
        createStartupCampaign,
        fundStartup,
        withdrawStartupFunds,
        addStartupDocument,
        getStartupDocuments,
        createMilestone,
        completeMilestone,
        verifyStartup,
        applyForLoan,
        fundLoan,
        withdrawLoanFunds,
        repayLoan,
        getLoanRequests,
        createIPAsset,
        fundIPAsset,
        withdrawIPAssetFunds,
        addIPAssetDocument,
        getIPAssetDocuments,
        updateIPAssetMetadata,
        verifyIPAsset,
        getCampaigns,
        getInvestorTokens,
        hasInvestedInStartup,
        getInvestmentAmount,
        refundInvestment,
        submitVerificationRequest,
        getVerificationStatus,
        isUserVerified,
        approveVerificationRequest,
        rejectVerificationRequest,
        getAllVerificationRequests,
        getVerifiedUsers,
        isLoading,
      }}
    >
      {children}
    </StarknetContext.Provider>
  );
};

export const useStarknetContext = () => {
  const context = useContext(StarknetContext);
  if (context === undefined) {
    throw new Error("useStarknetContext must be used within a StarknetContextProvider");
  }
  return context;
};