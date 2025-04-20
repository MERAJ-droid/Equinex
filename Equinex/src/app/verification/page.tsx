"use client";
import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, CheckCircle, AlertTriangle } from "lucide-react";
import VerificationRequestForm from "@/components/component/VerificationRequestForm";

export default function VerificationPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-[#1a2942] p-4 md:p-8">
      <div className="container mx-auto max-w-3xl">
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
          className="mb-8 text-center"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#00E6E6]/20 mb-4">
            <Shield className="h-8 w-8 text-[#00E6E6]" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white">
            Account Verification
          </h1>
          <p className="text-slate-300 mt-2 max-w-xl mx-auto">
            Get verified to access additional features and build trust with other users on the platform
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <VerificationRequestForm />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-4 text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-[#00E6E6]/20 flex items-center justify-center mb-3">
              <CheckCircle className="h-6 w-6 text-[#00E6E6]" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Trusted Identity</h3>
            <p className="text-sm text-slate-400">
              Verification confirms your identity and builds trust with other users on the platform
            </p>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-4 text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-[#00E6E6]/20 flex items-center justify-center mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#00E6E6]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Enhanced Security</h3>
            <p className="text-sm text-slate-400">
              Verified accounts have access to additional security features and protections
            </p>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-4 text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-[#00E6E6]/20 flex items-center justify-center mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#00E6E6]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Unlock Features</h3>
            <p className="text-sm text-slate-400">
              Verified users can access additional platform features like milestone verification
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-8 bg-slate-800/30 border border-slate-700 rounded-lg p-4"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
            <div>
              <h4 className="text-white font-medium mb-1">Verification Process</h4>
              <p className="text-sm text-slate-400">
                Verification typically takes 24-48 hours to process. We'll review your information and update your account status once approved. You'll be able to check your verification status on this page.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
