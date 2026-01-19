import Page from "@/app/dashboard/page";
import DashboardSkeleton from "@/components/skeletonLoader/DashboardSkeleton";
import useAuth from "@/hooks/api/use-auth";
import { Navigate, Outlet } from "react-router-dom";



const ProtectedRoute = () => {
  const { data: authData, isLoading } = useAuth();
  const user = authData?.user;
   

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return user ? (
    <Page>
      <Outlet />
    </Page>
  ) : (
    <Navigate to="/" replace />
  );
};

export default ProtectedRoute;