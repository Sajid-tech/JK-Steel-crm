import { useState } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import Cookies from "js-cookie";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { SquarePlus, Loader2, Building, User, Mail, Phone, FileText, MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import BASE_URL from "@/config/BaseUrl";

const CreateClient = () => {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { isDirty },
  } = useForm({
    defaultValues: {
      buyer_name: "",
      buyer_contact_name: "",
      buyer_email: "",
      buyer_mobile: "",
      buyer_gst_vat: "",
      buyer_address: "",
    },
  });


  const validateForm = (data) => {
    const newErrors = {};

  
    if (!data.buyer_name.trim()) {
      newErrors.buyer_name = "Client name is required";
    } else if (data.buyer_name.length < 2) {
      newErrors.buyer_name = "Client name must be at least 2 characters";
    } else if (data.buyer_name.length > 100) {
      newErrors.buyer_name = "Client name must be less than 100 characters";
    }

 
    if (!data.buyer_contact_name.trim()) {
      newErrors.buyer_contact_name = "Contact person is required";
    } else if (data.buyer_contact_name.length < 2) {
      newErrors.buyer_contact_name = "Contact name must be at least 2 characters";
    } else if (data.buyer_contact_name.length > 100) {
      newErrors.buyer_contact_name = "Contact name must be less than 100 characters";
    }

  
    if (!data.buyer_email.trim()) {
      newErrors.buyer_email = "Email is required";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.buyer_email)) {
        newErrors.buyer_email = "Please enter a valid email address";
      } else if (data.buyer_email.length > 100) {
        newErrors.buyer_email = "Email must be less than 100 characters";
      }
    }

    
    if (!data.buyer_mobile.trim()) {
      newErrors.buyer_mobile = "Mobile number is required";
    } else {
      const mobile = data.buyer_mobile.replace(/\D/g, '');
      if (mobile.length < 10) {
        newErrors.buyer_mobile = "Mobile number must be at least 10 digits";
      } else if (mobile.length > 15) {
        newErrors.buyer_mobile = "Mobile number must be less than 15 digits";
      }
    }

 
    if (data.buyer_gst_vat && data.buyer_gst_vat.length > 50) {
      newErrors.buyer_gst_vat = "GST/VAT must be less than 50 characters";
    }

   
    if (data.buyer_address && data.buyer_address.length > 500) {
      newErrors.buyer_address = "Address must be less than 500 characters";
    }

    return newErrors;
  };

  const onSubmit = async (data) => {
  
    const validationErrors = validateForm(data);
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form",
        variant: "destructive",
        duration: 3000,
      });
      
    
      const firstErrorField = Object.keys(validationErrors)[0];
      const element = document.getElementById(firstErrorField);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        element.focus();
      }
      
      return;
    }

    
    setErrors({});
    setIsLoading(true);

    try {
      const token = Cookies.get("token");
      const payload = {
        buyer_name: data.buyer_name.trim(),
        buyer_contact_name: data.buyer_contact_name.trim(),
        buyer_email: data.buyer_email.trim(),
        buyer_mobile: data.buyer_mobile.trim(),
        buyer_gst_vat: data.buyer_gst_vat.trim() || null,
        buyer_address: data.buyer_address.trim() || null,
      };

      const response = await axios.post(
        `${BASE_URL}/api/buyer`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.code === 201) {
        toast({
          title: "Success",
          description: "Client created successfully",
          duration: 3000,
        });
        

        await queryClient.invalidateQueries(["clients"]);
 
        
       
        reset();
        setOpen(false);
      } else {
        throw new Error(response.data.message || "Failed to create client");
      }
    } catch (error) {
      console.error("Error creating client:", error);
      
      let errorMessage = "Failed to create client. Please try again.";
      
      if (error.response) {
        if (error.response.data.errors) {
          const apiErrors = error.response.data.errors;
          setErrors(apiErrors);
          
          const firstError = Object.values(apiErrors)[0];
          if (firstError) {
            errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
          }
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.request) {
        errorMessage = "Network error. Please check your connection.";
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  
  const validateField = (name, value) => {
    const tempErrors = { ...errors };
    
    switch (name) {
      case "buyer_name":
        if (!value.trim()) {
          tempErrors.buyer_name = "Client name is required";
        } else if (value.length < 2) {
          tempErrors.buyer_name = "Client name must be at least 2 characters";
        } else if (value.length > 100) {
          tempErrors.buyer_name = "Client name must be less than 100 characters";
        } else {
          delete tempErrors.buyer_name;
        }
        break;
        
      case "buyer_email":
        if (!value.trim()) {
          tempErrors.buyer_email = "Email is required";
        } else {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            tempErrors.buyer_email = "Please enter a valid email address";
          } else if (value.length > 100) {
            tempErrors.buyer_email = "Email must be less than 100 characters";
          } else {
            delete tempErrors.buyer_email;
          }
        }
        break;
        
      case "buyer_mobile":
        if (!value.trim()) {
          tempErrors.buyer_mobile = "Mobile number is required";
        } else {
          const mobile = value.replace(/\D/g, '');
          if (mobile.length < 10) {
            tempErrors.buyer_mobile = "Mobile number must be at least 10 digits";
          } else if (mobile.length > 15) {
            tempErrors.buyer_mobile = "Mobile number must be less than 15 digits";
          } else {
            delete tempErrors.buyer_mobile;
          }
        }
        break;
        
      default:
        break;
    }
    
    setErrors(tempErrors);
  };

 
  const formatMobileNumber = (value) => {
    return value.replace(/\D/g, '').slice(0, 15);
  };

  const handleOpenChange = (openState) => {
    if (!openState && isDirty) {
      if (window.confirm("You have unsaved changes. Are you sure you want to close?")) {
        reset();
        setErrors({});
        setOpen(openState);
      }
    } else {
      if (!openState) {
        reset();
        setErrors({});
      }
      setOpen(openState);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
          <SquarePlus className="h-4 w-4 mr-2" />
          Add Client
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md md:max-w-lg lg:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center text-lg">
            <Building className="h-5 w-5 mr-2 text-blue-600" />
            Create New Client
          </DialogTitle>
        
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-1.5 ">
       
          <div className="space-y-2">
            <Label htmlFor="buyer_name" className="text-sm font-medium flex items-center">
              {/* <Building className="h-4 w-4 mr-2 text-blue-600" /> */}
              Client Name <span className="text-red-500 ml-1">*</span>
            </Label>
            <Input
              id="buyer_name"
              {...register("buyer_name", {
                onChange: (e) => validateField("buyer_name", e.target.value),
              })}
              placeholder="Enter client company name"
              className={`h-10 ${errors.buyer_name ? "border-red-300 focus:ring-red-200" : ""}`}
            />
            {errors.buyer_name && (
              <p className="text-xs text-red-600 mt-1 flex items-center">
                <span className="mr-1">⚠</span> {errors.buyer_name}
              </p>
            )}
          </div>

   
          <div className="space-y-2">
            <Label htmlFor="buyer_contact_name" className="text-sm font-medium flex items-center">
              {/* <User className="h-4 w-4 mr-2 text-green-600" /> */}
              Contact Person <span className="text-red-500 ml-1">*</span>
            </Label>
            <Input
              id="buyer_contact_name"
              {...register("buyer_contact_name")}
              placeholder="Enter contact person name"
              className="h-10"
            />
            {errors.buyer_contact_name && (
              <p className="text-xs text-red-600 mt-1 flex items-center">
                <span className="mr-1">⚠</span> {errors.buyer_contact_name}
              </p>
            )}
          </div>

      
          <div className="space-y-2">
            <Label htmlFor="buyer_email" className="text-sm font-medium flex items-center">
              {/* <Mail className="h-4 w-4 mr-2 text-purple-600" /> */}
              Email Address <span className="text-red-500 ml-1">*</span>
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="buyer_email"
                type="email"
                {...register("buyer_email", {
                  onChange: (e) => validateField("buyer_email", e.target.value),
                })}
                placeholder="client@example.com"
                className={`h-10 pl-10 ${errors.buyer_email ? "border-red-300 focus:ring-red-200" : ""}`}
              />
            </div>
            {errors.buyer_email && (
              <p className="text-xs text-red-600 mt-1 flex items-center">
                <span className="mr-1">⚠</span> {errors.buyer_email}
              </p>
            )}
          </div>

      
          <div className="space-y-2">
            <Label htmlFor="buyer_mobile" className="text-sm font-medium flex items-center">
              {/* <Phone className="h-4 w-4 mr-2 text-green-600" /> */}
              Mobile Number <span className="text-red-500 ml-1">*</span>
            </Label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="buyer_mobile"
                type="tel"
                {...register("buyer_mobile", {
                  onChange: (e) => {
                    const formatted = formatMobileNumber(e.target.value);
                    e.target.value = formatted;
                    validateField("buyer_mobile", formatted);
                  },
                })}
                placeholder="Enter 10-digit mobile number"
                className={`h-10 pl-10 ${errors.buyer_mobile ? "border-red-300 focus:ring-red-200" : ""}`}
                maxLength={15}
              />
            </div>
            {errors.buyer_mobile && (
              <p className="text-xs text-red-600 mt-1 flex items-center">
                <span className="mr-1">⚠</span> {errors.buyer_mobile}
              </p>
            )}
          </div>

       
          <div className="space-y-2">
            <Label htmlFor="buyer_gst_vat" className="text-sm font-medium flex items-center">
              {/* <FileText className="h-4 w-4 mr-2 text-orange-600" /> */}
              GST/VAT Number
            </Label>
            <Input
              id="buyer_gst_vat"
              {...register("buyer_gst_vat")}
              placeholder="Enter GST/VAT number (optional)"
              className="h-10"
            />
            {errors.buyer_gst_vat && (
              <p className="text-xs text-red-600 mt-1 flex items-center">
                <span className="mr-1">⚠</span> {errors.buyer_gst_vat}
              </p>
            )}
          </div>

      
          <div className="space-y-2">
            <Label htmlFor="buyer_address" className="text-sm font-medium flex items-center">
              {/* <MapPin className="h-4 w-4 mr-2 text-red-600" /> */}
              Address
            </Label>
            <Textarea
              id="buyer_address"
              {...register("buyer_address")}
              placeholder="Enter client address (optional)"
              className="min-h-[80px] resize-none"
              rows={3}
            />
            {errors.buyer_address && (
              <p className="text-xs text-red-600 mt-1 flex items-center">
                <span className="mr-1">⚠</span> {errors.buyer_address}
              </p>
            )}
            <div className="flex justify-between">
              <p className="text-xs text-gray-500">Optional field</p>
              <p className="text-xs text-gray-500">
                {watch("buyer_address")?.length || 0}/500 characters
              </p>
            </div>
          </div>

          
          <div className="flex justify-end space-x-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isLoading}
              className="border-gray-300 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
            >
              {isLoading ? (
                <span className="flex items-center">
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </span>
              ) : (
                "Create Client"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateClient;