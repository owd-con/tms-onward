import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "@/services/store";

export function withGuard<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  redirectTo: string
): React.ComponentType<P> {
  const GuardedComponent = (props: P) => {
    const location = useLocation();

    const isLoggedIn = useSelector(
      (state: RootState) => state.auth.authenticated
    );

    const Profile = useSelector((state: RootState) => state.userProfile);

    if (!isLoggedIn) {
      // redirect ke login dengan query param redirect-to
      return (
        <Navigate
          to={`${redirectTo}?fallback=${encodeURIComponent("/a/dashboard")}`}
          replace
        />
      );
    }

    if (location.pathname === "/a/dashboard") {
      if (Profile?.user?.company_id === '00000000-0000-0000-0000-000000000000') {
        return (<Navigate to="/a/management/tenant" replace />);
      }
    }

    return <WrappedComponent {...props} />;
  };

  return GuardedComponent;
}
