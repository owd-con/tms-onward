import { Button, Divider, Input, RemoteSelect } from "@/components";
import { useAuth } from "@/services/auth/hooks";
import type { RootState } from "@/services/store";
import { companyTypeOptions } from "@/shared/options";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Zap, TrendingUp } from "lucide-react";
import logoDark from "@/assets/logo_dark.svg";
import heroicImage from "@/assets/heroic.png";
import type { SelectOptionValue } from "@/shared/types";

/**
 * TMS Onward - Register Page
 * Company registration with admin user creation
 */
const RegisterPage = () => {
  const navigate = useNavigate();

  const FormState = useSelector((state: RootState) => state.form);
  const { register, registerResult } = useAuth();

  // Company fields
  const [companyName, setCompanyName] = useState("");
  const [companyType, setCompanyType] = useState<SelectOptionValue | null>(
    companyTypeOptions[0],
  );

  // Admin user fields
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");

  const doRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation
    if (password !== confirmPassword) {
      return;
    }

    await register({
      company_name: companyName,
      company_type: companyType?.value || "",
      username,
      name,
      email,
      password,
      confirm_password: confirmPassword,
      phone,
    });
  };

  useEffect(() => {
    if (registerResult.isSuccess) {
      // Redirect to login page after successful registration
      navigate("/auth/login", { replace: true });
    }
  }, [registerResult.isSuccess, navigate]);

  return (
    <div className='flex h-screen w-full bg-white font-sans overflow-hidden'>
      {/* Left side - Hero Senamection (Hidden on mobile) */}
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
              Join TMS Onward today.
            </h2>
            <p className='text-lg opacity-80 leading-relaxed mt-4 max-w-md'>
              Get started with our comprehensive platform to manage your
              transportation business, track your fleet, and scale your
              logistics operations effortlessly.
            </p>
          </div>

          {/* Stats */}
          <div className='grid grid-cols-2 gap-6'>
            <div className='rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md'>
              <Zap className='h-8 w-8 mb-3 text-emerald-300' />
              <div className='font-semibold text-sm mb-1'>Fast Setup</div>
              <div className='text-xs text-emerald-100/70'>
                Get running in minutes
              </div>
            </div>
            <div className='rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md'>
              <TrendingUp className='h-8 w-8 mb-3 text-emerald-300' />
              <div className='font-semibold text-sm mb-1'>Scale Growth</div>
              <div className='text-xs text-emerald-100/70'>
                Grow without limits
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Register Form */}
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
        <div className='w-full max-w-lg mx-auto mt-28'>
          <h1 className='text-3xl font-bold text-gray-900 mb-2'>
            Create Account
          </h1>
          <p className='text-gray-500 mb-8 text-sm'>
            Register your company to start managing logistics
          </p>

          <form className='space-y-6' onSubmit={doRegister}>
            {/* Company Information */}
            <div>
              <h4 className='text-xs font-bold text-gray-500 uppercase tracking-wider mb-3'>
                Company Details
              </h4>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                <div className='space-y-1.5'>
                  <label
                    htmlFor='companyName'
                    className='block text-sm font-medium text-gray-700'
                  >
                    Company Name
                  </label>
                  <Input
                    id='companyName'
                    placeholder='Your company name'
                    type='text'
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    error={FormState?.errors?.company_name as string}
                    required
                    className='h-11 rounded-lg border-gray-200 bg-white px-4 text-sm'
                  />
                </div>

                <div className='space-y-1.5'>
                  <label
                    htmlFor='companyType'
                    className='block text-sm font-medium text-gray-700'
                  >
                    Company Type
                  </label>
                  <RemoteSelect<SelectOptionValue>
                    value={companyType}
                    onChange={(value) => setCompanyType(value)}
                    data={companyTypeOptions}
                    getLabel={(item) => item?.label ?? ""}
                    renderItem={(item) => item?.label}
                    error={FormState?.errors?.company_type as string}
                    required
                    className='h-11 rounded-lg border-gray-200 bg-white'
                  />
                </div>
              </div>
            </div>

            <Divider className='!my-4 opacity-40' />

            {/* Admin User Information */}
            <div>
              <h4 className='text-xs font-bold text-gray-500 uppercase tracking-wider mb-3'>
                Admin Profile
              </h4>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                <div className='space-y-1.5'>
                  <label
                    htmlFor='name'
                    className='block text-sm font-medium text-gray-700'
                  >
                    Full Name
                  </label>
                  <Input
                    id='name'
                    placeholder='John Doe'
                    type='text'
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    error={FormState?.errors?.name as string}
                    required
                    className='h-11 rounded-lg border-gray-200 bg-white px-4 text-sm'
                  />
                </div>

                <div className='space-y-1.5'>
                  <label
                    htmlFor='username'
                    className='block text-sm font-medium text-gray-700'
                  >
                    Username
                  </label>
                  <Input
                    id='username'
                    placeholder='Enter your username'
                    type='text'
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    error={FormState?.errors?.username as string}
                    required
                    className='h-11 rounded-lg border-gray-200 bg-white px-4 text-sm'
                  />
                </div>

                <div className='space-y-1.5'>
                  <label
                    htmlFor='email'
                    className='block text-sm font-medium text-gray-700'
                  >
                    Email Address{" "}
                    <span className='text-gray-400 font-normal'>
                      (Optional)
                    </span>
                  </label>
                  <Input
                    id='email'
                    placeholder='admin@company.com'
                    type='email'
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    error={FormState?.errors?.email as string}
                    required
                    className='h-11 rounded-lg border-gray-200 bg-white px-4 text-sm'
                  />
                </div>

                <div className='space-y-1.5'>
                  <label
                    htmlFor='phone'
                    className='block text-sm font-medium text-gray-700'
                  >
                    Phone Number{" "}
                    <span className='text-gray-400 font-normal'>
                      (Optional)
                    </span>
                  </label>
                  <Input
                    id='phone'
                    placeholder='08xxxxxxxxxx'
                    type='phone'
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    error={FormState?.errors?.phone as string}
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
                    placeholder='Create a strong password'
                    type='password'
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    error={FormState?.errors?.password as string}
                    required
                    className='h-11 rounded-lg border-gray-200 bg-white px-4 text-sm'
                  />
                </div>

                <div className='space-y-1.5'>
                  <label
                    htmlFor='confirmPassword'
                    className='block text-sm font-medium text-gray-700'
                  >
                    Confirm Password
                  </label>
                  <Input
                    id='confirmPassword'
                    placeholder='Re-enter your password'
                    type='password'
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    error={
                      password !== confirmPassword && confirmPassword !== ""
                        ? "Passwords do not match"
                        : (FormState?.errors?.confirm_password as string)
                    }
                    required
                    className='h-11 rounded-lg border-gray-200 bg-white px-4 text-sm'
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <Button
              isLoading={registerResult.isLoading}
              type='submit'
              variant='primary'
              className='w-full h-11 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium shadow-lg shadow-emerald-900/10'
            >
              Register Company
            </Button>

            <div className='relative my-8'>
              <div className='absolute inset-0 flex items-center'>
                <span className='w-full border-t border-gray-200' />
              </div>
              <div className='relative flex justify-center text-xs uppercase'>
                <span className='bg-white px-2 text-gray-500'>
                  Already have an account?
                </span>
              </div>
            </div>

            <Button
              type='button'
              className='w-full h-11 border-gray-100 bg-gray-50 hover:bg-gray-100 text-gray-900 rounded-lg text-sm font-semibold'
              onClick={() => navigate("/auth/login")}
            >
              Sign In
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
