/* eslint-disable react-hooks/exhaustive-deps */

import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { HiUser } from "react-icons/hi2";
import { Database } from "lucide-react";

import useTable from "@/services/table/hooks";
import type { TableConfig } from "@/services/table/const";

import { Button } from "@/components";
import type { Customer } from "@/services/types";
import { useCustomer } from "@/services/customer/hooks";

import { Page } from "../../../components/layout";
import createTableConfig from "./components/table/table.config";
import TableFilter from "./components/table/filter";
import CustomerFormModal from "./components/form/CustomerFormModal";
import { useEnigmaUI } from "@/components";

/**
 * TMS Onward - Customer List Page
 */
const CustomerListPage = () => {
  const { openModal, closeModal, showToast } = useEnigmaUI();
  const navigate = useNavigate();
  const customer = useCustomer();

  const tableConfig = useMemo(() => {
    return createTableConfig({
      onReload: () => {
        Table.boot();
      },
      onClick: (e: Customer) => {
        navigate(`/a/master-data/customers/${e.id}`);
      },
      onToggleStatus: async (row: Customer, newStatus: boolean) => {
        try {
          if (newStatus) {
            await customer.activate({ id: row.id });
            showToast({
              message: "Customer activated successfully",
              type: "success",
            });
          } else {
            await customer.deactivate({ id: row.id });
            showToast({
              message: "Customer deactivated successfully",
              type: "success",
            });
          }
          Table.boot();
        } catch (error) {
          // Error will be handled by FormState/toast automatically
          Table.boot();
        }
      },
    });
  }, [customer, showToast]);

  const Table = useTable("customer", tableConfig as TableConfig<unknown>);

  // Open create modal
  const openCreate = () => {
    openModal({
      id: "create-customer",
      content: (
        <CustomerFormModal
          onClose={() => closeModal("create-customer")}
          onSuccess={() => Table.boot()}
          mode='create'
        />
      ),
    });
  };

  return (
    <Page className='h-full flex flex-col min-h-0'>
      <Page.Header
        pillLabel="MASTER DATA"
        pillIcon={<Database size={12} strokeWidth={2.5} />}
        title="Customer Management"
        titleClassName="text-3xl font-black text-slate-900 tracking-tight leading-none mb-1"
        subtitle="Maintain client records, configurations, and address registries."
        subtitleClassName="text-sm text-slate-500 font-medium tracking-wide mt-1"
        action={
          <Button variant='primary' onClick={openCreate}>
            + Add Customer
          </Button>
        }
      />

      <Page.Body className='flex-1 flex flex-col space-y-3 lg:space-y-4 min-h-0'>
        <div className='w-full flex gap-2 lg:gap-4 bg-base-100 p-2 rounded-xl'>
          <div className='w-full'>
            <Table.Tools>
              <TableFilter table={Table} />
            </Table.Tools>
          </div>
        </div>
        <div className='bg-base-100 rounded-xl shadow-sm w-full overflow-x-auto'>
          {Table.State?.data &&
          Table.State.data.length === 0 &&
          !Table.State.loading ? (
            <div className='flex flex-col items-center justify-center h-48 lg:h-64 gap-3 lg:gap-4 px-4'>
              <div className='text-base-content/40 text-4xl lg:text-6xl'>
                <HiUser />
              </div>
              <div className='text-center'>
                <h3 className='text-base lg:text-lg font-semibold'>
                  No Customers Found
                </h3>
                <p className='text-base-content/60 mt-1 text-sm lg:text-base'>
                  Get started by creating your first customer using the button above.
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

export default CustomerListPage;
