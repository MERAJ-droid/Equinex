"use client";
import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useStateContext } from "@/context";
import { ClipLoader } from "react-spinners";
import {
  Calendar,
  Upload,
  X,
  Plus,
  Copyright,
  Zap,
  FileText,
  Globe,
  Award,
  Shield,
  AlertTriangle,
  CheckCircle,
  ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { uploadToIPFS } from "@/services/ipfs";
import Link from "next/link";

export default function CreateIPAsset() {
  const router = useRouter();
  const { createIPAsset, address } = useStateContext();
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "patent", // Default category
    status: "pending", // Default status
    target: "",
    deadline: "",
    image: "",
    video: "",
    registrationNumber: "",
    filingDate: "",
    jurisdiction: "",
    expirationDate: "",
    inventors: "",
    applications: [""],
    equityHolders: [{ name: "Creator", percentage: "100" }]
  });

  // IP Asset categories with icons
  const categories = [
    { value: "patent", label: "Patent", icon: <Zap className="h-4 w-4" /> },
    { value: "trademark", label: "Trademark", icon: <Copyright className="h-4 w-4" /> },
    { value: "copyright", label: "Copyright", icon: <FileText className="h-4 w-4" /> },
    { value: "software", label: "Software", icon: <Globe className="h-4 w-4" /> },
    { value: "design", label: "Design", icon: <Award className="h-4 w-4" /> },
    { value: "other", label: "Other IP", icon: <Shield className="h-4 w-4" /> }
  ];

  // IP Asset statuses
  const statuses = [
    { value: "pending", label: "Pending" },
    { value: "application", label: "Application Filed" },
    { value: "registered", label: "Registered" },
    { value: "granted", label: "Granted" },
    { value: "published", label: "Published" }
  ];

  // Handle form input changes
  const handleFormFieldChange = (fieldName: string, e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [fieldName]: e.target.value });
  };

  // Handle equity holder changes
  const handleEquityHolderChange = (index: number, field: 'name' | 'percentage', value: string) => {
    const updatedEquityHolders = [...form.equityHolders];
    updatedEquityHolders[index] = {
      ...updatedEquityHolders[index],
      [field]: value
    };
    setForm({ ...form, equityHolders: updatedEquityHolders });
  };

  // Add new equity holder
  const addEquityHolder = () => {
    setForm({
      ...form,
      equityHolders: [...form.equityHolders, { name: "", percentage: "" }]
    });
  };

  // Remove equity holder
  const removeEquityHolder = (index: number) => {
    const updatedEquityHolders = form.equityHolders.filter((_, i) => i !== index);
    setForm({ ...form, equityHolders: updatedEquityHolders });
  };

  // Handle application changes
  const handleApplicationChange = (index: number, value: string) => {
    const updatedApplications = [...form.applications];
    updatedApplications[index] = value;
    setForm({ ...form, applications: updatedApplications });
  };

  // Add new application
  const addApplication = () => {
    setForm({
      ...form,
      applications: [...form.applications, ""]
    });
  };

  // Remove application
  const removeApplication = (index: number) => {
    const updatedApplications = form.applications.filter((_, i) => i !== index);
    setForm({ ...form, applications: updatedApplications });
  };

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    
    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
    
    try {
      setUploadingImage(true);
      const ipfsHash = await uploadToIPFS(file);
      const imageUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
      setForm({ ...form, image: imageUrl });
    } catch (error) {
      console.error("Error uploading image:", error);
      setFormError("Failed to upload image. Please try again.");
    } finally {
      setUploadingImage(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!form.title.trim()) {
      setFormError("Please enter a title for your IP asset");
      return;
    }
    
    if (!form.description.trim()) {
      setFormError("Please enter a description for your IP asset");
      return;
    }
    
    if (!form.target || isNaN(parseFloat(form.target)) || parseFloat(form.target) <= 0) {
      setFormError("Please enter a valid funding target");
      return;
    }
    
    if (!form.deadline) {
      setFormError("Please select a deadline for your funding campaign");
      return;
    }
    
    if (!form.image) {
      setFormError("Please upload an image for your IP asset");
      return;
    }
    
    if (!form.video || !form.video.includes("youtube.com")) {
      setFormError("Please enter a valid YouTube video URL");
      return;
    }
    
    // Validate equity holders
    const totalPercentage = form.equityHolders.reduce(
      (sum, holder) => sum + (parseFloat(holder.percentage) || 0), 
      0
    );
    
    if (totalPercentage !== 100) {
      setFormError("Total equity percentage must equal 100%");
      return;
    }
    
    // Format deadline as Unix timestamp
    const deadlineDate = new Date(form.deadline);
    const deadlineTimestamp = Math.floor(deadlineDate.getTime() / 1000);
    
    try {
      setIsLoading(true);
      setFormError(null);
      
      // Create IP asset on blockchain
      await createIPAsset({
        owner: address,
        title: form.title,
        description: form.description,
        category: form.category,
        status: form.status,
        equityHolders: form.equityHolders,
        image: form.image,
        video: form.video,
        target: form.target,
        deadline: deadlineTimestamp.toString(),
        registrationNumber: form.registrationNumber,
        filingDate: form.filingDate,
        jurisdiction: form.jurisdiction,
        expirationDate: form.expirationDate,
        inventors: form.inventors,
        applications: form.applications.filter(app => app.trim() !== "")
      });
      
      setFormSubmitted(true);
      
      // Redirect to IP assets page after a short delay
      setTimeout(() => {
        router.push("/ip-assets");
      }, 3000);
    } catch (error) {
      console.error("Error creating IP asset:", error);
      setFormError("Failed to create IP asset. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Animation variants
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-[#1a2942] py-12 px-4">
      <div className="container mx-auto max-w-4xl">
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

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2">Create IP Asset</h1>
          <p className="text-slate-300 max-w-2xl mx-auto">
            List your intellectual property for funding and find investors to help bring your innovation to market
          </p>
        </motion.div>

        {/* Success message */}
        {formSubmitted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8 p-4 bg-green-900/30 border border-green-700 rounded-lg text-center"
          >
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
            <h3 className="text-xl font-bold text-white mb-1">IP Asset Created Successfully!</h3>
            <p className="text-slate-300 mb-2">Your IP asset has been listed for funding.</p>
            <p className="text-sm text-slate-400">Redirecting to IP assets page...</p>
          </motion.div>
        )}

        {/* Error message */}
        {formError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 bg-red-900/30 border border-red-700 rounded-lg flex items-start gap-3"
          >
            <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-bold text-white mb-1">Error</h3>
              <p className="text-slate-300">{formError}</p>
            </div>
          </motion.div>
        )}

        {/* Form */}
        {!formSubmitted && (
          <motion.form 
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            onSubmit={handleSubmit}
            className="space-y-8"
          >
            {/* Basic Information */}
            <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm overflow-hidden">
              <CardHeader className="border-b border-slate-700">
                <CardTitle className="text-white">Basic Information</CardTitle>
                <CardDescription className="text-slate-400">
                  Provide essential details about your intellectual property
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title" className="text-white">Title</Label>
                    <Input
                      id="title"
                      placeholder="Enter the name of your IP asset"
                      value={form.title}
                      onChange={(e) => handleFormFieldChange("title", e)}
                      className="bg-slate-700 border-slate-600 text-white mt-1.5"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="description" className="text-white">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe your intellectual property in detail..."
                      value={form.description}
                      onChange={(e) => handleFormFieldChange("description", e)}
                      className="bg-slate-700 border-slate-600 text-white mt-1.5 min-h-[120px]"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="category" className="text-white">IP Category</Label>
                      <select
                        id="category"
                        value={form.category}
                        onChange={(e) => handleFormFieldChange("category", e)}
                        className="w-full p-2 rounded-md border border-slate-600 bg-slate-700 text-white mt-1.5"
                      >
                        {categories.map((category) => (
                          <option key={category.value} value={category.value}>
                            {category.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <Label htmlFor="status" className="text-white">Status</Label>
                      <select
                        id="status"
                        value={form.status}
                        onChange={(e) => handleFormFieldChange("status", e)}
                        className="w-full p-2 rounded-md border border-slate-600 bg-slate-700 text-white mt-1.5"
                      >
                        {statuses.map((status) => (
                          <option key={status.value} value={status.value}>
                            {status.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    </div>
                </div>
              </CardContent>
            </Card>

            {/* IP Details */}
            <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm overflow-hidden">
              <CardHeader className="border-b border-slate-700">
                <CardTitle className="text-white">IP Details</CardTitle>
                <CardDescription className="text-slate-400">
                  Provide specific information about your intellectual property
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="registrationNumber" className="text-white">Registration/Application Number</Label>
                    <Input
                      id="registrationNumber"
                      placeholder="Enter registration number (if available)"
                      value={form.registrationNumber}
                      onChange={(e) => handleFormFieldChange("registrationNumber", e)}
                      className="bg-slate-700 border-slate-600 text-white mt-1.5"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="filingDate" className="text-white">Filing Date</Label>
                    <Input
                      id="filingDate"
                      type="date"
                      value={form.filingDate}
                      onChange={(e) => handleFormFieldChange("filingDate", e)}
                      className="bg-slate-700 border-slate-600 text-white mt-1.5"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="jurisdiction" className="text-white">Jurisdiction</Label>
                    <Input
                      id="jurisdiction"
                      placeholder="Country or region of registration"
                      value={form.jurisdiction}
                      onChange={(e) => handleFormFieldChange("jurisdiction", e)}
                      className="bg-slate-700 border-slate-600 text-white mt-1.5"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="expirationDate" className="text-white">Expiration Date</Label>
                    <Input
                      id="expirationDate"
                      type="date"
                      value={form.expirationDate}
                      onChange={(e) => handleFormFieldChange("expirationDate", e)}
                      className="bg-slate-700 border-slate-600 text-white mt-1.5"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="inventors" className="text-white">Inventors/Creators</Label>
                  <Input
                    id="inventors"
                    placeholder="Names of inventors or creators"
                    value={form.inventors}
                    onChange={(e) => handleFormFieldChange("inventors", e)}
                    className="bg-slate-700 border-slate-600 text-white mt-1.5"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Potential Applications */}
            <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm overflow-hidden">
              <CardHeader className="border-b border-slate-700">
                <CardTitle className="text-white">Potential Applications</CardTitle>
                <CardDescription className="text-slate-400">
                  List potential commercial applications for your IP
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {form.applications.map((application, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="h-6 w-6 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
                      <span className="text-[#00E6E6] text-xs font-bold">{index + 1}</span>
                    </div>
                    <Input
                      placeholder={`Application ${index + 1}`}
                      value={application}
                      onChange={(e) => handleApplicationChange(index, e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white flex-grow"
                    />
                    {index > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeApplication(index)}
                        className="h-8 w-8 text-slate-400 hover:text-red-400"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={addApplication}
                  className="mt-2 border-dashed border-slate-600 text-slate-400 hover:text-white hover:bg-slate-700"
                >
                  <Plus className="h-4 w-4 mr-2" /> Add Application
                </Button>
              </CardContent>
            </Card>

            {/* Equity Distribution */}
            <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm overflow-hidden">
              <CardHeader className="border-b border-slate-700">
                <CardTitle className="text-white">Equity Distribution</CardTitle>
                <CardDescription className="text-slate-400">
                  Define how equity will be distributed among stakeholders
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {form.equityHolders.map((holder, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <Input
                      placeholder="Stakeholder name"
                      value={holder.name}
                      onChange={(e) => handleEquityHolderChange(index, 'name', e.target.value)}
                      className="bg-slate-700 border-slate-600 text-white flex-grow"
                    />
                    <div className="flex items-center w-32">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        placeholder="0"
                        value={holder.percentage}
                        onChange={(e) => handleEquityHolderChange(index, 'percentage', e.target.value)}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                      <span className="ml-2 text-slate-400">%</span>
                    </div>
                    {index > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeEquityHolder(index)}
                        className="h-8 w-8 text-slate-400 hover:text-red-400"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={addEquityHolder}
                  className="mt-2 border-dashed border-slate-600 text-slate-400 hover:text-white hover:bg-slate-700"
                >
                  <Plus className="h-4 w-4 mr-2" /> Add Stakeholder
                </Button>
                
                <div className="mt-4 p-3 bg-slate-700/30 rounded-md">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">Total Equity:</span>
                    <Badge className={`${
                      form.equityHolders.reduce((sum, holder) => sum + (parseFloat(holder.percentage) || 0), 0) === 100
                        ? 'bg-green-600'
                        : 'bg-amber-600'
                    }`}>
                      {form.equityHolders.reduce((sum, holder) => sum + (parseFloat(holder.percentage) || 0), 0)}%
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Total equity distribution must equal 100%</p>
                </div>
              </CardContent>
            </Card>

            {/* Funding Information */}
            <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm overflow-hidden">
              <CardHeader className="border-b border-slate-700">
                <CardTitle className="text-white">Funding Information</CardTitle>
                <CardDescription className="text-slate-400">
                  Set your funding target and deadline
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="target" className="text-white">Funding Target (AVAX)</Label>
                    <Input
                      id="target"
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="Enter amount in AVAX"
                      value={form.target}
                      onChange={(e) => handleFormFieldChange("target", e)}
                      className="bg-slate-700 border-slate-600 text-white mt-1.5"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="deadline" className="text-white">Funding Deadline</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                      <Input
                        id="deadline"
                        type="date"
                        value={form.deadline}
                        onChange={(e) => handleFormFieldChange("deadline", e)}
                        className="bg-slate-700 border-slate-600 text-white mt-1.5 pl-10"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Media */}
            <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm overflow-hidden">
              <CardHeader className="border-b border-slate-700">
                <CardTitle className="text-white">Media</CardTitle>
                <CardDescription className="text-slate-400">
                  Upload an image and add a video link for your IP asset
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div>
                  <Label className="text-white mb-2 block">IP Asset Image</Label>
                  <div className="border-2 border-dashed border-slate-600 rounded-lg p-6 text-center">
                    {previewUrl ? (
                      <div className="space-y-4">
                        <div className="relative w-full h-48 mx-auto">
                          <img
                            src={previewUrl}
                            alt="IP Asset Preview"
                            className="h-full mx-auto object-contain rounded-md"
                          />
                        </div>
                        <p className="text-sm text-slate-400">
                          {uploadingImage ? "Uploading to IPFS..." : "Image uploaded successfully"}
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setPreviewUrl(null);
                            setForm({ ...form, image: "" });
                            if (fileInputRef.current) fileInputRef.current.value = "";
                          }}
                          className="border-slate-600 text-slate-400 hover:text-white hover:bg-slate-700"
                        >
                          Change Image
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <input
                          type="file"
                          accept="image/*"
                          ref={fileInputRef}
                          onChange={handleImageUpload}
                          className="hidden"
                          id="ip-image"
                        />
                        <label
                          htmlFor="ip-image"
                          className="cursor-pointer flex flex-col items-center justify-center"
                        >
                          {uploadingImage ? (
                            <ClipLoader size={30} color="#00E6E6" />
                          ) : (
                            <>
                              <Upload className="h-10 w-10 text-slate-400 mb-2" />
                              <p className="text-sm font-medium text-white">Click to upload image</p>
                              <p className="text-xs text-slate-400 mt-1">
                                PNG, JPG, or GIF (max. 5MB)
                              </p>
                            </>
                          )}
                        </label>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="video" className="text-white">YouTube Video URL</Label>
                  <Input
                    id="video"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={form.video}
                    onChange={(e) => handleFormFieldChange("video", e)}
                    className="bg-slate-700 border-slate-600 text-white mt-1.5"
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    Add a YouTube video link showcasing your IP asset
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={isLoading || uploadingImage}
                className="bg-[#00E6E6] text-slate-900 hover:bg-[#00d1d1] px-8 py-6 text-lg font-medium"
              >
                {isLoading ? (
                  <ClipLoader size={24} color="#1a2942" />
                ) : (
                  "Create IP Asset"
                )}
              </Button>
            </div>
          </motion.form>
        )}
      </div>
    </div>
  );
}

// Helper function to get category icon
function getCategoryIcon(category: string) {
  switch (category) {
    case "patent":
      return <Zap className="h-4 w-4" />;
    case "trademark":
      return <Copyright className="h-4 w-4" />;
    case "copyright":
      return <FileText className="h-4 w-4" />;
    case "software":
      return <Globe className="h-4 w-4" />;
    case "design":
      return <Award className="h-4 w-4" />;
    default:
      return <Shield className="h-4 w-4" />;
  }
}

