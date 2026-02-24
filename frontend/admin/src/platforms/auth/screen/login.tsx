/* eslint-disable react-hooks/exhaustive-deps */
import { Button, Divider, Input } from "@/components";
import { useAuth } from "@/services/auth/hooks";
import type { RootState } from "@/services/store";
import { useEffect, useState } from "react";

import { useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";

/**
 * TMS Onward - Login Page
 */
const LoginPage = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const FormState = useSelector((state: RootState) => state.form);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, loginResult } = useAuth();

  const redirectTo = params.get("fallback") || "/a/dashboard"; // default ke dashboard

  const doLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    await login(email, password);
  };

  useEffect(() => {
    if (loginResult.isSuccess) {
      navigate(redirectTo, { replace: true });
    }
  }, [loginResult, navigate, redirectTo]);

  return (
    <div className='mx-auto flex w-full h-full my-8 px-2'>
      <div className='mx-auto w-full lg:w-2/5 h-full flex flex-col justify-center py-15'>
        <div className='text-center mb-8'>
          <h1 className='text-4xl font-bold text-primary mb-2'>TMS Onward</h1>
          <p className='text-lg'>Transportation Management System</p>
        </div>

        <h3 className='text-2xl font-bold mb-2'>Welcome back!</h3>
        <p className='text-base-content/70 mb-6'>
          Sign in to your account to continue
        </p>

        <Divider />

        <form className='space-y-5 mb-3' onSubmit={doLogin}>
          <Input
            label='Email'
            placeholder='your@email.com'
            type='email'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={FormState?.errors?.email as string}
            required
          />

          <Input
            label='Password'
            placeholder='Type your password'
            type='password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={FormState?.errors?.password as string}
            required
          />

          <Button
            shape='block'
            isLoading={loginResult.isLoading}
            type='submit'
            variant='primary'
          >
            Login
          </Button>
        </form>

        <p className='text-center text-sm text-base-content/60 mt-4'>
          Don't have an account?{" "}
          <a href='/auth/register' className='link link-primary'>
            Register your company
          </a>
        </p>
      </div>
    </div>
  );
};
export default LoginPage;
