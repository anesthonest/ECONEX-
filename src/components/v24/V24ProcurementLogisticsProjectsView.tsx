/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ECONEX V24.0 - Segregated Procurement & 3-Way Match, Corridor Logistics & Project Milestone Controls
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Briefcase,
  ClipboardCheck,
  RefreshCw,
  Truck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { ApiClient } from '../../services/apiClient.ts';
import type {
  V24CommercialParticipant,
  V24CommercialProject,
  V24LogisticsShipment,
  V24ProcurementCategory,
  V24ProcurementRequest,
  V24ProjectType,
  V24PurchaseOrder,
  V24RegionalCorridorGuide,
} from '../../types/index.ts';

interface Props {
  onNavigate: (tab: string) => void;
}

function fmtMinor(minor: number, currency = 'UGX'): string {
  return `${currency} ${(Number(minor || 0) / 100).toLocaleString('en-US', {
    minimumFractionDigits: currency === 'UGX' ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

export const V24ProcurementLogisticsProjectsView: React.FC<Props> = ({ onNavigate }) => {
  const { currentUser, role } = useAuth();
  const actor = useMemo(
    () => ({ userId: currentUser?.id || 'usr_buyer_01', userRole: role }),
    [currentUser?.id, role]
  );

  const [tab, setTab] = useState<'PROCUREMENT' | 'LOGISTICS' | 'PROJECTS'>('PROCUREMENT');
  const [participants, setParticipants] = useState<V24CommercialParticipant[]>([]);
  const [requests, setRequests] = useState<V24ProcurementRequest[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<V24PurchaseOrder[]>([]);
  const [corridors, setCorridors] = useState<V24RegionalCorridorGuide[]>([]);
  const [shipments, setShipments] = useState<V24LogisticsShipment[]>([]);
  const [projects, setProjects] = useState<V24CommercialProject[]>([]);

  // Procurement form
  const [procTitle, setProcTitle] = useState<string>('');
  const [procCategory, setProcCategory] = useState<V24ProcurementCategory>('ENTERPRISE_INTERNAL');
  const [procBudgetMajor, setProcBudgetMajor] = useState<number>(3500000);
  const [grnInput, setGrnInput] = useState<string>('GRN-V24-001');
  const [invInput, setInvInput] = useState<string>('DOC-V24-001');

  // Shipment form
  const [corridorCode, setCorridorCode] = useState<string>('CORR-UG-KE-MALABA');
  const [vehiclePlate, setVehiclePlate] = useState<string>('UBG 412T');
  const [reportedLoc, setReportedLoc] = useState<string>('Malaba Border Approach');

  // Project form
  const [projTitle, setProjTitle] = useState<string>('');
  const [projType, setProjType] = useState<V24ProjectType>('CONSTRUCTION');
  const [projContractorId, setProjContractorId] = useState<string>('PRTC-V24-003');
  const [projBudgetMajor, setProjBudgetMajor] = useState<number>(8000000);

  const [loading, setLoading] = useState<boolean>(true);
  const [busy, setBusy] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [partRes, reqRes, poRes, corRes, shpRes, prjRes] = await Promise.all([
        ApiClient.v24GetParticipants({}, actor),
        ApiClient.v24GetProcurementRequests(actor),
        ApiClient.v24GetPurchaseOrders(actor),
        ApiClient.v24GetCorridors(),
        ApiClient.v24GetShipments(actor),
        ApiClient.v24GetProjects(actor),
      ]);
      setParticipants(partRes.participants || []);
      setRequests(reqRes.requests || []);
      setPurchaseOrders(poRes.purchaseOrders || []);
      setCorridors(corRes.corridors || []);
      setShipments(shpRes.shipments || []);
      setProjects(prjRes.projects || []);
    } catch (e: any) {
      setError(e?.message || 'Unable to load Procurement, Logistics & Projects.');
    } finally {
      setLoading(false);
    }
  }, [actor]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const myParticipant = useMemo(
    () => participants.find((p) => p.userId === actor.userId || p.authorizedRepresentatives.some((r) => r.userId === actor.userId)),
    [participants, actor.userId]
  );

  const handleCreateProcurement = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await ApiClient.v24CreateProcurementRequest(
        {
          buyerParticipantId: myParticipant?.id,
          category: procCategory,
          title: procTitle,
          specifications: procTitle,
          estimatedBudgetMinor: Math.round(procBudgetMajor * 100),
          currency: 'UGX',
        },
        actor
      );
      setFeedback(`Submitted procurement request ${res.request?.id}. Approver must differ from requester.`);
      setProcTitle('');
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Unable to create procurement request.');
    } finally {
      setBusy(false);
    }
  };

  const handleApproveProcurement = async (id: string, approve: boolean) => {
    setBusy(true);
    setError(null);
    try {
      await ApiClient.v24ApproveProcurementRequest(id, { approve, note: approve ? 'Approved' : 'Rejected' }, actor);
      setFeedback(`Procurement request ${id} ${approve ? 'APPROVED' : 'REJECTED'}.`);
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Segregation of Duties blocked self-approval.');
    } finally {
      setBusy(false);
    }
  };

  const handleThreeWayMatch = async (poId: string) => {
    setBusy(true);
    setError(null);
    try {
      const res = await ApiClient.v24PerformThreeWayMatch(
        poId,
        { goodsReceivedNoteId: grnInput, invoiceId: invInput },
        actor
      );
      setFeedback(`3-Way Match result for ${poId}: ${res.status} (${res.purchaseOrder?.threeWayMatchStatus}).`);
      await loadData();
    } catch (err: any) {
      setError(err?.message || '3-way match failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleCreateShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const cor = corridors.find((c) => c.corridorCode === corridorCode) || corridors[0];
      const res = await ApiClient.v24CreateShipment(
        {
          corridorCode,
          originCountry: cor?.originCountry || 'KE',
          destinationCountry: cor?.destinationCountry || 'UG',
          originLocation: 'Mombasa Port',
          destinationLocation: 'Kampala Depot',
          vehiclePlate,
          freightFeeMinor: 42000000,
          currency: 'UGX',
        },
        actor
      );
      setFeedback(`Created shipment ${res.shipment?.shipmentRef} (gpsClaimed: false).`);
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Unable to create shipment.');
    } finally {
      setBusy(false);
    }
  };

  const handleTransitionShipment = async (shp: V24LogisticsShipment, nextStatus: string) => {
    setBusy(true);
    setError(null);
    try {
      await ApiClient.v24TransitionShipment(
        shp.id,
        {
          nextStatus,
          reportedLocation: reportedLoc,
          locationSource: 'CARRIER_SELF_REPORT',
          note: `Status updated to ${nextStatus}`,
        },
        actor
      );
      setFeedback(`Shipment ${shp.shipmentRef} updated to ${nextStatus} (reported location only).`);
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Shipment update rejected.');
    } finally {
      setBusy(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const clientId = myParticipant?.id || 'PRTC-V24-002';
      const contractorId = projContractorId === clientId ? 'PRTC-V24-003' : projContractorId;
      const res = await ApiClient.v24CreateProject(
        {
          title: projTitle,
          projectType: projType,
          clientParticipantId: clientId,
          contractorParticipantId: contractorId,
          scope: projTitle,
          milestones: [
            { title: 'Mobilisation & Design', deliverableSummary: 'Approved drawings', budgetMinor: Math.round(projBudgetMajor * 40) },
            { title: 'Execution & Handover', deliverableSummary: 'Signed inspection certificate', budgetMinor: Math.round(projBudgetMajor * 60) },
          ],
          currency: 'UGX',
        },
        actor
      );
      setFeedback(`Created project ${res.project?.id} (autoEscrowRelease: false).`);
      setProjTitle('');
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Project creation failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleTransitionMilestone = async (projectId: string, milestoneId: string, nextStatus: string) => {
    setBusy(true);
    setError(null);
    try {
      await ApiClient.v24TransitionMilestone(
        projectId,
        milestoneId,
        { nextStatus, evidenceRef: `EVD-${milestoneId}` },
        actor
      );
      setFeedback(`Milestone ${milestoneId} transitioned to ${nextStatus}.`);
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Milestone update failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="bg-[#121212] border border-[#27272a] rounded-xl p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs font-mono text-[#D4AF37]">ECONEX V24.0 · Procurement, Logistics & Projects</div>
            <h1 className="text-2xl font-display font-bold text-[#F5F5F5]">
              Procurement Controls, Corridor Logistics & Milestone Projects
            </h1>
            <p className="text-xs text-[#A0A0A0]">
              Requester != Approver SoD · 3-way PO/GRN/Invoice match · 5 EAC/AfCFTA corridor guides (customsClearanceClaimed: false) · 8-state milestones (autoEscrowRelease: false).
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadData}
              className="min-h-[40px] px-4 py-2 rounded-lg border border-[#27272a] bg-[#181818] text-xs text-[#F5F5F5] flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} aria-hidden="true" />
              <span>Refresh</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('v24-documents-settlement')}
              className="min-h-[40px] px-4 py-2 rounded-lg bg-[#D4AF37] text-[#050505] text-xs font-semibold cursor-pointer"
            >
              Documents & Settlement
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-1 p-1 bg-[#0a0a0c] border border-[#27272a] rounded-lg w-fit">
          {(
            [
              { id: 'PROCUREMENT', label: `Procurement & POs (${requests.length})` },
              { id: 'LOGISTICS', label: `Logistics & Corridors (${shipments.length})` },
              { id: 'PROJECTS', label: `Projects & Milestones (${projects.length})` },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-3.5 py-2 rounded-md text-xs font-medium whitespace-nowrap cursor-pointer ${
                tab === t.id ? 'bg-[#D4AF37] text-[#050505] font-semibold' : 'text-[#A0A0A0] hover:text-[#F5F5F5]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </section>

      {error && (
        <div role="alert" className="bg-red-950/30 border border-red-800 rounded-xl px-4 py-3 text-xs text-red-300">
          {error}
        </div>
      )}
      {feedback && (
        <div className="bg-emerald-950/30 border border-emerald-800 rounded-xl px-4 py-3 text-xs text-emerald-300">
          {feedback}
        </div>
      )}

      {tab === 'PROCUREMENT' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <form onSubmit={handleCreateProcurement} className="bg-[#121212] border border-[#27272a] rounded-xl p-6 space-y-3 text-xs self-start">
            <div className="flex items-center gap-2 text-sm font-display font-semibold text-[#F5F5F5]">
              <ClipboardCheck size={16} className="text-[#D4AF37]" aria-hidden="true" />
              <span>New Procurement Requisition</span>
            </div>
            <input
              required
              value={procTitle}
              onChange={(e) => setProcTitle(e.target.value)}
              placeholder="Requisition Title"
              className="w-full px-3 py-2 rounded-lg bg-[#181818] border border-[#27272a] text-[#F5F5F5]"
            />
            <select
              value={procCategory}
              onChange={(e) => setProcCategory(e.target.value as V24ProcurementCategory)}
              className="w-full px-3 py-2 rounded-lg bg-[#181818] border border-[#27272a] text-[#F5F5F5]"
            >
              {['ENTERPRISE_INTERNAL', 'COOPERATIVE_BULK', 'INSTITUTIONAL_SUPPLY', 'NGO_PROJECT', 'PUBLIC_PREPARATION'].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <label className="block space-y-1">
              <span className="text-[#A0A0A0]">Estimated Budget (UGX)</span>
              <input
                type="number"
                min={1000}
                value={procBudgetMajor}
                onChange={(e) => setProcBudgetMajor(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-[#181818] border border-[#27272a] text-[#F5F5F5] font-mono tabular-nums"
              />
            </label>
            <button
              type="submit"
              disabled={busy}
              className="w-full min-h-[40px] px-4 py-2 rounded-lg bg-[#D4AF37] text-[#050505] font-semibold cursor-pointer"
            >
              Submit Requisition
            </button>
          </form>

          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#121212] border border-[#27272a] rounded-xl p-6 space-y-3 text-xs">
              <h2 className="text-base font-display font-semibold text-[#F5F5F5]">
                Procurement Requests ({requests.length})
              </h2>
              <div className="divide-y divide-[#27272a]">
                {requests.map((r) => (
                  <div key={r.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="font-medium text-sm text-[#F5F5F5]">
                        {r.id} · {r.title}
                      </div>
                      <div className="text-[#A0A0A0] font-mono tabular-nums">
                        {r.category} · Budget: {fmtMinor(r.estimatedBudgetMinor, r.currency)} · Requester: {r.requesterUserId} · Status: {r.status}
                      </div>
                    </div>
                    {(r.status === 'DRAFT' || r.status === 'PENDING_APPROVAL') && (
                      <div className="flex gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleApproveProcurement(r.id, true)}
                          className="px-3 py-1.5 rounded bg-emerald-600 text-white font-semibold cursor-pointer"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApproveProcurement(r.id, false)}
                          className="px-3 py-1.5 rounded border border-red-800 text-red-300 cursor-pointer"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#121212] border border-[#27272a] rounded-xl p-6 space-y-3 text-xs">
              <h3 className="text-base font-display font-semibold text-[#F5F5F5]">
                Purchase Orders & 3-Way Match ({purchaseOrders.length})
              </h3>
              <div className="grid grid-cols-2 gap-2 max-w-md">
                <input
                  value={grnInput}
                  onChange={(e) => setGrnInput(e.target.value)}
                  placeholder="GRN Reference"
                  className="px-3 py-1.5 rounded bg-[#181818] border border-[#27272a] text-[#F5F5F5] font-mono"
                />
                <input
                  value={invInput}
                  onChange={(e) => setInvInput(e.target.value)}
                  placeholder="Invoice ID"
                  className="px-3 py-1.5 rounded bg-[#181818] border border-[#27272a] text-[#F5F5F5] font-mono"
                />
              </div>
              <div className="divide-y divide-[#27272a]">
                {purchaseOrders.map((po) => (
                  <div key={po.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="font-medium text-sm text-[#F5F5F5]">{po.poNumber} · Req {po.procurementRequestId}</div>
                      <div className="text-[#A0A0A0] font-mono tabular-nums">
                        Total: {fmtMinor(po.totalAmountMinor, po.currency)} · 3-Way Match: {po.threeWayMatchStatus} · Status: {po.status}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleThreeWayMatch(po.id)}
                      className="px-3 py-1.5 rounded bg-[#D4AF37] text-[#050505] font-semibold cursor-pointer shrink-0"
                    >
                      Run 3-Way Match
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'LOGISTICS' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {corridors.map((c) => (
              <div key={c.corridorCode} className="bg-[#121212] border border-[#27272a] rounded-xl p-5 space-y-2 text-xs">
                <div className="font-display font-semibold text-sm text-[#F5F5F5]">{c.name}</div>
                <div className="text-[#D4AF37] font-mono">
                  {c.originCountry} → {c.destinationCountry} · Est {c.distanceKmEstimate}km · customsClearanceClaimed: {String(c.customsClearanceClaimed)}
                </div>
                <div className="text-[#A0A0A0]">Border: {c.borderPost}</div>
                <div className="text-[#A0A0A0]">Guidance Docs: {c.requiredGuidanceDocs.join(', ')}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <form onSubmit={handleCreateShipment} className="bg-[#121212] border border-[#27272a] rounded-xl p-6 space-y-3 text-xs self-start">
              <div className="flex items-center gap-2 text-sm font-display font-semibold text-[#F5F5F5]">
                <Truck size={16} className="text-[#D4AF37]" aria-hidden="true" />
                <span>Book Corridor Shipment</span>
              </div>
              <select
                value={corridorCode}
                onChange={(e) => setCorridorCode(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#181818] border border-[#27272a] text-[#F5F5F5]"
              >
                {corridors.map((c) => (
                  <option key={c.corridorCode} value={c.corridorCode}>
                    {c.name}
                  </option>
                ))}
              </select>
              <input
                value={vehiclePlate}
                onChange={(e) => setVehiclePlate(e.target.value)}
                placeholder="Vehicle Plate"
                className="w-full px-3 py-2 rounded-lg bg-[#181818] border border-[#27272a] text-[#F5F5F5]"
              />
              <button
                type="submit"
                disabled={busy}
                className="w-full min-h-[40px] px-4 py-2 rounded-lg bg-[#D4AF37] text-[#050505] font-semibold cursor-pointer"
              >
                Create Shipment
              </button>
            </form>

            <div className="lg:col-span-2 bg-[#121212] border border-[#27272a] rounded-xl p-6 space-y-4 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h2 className="text-base font-display font-semibold text-[#F5F5F5]">
                  Active Shipments (Reported-Location Timeline)
                </h2>
                <input
                  value={reportedLoc}
                  onChange={(e) => setReportedLoc(e.target.value)}
                  placeholder="Checkpoint / Reported Location"
                  className="px-3 py-1.5 rounded bg-[#181818] border border-[#27272a] text-[#F5F5F5]"
                />
              </div>
              <div className="divide-y divide-[#27272a]">
                {shipments.map((s) => (
                  <div key={s.id} className="py-4 space-y-2">
                    <div className="flex justify-between gap-2">
                      <span className="font-medium text-sm text-[#F5F5F5]">
                        {s.shipmentRef} · {s.originLocation} → {s.destinationLocation}
                      </span>
                      <span className="font-mono text-[#D4AF37]">{s.status}</span>
                    </div>
                    <div className="text-[#A0A0A0] font-mono">
                      Last Reported: {s.events[s.events.length - 1]?.reportedLocation || s.originLocation} · Events: {s.events.length} · gpsClaimed: false
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {s.status === 'CREATED' && (
                        <button
                          type="button"
                          onClick={() => handleTransitionShipment(s, 'BOOKED')}
                          className="px-3 py-1 rounded border border-[#27272a] bg-[#181818] text-[#F5F5F5] cursor-pointer"
                        >
                          Mark Booked
                        </button>
                      )}
                      {['BOOKED', 'ASSIGNED', 'PICKUP_PENDING'].includes(s.status) && (
                        <button
                          type="button"
                          onClick={() => handleTransitionShipment(s, 'PICKED_UP')}
                          className="px-3 py-1 rounded border border-[#27272a] bg-[#181818] text-[#F5F5F5] cursor-pointer"
                        >
                          Mark Picked Up
                        </button>
                      )}
                      {['PICKED_UP', 'ARRIVED_HUB', 'ARRIVED_BORDER'].includes(s.status) && (
                        <button
                          type="button"
                          onClick={() => handleTransitionShipment(s, 'IN_TRANSIT')}
                          className="px-3 py-1 rounded border border-[#27272a] bg-[#181818] text-[#F5F5F5] cursor-pointer"
                        >
                          Report In Transit
                        </button>
                      )}
                      {['IN_TRANSIT', 'OUT_FOR_DELIVERY', 'CUSTOMS_COORDINATION_NOTE'].includes(s.status) && (
                        <button
                          type="button"
                          onClick={() => handleTransitionShipment(s, 'DELIVERED')}
                          className="px-3 py-1 rounded bg-emerald-600 text-white font-semibold cursor-pointer"
                        >
                          Confirm Delivered
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'PROJECTS' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <form onSubmit={handleCreateProject} className="bg-[#121212] border border-[#27272a] rounded-xl p-6 space-y-3 text-xs self-start">
            <div className="flex items-center gap-2 text-sm font-display font-semibold text-[#F5F5F5]">
              <Briefcase size={16} className="text-[#D4AF37]" aria-hidden="true" />
              <span>Create Commercial Project</span>
            </div>
            <input
              required
              value={projTitle}
              onChange={(e) => setProjTitle(e.target.value)}
              placeholder="Project Title"
              className="w-full px-3 py-2 rounded-lg bg-[#181818] border border-[#27272a] text-[#F5F5F5]"
            />
            <select
              value={projType}
              onChange={(e) => setProjType(e.target.value as V24ProjectType)}
              className="w-full px-3 py-2 rounded-lg bg-[#181818] border border-[#27272a] text-[#F5F5F5]"
            >
              {['CONSTRUCTION', 'EQUIPMENT_INSTALLATION', 'MAINTENANCE_CONTRACT', 'SOLAR_DEPLOYMENT', 'AGRICULTURAL_PROCESSING_SETUP', 'IT_INFRASTRUCTURE', 'CREATIVE_DELIVERY', 'COMMUNITY_DEVELOPMENT'].map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <select
              value={projContractorId}
              onChange={(e) => setProjContractorId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#181818] border border-[#27272a] text-[#F5F5F5]"
            >
              {participants.map((p) => (
                <option key={p.id} value={p.id}>
                  Contractor: {p.displayName}
                </option>
              ))}
            </select>
            <label className="block space-y-1">
              <span className="text-[#A0A0A0]">Total Budget (UGX)</span>
              <input
                type="number"
                min={1000}
                value={projBudgetMajor}
                onChange={(e) => setProjBudgetMajor(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-[#181818] border border-[#27272a] text-[#F5F5F5] font-mono tabular-nums"
              />
            </label>
            <button
              type="submit"
              disabled={busy}
              className="w-full min-h-[40px] px-4 py-2 rounded-lg bg-[#D4AF37] text-[#050505] font-semibold cursor-pointer"
            >
              Create Project
            </button>
          </form>

          <div className="lg:col-span-2 bg-[#121212] border border-[#27272a] rounded-xl p-6 space-y-4 text-xs">
            <h2 className="text-base font-display font-semibold text-[#F5F5F5]">
              Commercial Projects & Milestones (autoEscrowRelease: false)
            </h2>
            <div className="divide-y divide-[#27272a]">
              {projects.map((p) => (
                <div key={p.id} className="py-4 space-y-3">
                  <div className="flex justify-between gap-2">
                    <span className="font-medium text-sm text-[#F5F5F5]">
                      {p.title} ({p.projectType})
                    </span>
                    <span className="font-mono text-[#D4AF37]">
                      {fmtMinor(p.totalBudgetMinor, p.currency)} · {p.status}
                    </span>
                  </div>
                  <div className="space-y-2 pl-3 border-l border-[#27272a]">
                    {p.milestones.map((m) => (
                      <div key={m.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="text-[#F5F5F5] font-medium">{m.title}</div>
                          <div className="text-[#A0A0A0] font-mono tabular-nums">
                            {m.status} · {fmtMinor(m.budgetMinor, p.currency)} · Obligation:{' '}
                            {m.linkedPaymentObligationId || 'Pending approval'}
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          {m.status === 'PLANNED' && (
                            <button
                              type="button"
                              onClick={() => handleTransitionMilestone(p.id, m.id, 'IN_PROGRESS')}
                              className="px-2.5 py-1 rounded border border-[#27272a] bg-[#181818] text-[#F5F5F5] cursor-pointer"
                            >
                              Start Work
                            </button>
                          )}
                          {m.status === 'IN_PROGRESS' && (
                            <button
                              type="button"
                              onClick={() => handleTransitionMilestone(p.id, m.id, 'SUBMITTED')}
                              className="px-2.5 py-1 rounded border border-[#27272a] bg-[#181818] text-[#F5F5F5] cursor-pointer"
                            >
                              Submit Evidence
                            </button>
                          )}
                          {m.status === 'SUBMITTED' && (
                            <button
                              type="button"
                              onClick={() => handleTransitionMilestone(p.id, m.id, 'ACCEPTED')}
                              className="px-2.5 py-1 rounded bg-[#D4AF37] text-[#050505] font-semibold cursor-pointer"
                            >
                              Accept & Raise Obligation
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
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
