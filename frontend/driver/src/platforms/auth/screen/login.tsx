/* eslint-disable react-hooks/exhaustive-deps */
import { Button, Divider, Input } from "@/components";
import { useAuth } from "@/services/auth/hooks";
import type { RootState } from "@/services/store";
import { useEffect, useState } from "react";
import logoDark from "@/assets/logo_dark.svg";

import { useSelector } from "react-redux";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

const LoginPage = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const FormState = useSelector((state: RootState) => state.form);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { login, loginResult } = useAuth();

  const redirectTo = params.get("fallback") || "/";

  const doLogin = async () => {
    try {
      await login(username, password);
    } catch (err) {
      // Error handled by hook
    }
  };

  useEffect(() => {
    if (loginResult?.isSuccess) {
      // Check if there's a pending order_id from scan URL
      const pendingOrderId = localStorage.getItem("pending_order_id");
      if (pendingOrderId) {
        // Clear the stored order_id
        localStorage.removeItem("pending_order_id");
        // Redirect to scan page with the order_id
        navigate(`/scan?order_id=${pendingOrderId}`, { replace: true });
      } else {
        navigate(redirectTo, { replace: true });
      }
    }
  }, [loginResult, navigate, redirectTo]);

  return (
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-4'>
      <div className='w-full max-w-md'>
        {/* Logo and Branding */}
        <div className='text-center mb-6'>
          <div className='inline-flex items-center justify-center w-20 h-20 bg-secondary rounded-xl shadow-md mb-4 overflow-hidden p-2'>
            <img
              src={logoDark}
              alt='TMS Logo'
              className='w-full h-full object-contain'
            />
          </div>
          <h1 className='text-xl font-bold text-base-content tracking-tight mb-1'>
            TMS Driver
          </h1>
          <p className='text-slate-500 text-xs font-medium'>
            Sign in to manage your active delivery routes
          </p>
        </div>

        {/* Login Card */}
        <div className='bg-white rounded-2xl shadow-xl p-6 sm:p-8'>
          <Divider />

          <form
            className='space-y-3'
            onSubmit={(e) => {
              e.preventDefault();
              doLogin();
            }}
          >
            <Input
              label='Username'
              placeholder='Enter your username'
              value={username}
              onChange={(e: any) => setUsername(e?.target?.value || "")}
              error={
                typeof FormState?.errors?.identifier === "string"
                  ? FormState.errors?.identifier
                  : undefined
              }
            />

            <Input
              label='Password'
              placeholder='Type your password'
              type='password'
              autoComplete='current-password'
              value={password}
              onChange={(e: any) => setPassword(e?.target?.value || "")}
              error={
                typeof FormState?.errors?.password === "string"
                  ? FormState.errors?.password
                  : undefined
              }
            />

            <Button
              shape='block'
              size='md'
              isLoading={loginResult?.isLoading}
              type='submit'
              className='mt-6'
              variant='primary'
            >
              Sign In
            </Button>
          </form>

          {/* Error Alert */}
          {loginResult?.isError && (
            <div className='mt-4 p-3 bg-red-50 border border-red-200 rounded-lg'>
              <p className='text-sm text-red-600 text-center'>
                Invalid email or password. Please try again.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className='mt-6 text-center'>
          <p className='text-sm text-slate-500'>
            Need help? Contact your fleet administrator
          </p>
          <p className='text-sm text-slate-500 mt-2'>
            New driver?{" "}
            <Link
              to={
                localStorage.getItem("pending_order_id")
                  ? `/auth/signup?fallback=${encodeURIComponent(`/scan?order_id=${localStorage.getItem("pending_order_id")}`)}`
                  : "/auth/signup"
              }
              className='text-primary font-semibold hover:underline'
            >
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
