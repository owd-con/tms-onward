/* eslint-disable react-hooks/exhaustive-deps */

import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
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
          <Button
            className="rounded-full shadow-lg text-[15px] font-bold tracking-wide bg-emerald-600 text-white border border-emerald-700 outline outline-2 outline-offset-2 outline-emerald-500/20 hover:bg-emerald-500 transition-colors h-13 px-10"
            onClick={openCreate}
          >
            + Add Customer
          </Button>
        }
      />

      <Page.Body>
        <Table.Tools>
          <TableFilter table={Table} />
        </Table.Tools>
        <Table.Render 
          emptyTitle="No Customers Found"
          emptyDescription="Get started by creating your first customer using the button above."
        />
        <Table.Pagination />
      </Page.Body>
    </Page>
  );
};

export default CustomerListPage;
