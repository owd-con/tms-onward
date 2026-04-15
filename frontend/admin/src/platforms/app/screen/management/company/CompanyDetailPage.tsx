/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import {
  Building2,
  Database,
  Phone,
  MapPin,
} from "lucide-react";
import { FaEdit } from "react-icons/fa";

import { Button, useEnigmaUI, Badge } from "@/components";
import { useCompany } from "@/services/company/hooks";
import type { Company } from "@/services/types";
import { Page } from "@/platforms/app/components/layout/index";
import CompanyEditModal from "./components/CompanyEditModal";

// Helper to format date
const formatDate = (dateString?: string) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// Helper to get company type label
const getCompanyTypeLabel = (type?: string) => {
  if (type === "3pl") return "3PL Provider";
  if (type === "carrier") return "Carrier";
  return type || "-";
};



const CompanyDetailPage = () => {
  const { openModal, closeModal } = useEnigmaUI();
  const { getCompany, getCompanyResult } = useCompany();

  const [company, setCompany] = useState<Company | null>(null);

  // Load company data on mount
  useEffect(() => {
    const loadCompany = async () => {
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
      <Page className="h-full flex flex-col min-h-0">
        <Page.Header
          pillLabel="MANAGEMENT"
          pillIcon={<Database size={12} strokeWidth={2.5} />}
          title="Company Profile"
          titleClassName="text-3xl font-black text-slate-900 tracking-tight leading-none mb-1"
          subtitle="Manage your company identity, contact details, and regional preferences."
          subtitleClassName="text-sm text-slate-500 font-medium tracking-wide mt-1"
        />
        <Page.Body className="flex-1 flex items-center justify-center">
          <div className="loading loading-spinner loading-lg"></div>
        </Page.Body>
      </Page>
    );
  }

  return (
    <Page className="h-full flex flex-col min-h-0">
      <Page.Header
        pillLabel="MANAGEMENT"
        pillIcon={<Database size={12} strokeWidth={2.5} />}
        title="Company Profile"
        titleClassName="text-3xl font-black text-slate-900 tracking-tight leading-none mb-1"
        subtitle="Manage your company identity, contact details, and regional preferences."
        subtitleClassName="text-sm text-slate-500 font-medium tracking-wide mt-1"
        action={
          <Button
            className="rounded-full shadow-lg text-[15px] font-bold tracking-wide bg-emerald-600 text-white border border-emerald-700 outline outline-2 outline-offset-2 outline-emerald-500/20 hover:bg-emerald-500 transition-colors h-13 px-10 flex items-center gap-2"
            onClick={handleEditModal}
          >
            <FaEdit className="w-4 h-4" /> Edit Company
          </Button>
        }
      />

      <Page.Body className="flex-1 min-h-0 overflow-y-auto">
        {/* Deep immersive brand header */}
        <div className="relative bg-emerald-900 px-6 py-12 md:py-20 lg:px-12 flex items-center justify-between overflow-hidden">
          {/* Abstract pattern / glow */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-emerald-700/30 blur-3xl mix-blend-screen pointer-events-none"></div>
          <div className="absolute bottom-0 left-10 w-64 h-64 rounded-full bg-emerald-950/40 blur-3xl mix-blend-multiply pointer-events-none"></div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-6 md:gap-8 max-w-5xl mx-auto w-full">
            {/* Massive Logo Frame */}
             {company?.logo_url ? (
               <div className="relative">
                 <img src={company.logo_url} alt="Logo" className="w-24 h-24 md:w-32 md:h-32 rounded-2xl object-cover ring-4 ring-emerald-800/50 shadow-2xl bg-white" />
                 <div className="absolute -bottom-2 -right-2 bg-emerald-500 rounded-full w-8 h-8 ring-4 ring-emerald-900 flex items-center justify-center shadow-lg"><Building2 className="w-4 h-4 text-white" /></div>
               </div>
             ) : (
               <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-50 ring-4 ring-emerald-800/50 flex items-center justify-center shrink-0 shadow-2xl relative">
                 <Building2 className="w-12 h-12 text-emerald-600" />
                 <div className="absolute -bottom-2 -right-2 bg-emerald-500 rounded-full w-8 h-8 ring-4 ring-emerald-900 shadow-lg border-2 border-emerald-400"></div>
               </div>
             )}

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-3">
                 <Badge variant={company?.is_active ? "success" : "error"} className={`px-3 py-1 text-[10px] sm:text-xs font-bold uppercase tracking-widest rounded-full border-0 ${company?.is_active ? 'bg-emerald-400 text-emerald-950' : 'bg-red-400 text-red-950'}`}>
                    {company?.is_active ? "Verified Active" : "Inactive"}
                 </Badge>
              </div>
              <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-2 shadow-sm drop-shadow-md">
                {company?.company_name || "-"}
              </h1>
              <p className="text-emerald-100/90 font-medium text-lg md:text-xl tracking-wide flex items-center gap-2.5 mt-2">
                {company?.brand_name && (
                  <>
                    <span>{company?.brand_name}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/80"></span>
                  </>
                )}
                <span className="text-emerald-300 font-bold">{getCompanyTypeLabel(company?.type)}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Floating Data Canvas */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 -mt-10 md:-mt-14 pb-12">
            <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 p-6 md:p-10 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 flex flex-col sm:flex-row gap-6 sm:gap-0">

               {/* Contact Core */}
               <div className="flex-1 sm:pr-10 space-y-8">
                  <div className="flex items-start gap-4">
                     <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100/50">
                        <Phone className="w-5 h-5" />
                     </div>
                     <div>
                        <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Direct Line</h4>
                        <p className="text-lg font-bold text-slate-800">{company?.phone || "-"}</p>
                     </div>
                  </div>

                  <div className="flex items-start gap-4">
                     <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 border border-orange-100/50">
                        <MapPin className="w-5 h-5" />
                     </div>
                     <div>
                        <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Registered Headquarters</h4>
                        <p className="text-sm font-medium text-slate-600 leading-relaxed max-w-sm">{company?.address || "-"}</p>
                     </div>
                  </div>
               </div>

               {/* System Vault */}
               <div className="flex-1 sm:pl-10 pt-6 sm:pt-0 space-y-8">
                  <div className="flex items-start gap-4">
                     <div className="w-12 h-12 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center shrink-0 border border-slate-200">
                        <Database className="w-5 h-5" />
                     </div>
                     <div>
                        <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">System Identifier</h4>
                        <code className="text-xs font-mono font-bold text-slate-800 bg-slate-100/80 px-2.5 py-1.5 rounded-md border border-slate-200/60 block">{company?.id || "-"}</code>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Onboarding</h4>
                        <p className="text-sm font-bold text-slate-800">{company?.onboarding_completed ? "Completed" : "Pending"}</p>
                     </div>
                     <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Record Created</h4>
                        <p className="text-sm font-bold text-slate-800">{formatDate(company?.created_at).split(',')[0]}</p>
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
