/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AETHER–AROS V8.0 - Universal Economic Network Graph & Participant Visualizer
 * Continental Economic Network & Autonomous Coordination
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useState, useEffect } from 'react';
import {
  Share2,
  Shield,
  Eye,
  Plus,
  Trash2,
  CheckCircle2,
  Building,
  RefreshCw,
  Search,
  Filter,
  ArrowRight,
  Lock,
  Globe,
  ExternalLink,
  Award,
  Layers
} from 'lucide-react';
import { ApiClient } from '../services/apiClient';
import {
  EconomicRelationship,
  EconomicParticipant,
  VisibilityLevel,
  EconomicRelationshipType
} from '../types';

export const EconomicNetworkView: React.FC = () => {
  const [relationships, setRelationships] = useState<EconomicRelationship[]>([]);
  const [participants, setParticipants] = useState<EconomicParticipant[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedVisibility, setSelectedVisibility] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedParticipantId, setSelectedParticipantId] = useState<string>('ALL');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);

  // Form State
  const [formSourceId, setFormSourceId] = useState<string>('');
  const [formTargetId, setFormTargetId] = useState<string>('');
  const [formType, setFormType] = useState<EconomicRelationshipType>('SUPPLIER');
  const [formVisibility, setFormVisibility] = useState<VisibilityLevel>('PUBLIC');
  const [formTerms, setFormTerms] = useState<string>('');
  const [formProvenance, setFormProvenance] = useState<string>('AROS-DID-VERIFIED');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [terminateTargetId, setTerminateTargetId] = useState<string | null>(null);
  const [terminateReason, setTerminateReason] = useState<string>('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [relData, partData] = await Promise.all([
        ApiClient.getEconomicRelationships({
          participantId: selectedParticipantId !== 'ALL' ? selectedParticipantId : undefined,
          viewerRole: 'PLATFORM_SUPER_ADMIN'
        }),
        ApiClient.getEconomicParticipants()
      ]);
      setRelationships(relData);
      setParticipants(partData);
      if (partData.length > 0 && !formSourceId) {
        setFormSourceId(partData[0].id);
        if (partData.length > 1) setFormTargetId(partData[1].id);
      }
    } catch (err) {
      console.error('Failed to load economic network data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedParticipantId]);

  const handleCreateRelationship = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSourceId || !formTargetId || formSourceId === formTargetId) {
      setFormError('Please select two distinct counterparties.');
      return;
    }
    setFormError(null);
    const sourceObj = participants.find(p => p.id === formSourceId);
    const targetObj = participants.find(p => p.id === formTargetId);

    try {
      setSubmitting(true);
      await ApiClient.createEconomicRelationship({
        sourceParticipantId: formSourceId,
        sourceParticipantName: sourceObj?.legalName || formSourceId,
        targetParticipantId: formTargetId,
        targetParticipantName: targetObj?.legalName || formTargetId,
        relationshipType: formType,
        visibility: formVisibility,
        termsSummary: formTerms || 'Bilateral economic partnership accord',
        provenance: formProvenance
      });
      setIsCreateModalOpen(false);
      setFormTerms('');
      await fetchData();
    } catch (err: any) {
      setFormError(err?.message || 'Failed to create relationship.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTerminate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminateTargetId || !terminateReason.trim()) return;
    try {
      await ApiClient.terminateEconomicRelationship(terminateTargetId, terminateReason.trim());
      setTerminateTargetId(null);
      setTerminateReason('');
      await fetchData();
    } catch (err) {
      console.error('Failed to terminate relationship:', err);
    }
  };

  // Filtered nodes and relationships
  const filteredRelationships = relationships.filter(r => {
    if (selectedVisibility !== 'ALL' && r.visibility !== selectedVisibility) return false;
    if (selectedType !== 'ALL' && r.relationshipType !== selectedType) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const match =
        (r.sourceParticipantName || '').toLowerCase().includes(q) ||
        (r.targetParticipantName || '').toLowerCase().includes(q) ||
        (r.termsSummary || '').toLowerCase().includes(q) ||
        (r.relationshipType || '').toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="space-y-8 pb-16">
      {/* Header Banner */}
      <div className="border border-[#262626] bg-[#0c0c0c] p-6 lg:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 text-xs font-mono uppercase tracking-widest text-[#D4AF37] border border-[#D4AF37]/30 bg-[#D4AF37]/5">
                V8.0 Continental Network Layer
              </span>
              <span className="text-xs text-[#A0A0A0]">AfCFTA & EAC Interconnect</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-light tracking-tight text-[#F5F5F5]">
              Universal Economic Network Graph
            </h1>
            <p className="text-sm text-[#A0A0A0] mt-1 max-w-3xl">
              Mapping multi-sector participant nodes, bilateral commercial relationships, supply lines, institutional clearing ties, and provable regulatory provenance across East Africa and continental corridors.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchData()}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 border border-[#333333] hover:border-[#D4AF37] text-xs font-mono text-[#F5F5F5] transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              SYNC GRAPH
            </button>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#D4AF37] hover:bg-[#b89528] text-xs font-mono font-medium text-[#050505] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              ESTABLISH RELATIONSHIP
            </button>
          </div>
        </div>

        {/* Global Network Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-[#1f1f1f]">
          <div className="p-3 bg-[#121212] border border-[#222222]">
            <div className="text-xs text-[#888888] font-mono">TOTAL NETWORK NODES</div>
            <div className="text-2xl font-mono text-[#F5F5F5] mt-1">{participants.length}</div>
            <div className="text-[10px] text-[#A0A0A0] mt-0.5">Verified Legal Entities</div>
          </div>
          <div className="p-3 bg-[#121212] border border-[#222222]">
            <div className="text-xs text-[#888888] font-mono">ACTIVE EDGES (RELATIONSHIPS)</div>
            <div className="text-2xl font-mono text-[#D4AF37] mt-1">
              {relationships.filter(r => r.status === 'ACTIVE').length}
            </div>
            <div className="text-[10px] text-[#A0A0A0] mt-0.5">Commercial & Clearing Ties</div>
          </div>
          <div className="p-3 bg-[#121212] border border-[#222222]">
            <div className="text-xs text-[#888888] font-mono">PUBLIC DISCOVERABILITY</div>
            <div className="text-2xl font-mono text-[#F5F5F5] mt-1">
              {relationships.filter(r => r.visibility === 'PUBLIC').length}
            </div>
            <div className="text-[10px] text-[#A0A0A0] mt-0.5">Open Market Visibility</div>
          </div>
          <div className="p-3 bg-[#121212] border border-[#222222]">
            <div className="text-xs text-[#888888] font-mono">INSTITUTIONAL / RESTRICTED</div>
            <div className="text-2xl font-mono text-[#C0C0C0] mt-1">
              {relationships.filter(r => r.visibility !== 'PUBLIC').length}
            </div>
            <div className="text-[10px] text-[#A0A0A0] mt-0.5">Confidential & Bank-Only</div>
          </div>
        </div>
      </div>

      {formError && (
        <div className="p-3 bg-rose-950/40 border border-rose-800/40 text-xs text-rose-300 flex items-center justify-between">
          <span>{formError}</span>
          <button onClick={() => setFormError(null)} className="text-[#A0A0A0] hover:text-white ml-4">Dismiss</button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="border border-[#262626] bg-[#0c0c0c] p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex-1 w-full relative">
          <Search className="w-4 h-4 text-[#888888] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search counterparties, agreements, relationship types..."
            className="w-full pl-9 pr-4 py-2 bg-[#121212] border border-[#262626] text-xs text-[#F5F5F5] placeholder-[#555555] focus:outline-none focus:border-[#D4AF37]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1 text-xs text-[#888888] font-mono">
            <Filter className="w-3.5 h-3.5" />
            <span>VISIBILITY:</span>
          </div>
          <select
            value={selectedVisibility}
            onChange={(e) => setSelectedVisibility(e.target.value)}
            className="px-3 py-1.5 bg-[#121212] border border-[#262626] text-xs font-mono text-[#F5F5F5] focus:outline-none focus:border-[#D4AF37]"
          >
            <option value="ALL">ALL VISIBILITY SCOPES</option>
            <option value="PUBLIC">PUBLIC</option>
            <option value="RESTRICTED">RESTRICTED</option>
            <option value="INSTITUTION_ONLY">INSTITUTION ONLY</option>
            <option value="PRIVATE">PRIVATE</option>
          </select>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-1.5 bg-[#121212] border border-[#262626] text-xs font-mono text-[#F5F5F5] focus:outline-none focus:border-[#D4AF37]"
          >
            <option value="ALL">ALL RELATIONSHIP TYPES</option>
            <option value="SUPPLIER">SUPPLIER</option>
            <option value="CUSTOMER">CUSTOMER</option>
            <option value="TRADE">TRADE</option>
            <option value="INVESTOR">INVESTOR</option>
            <option value="LOGISTICS">LOGISTICS</option>
            <option value="CLEARING_AGENT">CLEARING AGENT</option>
            <option value="REGULATOR">REGULATOR</option>
          </select>
        </div>
      </div>

      {/* Network Graph Visual Matrix */}
      <div className="border border-[#262626] bg-[#0c0c0c] p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-[#D4AF37]" />
            <h2 className="text-sm font-mono tracking-wider uppercase text-[#F5F5F5]">
              Active Network Topology & Interconnect Matrix
            </h2>
          </div>
          <span className="text-xs font-mono text-[#888888]">
            Showing {filteredRelationships.length} of {relationships.length} relationships
          </span>
        </div>

        {/* Visual Node-Edge Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRelationships.map((rel) => {
            const isPublic = rel.visibility === 'PUBLIC';
            const isTerminated = rel.status === 'TERMINATED';
            return (
              <div
                key={rel.id}
                className={`p-5 border ${
                  isTerminated
                    ? 'border-[#331111] bg-[#120808]'
                    : 'border-[#222222] bg-[#121212] hover:border-[#D4AF37]/50'
                } transition-all flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider ${
                        rel.relationshipType === 'SUPPLIER'
                          ? 'border border-[#D4AF37]/40 text-[#D4AF37] bg-[#D4AF37]/5'
                          : rel.relationshipType === 'TRADE'
                          ? 'border border-[#4ade80]/40 text-[#4ade80] bg-[#4ade80]/5'
                          : rel.relationshipType === 'INVESTOR'
                          ? 'border border-[#60a5fa]/40 text-[#60a5fa] bg-[#60a5fa]/5'
                          : 'border border-[#C0C0C0]/40 text-[#C0C0C0] bg-[#C0C0C0]/5'
                      }`}
                    >
                      {rel.relationshipType}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {isPublic ? (
                        <Globe className="w-3 h-3 text-[#A0A0A0]" />
                      ) : (
                        <Lock className="w-3 h-3 text-[#D4AF37]" />
                      )}
                      <span className="text-[10px] font-mono text-[#888888]">
                        {rel.visibility}
                      </span>
                    </div>
                  </div>

                  {/* Flow Diagram (Node A -> Node B) */}
                  <div className="p-3 bg-[#0a0a0a] border border-[#1a1a1a] mb-3 space-y-2">
                    <div className="flex items-center gap-2 text-xs text-[#F5F5F5] font-medium truncate">
                      <Building className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                      <span className="truncate">{rel.sourceParticipantName}</span>
                    </div>
                    <div className="flex items-center gap-2 pl-2 text-[10px] font-mono text-[#888888]">
                      <ArrowRight className="w-3 h-3 text-[#D4AF37]" />
                      <span>DIRECT BILATERAL LINK</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[#F5F5F5] font-medium truncate">
                      <Building className="w-3.5 h-3.5 text-[#C0C0C0] shrink-0" />
                      <span className="truncate">{rel.targetParticipantName}</span>
                    </div>
                  </div>

                  {/* Terms & Details */}
                  <p className="text-xs text-[#A0A0A0] line-clamp-2 mb-3">
                    {rel.termsSummary}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#1a1a1a] flex items-center justify-between text-[10px] font-mono">
                  <div className="flex items-center gap-1 text-[#888888]">
                    <Shield className="w-3 h-3 text-[#D4AF37]" />
                    <span className="truncate max-w-[130px]">{rel.provenance}</span>
                  </div>

                  {rel.status === 'ACTIVE' ? (
                    <button
                      onClick={() => {
                        setTerminateTargetId(rel.id);
                        setTerminateReason('');
                      }}
                      className="text-[#ef4444] hover:text-[#f87171] hover:underline"
                    >
                      TERMINATE
                    </button>
                  ) : (
                    <span className="text-[#888888] uppercase">TERMINATED</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {filteredRelationships.length === 0 && !loading && (
          <div className="text-center py-16 border border-dashed border-[#222222] bg-[#080808]">
            <Share2 className="w-8 h-8 text-[#555555] mx-auto mb-3" />
            <div className="text-sm text-[#F5F5F5] font-light">No relationships found</div>
            <p className="text-xs text-[#888888] mt-1">Adjust search parameters or establish a new network relationship.</p>
          </div>
        )}
      </div>

      {/* Verified Participant Directory */}
      <div className="border border-[#262626] bg-[#0c0c0c] p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-[#D4AF37]" />
            <h2 className="text-sm font-mono tracking-wider uppercase text-[#F5F5F5]">
              Continental Participant Directory & Legal Provenance
            </h2>
          </div>
          <span className="text-xs font-mono text-[#888888]">{participants.length} Entities Enrolled</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#222222] text-[10px] font-mono text-[#888888] uppercase">
                <th className="py-2.5 px-3">Participant Node</th>
                <th className="py-2.5 px-3">Jurisdiction</th>
                <th className="py-2.5 px-3">Industry Sector</th>
                <th className="py-2.5 px-3">Entity Type</th>
                <th className="py-2.5 px-3">Verification</th>
                <th className="py-2.5 px-3 text-right">Settlement Currencies</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a1a1a] text-xs">
              {participants.map((p) => (
                <tr key={p.id} className="hover:bg-[#141414] transition-colors">
                  <td className="py-3 px-3">
                    <div className="font-medium text-[#F5F5F5]">{p.legalName}</div>
                    <div className="text-[10px] font-mono text-[#666666]">{p.id}</div>
                  </td>
                  <td className="py-3 px-3 font-mono text-[#C0C0C0]">
                    <span className="px-1.5 py-0.5 bg-[#181818] border border-[#282828] text-[10px]">
                      {p.countryCode}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-[#A0A0A0]">{p.industrySector}</td>
                  <td className="py-3 px-3 font-mono text-[10px] text-[#A0A0A0]">{p.entityType}</td>
                  <td className="py-3 px-3">
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#4ade80] bg-[#4ade80]/10 px-2 py-0.5 border border-[#4ade80]/30">
                      <CheckCircle2 className="w-3 h-3" />
                      {p.verificationStatus}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-xs text-[#D4AF37]">
                    {p.supportedCurrencies ? p.supportedCurrencies.join(', ') : 'UGX, USD'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Relationship Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="border border-[#333333] bg-[#0c0c0c] w-full max-w-xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-[#222222]">
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-[#D4AF37]" />
                <h3 className="text-sm font-mono uppercase tracking-wider text-[#F5F5F5]">
                  Establish Bilateral Relationship
                </h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-[#888888] hover:text-[#F5F5F5] text-xs font-mono"
              >
                CLOSE [ESC]
              </button>
            </div>

            <form onSubmit={handleCreateRelationship} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-mono text-[#888888] mb-1">
                  SOURCE PARTICIPANT
                </label>
                <select
                  value={formSourceId}
                  onChange={(e) => setFormSourceId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#121212] border border-[#262626] text-xs font-mono text-[#F5F5F5] focus:outline-none focus:border-[#D4AF37]"
                >
                  {participants.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.legalName} ({p.countryCode}) - {p.id}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-[#888888] mb-1">
                  TARGET COUNTERPARTY
                </label>
                <select
                  value={formTargetId}
                  onChange={(e) => setFormTargetId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#121212] border border-[#262626] text-xs font-mono text-[#F5F5F5] focus:outline-none focus:border-[#D4AF37]"
                >
                  {participants.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.legalName} ({p.countryCode}) - {p.id}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-[#888888] mb-1">
                    RELATIONSHIP TYPE
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as EconomicRelationshipType)}
                    className="w-full px-3 py-2 bg-[#121212] border border-[#262626] text-xs font-mono text-[#F5F5F5] focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="SUPPLIER">SUPPLIER</option>
                    <option value="CUSTOMER">CUSTOMER</option>
                    <option value="TRADE">TRADE</option>
                    <option value="INVESTOR">INVESTOR</option>
                    <option value="LOGISTICS">LOGISTICS</option>
                    <option value="CLEARING_AGENT">CLEARING AGENT</option>
                    <option value="REGULATOR">REGULATOR</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#888888] mb-1">
                    VISIBILITY SCOPE
                  </label>
                  <select
                    value={formVisibility}
                    onChange={(e) => setFormVisibility(e.target.value as VisibilityLevel)}
                    className="w-full px-3 py-2 bg-[#121212] border border-[#262626] text-xs font-mono text-[#F5F5F5] focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="PUBLIC">PUBLIC (All Market Participants)</option>
                    <option value="RESTRICTED">RESTRICTED (Counterparties + Regulators)</option>
                    <option value="INSTITUTION_ONLY">INSTITUTION ONLY (Banks & Authorities)</option>
                    <option value="PRIVATE">PRIVATE (Strictly Bilateral)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-[#888888] mb-1">
                  TERMS & OPERATIONAL SCOPE SUMMARY
                </label>
                <textarea
                  rows={3}
                  value={formTerms}
                  onChange={(e) => setFormTerms(e.target.value)}
                  placeholder="e.g. Guaranteed cross-border agricultural commodity supply, bilateral trade credit facility, or bonded clearing protocol..."
                  className="w-full px-3 py-2 bg-[#121212] border border-[#262626] text-xs text-[#F5F5F5] placeholder-[#555555] focus:outline-none focus:border-[#D4AF37]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[#888888] mb-1">
                  LEGAL PROVENANCE IDENTIFIER
                </label>
                <input
                  type="text"
                  value={formProvenance}
                  onChange={(e) => setFormProvenance(e.target.value)}
                  className="w-full px-3 py-2 bg-[#121212] border border-[#262626] text-xs font-mono text-[#F5F5F5] focus:outline-none focus:border-[#D4AF37]"
                  required
                />
              </div>

              <div className="pt-4 border-t border-[#222222] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border border-[#333333] text-xs font-mono text-[#A0A0A0] hover:text-[#F5F5F5]"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-[#D4AF37] hover:bg-[#b89528] text-xs font-mono font-medium text-[#050505] transition-colors"
                >
                  {submitting ? 'COMMITTING TO LEDGER...' : 'RECORD RELATIONSHIP'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Termination Reason Modal */}
      {terminateTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="border border-[#333333] bg-[#0c0c0c] w-full max-w-md p-6 space-y-4">
            <h3 className="text-sm font-mono uppercase tracking-wider text-[#F5F5F5]">Terminate Economic Relationship</h3>
            <form onSubmit={handleTerminate} className="space-y-3">
              <textarea
                rows={3}
                required
                value={terminateReason}
                onChange={(e) => setTerminateReason(e.target.value)}
                placeholder="Specify regulatory or operational termination reason..."
                className="w-full px-3 py-2 bg-[#121212] border border-[#262626] text-xs text-[#F5F5F5]"
              />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setTerminateTargetId(null)} className="px-3 py-1.5 border border-[#333333] text-xs font-mono text-[#A0A0A0]">
                  CANCEL
                </button>
                <button type="submit" className="px-4 py-1.5 bg-red-600 text-xs font-mono text-white">
                  CONFIRM TERMINATE
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
