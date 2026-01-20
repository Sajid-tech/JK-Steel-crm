import {   Route, Routes } from "react-router-dom";



import AuthRoute from "./AuthRoute";
import Login from "@/app/auth/Login";
import ForgotPassword from "@/components/ForgotPassword/ForgotPassword";
import Maintenance from "@/components/common/Maintenance";
import ProtectedRoute from "./ProtectedRoute";

import NotFound from "@/app/errors/NotFound";
import Home from "@/app/home/Home";

import ClientList from "@/app/client/client-list";

import ItemList from "@/app/item/item-list";
import QuotationList from "@/app/quotation/quotation-list";
import CreateQuotation from "@/app/quotation/create-quotation";
import EditQuotation from "@/app/quotation/edit-quotation";
import Setting from "@/app/setting/setting";
import BuyerReport from "@/app/report/buyer/buyer-report";
import ItemReport from "@/app/report/item/item-report";
import QuotationReport from "@/app/report/quotation/quotation-report";
import QuotationDetails from "@/app/report/quotation-detail/quotation-detail";
import ViewQuotation from "@/app/quotation/view-quotation";

function AppRoutes() {
  return (

      <Routes>
        <Route path="/" element={<AuthRoute />}>
          <Route path="/" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/maintenance" element={<Maintenance />} />
        </Route>

        <Route path="/" element={<ProtectedRoute />}>
          <Route path="/home" element={<Home />} />
          <Route path="/client" element={<ClientList />} />
          <Route path="/item" element={<ItemList />} />
          <Route path="/quotation" element={<QuotationList />} />
          <Route path="/quotation/create" element={<CreateQuotation />} />
          <Route path="/quotation/edit/:id" element={<EditQuotation />} />
          <Route path="/quotation/view/:id" element={<ViewQuotation />} />
          <Route path="/setting" element={<Setting />} />
          <Route path="/report/buyer" element={<BuyerReport />} />
          <Route path="/report/item" element={<ItemReport />} />
          <Route path="/report/quotation-report" element={<QuotationReport />} />
          <Route path="/report/quotation-detail-report" element={<QuotationDetails />} />
    
   

         
         
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    
  );
}

export default AppRoutes;