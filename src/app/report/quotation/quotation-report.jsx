import React, { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import moment from "moment";
import {
  Printer,
  Search,
  Loader2,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import ReactToPrint, { useReactToPrint } from "react-to-print";
import Page from "@/app/dashboard/page";
import { useToast } from "@/hooks/use-toast";
import { getTodayDate } from "@/utils/currentDate";
import BASE_URL from "@/config/BaseUrl";
import html2pdf from "html2pdf.js";
import Select from "react-select";
import { ButtonConfig } from "@/config/ButtonConfig";
import { getFirstDayOfMonth } from "@/utils/getFirstDayOfMonth";
import { FaRegFilePdf, FaRegFileExcel } from "react-icons/fa";
import Cookies from "js-cookie";

// Form validation schema
const formSchema = z.object({
  from_date: z.string().min(1, "From date is required"),
  to_date: z.string().min(1, "To date is required"),
  buyer_id: z.string().optional(),
  quotation_status: z.string().optional(),
});

// Select styles
const selectStyles = {
  control: (provided) => ({
    ...provided,
    minHeight: "36px",
    height: "36px",
    borderRadius: "0.375rem",
    borderColor: "hsl(var(--input))",
    backgroundColor: "hsl(var(--background))",
    boxShadow: "none",
    "&:hover": {
      borderColor: "hsl(var(--input))",
    },
    "&:focus-within": {
      borderColor: "hsl(var(--ring))",
      boxShadow: "0 0 0 2px hsl(var(--ring))",
    },
  }),
  input: (provided) => ({
    ...provided,
    margin: "0",
    padding: "0",
    color: "hsl(var(--foreground))",
  }),
  valueContainer: (provided) => ({
    ...provided,
    height: "36px",
    padding: "0 6px",
  }),
  singleValue: (provided) => ({
    ...provided,
    color: "hsl(var(--foreground))",
  }),
  placeholder: (provided) => ({
    ...provided,
    color: "hsl(var(--muted-foreground))",
  }),
  dropdownIndicator: (provided) => ({
    ...provided,
    color: "hsl(var(--muted-foreground))",
    padding: "4px",
  }),
  indicatorSeparator: () => ({
    display: "none",
  }),
  menu: (provided) => ({
    ...provided,
    borderRadius: "0.375rem",
    border: "1px solid hsl(var(--border))",
    boxShadow:
      "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    zIndex: 50,
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected
      ? "hsl(var(--primary))"
      : state.isFocused
      ? "hsl(var(--accent))"
      : "hsl(var(--background))",
    color: state.isSelected
      ? "hsl(var(--primary-foreground))"
      : "hsl(var(--foreground))",
    "&:hover": {
      backgroundColor: "hsl(var(--accent))",
      color: "hsl(var(--accent-foreground))",
    },
  }),
};

// Quotation status options
const quotationStatusOptions = [
  { value: "Pending", label: "Pending" },
  { value: "Accepted", label: "Accepted" },
  { value: "Rejected", label: "Rejected" },
  { value: "Expired", label: "Expired" },
  { value: "Cancelled", label: "Cancelled" },
];

const QuotationReport = () => {
  const { toast } = useToast();
  const tableRef = useRef(null);
  const [searchParams, setSearchParams] = useState(null);

  // Form initialization
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      from_date: getFirstDayOfMonth(),
      to_date: getTodayDate(),
      buyer_id: "",
      quotation_status: "",
    },
  });

  // Fetch active buyers
  const { data: buyers = [], isLoading: buyersLoading } = useQuery({
    queryKey: ["activeBuyers"],
    queryFn: async () => {
      const token = Cookies.get("token");
      const response = await axios.get(
        `${BASE_URL}/api/activeBuyers`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data.data || [];
    },
  });

  // Fetch quotation report data
  const { data: quotationData, isLoading } = useQuery({
    queryKey: ["quotationReport", searchParams],
    queryFn: async () => {
      if (!searchParams) return { data: [] };

      const token = Cookies.get("token");
      const response = await axios.post(
        `${BASE_URL}/api/quotation-report`,
        searchParams,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    },
    enabled: !!searchParams,
  });

  // Handle CSV download
  const handleDownloadCsv = async () => {
    try {
      if (!searchParams) return;

      const response = await axios.post(
        `${BASE_URL}/api/download-quotation-report`,
        searchParams,
        {
          headers: {
            Authorization: `Bearer ${Cookies.get("token")}`,
          },
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `quotation-report-${moment().format('YYYY-MM-DD')}.csv`);
      document.body.appendChild(link);
      link.click();

      toast({
        title: "Download Successful",
        description: "Quotation report downloaded as CSV",
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download quotation report",
        variant: "destructive",
      });
    }
  };

  // Handle print PDF
  const handlePrintPdf = useReactToPrint({
    content: () => tableRef.current,
    documentTitle: `Quotation-Report-${moment().format('YYYY-MM-DD')}`,
    pageStyle: `
      @page {
        size: auto;
        margin: 5mm;
      }
      @media print {
        body { 
          margin: 0 !important;
          padding: 0 !important;
          width: 100% !important;
        }
        table {
          width: 100% !important;
          border-collapse: collapse !important;
          font-size: 10pt !important;
        }
        th, td {
          border: 1px solid #ddd !important;
          padding: 4px !important;
          text-align: left !important;
        }
        .bg-gray-100 {
          background-color: rgba(243, 244, 246, 1) !important;
        }
        .status-badge {
          padding: 2px 6px !important;
          border-radius: 12px !important;
          font-size: 9pt !important;
        }
      }
    `,
  });

  // Handle download PDF
  const handleDownloadPDF = () => {
    const input = tableRef.current;
    const options = {
      margin: [5, 5, 5, 5],
      filename: `quotation-report-${moment().format('YYYY-MM-DD')}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        windowHeight: input.scrollHeight,
        scrollY: 0,
      },
      jsPDF: {
        unit: "mm",
        format: "a4",
        orientation: "portrait",
      },
      pagebreak: { mode: "avoid-all" },
    };

    html2pdf()
      .from(input)
      .set(options)
      .toPdf()
      .get("pdf")
      .then((pdf) => {
        const totalPages = pdf.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
          pdf.setPage(i);
          pdf.setFontSize(10);
          pdf.setTextColor(150);
          pdf.text(
            `Page ${i} of ${totalPages}`,
            pdf.internal.pageSize.getWidth() - 20,
            pdf.internal.pageSize.getHeight() - 10
          );
        }
      })
      .save()
      .then(() => {
        toast({
          title: "PDF Generated",
          description: "Quotation report saved as PDF",
        });
      });
  };

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case "Accepted":
        return "bg-green-100 text-green-800";
      case "Rejected":
        return "bg-red-100 text-red-800";
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "Expired":
        return "bg-gray-100 text-gray-800";
      case "Cancelled":
        return "bg-red-50 text-red-600";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Form submit handler
  const onSubmit = (data) => {
    if (searchParams && JSON.stringify(searchParams) === JSON.stringify(data)) {
      toast({
        title: "Same search parameters",
        description: "You're already viewing results for these search criteria",
        variant: "default",
      });
      return;
    }
    setSearchParams(data);
  };

  return (
    <>
      <div className="w-full p-0 md:p-0">
     
        <div className="sm:hidden">
          <div
            className={`sticky top-0 z-10 border border-gray-200 rounded-lg ${ButtonConfig.cardheaderColor} shadow-sm p-0 mb-2`}
          >
            <div className="flex flex-col gap-2">
          
              <div className="flex justify-between items-center">
                <h1 className="text-base font-bold text-gray-800 px-2">
                  Quotation Report
                </h1>
                <div className="flex gap-[2px]">
                  <button
                    className={`sm:w-auto ${ButtonConfig.backgroundColor} ${ButtonConfig.hoverBackgroundColor} ${ButtonConfig.textColor} text-sm p-3 rounded-b-md`}
                    onClick={handleDownloadCsv}
                    disabled={!searchParams || !quotationData?.data?.length}
                  >
                    <FaRegFileExcel className="h-4 w-4" />
                  </button>
                  <button
                    className={`sm:w-auto ${ButtonConfig.backgroundColor} ${ButtonConfig.hoverBackgroundColor} ${ButtonConfig.textColor} text-sm p-3 rounded-b-md`}
                    onClick={handleDownloadPDF}
                    disabled={!searchParams || !quotationData?.data?.length}
                  >
                    <FaRegFilePdf className="h-4 w-4" />
                  </button>
                  <button
                    className={`sm:w-auto ${ButtonConfig.backgroundColor} ${ButtonConfig.hoverBackgroundColor} ${ButtonConfig.textColor} text-sm p-3 rounded-b-md`}
                    onClick={handlePrintPdf}
                    disabled={!searchParams || !quotationData?.data?.length}
                  >
                    <Printer className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Mobile Form */}
              <form onSubmit={form.handleSubmit(onSubmit)} className="bg-white p-2 rounded-md shadow-xs">
                <div className="grid grid-cols-2 gap-2">
                  {/* Buyer Selection */}
                  <div className="space-y-1 col-span-2">
                    <Label htmlFor="buyer_id" className="text-xs">
                      Buyer
                    </Label>
                    <Select
                      id="buyer_id"
                      options={buyers.map(buyer => ({
                        value: buyer.id.toString(),
                        label: buyer.buyer_name
                      }))}
                      value={buyers.find(buyer => 
                        buyer.id.toString() === form.watch("buyer_id")
                      ) ? {
                        value: form.watch("buyer_id"),
                        label: buyers.find(b => b.id.toString() === form.watch("buyer_id"))?.buyer_name
                      } : null}
                      onChange={(selected) => 
                        form.setValue("buyer_id", selected?.value || "")
                      }
                      styles={selectStyles}
                      className="react-select-container text-xs"
                      classNamePrefix="react-select"
                      placeholder="All Buyers"
                      isClearable
                      isLoading={buyersLoading}
                    />
                  </div>

                  {/* Status Selection */}
                  <div className="space-y-1 col-span-2">
                    <Label htmlFor="quotation_status" className="text-xs">
                      Status
                    </Label>
                    <Select
                      id="quotation_status"
                      options={quotationStatusOptions}
                      value={quotationStatusOptions.find(option => 
                        option.value === form.watch("quotation_status")
                      )}
                      onChange={(selected) => 
                        form.setValue("quotation_status", selected?.value || "")
                      }
                      styles={selectStyles}
                      className="react-select-container text-xs"
                      classNamePrefix="react-select"
                      placeholder="All Status"
                      isClearable
                    />
                  </div>

                  {/* From Date */}
                  <div className="space-y-1">
                    <Label htmlFor="from_date" className="text-xs">
                      From Date
                    </Label>
                    <input
                      id="from_date"
                      type="date"
                      {...form.register("from_date")}
                      className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={form.watch("from_date")}
                      onChange={(e) => form.setValue("from_date", e.target.value)}
                    />
                  </div>

                  {/* To Date */}
                  <div className="space-y-1">
                    <Label htmlFor="to_date" className="text-xs">
                      To Date
                    </Label>
                    <input
                      id="to_date"
                      type="date"
                      {...form.register("to_date")}
                      className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={form.watch("to_date")}
                      onChange={(e) => form.setValue("to_date", e.target.value)}
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="col-span-2 pt-1">
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className={`w-full h-8 ${ButtonConfig.backgroundColor} ${ButtonConfig.hoverBackgroundColor} ${ButtonConfig.textColor}`}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Search className="h-3 w-3 mr-1" />
                          Generate Report
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </div>

         
          {searchParams && (
            <div className="p-2" ref={tableRef}>
              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <>
                  <div className="text-center font-semibold text-sm mb-2">
                    Quotation Report
                  </div>
                  <div className="text-center text-xs mb-3">
                    From {moment(searchParams.from_date).format("DD-MMM-YYYY")}{" "}
                    to {moment(searchParams.to_date).format("DD-MMM-YYYY")}
                  </div>

                  {/* Summary */}
                  {quotationData?.data?.length > 0 && (
                    <div className="mb-4 p-2 bg-blue-50 rounded-lg">
                      <div className="text-center text-sm font-medium">
                        Total Quotations: {quotationData.data.length}
                      </div>
                    </div>
                  )}

                  {/* Quotations List */}
                  {quotationData?.data?.length ? (
                    <div className="space-y-3">
                      {quotationData.data.map((quotation, index) => (
                        <div key={index} className="border rounded-lg p-3 bg-white shadow-xs">
                          <div className="flex justify-between items-start mb-2">
                            <div className="font-medium text-sm">
                              {quotation.quotation_ref}
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(quotation.quotation_status)}`}>
                              {quotation.quotation_status}
                            </span>
                          </div>
                          
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Date:</span>
                              <span className="font-medium">
                                {moment(quotation.quotation_date).format("DD-MMM-YYYY")}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Buyer:</span>
                              <span className="font-medium">
                                {quotation.buyer_name}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Valid Until:</span>
                              <span className="font-medium">
                                {moment(quotation.quotation_valid_date).format("DD-MMM-YYYY")}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No quotations found for the selected criteria
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

      
        <div className="hidden sm:block">
          <Card className="shadow-sm">
            <div className={`sticky top-0 z-10 border border-gray-200 rounded-lg ${ButtonConfig.cardheaderColor} shadow-sm p-3 mb-2`}>
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="w-[30%] shrink-0">
                  <h1 className="text-xl font-bold text-gray-800 truncate">Quotation Report</h1>
                  {searchParams && quotationData?.data?.length > 0 && (
                    <p className="text-md text-gray-500 truncate">
                      {quotationData.data.length} quotations found
                    </p>
                  )}
                </div>

                <div className="bg-white w-full lg:w-[70%] p-3 rounded-md shadow-xs">
                  <form onSubmit={form.handleSubmit(onSubmit)}>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      {/* Buyer Selection */}
                      <div className="space-y-1">
                        <Label htmlFor="buyer_id" className={`text-xs ${ButtonConfig.cardLabel || "text-gray-700"}`}>
                          Buyer
                        </Label>
                        <Select
                          id="buyer_id"
                          options={buyers.map(buyer => ({
                            value: buyer.id.toString(),
                            label: buyer.buyer_name
                          }))}
                          value={buyers.find(buyer => 
                            buyer.id.toString() === form.watch("buyer_id")
                          ) ? {
                            value: form.watch("buyer_id"),
                            label: buyers.find(b => b.id.toString() === form.watch("buyer_id"))?.buyer_name
                          } : null}
                          onChange={(selected) => 
                            form.setValue("buyer_id", selected?.value || "")
                          }
                          styles={selectStyles}
                          className="react-select-container text-xs"
                          classNamePrefix="react-select"
                          placeholder="All Buyers"
                          isClearable
                          isLoading={buyersLoading}
                        />
                      </div>

                      {/* Status Selection */}
                      <div className="space-y-1">
                        <Label htmlFor="quotation_status" className={`text-xs ${ButtonConfig.cardLabel || "text-gray-700"}`}>
                          Status
                        </Label>
                        <Select
                          id="quotation_status"
                          options={quotationStatusOptions}
                          value={quotationStatusOptions.find(option => 
                            option.value === form.watch("quotation_status")
                          )}
                          onChange={(selected) => 
                            form.setValue("quotation_status", selected?.value || "")
                          }
                          styles={selectStyles}
                          className="react-select-container text-xs"
                          classNamePrefix="react-select"
                          placeholder="All Status"
                          isClearable
                        />
                      </div>

                      {/* From Date */}
                      <div className="space-y-1">
                        <Label htmlFor="from_date" className={`text-xs ${ButtonConfig.cardLabel || "text-gray-700"}`}>
                          From Date
                        </Label>
                        <Input
                          id="from_date"
                          type="date"
                          {...form.register("from_date")}
                          className="h-8 text-xs"
                        />
                      </div>

                      {/* To Date */}
                      <div className="space-y-1">
                        <Label htmlFor="to_date" className={`text-xs ${ButtonConfig.cardLabel || "text-gray-700"}`}>
                          To Date
                        </Label>
                        <Input
                          id="to_date"
                          type="date"
                          {...form.register("to_date")}
                          className="h-8 text-xs"
                        />
                      </div>

                      {/* Submit Button */}
                      <div className="md:col-span-4 flex justify-end">
                        <Button
                          type="submit"
                          disabled={isLoading}
                          className={`h-8 text-xs ${ButtonConfig.backgroundColor} ${ButtonConfig.hoverBackgroundColor} ${ButtonConfig.textColor}`}
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="h-3 w-3 animate-spin mr-1" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Search className="h-3 w-3 mr-1" />
                              Generate
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>

            {searchParams && (
              <>
                <CardHeader className="border-t">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between sm:gap-2">
                    <CardTitle className="text-lg flex flex-col">
                      <span>Quotation Report</span>
                      <span className="text-sm font-normal text-gray-500">
                        {moment(searchParams.from_date).format("DD-MMM-YYYY")}{" "}
                        to {moment(searchParams.to_date).format("DD-MMM-YYYY")}
                        {searchParams.buyer_id && ` • ${buyers.find(b => b.id.toString() === searchParams.buyer_id)?.buyer_name}`}
                        {searchParams.quotation_status && ` • ${searchParams.quotation_status}`}
                      </span>
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDownloadCsv}
                        disabled={!quotationData?.data?.length}
                      >
                        <FaRegFileExcel className="mr-2 h-4 w-4" />
                        CSV
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDownloadPDF}
                        disabled={!quotationData?.data?.length}
                      >
                        <FaRegFilePdf className="mr-2 h-4 w-4" />
                        PDF
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePrintPdf}
                        disabled={!quotationData?.data?.length}
                      >
                        <Printer className="mr-2 h-4 w-4" />
                        Print
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div ref={tableRef} className="overflow-x-auto print:p-4">
                    {/* Report Header */}
                    <div className="text-center mb-6">
                      <h2 className="text-xl font-bold">Quotation Report</h2>
                      <div className="text-sm text-gray-600 mt-1">
                        Period: {moment(searchParams.from_date).format("DD-MMM-YYYY")} to {moment(searchParams.to_date).format("DD-MMM-YYYY")}
                      </div>
                      {quotationData?.data?.length > 0 && (
                        <div className="text-sm font-medium mt-2">
                          Total Quotations: {quotationData.data.length}
                        </div>
                      )}
                    </div>

                    {/* Main Table */}
                    <Table className="border">
                      <TableHeader>
                        <TableRow className="bg-gray-100 hover:bg-gray-100">
                          <TableHead className="text-center border-r">Quotation Ref</TableHead>
                          <TableHead className="text-center border-r">Quotation Date</TableHead>
                          <TableHead className="text-center border-r">Buyer Name</TableHead>
                          <TableHead className="text-center border-r">Valid Until</TableHead>
                          <TableHead className="text-center">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoading ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8">
                              <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                              <p className="mt-2 text-gray-600">Loading quotations...</p>
                            </TableCell>
                          </TableRow>
                        ) : quotationData?.data?.length ? (
                          quotationData.data.map((quotation, index) => (
                            <TableRow
                              key={index}
                              className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                            >
                              <TableCell className="text-center border-r font-medium">
                                {quotation.quotation_ref}
                              </TableCell>
                              <TableCell className="text-center border-r">
                                {moment(quotation.quotation_date).format("DD-MMM-YYYY")}
                              </TableCell>
                              <TableCell className="border-r">
                                {quotation.buyer_name}
                              </TableCell>
                              <TableCell className="text-center border-r">
                                {moment(quotation.quotation_valid_date).format("DD-MMM-YYYY")}
                              </TableCell>
                              <TableCell className="text-center">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(quotation.quotation_status)}`}>
                                  {quotation.quotation_status}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                              <div className="flex flex-col items-center">
                                <FileText className="h-12 w-12 text-gray-300 mb-2" />
                                <p className="text-lg font-medium">No quotations found</p>
                                <p className="text-sm text-gray-600">
                                  Try adjusting your search criteria
                                </p>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>

                    {/* Summary Footer */}
                    {quotationData?.data?.length > 0 && (
                      <div className="mt-6 pt-4 border-t">
                        <div className="flex justify-between items-center">
                          <div className="text-sm text-gray-600">
                            Report generated on {moment().format("DD-MMM-YYYY HH:mm")}
                          </div>
                          <div className="text-sm font-medium">
                            Total Quotations: {quotationData.data.length}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </>
            )}
          </Card>
        </div>
      </div>
    </>
  );
};

export default QuotationReport;