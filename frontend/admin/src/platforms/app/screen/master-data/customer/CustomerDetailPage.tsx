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
          className='max-w-md'
        >
          <Modal.Header>
            <div className='text-lg font-bold'>Delete Customer</div>
          </Modal.Header>
          <Modal.Body>
            <p className='text-sm text-gray-600'>
              Are you sure you want to delete this customer?
            </p>
            <p className='mt-2 text-sm font-medium'>{customer?.name}</p>
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
              >
                Delete
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

      <Page.Body className='flex-1 flex flex-col space-y-3 lg:space-y-4 min-h-0 overflow-y-auto'>
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6'>
          {/* Customer Pricing */}
          <div className='lg:col-span-2 bg-white rounded-xl p-4 lg:p-6 shadow-sm'>
            <DetailCustomerPricing
              customerId={customerId as string}
              onRefresh={() => {}}
            />
          </div>

          {/* Customer Information */}
          <div className='lg:col-span-1 bg-white rounded-xl p-4 lg:p-6 shadow-sm'>
            <h3 className='text-base lg:text-lg font-semibold mb-4'>Customer Information</h3>

            <div className='grid grid-cols-1 gap-2'>
              <div className='flex items-baseline justify-between'>
                <span className='text-xs lg:text-sm text-gray-500'>Customer</span>
                <span className='font-medium text-xs lg:text-sm text-right'>
                  {customer.name}
                </span>
              </div>
              <div className='flex items-baseline justify-between'>
                <span className='text-xs lg:text-sm text-gray-500'>Email</span>
                <span className='font-medium text-xs lg:text-sm text-right'>
                  {customer.email || "-"}
                </span>
              </div>
              <div className='flex items-baseline justify-between'>
                <span className='text-xs lg:text-sm text-gray-500'>Phone</span>
                <span className='font-medium text-xs lg:text-sm text-right'>
                  {customer.phone || "-"}
                </span>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-xs lg:text-sm text-gray-500'>Status</span>
                <span
                  className={`badge badge-sm ${customer.is_deleted ? "badge-error" : "badge-success"}`}
                >
                  {customer.is_deleted ? "Inactive" : "Active"}
                </span>
              </div>
              <div className='flex flex-col gap-1'>
                <span className='text-xs lg:text-sm text-gray-500'>Address</span>
                <span className='font-medium text-xs lg:text-sm'>
                  {customer.address || ""}
                </span>
              </div>
            </div>
          </div>

          {/* Saved Addresses */}
          <div className='lg:col-span-3 bg-white rounded-xl p-4 lg:p-6 shadow-sm'>
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
