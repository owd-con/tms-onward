/* eslint-disable react-hooks/exhaustive-deps */
import { Button, Divider, Input, Select } from "@/components";
import { useAuth } from "@/services/auth/hooks";
import type { RootState } from "@/services/store";
import { useEffect, useState } from "react";

import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

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
  const [companyType, setCompanyType] = useState<"3PL" | "Carrier">("3PL");

  // Admin user fields
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");

  const companyTypeOptions = [
    { label: "3PL (Third Party Logistics)", value: "3PL" },
    { label: "Carrier", value: "Carrier" },
  ];

  const doRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation
    if (password !== confirmPassword) {
      return;
    }

    await register(companyName, companyType, userName, email, password, phone);
  };

  useEffect(() => {
    if (registerResult.isSuccess) {
      // Redirect to login page after successful registration
      navigate("/auth/login", { replace: true });
    }
  }, [registerResult.isSuccess]);

  const isFormValid =
    companyName &&
    companyType &&
    userName &&
    email &&
    password &&
    confirmPassword &&
    password === confirmPassword;

  return (
    <div className="mx-auto flex w-full h-full my-8 px-2">
      <div className="mx-auto w-full lg:w-2/5 h-full flex flex-col justify-center py-15">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">TMS Onward</h1>
          <p className="text-lg">Transportation Management System</p>
        </div>

        <h3 className="text-2xl font-bold mb-2">Create your company account</h3>
        <p className="text-base-content/70 mb-6">
          Register your company to start managing logistics operations
        </p>

        <Divider />

        <form
          className="space-y-5 mb-3"
          onSubmit={doRegister}
        >
          {/* Company Information */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-base-content/60 uppercase">
              Company Information
            </h4>

            <Input
              label="Company Name"
              placeholder="Your company name"
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              error={FormState?.errors?.company_name as string}
              required
            />

            <Select
              label="Company Type"
              options={companyTypeOptions}
              value={companyType}
              onChange={(e) => setCompanyType(e.target.value as "3PL" | "Carrier")}
              error={FormState?.errors?.company_type as string}
              required
            />
          </div>

          <Divider />

          {/* Admin User Information */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-base-content/60 uppercase">
              Admin User Information
            </h4>

            <Input
              label="Full Name"
              placeholder="Admin full name"
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              error={FormState?.errors?.user_name as string}
              required
            />

            <Input
              label="Email"
              placeholder="admin@company.com"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={FormState?.errors?.email as string}
              required
            />

            <Input
              label="Phone (Optional)"
              placeholder="08xxxxxxxxxx"
              type="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              error={FormState?.errors?.phone as string}
            />

            <Input
              label="Password"
              placeholder="Create a strong password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={FormState?.errors?.password as string}
              required
            />

            <Input
              label="Confirm Password"
              placeholder="Re-enter your password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={
                password !== confirmPassword
                  ? "Passwords do not match"
                  : (FormState?.errors?.confirm_password as string)
              }
              required
            />
          </div>

          <Button
            shape="block"
            isLoading={registerResult.isLoading}
            type="submit"
            variant="primary"
            disabled={!isFormValid}
          >
            Create Account
          </Button>
        </form>

        <p className="text-center text-sm text-base-content/60 mt-4">
          Already have an account?{" "}
          <a href="/auth/login" className="link link-primary">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
