import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays, ChevronLeft, ChevronRight, Plus, FileText, CheckCircle, Clock, TrendingUp, Eye, ArrowUpRight } from "lucide-react";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";
import moment from "moment";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import BASE_URL from "@/config/BaseUrl";
import Cookies from "js-cookie";

const Home = () => {
  const navigate = useNavigate();
 
  const { data: dashboardData, isLoading, isError, refetch } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const token = Cookies.get("token");
      const response = await axios.get(`${BASE_URL}/api/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000,
  });


  if (isError) {
    return (
      <div className="p-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-destructive font-medium mb-2">
              Error Loading Dashboard
            </div>
            <Button onClick={() => refetch()} variant="outline" size="sm">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen ">
      <div className=" max-w-7xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Welcome back! Here's your overview for {moment().format('MMMM YYYY')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Quotations</p>
                  {isLoading ? (
                    <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
                  ) : (
                    <h3 className="text-2xl sm:text-3xl font-bold text-gray-800">
                      {dashboardData?.total_quotations || 0}
                    </h3>
                  )}
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/quotation")}
                  className="w-full text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                >
                  View All
                  <ArrowUpRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Pending</p>
                  {isLoading ? (
                    <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
                  ) : (
                    <h3 className="text-2xl sm:text-3xl font-bold text-gray-800">
                      {dashboardData?.pending_quotations || 0}
                    </h3>
                  )}
                </div>
                <div className="p-3 bg-amber-100 rounded-lg">
                  <Clock className="h-6 w-6 text-amber-600" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="text-xs text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg">
                  Needs attention
                </div>
              </div>
            </div>
          </div>

          <div className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Approved</p>
                  {isLoading ? (
                    <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
                  ) : (
                    <h3 className="text-2xl sm:text-3xl font-bold text-gray-800">
                      {dashboardData?.approved_quotations || 0}
                    </h3>
                  )}
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="text-xs text-green-700 bg-green-50 px-3 py-1.5 rounded-lg">
                  Completed
                </div>
              </div>
            </div>
          </div>

          <div className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Monthly Amount</p>
                  {isLoading ? (
                    <div className="h-8 w-32 bg-gray-200 rounded animate-pulse"></div>
                  ) : (
                    <h3 className="text-2xl sm:text-3xl font-bold text-gray-800">
                      ₹{parseFloat(dashboardData?.monthlyAmount || 0).toFixed(2)}
                    </h3>
                  )}
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500">This month's total</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          <div className="border border-gray-200 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-gray-800">
                  Recent Quotations
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/quotation")}
                  className="text-blue-600 hover:text-blue-800"
                >
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="animate-pulse mb-4">
                    <div className="h-16 bg-gray-200 rounded-lg"></div>
                  </div>
                ))
              ) : dashboardData?.last_quotations?.length > 0 ? (
                <div className="space-y-3">
                  {dashboardData.last_quotations.map((quotation) => (
                    <div
                      key={quotation.id}
                      className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-100"
                    >
                      <div className="flex items-center space-x-3 sm:space-x-4">
                        <div className="p-2 bg-white rounded-lg border border-gray-200">
                          <FileText className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-800 text-sm sm:text-base">
                            {quotation.quotation_ref}
                          </h4>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className="text-xs text-gray-600">{quotation.buyer_name}</span>
                            <span className="text-xs text-gray-500">•</span>
                            <span className="text-xs text-gray-500">{quotation.quotation_date}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="font-semibold text-gray-800 text-sm sm:text-base">
                          ₹{parseFloat(quotation.total_amount).toFixed(2)}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full mt-1 ${
                          quotation.quotation_status === "Pending" 
                            ? "bg-amber-100 text-amber-800"
                            : quotation.quotation_status === "Approved"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}>
                          {quotation.quotation_status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No recent quotations found
                </div>
              )}
            </CardContent>
          </div>

        
        </div>

      </div>
    </div>
  );
};

export default Home;