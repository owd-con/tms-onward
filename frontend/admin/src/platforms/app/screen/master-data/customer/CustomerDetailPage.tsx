import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaEdit, FaTrash } from "react-icons/fa";
import { Database } from "lucide-react";

import { Button, useEnigmaUI, Modal } from "@/components";
import { useCustomer } from "@/services/customer/hooks";

import { Page } from "../../../components/layout";
import DetailCustomerAddress from "./components/detail/DetailCustomerAddress";
import CustomerFormModal from "./components/form/CustomerFormModal";
import DetailCustomerPricing from "./components/detail/DetailCustomerPricing";

/**
 * TMS Onward - Customer Detail Page
 * Includes customer information, saved addresses, and customer-specific pricing management
 */
const CustomerDetailPage = () => {
  const navigate = useNavigate();
  const { id: customerId } = useParams<{ id: string }>();
  const { openModal, closeModal, showToast } = useEnigmaUI();

  const {
    show,
    showResult,
    remove: removeCustomer,
    removeResult: removeCustomerResult,
  } = useCustomer();

  const [customer, setCustomer] = useState<any>(null);

  // Track delete success agar hanya handle sekali per delete
  const deleteSuccessHandledRef = useRef(false);

  // Initial load - dependency array kosong
  useEffect(() => {
    if (customerId) {
      show({ id: customerId });
    }
  }, []); // ✅ Kosong untuk initial load

  // Sync state dengan result
  useEffect(() => {
    if (showResult?.isSuccess) {
      setCustomer((showResult?.data as any)?.data);
    }
  }, [showResult]);

  const handleDeleteCustomer = () => {
    // Reset ref agar delete success yang baru bisa di-handle
    deleteSuccessHandledRef.current = false;

    openModal({
      id: "delete-customer-confirm",
      content: (
        <Modal.Wrapper
          open
          onClose={() => closeModal("delete-customer-confirm")}
          closeOnOutsideClick={false}
          className='!max-w-md !w-11/12 mx-4'
        >
          <Modal.Header className='mb-4'>
            <div className='text-rose-600 font-bold leading-7 text-lg'>
              Delete Customer Profile
            </div>
            <div className='text-sm text-slate-500 leading-5 font-normal'>
              This action is permanent and cannot be undone. Are you sure?
            </div>
          </Modal.Header>
          <Modal.Body>
            <div className='bg-rose-50/50 border border-rose-100/60 p-5 rounded-2xl'>
              <p className='text-sm text-rose-900/60 font-medium mb-3'>You are about to delete:</p>
              <div className='bg-white p-4 rounded-xl shadow-sm border border-rose-100 flex flex-col gap-1'>
                <p className='font-bold text-slate-800'>{customer?.name}</p>
                <p className='text-sm text-slate-500 font-medium'>
                  Entire profile and access config will be wiped.
                </p>
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <div className='flex justify-end gap-3'>
              <Button
                variant='secondary'
                onClick={() => closeModal("delete-customer-confirm")}
                disabled={removeCustomerResult?.isLoading}
              >
                Cancel
              </Button>
              <Button
                variant='error'
                isLoading={removeCustomerResult?.isLoading}
                onClick={async () => {
                  if (customerId) {
                    await removeCustomer({ id: customerId });
                  }
                }}
                className="bg-rose-600 hover:bg-rose-700 text-white shadow-md border border-rose-700 outline outline-2 outline-offset-2 outline-rose-500/20"
              >
                Yes, Delete Customer
              </Button>
            </div>
          </Modal.Footer>
        </Modal.Wrapper>
      ),
    });
  };

  const handleEditCustomer = () => {
    openModal({
      id: "update-customer",
      content: (
        <CustomerFormModal
          onClose={() => closeModal("update-customer")}
          onSuccess={() => {
            show({ id: customerId as string });
          }}
          mode='update'
          data={customer}
        />
      ),
    });
  };

  // Navigate to customer list after successful customer delete
  useEffect(() => {
    if (removeCustomerResult?.isSuccess && !deleteSuccessHandledRef.current) {
      deleteSuccessHandledRef.current = true;
      showToast({
        message: "Customer deleted successfully",
        type: "success",
      });
      closeModal("delete-customer-confirm");
      navigate("/a/master-data/customers", { replace: true });
    }
  }, [removeCustomerResult?.isSuccess]);

  // Error & Loading handling langsung dari RTK Query
  if (!customer) {
    return (
      <Page>
        <Page.Header
          pillLabel="MASTER DATA"
          pillIcon={<Database size={12} strokeWidth={2.5} />}
          title='Customer Profile'
          titleClassName='text-3xl font-black text-slate-900 tracking-tight leading-none mb-1'
        />
        <Page.Body>
          {showResult?.isError ? (
            <div className='flex flex-col items-center justify-center h-64 gap-4'>
              <div className='text-error text-6xl'>:(</div>
              <div className='text-center'>
                <h3 className='text-lg font-semibold'>Error Loading Customer</h3>
                <p className='text-base-content/60 mt-1'>Failed to load customer details. Please try again.</p>
              </div>
              <Button variant='secondary' onClick={() => navigate(-1)}>
                Go Back
              </Button>
            </div>
          ) : (
            <div className='flex justify-center items-center h-64'>
              <div className='loading loading-spinner loading-lg'></div>
            </div>
          )}
        </Page.Body>
      </Page>
    );
  }

  return (
    <Page className='h-full flex flex-col min-h-0'>
        <Page.Header
          pillLabel="MASTER DATA"
        pillIcon={<Database size={12} strokeWidth={2.5} />}
          backTo={() => navigate(-1)}
          title='Customer Profile'
        titleClassName='text-3xl font-black text-slate-900 tracking-tight leading-none mb-1'
          subtitle={`${customer.name}`}
        subtitleClassName="text-sm text-slate-500 font-medium tracking-wide mt-1"
          action={
          <div className='gap-4 flex'>
            <Button className='btn-neutral' onClick={handleEditCustomer}>
              <FaEdit className='h-4 w-4' />
              </Button>
            <Button variant='error' onClick={handleDeleteCustomer}>
              <FaTrash className='h-4 w-4' />
              </Button>
            </div>
          }
        />

      <Page.Body className='flex-1 flex flex-col space-y-4 min-h-0 overflow-y-auto px-4 lg:px-8 z-10 relative pb-10'>
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>

          {/* Customer Pricing - Floating Canvas */}
          <div className='lg:col-span-2 bg-white/95 backdrop-blur-xl rounded-[2rem] p-6 lg:p-8 shadow-2xl shadow-slate-200/50 border border-white/50'>
            <DetailCustomerPricing
              customerId={customerId as string}
              onRefresh={() => {}}
            />
          </div>

          {/* Customer Information - Floating Canvas */}
          <div className='lg:col-span-1 bg-white/95 backdrop-blur-xl rounded-[2rem] p-6 lg:p-8 shadow-2xl shadow-slate-200/50 border border-white/50'>
            <h3 className='text-base lg:text-lg font-bold text-slate-800 mb-6'>Customer Information</h3>

            <div className='space-y-4'>
              <div className='flex flex-col gap-1 pb-3 border-b border-slate-100'>
                <span className='text-xs font-semibold text-slate-400 uppercase tracking-wider'>Customer</span>
                <span className='font-semibold text-slate-700'>
                  {customer.name}
                </span>
              </div>
              <div className='flex flex-col gap-1 pb-3 border-b border-slate-100'>
                <span className='text-xs font-semibold text-slate-400 uppercase tracking-wider'>Email</span>
                <span className='font-semibold text-slate-700'>
                  {customer.email || "-"}
                </span>
              </div>
              <div className='flex flex-col gap-1 pb-3 border-b border-slate-100'>
                <span className='text-xs font-semibold text-slate-400 uppercase tracking-wider'>Phone</span>
                <span className='font-semibold text-slate-700'>
                  {customer.phone || "-"}
                </span>
              </div>
              <div className='flex flex-col gap-1 pb-3 border-b border-slate-100'>
                <span className='text-xs font-semibold text-slate-400 uppercase tracking-wider'>Status</span>
                <div className="pt-1">
                  <span
                    className={`badge badge-sm ${customer.is_deleted ? "badge-error" : "bg-emerald-100 text-emerald-700 border-emerald-200 font-bold px-3 py-2.5"}`}
                  >
                    {customer.is_deleted ? "Inactive" : "Active"}
                  </span>
                </div>
              </div>
              <div className='flex flex-col gap-1'>
                <span className='text-xs font-semibold text-slate-400 uppercase tracking-wider'>Address</span>
                <span className='font-medium text-slate-600 text-sm leading-relaxed'>
                  {customer.address || "No address on record"}
                </span>
              </div>
            </div>
          </div>

          {/* Saved Addresses - Floating Canvas */}
          <div className='lg:col-span-3 bg-white/95 backdrop-blur-xl rounded-[2rem] p-6 lg:p-8 shadow-2xl shadow-slate-200/50 border border-white/50 mb-8'>
            <DetailCustomerAddress
              customerId={customerId as string}
              onRefresh={() => {}}
            />
          </div>
        </div>
      </Page.Body>
    </Page>
  );
};

export default CustomerDetailPage;
