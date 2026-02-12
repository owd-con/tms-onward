/* eslint-disable react-hooks/exhaustive-deps */

import { useEffect, useRef, useState } from "react";

import { Button, Modal, useEnigmaUI } from "@/components";
import { usePricingMatrix } from "@/services/pricingMatrix/hooks";
import type { PricingMatrix } from "@/services/types";
import { FaEdit } from "react-icons/fa";
import { FaTrash } from "react-icons/fa";

import CustomerPricingFormModal from "../form/CustomerPricingFormModal";

interface DetailCustomerPricingProps {
  customerId: string;
  onRefresh: () => void;
}

const DetailCustomerPricing: React.FC<DetailCustomerPricingProps> = ({
  customerId,
  onRefresh,
}) => {
  const { openModal, closeModal, showToast } = useEnigmaUI();

  const { get: getPricing, remove: removePricing, removeResult } = usePricingMatrix();

  const [pricings, setPricings] = useState<PricingMatrix[]>([]);

  // Track delete success agar hanya handle sekali per delete
  const deleteSuccessHandledRef = useRef(false);

  // Load pricing for this customer
  const loadPricing = async () => {
    const result = await getPricing({
      customer_id: customerId,
      page: 1,
      limit: 100,
    });
    if (result && (result as any).data) {
      setPricings((result as any).data);
    } else {
      setPricings([]);
    }
  };

  useEffect(() => {
    if (customerId) {
      loadPricing();
    }
  }, [customerId]);

  // Reload pricing after successful delete
  useEffect(() => {
    if (removeResult?.isSuccess && !deleteSuccessHandledRef.current) {
      deleteSuccessHandledRef.current = true;
      showToast({
        message: "Pricing deleted successfully",
        type: "success",
      });
      refreshData();
    }
  }, [removeResult?.isSuccess]);

  // Handle create pricing
  const handleCreatePricing = () => {
    openModal({
      id: "create-pricing",
      content: (
        <CustomerPricingFormModal
          onClose={() => closeModal("create-pricing")}
          onSuccess={() => refreshData()}
          mode='create'
          customerId={customerId}
        />
      ),
    });
  };

  // Handle edit pricing
  const handleEditPricing = (pricing: PricingMatrix) => {
    openModal({
      id: "update-pricing",
      content: (
        <CustomerPricingFormModal
          onClose={() => closeModal("update-pricing")}
          onSuccess={() => refreshData()}
          mode='update'
          data={pricing}
          customerId={customerId}
        />
      ),
    });
  };

  // Handle delete pricing
  const handleDeletePricing = (pricing: PricingMatrix) => {
    // Reset ref agar delete success yang baru bisa di-handle
    deleteSuccessHandledRef.current = false;

    openModal({
      id: "delete-pricing-confirm",
      content: (
        <Modal.Wrapper
          open
          onClose={() => closeModal("delete-pricing-confirm")}
          closeOnOutsideClick={false}
          className='max-w-md'
        >
          <Modal.Header>
            <div className='text-lg font-bold'>Delete Pricing</div>
          </Modal.Header>
          <Modal.Body>
            <p className='text-sm text-gray-600'>
              Are you sure you want to delete this pricing?
            </p>
            <p className='mt-2 text-sm text-gray-700'>
              <span className='font-medium'>{pricing.origin_region?.name || pricing.origin_city_id}</span> →{" "}
              <span className='font-medium'>{pricing.destination_region?.name || pricing.destination_city_id}</span>
            </p>
            <p className='text-lg font-semibold mt-2'>
              Rp {new Intl.NumberFormat("id-ID").format(pricing.price)}
            </p>
          </Modal.Body>
          <Modal.Footer>
            <div className='flex justify-end gap-3'>
              <Button
                variant='secondary'
                onClick={() => closeModal("delete-pricing-confirm")}
                disabled={removeResult?.isLoading}
              >
                Cancel
              </Button>
              <Button
                variant='error'
                isLoading={removeResult?.isLoading}
                onClick={async () => {
                  await removePricing({ id: pricing.id });
                  closeModal("delete-pricing-confirm");
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

  // Refresh data
  const refreshData = () => {
    loadPricing();
    onRefresh();
  };

  return (
    <div className='space-y-4'>
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3'>
        <h3 className='text-base lg:text-lg font-semibold'>Customer-Specific Pricing</h3>
        <Button size='sm' variant='primary' onClick={handleCreatePricing}>
          + Add Pricing
        </Button>
      </div>

      {pricings.length === 0 ? (
        <div className='text-center py-8 lg:py-12 text-gray-500'>
          <p className='text-sm'>No customer-specific pricing yet</p>
          <p className='text-xs mt-1'>Click "+ Add Pricing" to create one</p>
        </div>
      ) : (
        <div className='max-h-[300px] lg:max-h-[400px] overflow-y-auto'>
          <div className='overflow-x-auto'>
            <table className='w-full text-sm'>
              <thead className='bg-base-200 sticky top-0'>
                <tr>
                  <th className='px-3 lg:px-4 py-3 text-left font-semibold text-xs lg:text-sm'>Origin</th>
                  <th className='px-3 lg:px-4 py-3 text-left font-semibold text-xs lg:text-sm'>Destination</th>
                  <th className='px-3 lg:px-4 py-3 text-right font-semibold text-xs lg:text-sm'>Price (IDR)</th>
                  <th className='px-3 lg:px-4 py-3 text-right font-semibold text-xs lg:text-sm'>Actions</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-base-200'>
                {pricings.map((pricing) => (
                  <tr key={pricing.id} className='hover:bg-base-50'>
                    <td className='px-3 lg:px-4 py-3'>
                      <span className='font-medium text-xs lg:text-sm'>{pricing.origin_region?.name || pricing.origin_city_id || "-"}</span>
                    </td>
                    <td className='px-3 lg:px-4 py-3'>
                      <span className='font-medium text-xs lg:text-sm'>{pricing.destination_region?.name || pricing.destination_city_id || "-"}</span>
                    </td>
                    <td className='px-3 lg:px-4 py-3 text-right'>
                      <span className='font-mono font-semibold text-xs lg:text-sm'>
                        Rp {new Intl.NumberFormat("id-ID").format(pricing.price)}
                      </span>
                    </td>
                    <td className='px-3 lg:px-4 py-3 text-right'>
                      <div className='flex justify-end gap-2'>
                        <Button
                          size='sm'
                          variant='secondary'
                          styleType='ghost'
                          onClick={() => handleEditPricing(pricing)}
                        >
                          <FaEdit className='w-3 h-3 lg:w-4 lg:h-4' />
                        </Button>
                        <Button
                          size='sm'
                          variant='error'
                          styleType='ghost'
                          onClick={() => handleDeletePricing(pricing)}
                        >
                          <FaTrash className='w-3 h-3 lg:w-4 lg:h-4' />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default DetailCustomerPricing;
