import { useNavigate } from "react-router-dom";
import {
  HiArrowRightOnRectangle,
  HiEnvelope,
  HiPhone,
  HiUser,
} from "react-icons/hi2";
import { Button } from "@/components";
import { Page } from "@/platforms/app/components/page";
import { useAuth } from "@/services/auth/hooks";
import toast from "react-hot-toast";

export const Profile = () => {
  const navigate = useNavigate();
  const { user, logout, logoutResult } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully");
      navigate("/auth/login");
    } catch (err) {
      navigate("/auth/login");
    }
  };

  if (!user) {
    return (
      <Page>
        <Page.Header title='Profile' />
        <Page.Body
          className='flex flex-col overflow-hidden py-4'
          style={{ height: "calc(100vh - 3.5rem - 4rem)" }}
        >
          <div className='px-4 flex items-center justify-center h-full'>
            <p className='text-slate-600'>
              Please log in to view your profile.
            </p>
          </div>
        </Page.Body>
      </Page>
    );
  }

  return (
    <Page>
      <Page.Header title='Profile' />
      <Page.Body
        className='flex flex-col overflow-hidden py-4'
        style={{ height: "calc(100vh - 3.5rem - 4rem)" }}
      >
        <div className='px-4 overflow-y-auto flex-1 min-h-0'>
          {/* User Info Card */}
          <div className='bg-white rounded-xl p-5 shadow-sm border border-slate-200 mb-5'>
            <div className='flex items-center gap-4 mb-5'>
              <div className='w-16 h-16 bg-primary rounded-full flex items-center justify-center flex-shrink-0'>
                <HiUser size={32} className='text-white' />
              </div>
              <div className='flex-1 min-w-0'>
                <h2 className='typo-section-title font-semibold text-content-primary truncate'>
                  {user.name}
                </h2>
                <div className='mt-1'>
                  <span className='inline-block px-2 py-0.5 bg-secondary text-white typo-tiny font-medium rounded-full'>
                    Driver
                  </span>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className='space-y-3'>
              {user.email && (
                <div className='flex items-center gap-3'>
                  <div className='w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0'>
                    <HiEnvelope size={18} className='text-content-tertiary' />
                  </div>
                  <div className='flex-1 min-w-0'>
                    <p className='typo-tiny text-content-secondary'>Email</p>
                    <p className='typo-small font-medium text-content-primary truncate'>
                      {user.email}
                    </p>
                  </div>
                </div>
              )}

              {user.phone && (
                <div className='flex items-center gap-3'>
                  <div className='w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0'>
                    <HiPhone size={18} className='text-content-tertiary' />
                  </div>
                  <div className='flex-1 min-w-0'>
                    <p className='typo-tiny text-content-secondary'>Phone</p>
                    <p className='typo-small font-medium text-content-primary truncate'>
                      {user.phone}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Logout Button */}
          <Button
            variant='error'
            shape='block'
            size='lg'
            className='!bg-red-50 !text-red-600 !border-red-200 hover:!bg-red-100'
            onClick={handleLogout}
            disabled={logoutResult.isLoading}
          >
            <div className='flex items-center justify-center gap-2'>
              {logoutResult.isLoading ? (
                <div className='loading loading-spinner loading-sm' />
              ) : (
                <HiArrowRightOnRectangle size={18} />
              )}
              <span>
                {logoutResult.isLoading ? "Logging Out..." : "Log Out"}
              </span>
            </div>
          </Button>

          {/* Version Info */}
          <div className='mt-6 text-center'>
            <p className='typo-tiny text-content-secondary'>
              TMS Driver App v1.0.0
            </p>
          </div>
        </div>
      </Page.Body>
      <Page.Footer isMenu />
    </Page>
  );
};
