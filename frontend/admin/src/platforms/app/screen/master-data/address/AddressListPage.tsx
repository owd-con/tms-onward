/* eslint-disable react-hooks/exhaustive-deps */

import { useEffect, useMemo, useRef } from "react";
import { MapPin } from "lucide-react";

import useTable from "@/services/table/hooks";
import type { TableConfig } from "@/services/table/const";

import { Button, Modal, useEnigmaUI } from "@/components";
import type { Address } from "@/services/types";
import { useAddress } from "@/services/address/hooks";

import { Page } from "../../../components/layout";
import TableFilter from "./components/table/filter";
import createTableConfig from "./components/table/table.config";
import AddressFormModal from "../../../components/address/AddressFormModal";

/**
 * TMS Onward - Address List Page
 */
const AddressListPage = () => {
  const { openModal, closeModal, showToast } = useEnigmaUI();
  const { remove, removeResult, activate, deactivate } = useAddress();

  // Track delete success agar hanya handle sekali per delete
  const deleteSuccessHandledRef = useRef(false);

  const tableConfig = useMemo(() => {
    return createTableConfig({
      onReload: () => {
        Table.boot();
      },
      onClick: (e: Address, action: string) => {
        if (action === "update") {
          openUpdate(e);
        } else if (action === "delete") {
          openDeleteConfirm(e);
        }
      },
      onToggleStatus: async (row: Address, newStatus: boolean) => {
        try {
          if (newStatus) {
            await activate({ id: row.id });
            showToast({ message: "Location activated successfully", type: "success" });
          } else {
            await deactivate({ id: row.id });
            showToast({ message: "Location deactivated successfully", type: "success" });
          }
          Table.boot();
        } catch (error) {
          Table.boot();
        }
      },
    });
  }, [activate, deactivate, showToast]);

  const Table = useTable("address", tableConfig as TableConfig<unknown>);

  // Open create modal
  const openCreate = () => {
    openModal({
      id: "create-address",
      content: (
        <AddressFormModal
          open={true}
          onClose={() => closeModal("create-address")}
          onSuccess={() => Table.boot()}
          mode="create"
        />
      ),
    });
  };

  // Open update modal
  const openUpdate = (address: Address) => {
    openModal({
      id: "update-address",
      content: (
        <AddressFormModal
          open={true}
          onClose={() => closeModal("update-address")}
          onSuccess={() => Table.boot()}
          mode="update"
          data={address}
        />
      ),
    });
  };

  // Open delete confirmation modal
  const openDeleteConfirm = (address: Address) => {
    // Reset ref agar delete success yang baru bisa di-handle
    deleteSuccessHandledRef.current = false;

    openModal({
      id: "delete-address",
      content: (
        <Modal.Wrapper
          open={true}
          onClose={() => closeModal("delete-address")}
          closeOnOutsideClick={true}
          className="!max-w-md !w-11/12 mx-4"
        >
          <Modal.Header className="mb-4">
            <div className="text-rose-600 font-bold leading-7 text-lg">
              Delete Location Record
            </div>
            <div className="text-sm text-slate-500 leading-5 font-normal">
              This action is permanent and cannot be undone. Are you sure?
            </div>
          </Modal.Header>

          <Modal.Body>
            <div className="bg-rose-50/50 border border-rose-100/60 p-5 rounded-2xl">
              <p className="text-sm text-rose-900/60 font-medium mb-3">You are about to delete:</p>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-rose-100 flex flex-col gap-1">
                <p className="font-bold text-slate-800">{address.name}</p>
                <p className="text-sm text-slate-500 font-medium">
                  {address.address || "No Address Recorded"}
                </p>
              </div>
            </div>
          </Modal.Body>

          <Modal.Footer>
            {removeResult?.isError && (
              <div className="mb-3 text-sm font-semibold text-rose-500">
                Failed to delete location. Please try again.
              </div>
            )}
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => closeModal("delete-address")}
                disabled={removeResult?.isLoading}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="error"
                isLoading={removeResult?.isLoading}
                onClick={() => remove({ id: address.id })}
                className="bg-rose-600 hover:bg-rose-700 text-white shadow-md border border-rose-700 outline outline-2 outline-offset-2 outline-rose-500/20"
              >
                Yes, Delete Location
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
        message: "Location deleted successfully",
        type: "success",
      });
      closeModal("delete-address");
      Table.boot();
    }
  }, [removeResult?.isSuccess]);

  return (
    <Page className="h-full flex flex-col min-h-0">
      <Page.Header
        pillLabel="MASTER DATA"
        pillIcon={<MapPin size={12} strokeWidth={2.5} />}
        title="Location Directory"
        titleClassName="text-3xl font-black text-slate-900 tracking-tight leading-none mb-1"
        subtitle="Manage company locations for pickup and delivery."
        subtitleClassName="text-sm text-slate-500 font-medium tracking-wide mt-1"
        action={
          <Button
            className="rounded-full shadow-lg text-[15px] font-bold tracking-wide bg-emerald-600 text-white border border-emerald-700 outline outline-2 outline-offset-2 outline-emerald-500/20 hover:bg-emerald-500 transition-colors h-13 px-10"
            onClick={openCreate}
          >
            + Add Location
          </Button>
        }
      />

      <Page.Body>
        <Table.Tools>
          <TableFilter table={Table} />
        </Table.Tools>
        <Table.Render
          emptyTitle="No Locations Found"
          emptyDescription="Get started by creating your first location using the button above."
        />
        <Table.Pagination />
      </Page.Body>
    </Page>
  );
};

export default AddressListPage;