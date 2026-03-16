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
              size="sm"
              variant="primary"
              className="hover:text-white"
              onClick={handleOpenModal}
            >
              Add Team Member
            </Button>
          )
        }
      />
      <Page.Body className="flex-1 flex flex-col space-y-3 lg:space-y-4 min-h-0">
        <div className="w-full">
          <Table.Tools />
        </div>
        <div className="bg-base-100 rounded-xl shadow-sm w-full overflow-x-auto">
          <Table.Render />
          <Table.Pagination />
        </div>
      </Page.Body>
    </Page>
  );
};
export default TeamScreen;
