import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  User, 
  Phone, 
  Mail, 
  Loader2, 
  Save, 
  AlertCircle,
  Building,
  MapPin,
  FileText,
  Globe,
  Percent,
  FileSignature,
  Lock
} from "lucide-react";
import axios from "axios";
import Cookies from "js-cookie";
import BASE_URL from "@/config/BaseUrl";

const CompanySetting = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("company");
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [branchLoading, setBranchLoading] = useState(false);
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [updatingBranch, setUpdatingBranch] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  
  const [error, setError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  
  // Profile Data
  const [originalProfileData, setOriginalProfileData] = useState({
    name: "",
    mobile: "",
    email: ""
  });
  
  const [profileFormData, setProfileFormData] = useState({
    name: "",
    mobile: "",
    email: ""
  });
  
  const [profileErrors, setProfileErrors] = useState({});
  
  // Branch Data
  const [originalBranchData, setOriginalBranchData] = useState({
    branch_name: "",
    branch_address: "",
    branch_gst: "",
    branch_mobile_no: "",
    branch_email_id: "",
    branch_currency: "INR",
    branch_tax_rate: "",
    branch_footer: ""
  });
  
  const [branchFormData, setBranchFormData] = useState({
    branch_name: "",
    branch_address: "",
    branch_gst: "",
    branch_mobile_no: "",
    branch_email_id: "",
    branch_currency: "INR",
    branch_tax_rate: "",
    branch_footer: ""
  });
  
  const [branchErrors, setBranchErrors] = useState({});
  
  // Password Data
  const [passwordFormData, setPasswordFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchProfile(), fetchBranchDetails()]);
    } catch (error) {
      console.error("Error fetching initial data:", error);
      setError("Failed to load settings data");
      toast({
        title: "Error",
        description: "Failed to load settings data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    try {
      setProfileLoading(true);
      const token = Cookies.get("token");
      const response = await axios.get(`${BASE_URL}/api/panel-fetch-profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data?.profile) {
        const { name, mobile, email } = response.data.profile;
        const profileData = { name, mobile, email };
        setProfileFormData(profileData);
        setOriginalProfileData(profileData);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      throw error;
    } finally {
      setProfileLoading(false);
    }
  };

  const fetchBranchDetails = async () => {
    try {
      setBranchLoading(true);
      const token = Cookies.get("token");
      const response = await axios.get(`${BASE_URL}/api/panel-fetch-branch`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data?.data) {
        const branchData = response.data.data;
        setBranchFormData(branchData);
        setOriginalBranchData(branchData);
      }
    } catch (error) {
      console.error("Error fetching branch details:", error);
      throw error;
    } finally {
      setBranchLoading(false);
    }
  };

  // Profile Handlers
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (profileErrors[name]) {
      setProfileErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const validateProfileForm = () => {
    const newErrors = {};

    if (!profileFormData.mobile) {
      newErrors.mobile = "Mobile number is required";
    } else if (!/^[0-9]{10}$/.test(profileFormData.mobile)) {
      newErrors.mobile = "Please enter a valid 10-digit mobile number";
    }

    if (!profileFormData.email) {
      newErrors.email = "Email is required";
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(profileFormData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    setProfileErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isProfileDirty = () => {
    return profileFormData.mobile !== originalProfileData.mobile || 
           profileFormData.email !== originalProfileData.email;
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateProfileForm()) {
      return;
    }

    try {
      setUpdatingProfile(true);
      setError("");
      
      const token = Cookies.get("token");
      const response = await axios.put(
        `${BASE_URL}/api/panel-update-profile`,
        {
          mobile: profileFormData.mobile,
          email: profileFormData.email
        },
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      );

      if (response.data?.code === 200) {
        toast({
          title: "Success",
          description: "Profile updated successfully",
        });
        setOriginalProfileData(profileFormData);
        await fetchProfile(); // Refresh data
      } else {
        throw new Error(response.data?.message || "Update failed");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setError(error.response?.data?.message || "Failed to update profile");
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update profile",
        variant: "destructive"
      });
    } finally {
      setUpdatingProfile(false);
    }
  };

  // Branch Handlers
  const handleBranchChange = (e) => {
    const { name, value } = e.target;
    setBranchFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (branchErrors[name]) {
      setBranchErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const validateBranchForm = () => {
    const newErrors = {};

    if (!branchFormData.branch_name) {
      newErrors.branch_name = "Branch name is required";
    }

    if (!branchFormData.branch_address) {
      newErrors.branch_address = "Branch address is required";
    }

    if (!branchFormData.branch_mobile_no) {
      newErrors.branch_mobile_no = "Mobile number is required";
    } else if (!/^[0-9]{10}$/.test(branchFormData.branch_mobile_no)) {
      newErrors.branch_mobile_no = "Please enter a valid 10-digit mobile number";
    }

    if (!branchFormData.branch_email_id) {
      newErrors.branch_email_id = "Email is required";
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(branchFormData.branch_email_id)) {
      newErrors.branch_email_id = "Please enter a valid email address";
    }

    if (!branchFormData.branch_tax_rate) {
      newErrors.branch_tax_rate = "Tax rate is required";
    } else if (isNaN(branchFormData.branch_tax_rate) || parseFloat(branchFormData.branch_tax_rate) < 0) {
      newErrors.branch_tax_rate = "Please enter a valid tax rate";
    }

    setBranchErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isBranchDirty = () => {
    return JSON.stringify(branchFormData) !== JSON.stringify(originalBranchData);
  };

  const handleBranchSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateBranchForm()) {
      return;
    }

    try {
      setUpdatingBranch(true);
      setError("");
      
      const token = Cookies.get("token");
      const response = await axios.put(
        `${BASE_URL}/api/panel-update-branch`,
        branchFormData,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      );

      if (response.data?.code === 200) {
        toast({
          title: "Success",
          description: "Branch details updated successfully",
        });
        setOriginalBranchData(branchFormData);
        await fetchBranchDetails(); // Refresh data
      } else {
        throw new Error(response.data?.message || "Update failed");
      }
    } catch (error) {
      console.error("Error updating branch:", error);
      setError(error.response?.data?.message || "Failed to update branch details");
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update branch details",
        variant: "destructive"
      });
    } finally {
      setUpdatingBranch(false);
    }
  };

  // Password Handlers
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (passwordError) setPasswordError("");
  };

  const validatePasswordForm = () => {
    if (!passwordFormData.currentPassword) {
      setPasswordError("Current password is required");
      return false;
    }
    if (!passwordFormData.newPassword) {
      setPasswordError("New password is required");
      return false;
    }
    if (passwordFormData.newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters");
      return false;
    }
    if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
      setPasswordError("New passwords do not match");
      return false;
    }
    return true;
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (!validatePasswordForm()) {
      return;
    }

    try {
      setUpdatingPassword(true);
      setPasswordError("");
      
      const token = Cookies.get("token");
      const response = await axios.post(
        `${BASE_URL}/api/panel-change-password`,
        {
          name: originalProfileData.name,
          currentPassword: passwordFormData.currentPassword,
          newPassword: passwordFormData.newPassword
        },
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      );

      if (response.data?.code === 200) {
        toast({
          title: "Success",
          description: "Password changed successfully",
        });
        setPasswordFormData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        });
      } else {
        throw new Error(response.data?.message || "Password change failed");
      }
    } catch (error) {
      console.error("Error changing password:", error);
      setPasswordError(error.response?.data?.message || "Failed to change password");
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to change password",
        variant: "destructive"
      });
    } finally {
      setUpdatingPassword(false);
    }
  };

  // Skeleton Loaders
  const MobileSkeleton = () => (
    <div className="p-4 space-y-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );

  const DesktopSkeleton = () => (
    <div className="max-w-340 mx-auto ">
      <Skeleton className="h-8 w-48 mb-6" />
      <Skeleton className="h-12 w-full mb-6" />
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    </div>
  );

  if (loading) {
    return (
      <div className="w-full">
        <div className="sm:hidden">
          <MobileSkeleton />
        </div>
        <div className="hidden sm:block">
          <DesktopSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen ">
    
      <div className="sm:hidden">
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-800">Company Settings</h1>
          </div>

        
          <div className="flex space-x-2 border-b">
            <button
              className={`pb-2 px-3 text-sm font-medium ${activeTab === "company" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500"}`}
              onClick={() => setActiveTab("company")}
            >
              Company Details
            </button>
            <button
              className={`pb-2 px-3 text-sm font-medium ${activeTab === "login" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500"}`}
              onClick={() => setActiveTab("login")}
            >
              Login Details
            </button>
            <button
              className={`pb-2 px-3 text-sm font-medium ${activeTab === "password" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500"}`}
              onClick={() => setActiveTab("password")}
            >
              Change Password
            </button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

       
          {activeTab === "company" && (
            <form onSubmit={handleBranchSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="branch_name" className="text-sm font-medium flex items-center">
                  <Building className="h-4 w-4 mr-2 text-gray-500" />
                  Branch Name
                </Label>
                <Input
                  id="branch_name"
                  name="branch_name"
                  value={branchFormData.branch_name}
                  onChange={handleBranchChange}
                  placeholder="Enter branch name"
                  className={`h-10 ${branchErrors.branch_name ? "border-red-300 focus:ring-red-200" : ""}`}
                />
                {branchErrors.branch_name && (
                  <p className="text-xs text-red-600 mt-1">{branchErrors.branch_name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="branch_address" className="text-sm font-medium flex items-center">
                  <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                  Branch Address
                </Label>
                <Input
                  id="branch_address"
                  name="branch_address"
                  value={branchFormData.branch_address}
                  onChange={handleBranchChange}
                  placeholder="Enter branch address"
                  className={`h-10 ${branchErrors.branch_address ? "border-red-300 focus:ring-red-200" : ""}`}
                />
                {branchErrors.branch_address && (
                  <p className="text-xs text-red-600 mt-1">{branchErrors.branch_address}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="branch_gst" className="text-sm font-medium flex items-center">
                  <FileText className="h-4 w-4 mr-2 text-gray-500" />
                  GST Number
                </Label>
                <Input
                  id="branch_gst"
                  name="branch_gst"
                  value={branchFormData.branch_gst}
                  onChange={handleBranchChange}
                  placeholder="Enter GST number"
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="branch_mobile_no" className="text-sm font-medium flex items-center">
                  <Phone className="h-4 w-4 mr-2 text-gray-500" />
                  Mobile Number
                </Label>
                <Input
                  id="branch_mobile_no"
                  name="branch_mobile_no"
                  type="tel"
                  value={branchFormData.branch_mobile_no}
                  onChange={handleBranchChange}
                  placeholder="Enter 10-digit mobile number"
                  className={`h-10 ${branchErrors.branch_mobile_no ? "border-red-300 focus:ring-red-200" : ""}`}
                />
                {branchErrors.branch_mobile_no && (
                  <p className="text-xs text-red-600 mt-1">{branchErrors.branch_mobile_no}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="branch_email_id" className="text-sm font-medium flex items-center">
                  <Mail className="h-4 w-4 mr-2 text-gray-500" />
                  Email Address
                </Label>
                <Input
                  id="branch_email_id"
                  name="branch_email_id"
                  type="email"
                  value={branchFormData.branch_email_id}
                  onChange={handleBranchChange}
                  placeholder="Enter email address"
                  className={`h-10 ${branchErrors.branch_email_id ? "border-red-300 focus:ring-red-200" : ""}`}
                />
                {branchErrors.branch_email_id && (
                  <p className="text-xs text-red-600 mt-1">{branchErrors.branch_email_id}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="branch_currency" className="text-sm font-medium flex items-center">
                  <Globe className="h-4 w-4 mr-2 text-gray-500" />
                  Currency
                </Label>
                <Input
                  id="branch_currency"
                  name="branch_currency"
                  value={branchFormData.branch_currency}
                  onChange={handleBranchChange}
                  placeholder="Enter currency"
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="branch_tax_rate" className="text-sm font-medium flex items-center">
                  <Percent className="h-4 w-4 mr-2 text-gray-500" />
                  Tax Rate (%)
                </Label>
                <Input
                  id="branch_tax_rate"
                  name="branch_tax_rate"
                  type="number"
                  step="0.01"
                  value={branchFormData.branch_tax_rate}
                  onChange={handleBranchChange}
                  placeholder="Enter tax rate"
                  className={`h-10 ${branchErrors.branch_tax_rate ? "border-red-300 focus:ring-red-200" : ""}`}
                />
                {branchErrors.branch_tax_rate && (
                  <p className="text-xs text-red-600 mt-1">{branchErrors.branch_tax_rate}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="branch_footer" className="text-sm font-medium flex items-center">
                  <FileSignature className="h-4 w-4 mr-2 text-gray-500" />
                  Invoice Footer
                </Label>
                <Input
                  id="branch_footer"
                  name="branch_footer"
                  value={branchFormData.branch_footer}
                  onChange={handleBranchChange}
                  placeholder="Enter invoice footer text"
                  className="h-10"
                />
              </div>

              <Button
                type="submit"
                className="w-full gap-2"
                disabled={updatingBranch || !isBranchDirty()}
              >
                {updatingBranch ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </form>
          )}

         
          {activeTab === "login" && (
            <form onSubmit={handleProfileSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium flex items-center">
                  <User className="h-4 w-4 mr-2 text-gray-500" />
                  Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={profileFormData.name}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-xs text-gray-500">Name cannot be changed</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mobile" className="text-sm font-medium flex items-center">
                  <Phone className="h-4 w-4 mr-2 text-gray-500" />
                  Mobile Number
                </Label>
                <Input
                  id="mobile"
                  name="mobile"
                  type="tel"
                  value={profileFormData.mobile}
                  onChange={handleProfileChange}
                  placeholder="Enter 10-digit mobile number"
                  className={`h-10 ${profileErrors.mobile ? "border-red-300 focus:ring-red-200" : ""}`}
                />
                {profileErrors.mobile && (
                  <p className="text-xs text-red-600 mt-1">{profileErrors.mobile}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium flex items-center">
                  <Mail className="h-4 w-4 mr-2 text-gray-500" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={profileFormData.email}
                  onChange={handleProfileChange}
                  placeholder="Enter email address"
                  className={`h-10 ${profileErrors.email ? "border-red-300 focus:ring-red-200" : ""}`}
                />
                {profileErrors.email && (
                  <p className="text-xs text-red-600 mt-1">{profileErrors.email}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full gap-2"
                disabled={updatingProfile || !isProfileDirty()}
              >
                {updatingProfile ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </form>
          )}

          
          {activeTab === "password" && (
            <form onSubmit={handlePasswordSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="currentPassword" className="text-sm font-medium flex items-center">
                  <Lock className="h-4 w-4 mr-2 text-gray-500" />
                  Current Password
                </Label>
                <Input
                  id="currentPassword"
                  name="currentPassword"
                  type="password"
                  value={passwordFormData.currentPassword}
                  onChange={handlePasswordChange}
                  placeholder="Enter current password"
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-sm font-medium flex items-center">
                  <Lock className="h-4 w-4 mr-2 text-gray-500" />
                  New Password
                </Label>
                <Input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  value={passwordFormData.newPassword}
                  onChange={handlePasswordChange}
                  placeholder="Enter new password"
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium flex items-center">
                  <Lock className="h-4 w-4 mr-2 text-gray-500" />
                  Confirm Password
                </Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={passwordFormData.confirmPassword}
                  onChange={handlePasswordChange}
                  placeholder="Confirm new password"
                  className="h-10"
                />
              </div>

              {passwordError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{passwordError}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full gap-2"
                disabled={updatingPassword}
              >
                {updatingPassword ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Changing...
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    Change Password
                  </>
                )}
              </Button>
            </form>
          )}
        </div>
      </div>

    
      <div className="hidden sm:block">
        <div className="max-w-340 mx-auto ">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800">Company Settings</h1>
            <p className="text-gray-600 mt-2">
              Manage your company information and profile settings
            </p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="company" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="company">Company Details</TabsTrigger>
              <TabsTrigger value="login">Login Details</TabsTrigger>
              <TabsTrigger value="password">Change Password</TabsTrigger>
            </TabsList>

           
            <TabsContent value="company">
              <Card>
                <CardHeader>
                  <CardTitle>Company Information</CardTitle>
                  <CardDescription>
                    Update your company branch details and settings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleBranchSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="desktop-branch_name" className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-gray-500" />
                          Branch Name
                        </Label>
                        <Input
                          id="desktop-branch_name"
                          name="branch_name"
                          value={branchFormData.branch_name}
                          onChange={handleBranchChange}
                          placeholder="Enter branch name"
                          className={`h-10 ${branchErrors.branch_name ? "border-red-300 focus:ring-red-200" : ""}`}
                        />
                        {branchErrors.branch_name && (
                          <p className="text-sm text-red-600">{branchErrors.branch_name}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="desktop-branch_gst" className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-500" />
                          GST Number
                        </Label>
                        <Input
                          id="desktop-branch_gst"
                          name="branch_gst"
                          value={branchFormData.branch_gst}
                          onChange={handleBranchChange}
                          placeholder="Enter GST number"
                          className="h-10"
                        />
                      </div>

                      <div className="md:col-span-2 space-y-2">
                        <Label htmlFor="desktop-branch_address" className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          Branch Address
                        </Label>
                        <Input
                          id="desktop-branch_address"
                          name="branch_address"
                          value={branchFormData.branch_address}
                          onChange={handleBranchChange}
                          placeholder="Enter branch address"
                          className={`h-10 ${branchErrors.branch_address ? "border-red-300 focus:ring-red-200" : ""}`}
                        />
                        {branchErrors.branch_address && (
                          <p className="text-sm text-red-600">{branchErrors.branch_address}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="desktop-branch_mobile_no" className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-500" />
                          Mobile Number
                        </Label>
                        <Input
                          id="desktop-branch_mobile_no"
                          name="branch_mobile_no"
                          type="tel"
                          value={branchFormData.branch_mobile_no}
                          onChange={handleBranchChange}
                          placeholder="Enter 10-digit mobile number"
                          className={`h-10 ${branchErrors.branch_mobile_no ? "border-red-300 focus:ring-red-200" : ""}`}
                        />
                        {branchErrors.branch_mobile_no && (
                          <p className="text-sm text-red-600">{branchErrors.branch_mobile_no}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="desktop-branch_email_id" className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-500" />
                          Email Address
                        </Label>
                        <Input
                          id="desktop-branch_email_id"
                          name="branch_email_id"
                          type="email"
                          value={branchFormData.branch_email_id}
                          onChange={handleBranchChange}
                          placeholder="Enter email address"
                          className={`h-10 ${branchErrors.branch_email_id ? "border-red-300 focus:ring-red-200" : ""}`}
                        />
                        {branchErrors.branch_email_id && (
                          <p className="text-sm text-red-600">{branchErrors.branch_email_id}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="desktop-branch_currency" className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-gray-500" />
                          Currency
                        </Label>
                        <Input
                          id="desktop-branch_currency"
                          name="branch_currency"
                          value={branchFormData.branch_currency}
                          onChange={handleBranchChange}
                          placeholder="Enter currency"
                          className="h-10"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="desktop-branch_tax_rate" className="flex items-center gap-2">
                          <Percent className="h-4 w-4 text-gray-500" />
                          Tax Rate (%)
                        </Label>
                        <Input
                          id="desktop-branch_tax_rate"
                          name="branch_tax_rate"
                          type="number"
                          step="0.01"
                          value={branchFormData.branch_tax_rate}
                          onChange={handleBranchChange}
                          placeholder="Enter tax rate"
                          className={`h-10 ${branchErrors.branch_tax_rate ? "border-red-300 focus:ring-red-200" : ""}`}
                        />
                        {branchErrors.branch_tax_rate && (
                          <p className="text-sm text-red-600">{branchErrors.branch_tax_rate}</p>
                        )}
                      </div>

                      <div className="md:col-span-2 space-y-2">
                        <Label htmlFor="desktop-branch_footer" className="flex items-center gap-2">
                          <FileSignature className="h-4 w-4 text-gray-500" />
                          Invoice Footer
                        </Label>
                        <Input
                          id="desktop-branch_footer"
                          name="branch_footer"
                          value={branchFormData.branch_footer}
                          onChange={handleBranchChange}
                          placeholder="Enter invoice footer text"
                          className="h-10"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t">
                      <Button
                        type="submit"
                        className="gap-2"
                        disabled={updatingBranch || !isBranchDirty()}
                      >
                        {updatingBranch ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Saving Changes...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            
            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Login Details</CardTitle>
                  <CardDescription>
                    Update your personal login information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleProfileSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="desktop-name" className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-500" />
                          Name
                        </Label>
                        <Input
                          id="desktop-name"
                          name="name"
                          value={profileFormData.name}
                          disabled
                          className="bg-gray-50"
                        />
                        <p className="text-xs text-gray-500">Name cannot be changed</p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="desktop-mobile" className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-500" />
                          Mobile Number
                        </Label>
                        <Input
                          id="desktop-mobile"
                          name="mobile"
                          type="tel"
                          value={profileFormData.mobile}
                          onChange={handleProfileChange}
                          placeholder="Enter 10-digit mobile number"
                          className={`h-10 ${profileErrors.mobile ? "border-red-300 focus:ring-red-200" : ""}`}
                        />
                        {profileErrors.mobile && (
                          <p className="text-sm text-red-600">{profileErrors.mobile}</p>
                        )}
                      </div>

                      <div className="md:col-span-2 space-y-2">
                        <Label htmlFor="desktop-email" className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-500" />
                          Email Address
                        </Label>
                        <Input
                          id="desktop-email"
                          name="email"
                          type="email"
                          value={profileFormData.email}
                          onChange={handleProfileChange}
                          placeholder="Enter email address"
                          className={`h-10 ${profileErrors.email ? "border-red-300 focus:ring-red-200" : ""}`}
                        />
                        {profileErrors.email && (
                          <p className="text-sm text-red-600">{profileErrors.email}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t">
                      <Button
                        type="submit"
                        className="gap-2"
                        disabled={updatingProfile || !isProfileDirty()}
                      >
                        {updatingProfile ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Saving Changes...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

 
            <TabsContent value="password">
              <Card>
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                  <CardDescription>
                    Update your account password for security
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePasswordSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2  space-y-2">
                        <Label htmlFor="desktop-currentPassword" className="flex items-center gap-2">
                          <Lock className="h-4 w-4 text-gray-500" />
                          Current Password
                        </Label>
                        <Input
                          id="desktop-currentPassword"
                          name="currentPassword"
                          type="password"
                          value={passwordFormData.currentPassword}
                          onChange={handlePasswordChange}
                          placeholder="Enter current password"
                          className="h-10"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="desktop-newPassword" className="flex items-center gap-2">
                          <Lock className="h-4 w-4 text-gray-500" />
                          New Password
                        </Label>
                        <Input
                          id="desktop-newPassword"
                          name="newPassword"
                          type="password"
                          value={passwordFormData.newPassword}
                          onChange={handlePasswordChange}
                          placeholder="Enter new password"
                          className="h-10"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="desktop-confirmPassword" className="flex items-center gap-2">
                          <Lock className="h-4 w-4 text-gray-500" />
                          Confirm Password
                        </Label>
                        <Input
                          id="desktop-confirmPassword"
                          name="confirmPassword"
                          type="password"
                          value={passwordFormData.confirmPassword}
                          onChange={handlePasswordChange}
                          placeholder="Confirm new password"
                          className="h-10"
                        />
                      </div>
                    </div>

                    {passwordError && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{passwordError}</AlertDescription>
                      </Alert>
                    )}

                    <div className="flex justify-end pt-4 border-t">
                      <Button
                        type="submit"
                        className="gap-2"
                        disabled={updatingPassword}
                      >
                        {updatingPassword ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Changing Password...
                          </>
                        ) : (
                          <>
                            <Lock className="h-4 w-4" />
                            Change Password
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

        
        </div>
      </div>
    </div>
  );
};

export default CompanySetting;