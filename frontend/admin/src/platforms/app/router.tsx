/* eslint-disable react-hooks/exhaustive-deps */

import {
  LayoutDashboard,
  Users as UsersIcon,
  FileText,
  BarChart3,
  Power,
  MapIcon,
  MapPin,
  PieChart,
  LineChart,
  Users2,
  CarFront,
  Building2,
  UserCircle,
} from "lucide-react";
import clsx from "clsx";
import { useDispatch, useSelector } from "react-redux";
import { Route, Routes, useNavigate, useLocation } from "react-router-dom";

import Logo from "@/assets/logo_light.svg";
import { Avatar, Dropdown, FullPageLoading, Navbar } from "@/components";
import { signout } from "@/services/auth/slice";
import { clearSSOCookies } from "@/services/auth/cookieUtils";
import type { AppDispatch, RootState } from "@/services/store";
import { useEffect, Suspense, useRef, lazy, useState } from "react";
import { useProfile } from "@/services/profile/hooks";

// Import DashboardScreen for default route
const DashboardScreen = lazy(() => import("./screen/dashboard"));

// DOM Logger - disabled by default to reduce console noise
// Uncomment and set ENABLE_DOM_LOGGER=true in .env to enable
// import { debugElement, logElementClasses } from "@/utils/domLogger";

interface RouteConfig<T = unknown> {
  path: string;
  element: React.ComponentType<T>;
  hidden?: string;
}

const pages = import.meta.glob<{ default: RouteConfig[] }>(
  "./**/*_subrouter.tsx",
  { eager: true },
);

const routes: RouteConfig[] = Object.values(pages).flatMap(
  (mod) => mod.default || [],
);

const AppRouter = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();
  const Profile = useSelector((state: RootState) => state.userProfile);

  const { getMe } = useProfile();

  const handleLogout = () => {
    dispatch(signout());
    clearSSOCookies();
    const isLocalhost = window.location.hostname.includes("localhost");
    const redirectUrl = isLocalhost
      ? "http://localhost:5173"
      : "https://connect.onward.co.id";
    window.location.href = redirectUrl;
  };
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);

  const mainRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getMe();
  }, []);

  // Onboarding detection logic
  useEffect(() => {
    // Check if user profile is loaded
    if (Profile?.user) {
      const company = Profile.user.company;
      const needsOnboarding = !company?.onboarding_completed;

      if (needsOnboarding) {
        // Redirect to onboarding wizard (only if not already there)
        if (
          location.pathname !== "/a/onboarding" &&
          location.pathname !== "/a/onboarding/complete"
        ) {
          navigate("/a/onboarding", { replace: true });
        }
      }

      setIsCheckingOnboarding(false);
    }
  }, [Profile, location.pathname, navigate]);

  // Show loading while checking onboarding status
  if (isCheckingOnboarding) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <FullPageLoading />
      </div>
    );
  }

  // Check if user needs onboarding
  const needsOnboarding =
    Profile?.user?.company && !Profile.user.company.onboarding_completed;
  const isOnboardingPage =
    location.pathname === "/a/onboarding" ||
    location.pathname === "/a/onboarding/complete";

  // TMS Onward - Full menu structure (Flattened with Sections)
  const menuOverview = [
    {
      label: "Dashboard",
      onClick: () => navigate("/a/dashboard"),
      active: location.pathname === "/a/dashboard",
      icon: <LayoutDashboard size={18} />,
    },
    {
      isSection: true,
      label: "Operations",
    },
    {
      label: "Orders",
      onClick: () => navigate("/a/orders"),
      active: location.pathname.startsWith("/a/orders"),
      icon: <FileText size={18} />,
    },
    {
      label: "Trips",
      onClick: () => navigate("/a/trips"),
      active: location.pathname.startsWith("/a/trips"),
      icon: <MapIcon size={18} />,
    },
    {
      isSection: true,
      label: "Reports",
    },
    {
      label: "Order Trip",
      onClick: () => navigate("/a/reports/order-trip"),
      active: location.pathname.startsWith("/a/reports/order-trip"),
      icon: <LineChart size={18} />,
    },
    {
      label: "Driver Performance",
      onClick: () => navigate("/a/reports/driver-performance"),
      active: location.pathname.startsWith("/a/reports/driver-performance"),
      icon: <PieChart size={18} />,
    },
    // Hide Customer report for inhouse company type
    ...(Profile?.user?.company?.type !== "inhouse"
      ? [
          {
            label: "Customer",
            onClick: () => navigate("/a/reports/customer"),
            active: location.pathname.startsWith("/a/reports/customer"),
            icon: <BarChart3 size={18} />,
          },
        ]
      : []),
    {
      isSection: true,
      label: "Master Data",
    },
    // Hide Customers menu for inhouse company type
    ...(Profile?.user?.company?.type !== "inhouse"
      ? [
          {
            label: "Customers",
            onClick: () => navigate("/a/master-data/customers"),
            active: location.pathname.startsWith("/a/master-data/customers"),
            icon: <Users2 size={18} />,
          },
        ]
      : [
          {
            label: "Lokasi",
            onClick: () => navigate("/a/master-data/addresses"),
            active: location.pathname.startsWith("/a/master-data/addresses"),
            icon: <MapPin size={18} />,
          },
        ]),
    {
      label: "Vehicles",
      onClick: () => navigate("/a/master-data/vehicles"),
      active: location.pathname.startsWith("/a/master-data/vehicles"),
      icon: <CarFront size={18} />,
    },
    {
      label: "Drivers",
      onClick: () => navigate("/a/master-data/drivers"),
      active: location.pathname.startsWith("/a/master-data/drivers"),
      icon: <UserCircle size={18} />,
    },
    {
      isSection: true,
      label: "Management",
    },
    {
      label: "Company",
      onClick: () => navigate("/a/management/company"),
      active: location.pathname.startsWith("/a/management/company"),
      icon: <Building2 size={18} />,
    },
  ];

  // Only show Team menu for admin, not for dispatcher
  if (Profile?.user?.role === "admin") {
    menuOverview.push({
      label: "Team",
      onClick: () => navigate("/a/management/team"),
      active: location.pathname.startsWith("/a/management/team"),
      icon: <UsersIcon size={18} />,
    });
  }

  // Jika onboarding, render tanpa sidebar
  if (needsOnboarding && isOnboardingPage) {
    return (
      <div className='w-full min-h-screen'>
        <Routes>
          {routes.map((r, i) => (
            <Route
              key={i}
              path={r.path}
              element={
                <Suspense fallback={<div>Loading...</div>}>
                  <r.element />
                </Suspense>
              }
            />
          ))}
        </Routes>
      </div>
    );
  }

  // Render dengan sidebar/menu (user sudah selesai onboarding)
  return (
    <div
      ref={containerRef}
      className='flex w-full min-h-screen h-auto lg:h-screen lg:overflow-hidden bg-[#f8fafc]'
    >
      <aside className='w-[280px] bg-[#022c22] border-r border-white/5 hidden lg:flex flex-col z-30 shadow-2xl transition-all duration-300'>
        <div className='h-28 flex flex-col justify-center px-6'>
          <div className='flex items-center gap-4 w-full'>
            <div className='w-12 h-12 bg-white/[0.03] border border-white/10 rounded-2xl flex items-center justify-center shrink-0 shadow-inner overflow-hidden p-2'>
              <img
                src={Logo}
                alt='Logo'
                className='w-full h-full object-contain cursor-pointer'
                onClick={() => navigate("/")}
              />
            </div>
            <div className='flex flex-col overflow-hidden'>
              <span className='font-black text-white tracking-widest leading-none uppercase text-2xl'>
                ONWARD
              </span>
              <span className='text-[10px] text-white/40 font-bold tracking-[0.4em] leading-none mt-1.5 '>
                TRANSPORTATION
              </span>
            </div>
          </div>
        </div>

        <div className='px-6 mb-6'>
          <div className='h-[1px] bg-white/5 w-full' />
        </div>

        <div className='flex flex-col flex-1 overflow-auto scrollbar-hide px-4 gap-1 pb-4'>
          {menuOverview.map((item, i) => {
            const isActive = item.active;

            if (item.isSection) {
              return (
                <div
                  key={i}
                  className='pt-6 pb-2 px-4 text-[10px] font-semibold text-white/40 uppercase tracking-widest'
                >
                  {item.label}
                </div>
              );
            }

            return (
              <div key={i} className='flex flex-col gap-1'>
                <div
                  onClick={item.onClick}
                  className={clsx(
                    "flex items-center gap-4 h-12 px-4 rounded-2xl transition-all duration-300 relative cursor-pointer group/item",
                    isActive
                      ? "bg-emerald-500/10 text-white shadow-lg shadow-black/10"
                      : "text-white/40 hover:text-white/70 hover:bg-white/[0.02]",
                  )}
                >
                  <div
                    className={clsx(
                      "shrink-0 transition-all duration-300",
                      isActive
                        ? "text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                        : "text-white/20 group-hover/item:text-white/40",
                    )}
                  >
                    {item.icon}
                  </div>
                  <span className='text-[14px] font-semibold tracking-wide flex-1'>
                    {item.label}
                  </span>
                  {isActive && (
                    <div className='absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-emerald-500 rounded-l-full shadow-[0_0_15px_rgba(16,185,129,0.5)]' />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className='p-3'>
          <div className='flex items-center gap-3 p-3 bg-white/[0.03] hover:bg-white/[0.06] rounded-2xl transition-all border border-white/[0.05]'>
            <div className='h-10 w-10 rounded-xl border border-white/10 shrink-0 bg-orange-600 flex items-center justify-center text-white text-xs font-black ring-2 ring-emerald-500/50 ring-offset-2 ring-offset-[#022c22] overflow-hidden'>
              {Profile?.user?.name?.[0]?.toUpperCase()}
            </div>
            <div className='grid flex-1 text-left text-sm leading-tight'>
              <span className='truncate font-bold text-white/90 leading-tight'>
                {Profile?.user?.name}
              </span>
              <span className='truncate text-[11px] text-white/30 font-medium leading-tight'>
                {Profile?.user?.email}
              </span>
            </div>
            <div className='bg-emerald-500/20 text-emerald-400 border-none text-[9px] font-black px-1.5 h-5 flex items-center rounded-md tracking-tighter'>
              {Profile?.user?.role?.toUpperCase()}
            </div>
            <button
              onClick={handleLogout}
              className='shrink-0 h-8 w-8 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 flex items-center justify-center text-red-400 transition-all'
              title='Logout'
            >
              <Power size={14} />
            </button>
          </div>
        </div>
      </aside>

      <main
        ref={mainRef}
        className='bg-base-200 w-full flex-1 min-h-screen h-auto lg:h-screen relative'
      >
        <Navbar className='flex lg:hidden bg-secondary '>
          <div className='flex w-full items-center text-base-100!'>
            <Navbar.MobileToggle items={menuOverview} />
            <Navbar.Brand>
              <div className='bg-primary shadow rounded-full p-2 h-10 w-10'>
                <img src={Logo} alt='Logo' className='object-center' />
              </div>
            </Navbar.Brand>
            <Navbar.Actions className='gap-3'>
              <Dropdown
                position='end'
                trigger={
                  <Avatar
                    status='online'
                    className='uppercase'
                    placeholder={!Profile?.user?.avatar_url}
                    size='xs'
                    mask='circle'
                    variant='primary'
                    src={Profile?.user?.avatar_url}
                  >
                    {Profile?.user?.name?.[0] ?? ""}
                  </Avatar>
                }
                contentClassName='min-w-46 !p-0'
              >
                <div
                  className='py-3 px-4 flex place-items-center place-content-between text-base-content! hover:bg-base-200 cursor-pointer'
                  onClick={handleLogout}
                >
                  <div className='flex gap-2 place-items-center text-sm text-error'>
                    <Power size={18} />
                    Log Out
                  </div>
                </div>
              </Dropdown>
            </Navbar.Actions>
          </div>
        </Navbar>

        <Routes>
          {routes.map((r, i) => (
            <Route
              key={i}
              path={r.path}
              element={
                <Suspense fallback={<div>Loading...</div>}>
                  <r.element />
                </Suspense>
              }
            />
          ))}
          <Route
            path='*'
            element={
              <Suspense fallback={<div>Loading Dashboard...</div>}>
                <DashboardScreen />
              </Suspense>
            }
          />
        </Routes>
      </main>
    </div>
  );
};

export default AppRouter;
