"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useStateContext } from "@/context";
import { Button } from "@/components/ui/button";
import { ClipLoader } from "react-spinners";
import NFTMintingConfirmation from "@/components/component/NFTMintingConfirmation";
import VerificationBadge from "@/components/component/VerificationBadge";

import {
  Card,
  CardHeader,
  CardContent,
  CardDescription,
  CardFooter,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import Footer from "@/components/component/Footer";
import { 
  Search, 
  Filter, 
  Plus, 
  Calendar, 
  Target, 
  Clock, 
  ArrowRight, 
  DollarSign, 
  Copyright,
  FileText,
  Globe,
  Zap
} from "lucide-react";

interface IPAsset {
  owner: string;
  title: string;
  description: string;
  category: string;
  target: string;
  deadline: Date;
  amountCollected: string;
  image: string;
  video: string;
  documents: { ipfsHash: string; documentType: string; timestamp: number }[];
  pId: number;
  funders: { funderAddress: string; amount: string; tokenId: string }[];
  isVerified: boolean;
}

export default function IPAssetsPage() {
  const { address, getIPAssets, fundIPAsset, withdrawIPAssetFunds } = useStateContext();
  const [ipAssets, setIPAssets] = useState<IPAsset[]>([]);
  const [filteredIPAssets, setFilteredIPAssets] = useState<IPAsset[]>([]);
  const [filterMyIPAssets, setFilterMyIPAssets] = useState(false);
  const [filterCategory, setFilterCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [fundAmount, setFundAmount] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewDetails, setViewDetails] = useState(false);
  const [isInvesting, setIsInvesting] = useState<boolean>(false);
  const [investmentSuccess, setInvestmentSuccess] = useState<boolean>(false);
  const [mintedTokenId, setMintedTokenId] = useState<string | null>(null);
  const [currentIPAssetId, setCurrentIPAssetId] = useState<number | null>(null);
  const [currentIPAssetName, setCurrentIPAssetName] = useState<string>("");

  // Categories for IP assets
  const categories = [
    { value: "all", label: "All Categories" },
    { value: "patent", label: "Patents" },
    { value: "trademark", label: "Trademarks" },
    { value: "copyright", label: "Copyrights" },
    { value: "software", label: "Software" },
    { value: "design", label: "Designs" },
    { value: "other", label: "Other IP" },
  ];

  // Animation variants
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  useEffect(() => {
    const fetchIPAssets = async () => {
      setLoading(true);
      try {
        const fetchedIPAssets: IPAsset[] = await getIPAssets();
        setIPAssets(fetchedIPAssets);
        
        if (filterMyIPAssets) {
          setFilteredIPAssets(
            fetchedIPAssets.filter((asset) => asset.owner === address)
          );
        } else {
          setFilteredIPAssets(fetchedIPAssets);
        }
      } catch (error) {
        console.error("Error fetching IP assets:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchIPAssets();
  }, [getIPAssets, filterMyIPAssets, address]);

  // Filter IP assets based on search term and category
  useEffect(() => {
    let result = ipAssets;
    
    // Apply owner filter
    if (filterMyIPAssets) {
      result = result.filter((asset) => asset.owner === address);
    }
    
    // Apply category filter
    if (filterCategory !== "all") {
      result = result.filter(asset => asset.category === filterCategory);
    }
    
    // Apply search filter
    if (searchTerm) {
      result = result.filter(asset =>
        asset.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredIPAssets(result);
  }, [searchTerm, filterMyIPAssets, filterCategory, ipAssets, address]);

  // Helper function to get the latest token ID for an address
  const getLatestTokenIdForAddress = async (ipAssetId: number, investorAddress: string) => {
    const assets = await getIPAssets();
    const ipAsset = assets.find(a => a.pId === ipAssetId);
    
    if (!ipAsset || !ipAsset.funders) return null;
    
    // Find the most recent funding by this address
    const myFundings = ipAsset.funders
      .filter((f: {funderAddress: string; amount: string; tokenId: string}) => f.funderAddress === investorAddress)
      .sort((a: {tokenId: string}, b: {tokenId: string}) => parseInt(b.tokenId) - parseInt(a.tokenId));
      
    if (myFundings.length > 0) {
      return myFundings[0].tokenId;
    }
    
    return null;
  };

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
      default:
        return <Copyright className="h-5 w-5 text-[#00E6E6]" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-[#1a2942] overflow-x-hidden">
      <div className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">
            IP <span className="text-[#00E6E6]">Assets</span> Marketplace
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            Discover and invest in valuable intellectual property assets or list your own IP for funding
          </p>
        </motion.div>

        <motion.div
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          className="mb-8 flex flex-col md:flex-row justify-between items-center gap-4"
        >
          <div className="relative w-full md:w-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search IP assets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full md:w-80 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#00E6E6] focus:border-transparent"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <div className="flex items-center gap-2 bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2">
              <Filter size={18} className="text-slate-400" />
              <select
                value={filterMyIPAssets ? "my" : "all"}
                onChange={(e) => setFilterMyIPAssets(e.target.value === "my")}
                className="bg-transparent text-white focus:outline-none"
              >
                <option value="all" className="bg-slate-800">All IP Assets</option>
                <option value="my" className="bg-slate-800">My IP Assets</option>
              </select>
            </div>

            <div className="flex items-center gap-2 bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2">
              <Copyright size={18} className="text-slate-400" />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="bg-transparent text-white focus:outline-none"
              >
                {categories.map(category => (
                  <option key={category.value} value={category.value} className="bg-slate-800">
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            <Link href="/ip-assets/create-ip-asset">
              <Button
                className="bg-[#00E6E6] text-slate-900 hover:bg-[#00d1d1] transition-colors"
              >
                <Plus size={16} className="mr-2" />
                List IP Asset
              </Button>
            </Link>
          </div>
        </motion.div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00E6E6]"></div>
          </div>
        ) : filteredIPAssets.length === 0 ? (
          <div className="text-center text-slate-400 py-16 bg-slate-800/50 rounded-lg border border-slate-700">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-700/50 flex items-center justify-center">
              <Search className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-white">No IP assets found</h3>
            <p className="mb-6">There are no IP assets matching your criteria</p>
            <Link href="/ip-assets/create-ip-asset">
              <Button
                className="bg-[#00E6E6] text-slate-900 hover:bg-[#00d1d1] transition-colors"
              >
                List Your IP Asset
              </Button>
            </Link>
          </div>
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredIPAssets.map((ipAsset, idx) => {
              const videoId = ipAsset.video?.split("=").pop();
              const embedUrl = `https://www.youtube.com/embed/${videoId}`;

              const currentDate = new Date();
              const deadlineDate = new Date(ipAsset.deadline);
              const timeDifference = deadlineDate.getTime() - currentDate.getTime();
              const daysRemaining = Math.ceil(timeDifference / (1000 * 3600 * 24));

              const percentFunded = Math.min(
                (parseFloat(ipAsset.amountCollected) / parseFloat(ipAsset.target)) * 100,
                100
              );

              return (
                <motion.div
                  key={idx}
                  variants={fadeIn}
                  className="h-full"
                >
                  <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm overflow-hidden h-full flex flex-col">
                    <div className="relative aspect-video overflow-hidden">
                      <Image
                        src={ipAsset.image}
                        alt={ipAsset.title}
                        fill
                        className="object-cover transition-transform duration-500 hover:scale-105"
                      />
                      <div className="absolute top-3 left-3">
                        <Badge className="bg-[#00E6E6]/20 backdrop-blur-md text-[#00E6E6] border border-[#00E6E6]/20 flex items-center gap-1">
                          {getCategoryIcon(ipAsset.category)}
                          {ipAsset.category.charAt(0).toUpperCase() + ipAsset.category.slice(1)}
                        </Badge>
                      </div>
                      {ipAsset.owner === address && (
                        <div className="absolute top-3 right-3 bg-[#00E6E6] text-slate-900 text-xs font-medium px-2 py-1 rounded-full">
                          Your IP Asset
                        </div>
                      )}
                      <div className="absolute bottom-3 right-3">
                        <VerificationBadge address={ipAsset.owner} showLabel={true} />
                    </div>
                    </div>
                    
                    <div className="relative">
                      <div className="h-1 w-full bg-slate-700">
                        <div
                          className="h-1 bg-[#00E6E6]"
                          style={{ width: `${percentFunded}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <CardHeader className="pb-2">
                      <CardTitle className="text-white text-xl">{ipAsset.title}</CardTitle>
                      <CardDescription className="text-slate-400 line-clamp-2">
                        {ipAsset.description}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="pb-4 flex-grow">
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="flex flex-col">
                          <span className="text-slate-400 text-sm mb-1 flex items-center">
                            <Target size={14} className="mr-1 text-[#00E6E6]" />
                            Target
                          </span>
                          <span className="text-white font-medium">{ipAsset.target} AVAX</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-slate-400 text-sm mb-1 flex items-center">
                            <DollarSign size={14} className="mr-1 text-[#00E6E6]" />
                            Collected
                          </span>
                          <span className="text-white font-medium">{ipAsset.amountCollected} AVAX</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-slate-400 text-sm mb-1 flex items-center">
                            <Calendar size={14} className="mr-1 text-[#00E6E6]" />
                            Deadline
                          </span>
                          <span className="text-white font-medium">{deadlineDate.toLocaleDateString()}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-slate-400 text-sm mb-1 flex items-center">
                            <Clock size={14} className="mr-1 text-[#00E6E6]" />
                            Remaining
                          </span>
                          <span className={`font-medium ${daysRemaining > 0 ? 'text-white' : 'text-red-400'}`}>
                            {daysRemaining > 0 ? `${daysRemaining} days` : 'Ended'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="bg-slate-700/30 rounded-lg px-3 py-2 text-sm text-slate-300">
                        <div className="flex justify-between items-center">
                          <span>{percentFunded.toFixed(0)}% funded</span>
                          <span>{ipAsset.funders?.length || 0} backers</span>
                        </div>
                      </div>
                    </CardContent>
                    
                    <CardFooter className="pt-0">
                      <Dialog onOpenChange={(isOpen) => setViewDetails(isOpen)}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700 flex items-center justify-center"
                          >
                            View Details
                            <ArrowRight size={16} className="ml-2" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-slate-800 border border-slate-700 text-white max-w-3xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="text-2xl font-bold text-white">{ipAsset.title}</DialogTitle>
                            <DialogDescription className="text-slate-400">
                              Created by: {ipAsset.owner.substring(0, 6)}...{ipAsset.owner.substring(ipAsset.owner.length - 4)}
                            </DialogDescription>
                          </DialogHeader>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                            <div>
                              <div className="aspect-video rounded-lg overflow-hidden bg-slate-900 mb-4">
                                <iframe
                                  src={embedUrl}
                                  className="w-full h-full"
                                  allowFullScreen
                                ></iframe>
                              </div>
                              
                              <div className="space-y-4">
                                <div>
                                  <h4 className="text-white font-medium mb-2 flex items-center">
                                    <Target size={16} className="mr-2 text-[#00E6E6]" />
                                    Funding Goal
                                  </h4>
                                  <div className="flex items-center">
                                    <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                                      <div
                                        className="h-2 bg-[#00E6E6]"
                                        style={{
                                          width: `${percentFunded}%`,
                                        }}
                                      ></div>
                                    </div>
                                    <span className="ml-2 text-white font-medium">
                                      {percentFunded.toFixed(0)}%
                                    </span>
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="bg-slate-700/30 p-3 rounded-lg">
                                    <p className="text-sm text-slate-400 mb-1">Target</p>
                                    <p className="text-lg font-medium text-white">{ipAsset.target} AVAX</p>
                                  </div>
                                  <div className="bg-slate-700/30 p-3 rounded-lg">
                                    <p className="text-sm text-slate-400 mb-1">Collected</p>
                                    <p className="text-lg font-medium text-white">{ipAsset.amountCollected} AVAX</p>
                                  </div>
                                </div>
                                
                                <div>
                                  <h4 className="text-white font-medium mb-2 flex items-center">
                                    <Clock size={16} className="mr-2 text-[#00E6E6]" />
                                    Time Remaining
                                  </h4>
                                  {daysRemaining > 0 ? (
                                    <div className="bg-slate-700/30 p-3 rounded-lg">
                                      <div className="flex items-end gap-2">
                                        <span className="text-3xl font-bold text-white">{daysRemaining}</span>
                                        <span className="text-slate-400 mb-1">days left</span>
                                      </div>
                                      <p className="text-sm text-slate-400 mt-1">Deadline: {deadlineDate.toLocaleDateString()}</p>
                                    </div>
                                  ) : (
                                    <div className="bg-red-900/30 border border-red-800/50 p-3 rounded-lg">
                                      <p className="text-lg font-medium text-red-400">Funding period has ended</p>
                                      <p className="text-sm text-slate-400 mt-1">Deadline was: {deadlineDate.toLocaleDateString()}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <div className="space-y-6">
                              <div>
                                <h4 className="text-white font-medium mb-3 flex items-center">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-[#00E6E6]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  About This IP Asset
                                </h4>
                                <div className="bg-slate-700/30 p-4 rounded-lg">
                                  <div className="mb-3">
                                    <Badge className="bg-[#00E6E6]/20 text-[#00E6E6] border border-[#00E6E6]/20 mb-3">
                                      {ipAsset.category.charAt(0).toUpperCase() + ipAsset.category.slice(1)}
                                    </Badge>
                                  </div>
                                  <p className="text-slate-300 whitespace-pre-line">
                                    {ipAsset.description}
                                  </p>
                                </div>
                              </div>
                              
                              {ipAsset.documents && ipAsset.documents.length > 0 && (
                                <div>
                                  <h4 className="text-white font-medium mb-3 flex items-center">
                                    <FileText className="h-4 w-4 mr-2 text-[#00E6E6]" />
                                    Documentation
                                  </h4>
                                  <div className="bg-slate-700/30 p-4 rounded-lg">
                                    <div className="space-y-2">
                                      {ipAsset.documents.map((doc, docIndex) => (
                                        <div
                                          key={docIndex}
                                          className="flex items-center justify-between border-b border-slate-600 last:border-0 pb-2 last:pb-0"
                                        >
                                          <div className="font-medium text-slate-300 text-sm flex items-center">
                                            <FileText className="h-4 w-4 mr-2 text-[#00E6E6]" />
                                            {doc.documentType.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                                          </div>
                                          <a
                                            href={`https://gateway.pinata.cloud/ipfs/${doc.ipfsHash}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-[#00E6E6] text-sm hover:underline"
                                          >
                                            View
                                          </a>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              {ipAsset.funders && ipAsset.funders.length > 0 && (
                                <div>
                                  <h4 className="text-white font-medium mb-3 flex items-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-[#00E6E6]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                    Backers
                                  </h4>
                                  <div className="bg-slate-700/30 p-4 rounded-lg max-h-40 overflow-y-auto">
                                    <div className="space-y-2">
                                      {ipAsset.funders.map((funder, funderIndex) => (
                                        <div
                                          key={funderIndex}
                                          className="flex items-center justify-between border-b border-slate-600 last:border-0 pb-2 last:pb-0"
                                        >
                                          <div className="font-medium text-slate-300 text-sm">
                                            {funder.funderAddress.substring(0, 6)}...{funder.funderAddress.substring(funder.funderAddress.length - 4)}
                                          </div>
                                          <div className="text-[#00E6E6] text-sm">{funder.amount} AVAX</div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              <div className="pt-4">
                                {ipAsset.owner === address ? (
                                  <Button
                                    onClick={() => withdrawIPAssetFunds(ipAsset.pId)}
                                    className="w-full bg-[#00E6E6] text-slate-900 hover:bg-[#00d1d1] transition-colors"
                                    disabled={
                                      daysRemaining > 0 || 
                                      parseFloat(ipAsset.amountCollected) < parseFloat(ipAsset.target)
                                    }
                                  >
                                    {daysRemaining > 0 ? (
                                      "Cannot withdraw before deadline"
                                    ) : parseFloat(ipAsset.amountCollected) < parseFloat(ipAsset.target) ? (
                                      "Target not reached"
                                    ) : (
                                      "Withdraw Funds"
                                    )}
                                  </Button>
                                ) : (
                                  <Popover onOpenChange={(open) => {
                                    // Reset states when popover is closed
                                    if (!open) {
                                      setInvestmentSuccess(false);
                                      setMintedTokenId(null);
                                      setFundAmount("");
                                    }
                                  }}>
                                    <PopoverTrigger asChild>
                                      <Button
                                        className="w-full bg-[#00E6E6] text-slate-900 hover:bg-[#00d1d1] transition-colors"
                                        disabled={daysRemaining <= 0}
                                        >
                                        {daysRemaining <= 0 ? "Funding Ended" : "Fund This IP Asset"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="bg-slate-800 border border-slate-700 text-white">
                                {investmentSuccess && mintedTokenId ? (
                                    <NFTMintingConfirmation 
                                    tokenId={mintedTokenId} 
                                    startupName={ipAsset.title} 
                                    onClose={() => {
                                    setInvestmentSuccess(false);
                                    setMintedTokenId(null);
                                    const closeButton = document.querySelector('[data-radix-popper-content-wrapper]')?.querySelector('button[aria-label="Close"]') as HTMLElement;
                                    if (closeButton) {
                                    closeButton.click();
                                }
                            }}/>
                        ) : (
                        <div className="space-y-4">
                             <h4 className="font-medium text-white">Support this IP asset</h4>
                             <div className="space-y-2">
  <Label htmlFor="amount" className="text-slate-300">
    Amount to fund (AVAX)
  </Label>
  <Input
    id="amount"
    type="text"
    placeholder="Enter amount"
    className="bg-slate-700 border-slate-600 text-white"
    onChange={(e) => setFundAmount(e.target.value)}
  />
</div>
<Button
  onClick={async () => {
    if (!fundAmount || parseFloat(fundAmount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }
    
    setIsInvesting(true);
    setCurrentIPAssetId(ipAsset.pId);
    setCurrentIPAssetName(ipAsset.title);
    
    try {
      // Fund the IP asset and get transaction result
      const txResult = await fundIPAsset(ipAsset.pId, fundAmount);
      console.log("Investment transaction:", txResult);
      
      // Wait a moment for blockchain to update
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Get updated IP asset data
      const updatedIPAssets = await getIPAssets();
      const updatedIPAsset = updatedIPAssets.find(a => a.pId === ipAsset.pId);
      
      if (!updatedIPAsset) {
        throw new Error("Failed to retrieve updated IP asset data");
      }
      
      // Find the token ID from the updated IP asset
      const myFundings = updatedIPAsset.funders
        .filter((f: { funderAddress: string; amount: string; tokenId: string }) =>
          f.funderAddress.toLowerCase() === address.toLowerCase()
        )
        .sort((a: { tokenId: string }, b: { tokenId: string }) =>
          parseInt(b.tokenId) - parseInt(a.tokenId)
        );
      
      const tokenId = myFundings.length > 0 ? myFundings[0].tokenId : null;
      
      if (!tokenId) {
        console.warn("Could not find token ID for the investment");
      }
      
      // Update state with new data
      setMintedTokenId(tokenId || "Unknown");
      setIPAssets(updatedIPAssets);
      setFilteredIPAssets(
        filterMyIPAssets
          ? updatedIPAssets.filter(a => a.owner === address)
          : updatedIPAssets
      );
      
      setInvestmentSuccess(true);
      setFundAmount("");
    } catch (error) {
      console.error("Failed to fund IP asset:", error);
      alert(`Investment failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsInvesting(false);
    }
  }}
  className="w-full bg-[#00E6E6] text-slate-900 hover:bg-[#00d1d1]"
  disabled={isInvesting}
>
  {isInvesting ? (
    <ClipLoader size={20} color="#1a2942" />
  ) : (
    "Proceed"
  )}
</Button>
</div>
)}
</PopoverContent>
</Popover>
)}
</div>
</div>
</div>
</DialogContent>
</Dialog>
</CardFooter>
</Card>
</motion.div>
);
})}
</motion.div>
)}

{/* Featured Section */}
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.6, delay: 0.2 }}
  className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6"
>
  <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
    <CardHeader>
      <div className="w-12 h-12 rounded-full bg-[#00E6E6]/20 flex items-center justify-center mb-2">
        <Copyright className="h-6 w-6 text-[#00E6E6]" />
      </div>
      <CardTitle className="text-white">IP Protection</CardTitle>
      <CardDescription className="text-slate-400">
        Secure your intellectual property rights on the blockchain with immutable proof of ownership.
      </CardDescription>
    </CardHeader>
  </Card>
  
  <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
    <CardHeader>
      <div className="w-12 h-12 rounded-full bg-[#00E6E6]/20 flex items-center justify-center mb-2">
        <DollarSign className="h-6 w-6 text-[#00E6E6]" />
      </div>
      <CardTitle className="text-white">Monetize Your IP</CardTitle>
      <CardDescription className="text-slate-400">
        Turn your intellectual property into a revenue stream by selling equity to interested investors.
      </CardDescription>
    </CardHeader>
  </Card>
  
  <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
    <CardHeader>
      <div className="w-12 h-12 rounded-full bg-[#00E6E6]/20 flex items-center justify-center mb-2">
        <Globe className="h-6 w-6 text-[#00E6E6]" />
      </div>
      <CardTitle className="text-white">Global Exposure</CardTitle>
      <CardDescription className="text-slate-400">
        Showcase your IP to a worldwide audience of investors looking for innovative assets to fund.
      </CardDescription>
    </CardHeader>
  </Card>
</motion.div>

{/* Call to Action */}
<motion.div
  initial={{ opacity: 0, scale: 0.95 }}
  animate={{ opacity: 1, scale: 1 }}
  transition={{ duration: 0.6, delay: 0.4 }}
  className="mt-16 mb-8"
>
  <Card className="border-slate-700 bg-gradient-to-r from-slate-800 to-[#1a2942] overflow-hidden">
    <div className="absolute top-0 right-0 w-64 h-64 bg-[#00E6E6]/10 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none"></div>
    <CardContent className="p-8 md:p-12 relative">
      <div className="max-w-3xl mx-auto text-center">
        <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
          Have valuable intellectual property?
        </h3>
        <p className="text-slate-300 mb-8 max-w-2xl mx-auto">
          List your patents, trademarks, copyrights, or other IP assets to secure funding from our community of investors. Our platform makes it easy to monetize your intellectual property.
        </p>
        <Link href="/ip-assets/create-ip-asset">
          <Button
            className="bg-[#00E6E6] text-slate-900 hover:bg-[#00d1d1] transition-colors px-8 py-6 text-lg"
          >
            List Your IP Asset
          </Button>
        </Link>
      </div>
    </CardContent>
  </Card>
</motion.div>
</div>

{/* Footer */}
<Footer />
</div>
);
}
