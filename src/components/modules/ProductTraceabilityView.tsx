/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AETHER–AROS V2 - Agricultural Product Traceability & Chain-of-Custody Module
 * African Economic, Agricultural & Resilience Operating System
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useState } from 'react';
import { ApiClient } from '../../services/apiClient.ts';
import { ProductTraceabilityRecord } from '../../types/index.ts';
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  AlertCircle,
  Truck,
  Building,
  Sprout,
  FileCheck,
  MapPin,
  Calendar,
  Layers,
} from 'lucide-react';

interface ProductTraceabilityViewProps {
  currentUser?: any;
}

export const ProductTraceabilityView: React.FC<ProductTraceabilityViewProps> = () => {
  const [batchQuery, setBatchQuery] = useState<string>('BATCH-ELGON-AA-2026-09');
  const [traceRecord, setTraceRecord] = useState<ProductTraceabilityRecord | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!batchQuery.trim()) return;

    try {
      setIsLoading(true);
      setErrorMsg(null);
      const data = await ApiClient.getTraceabilityBatch(batchQuery.trim());
      setTraceRecord(data);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Batch record not found');
      setTraceRecord(null);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    handleSearch();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#121212] border border-[#27272a] rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-cyan-950/50 border border-cyan-800 flex items-center justify-center text-xl font-bold text-cyan-300">
              <ShieldCheck size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-[#F5F5F5]">Verifiable Product Traceability</h1>
                <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800 px-2 py-0.5 rounded font-mono font-medium">
                  Farm-to-Terminal Ledger
                </span>
              </div>
              <p className="text-xs text-[#A0A0A0] mt-1">
                Audited chain of custody from volcanic farm plot harvest to laboratory phyto-inspection, aggregation silo, and carrier transit.
              </p>
            </div>
          </div>
        </div>

        {/* Batch Lookup Input */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-3 text-[#71717a]" />
            <input
              type="text"
              placeholder="Enter batch number (e.g. BATCH-ELGON-AA-2026-09)..."
              value={batchQuery}
              onChange={(e) => setBatchQuery(e.target.value)}
              className="w-full bg-[#18181b] border border-[#27272a] rounded-lg pl-9 pr-4 py-2.5 text-xs text-[#F5F5F5] font-mono focus:border-[#D4AF37] outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="px-5 py-2.5 bg-[#D4AF37] hover:bg-[#e5bf43] disabled:opacity-50 text-black font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5"
          >
            {isLoading ? 'Verifying...' : 'Verify Chain of Custody'}
          </button>
        </form>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-950/60 border border-red-800 text-red-300 rounded text-xs flex items-center gap-2">
          <AlertCircle size={15} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Trace Record Output */}
      {traceRecord && (
        <div className="space-y-6">
          {/* Batch Summary Card */}
          <div className="bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#1e1e24] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm text-[#D4AF37]">{traceRecord.batchNumber}</span>
                  <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded font-semibold flex items-center gap-1">
                    <CheckCircle2 size={12} /> Certified Traceable
                  </span>
                </div>
                <h2 className="text-base font-bold text-[#F5F5F5] mt-1">{traceRecord.commodity}</h2>
                <p className="text-xs text-[#A0A0A0]">Variety: {traceRecord.variety} • Quality: {traceRecord.qualityGrade}</p>
              </div>

              <div className="bg-[#09090b] p-3 rounded-lg border border-[#1f1f23] text-xs space-y-0.5">
                <div className="text-[#71717a] text-[10px]">Phytosanitary Certification</div>
                <div className="font-mono font-bold text-[#F5F5F5]">{traceRecord.inspectionCertificate || 'Pending Lab Audit'}</div>
                <div className="text-[10px] text-emerald-400">Issued by UCDA Regional Phyto Lab</div>
              </div>
            </div>

            {/* Farm Origin Details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-[#09090b] p-3 rounded-lg border border-[#1f1f23]">
                <span className="text-[10px] uppercase font-semibold text-[#71717a] flex items-center gap-1">
                  <Sprout size={12} className="text-[#D4AF37]" /> Producer & Farm Origin
                </span>
                <div className="font-bold text-[#F5F5F5] mt-1">{traceRecord.producerName}</div>
                <div className="text-[11px] text-[#A0A0A0]">{traceRecord.farmName}</div>
              </div>

              <div className="bg-[#09090b] p-3 rounded-lg border border-[#1f1f23]">
                <span className="text-[10px] uppercase font-semibold text-[#71717a] flex items-center gap-1">
                  <Calendar size={12} className="text-blue-400" /> Harvest Milestone
                </span>
                <div className="font-bold text-[#F5F5F5] mt-1">{traceRecord.harvestDate}</div>
                <div className="text-[11px] text-[#A0A0A0]">Selectively Hand-Picked Ripe</div>
              </div>

              <div className="bg-[#09090b] p-3 rounded-lg border border-[#1f1f23]">
                <span className="text-[10px] uppercase font-semibold text-[#71717a] flex items-center gap-1">
                  <Truck size={12} className="text-orange-400" /> Carrier Waybill Link
                </span>
                <div className="font-bold text-[#F5F5F5] mt-1">Vehicle {traceRecord.vehicleRegistration || 'Canter Fleet'}</div>
                <div className="text-[11px] text-[#A0A0A0]">Rwenzori Inter-District Haulage</div>
              </div>
            </div>
          </div>

          {/* Chronological Event History */}
          <div className="bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-[#F5F5F5] uppercase tracking-wider flex items-center gap-2">
              <Layers size={16} className="text-[#D4AF37]" /> Chain of Custody Event Audit ({traceRecord.events.length} Milestones)
            </h3>

            <div className="space-y-4 relative pl-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#27272a]">
              {traceRecord.events.map((evt, idx) => (
                <div key={idx} className="relative">
                  <div className="absolute -left-6 top-1.5 w-3.5 h-3.5 rounded-full bg-[#D4AF37] border-2 border-[#121212]" />
                  <div className="bg-[#09090b] p-3.5 rounded-lg border border-[#1f1f23] space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-[#F5F5F5]">{evt.eventType}</span>
                      <span className="text-[10px] font-mono text-[#71717a]">
                        {new Date(evt.timestamp).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-[#A0A0A0]">
                      <span className="flex items-center gap-1">
                        <MapPin size={11} className="text-[#D4AF37]" /> {evt.location}
                      </span>
                      <span>•</span>
                      <span>Authorized Actor: <strong className="text-[#F5F5F5]">{evt.actorName}</strong></span>
                    </div>

                    {evt.notes && (
                      <p className="text-[11px] text-[#A0A0A0] bg-[#18181b] p-2 rounded border border-[#27272a] mt-1">
                        {evt.notes}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
