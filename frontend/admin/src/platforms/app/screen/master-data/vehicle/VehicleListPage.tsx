/* eslint-disable react-hooks/exhaustive-deps */

import { useEffect, useMemo, useRef } from "react";
import { HiTruck } from "react-icons/hi2";

import useTable from "@/services/table/hooks";
import type { TableConfig } from "@/services/table/const";

import { Button, Modal, useEnigmaUI } from "@/components";
import type { Vehicle } from "@/services/types";
import { useVehicle } from "@/services/vehicle/hooks";

import { Page } from "../../../components/layout";
import createTableConfig from "./components/table/table.config";
import TableFilter from "./components/table/filter";
import VehicleFormModal from "./components/form/VehicleFormModal";

/**
 * TMS Onward - Vehicle List Page
 */
const VehicleListPage = () => {
  const { openModal, closeModal, showToast } = useEnigmaUI();
  const { remove, removeResult } = useVehicle();
  const vehicle = useVehicle();

  // Track delete success agar hanya handle sekali per delete
  const deleteSuccessHandledRef = useRef(false);

  const tableConfig = useMemo(() => {
    return createTableConfig({
      onReload: () => {
        Table.boot();
      },
      onClick: (e: Vehicle, action: string) => {
        if (action === "update") {
          openUpdate(e);
        } else if (action === "delete") {
          openDeleteConfirm(e);
        }
      },
      onToggleStatus: async (row: Vehicle, newStatus: boolean) => {
        try {
          if (newStatus) {
            await vehicle.activate({ id: row.id });
            showToast({ message: "Vehicle activated successfully", type: "success" });
          } else {
            await vehicle.deactivate({ id: row.id });
            showToast({ message: "Vehicle deactivated successfully", type: "success" });
          }
          Table.boot();
        } catch (error) {
          Table.boot();
        }
      },
    });
  }, [vehicle, showToast]);

  const Table = useTable("vehicle", tableConfig as TableConfig<unknown>);

  // Open create modal
  const openCreate = () => {
    openModal({
      id: "create-vehicle",
      content: (
        <VehicleFormModal
          open={true}
          onClose={() => closeModal("create-vehicle")}
          onSuccess={() => Table.boot()}
          mode="create"
        />
      ),
    });
  };

  // Open update modal
  const openUpdate = (vehicle: Vehicle) => {
    openModal({
      id: "update-vehicle",
      content: (
        <VehicleFormModal
          open={true}
          onClose={() => closeModal("update-vehicle")}
          onSuccess={() => Table.boot()}
          mode="update"
          data={vehicle}
        />
      ),
    });
  };

  // Open delete confirmation modal
  const openDeleteConfirm = (vehicle: Vehicle) => {
    // Reset ref agar delete success yang baru bisa di-handle
    deleteSuccessHandledRef.current = false;

    openModal({
      id: "delete-vehicle",
      content: (
        <Modal.Wrapper
          open={true}
          onClose={() => closeModal("delete-vehicle")}
          closeOnOutsideClick={true}
          className='max-w-md'
        >
          <Modal.Header className='mb-4'>
            <div className='text-xl font-bold'>Delete Vehicle</div>
            <div className='text-sm text-base-content/60'>
              Are you sure you want to delete this vehicle?
            </div>
          </Modal.Header>

          <Modal.Body>
            <div className='bg-base-200 p-4 rounded-lg'>
              <p className='font-semibold'>{vehicle.plate_number}</p>
              <p className='text-sm text-base-content/60'>{vehicle.type || "-"} - {vehicle.make || "-"} {vehicle.model || "-"}</p>
            </div>
          </Modal.Body>

          <Modal.Footer>
            {removeResult?.isError && (
              <div className='mb-3 text-sm text-error'>
                Failed to delete vehicle. Please try again.
              </div>
            )}
            <div className='flex justify-end gap-3'>
              <Button
                type='button'
                variant='secondary'
                onClick={() => closeModal("delete-vehicle")}
                disabled={removeResult?.isLoading}
              >
                Cancel
              </Button>
              <Button
                type='button'
                variant='error'
                isLoading={removeResult?.isLoading}
                onClick={() => remove({ id: vehicle.id })}
              >
                Delete
              </Button>
            </div>
          </Modal.Footer>
        </Modal.Wrapper>
      ),
    });
  };

  // Close modal and reload on delete success
  useEffect(() => {
    if (removeResult?.isSuccess && !deleteSuccessHandledRef.current) {
      deleteSuccessHandledRef.current = true;
      showToast({
        message: "Vehicle deleted successfully",
        type: "success",
      });
      closeModal("delete-vehicle");
      Table.boot();
    }
  }, [removeResult?.isSuccess]);

  return (
    <Page className="h-full flex flex-col min-h-0">
      <Page.Header
        title="Vehicles"
        titleClassName="!text-2xl"
        subtitle="Manage your vehicle fleet"
        action={
          <Button
            variant="primary"
            onClick={openCreate}
          >
            + Add Vehicle
          </Button>
        }
      />

      <Page.Body className="flex-1 flex flex-col space-y-3 lg:space-y-4 min-h-0">
        <div className="w-full flex gap-2 lg:gap-4 bg-base-100 p-2 rounded-xl">
          <div className="w-full">
            <Table.Tools>
              <TableFilter table={Table} />
            </Table.Tools>
          </div>
        </div>
        <div className="bg-base-100 rounded-xl shadow-sm w-full overflow-x-auto">
          {Table.State?.data && Table.State.data.length === 0 && !Table.State.loading ? (
            <div className="flex flex-col items-center justify-center h-48 lg:h-64 gap-3 lg:gap-4 px-4">
              <div className="text-base-content/40 text-4xl lg:text-6xl">
                <HiTruck />
              </div>
              <div className="text-center">
                <h3 className="text-base lg:text-lg font-semibold">No Vehicles Found</h3>
                <p className="text-base-content/60 mt-1 text-sm lg:text-base">
                  Get started by creating your first vehicle using the button above.
                </p>
              </div>
            </div>
          ) : (
            <>
              <Table.Render />
              <Table.Pagination />
            </>
          )}
        </div>
      </Page.Body>
    </Page>
  );
};

export default VehicleListPage;
