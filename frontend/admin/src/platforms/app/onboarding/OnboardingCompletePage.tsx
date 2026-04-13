import { Button } from "@/components/ui/button";
import { HiCheckCircle, HiRocketLaunch } from "react-icons/hi2";
import type { OnboardingData } from "./OnboardingWizard";

interface OnboardingCompletePageProps {
  data: OnboardingData;
  onGoToDashboard: () => void;
}

const OnboardingCompletePage = ({
  data,
  onGoToDashboard,
}: OnboardingCompletePageProps) => {
  const stats = [
    {
      label: "Company Profile",
      value: data.step1.company_name,
      icon: <HiCheckCircle size={20} />,
      color: "text-success",
    },
    {
      label: "Team Members",
      value: `${data.step2.usersCreated} added`,
      icon: data.step2.usersCreated > 0 ? <HiCheckCircle size={20} /> : null,
      color:
        data.step2.usersCreated > 0 ? "text-success" : "text-base-content/40",
    },
    {
      label: "Vehicles",
      value: `${data.step3.vehiclesCreated} added`,
      icon: data.step3.vehiclesCreated > 0 ? <HiCheckCircle size={20} /> : null,
      color:
        data.step3.vehiclesCreated > 0
          ? "text-success"
          : "text-base-content/40",
    },
    {
      label: "Drivers",
      value: `${data.step4.driversCreated} added`,
      icon: data.step4.driversCreated > 0 ? <HiCheckCircle size={20} /> : null,
      color:
        data.step4.driversCreated > 0 ? "text-success" : "text-base-content/40",
    },
    {
      label: "Customers",
      value: `${data.step5.customersCreated} added`,
      icon:
        data.step5.customersCreated > 0 ? <HiCheckCircle size={20} /> : null,
      color:
        data.step5.customersCreated > 0
          ? "text-success"
          : "text-base-content/40",
    },
  ];

  const totalItemsAdded =
    data.step2.usersCreated +
    data.step3.vehiclesCreated +
    data.step4.driversCreated +
    data.step5.customersCreated;

  return (
    <div className='min-h-screen bg-base-200 flex items-center justify-center py-8 px-4'>
      <div className='max-w-2xl w-full'>
        {/* Success Card */}
        <div className='bg-base-100 rounded-xl shadow-lg overflow-hidden'>
          {/* Header with Celebration */}
          <div className='bg-gradient-to-r from-primary to-primary/80 p-8 text-center'>
            <div className='inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full mb-4'>
              <HiCheckCircle size={48} className='text-white' />
            </div>
            <h1 className='text-3xl font-bold text-white mb-2'>
              Welcome to TMS Onward!
            </h1>
            <p className='text-white/90'>
              Your account has been set up successfully
            </p>
          </div>

          {/* Content */}
          <div className='p-6 md:p-8'>
            {/* Summary Section */}
            <div className='mb-8'>
              <h2 className='text-lg font-semibold text-base-content mb-4'>
                Setup Summary
              </h2>

              <div className='bg-base-200 rounded-xl p-4 space-y-3'>
                {stats.map((stat, index) => (
                  <div
                    key={index}
                    className='flex items-center justify-between py-2 border-b border-base-300 last:border-0 last:pb-0'
                  >
                    <div className='flex items-center gap-3'>
                      {stat.icon && (
                        <span className={stat.color}>{stat.icon}</span>
                      )}
                      <span className='text-sm font-medium text-base-content'>
                        {stat.label}
                      </span>
                    </div>
                    <span className='text-sm text-base-content/70'>
                      {stat.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Info Box */}
            {totalItemsAdded === 0 ? (
              <div className='bg-info/10 border border-info/20 rounded-xl p-4 mb-6'>
                <div className='flex items-start gap-3'>
                  <div className='text-info mt-0.5'>
                    <svg
                      className='w-5 h-5'
                      fill='currentColor'
                      viewBox='0 0 20 20'
                    >
                      <path
                        fillRule='evenodd'
                        d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z'
                        clipRule='evenodd'
                      />
                    </svg>
                  </div>
                  <div className='flex-1'>
                    <div className='font-semibold text-info text-sm mb-1'>
                      Get Started Anytime
                    </div>
                    <div className='text-info/80 text-xs'>
                      You skipped the optional setup steps. Don't worry, you can
                      add team members, vehicles, drivers, and customers anytime
                      from the respective management pages.
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className='bg-success/10 border border-success/20 rounded-xl p-4 mb-6'>
                <div className='flex items-start gap-3'>
                  <div className='text-success mt-0.5'>
                    <svg
                      className='w-5 h-5'
                      fill='currentColor'
                      viewBox='0 0 20 20'
                    >
                      <path
                        fillRule='evenodd'
                        d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                        clipRule='evenodd'
                      />
                    </svg>
                  </div>
                  <div className='flex-1'>
                    <div className='font-semibold text-success text-sm mb-1'>
                      You're All Set!
                    </div>
                    <div className='text-success/80 text-xs'>
                      Great job! You've added {totalItemsAdded} item
                      {totalItemsAdded !== 1 ? "s" : ""} to get started. You can
                      always add more from the management pages.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Next Steps */}
            <div className='mb-6'>
              <h3 className='text-sm font-semibold text-base-content mb-3'>
                What's Next?
              </h3>
              <div className='space-y-2'>
                <div className='flex items-start gap-3 text-sm'>
                  <div className='w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold mt-0.5'>
                    1
                  </div>
                  <div className='flex-1'>
                    <span className='text-base-content'>Add customers</span>
                    <span className='text-base-content/60 block text-xs'>
                      Create customer profiles to start managing orders
                    </span>
                  </div>
                </div>
                <div className='flex items-start gap-3 text-sm'>
                  <div className='w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold mt-0.5'>
                    2
                  </div>
                  <div className='flex-1'>
                    <span className='text-base-content'>
                      Create your first order
                    </span>
                    <span className='text-base-content/60 block text-xs'>
                      Add orders and assign them to trips
                    </span>
                  </div>
                </div>
                <div className='flex items-start gap-3 text-sm'>
                  <div className='w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold mt-0.5'>
                    3
                  </div>
                  <div className='flex-1'>
                    <span className='text-base-content'>
                      Dispatch and track
                    </span>
                    <span className='text-base-content/60 block text-xs'>
                      Monitor your deliveries in real-time
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <Button
              onClick={onGoToDashboard}
              variant='primary'
              className='w-full py-3 text-base'
            >
              <HiRocketLaunch size={20} className='mr-2' />
              Go to Dashboard
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className='text-center mt-6'>
          <p className='text-sm text-base-content/60'>
            Need help? Check out our documentation or contact support
          </p>
        </div>
      </div>
    </div>
  );
};

export default OnboardingCompletePage;
