import React, { useRef } from "react";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { Download, Loader2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ButtonConfig } from "@/config/ButtonConfig";
import { useReactToPrint } from "react-to-print";
import Cookies from "js-cookie";
import BASE_URL from "@/config/BaseUrl";

const ItemReport = () => {
  const containerRef = useRef();
  const { toast } = useToast();

  const fetchItemData = async () => {
    const token = Cookies.get("token");
    const response = await axios.get(`${BASE_URL}/api/item-report`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data.data;
  };

  const {
    data: itemData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["itemReportData"],
    queryFn: fetchItemData,
  });

  

  const handlePrintPdf = useReactToPrint({
    content: () => containerRef.current,
    documentTitle: "Item_Report",
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

  const ItemRPrint = ({ className, onClick }) => (
    <Button className={className} onClick={onClick}>
      <Printer className="mr-2 h-4 w-4" />
      Print
    </Button>
  );

  const ItemRDownload = ({ className, onClick }) => (
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
            <span className="ml-2">Loading Item Report Data...</span>
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
              Error Loading Item Report Data
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
          <h1 className="text-xl font-bold">Item Report</h1>
          <div className="flex flex-row items-center gap-4">
            <div>
              <ItemRPrint
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
                  colSpan={6}
                >
                  Item Report
                </th>
              </tr>
              <tr>
                <th className="border border-black px-2 py-2 text-center">S.No</th>
                <th className="border border-black px-2 py-2 text-center">
                  Item Name
                </th>
                <th className="border border-black px-2 py-2 text-center">
                  Description
                </th>
                <th className="border border-black px-2 py-2 text-center">
                  Price (₹)
                </th>
                <th className="border border-black px-2 py-2 text-center">
                  Tax (%)
                </th>
                <th className="border border-black px-2 py-2 text-center">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {itemData && itemData.length > 0 ? (
                itemData.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="border border-black px-2 py-2 text-center">
                      {index + 1}
                    </td>
                    <td className="border border-black px-2 py-2">
                      {item.item_name}
                    </td>
                    <td className="border border-black px-2 py-2">
                      {item.item_description}
                    </td>
                    <td className="border border-black px-2 py-2 text-right">
                      ₹{parseFloat(item.item_price).toFixed(2)}
                    </td>
                    <td className="border border-black px-2 py-2 text-right">
                      {item.item_tax}%
                    </td>
                    <td className="border border-black px-2 py-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          item.item_status === "Active"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {item.item_status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="border border-black px-2 py-4 text-center">
                    No item data found
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

export default ItemReport;