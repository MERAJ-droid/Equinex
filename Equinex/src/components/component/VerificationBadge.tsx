"use client";
import React from "react";
import { motion } from "framer-motion";
import { CheckCircle, Clock, XCircle, Shield } from "lucide-react";
import { useStarknetContext } from "@/context";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface VerificationBadgeProps {
  address?: string;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export default function VerificationBadge({ 
  address, 
  size = "md", 
  showLabel = false 
}: VerificationBadgeProps) {
  const { getVerificationStatus } = useStarknetContext();
  const [status, setStatus] = React.useState<'unverified' | 'pending' | 'approved' | 'rejected'>('unverified');
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchStatus = async () => {
      try {
        const result = await getVerificationStatus(address);
        if (result === 'approved') {
          setStatus('approved');
        } else {
          setStatus(result as 'unverified' | 'pending' | 'rejected');
        }
      } catch (error) {
        console.error("Error fetching verification status:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, [address, getVerificationStatus]);

  // Size classes
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6"
  };

  // Badge configurations
  const badgeConfig = {
    approved: {
      icon: <CheckCircle className={`${sizeClasses[size]} text-white`} />,
      label: "Verified",
      tooltip: "This user has been verified",
      bgColor: "bg-green-600",
      borderColor: "border-green-500",
      textColor: "text-white",
      shadow: "shadow-md shadow-green-500/20"
    },
    pending: {
      icon: <Clock className={`${sizeClasses[size]} text-white`} />,
      label: "Pending",
      tooltip: "Verification request is pending review",
      bgColor: "bg-amber-500",
      borderColor: "border-amber-400",
      textColor: "text-white",
      shadow: "shadow-md shadow-amber-500/20"
    },
    rejected: {
      icon: <XCircle className={`${sizeClasses[size]} text-white`} />,
      label: "Rejected",
      tooltip: "Verification request was rejected",
      bgColor: "bg-red-500",
      borderColor: "border-red-400",
      textColor: "text-white",
      shadow: "shadow-md shadow-red-500/20"
    },
    unverified: {
      icon: <Shield className={`${sizeClasses[size]} text-white`} />,
      label: "Unverified",
      tooltip: "This user is not verified",
      bgColor: "bg-slate-600",
      borderColor: "border-slate-500",
      textColor: "text-white",
      shadow: "shadow-md shadow-slate-500/10"
    }
  };

  const config = badgeConfig[status];

  if (loading) {
    return (
      <div className={`inline-flex items-center justify-center ${sizeClasses[size]} animate-pulse bg-slate-700 rounded-full`}></div>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
            className={`inline-flex items-center gap-1.5 ${showLabel ? 'px-2.5 py-1 rounded-full' : 'p-1 rounded-full'} 
              ${config.bgColor} ${config.shadow} border ${config.borderColor} backdrop-blur-sm`}
          >
            {config.icon}
            {showLabel && (
              <span className={`text-xs font-bold ${config.textColor}`}>
                {config.label}
              </span>
            )}
          </motion.div>
        </TooltipTrigger>
        <TooltipContent className="bg-slate-800 border-slate-700 text-white">
          {config.tooltip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
