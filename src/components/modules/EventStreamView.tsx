/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AETHER–AROS V5 - AETHER Event Network Stream & DLQ Inspector
 * African Economic, Agricultural & Resilience Operating System
 * Developed under VINEXSAH TECHNOLOGIES. All rights reserved.
 */

import React, { useState, useEffect } from 'react';
import {
  Radio,
  RefreshCw,
  RotateCcw,
  CheckCircle,
  AlertOctagon,
  Send,
  Filter,
  Layers,
  ArrowRight,
  Database,
  Search,
} from 'lucide-react';
import { api } from '../../services/apiClient.ts';
import { AetherEvent, AetherEventCategory, AetherEventStatus } from '../../types/index.ts';

export default function EventStreamView() {
  const [events, setEvents] = useState<AetherEvent[]>([]);
  const [dlqEvents, setDlqEvents] = useState<AetherEvent[]>([]);
  const [activeTab, setActiveTab] = useState<'STREAM' | 'DLQ'>('STREAM');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedEvent, setSelectedEvent] = useState<AetherEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionStatus, setActionStatus] = useState<string | null>(null);

  // New Event Form State
  const [showEmitModal, setShowEmitModal] = useState(false);
  const [emitCategory, setEmitCategory] = useState<AetherEventCategory>('TRADE_CONTRACT_CONFIRMED');
  const [emitProducer, setEmitProducer] = useState('trade-matching-worker');
  const [emitPayloadStr, setEmitPayloadStr] = useState(
    JSON.stringify({ contractId: 'tc-001', commodity: 'Yellow Maize', quantityMT: 100, priceUGX: 130000000 }, null, 2)
  );

  const loadData = async () => {
    try {
      setRefreshing(true);
      const [allEvents, dlq] = await Promise.all([
        api.getEvents(selectedCategory || undefined, selectedStatus || undefined),
        api.getDeadLetterQueue(),
      ]);
      setEvents(allEvents);
      setDlqEvents(dlq);
    } catch (err) {
      console.error('Failed to load event data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    const timer = setInterval(loadData, 10000);
    return () => clearInterval(timer);
  }, [selectedCategory, selectedStatus]);

  const handleAck = async (id: string) => {
    try {
      setActionStatus(`Acknowledging event ${id}...`);
      await api.acknowledgeEvent(id, 'aether-regional-consumer');
      setActionStatus(`Event ${id} successfully acknowledged`);
      await loadData();
    } catch (err: any) {
      setActionStatus(`Ack failed: ${err.message}`);
    }
  };

  const handleReplay = async (id: string) => {
    try {
      setActionStatus(`Replaying event ${id}...`);
      await api.replayEvent(id, 'Manual operator replay');
      setActionStatus(`Event ${id} queued for replay`);
      await loadData();
    } catch (err: any) {
      setActionStatus(`Replay failed: ${err.message}`);
    }
  };

  const handleRetryDlq = async (id: string) => {
    try {
      setActionStatus(`Retrying DLQ event ${id}...`);
      await api.retryDlqEvent(id);
      setActionStatus(`Event ${id} re-enqueued from DLQ`);
      await loadData();
    } catch (err: any) {
      setActionStatus(`Retry DLQ failed: ${err.message}`);
    }
  };

  const handleEmitNewEvent = async () => {
    try {
      let parsedPayload = {};
      try {
        parsedPayload = JSON.parse(emitPayloadStr);
      } catch (e) {
        setActionStatus('Invalid JSON payload format');
        return;
      }

      setActionStatus('Emitting event to durable bus...');
      await api.emitEvent({
        category: emitCategory,
        sourceService: emitProducer,
        producerService: emitProducer,
        payload: parsedPayload,
      });
      setActionStatus('Event published successfully');
      setShowEmitModal(false);
      await loadData();
    } catch (err: any) {
      setActionStatus(`Emit failed: ${err.message}`);
    }
  };

  const currentList = activeTab === 'STREAM' ? events : dlqEvents;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-stone-800 gap-4">
        <div className="flex items-center space-x-3">
          <span className="p-2 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20">
            <Radio className="w-6 h-6 animate-pulse" />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-stone-100">
              ECONEX Event Network & Bus Inspector
            </h1>
            <p className="text-sm text-stone-400">
              Durable Event Bus, At-Least-Once Delivery, DLQ Routing & Correlation Traceability
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowEmitModal(true)}
            className="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold rounded-lg text-sm flex items-center space-x-1.5 transition-colors"
          >
            <Send className="w-4 h-4" />
            <span>Emit Event</span>
          </button>
          <button
            onClick={loadData}
            disabled={refreshing}
            className="px-3 py-2 bg-stone-900 hover:bg-stone-800 text-stone-300 rounded-lg border border-stone-700 text-sm flex items-center space-x-2 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {actionStatus && (
        <div className="p-3 bg-stone-900 border border-amber-500/30 text-amber-300 rounded-lg text-xs flex items-center justify-between">
          <span>{actionStatus}</span>
          <button onClick={() => setActionStatus(null)} className="text-stone-400 hover:text-stone-200">
            &times;
          </button>
        </div>
      )}

      {/* Navigation tabs & filter bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-900/60 p-3 rounded-xl border border-stone-800">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('STREAM')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
              activeTab === 'STREAM'
                ? 'bg-amber-500 text-stone-950'
                : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Active Stream ({events.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('DLQ')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
              activeTab === 'DLQ'
                ? 'bg-rose-500 text-white'
                : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
            }`}
          >
            <AlertOctagon className="w-3.5 h-3.5" />
            <span>Dead-Letter Queue ({dlqEvents.length})</span>
          </button>
        </div>

        {activeTab === 'STREAM' && (
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-stone-950 border border-stone-700 text-stone-300 text-xs rounded px-2.5 py-1.5"
            >
              <option value="">All Categories</option>
              <option value="FARMER_HARVEST_RECORDED">FARMER_HARVEST_RECORDED</option>
              <option value="TRADE_CONTRACT_CONFIRMED">TRADE_CONTRACT_CONFIRMED</option>
              <option value="PAYMENT_SETTLEMENT_CONFIRMED">PAYMENT_SETTLEMENT_CONFIRMED</option>
              <option value="CARGO_CHECKPOINT_REACHED">CARGO_CHECKPOINT_REACHED</option>
              <option value="PRODUCTION_BATCH_COMPLETED">PRODUCTION_BATCH_COMPLETED</option>
              <option value="CROSS_BORDER_CUSTOMS_CLEARED">CROSS_BORDER_CUSTOMS_CLEARED</option>
              <option value="DISRUPTION_DETECTED">DISRUPTION_DETECTED</option>
              <option value="REMEDIATION_TRIGGERED">REMEDIATION_TRIGGERED</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-stone-950 border border-stone-700 text-stone-300 text-xs rounded px-2.5 py-1.5"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">PENDING</option>
              <option value="PROCESSING">PROCESSING</option>
              <option value="ACKNOWLEDGED">ACKNOWLEDGED</option>
              <option value="FAILED">FAILED</option>
              <option value="DEAD_LETTER">DEAD_LETTER</option>
            </select>
          </div>
        )}
      </div>

      {/* Main Grid: Event Stream vs Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Events Table / Stream List */}
        <div className="lg:col-span-2 bg-stone-900/90 border border-stone-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-stone-100">
              {activeTab === 'STREAM' ? 'In-Flight & Processed Events' : 'Dead-Letter Queue (DLQ)'}
            </h2>
            <span className="text-xs text-stone-500 font-mono">
              Displaying {currentList.length} items
            </span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-stone-500">Loading events...</div>
          ) : currentList.length === 0 ? (
            <div className="py-12 text-center text-stone-500">
              {activeTab === 'STREAM' ? 'No events found for current filter.' : 'DLQ is empty. All events healthy!'}
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
              {currentList.map((evt) => (
                <div
                  key={evt.id}
                  onClick={() => setSelectedEvent(evt)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    selectedEvent?.id === evt.id
                      ? 'bg-stone-800/90 border-amber-500'
                      : 'bg-stone-950/60 border-stone-800 hover:border-stone-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-semibold text-amber-400">
                        {evt.category}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-800 text-stone-400 font-mono">
                        v{evt.schemaVersion || 5}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded uppercase font-semibold font-mono ${
                        evt.status === 'ACKNOWLEDGED' || evt.status === 'PROCESSED'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : evt.status === 'PROCESSING'
                          ? 'bg-blue-500/20 text-blue-300'
                          : evt.status === 'PENDING' || evt.status === 'EMITTED'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-rose-500/20 text-rose-300'
                      }`}
                    >
                      {evt.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-stone-400 mt-2 font-mono">
                    <span className="truncate max-w-[200px]">Producer: {evt.sourceService || evt.producerService}</span>
                    <span>Retries: {evt.retryCount}/3</span>
                    <span>{new Date(evt.timestamp || evt.emittedAt || Date.now()).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Event Details Inspector */}
        <div className="bg-stone-900/90 border border-stone-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center space-x-2 border-b border-stone-800 pb-3">
            <Search className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-semibold text-stone-100">Event Inspector</h2>
          </div>

          {selectedEvent ? (
            <div className="space-y-4 text-xs">
              <div className="space-y-1">
                <span className="text-stone-500 block">Event ID:</span>
                <span className="font-mono text-amber-300 text-[11px] break-all">{selectedEvent.id}</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-stone-500 block">Category:</span>
                  <span className="text-stone-200 font-mono text-[11px]">{selectedEvent.category}</span>
                </div>
                <div>
                  <span className="text-stone-500 block">Status:</span>
                  <span className="text-stone-200 font-mono text-[11px]">{selectedEvent.status}</span>
                </div>
              </div>

              <div>
                <span className="text-stone-500 block">Correlation ID:</span>
                <span className="font-mono text-stone-300 text-[11px] break-all">
                  {selectedEvent.correlationId || 'N/A'}
                </span>
              </div>

              <div>
                <span className="text-stone-500 block">Payload Schema (JSON):</span>
                <pre className="p-3 bg-stone-950 rounded-lg text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-48 border border-stone-800">
                  {JSON.stringify(selectedEvent.payload, null, 2)}
                </pre>
              </div>

              {(selectedEvent.deadLetterReason || selectedEvent.lastError) && (
                <div className="p-2.5 bg-rose-950/40 border border-rose-500/30 text-rose-300 rounded-lg text-[11px]">
                  <strong>DLQ Reason:</strong> {selectedEvent.deadLetterReason || selectedEvent.lastError}
                </div>
              )}

              {/* Action Buttons for selected event */}
              <div className="pt-2 border-t border-stone-800 space-y-2">
                {selectedEvent.status !== 'ACKNOWLEDGED' && selectedEvent.status !== 'DEAD_LETTER' && selectedEvent.status !== 'FAILED_DLQ' && (
                  <button
                    onClick={() => handleAck(selectedEvent.id)}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Acknowledge Event (ACK)</span>
                  </button>
                )}

                <button
                  onClick={() => handleReplay(selectedEvent.id)}
                  className="w-full py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                  <span>Replay Event (Audit Trace)</span>
                </button>

                {(selectedEvent.status === 'DEAD_LETTER' || selectedEvent.status === 'FAILED_DLQ') && (
                  <button
                    onClick={() => handleRetryDlq(selectedEvent.id)}
                    className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Retry DLQ Event</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="py-16 text-center text-stone-500 text-xs">
              Select an event from the list to inspect schema headers, payload and trace metadata.
            </div>
          )}
        </div>
      </div>

      {/* Emit Event Modal */}
      {showEmitModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <h3 className="text-lg font-bold text-stone-100">Emit Custom ECONEX Event</h3>
              <button
                onClick={() => setShowEmitModal(false)}
                className="text-stone-400 hover:text-stone-200 text-lg"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-stone-400 block mb-1">Event Category</label>
                <select
                  value={emitCategory}
                  onChange={(e) => setEmitCategory(e.target.value as any)}
                  className="w-full bg-stone-950 border border-stone-700 rounded px-3 py-2 text-stone-200"
                >
                  <option value="TRADE_CONTRACT_CONFIRMED">TRADE_CONTRACT_CONFIRMED</option>
                  <option value="FARMER_HARVEST_RECORDED">FARMER_HARVEST_RECORDED</option>
                  <option value="PAYMENT_SETTLEMENT_CONFIRMED">PAYMENT_SETTLEMENT_CONFIRMED</option>
                  <option value="CARGO_CHECKPOINT_REACHED">CARGO_CHECKPOINT_REACHED</option>
                  <option value="PRODUCTION_BATCH_COMPLETED">PRODUCTION_BATCH_COMPLETED</option>
                  <option value="CROSS_BORDER_CUSTOMS_CLEARED">CROSS_BORDER_CUSTOMS_CLEARED</option>
                  <option value="DISRUPTION_DETECTED">DISRUPTION_DETECTED</option>
                </select>
              </div>

              <div>
                <label className="text-stone-400 block mb-1">Producer Service</label>
                <input
                  type="text"
                  value={emitProducer}
                  onChange={(e) => setEmitProducer(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 rounded px-3 py-2 text-stone-200 font-mono"
                />
              </div>

              <div>
                <label className="text-stone-400 block mb-1">Payload (JSON)</label>
                <textarea
                  rows={5}
                  value={emitPayloadStr}
                  onChange={(e) => setEmitPayloadStr(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 rounded p-3 text-emerald-400 font-mono text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t border-stone-800">
              <button
                onClick={() => setShowEmitModal(false)}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleEmitNewEvent}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded text-xs font-bold"
              >
                Publish to Bus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
