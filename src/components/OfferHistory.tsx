import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SparkOffer } from '../types';
import { ShoppingBag, Truck, Box, RotateCcw, ChevronLeft, ChevronRight, CheckCircle, XCircle, AlertTriangle, Trash2, Download, Check } from 'lucide-react';

interface OfferHistoryProps {
  offers: SparkOffer[];
  onReplay: (offer: SparkOffer) => void;
  onDeleteOffers?: (ids: string[]) => void;
}

export default function OfferHistory({ offers, onReplay, onDeleteOffers }: OfferHistoryProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedOfferId, setExpandedOfferId] = useState<string | null>(null);
  const [selectedOfferIds, setSelectedOfferIds] = useState<string[]>([]);
  const [isExported, setIsExported] = useState(false);
  const itemsPerPage = 6;

  const toggleSelectOffer = (id: string) => {
    setSelectedOfferIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const historyOffers = offers.filter(o => o.status !== 'pending');

  const toggleSelectAllOffers = () => {
    if (selectedOfferIds.length === historyOffers.length) {
      setSelectedOfferIds([]);
    } else {
      setSelectedOfferIds(historyOffers.map(o => o.id));
    }
  };

  const handleDeleteSelected = () => {
    if (selectedOfferIds.length === 0) return;
    if (onDeleteOffers) {
      onDeleteOffers(selectedOfferIds);
    }
    setSelectedOfferIds([]);
  };

  const handleExportCSV = () => {
    if (historyOffers.length === 0) return;

    const exportItems = selectedOfferIds.length > 0
      ? historyOffers.filter(o => selectedOfferIds.includes(o.id))
      : historyOffers;

    const headers = [
      'Offer ID',
      'Platform',
      'Store / Merchant Name',
      'Store Number',
      'Order Type',
      'Status',
      'Handled By',
      'Total Pay ($)',
      'Base Pay ($)',
      'Tip ($)',
      'Distance (miles)',
      'Pay Per Mile ($/mi)',
      'Items Count',
      'Reaction Time (ms)',
      'Created Date & Time',
      'Expiration Date & Time'
    ];

    const escapeCsvValue = (value: string | number | undefined | null): string => {
      if (value === null || value === undefined) return '""';
      const str = String(value);
      if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return `"${str}"`;
    };

    const rows = exportItems.map(o => {
      const payPerMile = o.distance > 0 ? (o.totalPay / o.distance).toFixed(2) : '0.00';
      const createdStr = o.createdAt ? new Date(o.createdAt).toLocaleString() : '';
      const expiresStr = o.expiresAt ? new Date(o.expiresAt).toLocaleString() : '';
      const handledBy = o.acceptedBy === 'bot'
        ? 'Bot Auto-Clicker'
        : o.acceptedBy === 'manual'
        ? 'Manual Tapping'
        : o.acceptedBy === 'competitor'
        ? 'Competitor'
        : 'N/A';

      return [
        escapeCsvValue(o.id),
        escapeCsvValue(o.platform || 'Spark'),
        escapeCsvValue(o.storeName),
        escapeCsvValue(o.storeNumber),
        escapeCsvValue(o.type),
        escapeCsvValue(o.status.toUpperCase()),
        escapeCsvValue(handledBy),
        escapeCsvValue(o.totalPay?.toFixed(2) ?? '0.00'),
        escapeCsvValue(o.basePay?.toFixed(2) ?? '0.00'),
        escapeCsvValue(o.tip?.toFixed(2) ?? '0.00'),
        escapeCsvValue(o.distance?.toFixed(1) ?? '0.0'),
        escapeCsvValue(payPerMile),
        escapeCsvValue(o.itemsCount ?? 0),
        escapeCsvValue(o.acceptTimeMs ?? 'N/A'),
        escapeCsvValue(createdStr),
        escapeCsvValue(expiresStr)
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStamp = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.setAttribute('download', `hgt_dispatch_records_${dateStamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setIsExported(true);
    setTimeout(() => setIsExported(false), 2000);
  };

  const toggleExpand = (id: string) => {
    setExpandedOfferId((prev) => (prev === id ? null : id));
  };

  const totalPages = Math.ceil(historyOffers.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedOffers = historyOffers.slice(startIndex, startIndex + itemsPerPage);

  const getPlatformStyle = (platform: string) => {
    switch (platform) {
      case 'Spark':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'Instacart':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'DoorDash':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'Amazon Flex':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'Uber Eats':
        return 'bg-teal-500/10 text-teal-400 border-teal-500/20';
      case 'Veho':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Postmates':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      default:
        return 'bg-neutral-800 text-neutral-400 border-neutral-700';
    }
  };

  const getOrderIcon = (type: string) => {
    if (type.includes('Shop') || type.includes('Service') || type.includes('Bag')) {
      return <ShoppingBag className="w-3.5 h-3.5" />;
    }
    if (type.includes('Pickup') || type.includes('Delivery Only') || type.includes('Delivery') || type.includes('Courier') || type.includes('Pack') || type.includes('Block') || type.includes('Trip')) {
      return <Truck className="w-3.5 h-3.5" />;
    }
    return <Box className="w-3.5 h-3.5" />;
  };

  const getOrderTypeStyle = (type: string) => {
    if (type.includes('Shop') || type.includes('Service') || type.includes('Bag')) {
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    }
    if (type.includes('Pickup') || type.includes('Delivery Only') || type.includes('Delivery') || type.includes('Courier') || type.includes('Pack') || type.includes('Block') || type.includes('Trip')) {
      return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
    }
    return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
  };

  const getStatusDisplay = (offer: SparkOffer) => {
    switch (offer.status) {
      case 'accepted':
        return (
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 font-bold">
              <CheckCircle className="w-3.5 h-3.5" />
              ACCEPTED
            </span>
            <span className="text-[9px] text-neutral-500 font-mono mt-0.5">
              By: {offer.acceptedBy === 'bot' ? 'Bot Auto-Clicker' : 'Manual Tapping'}
            </span>
          </div>
        );
      case 'declined':
        return (
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-mono text-rose-400 flex items-center gap-1 font-bold">
              <XCircle className="w-3.5 h-3.5" />
              DECLINED
            </span>
          </div>
        );
      case 'expired':
        return (
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-mono text-amber-400 flex items-center gap-1 font-bold">
              <AlertTriangle className="w-3.5 h-3.5" />
              {offer.acceptedBy === 'competitor' ? 'SNATCHED BY COMPETITOR' : 'EXPIRED / MISSED'}
            </span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 h-full flex flex-col justify-between min-h-[420px]">
      <div>
        {/* Header containing feed info */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800 mb-5">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-neutral-600 rounded-full" />
            <span className="text-sm font-sans font-medium text-white uppercase tracking-wider">Offer History Log</span>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            {/* Export as CSV Button */}
            <button
              id="export-csv-offers-btn"
              onClick={handleExportCSV}
              disabled={historyOffers.length === 0}
              className={`px-2.5 py-1 rounded text-[10px] font-mono font-medium transition-all flex items-center gap-1.5 cursor-pointer border ${
                historyOffers.length === 0
                  ? 'bg-neutral-950 text-neutral-600 border-neutral-800 cursor-not-allowed'
                  : isExported
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                  : 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border-blue-500/30 hover:border-blue-500/50 active:scale-95'
              }`}
              title={
                historyOffers.length === 0
                  ? 'No dispatch records available to export'
                  : selectedOfferIds.length > 0
                  ? `Download ${selectedOfferIds.length} selected dispatch records as CSV`
                  : 'Download all dispatch records as CSV for external analysis'
              }
            >
              {isExported ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span>Downloaded!</span>
                </>
              ) : (
                <>
                  <Download className="w-3 h-3" />
                  <span>
                    {selectedOfferIds.length > 0
                      ? `Export as CSV (${selectedOfferIds.length})`
                      : 'Export as CSV'}
                  </span>
                </>
              )}
            </button>

            {selectedOfferIds.length > 0 && (
              <button
                id="batch-delete-offers-btn"
                onClick={handleDeleteSelected}
                className="px-2 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/40 rounded text-[10px] font-mono font-bold transition-all flex items-center gap-1 cursor-pointer animate-pulse"
                title="Delete selected offer records from history"
              >
                <Trash2 className="w-3 h-3 text-rose-400" />
                <span>Delete Selected ({selectedOfferIds.length})</span>
              </button>
            )}

            {historyOffers.length > 0 && (
              <button
                id="select-all-offers-btn"
                onClick={toggleSelectAllOffers}
                className="px-2 py-1 bg-neutral-950 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 rounded text-[10px] font-mono transition-all flex items-center gap-1 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedOfferIds.length === historyOffers.length && historyOffers.length > 0}
                  onChange={() => {}}
                  className="w-3 h-3 rounded accent-emerald-500 cursor-pointer"
                />
                <span>{selectedOfferIds.length === historyOffers.length ? 'Deselect All' : 'Select All'}</span>
              </button>
            )}

            <div className="text-[10px] text-neutral-400 font-mono">
              {historyOffers.length} Past Records
            </div>
          </div>
        </div>

        {/* Offers Feed container */}
        <div className="space-y-3 min-h-[300px]">
          <AnimatePresence mode="wait">
            {historyOffers.length === 0 ? (
              <motion.div
                key="empty-history"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-16 text-center"
              >
                <div className="w-12 h-12 rounded-full border border-neutral-800 flex items-center justify-center text-neutral-600 mb-3">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-mono text-neutral-400 uppercase tracking-wider mb-1">
                  No Past Offers Yet
                </h4>
                <p className="text-[10px] text-neutral-500 max-w-[280px]">
                  Archived actions will appear here once offers are interacted with or expired.
                </p>
              </motion.div>
            ) : (
              paginatedOffers.map((offer) => (
                <motion.div
                  key={offer.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  onClick={() => toggleExpand(offer.id)}
                  className={`bg-neutral-950 rounded-lg border select-none hover:border-neutral-700 transition-colors flex flex-col cursor-pointer overflow-hidden ${
                    selectedOfferIds.includes(offer.id) ? 'border-emerald-500/50 bg-emerald-500/5' : expandedOfferId === offer.id ? 'border-neutral-700/80 bg-neutral-900/30' : 'border-neutral-800'
                  }`}
                >
                  <div className="p-3 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedOfferIds.includes(offer.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleSelectOffer(offer.id);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 rounded accent-emerald-500 cursor-pointer shrink-0"
                      />

                      {/* Pay & Type */}
                      <div className="min-w-[80px]">
                        <div className="text-sm font-sans font-extrabold text-neutral-100">
                          ${offer.totalPay.toFixed(2)}
                        </div>
                        <div className="text-[9px] font-mono text-neutral-500 mt-0.5">
                          {offer.distance} mi
                        </div>
                      </div>

                      <div className="hidden md:block w-px bg-neutral-800 h-8"></div>

                      {/* Store info */}
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap mb-1">
                          <span className="text-[10px] font-mono text-neutral-400">#{offer.id}</span>
                          <span className={`text-[8.5px] font-mono font-bold uppercase px-1.5 py-0.5 rounded border flex items-center gap-1 shrink-0 ${getPlatformStyle(offer.platform)}`}>
                            {offer.platform}
                          </span>
                          <span className={`text-[8.5px] font-mono font-bold uppercase px-1.5 py-0.5 rounded border flex items-center gap-1 shrink-0 ${getOrderTypeStyle(offer.type)}`}>
                            {getOrderIcon(offer.type)}
                            {offer.type}
                          </span>
                        </div>
                        <h4 className="text-[11px] font-sans font-medium text-neutral-300">
                          {offer.storeName}
                        </h4>
                      </div>
                    </div>

                    {/* Right Actions & Status */}
                    <div className="flex items-center gap-4">
                      {getStatusDisplay(offer)}
                      
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onReplay(offer);
                        }}
                        className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white rounded transition-colors cursor-pointer"
                        title="Replay this offer dispatch"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Expandable Details */}
                  <AnimatePresence>
                    {expandedOfferId === offer.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="px-3 pb-3 border-t border-neutral-800/50 pt-3 bg-black/20"
                      >
                        <div className="flex items-start justify-between flex-wrap gap-4">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-grow">
                            <div>
                              <div className="text-[9px] font-mono text-neutral-500 uppercase mb-1">Base Pay</div>
                              <div className="text-xs font-sans text-neutral-300 font-medium">${offer.basePay.toFixed(2)}</div>
                            </div>
                            <div>
                              <div className="text-[9px] font-mono text-neutral-500 uppercase mb-1">Tip Amount</div>
                              <div className="text-xs font-sans text-neutral-300 font-medium">${offer.tip.toFixed(2)}</div>
                            </div>
                            <div>
                              <div className="text-[9px] font-mono text-neutral-500 uppercase mb-1">Total Items</div>
                              <div className="text-xs font-sans text-neutral-300 font-medium">{offer.itemsCount} units</div>
                            </div>
                            <div>
                              <div className="text-[9px] font-mono text-neutral-500 uppercase mb-1">Store ID</div>
                              <div className="text-xs font-sans text-neutral-300 font-medium">#{offer.storeNumber}</div>
                            </div>
                          </div>
                        </div>

                        {/* Dynamic Forwarding Logs */}
                        <div className="mt-3.5 pt-3 border-t border-neutral-800/40 flex items-center gap-2 flex-wrap text-[9px] font-mono">
                          <span className="text-neutral-500 uppercase font-semibold text-[8px]">Notification Pipeline:</span>
                          <span className="px-1.5 py-0.5 rounded bg-cyan-950/25 text-cyan-400 border border-cyan-900/40 font-bold text-[8px] flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-cyan-400 animate-pulse"></span>
                            📡 TELEGRAM ALERTS: SENT OK
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-emerald-950/25 text-emerald-400 border border-emerald-900/40 font-bold text-[8px] flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse"></span>
                            🟢 WHATSAPP PIPELINE: SENT OK
                          </span>
                        </div>

                        {/* Faux Itemized Breakdown if items exist or passengers */}
                        {(offer.itemsCount > 0 || offer.type === 'UberX Ride') && (
                          <div className="mt-4 pt-3 border-t border-neutral-800/50">
                            <div className="text-[10px] font-mono text-neutral-400 mb-2.5 flex items-center gap-1.5">
                              <Box className="w-3 h-3 text-neutral-500" />
                              ITEMIZED BREAKDOWN
                            </div>
                            <div className="flex gap-2 flex-wrap">
                              {offer.platform === 'Spark' && offer.type === 'Shop & Deliver' ? (
                                <>
                                  <div className="bg-neutral-900 border border-neutral-800 px-2.5 py-1.5 rounded flex flex-col min-w-[70px]">
                                    <span className="text-[9px] font-mono text-neutral-500 uppercase mb-0.5">Produce</span>
                                    <span className="text-xs font-sans text-neutral-300">{Math.max(1, Math.ceil(offer.itemsCount * 0.3))} items</span>
                                  </div>
                                  <div className="bg-neutral-900 border border-neutral-800 px-2.5 py-1.5 rounded flex flex-col min-w-[70px]">
                                    <span className="text-[9px] font-mono text-neutral-500 uppercase mb-0.5">Pantry</span>
                                    <span className="text-xs font-sans text-neutral-300">{Math.max(1, Math.ceil(offer.itemsCount * 0.4))} items</span>
                                  </div>
                                  <div className="bg-neutral-900 border border-neutral-800 px-2.5 py-1.5 rounded flex flex-col min-w-[70px]">
                                    <span className="text-[9px] font-mono text-neutral-500 uppercase mb-0.5">Frozen</span>
                                    <span className="text-xs font-sans text-neutral-300">{Math.max(1, Math.floor(offer.itemsCount * 0.3))} items</span>
                                  </div>
                                </>
                              ) : offer.platform === 'Instacart' ? (
                                <>
                                  <div className="bg-neutral-900 border border-neutral-800 px-2.5 py-1.5 rounded flex flex-col min-w-[70px]">
                                    <span className="text-[9px] font-mono text-neutral-500 uppercase mb-0.5">Fresh Foods</span>
                                    <span className="text-xs font-sans text-neutral-300">{Math.max(1, Math.ceil(offer.itemsCount * 0.35))} units</span>
                                  </div>
                                  <div className="bg-neutral-900 border border-neutral-800 px-2.5 py-1.5 rounded flex flex-col min-w-[70px]">
                                    <span className="text-[9px] font-mono text-neutral-500 uppercase mb-0.5">Beverages</span>
                                    <span className="text-xs font-sans text-neutral-300">{Math.max(1, Math.ceil(offer.itemsCount * 0.25))} units</span>
                                  </div>
                                  <div className="bg-neutral-900 border border-neutral-800 px-2.5 py-1.5 rounded flex flex-col min-w-[70px]">
                                    <span className="text-[9px] font-mono text-neutral-500 uppercase mb-0.5">Pantry Bulk</span>
                                    <span className="text-xs font-sans text-neutral-300">{Math.max(1, Math.floor(offer.itemsCount * 0.4))} units</span>
                                  </div>
                                </>
                              ) : offer.platform === 'DoorDash' || offer.platform === 'Uber Eats' ? (
                                <>
                                  {offer.type === 'UberX Ride' ? (
                                    <div className="bg-neutral-900 border border-neutral-800 px-2.5 py-1.5 rounded flex flex-col w-full max-w-sm">
                                      <span className="text-[9px] font-mono text-neutral-500 uppercase mb-0.5">Passenger Capacity</span>
                                      <span className="text-xs font-sans text-neutral-300">Up to 4 riders • Standard Luggage Limit</span>
                                    </div>
                                  ) : (
                                    <>
                                      <div className="bg-neutral-900 border border-neutral-800 px-2.5 py-1.5 rounded flex flex-col min-w-[70px]">
                                        <span className="text-[9px] font-mono text-neutral-500 uppercase mb-0.5">Warm Entrees</span>
                                        <span className="text-xs font-sans text-neutral-400">Thermal packed</span>
                                      </div>
                                      <div className="bg-neutral-900 border border-neutral-800 px-2.5 py-1.5 rounded flex flex-col min-w-[70px]">
                                        <span className="text-[9px] font-mono text-neutral-500 uppercase mb-0.5">Bevearges</span>
                                        <span className="text-xs font-sans text-neutral-400">Packed cups</span>
                                      </div>
                                    </>
                                  )}
                                </>
                              ) : offer.platform === 'Amazon Flex' ? (
                                <>
                                  <div className="bg-neutral-900 border border-neutral-800 px-2.5 py-1.5 rounded flex flex-col min-w-[70px]">
                                    <span className="text-[9px] font-mono text-neutral-500 uppercase mb-0.5">Heavy Parcels</span>
                                    <span className="text-xs font-sans text-neutral-300">{Math.max(1, Math.ceil(offer.itemsCount * 0.3))} boxes</span>
                                  </div>
                                  <div className="bg-neutral-900 border border-neutral-800 px-2.5 py-1.5 rounded flex flex-col min-w-[70px]">
                                    <span className="text-[9px] font-mono text-neutral-500 uppercase mb-0.5">Poly envelopes</span>
                                    <span className="text-xs font-sans text-neutral-300">{Math.max(1, Math.floor(offer.itemsCount * 0.7))} packs</span>
                                  </div>
                                </>
                              ) : (
                                <div className="bg-neutral-900 border border-neutral-800 px-2.5 py-1.5 rounded flex flex-col w-full max-w-sm">
                                  <span className="text-[9px] font-mono text-neutral-500 uppercase mb-0.5">Sealed Packages</span>
                                  <span className="text-xs font-sans text-neutral-300">{offer.itemsCount} pre-packaged units to be picked up</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Pagination Controls */}
      {historyOffers.length > 0 && (
        <div className="flex items-center justify-between pt-4 border-t border-neutral-800 mt-4">
          <div className="text-[10px] font-mono text-neutral-500">
            PAGE {currentPage} OF {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="p-1 bg-neutral-950 border border-neutral-800 rounded text-neutral-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              className="p-1 bg-neutral-950 border border-neutral-800 rounded text-neutral-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
