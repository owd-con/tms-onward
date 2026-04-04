/* eslint-disable react-hooks/exhaustive-deps */

import { useEffect, useMemo, useRef } from "react";
import { Database } from "lucide-react";

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
        pillLabel="MASTER DATA"
        pillIcon={<Database size={12} strokeWidth={2.5} />}
        title="Vehicle Registry"
        titleClassName="text-3xl font-black text-slate-900 tracking-tight leading-none mb-1"
        subtitle="Track fleet assets, configurations, and maintenance statuses."
        subtitleClassName="text-sm text-slate-500 font-medium tracking-wide mt-1"
        action={
          <Button
            className="rounded-full shadow-lg text-[15px] font-bold tracking-wide bg-emerald-600 text-white border border-emerald-700 outline outline-2 outline-offset-2 outline-emerald-500/20 hover:bg-emerald-500 transition-colors h-13 px-10"
            onClick={openCreate}
          >
            + Add Vehicle
          </Button>
        }
      />

      <Page.Body>
        <Table.Tools>
          <TableFilter table={Table} />
        </Table.Tools>
        <Table.Render 
          emptyTitle="No Vehicles Found"
          emptyDescription="Get started by creating your first vehicle using the button above."
        />
        <Table.Pagination />
      </Page.Body>
    </Page>
  );
};

export default VehicleListPage;
