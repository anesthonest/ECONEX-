/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AETHER–AROS V1 - Agricultural Logistics & Haulage Module
 * African Economic, Agricultural & Resilience Operating System
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { ApiClient } from '../../services/apiClient.ts';
import { Shipment, ShipmentStatus } from '../../types/index.ts';
import {
  Truck,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  KeyRound,
  FileCheck,
} from 'lucide-react';

export const LogisticsView: React.FC = () => {
  const { currentUser } = useAuth();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Delivery confirmation modal state
  const [confirmPinModal, setConfirmPinModal] = useState<Shipment | null>(null);
  const [enteredPin, setEnteredPin] = useState<string>('');

  const fetchShipments = async () => {
    try {
      setIsLoading(true);
      const data = await ApiClient.getShipments();
      setShipments(data);
    } catch (err: any) {
      console.error('Failed to load shipments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchShipments();
  }, []);

  const handleAssignToMe = async (shipmentId: string) => {
    if (!currentUser) return;
    try {
      await ApiClient.assignShipment(
        shipmentId,
        currentUser.id,
        'UBD 412X',
        'CANTER_3.5T'
      );
      setFeedbackMsg({
        type: 'success',
        text: 'Shipment accepted! Vehicle UBD 412X allocated for freight haulage.',
      });
      await fetchShipments();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err?.message || 'Assignment failed' });
    }
  };

  const handleStatusUpdate = async (shipmentId: string, status: ShipmentStatus, notes?: string) => {
    if (!currentUser) return;
    try {
      await ApiClient.updateShipmentStatus(shipmentId, status, currentUser.id, undefined, notes);
      setFeedbackMsg({ type: 'success', text: `Shipment status updated to '${status}'.` });
      await fetchShipments();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err?.message || 'Status update failed' });
    }
  };

  const handleConfirmDeliveryWithPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !confirmPinModal) return;
    try {
      await ApiClient.updateShipmentStatus(
        confirmPinModal.id,
        'DELIVERED',
        currentUser.id,
        enteredPin,
        'Cargo arrived and verified at recipient depot.'
      );
      setConfirmPinModal(null);
      setEnteredPin('');
      setFeedbackMsg({
        type: 'success',
        text: 'Delivery verified with recipient PIN! Order marked as DELIVERED.',
      });
      await fetchShipments();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err?.message || 'Invalid delivery PIN.' });
    }
  };

  const statusColors: Record<ShipmentStatus, { bg: string; text: string; border: string }> = {
    REQUESTED: { bg: 'bg-zinc-900', text: 'text-zinc-400', border: 'border-zinc-700' },
    ASSIGNED: { bg: 'bg-blue-950/60', text: 'text-blue-300', border: 'border-blue-800' },
    ACCEPTED: { bg: 'bg-indigo-950/60', text: 'text-indigo-300', border: 'border-indigo-800' },
    PICKED_UP: { bg: 'bg-cyan-950/60', text: 'text-cyan-300', border: 'border-cyan-800' },
    IN_TRANSIT: { bg: 'bg-amber-950/70', text: 'text-amber-300', border: 'border-amber-600' },
    DELIVERED: { bg: 'bg-emerald-950/70', text: 'text-emerald-300', border: 'border-emerald-600' },
    FAILED: { bg: 'bg-red-950/60', text: 'text-red-400', border: 'border-red-900' },
    CANCELLED: { bg: 'bg-zinc-900', text: 'text-zinc-400', border: 'border-zinc-700' },
  };

  return (
    <div className="space-y-6">
      {/* Feedback banner */}
      {feedbackMsg && (
        <div
          className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-600 text-emerald-300'
              : 'bg-red-950/60 border-red-600 text-red-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{feedbackMsg.text}</span>
          </div>
          <button onClick={() => setFeedbackMsg(null)} className="text-[#A0A0A0] hover:text-[#F5F5F5]">
            ✕
          </button>
        </div>
      )}

      {/* Fleet & Transporter Profile */}
      <div className="bg-[#121212] border border-[#27272a] rounded-xl p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-orange-950/50 border border-orange-800 flex items-center justify-center text-xl font-bold text-orange-300">
              <Truck size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-[#F5F5F5]">
                  {currentUser?.organizationName || currentUser?.name}
                </h1>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-orange-950 text-orange-300 border border-orange-800">
                  Certified Freight Carrier
                </span>
                <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-600 px-1.5 py-0.5 rounded font-medium flex items-center gap-1">
                  <ShieldCheck size={11} /> Waybill Insured
                </span>
              </div>
              <p className="text-xs text-[#A0A0A0] mt-1 flex items-center gap-2">
                <MapPin size={13} className="text-[#D4AF37]" />
                <span>Operating Hub: {currentUser?.district} District</span>
                <span>•</span>
                <span>Corridors: Western Highway • Northern Link • Eastern Rail Hub</span>
              </p>
            </div>
          </div>

          {/* Quick Fleet Metrics */}
          <div className="flex items-center gap-2 text-xs">
            <div className="bg-[#09090b] px-3 py-2 rounded-lg border border-[#1f1f23] text-center">
              <div className="text-[#A0A0A0] text-[10px]">Active Fleet</div>
              <div className="font-bold text-[#F5F5F5] font-mono">4 Trucks</div>
            </div>
            <div className="bg-[#09090b] px-3 py-2 rounded-lg border border-[#1f1f23] text-center">
              <div className="text-[#A0A0A0] text-[10px]">Total Payload</div>
              <div className="font-bold text-[#D4AF37] font-mono">24.5 MT</div>
            </div>
          </div>
        </div>
      </div>

      {/* Shipments Board */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#F5F5F5] uppercase tracking-wider flex items-center gap-2">
              <Truck size={16} className="text-[#D4AF37]" /> Freight Haulage Dispatches ({shipments.length})
            </h2>
            <p className="text-xs text-[#A0A0A0]">
              Coordinating farm-gate collection, waybills, and recipient depot delivery.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {isLoading ? (
            <div className="bg-[#121212] border border-[#27272a] rounded-xl p-8 text-center text-xs text-[#A0A0A0]">
              Loading shipment records...
            </div>
          ) : shipments.length === 0 ? (
            <div className="bg-[#121212] border border-[#27272a] rounded-xl p-8 text-center text-xs text-[#A0A0A0]">
              No active shipment requests. Shipments are automatically generated when buyer orders are placed.
            </div>
          ) : (
            shipments.map((s) => {
              const colors = statusColors[s.status] || {
                bg: 'bg-zinc-900',
                text: 'text-zinc-300',
                border: 'border-zinc-700',
              };
              const isAssignedToMe = s.transporterId === currentUser?.id;
              const isTransporter = currentUser?.role === 'TRANSPORTER' || currentUser?.role === 'PLATFORM_ADMIN';

              return (
                <div key={s.id} className="bg-[#121212] border border-[#27272a] rounded-xl p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-[#F5F5F5]">Waybill #{s.id}</span>
                        <span className="text-[11px] text-[#A0A0A0] font-mono">Linked to Order #{s.orderNumber}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border ${colors.bg} ${colors.text} ${colors.border}`}
                        >
                          {s.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-[#F5F5F5] mt-1">{s.cargoDescription}</h3>
                    </div>

                    <div className="text-right sm:text-right">
                      <div className="text-sm font-bold text-[#D4AF37] font-mono">
                        {s.freightCostUGX.toLocaleString()} UGX
                      </div>
                      <div className="text-[10px] text-[#71717a]">Weight: {s.weightTonnage} Tonnes</div>
                    </div>
                  </div>

                  {/* Route corridor */}
                  <div className="bg-[#09090b] p-3 rounded-lg border border-[#1f1f23] grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-[#71717a] flex items-center gap-1">
                        <MapPin size={11} className="text-[#D4AF37]" /> Origin (Farm Gate / Central Store)
                      </span>
                      <div className="text-[#F5F5F5] font-medium mt-0.5">{s.originAddress}</div>
                      <div className="text-[11px] text-[#A0A0A0]">{s.originDistrict} District</div>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-[#71717a] flex items-center gap-1">
                        <MapPin size={11} className="text-emerald-400" /> Destination (Depot / Terminal)
                      </span>
                      <div className="text-[#F5F5F5] font-medium mt-0.5">{s.destinationAddress}</div>
                      <div className="text-[11px] text-[#A0A0A0]">{s.destinationDistrict} District</div>
                    </div>
                  </div>

                  {/* Transporter Allocation & Status Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#1e1e24] text-xs">
                    <div className="text-[11px] text-[#A0A0A0]">
                      {s.transporterName ? (
                        <span>
                          Assigned: <strong className="text-[#F5F5F5]">{s.transporterName}</strong> ({s.vehicleRegistration || 'Standard Carrier'})
                        </span>
                      ) : (
                        <span className="text-amber-400">Carrier Allocation Pending</span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {isTransporter && !s.transporterId && s.status === 'REQUESTED' && (
                        <button
                          onClick={() => handleAssignToMe(s.id)}
                          className="px-3 py-1.5 bg-[#D4AF37] hover:bg-[#e5bf43] text-black font-semibold rounded text-xs transition-colors"
                        >
                          Accept Haulage Job
                        </button>
                      )}

                      {isTransporter && (s.status === 'ACCEPTED' || s.status === 'ASSIGNED') && (
                        <button
                          onClick={() => handleStatusUpdate(s.id, 'PICKED_UP', 'Cargo inspected and loaded onto carrier.')}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded text-xs transition-colors"
                        >
                          Confirm Cargo Loaded
                        </button>
                      )}

                      {isTransporter && s.status === 'PICKED_UP' && (
                        <button
                          onClick={() => handleStatusUpdate(s.id, 'IN_TRANSIT', 'Vehicle departed origin terminal.')}
                          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-black font-semibold rounded text-xs transition-colors"
                        >
                          Mark In-Transit
                        </button>
                      )}

                      {isTransporter && s.status === 'IN_TRANSIT' && (
                        <button
                          onClick={() => setConfirmPinModal(s)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-black font-semibold rounded text-xs flex items-center gap-1.5 transition-colors shadow-md"
                        >
                          <KeyRound size={13} /> Confirm Delivery (PIN)
                        </button>
                      )}

                      {s.recipientConfirmPin && (
                        <span className="text-[10px] font-mono text-[#71717a] bg-[#18181b] px-2 py-1 rounded border border-[#27272a]">
                          Recipient PIN: <strong className="text-[#D4AF37]">{s.recipientConfirmPin}</strong>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* MODAL: Delivery Confirmation PIN */}
      {confirmPinModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-[#27272a] rounded-xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#27272a] pb-3">
              <h3 className="text-sm font-bold text-[#F5F5F5] uppercase tracking-wider flex items-center gap-2">
                <KeyRound size={16} className="text-[#D4AF37]" /> Recipient Confirmation PIN
              </h3>
              <button onClick={() => setConfirmPinModal(null)} className="text-[#A0A0A0] hover:text-[#F5F5F5]">
                ✕
              </button>
            </div>

            <p className="text-xs text-[#A0A0A0]">
              Ask the recipient at <strong>{confirmPinModal.destinationAddress}</strong> for their 4-digit verification PIN to confirm offload completion.
            </p>

            <form onSubmit={handleConfirmDeliveryWithPin} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#A0A0A0] mb-1">Enter 4-Digit Delivery PIN *</label>
                <input
                  type="text"
                  maxLength={4}
                  required
                  placeholder="e.g. 4829"
                  value={enteredPin}
                  onChange={(e) => setEnteredPin(e.target.value)}
                  className="w-full bg-[#18181b] border border-[#27272a] rounded px-3 py-2 text-center text-lg tracking-widest text-[#D4AF37] font-mono focus:border-[#D4AF37] outline-none"
                />
                <div className="text-[10px] text-[#71717a] mt-1 text-center">
                  (Demonstration PIN for this shipment: {confirmPinModal.recipientConfirmPin})
                </div>
              </div>

              <div className="pt-2 border-t border-[#27272a] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmPinModal(null)}
                  className="px-3 py-1.5 bg-[#18181b] border border-[#27272a] rounded text-[#A0A0A0] hover:text-[#F5F5F5]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-black font-semibold rounded"
                >
                  Confirm Delivery
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
