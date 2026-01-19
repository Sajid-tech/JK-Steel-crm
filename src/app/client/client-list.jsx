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
import BASE_URL from "@/config/BaseUrl";
import { ButtonConfig } from "@/config/ButtonConfig";
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
import { ArrowUpDown, ChevronDown, ChevronLeft, ChevronRight, Edit, Eye, Search, SquarePlus, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import CreateClient from "./create-client";
import EditClient from "./edit-client";
import { useToast } from "@/hooks/use-toast";

const ClientList = () => {
  const userType = Cookies.get('user_type_id');
  const queryClient = useQueryClient();
  const keyDown = useNumericInput();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [previousSearchTerm, setPreviousSearchTerm] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState({}); 
  const { toast } = useToast();
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const [pageInput, setPageInput] = useState("");

  useEffect(() => {
    const savedPage = Cookies.get("clientReturnPage");
    if (savedPage) {
      Cookies.remove("clientReturnPage");

      setTimeout(() => {
        const pageIndex = parseInt(savedPage) - 1;
        if (pageIndex >= 0) {
          setPagination(prev => ({ ...prev, pageIndex }));
          setPageInput(savedPage);
          queryClient.invalidateQueries({
            queryKey: ["clients"],
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

    return () => {
      clearTimeout(timerId);
    };
  }, [searchTerm, previousSearchTerm]);

  const {
    data: clientsData,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["clients", debouncedSearchTerm, pagination.pageIndex + 1],
    queryFn: async () => {
      const token = Cookies.get("token");
      const params = new URLSearchParams({
        page: (pagination.pageIndex + 1).toString(),
      });
      
      if (debouncedSearchTerm) {
        params.append("search", debouncedSearchTerm);
      }

      const response = await axios.get(
        `${BASE_URL}/api/buyer?${params}`,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
        }
      );
      return response.data.data;
    },
    keepPreviousData: true,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    const currentPage = pagination.pageIndex + 1;
    const totalPages = clientsData?.last_page || 1;
    
    if (currentPage < totalPages) {
      const nextPage = currentPage + 1;
      queryClient.prefetchQuery({
        queryKey: ["clients", debouncedSearchTerm, nextPage],
        queryFn: async () => {
          const token = Cookies.get("token");
          const params = new URLSearchParams({
            page: nextPage.toString(),
          });
          
          if (debouncedSearchTerm) {
            params.append("search", debouncedSearchTerm);
          }

          const response = await axios.get(
            `${BASE_URL}/api/buyer?${params}`,
            {
              headers: { 
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json"
              },
            }
          );
          return response.data.data;
        },
        staleTime: 5 * 60 * 1000,
      });
    }

    if (currentPage > 1) {
      const prevPage = currentPage - 1;
    
      if (!queryClient.getQueryData(["clients", debouncedSearchTerm, prevPage])) {
        queryClient.prefetchQuery({
          queryKey: ["clients", debouncedSearchTerm, prevPage],
          queryFn: async () => {
            const token = Cookies.get("token");
            const params = new URLSearchParams({
              page: prevPage.toString(),
            });
            
            if (debouncedSearchTerm) {
              params.append("search", debouncedSearchTerm);
            }

            const response = await axios.get(
              `${BASE_URL}/api/buyer?${params}`,
              {
                headers: { 
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json"
                },
              }
            );
            return response.data.data;
          },
          staleTime: 5 * 60 * 1000,
        });
      }
    }
  }, [pagination.pageIndex, debouncedSearchTerm, queryClient, clientsData?.last_page]);

  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [rowSelection, setRowSelection] = useState({});


  const toggleClientStatus = async (clientId, currentStatus) => {
    if (!userType || userType === '4') {
   
      return;
    }

    setUpdatingStatus(prev => ({ ...prev, [clientId]: true }));

    try {
      const token = Cookies.get("token");
      const newStatus = currentStatus === "Active" ? "Inactive" : "Active";
      const payload = {
        buyer_status: newStatus
      };

      const response = await axios.patch(
        `${BASE_URL}/api/buyers/${clientId}/status`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if ( response.data.code === 201) {
       
        await queryClient.invalidateQueries(["clients"]);
        
     
      
        toast({
          title: "Success",
          description: `Client status changed to ${newStatus}`,
          duration: 3000,
        });
      } else {
        throw new Error(response.data.message || "Failed to update status");
      }
    } catch (error) {
      console.error("Error updating client status:", error);
      
      // Show error toast
      // toast({
      //   title: "Error",
      //   description: "Failed to update client status",
      //   variant: "destructive",
      //   duration: 5000,
      // });
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [clientId]: false }));
    }
  };

  const columns = [
    {
      id: "S. No.",
      header: "S. No.",
      cell: ({ row }) => {
        const globalIndex = (pagination.pageIndex * pagination.pageSize) + row.index + 1;
        return <div className="text-xs font-medium">{globalIndex}</div>;
      },
      size: 60,
    },
    {
      accessorKey: "buyer_name",
      id: "Client Name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="px-2 h-8 text-xs"
        >
          Client Name
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => <div className="text-[13px] font-medium">{row.getValue("Client Name")}</div>,
      size: 150,
    },
    {
      accessorKey: "buyer_contact_name",
      id: "Contact Person", 
      header: "Contact Person",
      cell: ({ row }) => <div className="text-xs font-medium">{row.getValue("Contact Person") || '-'}</div>,
      size: 120,
    },
    {
      id: "Contact Info",
      header: "Contact Info",
      cell: ({ row }) => (
        <div className="space-y-1">
          <div className="text-xs">
            <span className="font-medium">Phone:</span> {row.original.buyer_mobile}
          </div>
          <div className="text-xs text-blue-600">
            {row.original.buyer_email}
          </div>
        </div>
      ),
      size: 150,
    },
    {
      accessorKey: "buyer_gst_vat",
      id: "GST/VAT",
      header: "GST/VAT",
      cell: ({ row }) => <div className="text-xs">{row.getValue("GST/VAT") || '-'}</div>,
      size: 100,
    },
    {
      accessorKey: "buyer_status",
      id: "Status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("Status");
        const clientId = row.original.id;
        const isUpdating = updatingStatus[clientId];
        const statusColor = status === "Active" ? "text-green-600" : "text-red-600";
        
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => toggleClientStatus(clientId, status)}
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
                <p>{userType === '4' ? 'Cannot change status' : `Click to change to ${status === "Active" ? "Inactive" : "Active"}`}</p>
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

        return (
          <div className="flex flex-row">
            {userType !== '4' && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <EditClient clientId={id}/>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Edit Client</p>
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
    data: clientsData?.data || [],
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
    pageCount: clientsData?.last_page || -1,
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
    const cachedData = queryClient.getQueryData(["clients", debouncedSearchTerm, targetPage]);
    
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

  const filteredItems = clientsData?.data?.filter((item) =>
    item.buyer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.buyer_contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.buyer_mobile?.includes(searchTerm) ||
    item.buyer_email?.toLowerCase().includes(searchTerm.toLowerCase())
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
              Error Fetching Clients List Data
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
      {/* Mobile View */}
      <div className="sm:hidden">
        <div className="flex justify-between items-center mb-1">
          <h1 className="text-xl md:text-2xl text-gray-800 font-medium">
            Client List
          </h1>
          <div>
            {userType !== '4' && (
              <CreateClient/>
            )}
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center pb-2 gap-2">
          <div className="relative w-full md:w-72">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search client..."
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
              <div
                key={item.id}
                className="relative bg-white rounded-lg shadow-sm border-l-4 border-r border-b border-t border-blue-500 overflow-hidden"
              >
                <div className="p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="bg-gray-100 text-gray-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium">
                        {(pagination.pageIndex * pagination.pageSize) + index + 1}
                      </div>
                      <h3 className="font-medium flex flex-col text-sm text-gray-800">
                        <span className="font-semibold">{item.buyer_name}</span>
                        <span className="text-xs text-gray-500">{item.buyer_contact_name || 'No contact person'}</span>
                      </h3>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <button
                        onClick={() => toggleClientStatus(item.id, item.buyer_status)}
                        disabled={updatingStatus[item.id] || userType === '4'}
                        className={`px-2 py-1 rounded-full text-xs font-medium ${item.buyer_status === "Active"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                          } ${updatingStatus[item.id] || userType === '4' ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80 cursor-pointer'}`}
                      >
                        {updatingStatus[item.id] ? (
                          <span className="flex items-center">
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            Updating...
                          </span>
                        ) : (
                          item.buyer_status
                        )}
                      </button>
                      {userType !== '4' && (
                        <EditClient clientId={item?.id}/>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <div className="flex flex-row items-center justify-between">
                      <div className="flex items-start gap-2">
                        <span className="font-medium text-gray-600 min-w-[60px]">Phone:</span>
                        <span className="text-gray-800">{item.buyer_mobile || '-'}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="font-medium text-gray-600 min-w-[60px]">GST/VAT:</span>
                        <span className="text-gray-800">{item.buyer_gst_vat || '-'}</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-medium text-gray-600 min-w-[60px]">Email:</span>
                      <span className="text-blue-600 truncate">{item.buyer_email || '-'}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 text-center text-gray-500">
              {searchTerm ? `No clients found for "${searchTerm}"` : "No clients found."}
            </div>
          )}
        </div>

        {filteredItems.length > 0 && (
          <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-200">
            <div className="text-sm text-muted-foreground">
              Showing {(pagination.pageIndex * pagination.pageSize) + 1} to{" "}
              {Math.min((pagination.pageIndex * pagination.pageSize) + filteredItems.length, clientsData?.total || 0)} of{" "}
              {clientsData?.total || 0} clients
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

      {/* Desktop View */}
      <div className="hidden sm:block">
        <div className="flex text-left text-2xl text-gray-800 font-[400]">
          Client List
        </div>
        <div className="flex flex-col md:flex-row md:items-center py-4 gap-2">
          <div className="relative w-full md:w-72">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setSearchTerm("");
                }
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
            {userType !== '4' && (
              <CreateClient/>
            )}
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
                      className={`h-10 px-3 text-sm font-medium ${ButtonConfig.tableHeader} ${ButtonConfig.tableLabel}`}
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
                    {searchTerm ? `No clients found for "${searchTerm}"` : "No clients found."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between py-1">
          <div className="text-sm text-muted-foreground">
            Showing {clientsData?.from || 0} to {clientsData?.to || 0} of{" "}
            {clientsData?.total || 0} clients
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              className={`h-8 px-2 ${ButtonConfig.backgroundColor} ${ButtonConfig.hoverBackgroundColor} ${ButtonConfig.textColor}`}
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
              className={`h-8 px-2 ${ButtonConfig.backgroundColor} ${ButtonConfig.hoverBackgroundColor} ${ButtonConfig.textColor}`}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientList;