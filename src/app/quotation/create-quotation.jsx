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

import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { ArrowLeft, MinusCircle, PlusCircle } from "lucide-react";
import moment from "moment";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import BASE_URL from "@/config/BaseUrl";
import useNumericInput from "@/hooks/useNumericInput";

const CreateQuotation = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const today = moment().format("YYYY-MM-DD");
  const queryClient = useQueryClient();
  const [errors, setErrors] = useState({});
  const keyDown = useNumericInput();
  const [formData, setFormData] = useState({
    quotation_date: today,
    quotation_buyer_id: "",
    quotation_valid_date: "",
    quotation_remarks: "",
  });

  const [itemsData, setItemsData] = useState([
    {
      quotation_sub_item_id: "",
      quotation_sub_qnty: "",
      quotation_sub_rate: "",
      quotation_sub_discount: "",
      quotation_sub_tax: "",
      quotation_sub_amount: "",
    },
  ]);

  const { data: quotationRefData } = useQuery({
    queryKey: ["quotation-ref"],
    queryFn: async () => {
      const token = Cookies.get("token");
      const response = await axios.get(`${BASE_URL}/api/quotation-ref`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.data;
    },
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
    if (quotationRefData) {
      setFormData((prev) => ({ ...prev, quotation_ref: quotationRefData }));
    }
  }, [quotationRefData]);

  const addRow = useCallback(() => {
    setItemsData((prev) => [
      ...prev,
      {
        quotation_sub_item_id: "",
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
      if (itemsData.length > 1) {
        setItemsData((prev) => prev.filter((_, i) => i !== index));
      }
    },
    [itemsData.length]
  );

  const handleFormChange = (e, field) => {
    const value = e.target ? e.target.value : e;
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleItemChange = (rowIndex, field, value) => {
    const updatedData = [...itemsData];
    updatedData[rowIndex][field] = value;

    if (
      field === "quotation_sub_qnty" ||
      field === "quotation_sub_rate" ||
      field === "quotation_sub_discount" ||
      field === "quotation_sub_tax"
    ) {
      const qnty = parseFloat(updatedData[rowIndex].quotation_sub_qnty) || 0;
      const rate = parseFloat(updatedData[rowIndex].quotation_sub_rate) || 0;
      const discount =
        parseFloat(updatedData[rowIndex].quotation_sub_discount) || 0;
      const tax = parseFloat(updatedData[rowIndex].quotation_sub_tax) || 0;

      const amountBeforeTax = qnty * rate;
      const discountAmount = (amountBeforeTax * discount) / 100;
      const amountAfterDiscount = amountBeforeTax - discountAmount;
      const taxAmount = (amountAfterDiscount * tax) / 100;
      const finalAmount = amountAfterDiscount + taxAmount;

      updatedData[rowIndex].quotation_sub_amount = finalAmount.toFixed(2);
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

  const createQuotationMutation = useMutation({
    mutationFn: async (data) => {
      const token = Cookies.get("token");
      const response = await axios.post(`${BASE_URL}/api/quotation`, data, {
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
          description: "Quotation created successfully",
        });
         queryClient.invalidateQueries(["quotations"]);
        navigate("/quotation");
        
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to create quotation",
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
      subs: itemsData.map((item) => ({
        quotation_sub_item_id: parseInt(item.quotation_sub_item_id),
        quotation_sub_qnty: parseFloat(item.quotation_sub_qnty),
        quotation_sub_rate: parseFloat(item.quotation_sub_rate),
        quotation_sub_discount: parseFloat(item.quotation_sub_discount) || 0,
        quotation_sub_tax: parseFloat(item.quotation_sub_tax) || 0,
        quotation_sub_amount: parseFloat(item.quotation_sub_amount),
      })),
    };

    createQuotationMutation.mutate(payload);
  };

  return (
    <div className="min-h-screen ">
      <div className="max-w-340 mx-auto ">
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
              <h1 className="text-xl font-bold text-gray-800">
                Create Quotation
              </h1>
            </div>
            <div className="flex gap-2">
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
                className="h-9 bg-blue-600 hover:bg-blue-700"
                disabled={createQuotationMutation.isPending}
              >
                {createQuotationMutation.isPending
                  ? "Creating..."
                  : "Create Quotation"}
              </Button>
            </div>
          </div>

          <div className="border border-gray-200 shadow-sm">
            <div className="p-2">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Quotation Ref
                  </Label>
                  <Input
                    className="h-9 bg-gray-50"
                    value={formData.quotation_ref || ""}
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

                <div className="md:col-span-4 space-y-2">
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
                  className="bg-white border border-gray-200 rounded-lg p-2 space-y-1"
                >
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium text-gray-700">
                      Item {rowIndex + 1}
                    </h3>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeRow(rowIndex)}
                      disabled={itemsData.length === 1}
                      className="h-6 w-6 p-0 text-red-500"
                    >
                      <MinusCircle className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {/* <Label className="text-xs font-medium text-gray-600">Item</Label> */}
                    <Select
                      value={row.quotation_sub_item_id}
                      onValueChange={(value) =>
                        handleItemChange(
                          rowIndex,
                          "quotation_sub_item_id",
                          value
                        )
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

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      {/* <Label className="text-xs font-medium text-gray-600">Quantity</Label> */}
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
                      {/* <Label className="text-xs font-medium text-gray-600">Rate</Label> */}
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
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      {/* <Label className="text-xs font-medium text-gray-600">Discount %</Label> */}
                      <Input
                        className="h-8 text-sm"
                        value={row.quotation_sub_discount}
                        onChange={(e) =>
                          handleItemChange(
                            rowIndex,
                            "quotation_sub_discount",
                            e.target.value
                          )
                        }
                        placeholder="Discount %"
                        type="text"
                        onKeyDown={keyDown}
                        min="0"
                        max="100"
                        step="0.01"
                      />
                    </div>

                    <div className="space-y-2">
                      {/* <Label className="text-xs font-medium text-gray-600">Tax %</Label> */}
                      <Input
                        className="h-8 text-sm"
                        value={row.quotation_sub_tax}
                        onChange={(e) =>
                          handleItemChange(
                            rowIndex,
                            "quotation_sub_tax",
                            e.target.value
                          )
                        }
                        placeholder="Tax %"
                        type="text"
                        onKeyDown={keyDown}
                        min="0"
                        max="100"
                        step="0.01"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    {/* <Label className="text-xs font-medium text-gray-600">Amount</Label> */}
                    <Input
                      className="h-8 text-sm bg-gray-50"
                      value={row.quotation_sub_amount}
                      readOnly
                      placeholder="0.00"
                    />
                  </div>
                </div>
              ))}
            </div>

            <Button type="button" size="sm" className="h-8" onClick={addRow}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add
            </Button>
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
                                handleItemChange(
                                  rowIndex,
                                  "quotation_sub_item_id",
                                  value
                                )
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
                              className="h-8 text-sm"
                              value={row.quotation_sub_discount}
                              onChange={(e) =>
                                handleItemChange(
                                  rowIndex,
                                  "quotation_sub_discount",
                                  e.target.value
                                )
                              }
                              placeholder="0"
                              type="text"
                              onKeyDown={keyDown}
                              min="0"
                              max="100"
                              step="0.01"
                            />
                          </TableCell>

                          <TableCell className="py-2">
                            <Input
                              className="h-8 text-sm"
                              value={row.quotation_sub_tax}
                              onChange={(e) =>
                                handleItemChange(
                                  rowIndex,
                                  "quotation_sub_tax",
                                  e.target.value
                                )
                              }
                              placeholder="0"
                              type="text"
                              onKeyDown={keyDown}
                              min="0"
                              max="100"
                              step="0.01"
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
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeRow(rowIndex)}
                              disabled={itemsData.length === 1}
                              className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                            >
                              <MinusCircle className="h-4 w-4" />
                            </Button>
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

export default CreateQuotation;
