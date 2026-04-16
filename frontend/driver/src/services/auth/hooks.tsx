import { useDispatch, useSelector } from "react-redux";
import { useFormActions } from "../form/hooks";
import {
  useLoginMutation,
  useSignupDriverMutation,
  useLogoutMutation,
  useLazyGetProfileQuery,
} from "./api";
import { signin, signout } from "./slice";
import type { RootState } from "../store";
import type { User } from "../types";

interface SignupDriverData {
  username: string;
  name: string;
  phone: string;
  password: string;
  confirm_password: string;
}

/**
 * TMS Driver - Authentication Hooks
 *
 * Consolidated auth hook for login, logout, profile, and auth state
 */
export const useAuth = () => {
  const dispatch = useDispatch();
  const { failureWithTimeout } = useFormActions();
  const auth = useSelector((state: RootState) => state.auth);

  const [loginMutation, loginResult] = useLoginMutation();
  const [signupDriverMutation, signupDriverResult] = useSignupDriverMutation();
  const [logoutMutation, logoutResult] = useLogoutMutation();
  const [getProfile, profileResult] = useLazyGetProfileQuery();

  /**
   * Login with identifier and password
   */
  const login = async (identifier: string, password: string) => {
    try {
      const res = await loginMutation({
        identifier,
        password,
        apps: "driver",
      }).unwrap();
      if (res?.data?.access_token) {
        dispatch(signin(res.data));
      }
      return res?.data;
    } catch (err) {
      failureWithTimeout(err);
      throw err;
    }
  };

  /**
   * Register new driver account
   */
  const signupDriver = async (data: SignupDriverData) => {
    try {
      const res = await signupDriverMutation(data).unwrap();
      return res?.data;
    } catch (err) {
      failureWithTimeout(err);
      throw err;
    }
  };

  /**
   * Logout current user
   */
  const logout = async () => {
    try {
      await logoutMutation(undefined).unwrap();
      dispatch(signout());
    } catch (err) {
      dispatch(signout());
      failureWithTimeout(err);
      throw err;
    }
  };

  /**
   * Get current user profile
   */
  const getMe = async () => {
    try {
      const res = await getProfile(undefined).unwrap();
      return res;
    } catch (err) {
      throw err;
    }
  };

  return {
    // Auth state
    isAuthenticated: auth.authenticated,
    session: auth.session,
    user: auth.session?.user as User | undefined,
    accessToken: auth.session?.access_token,

    // Operations
    login,
    signupDriver,
    logout,
    getMe,

    // Results
    loginResult,
    signupDriverResult,
    logoutResult,
    profileResult,
  };
};
