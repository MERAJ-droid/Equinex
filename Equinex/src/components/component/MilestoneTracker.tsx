"use client";
import React, { useState, useEffect, useRef } from "react";
import { useStateContext } from "@/context";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CheckCircle, Clock, Upload, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { ClipLoader } from "react-spinners";

interface MilestoneTrackerProps {
  startupId: number;
  isOwner: boolean;
  isVerifier: boolean;
  startupAmountCollected?: number;
}

const MilestoneTracker: React.FC<MilestoneTrackerProps> = ({ startupId, isOwner, isVerifier, startupAmountCollected = 0 }) => {
  const { getStartupMilestones, createMilestone, completeMilestone } = useStateContext();
  const [milestones, setMilestones] = useState<any[]>([]);
  const [newMilestone, setNewMilestone] = useState({
    title: "",
    description: "",
    fundAmount: "",
  });
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<number | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Local loading states
  const [isCreatingMilestone, setIsCreatingMilestone] = useState(false);
  const [isCompletingMilestone, setIsCompletingMilestone] = useState(false);
  const [isFetchingMilestones, setIsFetchingMilestones] = useState(false);
  
  // Mounted ref to prevent state updates after unmount
  const isMounted = useRef(true);

  useEffect(() => {
    // Set up cleanup function
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    const fetchMilestones = async () => {
      if (!startupId) return;
      
      try {
        setIsFetchingMilestones(true);
        const data = await getStartupMilestones(startupId);
        if (isMounted.current) {
          setMilestones(data || []);
        }
      } catch (error) {
        console.error("Failed to fetch milestones:", error);
      } finally {
        if (isMounted.current) {
          setIsFetchingMilestones(false);
        }
      }
    };

    fetchMilestones();
  }, [startupId, getStartupMilestones, refreshTrigger]);

  const handleCreateMilestone = async () => {
    if (isCreatingMilestone) return; // Prevent multiple clicks
    
    try {
      setIsCreatingMilestone(true);
      
      // Validate inputs
      if (!newMilestone.title || !newMilestone.description || !newMilestone.fundAmount) {
        alert("Please fill in all milestone fields");
        setIsCreatingMilestone(false);
        return;
      }
      
      // Parse fund amount to ensure it's a valid number
      const fundAmount = parseFloat(newMilestone.fundAmount);
      if (isNaN(fundAmount) || fundAmount <= 0) {
        alert("Please enter a valid fund amount");
        setIsCreatingMilestone(false);
        return;
      }
      
      // Calculate total funds already allocated to milestones
      const totalAllocatedFunds = milestones.reduce((sum, milestone) => {
        return sum + parseFloat(milestone.fundAmount.toString());
      }, 0);
      
      // Check if there are enough funds available
      if (totalAllocatedFunds + fundAmount > startupAmountCollected) {
        alert(`Not enough funds available. You can allocate up to ${(startupAmountCollected - totalAllocatedFunds).toFixed(4)} AVAX for this milestone.`);
        setIsCreatingMilestone(false);
        return;
      }
      
      console.log("Creating milestone:", newMilestone);
      
      await createMilestone(
        startupId,
        newMilestone.title,
        newMilestone.description,
        fundAmount
      );
      
      // Reset form and refresh milestones
      if (isMounted.current) {
        setNewMilestone({ title: "", description: "", fundAmount: "" });
        setRefreshTrigger(prev => prev + 1);
        
        // Show success message
        alert("Milestone created successfully!");
      }
    } catch (error: unknown) {
      console.error("Failed to create milestone:", error);
      
      // Provide a more specific error message
      if (error instanceof Error && error.toString().includes("Not enough funds available")) {
        alert("Not enough funds available for this milestone. The total of all milestone funds cannot exceed the amount collected for the startup.");
      } else {
        alert("Failed to create milestone. Please try again.");
      }
    } finally {
      if (isMounted.current) {
        setIsCreatingMilestone(false);
      }
    }
  };
  const handleCompleteMilestone = async (milestoneId: number) => {
    if (!proofFile || isCompletingMilestone) return;
    
    try {
      setIsCompletingMilestone(true);
      
      await completeMilestone(startupId, milestoneId, proofFile);
      
      if (isMounted.current) {
        setProofFile(null);
        setSelectedMilestoneId(null);
        setRefreshTrigger(prev => prev + 1);
        
        // Show success message
        alert("Milestone completed successfully!");
      }
    } catch (error) {
      console.error("Failed to complete milestone:", error);
      alert("Failed to complete milestone. Please try again.");
    } finally {
      if (isMounted.current) {
        setIsCompletingMilestone(false);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProofFile(e.target.files[0]);
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  // Calculate available funds for milestones
  const totalAllocatedFunds = milestones.reduce((sum, milestone) => {
    return sum + parseFloat(milestone.fundAmount.toString());
  }, 0);
  const availableFunds = Math.max(0, startupAmountCollected - totalAllocatedFunds);

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Startup Milestones</h2>
        <p className="text-muted-foreground">Track the progress of this startup through its key milestones</p>
      </div>

      {isOwner && (
        <Card className="mb-8 border-[#00d8ff] border">
          {/* <CardHeader>
            <CardTitle>Create New Milestone</CardTitle>
            <CardDescription>Define the next achievement for your startup</CardDescription>
          </CardHeader> */}
          <CardContent>
            <div className="space-y-4">
              {/* Display available funds */}
              <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-md mb-4">
                <p className="text-sm font-medium">
                  <span className="text-muted-foreground">Available Funds: </span>
                  <span className="text-[#00d8ff] font-bold">
                    {availableFunds.toFixed(4)} AVAX
                  </span>
                  <span className="text-muted-foreground"> of </span>
                  <span className="font-bold">{startupAmountCollected.toFixed(4)} AVAX</span>
                  <span className="text-muted-foreground"> collected</span>
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <Input 
                  value={newMilestone.title}
                  onChange={(e) => setNewMilestone({...newMilestone, title: e.target.value})}
                  placeholder="E.g., MVP Launch"
                  disabled={isCreatingMilestone}
                  className="text-[#00d8ff] placeholder:text-slate-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <Textarea 
                  value={newMilestone.description}
                  onChange={(e) => setNewMilestone({...newMilestone, description: e.target.value})}
                  placeholder="Describe what this milestone entails"
                  rows={3}
                  disabled={isCreatingMilestone}
                  className="text-[#00d8ff] placeholder:text-slate-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Fund Amount (AVAX)</label>
                <Input 
                  type="number"
                  value={newMilestone.fundAmount}
                  onChange={(e) => setNewMilestone({...newMilestone, fundAmount: e.target.value})}
                  placeholder="Amount to release upon completion"
                  disabled={isCreatingMilestone}
                  className="text-[#00d8ff] placeholder:text-slate-400"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleCreateMilestone} 
              disabled={isCreatingMilestone || !newMilestone.title || !newMilestone.description || !newMilestone.fundAmount}
              className="bg-[#00d8ff] text-black hover:bg-[#00b8d4]"
            >
              {isCreatingMilestone ? <ClipLoader size={20} color="#000" /> : "Create Milestone"}
            </Button>
          </CardFooter>
        </Card>
      )}

      {isFetchingMilestones && milestones.length === 0 ? (
        <div className="flex justify-center items-center py-12">
          {/* <ClipLoader size={30} color="#00d8ff" /> */}
        </div>
      ) : (
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-4"
        >
          {milestones.length > 0 ? (
            milestones.map((milestone, index) => (
              <motion.div key={index} variants={item}>
                <Card className={`border ${milestone.isCompleted ? 'border-green-500' : 'border-amber-500'}`}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-xl">{milestone.title}</CardTitle>
                      <Badge variant={milestone.isCompleted ? "default" : "outline"} className={milestone.isCompleted ? "bg-green-500" : ""}>
                        {milestone.isCompleted ? (
                          <span className="flex items-center"><CheckCircle className="mr-1 h-4 w-4" /> Completed</span>
                        ) : (
                          <span className="flex items-center"><Clock className="mr-1 h-4 w-4" /> In Progress</span>
                        )}
                      </Badge>
                    </div>
                    <CardDescription>
                      Fund Amount: {milestone.fundAmount} AVAX
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{milestone.description}</p>
                    
                    {milestone.isCompleted && milestone.proofIpfsHash && (
                      <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-md">
                        <p className="text-xs font-medium text-green-700 dark:text-green-300 mb-1">Completion Proof</p>
                        <a 
                          href={`https://ipfs.io/ipfs/${milestone.proofIpfsHash}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 dark:text-blue-400 underline"
                        >
                          View Documentation
                        </a>
                        {milestone.completionDate && (
                          <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                            Completed on: {milestone.completionDate instanceof Date ? 
                              milestone.completionDate.toLocaleDateString() : 
                              "Unknown date"}
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                  
                  {isVerifier && !milestone.isCompleted && (
                    <CardFooter>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            className="border-[#00d8ff] text-[#00d8ff] hover:bg-[#00d8ff] hover:text-black"
                            onClick={() => setSelectedMilestoneId(milestone.id)}
                          >
                            <Upload className="mr-2 h-4 w-4" /> Verify Completion
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Verify Milestone Completion</DialogTitle>
                            <DialogDescription>
                              Upload proof documentation to verify that this milestone has been completed.
                            </DialogDescription>
                          </DialogHeader>
                          
                          <div className="space-y-4 py-4">
                            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                              <input
                                type="file"
                                id="proof-file"
                                className="hidden"
                                onChange={handleFileChange}
                                disabled={isCompletingMilestone}
                              />
                              <label 
                                htmlFor="proof-file" 
                                className={`cursor-pointer flex flex-col items-center justify-center ${isCompletingMilestone ? 'opacity-50' : ''}`}
                              >
                                {proofFile ? (
                                  <>
                                                                        <CheckCircle className="h-8 w-8 text-green-500 mb-2" />
                                    <p className="text-sm font-medium">{proofFile.name}</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {(proofFile.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                  </>
                                ) : (
                                  <>
                                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                                    <p className="text-sm font-medium">Click to upload proof</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      PDF, Images, or Documents
                                    </p>
                                  </>
                                )}
                              </label>
                            </div>
                            
                            {!proofFile && !isCompletingMilestone && (
                              <div className="flex items-center text-amber-500 text-sm">
                                <AlertCircle className="h-4 w-4 mr-2" />
                                <span>Proof documentation is required</span>
                              </div>
                            )}
                          </div>
                          
                          <DialogFooter>
                            <Button 
                              onClick={() => selectedMilestoneId !== null && handleCompleteMilestone(selectedMilestoneId)}
                              disabled={!proofFile || isCompletingMilestone}
                              className="bg-[#00d8ff] text-black hover:bg-[#00b8d4]"
                            >
                              {isCompletingMilestone ? (
                                <ClipLoader size={20} color="#000" />
                              ) : (
                                "Submit Verification"
                              )}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </CardFooter>
                  )}
                </Card>
              </motion.div>
            ))
          ) : (
            <Card className="border-dashed border-gray-300 dark:border-gray-600 p-8 text-center">
              <CardContent className="pt-6">
                <p className="text-muted-foreground">No milestones have been created yet.</p>
                {isOwner && (
                  <p className="text-sm mt-2">
                    Create your first milestone to track your startup progress.
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default MilestoneTracker;
