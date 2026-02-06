import React from "react";
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "@/services/store";

export function withGuard<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  redirectTo: string
): React.ComponentType<P> {
  const GuardedComponent = (props: P) => {
    const isLoggedIn = useSelector(
      (state: RootState) => state.auth.authenticated
    );

    if (!isLoggedIn) {
      // redirect ke login dengan query param redirect-to
      return (
        <Navigate
          to={`${redirectTo}?fallback=${encodeURIComponent("/a/")}`}
          replace
        />
      );
    }

    return <WrappedComponent {...props} />;
  };

  return GuardedComponent;
}
