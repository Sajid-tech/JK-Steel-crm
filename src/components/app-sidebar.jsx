import * as React from "react";
import {
  AudioWaveform,
  
  Command,

  GalleryVerticalEnd,

  LayoutDashboard,  
    FileText,        
    BookOpen,       
    Book,          
    Scale,            
    Box,            
    Mountain,        
    SquareStack,     
    ShoppingCart,    
    Warehouse,
    Frame,
    ShoppingBag,
    Package,
    ReceiptText,  
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { NavMainUser } from "./nav-main-user";
import Cookies from "js-cookie";

export function AppSidebar({ ...props }) {
  const nameL = Cookies.get("name");
  const emailL = Cookies.get("email");

  const initialData = {
    user: {
      name: `${nameL}`,
      email: `${emailL}`,
      avatar: "/avatars/shadcn.jpg",
    },
    teams: [
      {
        name: `JK Steel`,
        logo: GalleryVerticalEnd,
        plan: "",
      },
      {
        name: "Acme Corp.",
        logo: AudioWaveform,
        plan: "Startup",
      },
      {
        name: "Evil Corp.",
        logo: Command,
        plan: "Free",
      },
    ],
    navMain: [
      {
        title: "Dashboard",
        url: "/home",
        icon: Frame,
        isActive: false,
      },
     
     
      {
        title: "Client",
        url: "/client",
        icon: ShoppingBag,
        isActive: false,
      },
      {
        title: "Item",
        url: "/item",
        icon: Package,
        isActive: false,
      },
      {
        title: "Quotation",
        url: "/quotation",
        icon: Package,
        isActive: false,
      },
      {
        title: "Settings",
        url: "/setting",
        icon: Package,
        isActive: false,
      },
      // {
      //   title: "Report",
      //   url: "/report/buyer",
      //   icon: Package,
      //   isActive: false,
      // },
      // {
      //   title: "Report1",
      //   url: "/report/item",
      //   icon: Package,
      //   isActive: false,
      // },
      // {
      //   title: "Report3",
      //   url: "/report/quotation-report",
      //   icon: Package,
      //   isActive: false,
      // },
      // {
      //   title: "Report4",
      //   url: "/report/quotation-detail-report",
      //   icon: Package,
      //   isActive: false,
      // },
      {
        title: "Report",
        url: "#",
        icon: ReceiptText,
        isActive: false,
        items: [
          {
            title: "Buyer",
            url: "/report/buyer",
          },
          {
            title: "Item",
            url: "/report/item",
          },
          {
            title: "Quotation",
            url: "/report/quotation-report",
          },
          // {
          //   title: "Quotation detail",
          //   url: "/report/quotation-detail-report",
          // },
          
        ],
      },
     
    ],
  };
  // const initialData = {
  //   user: {
  //     name: `${nameL}`,
  //     email: `${emailL}`,
  //     avatar: "/avatars/shadcn.jpg",
  //   },
  //   teams: [
  //     {
  //       name: `Jaju Flooring`,
  //       logo: GalleryVerticalEnd,
  //       plan: "",
  //     },
  //     {
  //       name: "Acme Corp.",
  //       logo: AudioWaveform,
  //       plan: "Startup",
  //     },
  //     {
  //       name: "Evil Corp.",
  //       logo: Command,
  //       plan: "Free",
  //     },
  //   ],
  //   navMain: [
  //     {
  //       title: "Dashboard",
  //       url: "/home",
  //       icon: LayoutDashboard,
  //       isActive: false,
  //     },
     
  //     {
  //       title: "Estimate",
  //       url: "/estimate",
  //       icon: FileText,
  //       isActive: false,
  //     },
  //     {
  //       title: "Day Book",
  //       url: "/day-book",
  //       icon: BookOpen,
  //       isActive: false,
  //     },
  //     {
  //       title: "Ledger",
  //       url: "/ledger",
  //       icon: Book,
  //       isActive: false,
  //     },
  //     {
  //       title: "Trial Balance",
  //       url: "/trial-balance",
  //       icon: Scale,
  //       isActive: false,
  //     },
  //     {
  //       title: "Product",
  //       url: "/product",
  //       icon: Box,
  //       isActive: false,
  //     },
  //     {
  //       title: "Purchase Granite",
  //       url: "/purchase-granite",
  //       icon: Mountain,
  //       isActive: false,
  //     },
  //     {
  //       title: "Purchase Tiles",
  //       url: "/purchase-tiles",
  //       icon: SquareStack,
  //       isActive: false,
  //     },
  //     {
  //       title: "Sales",
  //       url: "/sales",
  //       icon: ShoppingCart,
  //       isActive: false,
  //     },
  //     {
  //       title: "Stocks",
  //       url: "/stocks",
  //       icon: Warehouse,
  //       isActive: false,
  //     },
     
  //   ],
  // };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={initialData.teams} />
      </SidebarHeader>
      <SidebarContent className="sidebar-content">
        {/* <NavProjects projects={data.projects} /> */}
        <NavMain items={initialData.navMain} />
        <NavMainUser projects={initialData.userManagement} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={initialData.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}


//changes 