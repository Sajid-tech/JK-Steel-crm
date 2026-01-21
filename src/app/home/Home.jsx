import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, CheckCircle, Clock, TrendingUp, BarChart3, PieChart, Loader2 } from "lucide-react";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";
import moment from "moment";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import BASE_URL from "@/config/BaseUrl";
import Cookies from "js-cookie";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const StatCard = ({ title, value, icon: Icon, className, isLoading }) => (
  <div className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          {isLoading ? (
            <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
          ) : (
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-800">
              {title === "Monthly Amount" ? `₹${parseFloat(value || 0).toFixed(2)}` : value || 0}
            </h3>
          )}
        </div>
        <div className={`p-3 ${className} rounded-lg`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  </div>
);

const Home = () => {
  const navigate = useNavigate();
  
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    
    checkMobile();

    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);

  }, []);

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

  const pieChartData = {
    labels: dashboardData?.graph1?.map(item => item.quotation_status) || [],
    datasets: [
      {
        data: dashboardData?.graph1?.map(item => item.total) || [],
        backgroundColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
          '#FF9F40', '#8AC926', '#1982C4', '#6A4C93', '#FF595E',
        ],
        borderColor: '#FFFFFF',
        borderWidth: 1,
        hoverOffset: 10,
      },
    ],
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: isMobile ? '60%' : '55%',
    plugins: {
      legend: {
        position: isMobile ? 'bottom' : 'right',
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: isMobile ? 10 : 12,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const label = context.label || '';
            const value = context.raw || 0;
            const total = dashboardData?.graph1?.reduce((sum, item) => sum + item.total, 0) || 1;
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
  };

  const barChartData = {
    labels: dashboardData?.graph2?.labels || [],
    datasets: [
      {
        label: "Monthly Quotations",
        data: dashboardData?.graph2?.data || [],
        backgroundColor: "#3B82F6",
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            return `Quotations: ${context.parsed.y}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: !isMobile,
          text: "Number of Quotations",
          font: {
            size: isMobile ? 10 : 12,
            weight: "bold",
          },
        },
        ticks: {
          font: {
            size: isMobile ? 9 : 10,
          },
          stepSize: 1,
        },
        grid: {
          drawBorder: false,
        },
      },
      x: {
        title: {
          display: !isMobile,
          text: "Month",
          font: {
            size: isMobile ? 10 : 12,
            weight: "bold",
          },
        },
        ticks: {
          font: {
            size: isMobile ? 9 : 10,
          },
          maxRotation: isMobile ? 90 : 45,
          minRotation: isMobile ? 90 : 45,
        },
        grid: {
          display: false,
        },
      },
    },
  };

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
    <div className="min-h-screen">
      <div className="max-w-340 mx-auto ">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Welcome back! Here's your overview for {moment().format('MMMM YYYY')}
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <StatCard
            title="Total Quotations"
            value={dashboardData?.total_quotations}
            icon={FileText}
            className="bg-blue-100 text-blue-600"
            isLoading={isLoading}
          />
          <StatCard
            title="Pending"
            value={dashboardData?.pending_quotations}
            icon={Clock}
            className="bg-amber-100 text-amber-600"
            isLoading={isLoading}
          />
          <StatCard
            title="Approved"
            value={dashboardData?.approved_quotations}
            icon={CheckCircle}
            className="bg-green-100 text-green-600"
            isLoading={isLoading}
          />
          <StatCard
            title="Monthly Amount"
            value={dashboardData?.monthlyAmount}
            icon={TrendingUp}
            className="bg-purple-100 text-purple-600"
            isLoading={isLoading}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-8">
          <div className="border border-gray-200 shadow-sm rounded-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-green-50 pb-4">
              <div>
                <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-blue-600" />
                  Quotation Status Distribution
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Breakdown of quotation statuses
                </p>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="animate-spin text-blue-500 h-8 w-8" />
                </div>
              ) : dashboardData?.graph1?.length > 0 ? (
                <div className="h-64">
                  <Doughnut data={pieChartData} options={pieChartOptions} />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                  <PieChart className="h-12 w-12 mb-4" />
                  <p>No status data available</p>
                </div>
              )}
            </CardContent>
          </div>

          <div className="border border-gray-200 shadow-sm rounded-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-green-50 pb-4">
              <div>
                <CardTitle className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-green-600" />
                  Monthly Quotation Trend
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Quotation count over last 6 months
                </p>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="animate-spin text-blue-500 h-8 w-8" />
                </div>
              ) : dashboardData?.graph2?.labels?.length > 0 ? (
                <div className="h-64">
                  <Bar data={barChartData} options={barChartOptions} />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                  <BarChart3 className="h-12 w-12 mb-4" />
                  <p>No trend data available</p>
                </div>
              )}
            </CardContent>
          </div>
        </div>

        <div className="border border-gray-200 shadow-sm rounded-lg">
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
                {dashboardData.last_quotations.slice(0,5).map((quotation) => (
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
  );
};

export default Home;