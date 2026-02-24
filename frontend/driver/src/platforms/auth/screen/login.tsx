/* eslint-disable react-hooks/exhaustive-deps */
import { Button, Divider, Input } from "@/components";
import { useAuth } from "@/services/auth/hooks";
import type { RootState } from "@/services/store";
import { useEffect, useState } from "react";

import { useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";

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
      navigate(redirectTo, { replace: true });
    }
  }, [loginResult, navigate, redirectTo]);

  return (
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-8'>
      <div className='w-full max-w-md'>
        {/* Logo and Branding */}
        <div className='text-center mb-8'>
          <div className='inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-lg mb-4'>
            <svg
              className='w-12 h-12 text-white'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z'
              />
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v9a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0'
              />
            </svg>
          </div>
          <h1 className='text-3xl font-bold text-slate-900 mb-2'>TMS Driver</h1>
          <p className='text-slate-600 text-base'>
            Sign in to access your deliveries
          </p>
        </div>

        {/* Login Card */}
        <div className='bg-white rounded-2xl shadow-xl p-6 sm:p-8'>
          <Divider className='mb-6' />

          <form
            className='space-y-5'
            onSubmit={(e) => {
              e.preventDefault();
              doLogin();
            }}
          >
            <Input
              label='Email'
              placeholder='your@email.com'
              type='email'
              autoComplete='email'
              value={username}
              onChange={(e: any) => setUsername(e?.target?.value || "")}
              error={FormState.errors?.email}
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
              size='lg'
              isLoading={loginResult?.isLoading}
              type='submit'
              className='mt-6'
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
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
