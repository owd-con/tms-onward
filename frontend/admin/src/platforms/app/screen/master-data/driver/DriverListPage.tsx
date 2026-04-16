/* eslint-disable react-hooks/exhaustive-deps */

import { useEffect, useMemo, useRef } from "react";
import { Database } from "lucide-react";

import useTable from "@/services/table/hooks";
import type { TableConfig } from "@/services/table/const";

import { Button, Modal, useEnigmaUI } from "@/components";
import type { Driver } from "@/services/types";
import { useDriver } from "@/services/driver/hooks";

import { Page } from "../../../components/layout";
import createTableConfig from "./components/table/table.config";
import TableFilter from "./components/table/filter";
import DriverFormModal from "./components/form/DriverFormModal";
import DriverUserFormModal from "./components/form/DriverUserFormModal";

/**
 * TMS Onward - Driver List Page
 */
const DriverListPage = () => {
  const { openModal, closeModal, showToast } = useEnigmaUI();
  const { remove, removeResult } = useDriver();
  const driver = useDriver();

  // Track delete success agar hanya handle sekali per delete
  const deleteSuccessHandledRef = useRef(false);

  const tableConfig = useMemo(() => {
    return createTableConfig({
      onReload: () => {
        Table.boot();
      },
      onClick: (e: Driver, action: string) => {
        if (action === "update") {
          openUpdate(e);
        } else if (action === "update-user") {
          openUpdateUser(e);
        } else if (action === "delete") {
          openDeleteConfirm(e);
        }
      },
      onToggleStatus: async (row: Driver, newStatus: boolean) => {
        try {
          if (newStatus) {
            await driver.activate({ id: row.id });
            showToast({ message: "Driver activated successfully", type: "success" });
          } else {
            await driver.deactivate({ id: row.id });
            showToast({ message: "Driver deactivated successfully", type: "success" });
          }
          Table.boot();
        } catch (error) {
          Table.boot();
        }
      },
    });
  }, [driver, showToast]);

  const Table = useTable("driver", tableConfig as TableConfig<unknown>);

  // Open create modal
  const openCreate = () => {
    openModal({
      id: "create-driver",
      content: (
        <DriverFormModal
          open={true}
          onClose={() => closeModal("create-driver")}
          onSuccess={() => Table.boot()}
          mode="create"
        />
      ),
    });
  };

  // Open update modal
  const openUpdate = (driver: Driver) => {
    openModal({
      id: "update-driver",
      content: (
        <DriverFormModal
          open={true}
          onClose={() => closeModal("update-driver")}
          onSuccess={() => Table.boot()}
          mode="update"
          data={driver}
        />
      ),
    });
  };

  // Open update user account modal
  const openUpdateUser = (driver: Driver) => {
    openModal({
      id: "update-driver-user",
      content: (
        <DriverUserFormModal
          open={true}
          onClose={() => closeModal("update-driver-user")}
          onSuccess={() => Table.boot()}
          driver={driver}
        />
      ),
    });
  };

  // Open delete confirmation modal
  const openDeleteConfirm = (driver: Driver) => {
    // Reset ref agar delete success yang baru bisa di-handle
    deleteSuccessHandledRef.current = false;

    openModal({
      id: "delete-driver",
      content: (
        <Modal.Wrapper
          open={true}
          onClose={() => closeModal("delete-driver")}
          closeOnOutsideClick={true}
          className='!max-w-md !w-11/12 mx-4'
        >
          <Modal.Header className='mb-4'>
            <div className='text-rose-600 font-bold leading-7 text-lg'>
              Delete Driver Record
            </div>
            <div className='text-sm text-slate-500 leading-5 font-normal'>
              This action is permanent and cannot be undone. Are you sure?
            </div>
          </Modal.Header>

          <Modal.Body>
            <div className='bg-rose-50/50 border border-rose-100/60 p-5 rounded-2xl'>
              <p className='text-sm text-rose-900/60 font-medium mb-3'>You are about to delete:</p>
              <div className='bg-white p-4 rounded-xl shadow-sm border border-rose-100 flex flex-col gap-1'>
                <p className='font-bold text-slate-800'>{driver.name}</p>
                <p className='text-sm text-slate-500 font-medium'>
                  License: {driver.license_number || "No License Recorded"}
                </p>
              </div>
            </div>
          </Modal.Body>

          <Modal.Footer>
            {removeResult?.isError && (
              <div className='mb-3 text-sm font-semibold text-rose-500'>
                Failed to delete driver. Please try again.
              </div>
            )}
            <div className='flex justify-end gap-3'>
              <Button
                type='button'
                variant='secondary'
                onClick={() => closeModal("delete-driver")}
                disabled={removeResult?.isLoading}
              >
                Cancel
              </Button>
              <Button
                type='button'
                variant='error'
                isLoading={removeResult?.isLoading}
                onClick={() => remove({ id: driver.id })}
                className="bg-rose-600 hover:bg-rose-700 text-white shadow-md border border-rose-700 outline outline-2 outline-offset-2 outline-rose-500/20"
              >
                Yes, Delete Driver
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
        message: "Driver deleted successfully",
        type: "success",
      });
      closeModal("delete-driver");
      Table.boot();
    }
  }, [removeResult?.isSuccess]);

  return (
    <Page className="h-full flex flex-col min-h-0">
      <Page.Header
        pillLabel="MASTER DATA"
        pillIcon={<Database size={12} strokeWidth={2.5} />}
        title="Driver Directory"
        titleClassName="text-3xl font-black text-slate-900 tracking-tight leading-none mb-1"
        subtitle="Manage fleet operators, licenses, and performance profiles."
        subtitleClassName="text-sm text-slate-500 font-medium tracking-wide mt-1"
        action={
          <Button
            className="rounded-full shadow-lg text-[15px] font-bold tracking-wide bg-emerald-600 text-white border border-emerald-700 outline outline-2 outline-offset-2 outline-emerald-500/20 hover:bg-emerald-500 transition-colors h-13 px-10"
            onClick={openCreate}
          >
            + Add Driver
          </Button>
        }
      />

      <Page.Body>
        <Table.Tools>
          <TableFilter table={Table} />
        </Table.Tools>
        <Table.Render 
          emptyTitle="No Drivers Found"
          emptyDescription="Get started by creating your first driver using the button above."
        />
        <Table.Pagination />
      </Page.Body>
    </Page>
  );
};

export default DriverListPage;
