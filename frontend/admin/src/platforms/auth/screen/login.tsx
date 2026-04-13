import { Button, Input } from "@/components";
import { useAuth } from "@/services/auth/hooks";
import type { RootState } from "@/services/store";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Truck, Package } from "lucide-react";
import logoDark from "@/assets/logo_dark.svg";
import heroicImage from "@/assets/heroic.png";
import { getTMSTokenFromSSO } from "@/services/auth/cookieUtils";
import { useDispatch } from "react-redux";
import { signin } from "@/services/auth/slice";
import { extractUserFromToken } from "@/services/auth/jwtUtils";

/**
 * TMS Onward - Login Page
 * Supports SSO login via auth_session cookie from Onward Connect
 */
const LoginPage = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const dispatch = useDispatch();

  const FormState = useSelector((state: RootState) => state.form);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [checkingSSO, setCheckingSSO] = useState(true);
  const { login, loginResult } = useAuth();

  const redirectTo = params.get("fallback") || "/a/dashboard";

  // Check for SSO cookie on mount - auto-login if TMS token exists
  // Extract user from JWT token (user is embedded in token, not in cookie)
  useEffect(() => {
    const ssoToken = getTMSTokenFromSSO();
    if (ssoToken) {
      const user = extractUserFromToken(ssoToken);
      if (user) {
        // Direct signin with SSO token and extracted user - no API call needed
        dispatch(signin({
          access_token: ssoToken,
          user: user,
        }));
        navigate(redirectTo, { replace: true });
        return;
      }
    }
    setCheckingSSO(false);
  }, [dispatch, navigate, redirectTo]);

  const doLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(username, password);
  };

  useEffect(() => {
    if (loginResult.isSuccess) {
      navigate(redirectTo, { replace: true });
    }
  }, [loginResult, navigate, redirectTo]);

  return (
    <div className='flex h-screen w-full bg-white font-sans overflow-hidden'>
      {/* Left side - Login Form */}
      <div className='flex w-full flex-col px-8 sm:px-12 lg:w-1/2 xl:px-20 2xl:px-32 py-12 overflow-y-auto relative'>
        {/* Logo */}
        <div className='absolute top-12 left-8 sm:left-12 lg:left-20'>
          <a href='/' className='flex items-center gap-3'>
            <div
              className='p-1.5 rounded-lg'
              style={{ backgroundColor: "oklch(59.6% .1274 163.23)" }}
            >
              <img src={logoDark} alt='Logo' className='h-6 w-6' />
            </div>
            <div className='flex flex-col leading-none'>
              <span className='text-xl tracking-wide font-normal mb-[1px] text-emerald-950'>
                ONWARD
              </span>
            </div>
          </a>
        </div>

        {/* Main Content */}
        <div className="w-full max-w-sm mx-auto mt-28">
          {/* Show loading while checking SSO */}
          {checkingSSO ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-emerald-200 border-t-emerald-600 mb-4"></div>
              <p className="text-gray-500 text-sm">Checking your session...</p>
            </div>
          ) : (
            <>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome Back
              </h1>
              <p className="text-gray-500 mb-8 text-sm">
                Please enter your details to access your dashboard
              </p>

              <form className="space-y-5" onSubmit={doLogin}>
            <div className="space-y-1.5">
              <label
                htmlFor='username'
                className='block text-sm font-medium text-gray-700'
              >
                Username
              </label>
              <Input
                id='identifier'
                placeholder='Enter your username'
                type='text'
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                error={FormState?.errors?.identifier as string}
                required
                className='h-11 rounded-lg border-gray-200 bg-white px-4 text-sm'
              />
            </div>

            <div className='space-y-1.5'>
              <label
                htmlFor='password'
                className='block text-sm font-medium text-gray-700'
              >
                Password
              </label>
              <Input
                id='password'
                placeholder='••••••••'
                type='password'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={FormState?.errors?.password as string}
                required
                className='h-11 rounded-lg border-gray-200 bg-white px-4 text-sm'
              />
            </div>

            <Button
              type='submit'
              isLoading={loginResult.isLoading}
              className='w-full h-11 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium shadow-lg shadow-emerald-900/10'
            >
              Login
            </Button>
          </form>

          <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">
                  Don't have an account?
                </span>
              </div>
            </div>
            <Button
              type="button"
              className="w-full h-11 border-gray-100 bg-gray-50 hover:bg-gray-100 text-gray-900 rounded-lg text-sm font-semibold"
              onClick={() => navigate("/auth/register")}
            >
              Create Free Account
            </Button>
            </>
          )}
        </div>
      </div>

      {/* Right side - Hero Section (Hidden on mobile) */}
      <div className='hidden lg:flex lg:w-1/2 relative bg-emerald-950 overflow-hidden'>
        <div className='absolute inset-0'>
          <img
            src={heroicImage}
            alt='Background'
            className='h-full w-full object-cover opacity-60 mix-blend-overlay'
          />
          <div className='absolute inset-0 bg-gradient-to-t from-emerald-950 via-emerald-950/60 to-emerald-900/40' />
        </div>

        <div className='relative z-10 flex h-full flex-col justify-between p-16 xl:p-24 text-white'>
          {/* Badge */}
          <div className='mt-12'>
            <div className='inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 backdrop-blur-md'>
              <span className='text-xs font-medium tracking-wide'>
                TMS Onward
              </span>
            </div>
            <h2 className='mt-8 max-w-lg text-4xl font-bold leading-tight tracking-tight lg:text-5xl'>
              Streamline your logistics operations.
            </h2>
            <p className='text-lg opacity-80 leading-relaxed mt-4 max-w-md'>
              Manage orders, track trips, and monitor driver performance all in
              one clean, modern dashboard designed for Indonesian 3PL providers.
            </p>
          </div>

          {/* Stats */}
          <div className='grid grid-cols-2 gap-6'>
            <div className='rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md'>
              <Truck className='h-8 w-8 mb-3 text-emerald-300' />
              <div className='font-semibold text-sm mb-1'>Fleet Management</div>
              <div className='text-xs text-emerald-100/70'>
                Track vehicles and drivers efficiently
              </div>
            </div>
            <div className='rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md'>
              <Package className='h-8 w-8 mb-3 text-emerald-300' />
              <div className='font-semibold text-sm mb-1'>Order Tracking</div>
              <div className='text-xs text-emerald-100/70'>
                Real-time status updates
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default LoginPage;
