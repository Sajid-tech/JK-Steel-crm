import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import BASE_URL from "@/config/BaseUrl";
import useNumericInput from "@/hooks/useNumericInput";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import axios from "axios";
import Cookies from "js-cookie";
import { ArrowUpDown, ChevronDown, ChevronLeft, ChevronRight, Eye, Search, Trash2, Loader2, FileText, Edit, Square, SquarePlus } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const QuotationList = () => {
  const userType = Cookies.get('user_type_id');
  const queryClient = useQueryClient();
  const keyDown = useNumericInput();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [previousSearchTerm, setPreviousSearchTerm] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState({});
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null, quotationNo: "" });
  const { toast } = useToast();
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [pageInput, setPageInput] = useState("");

  useEffect(() => {
    const savedPage = Cookies.get("quotationReturnPage");
    if (savedPage) {
      Cookies.remove("quotationReturnPage");
      setTimeout(() => {
        const pageIndex = parseInt(savedPage) - 1;
        if (pageIndex >= 0) {
          setPagination(prev => ({ ...prev, pageIndex }));
          setPageInput(savedPage);
          queryClient.invalidateQueries({
            queryKey: ["quotations"],
            exact: false,
          });
        }
      }, 100);
    }
  }, [queryClient]);

  useEffect(() => {
    const timerId = setTimeout(() => {
      const isNewSearch = searchTerm !== previousSearchTerm && previousSearchTerm !== "";
      if (isNewSearch) {
        setPagination(prev => ({ ...prev, pageIndex: 0 }));
      }
      setDebouncedSearchTerm(searchTerm);
      setPreviousSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timerId);
  }, [searchTerm, previousSearchTerm]);

  const {
    data: quotationsData,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["quotations", debouncedSearchTerm, pagination.pageIndex + 1],
    queryFn: async () => {
      const token = Cookies.get("token");
      const params = new URLSearchParams({
        page: (pagination.pageIndex + 1).toString(),
      });
      if (debouncedSearchTerm) {
        params.append("search", debouncedSearchTerm);
      }
      const response = await axios.get(`${BASE_URL}/api/quotation?${params}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
      });
      return response.data.data;
    },
    keepPreviousData: true,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    const currentPage = pagination.pageIndex + 1;
    const totalPages = quotationsData?.last_page || 1;
    
    if (currentPage < totalPages) {
      const nextPage = currentPage + 1;
      queryClient.prefetchQuery({
        queryKey: ["quotations", debouncedSearchTerm, nextPage],
        queryFn: async () => {
          const token = Cookies.get("token");
          const params = new URLSearchParams({
            page: nextPage.toString(),
          });
          if (debouncedSearchTerm) {
            params.append("search", debouncedSearchTerm);
          }
          const response = await axios.get(`${BASE_URL}/api/quotation?${params}`, {
            headers: { 
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json"
            },
          });
          return response.data.data;
        },
        staleTime: 5 * 60 * 1000,
      });
    }

    if (currentPage > 1) {
      const prevPage = currentPage - 1;
      if (!queryClient.getQueryData(["quotations", debouncedSearchTerm, prevPage])) {
        queryClient.prefetchQuery({
          queryKey: ["quotations", debouncedSearchTerm, prevPage],
          queryFn: async () => {
            const token = Cookies.get("token");
            const params = new URLSearchParams({
              page: prevPage.toString(),
            });
            if (debouncedSearchTerm) {
              params.append("search", debouncedSearchTerm);
            }
            const response = await axios.get(`${BASE_URL}/api/quotation?${params}`, {
              headers: { 
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json"
              },
            });
            return response.data.data;
          },
          staleTime: 5 * 60 * 1000,
        });
      }
    }
  }, [pagination.pageIndex, debouncedSearchTerm, queryClient, quotationsData?.last_page]);

  const toggleQuotationStatus = async (quotationId, currentStatus) => {
    if (!userType || userType === '4') return;
    setUpdatingStatus(prev => ({ ...prev, [quotationId]: true }));
    try {
      const token = Cookies.get("token");
      const newStatus = currentStatus === "Pending" ? "Confirmed" : "Pending";
      const response = await axios.patch(`${BASE_URL}/api/quotations/${quotationId}/status`, {
        quotation_status: newStatus
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (response.data.code === 201) {
        await queryClient.invalidateQueries(["quotations"]);
        toast({
          title: "Success",
          description: `Quotation status changed to ${newStatus}`,
          duration: 3000,
        });
      } else {
        throw new Error(response.data.message || "Failed to update status");
      }
    } catch (error) {
      console.error("Error updating quotation status:", error);
      toast({
        title: "Error",
        description: "Failed to update quotation status",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [quotationId]: false }));
    }
  };

  const handleDeleteQuotation = async () => {
    if (!deleteDialog.id) return;
    try {
      const token = Cookies.get("token");
      const response = await axios.delete(`${BASE_URL}/api/quotation/${deleteDialog.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (response.data.code === 201) {
        await queryClient.invalidateQueries(["quotations"]);
        toast({
          title: "Success",
          description: "Quotation deleted successfully",
          duration: 3000,
        });
      } else {
        throw new Error(response.data.message || "Failed to delete quotation");
      }
    } catch (error) {
      console.error("Error deleting quotation:", error);
      toast({
        title: "Error",
        description: "Failed to delete quotation",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setDeleteDialog({ open: false, id: null, quotationNo: "" });
    }
  };

  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [rowSelection, setRowSelection] = useState({});

  const columns = [
    {
        accessorKey: "quotation_no",
        id: "Quot. No",
        header: "Quot. No",
        cell: ({ row }) => <div className="text-xs font-medium">{row.getValue("Quot. No")}</div>,
        size: 50,
      },
    {
      accessorKey: "quotation_ref",
      id: "Quotation Ref",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="px-2 h-8 text-xs"
        >
          Quotation Ref
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => <div className="text-[13px] font-medium">{row.getValue("Quotation Ref")}</div>,
      size: 120,
    },
    
    {
      id: "Buyer",
      header: "Buyer",
      cell: ({ row }) => <div className="text-xs">{row.original.buyer_name || '-'}</div>,
      size: 120,
    },
    {
      accessorKey: "quotation_date",
      id: "Date",
      header: "Date",
      cell: ({ row }) => <div className="text-xs">{row.getValue("Date")}</div>,
      size: 100,
    },
    {
      accessorKey: "quotation_valid_date",
      id: "Valid Until",
      header: "Valid Until",
      cell: ({ row }) => <div className="text-xs">{row.getValue("Valid Until")}</div>,
      size: 100,
    },
    {
      accessorKey: "total_amount",
      id: "Total Amount",
      header: "Total Amount",
      cell: ({ row }) => <div className="text-xs font-medium">₹{parseFloat(row.getValue("Total Amount")).toFixed(2)}</div>,
      size: 100,
    },
    {
      accessorKey: "quotation_status",
      id: "Status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("Status");
        const quotationId = row.original.id;
        const isUpdating = updatingStatus[quotationId];
        const statusColor = status === "Confirmed" ? "text-green-600" : status === "Pending" ? "text-amber-600" : "text-red-600";
        
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => toggleQuotationStatus(quotationId, status)}
                  disabled={isUpdating || userType === '4'}
                  className={`text-xs font-medium ${statusColor} ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80 cursor-pointer'} transition-opacity`}
                >
                  {isUpdating ? (
                    <span className="flex items-center">
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Updating...
                    </span>
                  ) : (
                    status
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{userType === '4' ? 'Cannot change status' : `Click to change status`}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      },
      size: 100,
    },
    {
      id: "actions",
      header: "Action",
      cell: ({ row }) => {
        const id = row.original.id;
        const quotationNo = row.original.quotation_ref;
        const isDeleting = updatingStatus[`delete_${id}`];

        return (
          <div className="flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/quotation/edit/${id}`)}
                    className="h-7 w-7 p-0 text-blue-600 hover:text-blue-800"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>View Details</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/quotation/view/${id}`)}
                    className="h-7 w-7 p-0 text-blue-600 hover:text-blue-800"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>View Details</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            {userType !== '4' && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteDialog({ open: true, id, quotationNo })}
                      className="h-7 w-7 p-0 text-red-600 hover:text-red-800"
                      disabled={isDeleting}
                    >
                      {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Delete Quotation</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        );
      },
      size: 100,
    },
  ];

  const table = useReactTable({
    data: quotationsData?.data || [],
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    manualPagination: true,
    pageCount: quotationsData?.last_page || -1,
    onPaginationChange: setPagination,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  const handlePageChange = (newPageIndex) => {
    const targetPage = newPageIndex + 1;
    const cachedData = queryClient.getQueryData(["quotations", debouncedSearchTerm, targetPage]);
    if (cachedData) {
      setPagination(prev => ({ ...prev, pageIndex: newPageIndex }));
    } else {
      table.setPageIndex(newPageIndex);
    }
  };

  const handlePageInput = (e) => {
    const value = e.target.value;
    setPageInput(value);
    if (value && !isNaN(value)) {
      const pageNum = parseInt(value);
      if (pageNum >= 1 && pageNum <= table.getPageCount()) {
        handlePageChange(pageNum - 1);
      }
    }
  };

  const generatePageButtons = () => {
    const currentPage = pagination.pageIndex + 1;
    const totalPages = table.getPageCount();
    const buttons = [];
    if (totalPages === 0) return buttons;
    
    buttons.push(
      <Button
        key={1}
        variant={currentPage === 1 ? "default" : "outline"}
        size="sm"
        onClick={() => handlePageChange(0)}
        className="h-8 w-8 p-0 text-xs"
      >
        1
      </Button>
    );

    if (currentPage > 3) {
      buttons.push(<span key="ellipsis1" className="px-2">...</span>);
    }

    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      if (i !== 1 && i !== totalPages) {
        buttons.push(
          <Button
            key={i}
            variant={currentPage === i ? "default" : "outline"}
            size="sm"
            onClick={() => handlePageChange(i - 1)}
            className="h-8 w-8 p-0 text-xs"
          >
            {i}
          </Button>
        );
      }
    }

    if (currentPage < totalPages - 2) {
      buttons.push(<span key="ellipsis2" className="px-2">...</span>);
    }

    if (totalPages > 1) {
      buttons.push(
        <Button
          key={totalPages}
          variant={currentPage === totalPages ? "default" : "outline"}
          size="sm"
          onClick={() => handlePageChange(totalPages - 1)}
          className="h-8 w-8 p-0 text-xs"
        >
          {totalPages}
        </Button>
      );
    }
    return buttons;
  };

  const filteredItems = quotationsData?.data?.filter((item) =>
    item.quotation_ref?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.quotation_no?.toString().includes(searchTerm) ||
    item.buyer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.total_amount?.toString().includes(searchTerm)
  ) || [];

  const TableShimmer = () => {
    return Array.from({ length: 10 }).map((_, index) => (
      <TableRow key={index} className="animate-pulse h-11">
        {table.getVisibleFlatColumns().map((column) => (
          <TableCell key={column.id} className="py-1">
            <div className="h-8 bg-gray-200 rounded w-full"></div>
          </TableCell>
        ))}
      </TableRow>
    ));
  };

  if (isError) {
    return (
      <div className="w-full p-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-destructive font-medium mb-2">
              Error Fetching Quotations List Data
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
    <div className="w-full grid grid-cols-1">
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog(prev => ({ ...prev, open }))}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-semibold">Delete Quotation</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-gray-600">
              Are you sure you want to delete quotation <span className="font-medium">{deleteDialog.quotationNo}</span>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-row sm:flex-row gap-2 sm:justify-end">
            <AlertDialogCancel className="mt-0 h-9">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteQuotation} className="h-9 bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="sm:hidden">
        <div className="flex justify-between items-center mb-1">
          <h1 className="text-xl md:text-2xl text-gray-800 font-medium">
            Quotation List
          </h1>
          <Link to="/quotation/create">
            <Button size="sm" className="h-9 bg-blue-600 hover:bg-blue-700">
              <SquarePlus className="h-4 w-4 mr-2" />
               New
            </Button>
          </Link>
        </div>

        <div className="flex flex-col md:flex-row md:items-center pb-2 gap-2">
          <div className="relative w-full md:w-72">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search quotation..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="pl-8 bg-gray-50 border-gray-200 focus:border-gray-300 focus:ring-gray-200 w-full"
            />
          </div>
        </div>

        <div className="space-y-3">
          {isFetching ? (
            Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="animate-pulse bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))
          ) : filteredItems.length > 0 ? (
            filteredItems.map((item, index) => (
              <div key={item.id} className="relative bg-white rounded-lg shadow-sm border-l-4 border-r border-b border-t border-blue-500 overflow-hidden">
                <div className="p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="bg-gray-100 text-gray-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium">
                        {(pagination.pageIndex * pagination.pageSize) + index + 1}
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm text-gray-800">{item.buyer_name}</h3>
                        {/* <p className="text-xs text-gray-500">#{item.quotation_no}</p> */}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => toggleQuotationStatus(item.id, item.quotation_status)}
                        disabled={updatingStatus[item.id] || userType === '4'}
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.quotation_status === "Confirmed" ? "bg-green-100 text-green-800" :
                          item.quotation_status === "Pending" ? "bg-amber-100 text-amber-800" :
                          "bg-gray-100 text-gray-800"
                        } ${updatingStatus[item.id] || userType === '4' ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80 cursor-pointer'}`}
                      >
                        {updatingStatus[item.id] ? (
                          <span className="flex items-center">
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            Updating...
                          </span>
                        ) : (
                          item.quotation_status
                        )}
                      </button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteDialog({ open: true, id: item.id, quotationNo: item.quotation_ref })}
                        disabled={updatingStatus[`delete_${item.id}`]}
                        className="h-7 w-7 p-0 text-red-600"
                      >
                        {updatingStatus[`delete_${item.id}`] ? 
                          <Loader2 className="h-4 w-4 animate-spin" /> : 
                          <Trash2 className="h-4 w-4" />
                        }
                      </Button>

                      <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/quotation/view/${item.id}`)}
                      className="h-7 w-7 text-blue-600 hover:text-blue-800"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      
                    </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <div className="flex flex-col gap-1">
                      
                      <div className="grid grid-cols-3 gap-2">
                      
                        <div className="flex items-start gap-2">
                        
                          <div className="flex flex-col">
                            {/* <span className="font-medium text-gray-600 text-xs">Ref</span> */}
                            <span className="text-gray-800 text-xs">{item.quotation_ref || '-'}</span>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                        
                          <div className="flex flex-col">
                            {/* <span className="font-medium text-gray-600 text-xs">Date</span> */}
                            <span className="text-gray-800 text-xs">{item.quotation_date || '-'}</span>
                          </div>
                        </div>


<div className="flex items-start gap-2">
                        
                        <div className="flex flex-col">
                          {/* <span className="font-medium text-gray-600 text-xs">Amount</span> */}
                          <span className="text-gray-800 text-xs">₹{parseFloat(item.total_amount).toFixed(2)}</span>
                        </div>
                        
                      </div>
                      
                   
                      </div>
                    </div>
                  </div>
                 

                  {/* <div className="flex justify-end pt-2 border-t border-gray-100">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/quotation/view/${item.id}`)}
                      className="h-8 text-blue-600 hover:text-blue-800"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Details
                    </Button>
                  </div> */}
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 text-center text-gray-500">
              {searchTerm ? `No quotations found for "${searchTerm}"` : "No quotations found."}
            </div>
          )}
        </div>

        {filteredItems.length > 0 && (
          <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-200">
            <div className="text-sm text-muted-foreground">
              Showing {(pagination.pageIndex * pagination.pageSize) + 1} to{" "}
              {Math.min((pagination.pageIndex * pagination.pageSize) + filteredItems.length, quotationsData?.total || 0)} of{" "}
              {quotationsData?.total || 0} quotations
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.pageIndex - 1)}
                disabled={!table.getCanPreviousPage()}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.pageIndex + 1)}
                disabled={!table.getCanNextPage()}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="hidden sm:block">
        <div className="flex text-left text-2xl text-gray-800 font-[400]">
          Quotation List
        </div>
        <div className="flex flex-col md:flex-row md:items-center py-4 gap-2">
          <div className="relative w-full md:w-72">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search quotations..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") setSearchTerm("");
              }}
              className="pl-8 h-9 text-sm bg-gray-50 border-gray-200 focus:border-gray-300 focus:ring-gray-200"
            />
          </div>
          <div className="flex flex-col md:flex-row md:ml-auto gap-2 w-full md:w-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9">
                  Columns <ChevronDown className="ml-2 h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="text-xs capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Link to="/quotation/create">
              <Button size="sm" className="h-9 bg-blue-600 hover:bg-blue-700">
                <SquarePlus className="h-4 w-4 mr-2" />
                Create Quotation
              </Button>
            </Link>
          </div>
        </div>

        <div className="rounded-none border min-h-[31rem] grid grid-cols-1">
          <Table className="flex-1">
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead 
                      key={header.id} 
                      className="h-10 px-3 text-sm font-medium bg-gray-50 text-gray-700"
                      style={{ width: header.column.columnDef.size }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            
            <TableBody>
              {isFetching && !table.getRowModel().rows.length ? (
                <TableShimmer />
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="h-2 hover:bg-gray-50"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="px-3 py-1">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow className="h-12">
                  <TableCell colSpan={columns.length} className="h-24 text-center text-sm">
                    {searchTerm ? `No quotations found for "${searchTerm}"` : "No quotations found."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between py-1">
          <div className="text-sm text-muted-foreground">
            Showing {quotationsData?.from || 0} to {quotationsData?.to || 0} of{" "}
            {quotationsData?.total || 0} quotations
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2 bg-gray-50 hover:bg-gray-100 text-gray-700"
              onClick={() => handlePageChange(pagination.pageIndex - 1)}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center space-x-1">
              {generatePageButtons()}
            </div>

            <div className="flex items-center space-x-2 text-sm">
              <span>Go to</span>
              <Input
                type="tel"
                min="1"
                max={table.getPageCount()}
                value={pageInput}
                onChange={handlePageInput}
                onBlur={() => setPageInput("")}
                onKeyDown={keyDown}
                className="w-16 h-8 text-sm"
                placeholder="Page"
              />
              <span>of {table.getPageCount()}</span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.pageIndex + 1)}
              disabled={!table.getCanNextPage()}
              className="h-8 px-2 bg-gray-50 hover:bg-gray-100 text-gray-700"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuotationList;