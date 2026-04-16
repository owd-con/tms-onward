/* eslint-disable react-hooks/exhaustive-deps */
import { useMemo, useEffect } from "react";

import useTable from "@/services/table/hooks";
import type { TableConfig } from "@/services/table/const";
import { Button, useEnigmaUI } from "@/components";
import { usePermission } from "@/hooks/usePermission";
import { Database } from "lucide-react";

import { useUser } from "@/services/user/hooks";
import createTableConfig from "./components/table/table.config.team";
import UserModal from "./components/modal/user.modal";

import { Page } from "../../components/layout";
import type { User } from "@/services/types";
import UserDelete from "./components/modal/user.delete";

const TeamScreen = () => {
  const { canManage } = usePermission();
  const { openModal, closeModal, showToast } = useEnigmaUI();
  const { activate, deactivate, activateResult, deactivateResult } = useUser();

  const tableConfig = useMemo(() => {
    return createTableConfig({
      canManage: canManage("user"),
      filter: { not_role: "driver" },
      onReload: () => {
        Table.boot();
      },
      onEdit: (v) => {
        handleUpdateModal(v);
      },
      onRemove: (v) => {
        handleDeleteModal(v);
      },
      onToggleStatus: async (row: User, newStatus: boolean) => {
        if (newStatus) {
          await activate({ id: row.id });
        } else {
          await deactivate({ id: row.id });
        }
      },
    });
  }, []);

  const Table = useTable("user", tableConfig as TableConfig<unknown>);

  const handleOpenModal = () => {
    openModal({
      id: "create-user",
      content: (
        <UserModal
          onClose={() => closeModal("create-user")}
          onReload={() => Table.boot()}
        />
      ),
    });
  };

  const handleDeleteModal = (v: User) => {
    openModal({
      id: "delete-user",
      content: (
        <UserDelete
          data={v}
          onClose={() => closeModal("delete-user")}
          onReload={() => Table.boot()}
        />
      ),
    });
  };

  const handleUpdateModal = (v: User) => {
    openModal({
      id: "update-user",
      content: (
        <UserModal
          data={v}
          onClose={() => closeModal("update-user")}
          onReload={() => Table.boot()}
        />
      ),
    });
  };

  // Handle activate/deactivate success
  useEffect(() => {
    if (activateResult?.isSuccess) {
      showToast({
        message: "User activated successfully",
        type: "success",
      });
      Table.boot();
    }
  }, [activateResult?.isSuccess]);

  useEffect(() => {
    if (deactivateResult?.isSuccess) {
      showToast({
        message: "User deactivated successfully",
        type: "success",
      });
      Table.boot();
    }
  }, [deactivateResult?.isSuccess]);

  return (
    <Page className="h-full flex flex-col min-h-0">
      <Page.Header
        pillLabel="MANAGEMENT"
        pillIcon={<Database size={12} strokeWidth={2.5} />}
        title="Team Directory"
        titleClassName="text-3xl font-black text-slate-900 tracking-tight leading-none mb-1"
        subtitle="Manage operators, system roles, and platform access control."
        subtitleClassName="text-sm text-slate-500 font-medium tracking-wide mt-1"
        action={
          canManage("user") && (
            <Button
              className="rounded-full shadow-lg text-[15px] font-bold tracking-wide bg-emerald-600 text-white border border-emerald-700 outline outline-2 outline-offset-2 outline-emerald-500/20 hover:bg-emerald-500 transition-colors h-13 px-10"
              onClick={handleOpenModal}
            >
              Add Team Member
            </Button>
          )
        }
      />
      <Page.Body>
        <Table.Tools />
        <Table.Render 
          emptyTitle="No Team Members Found"
          emptyDescription="Get started by adding your first team member using the button above."
        />
        <Table.Pagination />
      </Page.Body>
    </Page>
  );
};
export default TeamScreen;
