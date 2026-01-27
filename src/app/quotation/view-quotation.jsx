import React, { useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import Cookies from "js-cookie";
import BASE_URL from "@/config/BaseUrl";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Edit, Share } from "lucide-react";
import html2pdf from "html2pdf.js";
import { FaWhatsapp } from "react-icons/fa";

const ViewQuotation = () => {
  const { id } = useParams();
  const tableRef = useRef(null);
  const navigate = useNavigate();
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

  const handleDownloadPDF = () => {
    const input = tableRef.current;
    const options = {
      margin: [5, 5, 5, 5],
      filename: `quotation-${quotationData?.quotation_ref || "report"}.pdf`,
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
          description: "Ledger report saved as PDF",
        });
      });
  };
  const WhatsappShareNavigator = async () => {
    try {
      const element = tableRef.current;

    const options = {
      margin: [5, 5, 5, 5],
      filename: `quotation-${quotationData?.quotation_ref || "report"}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        windowHeight: element.scrollHeight,
        scrollY: 0,
      },
      jsPDF: {
        unit: "mm",
        format: "a4",
        orientation: "portrait",
      },
    };

    const pdfBlob = await html2pdf().from(element).set(options).output("blob");

    const file = new File([pdfBlob], `Quotation-Report.pdf`, {
      type: "application/pdf",
    });

    const message = `Quotation Report

Quotation No: ${quotationData?.quotation_ref}
Quotation Date: ${quotationData?.quotation_date}
Buyer Name: ${quotationData?.buyer_name}
Total Amount: ₹${quotationData?.total_amount}

Please find the attached quotation document.`;
      
      try {
        if (
          navigator.share &&
          navigator.canShare &&
          navigator.canShare({ files: [file] })
        ) {
          await navigator.share({
            files: [file],
            text: message,
          });
          return;
        }
      } catch (shareError) {
        console.log("Web Share API failed:", shareError);
      }

      if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        const fileUrl = URL.createObjectURL(file);

        if (navigator.share) {
          try {
            await navigator.share({
              text: message,
              url: fileUrl,
            });
            URL.revokeObjectURL(fileUrl);
            return;
          } catch (mobileShareError) {
            console.log("Mobile share failed:", mobileShareError);
          }
        }

        const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(
          message
        )}`;
        window.location.href = whatsappUrl;

        setTimeout(() => {
          const webWhatsappUrl = `https://web.whatsapp.com/send?text=${encodeURIComponent(
            message
          )}`;
          window.open(webWhatsappUrl, "_blank");
        }, 1000);

        URL.revokeObjectURL(fileUrl);
        return;
      }

      const webWhatsappUrl = `https://web.whatsapp.com/send?text=${encodeURIComponent(
        message
      )}`;
      window.open(webWhatsappUrl, "_blank");
    } catch (error) {
      console.error("Error in whatsappPdf:", error);
      alert("There was an error sharing the PDF. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto bg-white p-8">
        <div className="text-center">Loading quotation...</div>
      </div>
    );
  }

  if (!quotationData) {
    return (
      <div className="max-w-4xl mx-auto bg-white p-8">
        <div className="text-center">No quotation data found</div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatCurrency = (amount) => {
    if (!amount) return "₹0.00";
    const num = parseFloat(amount);
    return `₹${num.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const { branch, subs, ...quotation } = quotationData;

  return (
    <div className=" relative  bg-white ">
      <div className=" sticky top-20 flex  flex-row  items-center  justify-end gap-4 mr-4">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate(`/quotation/edit/${quotation.id}`)}
        className="  rounded-lg border-2 p-4 h-7 w-7 bg-blue-500 text-white hover:text-white hover:bg-blue-800"
      >
        <Edit className="h-4 w-4 " />
      </Button>



      <Button
        variant="ghost"
        size="sm"
        onClick={handleDownloadPDF}

        className=" rounded-lg border-2 p-4 h-7 w-7 bg-blue-500 text-white hover:text-white hover:bg-blue-800"
      >
       PDF
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={WhatsappShareNavigator}

        className="  rounded-lg border-2 p-4 h-7 w-7 bg-blue-500 text-white hover:text-white hover:bg-blue-800"
      >
      <FaWhatsapp className="h-4 w-4 "/>
      </Button>
      </div>
      <div className="bg-gray-100 max-w-4xl mx-auto px-4 py-2 rounded-md">
      <div ref={tableRef} className=" ">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-2xl font-bold mb-1">
              {branch?.branch_name || "J K STEEL"}
            </h1>
            <p className="text-sm">
              {branch?.branch_sign_name || "GOURAV GARG"}
            </p>
            <p className="text-xs">
              {branch?.branch_address ||
                "RISHI NAGAR OPP GALI NUMBER 6 KURUKSHETRA ROAD KAITHAL"}
            </p>
            <p className="text-xs">
              ☎ {branch?.branch_mobile_no || "8198979419"} ✉{" "}
              {branch?.branch_email_id || "spekar549@gmail.com"}
            </p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold">Quotation</h2>
          </div>
        </div>

        <div className="flex justify-between mb-6">
          <div>
            <p className="text-sm font-semibold">To,</p>
            <p className="text-sm font-bold">
              {quotation.buyer_name || "HF STUDIO"}
            </p>
            <p className="text-sm">{quotation.buyer_name || "HF STUDIO"}</p>
            <p className="text-sm">KAITHAL</p>
          </div>
          <div className="text-right">
            <p className="text-sm">
              <span className="font-semibold">Quotation:</span>{" "}
              {quotation.quotation_ref || "Quote-12"}
            </p>
            <p className="text-sm">
              <span className="font-semibold">Date:</span>{" "}
              {formatDate(quotation.quotation_date) || "26/12/2025"}
            </p>
            {quotation.quotation_valid_date && (
              <p className="text-sm">
                <span className="font-semibold">Valid Until:</span>{" "}
                {formatDate(quotation.quotation_valid_date)}
              </p>
            )}
          </div>
        </div>

        <p className="text-sm mb-2">Dear Sir/Mam,</p>
        <p className="text-sm mb-6">
          Thank you for your valuable inquiry. We are pleased to quote as below:
        </p>

        <table className="w-full border-collapse mb-6">
          <thead>
            <tr className="border-b-2 border-black">
              <th className="text-left py-2 px-2 text-sm font-bold">SL</th>
              <th className="text-left py-2 px-2 text-sm font-bold">
                DESCRIPTION
              </th>
              <th className="text-right py-2 px-2 text-sm font-bold">QTY</th>
              <th className="text-right py-2 px-2 text-sm font-bold">PRICE</th>
              <th className="text-right py-2 px-2 text-sm font-bold">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {subs?.map((item, index) => (
              <tr key={item.id || index} className="border-b border-gray-300">
                <td className="py-3 px-2 text-sm align-top">{index + 1}</td>
                <td className="py-3 px-2 text-sm align-top">
                  <div className="font-semibold">{item.item_name || "N/A"}</div>
                  {item.item_type == "Sheet" && (
                    <div className="text-xs text-gray-600">
                      {item.quotation_sub_qnty} {item.item_type}
                    </div>
                  )}
                </td>
                <td className="py-3 px-2 text-sm text-right align-top">
                  <div>
                    {item.quotation_sub_qnty * item.quotation_sub_size}{" "}
                    {item.quotation_sub_unit}
                  </div>
                </td>
                <td className="py-3 px-2 text-sm text-right align-top">
                  {formatCurrency(item.quotation_sub_rate || "0")}
                </td>
                <td className="py-3 px-2 text-sm text-right align-top">
                  {formatCurrency(item.quotation_sub_amount || "0")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end mb-6">
          <div className="w-64">
            <div className="flex justify-between py-2 border-t-2 border-black">
              <span className="font-bold text-sm">GRAND TOTAL</span>
              <span className="font-bold text-sm">
                {formatCurrency(quotation.total_amount || "0")}
              </span>
            </div>
          </div>
        </div>

        <p className="text-sm mb-6">
          {quotation.quotation_remarks ||
            "We hope you find our offer to be in line with your requirement."}
        </p>

        <div className="mb-8">
          <p className="font-bold text-sm mb-2">Terms & Conditions:</p>
          <p className="text-xs mb-1">
            1) Warranty: Against colour Fading, delamination and manufacturing
            defects
          </p>
          <p className="text-xs mb-1">
            2) Delivery : 5-7 days after advance payment
          </p>
          <p className="text-xs mb-1">
            3) Payment Terms : 50% advance and balance on delivery
          </p>
          <p className="text-xs mb-1">4) Transport : extra chargeable</p>
          <p className="text-xs mb-1">5) Installation charges not include</p>
          <p className="text-xs mb-1">SUBJECT: KAITHAL</p>
          {branch?.branch_name && (
            <p className="text-xs mb-1">{branch.branch_name}</p>
          )}
          <p className="text-xs mb-1">State bank of india</p>
          <p className="text-xs mb-1">JK STEEL</p>
          <p className="text-xs mb-1">A/C : 65280797544</p>
          <p className="text-xs mb-1">IFSC: SBIN0050112</p>
        </div>

        <div className="text-right mt-12 mb-4">
          <p className="text-sm font-semibold mb-16">
            For, {branch?.branch_name || "J K STEEL"}
          </p>
          <p className="text-xs">AUTHORIZED SIGNATURE</p>
        </div>
      </div>
      </div>
    </div>
  );
};

export default ViewQuotation;
