"use client";
import React, { useEffect, useState, useCallback, useRef } from "react";
import { useStateContext } from "@/context";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { ClipLoader } from "react-spinners";
import {
  Calendar,
  Clock,
  DollarSign,
  Users,
  FileText,
  ArrowLeft,
  Upload,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  Copyright,
  Globe,
  Zap,
  Award,
  Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import EquityChart from "@/components/component/EquityChart";
import MilestoneTracker from "@/components/component/MilestoneTracker";
import { InvestmentCertificate } from "@/types/nft";
import Link from "next/link";

export default function IPAssetDetails() {
  const { id } = useParams();
  const router = useRouter();
  const {
    getIPAssets,
    address,
    contract,
    isVerifier: checkIsVerifier,
    fundIPAsset,
    withdrawIPAssetFunds,
    hasInvestedInIPAsset,
    getInvestmentAmount,
    getIPAssetDocuments,
    uploadDocument,
    getInvestorTokens,
    verifyIPAsset,
    isLoading: contextLoading
  } = useStateContext();

  // State variables
  const [ipAsset, setIPAsset] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [isVerifier, setIsVerifier] = useState(false);
  const [hasInvested, setHasInvested] = useState(false);
  const [investmentAmount, setInvestmentAmount] = useState("0");
  const [fundAmount, setFundAmount] = useState("");
  const [documents, setDocuments] = useState<any[]>([]);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docType, setDocType] = useState("patent_application");
  const [processingAction, setProcessingAction] = useState(false);
  const [contractReady, setContractReady] = useState(false);
  const [investmentCertificates, setInvestmentCertificates] = useState<InvestmentCertificate[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fetchingRef = useRef(false);
  const initializedRef = useRef(false);
  const dataLoadedRef = useRef(false);

  // IP Asset document types
  const documentTypes = [
    { value: "patent_application", label: "Patent Application" },
    { value: "trademark_registration", label: "Trademark Registration" },
    { value: "copyright_certificate", label: "Copyright Certificate" },
    { value: "design_registration", label: "Design Registration" },
    { value: "technical_documentation", label: "Technical Documentation" },
    { value: "market_analysis", label: "Market Analysis" },
    { value: "licensing_agreement", label: "Licensing Agreement" },
    { value: "valuation_report", label: "Valuation Report" },
    { value: "other", label: "Other" }
  ];

  // Get category icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'patent':
        return <Zap className="h-5 w-5 text-[#00E6E6]" />;
      case 'trademark':
        return <Copyright className="h-5 w-5 text-[#00E6E6]" />;
      case 'copyright':
        return <FileText className="h-5 w-5 text-[#00E6E6]" />;
      case 'software':
        return <Globe className="h-5 w-5 text-[#00E6E6]" />;
      case 'design':
        return <Award className="h-5 w-5 text-[#00E6E6]" />;
      default:
        return <Shield className="h-5 w-5 text-[#00E6E6]" />;
    }
  };

  useEffect(() => {
    // Check if contract is initialized
    if (contract) {
      console.log("Contract is initialized, setting contractReady to true");
      initializedRef.current = true;
      setContractReady(true);
    } else {
      console.log("Contract not initialized yet");
    }
  }, [contract]);
  
  // Fetch data function
  const fetchData = useCallback(async () => {
    if (dataLoadedRef.current && ipAsset) {
      console.log("Data already loaded, skipping fetch");
      return;
    }
    // Check if we have the necessary dependencies to fetch data
    if (!contractReady || !id || !address) {
      console.log("Dependencies not ready yet:", { 
        hasContract: !!contract,  
        hasId: !!id, 
        hasAddress: !!address 
      });
      return;
    }
  
    // Prevent multiple concurrent fetches
    if (fetchingRef.current) {
      console.log("Fetch already in progress, skipping");
      return;
    }
  
    console.log("Starting fetchData with ID:", id);
    fetchingRef.current = true;
    setLoading(true);
    setError(null);
  
    // Create a promise that will be resolved with all the data or rejected with an error
    const fetchPromise = new Promise(async (resolve, reject) => {
      try {
        console.log("Fetching IP asset data for ID:", id);
        
        // Fetch all IP assets
        let ipAssets = [];
        try {
          ipAssets = await getIPAssets();
          console.log("IP assets fetched:", ipAssets.length);
        } catch (ipAssetsError) {
          console.error("Error fetching IP assets:", ipAssetsError);
          reject(new Error("Failed to fetch IP assets. Please try again."));
          return;
        }
        
        // Find the IP asset with the matching ID
        const ipAssetData = ipAssets.find(a => a.pId === parseInt(id as string));
        
        if (!ipAssetData) {
          console.error("IP asset not found with ID:", id);
          reject(new Error("IP asset not found"));
          return;
        }
        
        console.log("IP asset data found:", ipAssetData.title);
        
        // Check if user is owner
        const isUserOwner = ipAssetData.owner === address;
        console.log("Is user owner:", isUserOwner);
        
        // Check if user is verifier
        let verifierStatus = false;
        try {
          verifierStatus = await checkIsVerifier();
          console.log("Is user verifier:", verifierStatus);
        } catch (verifierError) {
          console.error("Error checking verifier status:", verifierError);
          // Continue even if verifier check fails
        }
        
        // Check if user has invested
        let invested = false;
        let amount = "0";
        let ipAssetTokens = [];
        
        if (address) {
          try {
            invested = await hasInvestedInIPAsset(parseInt(id as string));
            console.log("Has user invested:", invested);
            
            if (invested) {
              try {
                amount = await getInvestmentAmount(parseInt(id as string));
                console.log("User investment amount:", amount);
              } catch (amountError) {
                console.error("Error getting investment amount:", amountError);
                // Continue with default amount
              }
              
              try {
                // Get user's investment certificates for this IP asset
                const tokens = await getInvestorTokens();
                ipAssetTokens = tokens.filter(token => token && token.startupId === parseInt(id as string));
                console.log("Investment certificates:", ipAssetTokens.length);
              } catch (tokensError) {
                console.error("Error getting investment tokens:", tokensError);
                // Continue with empty tokens
              }
            }
          } catch (investedError) {
            console.error("Error checking if user has invested:", investedError);
            // Continue with default values
          }
        }
        
        // Get documents
        let docs = [];
        try {
          docs = await getIPAssetDocuments(parseInt(id as string));
          console.log("Documents fetched:", docs.length);
        } catch (docsError) {
          console.error("Error fetching documents:", docsError);
          // Continue with empty documents
        }
        
        // Resolve with all the data
        resolve({
          ipAsset: ipAssetData,
          isOwner: isUserOwner,
          isVerifier: verifierStatus,
          hasInvested: invested,
          investmentAmount: amount,
          investmentCertificates: ipAssetTokens,
          documents: docs
        });
      } catch (error) {
        console.error("Unexpected error in fetch promise:", error);
        reject(error);
      }
    });
    
    // Set a timeout to prevent infinite loading
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Fetch timeout - please check your connection and try again")), 30000);
    });
    
    try {
      // Race the fetch against the timeout
      const result = await Promise.race([fetchPromise, timeoutPromise]) as any;
      
      // Update all states with the fetched data
      setIPAsset(result.ipAsset);
      setIsOwner(result.isOwner);
      setIsVerifier(result.isVerifier);
      setHasInvested(result.hasInvested);
      setInvestmentAmount(result.investmentAmount);
      setInvestmentCertificates(result.investmentCertificates);
      setDocuments(result.documents);

      dataLoadedRef.current = true;
      
      console.log("All data fetched successfully");
    } catch (error) {
      console.error("Error in fetchData:", error);
      setError(error instanceof Error ? error.message : "Failed to load IP asset details. Please try again later.");
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [id, getIPAssets, address, checkIsVerifier, hasInvestedInIPAsset, getInvestmentAmount, getIPAssetDocuments, getInvestorTokens, contractReady]);
  
  // Fetch data when contract is ready and ID is available
  useEffect(() => {
    if (dataLoadedRef.current && ipAsset) {
      console.log("Data already loaded, not fetching again");
      setLoading(false); // Ensure loading is false
      return;
    }
  
    const shouldFetch = id && contract && address && !fetchingRef.current;
    
    if (shouldFetch) {
      console.log("Dependencies ready, fetching data...");
      // Use a small timeout to ensure state updates have propagated
      const timer = setTimeout(() => {
        fetchData();
      }, 100);
      
      return () => clearTimeout(timer);
    } else {
      console.log("Waiting for dependencies:", { 
        hasId: !!id, 
        hasContract: !!contract, 
        hasAddress: !!address,
        isFetching: fetchingRef.current
      });
      
      // If we've been waiting too long, set an error
      const timeout = setTimeout(() => {
        if (loading && !ipAsset) {
          console.log("Loading timeout reached");
          setLoading(false);
          setError("Connection timeout. Please check your wallet connection and refresh the page.");
        }
      }, 20000);
      
      return () => clearTimeout(timeout);
    }
  }, [id, contract, address, fetchData, loading, ipAsset]);

  // Handle funding an IP asset
  const handleFundIPAsset = async () => {
    if (!fundAmount || !id) return;
    
    setProcessingAction(true);
    try {
      console.log("Funding IP asset with amount:", fundAmount);
      await fundIPAsset(parseInt(id as string), fundAmount);
      
      // Refresh data after funding
      await fetchData();
      setFundAmount("");
      
      // Show success message
      alert("Investment successful! You've received an NFT certificate for your investment.");
    } catch (error) {
      console.error("Error funding IP asset:", error);
      alert("Failed to invest. Please try again.");
    } finally {
      setProcessingAction(false);
    }
  };

  // Handle withdrawing funds
  const handleWithdrawFunds = async () => {
    if (!id) return;
    
    setProcessingAction(true);
    try {
      console.log("Withdrawing funds from IP asset");
      await withdrawIPAssetFunds(parseInt(id as string));
      
      // Refresh data after withdrawal
      await fetchData();
      
      // Show success message
      alert("Funds withdrawn successfully!");
    } catch (error) {
      console.error("Error withdrawing funds:", error);
      alert("Failed to withdraw funds. Please try again.");
    } finally {
      setProcessingAction(false);
    }
  };

  // Handle uploading a document
  const handleUploadDocument = async () => {
    if (!docFile || !id) return;
    
    setUploadingDoc(true);
    try {
      console.log("Uploading document:", docFile.name, "Type:", docType);
      await uploadDocument(parseInt(id as string), docFile, docType);
      
      // Refresh documents
      const docs = await getIPAssetDocuments(parseInt(id as string));
      setDocuments(docs);
      
      // Reset form
      setDocFile(null);
      setDocType("patent_application");
      
      // Show success message
      alert("Document uploaded successfully!");
    } catch (error) {
      console.error("Error uploading document:", error);
      alert("Failed to upload document. Please try again.");
    } finally {
      setUploadingDoc(false);
    }
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setDocFile(e.target.files[0]);
    }
  };

  // Show loading spinner while data is loading
  if ((loading || !contractReady) && !dataLoadedRef.current) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-[#1a2942] flex justify-center items-center">
        <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00E6E6] mb-4"></div>
          <p className="text-slate-300">Loading IP asset details...</p>
        </div>
      </div>
    );
  }

  // Show error message if there was a problem
  if (error || !ipAsset) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-[#1a2942] flex justify-center items-center">
        <div className="text-center max-w-md mx-auto p-6 bg-slate-800/50 rounded-lg border border-slate-700">
          <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-4">IP Asset Not Found</h2>
          <p className="text-slate-300 mb-6">
            {error || "The IP asset you're looking for doesn't exist or has been removed."}
          </p>
          <Link href="/ip-assets">
            <Button className="bg-[#00E6E6] text-slate-900 hover:bg-[#00d1d1]">
              <ArrowLeft className="mr-2 h-4 w-4" /> Browse IP Assets
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Format deadline date
  let deadlineDate;
  const currentDate = new Date();

  // Check if the deadline is a Date object or a timestamp
  if (ipAsset.deadline instanceof Date) {
    deadlineDate = ipAsset.deadline;
  } else {
    // Try to parse it as a timestamp (in seconds)
    const timestamp = typeof ipAsset.deadline === 'number' 
      ? ipAsset.deadline 
      : parseInt(ipAsset.deadline);
    
    // Check if the timestamp is too large (likely in milliseconds already)
    if (timestamp > 100000000000) { // More than year ~5138 (100B seconds since epoch)
      deadlineDate = new Date(timestamp); // Already in milliseconds
    } else {
      deadlineDate = new Date(timestamp * 1000); // Convert seconds to milliseconds
    }
  }

  // Validate the date - if it's too far in the future, it's likely incorrect
  if (isNaN(deadlineDate.getTime()) || deadlineDate.getFullYear() > 2100) {
    console.error("Invalid or far-future deadline date:", ipAsset.deadline);
    // Fallback to a reasonable date (e.g., 30 days from now)
    deadlineDate = new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000);
  }

  const timeDifference = deadlineDate.getTime() - currentDate.getTime();
  const daysRemaining = Math.max(0, Math.ceil(timeDifference / (1000 * 3600 * 24)));
  const deadlineOver = daysRemaining <= 0;

  // Calculate funding progress
  const fundingProgress = Math.min(
    (parseFloat(ipAsset.amountCollected) / parseFloat(ipAsset.target)) * 100,
    100
  );
  const fundingComplete = fundingProgress >= 100;

  // Extract video ID from YouTube URL
  const videoId = ipAsset.video?.split("=").pop() || "";
  const embedUrl = `https://www.youtube.com/embed/${videoId}`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-[#1a2942] overflow-x-hidden">
      <div className="container mx-auto py-8 px-4">
        {/* Back button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <Button
            variant="ghost"
            onClick={() => router.push("/ip-assets")}
            className="flex items-center text-slate-300 hover:text-white"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to IP Assets
          </Button>
        </motion.div>

        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-4xl font-bold text-white">{ipAsset.title}</h1>
                <Badge className="bg-[#00E6E6]/20 text-[#00E6E6] border border-[#00E6E6]/20">
                  {getCategoryIcon(ipAsset.category)}
                  <span className="ml-1">{ipAsset.category.charAt(0).toUpperCase() + ipAsset.category.slice(1)}</span>
                </Badge>
              </div>
              <p className="text-lg text-slate-300">{ipAsset.description.substring(0, 120)}...</p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {isOwner && (
                <Badge className="bg-slate-800 text-white px-3 py-1">
                  <Users className="mr-1 h-4 w-4" /> Owner
                </Badge>
              )}
              
              {hasInvested && (
                <Badge className="bg-[#00E6E6] text-black px-3 py-1">
                  <CheckCircle className="mr-1 h-4 w-4" /> Investor
                </Badge>
              )}
              
              {ipAsset.isVerified && (
                <Badge className="bg-green-600 text-white px-3 py-1">
                  <CheckCircle className="mr-1 h-4 w-4" /> Verified
                </Badge>
              )}
              
              {deadlineOver ? (
                <Badge variant="destructive" className="px-3 py-1">
                  <Clock className="mr-1 h-4 w-4" /> Deadline Passed
                </Badge>
              ) : (
                <Badge variant="outline" className="px-3 py-1 text-white">
                  <Calendar className="mr-1 h-4 w-4" /> {daysRemaining} Days Left
                </Badge>
              )}
            </div>
          </div>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Left Column - 2/3 width */}
          <div className="lg:col-span-2 space-y-8">
            {/* Pitch Video */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm overflow-hidden">
                <CardHeader className="border-b border-slate-700">
                  <CardTitle className="text-white">IP Asset Presentation</CardTitle>
                  <CardDescription className="text-slate-400">Watch the IP asset presentation video</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="aspect-video rounded-lg overflow-hidden">
                    <iframe
                      src={embedUrl}
                      className="w-full h-full"
                      allowFullScreen
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Equity Distribution */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm overflow-hidden">
                <CardHeader className="border-b border-slate-700">
                  <CardTitle className="text-white">Equity Distribution</CardTitle>
                  <CardDescription className="text-slate-400">How equity is allocated among stakeholders</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <EquityChart equityHolders={ipAsset.equityHolders || []} />
                </CardContent>
              </Card>
            </motion.div>

            {/* IP Asset Details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm overflow-hidden">
                <CardHeader className="border-b border-slate-700">
                  <CardTitle className="text-white">IP Asset Details</CardTitle>
                  <CardDescription className="text-slate-400">Key information about this intellectual property</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-slate-400 mb-1">IP Type</h3>
                        <p className="text-white font-medium flex items-center">
                          {getCategoryIcon(ipAsset.category)}
                          <span className="ml-2">{ipAsset.category.charAt(0).toUpperCase() + ipAsset.category.slice(1)}</span>
                        </p>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-slate-400 mb-1">Status</h3>
                        <p className="text-white font-medium flex items-center">
                          {ipAsset.status === "pending" ? (
                            <><Clock className="h-4 w-4 text-amber-500 mr-2" /> <span className="text-amber-500">Pending</span></>
                          ) : ipAsset.status === "registered" ? (
                            <><CheckCircle className="h-4 w-4 text-green-500 mr-2" /> <span className="text-green-500">Registered</span></>
                          ) : ipAsset.status === "application" ? (
                            <><FileText className="h-4 w-4 text-blue-500 mr-2" /> <span className="text-blue-500">Application Filed</span></>
                          ) : (
                            <><Shield className="h-4 w-4 text-[#00E6E6] mr-2" /> <span className="text-[#00E6E6]">{ipAsset.status.charAt(0).toUpperCase() + ipAsset.status.slice(1)}</span></>
                          )}
                        </p>
                      </div>
                      
                      {ipAsset.registrationNumber && (
                        <div>
                          <h3 className="text-sm font-medium text-slate-400 mb-1">Registration Number</h3>
                          <p className="text-white font-medium">{ipAsset.registrationNumber}</p>
                        </div>
                      )}
                      
                      {ipAsset.filingDate && (
                        <div>
                          <h3 className="text-sm font-medium text-slate-400 mb-1">Filing Date</h3>
                          <p className="text-white font-medium">{new Date(ipAsset.filingDate).toLocaleDateString()}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-4">
                      {ipAsset.jurisdiction && (
                        <div>
                          <h3 className="text-sm font-medium text-slate-400 mb-1">Jurisdiction</h3>
                          <p className="text-white font-medium">{ipAsset.jurisdiction}</p>
                        </div>
                      )}
                      
                      {ipAsset.expirationDate && (
                        <div>
                          <h3 className="text-sm font-medium text-slate-400 mb-1">Expiration Date</h3>
                          <p className="text-white font-medium">{new Date(ipAsset.expirationDate).toLocaleDateString()}</p>
                        </div>
                      )}
                      
                      {ipAsset.inventors && (
                        <div>
                          <h3 className="text-sm font-medium text-slate-400 mb-1">Inventors/Creators</h3>
                          <p className="text-white font-medium">{ipAsset.inventors}</p>
                        </div>
                      )}
                      
                      <div>
                        <h3 className="text-sm font-medium text-slate-400 mb-1">Verification Status</h3>
                        <p className="font-medium flex items-center">
                          {ipAsset.isVerified ? (
                            <><CheckCircle className="h-4 w-4 text-green-500 mr-2" /> <span className="text-green-500">Verified</span></>
                          ) : (
                            <><AlertTriangle className="h-4 w-4 text-amber-500 mr-2" /> <span className="text-amber-500">Pending Verification</span></>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Documents Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between border-b border-slate-700">
                  <div>
                    <CardTitle className="text-white">Documentation</CardTitle>
                    <CardDescription className="text-slate-400">IP registration documents and supporting materials</CardDescription>
                  </div>
                  
                  {isOwner && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="bg-[#00E6E6] text-black hover:bg-[#00d1d1]">
                          <Upload className="mr-2 h-4 w-4" /> Upload
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-slate-800 border border-slate-700 text-white">
                        <DialogHeader>
                          <DialogTitle>Upload Document</DialogTitle>
                          <DialogDescription className="text-slate-400">
                            Add supporting documents for your IP asset
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-white">Document Type</label>
                            <select
                              className="w-full p-2 rounded-md border border-slate-600 bg-slate-700 text-white"
                              value={docType}
                              onChange={(e) => setDocType(e.target.value)}
                            >
                              {documentTypes.map((type) => (
                                <option key={type.value} value={type.value}>{type.label}</option>
                              ))}
                            </select>
                          </div>
                          
                          <div className="border-2 border-dashed border-slate-600 rounded-lg p-6 text-center">
                            <input
                              type="file"
                              id="doc-file"
                              className="hidden"
                              onChange={handleFileChange}
                            />
                            <label
                              htmlFor="doc-file"
                              className="cursor-pointer flex flex-col items-center justify-center"
                            >
                              {docFile ? (
                                <>
                                  <CheckCircle className="h-8 w-8 text-green-500 mb-2" />
                                  <p className="text-sm font-medium text-white">{docFile.name}</p>
                                  <p className="text-xs text-slate-400 mt-1">
                                    {(docFile.size / 1024 / 1024).toFixed(2)} MB
                                  </p>
                                </>
                              ) : (
                                <>
                                  <Upload className="h-8 w-8 text-slate-400 mb-2" />
                                  <p className="text-sm font-medium text-white">Click to upload document</p>
                                  <p className="text-xs text-slate-400 mt-1">
                                    PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX
                                  </p>
                                </>
                              )}
                            </label>
                          </div>
                        </div>
                        
                        <DialogFooter>
                          <Button
                            onClick={handleUploadDocument}
                            disabled={!docFile || uploadingDoc}
                            className="bg-[#00E6E6] text-black hover:bg-[#00d1d1]"
                          >
                            {uploadingDoc ? (
                              <ClipLoader size={20} color="#000" />
                            ) : (
                              "Upload Document"
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </CardHeader>
                <CardContent className="p-6">
                  {documents.length > 0 ? (
                    <div className="space-y-4">
                      {documents.map((doc, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 rounded-md border border-slate-700 hover:bg-slate-700/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-[#00E6E6]" />
                            <div>
                              <p className="font-medium text-white">{doc.documentType.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</p>
                              <p className="text-xs text-slate-400">
                                {new Date(doc.timestamp).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#00E6E6] hover:underline flex items-center"
                          >
                            <ExternalLink className="h-4 w-4 mr-1" /> View
                          </a>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-slate-500 mx-auto mb-3 opacity-50" />
                      <p className="text-slate-400">No documents have been uploaded yet.</p>
                      {isOwner && (
                        <p className="text-sm mt-2 text-slate-500">Upload IP registration documents and other materials to provide more information to potential investors.</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Milestones Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm overflow-hidden">
                <CardHeader className="border-b border-slate-700">
                  <CardTitle className="text-white">Development Milestones</CardTitle>
                  <CardDescription className="text-slate-400">Track the progress of this IP asset through key achievements</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <MilestoneTracker
                    startupId={parseInt(id as string)}
                    isOwner={isOwner}
                    isVerifier={isVerifier}
                  />
                </CardContent>
              </Card>
            </motion.div>

            {/* Investment Certificates Section - Only show if user has invested */}
            {hasInvested && investmentCertificates.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm overflow-hidden">
                  <CardHeader className="border-b border-slate-700">
                    <CardTitle className="text-white">Your Investment Certificates</CardTitle>
                    <CardDescription className="text-slate-400">NFT certificates representing your investments in this IP asset</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {investmentCertificates.map((certificate, index) => (
                        <div 
                          key={index}
                          className="border border-slate-700 rounded-lg p-4 hover:border-[#00E6E6]/50 transition-colors"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <h3 className="font-bold text-white">Certificate #{certificate.tokenId}</h3>
                            <Badge className="bg-[#00E6E6] text-black">{certificate.equity}% Equity</Badge>
                          </div>
                          
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-slate-400">Investment:</span>
                              <span className="text-white font-medium">{certificate.investmentAmount} AVAX</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Date:</span>
                              <span className="text-white font-medium">{certificate.investmentDate.toLocaleDateString()}</span>
                            </div>
                          </div>
                          
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" className="w-full mt-3 border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700 hover:border-[#00E6E6]">
                                View Certificate
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-slate-800 border border-slate-700 text-white">
                              <DialogHeader>
                                <DialogTitle>Investment Certificate #{certificate.tokenId}</DialogTitle>
                                <DialogDescription className="text-slate-400">
                                  Details of your investment in {ipAsset.title}
                                </DialogDescription>
                              </DialogHeader>
                              
                              <div className="space-y-4 py-4">
                                {certificate.metadata?.image && (
                                  <div className="mx-auto max-w-xs">
                                    <Image
                                      src={certificate.metadata.image}
                                      alt="Certificate"
                                      width={300}
                                      height={300}
                                      className="rounded-lg border border-slate-700"
                                    />
                                  </div>
                                )}
                                
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="bg-slate-700/50 p-3 rounded-lg">
                                    <p className="text-sm text-slate-400 mb-1">IP Asset</p>
                                    <p className="font-medium text-white">{ipAsset.title}</p>
                                  </div>
                                  
                                  <div className="bg-slate-700/50 p-3 rounded-lg">
                                    <p className="text-sm text-slate-400 mb-1">Token ID</p>
                                    <p className="font-medium text-white">#{certificate.tokenId}</p>
                                  </div>
                                  
                                  <div className="bg-slate-700/50 p-3 rounded-lg">
                                    <p className="text-sm text-slate-400 mb-1">Investment</p>
                                    <p className="font-medium text-white">{certificate.investmentAmount} AVAX</p>
                                  </div>
                                  
                                  <div className="bg-slate-700/50 p-3 rounded-lg">
                                    <p className="text-sm text-slate-400 mb-1">Equity</p>
                                    <p className="font-medium text-white">{certificate.equity}%</p>
                                  </div>
                                  
                                  <div className="bg-slate-700/50 p-3 rounded-lg">
                                    <p className="text-sm text-slate-400 mb-1">Date</p>
                                    <p className="font-medium text-white">{certificate.investmentDate.toLocaleDateString()}</p>
                                  </div>
                                  
                                  <div className="bg-slate-700/50 p-3 rounded-lg">
                                    <p className="text-sm text-slate-400 mb-1">Owner</p>
                                    <p className="font-medium text-white truncate">{certificate.ownerAddress.substring(0, 8)}...</p>
                                  </div>
                                </div>
                                
                                {certificate.metadata?.attributes && (
                                  <div className="border-t border-slate-700 pt-4">
                                    <p className="text-sm font-medium text-white mb-2">Certificate Attributes</p>
                                    <div className="grid grid-cols-2 gap-2">
                                      {certificate.metadata.attributes.map((attr: any, i: number) => (
                                        <div key={i} className="bg-slate-700/50 p-2 rounded-md">
                                          <p className="text-xs text-slate-400">{attr.trait_type}</p>
                                          <p className="text-sm font-medium text-white truncate">{attr.value}</p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Detailed Description */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm overflow-hidden">
                <CardHeader className="border-b border-slate-700">
                  <CardTitle className="text-white">About This IP Asset</CardTitle>
                  <CardDescription className="text-slate-400">Detailed description and potential applications</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="prose prose-invert max-w-none">
                    <p className="text-slate-300 whitespace-pre-line">{ipAsset.description}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Right Column - 1/3 width */}
          <div className="space-y-8">
            {/* Funding Progress */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm overflow-hidden">
                <CardHeader className="border-b border-slate-700">
                  <CardTitle className="text-white">Funding Progress</CardTitle>
                  <CardDescription className="text-slate-400">
                    {ipAsset.amountCollected} AVAX of {ipAsset.target} AVAX goal
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-2">
                    <div className="h-4 w-full bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-4 bg-[#00E6E6]"
                        style={{ width: `${fundingProgress}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-300">{fundingProgress.toFixed(1)}% Funded</span>
                      <span className="text-slate-300">{ipAsset.target} AVAX Goal</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="bg-slate-700/50 p-3 rounded-md">
                      <p className="text-xs text-slate-400 mb-1">Deadline</p>
                      <p className="font-medium text-white">{deadlineDate.toLocaleDateString()}</p>
                    </div>
                    <div className="bg-slate-700/50 p-3 rounded-md">
                      <p className="text-xs text-slate-400 mb-1">Time Left</p>
                      <p className="font-medium text-white">
                        {deadlineOver ? (
                          <span className="text-red-500">Ended</span>
                        ) : (
                          `${daysRemaining} Days`
                        )}
                      </p>
                    </div>
                  </div>

                  {hasInvested && (
                    <div className="bg-slate-700/30 p-4 rounded-md border border-[#00E6E6]/20">
                      <p className="text-xs text-[#00E6E6] mb-1">Your Investment</p>
                      <p className="text-xl font-bold text-white">{investmentAmount} AVAX</p>
                    </div>
                  )}

                  {!deadlineOver && !fundingComplete && !isOwner && (
                    <div>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button className="w-full bg-[#00E6E6] text-black hover:bg-[#00d1d1]">
                            <DollarSign className="mr-2 h-4 w-4" /> Invest Now
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 bg-slate-800 border border-slate-700 text-white">
                          <div className="space-y-4">
                            <h4 className="font-medium text-white">Invest in {ipAsset.title}</h4>
                            <p className="text-sm text-slate-400">
                              Enter the amount you want to invest in AVAX
                            </p>
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-white">Amount (AVAX)</label>
                              <Input
                                type="number"
                                placeholder="0.00"
                                value={fundAmount}
                                onChange={(e) => setFundAmount(e.target.value)}
                                className="bg-slate-700 border-slate-600 text-white"
                              />
                            </div>
                            <Button
                              onClick={handleFundIPAsset}
                              disabled={!fundAmount || processingAction}
                              className="w-full bg-[#00E6E6] text-black hover:bg-[#00d1d1]"
                            >
                              {processingAction ? (
                                <ClipLoader size={20} color="#000" />
                              ) : (
                                "Confirm Investment"
                              )}
                            </Button>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  )}

                  {isOwner && fundingComplete && deadlineOver && (
                    <Button
                      onClick={handleWithdrawFunds}
                      disabled={processingAction || parseFloat(ipAsset.amountReleased) >= parseFloat(ipAsset.amountCollected)}
                      className="w-full bg-[#00E6E6] text-black hover:bg-[#00d1d1]"
                    >
                      {processingAction ? (
                        <ClipLoader size={20} color="#000" />
                      ) : parseFloat(ipAsset.amountReleased) >= parseFloat(ipAsset.amountCollected) ? (
                        "All Funds Withdrawn"
                      ) : (
                        "Withdraw Funds"
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* IP Asset Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm overflow-hidden">
                <CardHeader className="border-b border-slate-700">
                  <CardTitle className="text-white">IP Asset Information</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div>
                    <p className="text-sm text-slate-400 mb-1">Owner</p>
                    <p className="font-medium text-white break-all">{ipAsset.owner}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-slate-400 mb-1">Target Amount</p>
                    <p className="font-medium text-white">{ipAsset.target} AVAX</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-slate-400 mb-1">Collected Amount</p>
                    <p className="font-medium text-white">{ipAsset.amountCollected} AVAX</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-slate-400 mb-1">Released Amount</p>
                    <p className="font-medium text-white">{ipAsset.amountReleased} AVAX</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-slate-400 mb-1">Number of Investors</p>
                    <p className="font-medium text-white">{ipAsset.funders?.length || 0}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-slate-400 mb-1">Verification Status</p>
                    <p className="font-medium flex items-center">
                      {ipAsset.isVerified ? (
                        <><CheckCircle className="h-4 w-4 text-green-500 mr-2" /> <span className="text-green-500">Verified</span></>
                      ) : (
                        <><AlertTriangle className="h-4 w-4 text-amber-500 mr-2" /> <span className="text-amber-500">Pending Verification</span></>
                      )}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* IP Asset Image */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm overflow-hidden">
                <div className="aspect-video relative">
                  <Image
                    src={ipAsset.image}
                    alt={ipAsset.title}
                    fill
                    className="object-cover"
                  />
                </div>
              </Card>
            </motion.div>

            {/* Potential Applications */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm overflow-hidden">
                <CardHeader className="border-b border-slate-700">
                  <CardTitle className="text-white">Potential Applications</CardTitle>
                  <CardDescription className="text-slate-400">How this IP can be utilized</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    {ipAsset.applications ? (
                      ipAsset.applications.map((application: string, index: number) => (
                        <div 
                          key={index}
                          className="flex items-start gap-3 p-3 rounded-md hover:bg-slate-700/30 transition-colors"
                        >
                          <div className="mt-0.5">
                            <div className="h-5 w-5 rounded-full bg-[#00E6E6]/20 flex items-center justify-center">
                              <span className="text-[#00E6E6] text-xs font-bold">{index + 1}</span>
                            </div>
                          </div>
                          <p className="text-slate-300">{application}</p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6">
                        <Globe className="h-10 w-10 text-slate-500 mx-auto mb-2 opacity-50" />
                        <p className="text-slate-400">No specific applications listed</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Investors List */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm overflow-hidden">
                <CardHeader className="border-b border-slate-700">
                  <CardTitle className="text-white">Top Investors</CardTitle>
                  <CardDescription className="text-slate-400">People who have funded this IP asset</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  {ipAsset.funders && ipAsset.funders.length > 0 ? (
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                      {ipAsset.funders
                        .sort((a: any, b: any) => parseFloat(b.amount) - parseFloat(a.amount))
                        .slice(0, 5)
                        .map((funder: any, index: number) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 rounded-md hover:bg-slate-700/50 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <div className="bg-slate-700 h-8 w-8 rounded-full flex items-center justify-center text-[#00E6E6]">
                                {index + 1}
                              </div>
                              <p className="font-medium text-white truncate max-w-[120px]">
                                {funder.funderAddress.substring(0, 6)}...{funder.funderAddress.substring(funder.funderAddress.length - 4)}
                              </p>
                            </div>
                            <p className="font-mono text-white">{parseFloat(funder.amount).toFixed(2)} AVAX</p>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <Users className="h-10 w-10 text-slate-500 mx-auto mb-2 opacity-50" />
                      <p className="text-slate-400">No investors yet</p>
                      <p className="text-sm mt-1 text-slate-500">Be the first to invest in this IP asset!</p>
                    </div>
                  )}
                </CardContent>
                {ipAsset.funders && ipAsset.funders.length > 5 && (
                  <CardFooter className="border-t border-slate-700 p-4">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700">
                          View All Investors
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-slate-800 border border-slate-700 text-white">
                        <DialogHeader>
                          <DialogTitle>All Investors</DialogTitle>
                          <DialogDescription className="text-slate-400">
                            Complete list of investors for {ipAsset.title}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="max-h-[60vh] overflow-y-auto pr-2">
                          <div className="space-y-3">
                            {ipAsset.funders
                              .sort((a: any, b: any) => parseFloat(b.amount) - parseFloat(a.amount))
                              .map((funder: any, index: number) => (
                                <div
                                  key={index}
                                  className="flex items-center justify-between p-3 rounded-md hover:bg-slate-700/50 transition-colors"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="bg-slate-700 h-8 w-8 rounded-full flex items-center justify-center text-[#00E6E6]">
                                      {index + 1}
                                    </div>
                                    <p className="font-medium text-white break-all">{funder.funderAddress}</p>
                                  </div>
                                  <p className="font-mono text-white">{parseFloat(funder.amount).toFixed(2)} AVAX</p>
                                </div>
                              ))}
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardFooter>
                )}
              </Card>
            </motion.div>

            {/* Verifier Actions - Only show if user is a verifier */}
            {isVerifier && !ipAsset.isVerified && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm overflow-hidden">
                  <CardHeader className="border-b border-slate-700">
                    <CardTitle className="text-white">Verifier Actions</CardTitle>
                    <CardDescription className="text-slate-400">Verify this IP asset</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <Button
                      onClick={async () => {
                        try {
                          setProcessingAction(true);
                          await verifyIPAsset(parseInt(id as string));
                          await fetchData();
                          alert("IP asset verified successfully!");
                        } catch (error) {
                          console.error("Error verifying IP asset:", error);
                          alert("Failed to verify IP asset. Please try again.");
                        } finally {
                          setProcessingAction(false);
                        }
                      }}
                      disabled={processingAction}
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                    >
                                            {processingAction ? (
                        <ClipLoader size={20} color="#fff" />
                      ) : (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4" /> Verify IP Asset
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Licensing Information - If available */}
            {ipAsset.licensing && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm overflow-hidden">
                  <CardHeader className="border-b border-slate-700">
                    <CardTitle className="text-white">Licensing Information</CardTitle>
                    <CardDescription className="text-slate-400">Current licensing status and opportunities</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-slate-400 mb-1">Licensing Status</h3>
                        <p className="text-white font-medium">{ipAsset.licensing.status || "Not specified"}</p>
                      </div>
                      
                      {ipAsset.licensing.terms && (
                        <div>
                          <h3 className="text-sm font-medium text-slate-400 mb-1">Licensing Terms</h3>
                          <p className="text-white">{ipAsset.licensing.terms}</p>
                        </div>
                      )}
                      
                      {ipAsset.licensing.opportunities && (
                        <div>
                          <h3 className="text-sm font-medium text-slate-400 mb-1">Opportunities</h3>
                          <p className="text-white">{ipAsset.licensing.opportunities}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
