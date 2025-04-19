"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useStateContext } from "@/context";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ClipLoader } from "react-spinners";
import { CheckCircle, AlertTriangle, Clock, Shield } from "lucide-react";

export default function VerificationRequestForm() {
  const { address, submitVerificationRequest, getVerificationStatus } = useStateContext();
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [socialLink, setSocialLink] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'unverified' | 'pending' | 'verified' | 'rejected'>('unverified');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  useEffect(() => {
    const fetchStatus = async () => {
      if (address) {
        try {
          const status = await getVerificationStatus();
          setVerificationStatus(status);
        } catch (error) {
          console.error("Error fetching verification status:", error);
        }
      }
    };

    fetchStatus();
  }, [address, getVerificationStatus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // Validate inputs
      if (!name.trim()) throw new Error("Name is required");
      if (!email.trim()) throw new Error("Email is required");
      if (!validateEmail(email)) throw new Error("Please enter a valid email address");
      if (!contactInfo.trim()) throw new Error("Contact information is required");
      if (!socialLink.trim()) throw new Error("Professional profile link is required");

      // Submit verification request
      await submitVerificationRequest(name, email, contactInfo, socialLink);
      setSuccess(true);
      setVerificationStatus('pending');
      
      // Reset form
      setName("");
      setEmail("");
      setContactInfo("");
      setSocialLink("");
    } catch (error) {
      console.error("Error submitting verification request:", error);
      setError(error instanceof Error ? error.message : "An unknown error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // If user is already verified or has a pending/rejected request
  if (verificationStatus !== 'unverified') {
    return (
      <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm overflow-hidden">
        <CardHeader className="border-b border-slate-700">
          <CardTitle className="text-white">Verification Status</CardTitle>
          <CardDescription className="text-slate-400">
            Your current verification status on EquineX
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8 text-center">
          {verificationStatus === 'verified' && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-green-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white">Verification Approved</h3>
              <p className="text-slate-300 mb-4">
                Your account has been verified. You now have access to all features on EquineX.
              </p>
              <div className="inline-block bg-green-500/10 border border-green-500/20 rounded-full px-4 py-1 text-sm text-green-400">
                Verified Account
              </div>
            </motion.div>
          )}

          {verificationStatus === 'pending' && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-amber-500/20 flex items-center justify-center">
                <Clock className="h-10 w-10 text-amber-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white">Verification Pending</h3>
              <p className="text-slate-300 mb-4">
                Your verification request has been submitted and is currently under review. This process typically takes 24-48 hours.
              </p>
              <div className="inline-block bg-amber-500/10 border border-amber-500/20 rounded-full px-4 py-1 text-sm text-amber-400">
                Pending Review
              </div>
            </motion.div>
          )}

          {verificationStatus === 'rejected' && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertTriangle className="h-10 w-10 text-red-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white">Verification Rejected</h3>
              <p className="text-slate-300 mb-4">
                Your verification request was not approved. You can submit a new request with updated information.
              </p>
              <Button 
                onClick={() => setVerificationStatus('unverified')}
                className="bg-[#00E6E6] text-slate-900 hover:bg-[#00d1d1] transition-colors"
              >
                Submit New Request
              </Button>
            </motion.div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Form for unverified users
  return (
    <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm overflow-hidden">
      <CardHeader className="border-b border-slate-700">
        <CardTitle className="text-white">Verification Request</CardTitle>
        <CardDescription className="text-slate-400">
          Submit your information to verify your account
        </CardDescription>
      </CardHeader>
      
      {success ? (
        <CardContent className="p-8 text-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[#00E6E6]/20 flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-[#00E6E6]" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-white">Request Submitted</h3>
            <p className="text-slate-300 mb-4">
              Your verification request has been submitted successfully. We'll review your information and update your status within 24-48 hours.
            </p>
            <div className="inline-block bg-[#00E6E6]/10 border border-[#00E6E6]/20 rounded-full px-4 py-1 text-sm text-[#00E6E6]">
              Pending Review
            </div>
          </motion.div>
        </CardContent>
      ) : (
        <form onSubmit={handleSubmit}>
          <CardContent className="p-6 space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-md p-3 text-red-400 text-sm mb-4">
                <AlertTriangle className="h-4 w-4 inline-block mr-2" />
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="name" className="text-white">Full Name</Label>
              <Input
                id="name"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="contact" className="text-white">Contact Information</Label>
              <Input
                id="contact"
                placeholder="Phone number or other contact method"
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="social" className="text-white">Professional Profile</Label>
              <Input
                id="social"
                placeholder="LinkedIn or GitHub profile URL"
                value={socialLink}
                onChange={(e) => setSocialLink(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
              />
              <p className="text-xs text-slate-400">
                This helps us verify your identity and professional background
              </p>
            </div>
          </CardContent>
          
          <CardFooter className="border-t border-slate-700 p-6">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#00E6E6] text-slate-900 hover:bg-[#00d1d1] transition-colors"
            >
              {isSubmitting ? (
                <ClipLoader size={20} color="#1a2942" />
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" /> Submit Verification Request
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      )}
    </Card>
  );
}
