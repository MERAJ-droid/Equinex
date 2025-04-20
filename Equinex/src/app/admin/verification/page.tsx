"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useStateContext } from "@/context";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClipLoader } from "react-spinners";
import { Shield, CheckCircle, XCircle, Clock, ArrowLeft, AlertTriangle, User } from "lucide-react";
import { VerificationRequest, VerifiedUser } from "@/types/verification";
import Link from "next/link";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function AdminVerificationPage() {
  const { 
    address, 
    isVerifier, 
    getAllVerificationRequests, 
    getVerifiedUsers,
    approveVerificationRequest,
    rejectVerificationRequest
  } = useStateContext();
  
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<VerificationRequest[]>([]);
  const [verifiedUsers, setVerifiedUsers] = useState<VerifiedUser[]>([]);
  const [rejectedRequests, setRejectedRequests] = useState<VerificationRequest[]>([]);
  const [processingAction, setProcessingAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const verifierStatus = await isVerifier();
        setIsAdmin(verifierStatus);
        
        if (verifierStatus) {
          await fetchData();
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error("Error checking admin status:", error);
        setLoading(false);
      }
    };
    
    checkAdmin();
  }, [address, isVerifier]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all verification requests
      const requests = await getAllVerificationRequests();
      
      // Separate pending and rejected requests
      setPendingRequests(requests.filter(req => req.status === 'pending'));
      setRejectedRequests(requests.filter(req => req.status === 'rejected'));
      
      // Fetch verified users
      const users = await getVerifiedUsers();
      setVerifiedUsers(users);
    } catch (error) {
      console.error("Error fetching verification data:", error);
      setError("Failed to load verification data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (address: string) => {
    setProcessingAction(address);
    try {
      await approveVerificationRequest(address);
      await fetchData(); // Refresh data
    } catch (error) {
      console.error("Error approving request:", error);
      setError("Failed to approve request. Please try again.");
    } finally {
      setProcessingAction(null);
    }
  };

  const handleReject = async (address: string) => {
    setProcessingAction(address);
    try {
      await rejectVerificationRequest(address);
      await fetchData(); // Refresh data
    } catch (error) {
      console.error("Error rejecting request:", error);
      setError("Failed to reject request. Please try again.");
    } finally {
      setProcessingAction(null);
    }
  };

  // If not an admin, show access denied
  if (!loading && !isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-[#1a2942] flex justify-center items-center p-4">
        <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm overflow-hidden max-w-md w-full">
          <CardHeader className="border-b border-slate-700">
            <CardTitle className="text-white">Access Denied</CardTitle>
            <CardDescription className="text-slate-400">
              You don't have permission to access this page
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-16 w-16 text-amber-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-white">Admin Access Required</h3>
            <p className="text-slate-300 mb-6">
              This page is only accessible to verified administrators.
            </p>
            <Link href="/">
              <Button className="bg-[#00E6E6] text-slate-900 hover:bg-[#00d1d1] transition-colors">
                <ArrowLeft className="mr-2 h-4 w-4" /> Return to Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-[#1a2942] flex justify-center items-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00E6E6] mb-4"></div>
          <p className="text-slate-300">Loading verification data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-[#1a2942] p-4 md:p-8">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="text-slate-300 hover:text-white">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
            </Button>
          </Link>
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-white flex items-center">
            <Shield className="mr-3 h-8 w-8 text-[#00E6E6]" />
            Verification Management
          </h1>
          <p className="text-slate-300 mt-2">
            Review and manage user verification requests
          </p>
        </motion.div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-md p-4 text-red-400 mb-6">
            <AlertTriangle className="h-5 w-5 inline-block mr-2" />
            {error}
          </div>
        )}

        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="bg-slate-800 border border-slate-700">
            <TabsTrigger value="pending" className="data-[state=active]:bg-[#00E6E6] data-[state=active]:text-slate-900">
              <Clock className="mr-2 h-4 w-4" />
              Pending Requests ({pendingRequests.length})
            </TabsTrigger>
            <TabsTrigger value="verified" className="data-[state=active]:bg-[#00E6E6] data-[state=active]:text-slate-900">
              <CheckCircle className="mr-2 h-4 w-4" />
              Verified Users ({verifiedUsers.length})
            </TabsTrigger>
            <TabsTrigger value="rejected" className="data-[state=active]:bg-[#00E6E6] data-[state=active]:text-slate-900">
              <XCircle className="mr-2 h-4 w-4" />
              Rejected Requests ({rejectedRequests.length})
            </TabsTrigger>
          </TabsList>

          {/* Pending Requests Tab */}
          <TabsContent value="pending">
            <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm overflow-hidden">
              <CardHeader className="border-b border-slate-700">
                <CardTitle className="text-white">Pending Verification Requests</CardTitle>
                <CardDescription className="text-slate-400">
                  Review and approve or reject user verification requests
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {pendingRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <Clock className="h-12 w-12 text-slate-500 mx-auto mb-3 opacity-50" />
                    <p className="text-slate-400">No pending verification requests</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingRequests.map((request) => (
                      <motion.div
                        key={request.address}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-slate-700/30 border border-slate-700 rounded-lg p-4"
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <User className="h-5 w-5 text-[#00E6E6]" />
                              <h3 className="font-medium text-white">{request.name}</h3>
                              <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/20">
                                Pending
                              </Badge>
                            </div>
                            <p className="text-sm text-slate-300 mb-1">
                              <span className="text-slate-400">Address:</span> {request.address.substring(0, 8)}...{request.address.substring(request.address.length - 6)}
                            </p>
                            <p className="text-sm text-slate-300 mb-1">
                              <span className="text-slate-400">Email:</span> {request.email}
                            </p>
                            <p className="text-sm text-slate-300 mb-1">
                              <span className="text-slate-400">Contact:</span> {request.contactInfo}
                            </p>
                            <p className="text-sm text-slate-300">
                              <span className="text-slate-400">Profile:</span> <a href={request.socialLink} target="_blank" rel="noopener noreferrer" className="text-[#00E6E6] hover:underline">{request.socialLink}</a>
                            </p>
                            <p className="text-xs text-slate-400 mt-2">
                              Requested on {new Date(request.timestamp).toLocaleDateString()}
                            </p>
                          </div>
                          
                          <div className="flex gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" className="border-green-600 text-green-500 hover:bg-green-500/10">
                                  <CheckCircle className="mr-2 h-4 w-4" /> Approve
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="bg-slate-800 border border-slate-700 text-white">
                                <DialogHeader>
                                  <DialogTitle>Confirm Approval</DialogTitle>
                                  <DialogDescription className="text-slate-400">
                                    Are you sure you want to approve this verification request?
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="py-4">
                                  <p className="text-white">
                                    Approving will grant <span className="font-medium">{request.name}</span> verified status on the platform.
                                  </p>
                                </div>
                                <DialogFooter>
                                  <Button
                                    onClick={() => handleApprove(request.address)}
                                    disabled={processingAction === request.address}
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                  >
                                    {processingAction === request.address ? (
                                      <ClipLoader size={20} color="#fff" />
                                    ) : (
                                      <>Confirm Approval</>
                                    )}
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                            
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" className="border-red-600 text-red-500 hover:bg-red-500/10">
                                  <XCircle className="mr-2 h-4 w-4" /> Reject
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="bg-slate-800 border border-slate-700 text-white">
                                <DialogHeader>
                                  <DialogTitle>Confirm Rejection</DialogTitle>
                                  <DialogDescription className="text-slate-400">
                                    Are you sure you want to reject this verification request?
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="py-4">
                                  <p className="text-white">
                                    Rejecting will deny <span className="font-medium">{request.name}</span> verified status. They can submit a new request later.
                                  </p>
                                </div>
                                <DialogFooter>
                                  <Button
                                    onClick={() => handleReject(request.address)}
                                    disabled={processingAction === request.address}
                                    className="bg-red-600 hover:bg-red-700 text-white"
                                  >
                                    {processingAction === request.address ? (
                                      <ClipLoader size={20} color="#fff" />
                                    ) : (
                                      <>Confirm Rejection</>
                                    )}
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Verified Users Tab */}
          <TabsContent value="verified">
            <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm overflow-hidden">
              <CardHeader className="border-b border-slate-700">
                <CardTitle className="text-white">Verified Users</CardTitle>
                <CardDescription className="text-slate-400">
                  Users who have been verified on the platform
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {verifiedUsers.length === 0 ? (
                  <div className="text-center py-12">
                    <User className="h-12 w-12 text-slate-500 mx-auto mb-3 opacity-50" />
                    <p className="text-slate-400">No verified users yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {verifiedUsers.map((user) => (
                      <motion.div
                        key={user.address}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-slate-700/30 border border-slate-700 rounded-lg p-4"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          </div>
                          <h3 className="font-medium text-white">{user.name}</h3>
                        </div>
                        <p className="text-sm text-slate-300 mb-1">
                          <span className="text-slate-400">Address:</span> {user.address.substring(0, 8)}...{user.address.substring(user.address.length - 6)}
                        </p>
                        <p className="text-xs text-slate-400 mt-2">
                          Verified on {new Date(user.verificationDate).toLocaleDateString()}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Rejected Requests Tab */}
          <TabsContent value="rejected">
            <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm overflow-hidden">
              <CardHeader className="border-b border-slate-700">
                <CardTitle className="text-white">Rejected Requests</CardTitle>
                <CardDescription className="text-slate-400">
                  Verification requests that have been rejected
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {rejectedRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <XCircle className="h-12 w-12 text-slate-500 mx-auto mb-3 opacity-50" />
                    <p className="text-slate-400">No rejected verification requests</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {rejectedRequests.map((request) => (
                      <motion.div
                        key={request.address}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-slate-700/30 border border-slate-700 rounded-lg p-4"
                      >
                                                <div className="flex items-center gap-2 mb-2">
                          <User className="h-5 w-5 text-red-400" />
                          <h3 className="font-medium text-white">{request.name}</h3>
                          <Badge className="bg-red-500/20 text-red-400 border-red-500/20">
                            Rejected
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-300 mb-1">
                          <span className="text-slate-400">Address:</span> {request.address.substring(0, 8)}...{request.address.substring(request.address.length - 6)}
                        </p>
                        <p className="text-sm text-slate-300 mb-1">
                          <span className="text-slate-400">Email:</span> {request.email}
                        </p>
                        <p className="text-xs text-slate-400 mt-2">
                          Rejected on {new Date(request.timestamp).toLocaleDateString()}
                        </p>
                        
                        <div className="mt-3">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" className="border-green-600 text-green-500 hover:bg-green-500/10">
                                <CheckCircle className="mr-2 h-3 w-3" /> Approve Now
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-slate-800 border border-slate-700 text-white">
                              <DialogHeader>
                                <DialogTitle>Approve Previously Rejected Request</DialogTitle>
                                <DialogDescription className="text-slate-400">
                                  Are you sure you want to approve this previously rejected request?
                                </DialogDescription>
                              </DialogHeader>
                              <div className="py-4">
                                <p className="text-white">
                                  Approving will grant <span className="font-medium">{request.name}</span> verified status on the platform.
                                </p>
                              </div>
                              <DialogFooter>
                                <Button
                                  onClick={() => handleApprove(request.address)}
                                  disabled={processingAction === request.address}
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                  {processingAction === request.address ? (
                                    <ClipLoader size={20} color="#fff" />
                                  ) : (
                                    <>Confirm Approval</>
                                  )}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
