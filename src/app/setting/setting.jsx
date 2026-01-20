import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Phone, Mail, Loader2, Save, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import axios from "axios";
import Cookies from "js-cookie";
import BASE_URL from "@/config/BaseUrl";

const Setting = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");
  const [originalData, setOriginalData] = useState({
    name: "",
    mobile: "",
    email: ""
  });
  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    email: ""
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const token = Cookies.get("token");
      const response = await axios.get(`${BASE_URL}/api/panel-fetch-profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data?.profile) {
        const { name, mobile, email } = response.data.profile;
        const profileData = { name, mobile, email };
        setFormData(profileData);
        setOriginalData(profileData);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      setError("Failed to load profile data");
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.mobile) {
      newErrors.mobile = "Mobile number is required";
    } else if (!/^[0-9]{10}$/.test(formData.mobile)) {
      newErrors.mobile = "Please enter a valid 10-digit mobile number";
    }

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isDirty = () => {
    return formData.mobile !== originalData.mobile || formData.email !== originalData.email;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setUpdating(true);
      setError("");
      
      const token = Cookies.get("token");
      const response = await axios.put(
        `${BASE_URL}/api/panel-update-profile`,
        {
          mobile: formData.mobile,
          email: formData.email
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
        setOriginalData(formData);
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
      setUpdating(false);
    }
  };

  const MobileSkeleton = () => (
    <div className="p-4 space-y-4">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  );

  const DesktopSkeleton = () => (
    <div className="">
      <div className="max-w-340 mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
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
    </div>
  );

  if (loading) {
    return (
      <div className="w-full grid grid-cols-1">
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
    <div className="w-full grid grid-cols-1">
      <div className="sm:hidden">
        <div className="p-4 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-800">Profile Settings</h1>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={onSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium flex items-center">
                <User className="h-4 w-4 mr-2 text-gray-500" />
                Name
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
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
                value={formData.mobile}
                onChange={handleChange}
                placeholder="Enter 10-digit mobile number"
                className={`h-10 ${errors.mobile ? "border-red-300 focus:ring-red-200" : ""}`}
              />
              {errors.mobile && (
                <p className="text-xs text-red-600 mt-1">{errors.mobile}</p>
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
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter email address"
                className={`h-10 ${errors.email ? "border-red-300 focus:ring-red-200" : ""}`}
              />
              {errors.email && (
                <p className="text-xs text-red-600 mt-1">{errors.email}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full gap-2"
              disabled={updating || !isDirty()}
            >
              {updating ? (
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
        </div>
      </div>

      <div className="hidden sm:block">
        <div className="">
          <div className="max-w-340 mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-800">Profile Settings</h1>
              <p className="text-gray-600 mt-2">
                Update your contact information
              </p>
            </div>

            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  Update your mobile number and email address
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={onSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="desktop-name" className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-500" />
                        Name
                      </Label>
                      <Input
                        id="desktop-name"
                        name="name"
                        value={formData.name}
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
                        value={formData.mobile}
                        onChange={handleChange}
                        placeholder="Enter 10-digit mobile number"
                        className={`h-10 ${errors.mobile ? "border-red-300 focus:ring-red-200" : ""}`}
                      />
                      {errors.mobile && (
                        <p className="text-sm text-red-600">{errors.mobile}</p>
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
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Enter email address"
                        className={`h-10 ${errors.email ? "border-red-300 focus:ring-red-200" : ""}`}
                      />
                      {errors.email && (
                        <p className="text-sm text-red-600">{errors.email}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t">
                    <Button
                      type="submit"
                      className="gap-2"
                      disabled={updating || !isDirty()}
                    >
                      {updating ? (
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

            <div className="mt-6 text-center text-gray-500 text-sm">
              <p>Note: Only mobile number and email address can be updated</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Setting;