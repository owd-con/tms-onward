/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";

import { Button, useEnigmaUI } from "@/components";
import { Database } from "lucide-react";
import { useCompany } from "@/services/company/hooks";
import type { Company } from "@/services/types";
import { Page } from "@/platforms/app/components/layout/index";
import CompanyEditModal from "./components/CompanyEditModal";

const CompanyDetailPage = () => {
  const { openModal, closeModal } = useEnigmaUI();
  const { getCompany, getCompanyResult } = useCompany();

  const [company, setCompany] = useState<Company | null>(null);

  // Load company data on mount
  useEffect(() => {
    const loadCompany = async () => {
      try {
        const result = await getCompany();
        // Handle different response structures
        if (result) {
          const companyData = Array.isArray(result?.data)
            ? result.data[0]
            : result?.data;
          if (companyData) {
            setCompany(companyData);
          }
        }
      } catch (error) {
        console.error("Failed to load company:", error);
      }
    };

    loadCompany();
  }, []);

  const handleEditModal = () => {
    if (!company) return;

    openModal({
      id: "edit-company",
      content: (
        <CompanyEditModal
          data={company ?? undefined}
          onClose={() => closeModal("edit-company")}
          onReload={async () => {
            try {
              const result = await getCompany();
              if (result) {
                const companyData = Array.isArray(result?.data)
                  ? result.data[0]
                  : result?.data;
                if (companyData) {
                  setCompany(companyData);
                }
              }
            } catch (error) {
              console.error("Failed to reload company:", error);
            }
          }}
        />
      ),
    });
  };

  // Loading state
  if (getCompanyResult.isLoading) {
    return (
      <Page className='h-full flex flex-col min-h-0'>
        <Page.Header
          pillLabel="MANAGEMENT"
          pillIcon={<Database size={12} strokeWidth={2.5} />}
          title='Company Configuration'
          titleClassName='text-3xl font-black text-slate-900 tracking-tight leading-none mb-1'
          subtitle='Manage your core business entity details and branding.'
          subtitleClassName="text-sm text-slate-500 font-medium tracking-wide mt-1"
        />
        <Page.Body className='flex-1 flex items-center justify-center'>
          <div className='loading loading-spinner loading-lg'></div>
        </Page.Body>
      </Page>
    );
  }

  return (
    <Page className='h-full flex flex-col min-h-0'>
      <Page.Header
        pillLabel="MANAGEMENT"
        pillIcon={<Database size={12} strokeWidth={2.5} />}
        title='Company Configuration'
        titleClassName='text-3xl font-black text-slate-900 tracking-tight leading-none mb-1'
        subtitle='Manage your core business entity details and branding.'
        subtitleClassName="text-sm text-slate-500 font-medium tracking-wide mt-1"
        action={
          <Button
            size='sm'
            variant='primary'
            className='hover:text-white'
            onClick={handleEditModal}
          >
            Edit Company
          </Button>
        }
      />
      <Page.Body className='flex-1 flex flex-col space-y-3 lg:space-y-4 min-h-0'>
        <div className='bg-base-100 rounded-xl shadow-sm w-full'>
          <div className='p-6'>
            <div className='flex items-start gap-6'>
              {/* Logo Section */}
              <div className='flex-shrink-0'>
                {company?.logo_url ? (
                  <img
                    src={company.logo_url}
                    alt='Company Logo'
                    className='w-24 h-24 rounded-lg object-cover border border-base-300'
                  />
                ) : (
                  <div className='w-24 h-24 rounded-lg bg-base-300 border border-base-300 flex items-center justify-center'>
                    <span className='text-3xl text-base-content/40'>
                      {company?.name?.charAt(0)?.toUpperCase() || "C"}
                    </span>
                  </div>
                )}
              </div>

              {/* Company Info */}
              <div className='flex-1 space-y-4'>
                <div>
                  <h2 className='text-xl font-bold text-base-content'>
                    {company?.name || "-"}
                  </h2>
                  <p className='text-sm text-base-content/60 mt-1'>
                    Company Type:{" "}
                    <span className='font-semibold'>
                      {company?.type || "-"}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Page.Body>
    </Page>
  );
};

export default CompanyDetailPage;
