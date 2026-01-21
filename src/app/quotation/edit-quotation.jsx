import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { ArrowLeft, MinusCircle, PlusCircle, Trash2, TrashIcon } from "lucide-react";
import moment from "moment";
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Cookies from "js-cookie";
import BASE_URL from "@/config/BaseUrl";
import useNumericInput from "@/hooks/useNumericInput";

const EditQuotation = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const navigate = useNavigate();
  const today = moment().format("YYYY-MM-DD");
  const queryClient = useQueryClient();
  const [errors, setErrors] = useState({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const keyDown = useNumericInput();
  
  const [formData, setFormData] = useState({
    quotation_date: today,
    quotation_buyer_id: "",
    quotation_valid_date: "",
    quotation_remarks: "",
    quotation_status: "Pending",
  });

  const [itemsData, setItemsData] = useState([
    {
      id: null,
      quotation_sub_item_id: "",
      quotation_sub_size: "",
      quotation_sub_unit: "",
      quotation_sub_qnty: "",
      quotation_sub_rate: "",
      quotation_sub_discount: "",
      quotation_sub_tax: "",
      quotation_sub_amount: "",
    },
  ]);

  const { data: quotationData, isLoading } = useQuery({
    queryKey: ["quotation", id],
    queryFn: async () => {
      const token = Cookies.get("token");
      const response = await axios.get(`${BASE_URL}/api/quotation/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.data;
    },
    enabled: !!id,
  });

  const { data: buyersData } = useQuery({
    queryKey: ["active-buyers"],
    queryFn: async () => {
      const token = Cookies.get("token");
      const response = await axios.get(`${BASE_URL}/api/activeBuyers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.data;
    },
  });

  const { data: itemsListData } = useQuery({
    queryKey: ["items"],
    queryFn: async () => {
      const token = Cookies.get("token");
      const response = await axios.get(`${BASE_URL}/api/item`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.data.data || [];
    },
  });

  useEffect(() => {
    if (quotationData) {
      setFormData({
        quotation_date: quotationData.quotation_date || today,
        quotation_buyer_id: quotationData.quotation_buyer_id?.toString() || "",
        quotation_valid_date: quotationData.quotation_valid_date || "",
        quotation_remarks: quotationData.quotation_remarks || "",
        quotation_status: quotationData.quotation_status || "Pending",
      });

      if (quotationData.subs && quotationData.subs.length > 0) {
        setItemsData(
          quotationData.subs.map((sub) => ({
            id: sub.id,
            quotation_sub_item_id: sub.quotation_sub_item_id?.toString() || "",
            quotation_sub_size: sub.quotation_sub_size || "",
            quotation_sub_unit: sub.quotation_sub_unit || "",
            quotation_sub_qnty: sub.quotation_sub_qnty || "",
            quotation_sub_rate: sub.quotation_sub_rate || "",
            quotation_sub_discount: sub.quotation_sub_discount || "",
            quotation_sub_tax: sub.quotation_sub_tax || "",
            quotation_sub_amount: sub.quotation_sub_amount || "",
          }))
        );
      }
    }
  }, [quotationData]);

  const addRow = useCallback(() => {
    setItemsData((prev) => [
      ...prev,
      {
        id: null, 
        quotation_sub_item_id: "",
        quotation_sub_size: "",
        quotation_sub_unit: "",
        quotation_sub_qnty: "",
        quotation_sub_rate: "",
        quotation_sub_discount: "",
        quotation_sub_tax: "",
        quotation_sub_amount: "",
      },
    ]);
  }, []);

  const removeRow = useCallback(
    (index) => {
      const item = itemsData[index];
      
      if (item.id) {
        setItemToDelete({ index, id: item.id });
        setDeleteDialogOpen(true);
      } else {
        if (itemsData.length > 1) {
          setItemsData((prev) => prev.filter((_, i) => i !== index));
        }
      }
    },
    [itemsData]
  );

  const deleteItemMutation = useMutation({
    mutationFn: async (itemId) => {
      const token = Cookies.get("token");
      await axios.delete(`${BASE_URL}/api/quotation-sub/${itemId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    onSuccess: () => {
      if (itemToDelete) {
        if (itemsData.length > 1) {
          setItemsData((prev) => prev.filter((_, i) => i !== itemToDelete.index));
        }
        toast({
          title: "Success",
          description: "Item deleted successfully",
        });
      }
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    },
    onError: (error) => {
      console.error("Delete Error:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete item",
        variant: "destructive",
      });
    },
  });

  const handleDeleteItem = () => {
    if (itemToDelete) {
      deleteItemMutation.mutate(itemToDelete.id);
    }
  };

  const handleFormChange = (e, field) => {
    const value = e.target ? e.target.value : e;
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleItemSelect = (rowIndex, itemId) => {
    if (!itemsListData || !itemId) return;

    const selectedItem = itemsListData.find(
      (item) => item.id.toString() === itemId.toString()
    );

    if (selectedItem) {
      const updatedData = [...itemsData];
      updatedData[rowIndex] = {
        ...updatedData[rowIndex],
        quotation_sub_item_id: itemId,
        quotation_sub_rate: selectedItem.item_price || "",
        quotation_sub_size: selectedItem.item_size || "",
        quotation_sub_unit: selectedItem.item_unit || "",
      };

      // Recalculate amount if quantity is already set
      if (updatedData[rowIndex].quotation_sub_qnty) {
        const qnty = parseFloat(updatedData[rowIndex].quotation_sub_qnty) || 0;
        const rate = parseFloat(selectedItem.item_price) || 0;
        const size = parseFloat(updatedData[rowIndex].quotation_sub_size) || 1;
        
        // Calculate amount: size × quantity × rate
        const amount = size * qnty * rate;
        updatedData[rowIndex].quotation_sub_amount = amount.toFixed(2);
      }

      setItemsData(updatedData);
    }
  };

  const handleItemChange = (rowIndex, field, value) => {
    const updatedData = [...itemsData];
    updatedData[rowIndex][field] = value;

    // Recalculate amount when quantity, rate, or size changes
    if (
      field === "quotation_sub_qnty" ||
      field === "quotation_sub_rate" ||
      field === "quotation_sub_size"
    ) {
      const qnty = parseFloat(updatedData[rowIndex].quotation_sub_qnty) || 0;
      const rate = parseFloat(updatedData[rowIndex].quotation_sub_rate) || 0;
      const size = parseFloat(updatedData[rowIndex].quotation_sub_size) || 1;
      
      // Calculate amount: size × quantity × rate
      const amount = size * qnty * rate;
      updatedData[rowIndex].quotation_sub_amount = amount.toFixed(2);
    }

    setItemsData(updatedData);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.quotation_buyer_id.trim()) {
      newErrors.quotation_buyer_id = "Buyer is required";
    }

    if (!formData.quotation_valid_date.trim()) {
      newErrors.quotation_valid_date = "Valid date is required";
    }

    if (itemsData.length === 0) {
      newErrors.items = "At least one item is required";
    }

    itemsData.forEach((item, index) => {
      if (!item.quotation_sub_item_id.trim()) {
        newErrors[`item_${index}_id`] = "Item is required";
      }
      if (!item.quotation_sub_qnty.trim()) {
        newErrors[`item_${index}_qnty`] = "Quantity is required";
      }
      if (!item.quotation_sub_rate.trim()) {
        newErrors[`item_${index}_rate`] = "Rate is required";
      }
    });

    return newErrors;
  };

  const updateQuotationMutation = useMutation({
    mutationFn: async (data) => {
      const token = Cookies.get("token");
      const response = await axios.put(`${BASE_URL}/api/quotation/${id}`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      return response.data;
    },
    onSuccess: (response) => {
      if (response.code === 201) {
        toast({
          title: "Success",
          description: "Quotation updated successfully",
        });
        queryClient.invalidateQueries(["quotation", id]);
        queryClient.invalidateQueries(["quotations"]);
        navigate("/quotation");
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to update quotation",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      console.error("API Error:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast({
        title: "Validation Error",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }

    setErrors({});

    const payload = {
      ...formData,
      quotation_buyer_id: parseInt(formData.quotation_buyer_id),
      subs: itemsData.map((item) => ({
        id: item.id || undefined,
        quotation_sub_item_id: parseInt(item.quotation_sub_item_id),
        quotation_sub_size: item.quotation_sub_size || "",
        quotation_sub_unit: item.quotation_sub_unit || "",
        quotation_sub_qnty: parseFloat(item.quotation_sub_qnty),
        quotation_sub_rate: parseFloat(item.quotation_sub_rate),
        quotation_sub_discount: parseFloat(item.quotation_sub_discount) || 0,
        quotation_sub_tax: parseFloat(item.quotation_sub_tax) || 0,
        quotation_sub_amount: parseFloat(item.quotation_sub_amount),
      })),
    };

    updateQuotationMutation.mutate(payload);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading quotation data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen ">
      <div className="max-w-340 mx-auto ">
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the item from the quotation.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setItemToDelete(null)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteItem}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleteItemMutation.isPending ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <form onSubmit={handleSubmit} className="space-y-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => navigate("/quotation")}
                className="h-8 w-8 p-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-md font-bold text-gray-800">
                Edit Quotation #{quotationData?.quotation_ref}
              </h1>
            </div>
            <div className="hidden sm:block">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/quotation")}
                className="h-9"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="h-9 ml-2 bg-blue-600 hover:bg-blue-700"
                disabled={updateQuotationMutation.isPending}
              >
                {updateQuotationMutation.isPending
                  ? "Updating..."
                  : "Update Quotation"}
              </Button>
            </div>
          </div>

          <div className=" block sm:hidden  border border-blue-500 shadow-sm  rounded-lg ">
            <div className="p-2">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                <div className="">
                  <Label className="text-sm font-medium text-gray-700">
                    Quotation Ref :  {quotationData?.quotation_ref || ""}
                  </Label>
                  {/* <Input
                    className="h-9 bg-gray-50"
                    value={quotationData?.quotation_ref || ""}
                    disabled
                    placeholder="Auto-generated"
                  /> */}
                </div>
                <div className="grid grid-cols-2 gap-2">
                <div className="">
                  <Label className="text-sm font-medium text-gray-700">
                    Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    className="h-9"
                    value={formData.quotation_date}
                    onChange={(e) => handleFormChange(e, "quotation_date")}
                    type="date"
                  />
                </div>
                <div className="">
                  <Label className="text-sm font-medium text-gray-700">
                    Valid Until <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    className={`h-9 ${
                      errors.quotation_valid_date ? "border-red-300" : ""
                    }`}
                    value={formData.quotation_valid_date}
                    onChange={(e) =>
                      handleFormChange(e, "quotation_valid_date")
                    }
                    type="date"
                  />
                  {errors.quotation_valid_date && (
                    <p className="text-xs text-red-600 mt-1">
                      {errors.quotation_valid_date}
                    </p>
                  )}
                </div>
                </div>
                <div className="">
                  <Label className="text-sm font-medium text-gray-700">
                    Buyer <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.quotation_buyer_id}
                    onValueChange={(value) =>
                      handleFormChange(value, "quotation_buyer_id")
                    }
                  >
                    <SelectTrigger
                      className={`h-9 ${
                        errors.quotation_buyer_id ? "border-red-300" : ""
                      }`}
                    >
                      <SelectValue placeholder="Select Buyer" />
                    </SelectTrigger>
                    <SelectContent>
                      {buyersData?.map((buyer) => (
                        <SelectItem key={buyer.id} value={buyer.id.toString()}>
                          {buyer.buyer_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.quotation_buyer_id && (
                    <p className="text-xs text-red-600 mt-1">
                      {errors.quotation_buyer_id}
                    </p>
                  )}
                </div>

                <div className="">
                  <Label className="text-sm font-medium text-gray-700">
                    Status
                  </Label>
                  <Select
                    value={formData.quotation_status}
                    onValueChange={(value) =>
                      handleFormChange(value, "quotation_status")
                    }
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Accepted">Accepted</SelectItem>
                      <SelectItem value="Rejected">Rejected</SelectItem>
                      <SelectItem value="Expired">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                

                <div className="md:col-span-4 ">
                  <Label className="text-sm font-medium text-gray-700">
                    Remarks
                  </Label>
                  <Textarea
                    className="min-h-[80px]"
                    value={formData.quotation_remarks}
                    onChange={(e) => handleFormChange(e, "quotation_remarks")}
                    placeholder="Enter remarks"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className=" hidden sm:block border border-gray-200 shadow-sm">
            <div className="p-2">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Quotation Ref
                  </Label>
                  <Input
                    className="h-9 bg-gray-50"
                    value={quotationData?.quotation_ref || ""}
                    disabled
                    placeholder="Auto-generated"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    className="h-9"
                    value={formData.quotation_date}
                    onChange={(e) => handleFormChange(e, "quotation_date")}
                    type="date"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Buyer <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.quotation_buyer_id}
                    onValueChange={(value) =>
                      handleFormChange(value, "quotation_buyer_id")
                    }
                  >
                    <SelectTrigger
                      className={`h-9 ${
                        errors.quotation_buyer_id ? "border-red-300" : ""
                      }`}
                    >
                      <SelectValue placeholder="Select Buyer" />
                    </SelectTrigger>
                    <SelectContent>
                      {buyersData?.map((buyer) => (
                        <SelectItem key={buyer.id} value={buyer.id.toString()}>
                          {buyer.buyer_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.quotation_buyer_id && (
                    <p className="text-xs text-red-600 mt-1">
                      {errors.quotation_buyer_id}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Status
                  </Label>
                  <Select
                    value={formData.quotation_status}
                    onValueChange={(value) =>
                      handleFormChange(value, "quotation_status")
                    }
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Accepted">Accepted</SelectItem>
                      <SelectItem value="Rejected">Rejected</SelectItem>
                      <SelectItem value="Expired">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Valid Until <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    className={`h-9 ${
                      errors.quotation_valid_date ? "border-red-300" : ""
                    }`}
                    value={formData.quotation_valid_date}
                    onChange={(e) =>
                      handleFormChange(e, "quotation_valid_date")
                    }
                    type="date"
                  />
                  {errors.quotation_valid_date && (
                    <p className="text-xs text-red-600 mt-1">
                      {errors.quotation_valid_date}
                    </p>
                  )}
                </div>

                <div className="md:col-span-5 space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Remarks
                  </Label>
                  <Textarea
                    className="min-h-[80px]"
                    value={formData.quotation_remarks}
                    onChange={(e) => handleFormChange(e, "quotation_remarks")}
                    placeholder="Enter remarks"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="block sm:hidden">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold text-gray-800">Items</h2>
            </div>

            <div className="space-y-2">
              {itemsData.map((row, rowIndex) => (
                <div
                  key={rowIndex}
                  className="bg-white border border-blue-500 rounded-lg p-2 space-y-1 shadow-2xl shadow-blue-300"
                >
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium text-gray-700">
                    <div className="flex flex-row items-center gap-5">
                        <span> {rowIndex + 1}.  </span>
{row.quotation_sub_size &&(


<p className="text-xs text-red-600">
               Size:    {row.quotation_sub_size}
                      </p>
)}
{row.quotation_sub_unit &&(


                      <p className="text-xs text-red-600">
                  Unit:    {row.quotation_sub_unit}
                      </p>
                      )}
</div>
                    </h3>
                    <div className="flex gap-1">
                      {row.id && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeRow(rowIndex)}
                          className="h-6 w-6 p-0 text-red-500"
                          title="Delete item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                      {!row.id && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeRow(rowIndex)}
                          disabled={itemsData.length === 1}
                          className="h-6 w-6 p-0 text-red-500"
                          title="Remove item"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Select
                      value={row.quotation_sub_item_id}
                      onValueChange={(value) =>
                        handleItemSelect(rowIndex, value)
                      }
                    >
                      <SelectTrigger
                        className={`h-8 text-sm ${
                          errors[`item_${rowIndex}_id`] ? "border-red-300" : ""
                        }`}
                      >
                        <SelectValue placeholder="Select Item" />
                      </SelectTrigger>
                      <SelectContent>
                        {itemsListData?.map((item) => (
                          <SelectItem key={item.id} value={item.id.toString()}>
                            {item.item_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors[`item_${rowIndex}_id`] && (
                      <p className="text-xs text-red-600">
                        {errors[`item_${rowIndex}_id`]}
                      </p>
                    )}
                  </div>

                  {/* <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Input
                        className="h-8 text-sm bg-gray-50"
                        value={row.quotation_sub_size}
                        readOnly
                        placeholder="Size"
                        type="text"
                      />
                    </div>

                    <div className="space-y-2">
                      <Input
                        className="h-8 text-sm bg-gray-50"
                        value={row.quotation_sub_unit}
                        readOnly
                        placeholder="Unit"
                        type="text"
                      />
                    </div>
                  </div> */}

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Input
                        className={`h-8 text-sm ${
                          errors[`item_${rowIndex}_qnty`]
                            ? "border-red-300"
                            : ""
                        }`}
                        value={row.quotation_sub_qnty}
                        onChange={(e) =>
                          handleItemChange(
                            rowIndex,
                            "quotation_sub_qnty",
                            e.target.value
                          )
                        }
                        placeholder="Qty"
                        type="text"
                        onKeyDown={keyDown}
                        min="0"
                        step="0.01"
                      />
                      {errors[`item_${rowIndex}_qnty`] && (
                        <p className="text-xs text-red-600">
                          {errors[`item_${rowIndex}_qnty`]}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Input
                        className={`h-8 text-sm ${
                          errors[`item_${rowIndex}_rate`]
                            ? "border-red-300"
                            : ""
                        }`}
                        value={row.quotation_sub_rate}
                        onChange={(e) =>
                          handleItemChange(
                            rowIndex,
                            "quotation_sub_rate",
                            e.target.value
                          )
                        }
                        placeholder="Rate"
                        type="text"
                        onKeyDown={keyDown}
                        min="0"
                        step="0.01"
                      />
                      {errors[`item_${rowIndex}_rate`] && (
                        <p className="text-xs text-red-600">
                          {errors[`item_${rowIndex}_rate`]}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                    <Input
                      className="h-8 text-sm bg-gray-50"
                      value={row.quotation_sub_amount}
                      readOnly
                      placeholder="0.00"
                    />
                  </div>
                  </div>

                  {/* <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Input
                        className="h-8 text-sm bg-gray-50"
                        value={row.quotation_sub_discount}
                        disabled
                        placeholder="0"
                        type="text"
                      />
                    </div>

                    <div className="space-y-2">
                      <Input
                        className="h-8 text-sm bg-gray-50"
                        value={row.quotation_sub_tax}
                        disabled
                        placeholder="0"
                        type="text"
                      />
                    </div>
                  </div> */}

                  {/* <div className="space-y-2">
                    <Input
                      className="h-8 text-sm bg-gray-50"
                      value={row.quotation_sub_amount}
                      readOnly
                      placeholder="0.00"
                    />
                  </div> */}
                </div>
              ))}
            </div>

            <Button type="button" size="sm" className="h-8 mt-2" onClick={addRow}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add
            </Button>

            <div className="flex flex-row items-center justify-between mt-5 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/quotation")}
                className="h-9"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="h-9 ml-2 bg-blue-600 hover:bg-blue-700"
                disabled={updateQuotationMutation.isPending}
              >
                {updateQuotationMutation.isPending
                  ? "Updating..."
                  : "Update Quotation"}
              </Button>
            </div>
          </div>

          <div className="hidden sm:block">
            <div className="border border-gray-200 shadow-sm">
              <div className="p-2">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-semibold text-gray-800">Items</h2>
                </div>

                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50 hover:bg-gray-50">
                        <TableHead className="h-10 text-xs font-medium text-gray-600">
                          Item
                        </TableHead>
                        <TableHead className="h-10 text-xs font-medium text-gray-600">
                          Size
                        </TableHead>
                        <TableHead className="h-10 text-xs font-medium text-gray-600">
                          Unit
                        </TableHead>
                        <TableHead className="h-10 text-xs font-medium text-gray-600">
                          Qty
                        </TableHead>
                        <TableHead className="h-10 text-xs font-medium text-gray-600">
                          Rate
                        </TableHead>
                        <TableHead className="h-10 text-xs font-medium text-gray-600">
                          Discount %
                        </TableHead>
                        <TableHead className="h-10 text-xs font-medium text-gray-600">
                          Tax %
                        </TableHead>
                        <TableHead className="h-10 text-xs font-medium text-gray-600">
                          Amount
                        </TableHead>
                        <TableHead className="h-10 text-xs font-medium text-gray-600 w-20">
                          Action
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {itemsData.map((row, rowIndex) => (
                        <TableRow
                          key={rowIndex}
                          className="border-t border-gray-100 hover:bg-gray-50"
                        >
                          <TableCell className="py-2">
                            <Select
                              value={row.quotation_sub_item_id}
                              onValueChange={(value) =>
                                handleItemSelect(rowIndex, value)
                              }
                            >
                              <SelectTrigger
                                className={`h-8 text-sm ${
                                  errors[`item_${rowIndex}_id`]
                                    ? "border-red-300"
                                    : ""
                                }`}
                              >
                                <SelectValue placeholder="Select Item" />
                              </SelectTrigger>
                              <SelectContent>
                                {itemsListData?.map((item) => (
                                  <SelectItem
                                    key={item.id}
                                    value={item.id.toString()}
                                  >
                                    {item.item_name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {errors[`item_${rowIndex}_id`] && (
                              <p className="text-xs text-red-600 mt-1">
                                {errors[`item_${rowIndex}_id`]}
                              </p>
                            )}
                          </TableCell>

                          <TableCell className="py-2">
                            <Input
                              className="h-8 text-sm bg-gray-50"
                              value={row.quotation_sub_size}
                              readOnly
                              placeholder="Size"
                              type="text"
                            />
                          </TableCell>

                          <TableCell className="py-2">
                            <Input
                              className="h-8 text-sm bg-gray-50"
                              value={row.quotation_sub_unit}
                              readOnly
                              placeholder="Unit"
                              type="text"
                            />
                          </TableCell>

                          <TableCell className="py-2">
                            <Input
                              className={`h-8 text-sm ${
                                errors[`item_${rowIndex}_qnty`]
                                  ? "border-red-300"
                                  : ""
                              }`}
                              value={row.quotation_sub_qnty}
                              onChange={(e) =>
                                handleItemChange(
                                  rowIndex,
                                  "quotation_sub_qnty",
                                  e.target.value
                                )
                              }
                              placeholder="Qty"
                              type="text"
                              onKeyDown={keyDown}
                              min="0"
                              step="0.01"
                            />
                            {errors[`item_${rowIndex}_qnty`] && (
                              <p className="text-xs text-red-600 mt-1">
                                {errors[`item_${rowIndex}_qnty`]}
                              </p>
                            )}
                          </TableCell>

                          <TableCell className="py-2">
                            <Input
                              className={`h-8 text-sm ${
                                errors[`item_${rowIndex}_rate`]
                                  ? "border-red-300"
                                  : ""
                              }`}
                              value={row.quotation_sub_rate}
                              onChange={(e) =>
                                handleItemChange(
                                  rowIndex,
                                  "quotation_sub_rate",
                                  e.target.value
                                )
                              }
                              placeholder="Rate"
                              type="text"
                              onKeyDown={keyDown}
                              min="0"
                              step="0.01"
                            />
                            {errors[`item_${rowIndex}_rate`] && (
                              <p className="text-xs text-red-600 mt-1">
                                {errors[`item_${rowIndex}_rate`]}
                              </p>
                            )}
                          </TableCell>

                          <TableCell className="py-2">
                            <Input
                              className="h-8 text-sm bg-gray-50"
                              value={row.quotation_sub_discount}
                              disabled
                              placeholder="0"
                              type="text"
                            />
                          </TableCell>

                          <TableCell className="py-2">
                            <Input
                              className="h-8 text-sm bg-gray-50"
                              value={row.quotation_sub_tax}
                              disabled
                              placeholder="0"
                              type="text"
                            />
                          </TableCell>

                          <TableCell className="py-2">
                            <Input
                              className="h-8 text-sm bg-gray-50"
                              value={row.quotation_sub_amount}
                              readOnly
                              placeholder="0.00"
                            />
                          </TableCell>

                          <TableCell className="py-2">
                            <div className="flex gap-1">
                              {row.id && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeRow(rowIndex)}
                                  className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                                  title="Delete item"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                              {!row.id && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeRow(rowIndex)}
                                  disabled={itemsData.length === 1}
                                  className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                                  title="Remove item"
                                >
                                  <MinusCircle className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <Button
                  type="button"
                  size="sm"
                  className="h-8 mt-2"
                  onClick={addRow}
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditQuotation;