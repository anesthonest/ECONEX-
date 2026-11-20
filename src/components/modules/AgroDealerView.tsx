/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AETHER–AROS V1 - Agro-Dealer & Input Supplies Module
 * African Economic, Agricultural & Resilience Operating System
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { ApiClient } from '../../services/apiClient.ts';
import { AgroDealerInput } from '../../types/index.ts';
import {
  Building2,
  ShieldCheck,
  Plus,
  Package,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Tag,
  FileCheck,
} from 'lucide-react';

export const AgroDealerView: React.FC = () => {
  const { currentUser } = useAuth();
  const [inputs, setInputs] = useState<AgroDealerInput[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [inputForm, setInputForm] = useState({
    productName: '',
    category: 'CERTIFIED_SEEDS' as const,
    brand: '',
    registrationNumber: 'UG-MAAIF-2026-CERT',
    priceUGX: 25000,
    unit: '2KG Pack',
    stockAvailable: 200,
    activeIngredient: '',
    applicationInstructions: '',
    district: currentUser?.district || 'Jinja',
  });

  const fetchInputs = async () => {
    try {
      setIsLoading(true);
      const data = await ApiClient.getAgroInputs();
      setInputs(data);
    } catch (err: any) {
      console.error('Failed to load agro inputs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInputs();
  }, []);

  const handleCreateInput = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      await ApiClient.createAgroInput({
        ...inputForm,
        dealerId: currentUser.id,
      });
      setShowAddModal(false);
      setFeedbackMsg({
        type: 'success',
        text: `Input '${inputForm.productName}' added to certified catalog!`,
      });
      await fetchInputs();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err?.message || 'Failed to add input.' });
    }
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

      {/* Profile Overview */}
      <div className="bg-[#121212] border border-[#27272a] rounded-xl p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-purple-950/50 border border-purple-800 flex items-center justify-center text-xl font-bold text-purple-300">
              <Building2 size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-[#F5F5F5]">
                  {currentUser?.organizationName || currentUser?.name}
                </h1>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-950 text-purple-300 border border-purple-800">
                  Agro-Dealer Hub
                </span>
                {currentUser?.isVerified ? (
                  <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-600 px-1.5 py-0.5 rounded font-medium flex items-center gap-1">
                    <ShieldCheck size={11} /> MAAIF Certified
                  </span>
                ) : (
                  <span className="text-[10px] bg-amber-950 text-amber-300 border border-amber-600 px-1.5 py-0.5 rounded font-medium">
                    Verification Pending Audit
                  </span>
                )}
              </div>
              <p className="text-xs text-[#A0A0A0] mt-1 flex items-center gap-2">
                <MapPin size={13} className="text-[#D4AF37]" />
                <span>{currentUser?.district} District Distribution Center</span>
                <span>•</span>
                <span>Contact: {currentUser?.phone}</span>
              </p>
              {currentUser?.bio && (
                <p className="text-xs text-[#71717a] mt-1 line-clamp-2">{currentUser.bio}</p>
              )}
            </div>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-[#D4AF37] hover:bg-[#e5bf43] text-black font-semibold text-xs rounded-lg flex items-center gap-1.5 transition-colors shadow-md"
          >
            <Plus size={15} /> Add Agricultural Input
          </button>
        </div>
      </div>

      {/* Catalog Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#F5F5F5] uppercase tracking-wider flex items-center gap-2">
            <Package size={16} className="text-[#D4AF37]" /> Certified Input Catalog
          </h2>
          <span className="text-xs text-[#A0A0A0]">{inputs.length} Items In Stock</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? (
            <div className="col-span-full text-center py-10 text-xs text-[#A0A0A0]">
              Loading inputs...
            </div>
          ) : inputs.length === 0 ? (
            <div className="col-span-full bg-[#121212] border border-[#27272a] rounded-xl p-8 text-center text-xs text-[#A0A0A0]">
              No inputs registered yet. Add certified seeds, fertilizers, or tools to the catalog.
            </div>
          ) : (
            inputs.map((item) => (
              <div key={item.id} className="bg-[#121212] border border-[#27272a] rounded-xl p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-[#D4AF37] uppercase bg-[#18181b] border border-[#27272a] px-1.5 py-0.5 rounded">
                      {item.category.replace(/_/g, ' ')}
                    </span>
                    <h3 className="font-bold text-[#F5F5F5] text-sm mt-1.5">{item.productName}</h3>
                    <p className="text-[11px] text-[#A0A0A0]">Brand: {item.brand}</p>
                  </div>
                  {item.isMinistryApproved && (
                    <span className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-1.5 py-0.5 rounded flex items-center gap-0.5 shrink-0">
                      <ShieldCheck size={11} /> Genuine
                    </span>
                  )}
                </div>

                {item.activeIngredient && (
                  <div className="text-[11px] text-[#A0A0A0] bg-[#09090b] p-2 rounded border border-[#1f1f23]">
                    <span className="font-semibold text-[#71717a]">Specification:</span> {item.activeIngredient}
                  </div>
                )}

                {item.applicationInstructions && (
                  <p className="text-[10px] text-[#71717a] line-clamp-2">
                    Usage: {item.applicationInstructions}
                  </p>
                )}

                <div className="pt-2 border-t border-[#1e1e24] flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-[#D4AF37] font-mono text-sm">
                      {item.priceUGX.toLocaleString()} UGX
                    </div>
                    <div className="text-[10px] text-[#71717a]">per {item.unit}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold text-[#F5F5F5] font-mono">
                      {item.stockAvailable} units
                    </span>
                    <div className="text-[10px] text-emerald-400">Available in {item.district}</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* MODAL: Add Input */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-[#27272a] rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#27272a] pb-3">
              <h3 className="text-sm font-bold text-[#F5F5F5] uppercase tracking-wider flex items-center gap-2">
                <Plus size={16} className="text-[#D4AF37]" /> Add Certified Agricultural Input
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-[#A0A0A0] hover:text-[#F5F5F5]">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateInput} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#A0A0A0] mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Certified Hybrid Maize Seed (Bazooka)"
                  value={inputForm.productName}
                  onChange={(e) => setInputForm({ ...inputForm, productName: e.target.value })}
                  className="w-full bg-[#18181b] border border-[#27272a] rounded px-3 py-2 text-[#F5F5F5] focus:border-[#D4AF37] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[#A0A0A0] mb-1">Category *</label>
                  <select
                    value={inputForm.category}
                    onChange={(e) => setInputForm({ ...inputForm, category: e.target.value as any })}
                    className="w-full bg-[#18181b] border border-[#27272a] rounded px-3 py-2 text-[#F5F5F5] focus:border-[#D4AF37] outline-none"
                  >
                    <option value="CERTIFIED_SEEDS">Certified Seeds</option>
                    <option value="INORGANIC_FERTILIZER">Inorganic Fertilizer (NPK, DAP, Urea)</option>
                    <option value="ORGANIC_FERTILIZER">Organic Compost & Bio-Fertilizer</option>
                    <option value="PESTICIDE">Pest Control & Fungicide</option>
                    <option value="IRRIGATION_KIT">Drip & Irrigation Equipment</option>
                    <option value="TOOL_MACHINERY">Farm Tools & Machinery</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#A0A0A0] mb-1">Brand / Manufacturer</label>
                  <input
                    type="text"
                    placeholder="e.g. NARO / Yara East Africa"
                    value={inputForm.brand}
                    onChange={(e) => setInputForm({ ...inputForm, brand: e.target.value })}
                    className="w-full bg-[#18181b] border border-[#27272a] rounded px-3 py-2 text-[#F5F5F5] focus:border-[#D4AF37] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[#A0A0A0] mb-1">Unit Price (UGX) *</label>
                  <input
                    type="number"
                    min="1000"
                    required
                    value={inputForm.priceUGX}
                    onChange={(e) => setInputForm({ ...inputForm, priceUGX: parseInt(e.target.value) || 1000 })}
                    className="w-full bg-[#18181b] border border-[#27272a] rounded px-2 py-2 text-[#F5F5F5] focus:border-[#D4AF37] outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[#A0A0A0] mb-1">Package Unit *</label>
                  <input
                    type="text"
                    required
                    placeholder="2KG Pack, 50KG Bag"
                    value={inputForm.unit}
                    onChange={(e) => setInputForm({ ...inputForm, unit: e.target.value })}
                    className="w-full bg-[#18181b] border border-[#27272a] rounded px-2 py-2 text-[#F5F5F5] focus:border-[#D4AF37] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#A0A0A0] mb-1">Stock Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={inputForm.stockAvailable}
                    onChange={(e) => setInputForm({ ...inputForm, stockAvailable: parseInt(e.target.value) || 1 })}
                    className="w-full bg-[#18181b] border border-[#27272a] rounded px-2 py-2 text-[#F5F5F5] focus:border-[#D4AF37] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#A0A0A0] mb-1">Active Ingredient / Composition</label>
                <input
                  type="text"
                  placeholder="e.g. 17% N, 17% P2O5, 17% K2O or Germination 96%"
                  value={inputForm.activeIngredient}
                  onChange={(e) => setInputForm({ ...inputForm, activeIngredient: e.target.value })}
                  className="w-full bg-[#18181b] border border-[#27272a] rounded px-3 py-2 text-[#F5F5F5] focus:border-[#D4AF37] outline-none"
                />
              </div>

              <div>
                <label className="block text-[#A0A0A0] mb-1">Application Guidance / Safety Instructions</label>
                <textarea
                  rows={2}
                  placeholder="Recommended spacing, dosage per acre, safety withholding period..."
                  value={inputForm.applicationInstructions}
                  onChange={(e) => setInputForm({ ...inputForm, applicationInstructions: e.target.value })}
                  className="w-full bg-[#18181b] border border-[#27272a] rounded px-3 py-2 text-[#F5F5F5] focus:border-[#D4AF37] outline-none"
                />
              </div>

              <div className="pt-3 border-t border-[#27272a] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 bg-[#18181b] border border-[#27272a] rounded text-[#A0A0A0] hover:text-[#F5F5F5]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#D4AF37] hover:bg-[#e5bf43] text-black font-semibold rounded"
                >
                  Save Input
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
