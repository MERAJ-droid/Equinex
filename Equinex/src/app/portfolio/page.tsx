"use client";
import NFTCard from "@/components/component/NFTCard";
import NFTDetailView from "@/components/component/NFTDetailView";
import React, { useState, useEffect, useRef } from "react";
import { useStarknetContext } from "@/context";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  Wallet,
  Award,
  Clock,
  DollarSign,
  BarChart3
} from "lucide-react";
import { 
  IconRocket, 
  IconCopyright, 
} from "@tabler/icons-react";
import EquityChart from "@/components/component/EquityChart";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import Footer from "@/components/component/Footer";
import { InvestmentCertificate } from "@/types/nft"; // Import the type

export default function Portfolio() {
  const { address, getInvestorTokens, getCampaigns, getIPAssets } = useStateContext();
  const [investmentTokens, setInvestmentTokens] = useState<InvestmentCertificate[]>([]);
  const [startups, setStartups] = useState<any[]>([]);
  const [ipAssets, setIPAssets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedToken, setSelectedToken] = useState<InvestmentCertificate | null>(null);
  const [portfolioStats, setPortfolioStats] = useState({
    totalInvested: 0,
    totalStartups: 0,
    totalIPAssets: 0,
    avgEquity: 0,
    totalEquity: 0,
    earliestInvestment: new Date(),
  });
  // Use refs to track if data has been fetched and prevent duplicate fetches
  const dataFetchedRef = useRef(false);
  const fetchingInProgressRef = useRef(false);

  useEffect(() => {
    // Only fetch data if we have an address, haven't fetched before, and no fetch is in progress
    if (address && !dataFetchedRef.current && !fetchingInProgressRef.current) {
      const fetchData = async () => {
        fetchingInProgressRef.current = true;
        setIsLoading(true);
       
        try {
          // Fetch investment tokens and campaigns with separate error handling
          let tokens = [];
          let campaigns = [];
          let ipAssetsData = [];
          
          try {
            tokens = await getInvestorTokens();
            console.log("Successfully fetched tokens:", tokens);
          } catch (tokenError) {
            console.error("Error fetching investment tokens:", tokenError);
            tokens = []; // Fallback to empty array
          }
          
          try {
            campaigns = await getCampaigns();
          } catch (campaignError) {
            console.error("Error fetching campaigns:", campaignError);
            campaigns = []; // Fallback to empty array
          }

          try {
            ipAssetsData = await getIPAssets();
          } catch (ipAssetError) {
            console.error("Error fetching IP assets:", ipAssetError);
            ipAssetsData = []; // Fallback to empty array
          }
          
          // Only update state if component is still mounted
          setInvestmentTokens(tokens);
          setStartups(campaigns);
          setIPAssets(ipAssetsData);
          
          // Calculate portfolio statistics
          if (tokens.length > 0) {
            try {
              const totalInvested = tokens.reduce((sum, token) => {
                try {
                  let amount = parseFloat(token.investmentAmount);
                  
                  // If amount is unreasonably large, it might be in wei
                  if (amount > 1000000) {
                    amount = amount / 10**18;
                  }
                  
                  return sum + (isNaN(amount) ? 0 : amount);
                } catch (error) {
                  console.warn(`Error adding investment amount: ${error}`);
                  return sum;
                }
              }, 0);
              
              const totalEquity = tokens.reduce((sum, token) => {
                const equity = parseFloat(token.equity) || 0;
                return sum + equity;
              }, 0);
              
              const avgEquity = totalEquity / tokens.length;
              
              // Filter out invalid dates before finding minimum
              const validDates = tokens
                .map(t => t.investmentDate instanceof Date ? t.investmentDate.getTime() : null)
                .filter(date => date !== null);
                
              const earliestInvestment = validDates.length > 0 
                ? new Date(Math.min(...validDates))
                : new Date();

                // Count unique startups and IP assets
              const startupIds = new Set();
              const ipAssetIds = new Set();

              tokens.forEach(token => {
                // Check if this token is for an IP asset or a startup
                const isIPAsset = ipAssetsData.some(asset => asset.pId === token.startupId);
                
                if (isIPAsset) {
                  ipAssetIds.add(token.startupId);
                } else {
                  startupIds.add(token.startupId);
                }
              });
              
              setPortfolioStats({
                totalInvested,
                totalStartups: startupIds.size,
                totalIPAssets: ipAssetIds.size,
                avgEquity,
                totalEquity,
                earliestInvestment,
              });
            } catch (statsError) {
              console.error("Error calculating portfolio statistics:", statsError);
              // Set default stats if calculation fails
              setPortfolioStats({
                totalInvested: 0,
                totalStartups: 0,
                totalIPAssets: 0,
                avgEquity: 0,
                totalEquity: 0,
                earliestInvestment: new Date(),
              });
            }
          }
          
          // Mark data as fetched to prevent re-fetching
          dataFetchedRef.current = true;
        } catch (error) {
          console.error("Error fetching portfolio data:", error);
        } finally {
          setIsLoading(false);
          fetchingInProgressRef.current = false;
        }
      };
      
      

      fetchData();
    } else if (!address) {
      // If no address, set loading to false
      setIsLoading(false);
    }
  }, [address, getInvestorTokens, getCampaigns, getIPAssets]);

  // Group tokens by startup
  const tokensByStartup = investmentTokens.reduce((acc, token) => {
    if (ipAssets.some(asset => asset.pId === token.startupId)) {
      return acc;
    }
    if (!acc[token.startupId]) {
      acc[token.startupId] = [];
    }
    acc[token.startupId].push(token);
    return acc;
  }, {} as Record<number, InvestmentCertificate[]>);

  const tokensByIPAsset = investmentTokens.reduce((acc, token) => {
    // Only include IP assets in this grouping
    if (!ipAssets.some(asset => asset.pId === token.startupId)) {
      return acc;
    }
    
    if (!acc[token.startupId]) {
      acc[token.startupId] = [];
    }
    acc[token.startupId].push(token);
    return acc;
  }, {} as Record<number, InvestmentCertificate[]>);


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
            Investment <span className="text-[#00E6E6]">Portfolio</span>
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            Track and manage your startup and IP asset investments on the blockchain
          </p>
        </motion.div>

        {isLoading ? (
          <div className="flex justify-center items-center h-[60vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00E6E6]"></div>
          </div>
        ) : (
          <>
            {investmentTokens.length > 0 ? (
              <>
                {/* Portfolio Stats */}
                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
                >
                  <motion.div variants={fadeIn}>
                    <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm overflow-hidden">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-[#00E6E6]/20 flex items-center justify-center">
                            <Wallet className="w-6 h-6 text-[#00E6E6]" />
                          </div>
                          <div>
                            <p className="text-sm text-slate-400">Total Invested</p>
                            <p className="text-2xl font-bold text-white">{portfolioStats.totalInvested.toFixed(2)} AVAX</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div variants={fadeIn}>
                    <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm overflow-hidden">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-[#00E6E6]/20 flex items-center justify-center">
                            <Award className="w-6 h-6 text-[#00E6E6]" />
                          </div>
                          <div>
                            <p className="text-sm text-slate-400">Investments</p>
                            <p className="text-2xl font-bold text-white">
                              {portfolioStats.totalStartups + portfolioStats.totalIPAssets}
                              <span className="text-sm text-slate-400 ml-2">
                                ({portfolioStats.totalStartups} startups, {portfolioStats.totalIPAssets} IP assets)
                              </span>
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div variants={fadeIn}>
                    <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm overflow-hidden">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-[#00E6E6]/20 flex items-center justify-center">
                            <BarChart3 className="w-6 h-6 text-[#00E6E6]" />
                          </div>
                          <div>
                            <p className="text-sm text-slate-400">Total Equity</p>
                            <p className="text-2xl font-bold text-white">{portfolioStats.totalEquity.toFixed(2)}%</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div variants={fadeIn}>
                    <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm overflow-hidden">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-[#00E6E6]/20 flex items-center justify-center">
                            <Clock className="w-6 h-6 text-[#00E6E6]" />
                          </div>
                          <div>
                            <p className="text-sm text-slate-400">First Investment</p>
                            <p className="text-2xl font-bold text-white">{portfolioStats.earliestInvestment.toLocaleDateString()}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </motion.div>

                <motion.div
                  variants={fadeIn}
                  initial="hidden"
                  animate="visible"
                  className="mb-8"
                >
                  <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm overflow-hidden">
                    <CardHeader className="border-b border-slate-700">
                      <CardTitle className="text-white">Portfolio Overview</CardTitle>
                      <CardDescription className="text-slate-400">
                        View your investments by category or as individual certificates
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                      <Tabs defaultValue="startups" className="w-full">
                        <TabsList className="mb-6 bg-slate-700/50 p-1">
                          <TabsTrigger
                            value="startups"
                            className="data-[state=active]:bg-[#00E6E6] data-[state=active]:text-slate-900"
                          >
                            Startups
                          </TabsTrigger>
                          <TabsTrigger
                            value="ip-assets"
                            className="data-[state=active]:bg-[#00E6E6] data-[state=active]:text-slate-900"
                          >
                            IP Assets
                          </TabsTrigger>
                          <TabsTrigger
                            value="certificates"
                            className="data-[state=active]:bg-[#00E6E6] data-[state=active]:text-slate-900"
                          >
                            All Certificates
                          </TabsTrigger>
                        </TabsList>
                       
                        {/* Startups Tab */}
                        <TabsContent value="startups">
                          <motion.div
                            variants={staggerContainer}
                            initial="hidden"
                            animate="visible"
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                          >
                                                        {Object.keys(tokensByStartup).length > 0 ? (
                              Object.entries(tokensByStartup).map(([startupId, tokens]) => {
                                const startup = startups.find(s => s.pId === parseInt(startupId));
                                if (!startup) return null;
                                
                                // Calculate total investment in this startup
                                const totalInvestment = tokens.reduce((sum, token) => {
                                  const amount = parseFloat(token.investmentAmount);
                                  return sum + (isNaN(amount) ? 0 : amount);
                                }, 0);
                                
                                // Calculate total equity in this startup
                                const totalEquity = tokens.reduce((sum, token) => {
                                  const equity = parseFloat(token.equity) || 0;
                                  return sum + equity;
                                }, 0);
                                
                                return (
                                  <motion.div key={startupId} variants={fadeIn}>
                                    <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm overflow-hidden h-full">
                                      <div className="relative h-40">
                                        <Image
                                          src={startup.image}
                                          alt={startup.title}
                                          fill
                                          className="object-cover"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent opacity-70"></div>
                                        <div className="absolute bottom-4 left-4 right-4">
                                          <h3 className="text-xl font-bold text-white">{startup.title}</h3>
                                        </div>
                                      </div>
                                      <CardContent className="p-6">
                                        <div className="space-y-4">
                                          <div className="flex justify-between items-center">
                                            <span className="text-sm text-slate-400">Investment</span>
                                            <span className="font-medium text-white">{totalInvestment.toFixed(2)} AVAX</span>
                                          </div>
                                          <div className="flex justify-between items-center">
                                            <span className="text-sm text-slate-400">Equity</span>
                                            <span className="font-medium text-[#00E6E6]">{totalEquity.toFixed(2)}%</span>
                                          </div>
                                          <div className="flex justify-between items-center">
                                            <span className="text-sm text-slate-400">Certificates</span>
                                            <span className="font-medium text-white">{tokens.length}</span>
                                          </div>
                                        </div>
                                      </CardContent>
                                      <CardFooter className="border-t border-slate-700 p-4">
                                        <Link href={`/startups/${startupId}`} className="w-full">
                                          <Button
                                            variant="outline"
                                            className="w-full border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700 hover:border-[#00E6E6]"
                                          >
                                            View Startup <ArrowUpRight className="ml-2 h-4 w-4" />
                                          </Button>
                                        </Link>
                                      </CardFooter>
                                    </Card>
                                  </motion.div>
                                );
                              })
                            ) : (
                              <div className="col-span-3 text-center py-12">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-700/50 flex items-center justify-center">
                                  <IconRocket className="h-8 w-8 text-slate-400" />
                                </div>
                                <h3 className="text-xl font-semibold mb-2 text-white">No startup investments yet</h3>
                                <p className="mb-6 text-slate-400">Start investing in promising startups to build your portfolio</p>
                                <Link href="/startups">
                                  <Button className="bg-[#00E6E6] text-slate-900 hover:bg-[#00d1d1]">
                                    Browse Startups
                                  </Button>
                                </Link>
                              </div>
                            )}
                          </motion.div>
                        </TabsContent>
                        
                        {/* IP Assets Tab */}
                        <TabsContent value="ip-assets">
                          <motion.div
                            variants={staggerContainer}
                            initial="hidden"
                            animate="visible"
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                          >
                            {Object.keys(tokensByIPAsset).length > 0 ? (
                              Object.entries(tokensByIPAsset).map(([ipAssetId, tokens]) => {
                                const ipAsset = ipAssets.find(a => a.pId === parseInt(ipAssetId));
                                if (!ipAsset) return null;
                                
                                // Calculate total investment in this IP asset
                                const totalInvestment = tokens.reduce((sum, token) => {
                                  const amount = parseFloat(token.investmentAmount);
                                  return sum + (isNaN(amount) ? 0 : amount);
                                }, 0);
                                
                                // Calculate total equity in this IP asset
                                const totalEquity = tokens.reduce((sum, token) => {
                                  const equity = parseFloat(token.equity) || 0;
                                  return sum + equity;
                                }, 0);
                                
                                // Extract category from IP asset
                                const category = ipAsset.category || "Other";
                                
                                return (
                                  <motion.div key={ipAssetId} variants={fadeIn}>
                                    <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm overflow-hidden h-full">
                                      <div className="relative h-40">
                                        <Image
                                          src={ipAsset.image}
                                          alt={ipAsset.title}
                                          fill
                                          className="object-cover"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent opacity-70"></div>
                                        <div className="absolute top-3 right-3">
                                          <Badge className="bg-[#00E6E6]/20 backdrop-blur-md text-[#00E6E6] border border-[#00E6E6]/20">
                                            {category.charAt(0).toUpperCase() + category.slice(1)}
                                          </Badge>
                                        </div>
                                        <div className="absolute bottom-4 left-4 right-4">
                                          <h3 className="text-xl font-bold text-white">{ipAsset.title}</h3>
                                        </div>
                                      </div>
                                      <CardContent className="p-6">
                                        <div className="space-y-4">
                                          <div className="flex justify-between items-center">
                                            <span className="text-sm text-slate-400">Investment</span>
                                            <span className="font-medium text-white">{totalInvestment.toFixed(2)} AVAX</span>
                                          </div>
                                          <div className="flex justify-between items-center">
                                            <span className="text-sm text-slate-400">Equity</span>
                                            <span className="font-medium text-[#00E6E6]">{totalEquity.toFixed(2)}%</span>
                                          </div>
                                          <div className="flex justify-between items-center">
                                            <span className="text-sm text-slate-400">Certificates</span>
                                            <span className="font-medium text-white">{tokens.length}</span>
                                          </div>
                                        </div>
                                      </CardContent>
                                      <CardFooter className="border-t border-slate-700 p-4">
                                        <Link href={`/ip-assets/${ipAssetId}`} className="w-full">
                                          <Button
                                            variant="outline"
                                            className="w-full border-slate-600 text-slate-300 hover:text-white hover:bg-slate-700 hover:border-[#00E6E6]"
                                          >
                                            View IP Asset <ArrowUpRight className="ml-2 h-4 w-4" />
                                          </Button>
                                        </Link>
                                      </CardFooter>
                                    </Card>
                                  </motion.div>
                                );
                              })
                            ) : (
                              <div className="col-span-3 text-center py-12">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-700/50 flex items-center justify-center">
                                  <IconCopyright className="h-8 w-8 text-slate-400" />
                                </div>
                                <h3 className="text-xl font-semibold mb-2 text-white">No IP asset investments yet</h3>
                                <p className="mb-6 text-slate-400">Start investing in intellectual property to build your portfolio</p>
                                <Link href="/ip-assets">
                                  <Button className="bg-[#00E6E6] text-slate-900 hover:bg-[#00d1d1]">
                                    Browse IP Assets
                                  </Button>
                                </Link>
                              </div>
                            )}
                          </motion.div>
                        </TabsContent>

                        {/* All Certificates Tab */}
                        <TabsContent value="certificates">
                          <motion.div
                            variants={staggerContainer}
                            initial="hidden"
                            animate="visible"
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                          >
                            {investmentTokens.length > 0 ? (
                              investmentTokens.map((certificate, index) => (
                                <motion.div key={index} variants={fadeIn}>
                                  <NFTCard
                                    certificate={certificate}
                                    onClick={() => setSelectedToken(certificate)}
                                  />
                                </motion.div>
                              ))
                            ) : (
                              <div className="col-span-3 text-center py-12">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-700/50 flex items-center justify-center">
                                  <Award className="h-8 w-8 text-slate-400" />
                                </div>
                                <h3 className="text-xl font-semibold mb-2 text-white">No investment certificates yet</h3>
                                <p className="mb-6 text-slate-400">Start investing to receive NFT certificates</p>
                                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                  <Link href="/startups">
                                    <Button className="bg-[#00E6E6] text-slate-900 hover:bg-[#00d1d1]">
                                      Browse Startups
                                    </Button>
                                  </Link>
                                  <Link href="/ip-assets">
                                    <Button variant="outline" className="border-slate-600 text-slate-300 hover:text-white">
                                      Browse IP Assets
                                    </Button>
                                  </Link>
                                </div>
                              </div>
                            )}
                          </motion.div>
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Investment Distribution Chart */}
                <motion.div
                  variants={fadeIn}
                  initial="hidden"
                  animate="visible"
                  className="mb-8"
                >
                  <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm overflow-hidden">
                    <CardHeader className="border-b border-slate-700">
                      <CardTitle className="text-white">Investment Distribution</CardTitle>
                      <CardDescription className="text-slate-400">
                        Breakdown of your investments across startups and IP assets
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Investment by Type Chart */}
                        <div>
                          <h3 className="text-lg font-medium text-white mb-4 text-center">By Investment Type</h3>
                          <div className="h-64">
                            <EquityChart
                              equityHolders={[
                                { name: "Startups", percentage: portfolioStats.totalStartups.toString() },
                                { name: "IP Assets", percentage: portfolioStats.totalIPAssets.toString() }
                              ]}
                              title="Investment Types"
                              description="Distribution of investments by type"
                            />
                          </div>
                        </div>
                        
                        {/* Investment by Amount Chart */}
                        <div>
                          <h3 className="text-lg font-medium text-white mb-4 text-center">By Investment Amount</h3>
                          <div className="h-64">
                            {/* Create data for chart based on investment amounts */}
                            <EquityChart
                              equityHolders={[
                                ...Object.entries(tokensByStartup).map(([startupId, tokens]) => {
                                  const startup = startups.find(s => s.pId === parseInt(startupId));
                                  const totalInvestment = tokens.reduce((sum, token) => {
                                    const amount = parseFloat(token.investmentAmount);
                                    return sum + (isNaN(amount) ? 0 : amount);
                                  }, 0);
                                  return {
                                    name: startup?.title || `Startup #${startupId}`,
                                    percentage: totalInvestment.toString()
                                  };
                                }),
                                ...Object.entries(tokensByIPAsset).map(([ipAssetId, tokens]) => {
                                  const ipAsset = ipAssets.find(a => a.pId === parseInt(ipAssetId));
                                  const totalInvestment = tokens.reduce((sum, token) => {
                                    const amount = parseFloat(token.investmentAmount);
                                    return sum + (isNaN(amount) ? 0 : amount);
                                  }, 0);
                                  return {
                                    name: ipAsset?.title || `IP Asset #${ipAssetId}`,
                                    percentage: totalInvestment.toString()
                                  };
                                })
                              ]}
                              title="Investment Amounts"
                              description="Distribution of investment amounts"
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </>
            ) : (
              <div className="text-center py-16 bg-slate-800/50 rounded-lg border border-slate-700">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-slate-700/50 flex items-center justify-center">
                <Wallet className="h-10 w-10 text-slate-400" />
              </div>
              <h2 className="text-2xl font-bold mb-4 text-white">Your Portfolio is Empty</h2>
              <p className="text-slate-300 max-w-md mx-auto mb-8">
                Start investing in startups and IP assets to build your blockchain portfolio and receive NFT certificates.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/startups">
                  <Button className="bg-[#00E6E6] text-slate-900 hover:bg-[#00d1d1]">
                    <IconRocket className="mr-2 h-4 w-4" /> Browse Startups
                  </Button>
                </Link>
                <Link href="/ip-assets">
                  <Button variant="outline" className="border-slate-600 text-slate-300 hover:text-white">
                    <IconCopyright className="mr-2 h-4 w-4" /> Browse IP Assets
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </>
      )}
    </div>

    {/* NFT Detail Dialog */}
    <Dialog open={!!selectedToken} onOpenChange={(open) => !open && setSelectedToken(null)}>
      <DialogContent className="bg-slate-800 border border-slate-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle>Investment Certificate</DialogTitle>
          <DialogDescription className="text-slate-400">
            Details of your investment NFT
          </DialogDescription>
        </DialogHeader>
        {selectedToken && (
          <NFTDetailView certificate={selectedToken} />
        )}
      </DialogContent>
    </Dialog>
    <Footer />
  </div>
);
}
