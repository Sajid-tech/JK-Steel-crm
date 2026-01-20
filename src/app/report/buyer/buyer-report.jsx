import React, { useRef } from "react";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import Page from "@/app/dashboard/page";
import BASE_URL from "@/config/BaseUrl";
import { Download, Loader2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ButtonConfig } from "@/config/ButtonConfig";
import { useReactToPrint } from "react-to-print";
import Cookies from "js-cookie";

const BuyerReport = () => {
  const containerRef = useRef();
  const { toast } = useToast();

  const fetchBuyerData = async () => {
    const token = Cookies.get("token");
    const response = await axios.get(`${BASE_URL}/api/buyer-report`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data.data;
  };

  const {
    data: buyerData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["buyerReportData"],
    queryFn: fetchBuyerData,
  });

  

  const handlePrintPdf = useReactToPrint({
    content: () => containerRef.current,
    documentTitle: "Buyer_Report",
    pageStyle: `
      @page {
        size: A4 landscape;
        margin: 5mm;
      }
      @media print {
        body {
          font-size: 10px; 
          margin: 0mm;
          padding: 0mm;
        }
        table {
          font-size: 11px;
        }
        .print-hide {
          display: none;
        }
      }
    `,
  });

  const BuyerRPrint = ({ className, onClick }) => (
    <Button className={className} onClick={onClick}>
      <Printer className="mr-2 h-4 w-4" />
      Print
    </Button>
  );

  const BuyerRDownload = ({ className, onClick }) => (
    <Button className={className} onClick={onClick}>
      <Download className="mr-2 h-4 w-4" />
      Download
    </Button>
  );

  if (isLoading) {
    return (
      <>
        <div className="p-4">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="animate-spin text-blue-500 h-8 w-8" />
            <span className="ml-2">Loading Buyer Report </span>
          </div>
        </div>
      </>
    );
  }

  if (isError) {
    return (
      <>
        <div className="p-4">
          <div className="flex flex-col items-center justify-center h-64">
            <div className="text-red-500 text-center mb-4">
              Error Loading Buyer Report Data
            </div>
            <Button onClick={() => refetch()} variant="outline" size="sm">
              Try Again
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="">
        <div className="flex justify-between items-center p-2 rounded-lg mb-5 bg-gray-200">
          <h1 className="text-xl font-bold">Buyer Report</h1>
          <div className="flex flex-row items-center gap-4">
            <div>
              <BuyerRPrint
                className={`ml-2 ${ButtonConfig.backgroundColor} ${ButtonConfig.hoverBackgroundColor} ${ButtonConfig.textColor}`}
                onClick={handlePrintPdf}
              />
            </div>
          </div>
        </div>
        <div className="overflow-x-auto text-[11px]" ref={containerRef}>
          <table className="w-full border-collapse border border-black">
            <thead className="bg-gray-100">
              <tr>
                <th
                  className="border border-black px-2 py-2 text-left"
                  colSpan={8}
                >
                  Buyer Report
                </th>
              </tr>
              <tr>
                <th className="border border-black px-2 py-2 text-center">S.No</th>
                <th className="border border-black px-2 py-2 text-center">
                  Buyer Name
                </th>
                <th className="border border-black px-2 py-2 text-center">
                  Contact Name
                </th>
                <th className="border border-black px-2 py-2 text-center">
                  Email
                </th>
                <th className="border border-black px-2 py-2 text-center">
                  Mobile
                </th>
                <th className="border border-black px-2 py-2 text-center">
                  GST/VAT
                </th>
                <th className="border border-black px-2 py-2 text-center">
                  Address
                </th>
                <th className="border border-black px-2 py-2 text-center">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {buyerData && buyerData.length > 0 ? (
                buyerData.map((buyer, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="border border-black px-2 py-2 text-center">
                      {index + 1}
                    </td>
                    <td className="border border-black px-2 py-2">
                      {buyer.buyer_name}
                    </td>
                    <td className="border border-black px-2 py-2">
                      {buyer.buyer_contact_name}
                    </td>
                    <td className="border border-black px-2 py-2">
                      {buyer.buyer_email}
                    </td>
                    <td className="border border-black px-2 py-2">
                      {buyer.buyer_mobile}
                    </td>
                    <td className="border border-black px-2 py-2">
                      {buyer.buyer_gst_vat}
                    </td>
                    <td className="border border-black px-2 py-2">
                      {buyer.buyer_address}
                    </td>
                    <td className="border border-black px-2 py-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          buyer.buyer_status === "Active"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {buyer.buyer_status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="border border-black px-2 py-4 text-center">
                    No buyer data found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default BuyerReport;