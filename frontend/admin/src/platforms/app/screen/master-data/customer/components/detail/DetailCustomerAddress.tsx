/* eslint-disable react-hooks/exhaustive-deps */

import { useEffect, useRef, useState } from "react";

import { Button, Modal, useEnigmaUI } from "@/components";
import { StatusToggle } from "@/components/ui";
import { useAddress } from "@/services/address/hooks";
import type { Address } from "@/services/types";
import { getDisplayPath } from "@/utils/common";
import { FaEdit } from "react-icons/fa";
import { FaTrash } from "react-icons/fa";

import AddressFormModal from "../../../../../components/address/AddressFormModal";

interface DetailCustomerAddressProps {
  customerId: string;
  onRefresh: () => void;
}

const DetailCustomerAddress: React.FC<DetailCustomerAddressProps> = ({
  customerId,
  onRefresh,
}) => {
  const { openModal, closeModal, showToast } = useEnigmaUI();

  const { get, remove: removeAddress, removeResult, activate, deactivate } = useAddress();

  const [addresses, setAddresses] = useState<Address[]>([]);

  // Track delete success agar hanya handle sekali per delete
  const deleteSuccessHandledRef = useRef(false);

  // Load addresses for this customer
  const loadAddresses = async () => {
    const result = await get({
      customer_id: customerId,
      page: 1,
      limit: 100,
    });
    if (result && (result as any).data) {
      setAddresses((result as any).data);
    } else {
      setAddresses([]);
    }
  };

  useEffect(() => {
    if (customerId) {
      loadAddresses();
    }
  }, [customerId]);

  // Reload addresses after successful delete
  useEffect(() => {
    if (removeResult?.isSuccess && !deleteSuccessHandledRef.current) {
      deleteSuccessHandledRef.current = true;
      showToast({
        message: "Address deleted successfully",
        type: "success",
      });
      refreshData();
    }
  }, [removeResult?.isSuccess]);

  // Handle create address
  const handleCreateAddress = () => {
    openModal({
      id: "create-address",
      content: (
        <AddressFormModal
          open={true}
          onClose={() => closeModal("create-address")}
          onSuccess={() => refreshData()}
          mode='create'
          customerId={customerId}
        />
      ),
    });
  };

  // Handle update address
  const handleUpdate = (address: Address) => {
    openModal({
      id: "update-address",
      content: (
        <AddressFormModal
          open={true}
          onClose={() => closeModal("update-address")}
          onSuccess={() => refreshData()}
          mode='update'
          data={address}
          customerId={customerId}
        />
      ),
    });
  };

  // Handle address form success
  const refreshData = () => {
    loadAddresses();
    onRefresh();
  };

  // Handle toggle status
  const handleToggleStatus = async (address: Address, newStatus: boolean) => {
    try {
      if (newStatus) {
        await activate({ id: address.id });
        showToast({ message: "Address activated successfully", type: "success" });
      } else {
        await deactivate({ id: address.id });
        showToast({ message: "Address deactivated successfully", type: "success" });
      }
      refreshData();
    } catch (error) {
      refreshData();
    }
  };

  const handleDelete = (address: Address) => {
    // Reset ref agar delete success yang baru bisa di-handle
    deleteSuccessHandledRef.current = false;

    openModal({
      id: "delete-address-confirm",
      content: (
        <Modal.Wrapper
          open
          onClose={() => closeModal("delete-address-confirm")}
          closeOnOutsideClick={false}
          className='!max-w-md !w-11/12 mx-4'
        >
          <Modal.Header className='mb-4'>
            <div className='text-rose-600 font-bold leading-7 text-lg'>
              Delete Saved Address
            </div>
            <div className='text-sm text-slate-500 leading-5 font-normal'>
              This action is permanent and cannot be undone. Are you sure?
            </div>
          </Modal.Header>
          <Modal.Body>
            <div className='bg-rose-50/50 border border-rose-100/60 p-5 rounded-2xl'>
              <p className='text-sm text-rose-900/60 font-medium mb-3'>
                You are about to delete:
              </p>
              <div className='bg-white p-4 rounded-xl shadow-sm border border-rose-100 flex flex-col gap-1'>
                <p className='font-bold text-slate-800'>{address.name}</p>
                <p className='text-xs text-slate-500 font-medium line-clamp-2'>
                  {address.address}
                </p>
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <div className='flex justify-end gap-3'>
              <Button
                variant='secondary'
                onClick={() => closeModal("delete-address-confirm")}
                disabled={removeResult?.isLoading}
              >
                Cancel
              </Button>
              <Button
                variant='error'
                isLoading={removeResult?.isLoading}
                onClick={async () => {
                  await removeAddress({ id: address.id });
                  closeModal("delete-address-confirm");
                }}
                className='bg-rose-600 hover:bg-rose-700 text-white shadow-md border border-rose-700 outline outline-2 outline-offset-2 outline-rose-500/20'
              >
                Yes, Delete Address
              </Button>
            </div>
          </Modal.Footer>
        </Modal.Wrapper>
      ),
    });
  };

  return (
    <div className='space-y-4'>
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3'>
        <h3 className='text-base lg:text-lg font-semibold'>Saved Addresses</h3>
        <Button size='sm' variant='primary' onClick={handleCreateAddress}>
          + Add Address
        </Button>
      </div>

      {addresses.length === 0 ? (
        <div className='text-center py-8 lg:py-12 text-gray-500'>
          <p className='text-sm'>No addresses saved yet</p>
          <p className='text-xs mt-1'>Click "+ Add Address" to create one</p>
        </div>
      ) : (
        <div className='overflow-x-auto'>
          <table className='w-full text-sm'>
            <thead className='bg-base-200'>
              <tr>
                <th className='px-3 lg:px-4 py-3 text-left font-semibold text-xs lg:text-sm'>
                  Label
                </th>
                <th className='px-3 lg:px-4 py-3 text-left font-semibold text-xs lg:text-sm'>
                  Address
                </th>
                <th className='px-3 lg:px-4 py-3 text-left font-semibold text-xs lg:text-sm hidden sm:table-cell'>
                  Location
                </th>
                <th className='px-3 lg:px-4 py-3 text-left font-semibold text-xs lg:text-sm hidden md:table-cell'>
                  Contact
                </th>
                <th className='px-3 lg:px-4 py-3 text-center font-semibold text-xs lg:text-sm'>
                  Status
                </th>
                <th className='px-3 lg:px-4 py-3 text-right font-semibold text-xs lg:text-sm'>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className='divide-y divide-base-200'>
              {addresses.map((address) => (
                <tr key={address.id} className='hover:bg-base-50'>
                  <td className='px-3 lg:px-4 py-3'>
                    <span className='font-medium text-xs lg:text-sm'>
                      {address.name}
                    </span>
                  </td>
                  <td className='px-3 lg:px-4 py-3'>
                    <p className='text-gray-700 text-xs lg:text-sm truncate max-w-[150px] lg:max-w-xs'>
                      {address.address}
                    </p>
                  </td>
                  <td className='px-3 lg:px-4 py-3 hidden sm:table-cell'>
                    <p className='text-gray-600 text-xs lg:text-sm'>
                      {address.region?.administrative_area
                        ? getDisplayPath(address.region.administrative_area)
                        : address.region?.name || "-"}
                    </p>
                  </td>
                  <td className='px-3 lg:px-4 py-3 hidden md:table-cell'>
                    {(address.contact_name || address.contact_phone) && (
                      <div className='space-y-1'>
                        {address.contact_name && (
                          <p className='text-gray-600 text-xs lg:text-sm'>
                            {address.contact_name}
                          </p>
                        )}
                        {address.contact_phone && (
                          <p className='text-xs text-gray-600'>
                            {address.contact_phone}
                          </p>
                        )}
                      </div>
                    )}
                  </td>
                  <td className='px-3 lg:px-4 py-3 text-center'>
                    <StatusToggle
                      checked={address.is_active ?? false}
                      onChange={(checked) => handleToggleStatus(address, checked)}
                    />
                  </td>
                  <td className='px-3 lg:px-4 py-3 text-right'>
                    <div className='flex justify-end gap-2'>
                      <Button
                        size='sm'
                        variant='secondary'
                        styleType='ghost'
                        onClick={() => handleUpdate(address)}
                      >
                        <FaEdit className='w-3 h-3 lg:w-4 lg:h-4' />
                      </Button>
                      <Button
                        size='sm'
                        variant='error'
                        styleType='ghost'
                        onClick={() => handleDelete(address)}
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
      )}
    </div>
  );
};

export default DetailCustomerAddress;
