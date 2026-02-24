/* eslint-disable react-hooks/exhaustive-deps */

import {
  HiPower,
  HiRectangleGroup,
  HiUserGroup,
  HiTruck,
  HiCube,
  HiDocumentText,
  HiExclamationTriangle,
  HiChartBar,
} from "react-icons/hi2";
import { useDispatch, useSelector } from "react-redux";
import {
  Route,
  Routes,
  useMatch,
  useNavigate,
  useLocation,
} from "react-router-dom";

import Logo from "@/assets/logo_dark.svg";
import {
  Avatar,
  Dropdown,
  FullPageLoading,
  Menu,
  Navbar,
  type MenuItem,
} from "@/components";
import { signout } from "@/services/auth/slice";
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
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);

  // Call ALL hooks at the top level - Rules of Hooks
  const matchDashboard = useMatch("/a/dashboard");
  const matchMasterData = useMatch("/a/master-data/*");
  const matchCustomers = useMatch("/a/master-data/customers");
  const matchVehicles = useMatch("/a/master-data/vehicles");
  const matchDrivers = useMatch("/a/master-data/drivers");
  const matchOrders = useMatch("/a/orders");
  const matchTrips = useMatch("/a/trips");
  const matchExceptions = useMatch("/a/exceptions");
  const matchReports = useMatch("/a/reports");
  const matchReportOrderTrip = useMatch("/a/reports/order-trip");
  const matchReportDriverPerformance = useMatch(
    "/a/reports/driver-performance",
  );
  const matchReportCustomer = useMatch("/a/reports/customer");
  const matchManagement = useMatch("/a/management/*");
  const matchCompany = useMatch("/a/management/company");
  const matchTeam = useMatch("/a/management/team");
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

  // TMS Onward - Full menu structure
  const menuOverview: MenuItem[] = [
    {
      label: "Dashboard",
      onClick: () => navigate("/a/dashboard"),
      active: !!matchDashboard,
      icon: <HiRectangleGroup size={18} />,
    },
    {
      label: "Master Data",
      active: !!matchMasterData,
      icon: <HiCube size={18} />,
      collapsible: true,
      children: [
        {
          label: "Customers",
          onClick: () => navigate("/a/master-data/customers"),
          active: !!matchCustomers,
        },
        {
          label: "Vehicles",
          onClick: () => navigate("/a/master-data/vehicles"),
          active: !!matchVehicles,
        },
        {
          label: "Drivers",
          onClick: () => navigate("/a/master-data/drivers"),
          active: !!matchDrivers,
        },
        // Pricing removed - managed via Customer detail page (Customer-Specific Pricing)
        // Addresses removed - managed via Customer detail page
      ],
    },
    {
      label: "Orders",
      onClick: () => navigate("/a/orders"),
      active: !!matchOrders,
      icon: <HiDocumentText size={18} />,
    },
    {
      label: "Trips",
      onClick: () => navigate("/a/trips"),
      active: !!matchTrips,
      icon: <HiTruck size={18} />,
    },
    {
      label: "Exceptions",
      onClick: () => navigate("/a/exceptions"),
      active: !!matchExceptions,
      icon: <HiExclamationTriangle size={18} />,
    },
    {
      label: "Reports",
      active: !!matchReports,
      icon: <HiChartBar size={18} />,
      collapsible: true,
      children: [
        {
          label: "Order Trip",
          onClick: () => navigate("/a/reports/order-trip"),
          active: !!matchReportOrderTrip,
        },
        {
          label: "Driver Performance",
          onClick: () => navigate("/a/reports/driver-performance"),
          active: !!matchReportDriverPerformance,
        },
        {
          label: "Customer",
          onClick: () => navigate("/a/reports/customer"),
          active: !!matchReportCustomer,
        },
      ],
    },
    {
      label: "Management",
      active: !!matchManagement,
      icon: <HiUserGroup size={18} />,
      collapsible: true,
      children: [
        {
          label: "Company",
          onClick: () => navigate("/a/management/company"),
          active: !!matchCompany,
        },
        {
          label: "Team",
          onClick: () => navigate("/a/management/team"),
          active: !!matchTeam,
        },
      ],
    },
  ];

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
      className='flex w-full min-h-screen h-auto lg:h-screen lg:overflow-hidden '
    >
      <aside className='w-64 bg-secondary border-r border-white hidden lg:flex flex-col space-y-5 z-30'>
        <div className='flex flex-col items-center mt-4'>
          <div className='bg-primary shadow rounded-full p-2 h-10 w-10'>
            <img
              src={Logo}
              alt='Logo'
              className='object-center cursor-pointer'
              onClick={() => navigate("/")}
            />
          </div>
        </div>

        <div className='flex flex-col flex-1 overflow-auto scrollbar-hide'>
          <Menu
            items={menuOverview}
            className='bg-transparent text-base-100 w-full gap-1'
            inactiveClass='py-2'
            activeClass='bg-base-200/10 py-2'
            size='md'
          />
        </div>
        <div className='flex flex-col p-3 '>
          <div className='space-y-1 mb-3 border-t border-base-100/20 pt-2'>
            <div
              className='flex place-items-center place-content-between py-2 px-2 text-base-100 rounded-xl cursor-pointer hover:bg-base-100/20 group bg-base-300/20'
              onClick={() => dispatch(signout())}
            >
              <div className='flex gap-2 place-items-center text-sm '>
                <HiPower size={18} />
                Log Out
              </div>
            </div>
          </div>
          <div className='flex place-items-center px-4 py-2 bg-base-100/5 rounded-xl text-base-100 gap-3 w-full'>
            <Avatar
              placeholder={!Profile?.user?.avatar_url}
              size='sm'
              mask='circle'
              status='online'
              className='capitalize text-base-100!'
              src={Profile?.user?.avatar_url}
            >
              {Profile?.user?.name?.[0] ?? ""}
            </Avatar>
            <div>
              <div className='font-bold text-base leading-6 capitalize'>
                {Profile?.user?.name || "User"}
              </div>
            </div>
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
                  onClick={() => dispatch(signout())}
                >
                  <div className='flex gap-2 place-items-center text-sm text-error'>
                    <HiPower size={18} />
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
