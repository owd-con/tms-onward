import { useDispatch } from "react-redux";
import { useFormActions } from "../form/hooks";
import {
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useChangePasswordMutation,
} from "./api";
import { signin, signout } from "./slice";
import { useProfile } from "../profile";

/**
 * TMS Onward - Authentication Hooks
 */

export const useAuth = () => {
  const dispatch = useDispatch();
  const { getMe } = useProfile();
  const { failureWithTimeout } = useFormActions();

  const [loginMutation, loginResult] = useLoginMutation();
  const [registerMutation, registerResult] = useRegisterMutation();
  const [logoutMutation, logoutResult] = useLogoutMutation();
  const [changePasswordMutation, changePasswordResult] =
    useChangePasswordMutation();

  /**
   * Login with identifier and password
   */
  const login = async (payload: any) => {
    try {
      const res = await loginMutation(payload).unwrap();
      if (res?.data?.access_token) {
        // Dispatch signin action with session data
        dispatch(
          signin({
            access_token: res.data.access_token,
            user: res.data.user,
          }),
        );
        // Fetch full user profile
        getMe();
      }
    } catch (err) {
      failureWithTimeout(err);
    }
  };

  /**
   * Register new company & admin user
   * Backend expects flat structure:
   * { company_name, company_type, name, email, password, confirm_password, phone, currency, language }
   * After successful registration, user should login manually.
   */
  const register = async (payload: any) => {
    try {
      await registerMutation(payload).unwrap();
      // No auto-login - user will be redirected to login page by RegisterPage
    } catch (err) {
      failureWithTimeout(err);
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
      // Even if API call fails, clear local auth state
      dispatch(signout());
    }
  };

  /**
   * Change password for current user
   */
  const changePassword = async (payload: any) => {
    try {
      await changePasswordMutation(payload).unwrap();
    } catch (err) {
      failureWithTimeout(err);
      throw err; // Re-throw to allow caller to handle
    }
  };

  return {
    login,
    register,
    logout,
    changePassword,
    loginResult,
    registerResult,
    logoutResult,
    changePasswordResult,
  };
};
