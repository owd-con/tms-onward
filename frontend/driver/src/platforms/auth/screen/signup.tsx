/* eslint-disable react-hooks/exhaustive-deps */
import { Button, Divider, Input } from "@/components";
import { useAuth } from "@/services/auth/hooks";
import type { RootState } from "@/services/store";
import { useEffect, useState } from "react";

import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

const SignupPage = () => {
  const navigate = useNavigate();

  const FormState = useSelector((state: RootState) => state.form);
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { signupDriver, signupDriverResult } = useAuth();

  useEffect(() => {
    if (signupDriverResult?.isSuccess) {
      navigate("/login", { replace: true });
    }
  }, [signupDriverResult]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await signupDriver({
      username,
      name,
      phone,
      password,
      confirm_password: confirmPassword,
    });
  };

  return (
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-4'>
      <div className='w-full max-w-md'>
        {/* Logo and Branding */}
        <div className='text-center mb-3'>
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
          <p className='text-slate-600 text-base'>Create your driver account</p>
        </div>

        {/* Signup Card */}
        <div className='bg-white rounded-2xl shadow-xl p-6 sm:p-8'>
          <Divider />

          <form className='space-y-3' onSubmit={handleSubmit}>
            <Input
              label='Username'
              placeholder='Enter your username'
              value={username}
              onChange={(e: any) => setUsername(e?.target?.value || "")}
              error={
                typeof FormState?.errors?.username === "string"
                  ? FormState.errors?.username
                  : undefined
              }
              required
            />

            <Input
              label='Full Name'
              placeholder='Enter your full name'
              value={name}
              onChange={(e: any) => setName(e?.target?.value || "")}
              error={
                typeof FormState?.errors?.name === "string"
                  ? FormState.errors?.name
                  : undefined
              }
              required
            />

            <Input
              label='Phone Number'
              placeholder='Enter your phone number'
              type='phone'
              value={phone}
              onChange={(e: any) => setPhone(e?.target?.value || "")}
              error={
                typeof FormState?.errors?.phone === "string"
                  ? FormState.errors?.phone
                  : undefined
              }
            />

            <Input
              label='Password'
              placeholder='Create your password'
              type='password'
              autoComplete='new-password'
              value={password}
              onChange={(e: any) => setPassword(e?.target?.value || "")}
              error={
                typeof FormState?.errors?.password === "string"
                  ? FormState.errors?.password
                  : undefined
              }
              required
            />

            <Input
              label='Confirm Password'
              placeholder='Confirm your password'
              type='password'
              autoComplete='new-password'
              value={confirmPassword}
              onChange={(e: any) => setConfirmPassword(e?.target?.value || "")}
              error={
                typeof FormState?.errors?.confirm_password === "string"
                  ? FormState.errors?.confirm_password
                  : undefined
              }
              required
            />

            <Button
              shape='block'
              size='md'
              isLoading={signupDriverResult?.isLoading}
              type='submit'
              className='mt-6'
              variant='primary'
            >
              Sign Up
            </Button>
          </form>

          {/* Error Alert */}
          {signupDriverResult?.isError && (
            <div className='mt-4 p-3 bg-red-50 border border-red-200 rounded-lg'>
              <p className='text-sm text-red-600 text-center'>
                Registration failed. Please try again.
              </p>
            </div>
          )}
        </div>

        {/* Footer - Link to Login */}
        <div className='mt-6 text-center'>
          <p className='text-sm text-slate-500'>
            Already have an account?{" "}
            <button
              type='button'
              onClick={() => navigate("/login")}
              className='text-blue-600 hover:text-blue-700 font-medium'
            >
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
