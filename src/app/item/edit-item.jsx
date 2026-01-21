import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import Cookies from "js-cookie";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Edit, Loader2, Package, FileText, DollarSign, Percent, CheckCircle, XCircle, Ruler, Box, Tag } from "lucide-react";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import BASE_URL from "@/config/BaseUrl";

const EditItem = ({ itemId }) => {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [itemData, setItemData] = useState(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [errors, setErrors] = useState({});

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { isDirty },
  } = useForm({
    defaultValues: {
      item_name: "",
      item_type: "",
      item_description: "",
      item_price: "",
      item_tax: "",
      item_size: "",
      item_unit: "",
      item_status: "Active",
    },
  });

  useEffect(() => {
    if (open && itemId) {
      fetchItemData();
    }
  }, [open, itemId]);

  const fetchItemData = async () => {
    if (!itemId) return;

    setIsFetching(true);
    try {
      const token = Cookies.get("token");
      const response = await axios.get(
        `${BASE_URL}/api/item/${itemId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.data) {
        const data = response.data.data;
        setItemData(data);
        
        Object.keys(data).forEach(key => {
          if (data[key] !== null && data[key] !== undefined) {
            setValue(key, data[key]);
          }
        });
      } else {
        throw new Error("No item data found");
      }
    } catch (error) {
      console.error("Error fetching item data:", error);
      toast({
        title: "Error",
        description: "Failed to load item data. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
      setOpen(false);
    } finally {
      setIsFetching(false);
    }
  };

  const validateForm = (data) => {
    const newErrors = {};

    if (!data.item_name.trim()) {
      newErrors.item_name = "Item name is required";
    } else if (data.item_name.length < 2) {
      newErrors.item_name = "Item name must be at least 2 characters";
    } else if (data.item_name.length > 100) {
      newErrors.item_name = "Item name must be less than 100 characters";
    }

    // Validation for item_type (optional)
    if (data.item_type && data.item_type.length > 50) {
      newErrors.item_type = "Item type must be less than 50 characters";
    }

    if (data.item_description && data.item_description.length > 500) {
      newErrors.item_description = "Description must be less than 500 characters";
    }

    if (!data.item_price.trim()) {
      newErrors.item_price = "Price is required";
    } else {
      const price = parseFloat(data.item_price);
      if (isNaN(price)) {
        newErrors.item_price = "Price must be a valid number";
      } else if (price < 0) {
        newErrors.item_price = "Price cannot be negative";
      } else if (price > 9999999.99) {
        newErrors.item_price = "Price must be less than 10,000,000";
      }
    }

    if (!data.item_tax.trim()) {
      newErrors.item_tax = "Tax is required";
    } else {
      const tax = parseFloat(data.item_tax);
      if (isNaN(tax)) {
        newErrors.item_tax = "Tax must be a valid number";
      } else if (tax < 0) {
        newErrors.item_tax = "Tax cannot be negative";
      } else if (tax > 100) {
        newErrors.item_tax = "Tax cannot exceed 100%";
      }
    }

    // Validation for item_size (optional)
    if (data.item_size && data.item_size.length > 50) {
      newErrors.item_size = "Size must be less than 50 characters";
    }

    // Validation for item_unit (optional)
    if (data.item_unit && data.item_unit.length > 20) {
      newErrors.item_unit = "Unit must be less than 20 characters";
    }

    if (!data.item_status) {
      newErrors.item_status = "Status is required";
    } else if (!["Active", "Inactive"].includes(data.item_status)) {
      newErrors.item_status = "Status must be either Active or Inactive";
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
        item_name: data.item_name.trim(),
        item_type: data.item_type.trim() || null,
        item_description: data.item_description.trim() || null,
        item_price: parseFloat(data.item_price),
        item_tax: parseFloat(data.item_tax),
        item_size: data.item_size.trim() || null,
        item_unit: data.item_unit.trim() || null,
        item_status: data.item_status,
      };

      const response = await axios.put(
        `${BASE_URL}/api/item/${itemId}`,
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
          description: "Item updated successfully",
          duration: 3000,
        });
        
        await queryClient.invalidateQueries(["items"]);
        
        setOpen(false);
      } else {
        throw new Error(response.data.message || "Failed to update item");
      }
    } catch (error) {
      console.error("Error updating item:", error);
      
      let errorMessage = "Failed to update item. Please try again.";
      
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
      case "item_name":
        if (!value.trim()) {
          tempErrors.item_name = "Item name is required";
        } else if (value.length < 2) {
          tempErrors.item_name = "Item name must be at least 2 characters";
        } else if (value.length > 100) {
          tempErrors.item_name = "Item name must be less than 100 characters";
        } else {
          delete tempErrors.item_name;
        }
        break;
        
      case "item_type":
        if (value && value.length > 50) {
          tempErrors.item_type = "Item type must be less than 50 characters";
        } else {
          delete tempErrors.item_type;
        }
        break;
        
      case "item_price":
        if (!value.trim()) {
          tempErrors.item_price = "Price is required";
        } else {
          const price = parseFloat(value);
          if (isNaN(price)) {
            tempErrors.item_price = "Price must be a valid number";
          } else if (price < 0) {
            tempErrors.item_price = "Price cannot be negative";
          } else if (price > 9999999.99) {
            tempErrors.item_price = "Price must be less than 10,000,000";
          } else {
            delete tempErrors.item_price;
          }
        }
        break;
        
      case "item_tax":
        if (!value.trim()) {
          tempErrors.item_tax = "Tax is required";
        } else {
          const tax = parseFloat(value);
          if (isNaN(tax)) {
            tempErrors.item_tax = "Tax must be a valid number";
          } else if (tax < 0) {
            tempErrors.item_tax = "Tax cannot be negative";
          } else if (tax > 100) {
            tempErrors.item_tax = "Tax cannot exceed 100%";
          } else {
            delete tempErrors.item_tax;
          }
        }
        break;
        
      case "item_size":
        if (value && value.length > 50) {
          tempErrors.item_size = "Size must be less than 50 characters";
        } else {
          delete tempErrors.item_size;
        }
        break;
        
      case "item_unit":
        if (value && value.length > 20) {
          tempErrors.item_unit = "Unit must be less than 20 characters";
        } else {
          delete tempErrors.item_unit;
        }
        break;
        
      default:
        break;
    }
    
    setErrors(tempErrors);
  };

  const formatPrice = (value) => {
    const cleaned = value.replace(/[^\d.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      return parts[0] + '.' + parts.slice(1).join('');
    }
    if (parts[1] && parts[1].length > 2) {
      return parts[0] + '.' + parts[1].slice(0, 2);
    }
    return cleaned;
  };

  const formatTax = (value) => {
    const cleaned = value.replace(/[^\d.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      return parts[0] + '.' + parts.slice(1).join('');
    }
    if (parts[1] && parts[1].length > 2) {
      return parts[0] + '.' + parts[1].slice(0, 2);
    }
    return cleaned;
  };

  const handleOpenChange = (openState) => {
    if (!openState && isDirty) {
        setOpen(openState);
    } else {
      if (!openState) {
        if (itemData) {
          Object.keys(itemData).forEach(key => {
            if (itemData[key] !== null && itemData[key] !== undefined) {
              setValue(key, itemData[key]);
            }
          });
        }
        setErrors({});
      }
      setOpen(openState);
    }
  };

  if (!itemId) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 hover:bg-blue-50"
        >
          <Edit className="h-4 w-4 text-blue-600" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md md:max-w-lg lg:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center text-lg">
            <Edit className="h-5 w-5 mr-2 text-blue-600" />
            Edit Item
          </DialogTitle>
        </DialogHeader>

        {isFetching ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Loading item data...</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-1.5">
            <div className="space-y-2">
              <Label htmlFor="item_name" className="text-sm font-medium flex items-center">
                Item Name <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id="item_name"
                {...register("item_name", {
                  onChange: (e) => validateField("item_name", e.target.value),
                })}
                placeholder="Enter item name"
                className={`h-10 ${errors.item_name ? "border-red-300 focus:ring-red-200" : ""}`}
              />
              {errors.item_name && (
                <p className="text-xs text-red-600 mt-1 flex items-center">
                  <span className="mr-1">⚠</span> {errors.item_name}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="item_type" className="text-sm font-medium flex items-center">
              
                Item Type
              </Label>
              <Input
                id="item_type"
                {...register("item_type", {
                  onChange: (e) => validateField("item_type", e.target.value),
                })}
                placeholder="e.g., Sheet etc."
                className={`h-10 ${errors.item_type ? "border-red-300 focus:ring-red-200" : ""}`}
              />
              {errors.item_type && (
                <p className="text-xs text-red-600 mt-1 flex items-center">
                  <span className="mr-1">⚠</span> {errors.item_type}
                </p>
              )}
          
            </div>

            <div className="space-y-2">
              <Label htmlFor="item_description" className="text-sm font-medium flex items-center">
                Description
              </Label>
              <Textarea
                id="item_description"
                {...register("item_description")}
                placeholder="Enter item description (optional)"
                className="min-h-[80px] resize-none"
                rows={3}
              />
              {errors.item_description && (
                <p className="text-xs text-red-600 mt-1 flex items-center">
                  <span className="mr-1">⚠</span> {errors.item_description}
                </p>
              )}
              <div className="flex justify-between">
                <p className="text-xs text-gray-500">Optional field</p>
                <p className="text-xs text-gray-500">
                  {watch("item_description")?.length || 0}/500 characters
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="item_size" className="text-sm font-medium flex items-center">
             
                  Size
                </Label>
                <Input
                  id="item_size"
                  {...register("item_size", {
                    onChange: (e) => validateField("item_size", e.target.value),
                  })}
                  placeholder="e.g., 250ml, 500g"
                  className={`h-10 ${errors.item_size ? "border-red-300 focus:ring-red-200" : ""}`}
                />
                {errors.item_size && (
                  <p className="text-xs text-red-600 mt-1 flex items-center">
                    <span className="mr-1">⚠</span> {errors.item_size}
                  </p>
                )}
         
              </div>

              <div className="space-y-2">
                <Label htmlFor="item_unit" className="text-sm font-medium flex items-center">
     
                  Unit
                </Label>
                <Input
                  id="item_unit"
                  {...register("item_unit", {
                    onChange: (e) => validateField("item_unit", e.target.value),
                  })}
                  placeholder="e.g., ml, g, kg, pcs"
                  className={`h-10 ${errors.item_unit ? "border-red-300 focus:ring-red-200" : ""}`}
                />
                {errors.item_unit && (
                  <p className="text-xs text-red-600 mt-1 flex items-center">
                    <span className="mr-1">⚠</span> {errors.item_unit}
                  </p>
                )}
         
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="item_price" className="text-sm font-medium flex items-center">
                Price <span className="text-red-500 ml-1">*</span>
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="item_price"
                  type="text"
                  {...register("item_price", {
                    onChange: (e) => {
                      const formatted = formatPrice(e.target.value);
                      e.target.value = formatted;
                      validateField("item_price", formatted);
                    },
                  })}
                  placeholder="0.00"
                  className={`h-10 pl-10 ${errors.item_price ? "border-red-300 focus:ring-red-200" : ""}`}
                />
              </div>
              {errors.item_price && (
                <p className="text-xs text-red-600 mt-1 flex items-center">
                  <span className="mr-1">⚠</span> {errors.item_price}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="item_tax" className="text-sm font-medium flex items-center">
                Tax (%) <span className="text-red-500 ml-1">*</span>
              </Label>
              <div className="relative">
                <Percent className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="item_tax"
                  type="text"
                  {...register("item_tax", {
                    onChange: (e) => {
                      const formatted = formatTax(e.target.value);
                      e.target.value = formatted;
                      validateField("item_tax", formatted);
                    },
                  })}
                  placeholder="0.00"
                  className={`h-10 pl-10 ${errors.item_tax ? "border-red-300 focus:ring-red-200" : ""}`}
                />
              </div>
              {errors.item_tax && (
                <p className="text-xs text-red-600 mt-1 flex items-center">
                  <span className="mr-1">⚠</span> {errors.item_tax}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="item_status" className="text-sm font-medium flex items-center">
                Status <span className="text-red-500 ml-1">*</span>
              </Label>
              <Select
                value={watch("item_status")}
                onValueChange={(value) => setValue("item_status", value)}
              >
                <SelectTrigger className={`h-10 ${errors.item_status ? "border-red-300 focus:ring-red-200" : ""}`}>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">
                    <div className="flex flex-row items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Active</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="Inactive">
                    <div className="flex flex-row items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-600" />
                      <span>Inactive</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              {errors.item_status && (
                <p className="text-xs text-red-600 mt-1 flex items-center">
                  <span className="mr-1">⚠</span> {errors.item_status}
                </p>
              )}
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
                    Updating...
                  </span>
                ) : (
                  "Update Item"
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EditItem;