import React, { useEffect, useState } from 'react';
import { safeStorage as localStorage } from '../lib/safeStorage';
import { motion, AnimatePresence } from 'motion/react';
import { SparkOffer, BotFilters } from '../types';
import { ShoppingBag, Truck, Box, Navigation, Check, X, BellDot, Zap } from 'lucide-react';

interface ActiveOffersProps {
  offers: SparkOffer[];
  filters: BotFilters;
  onAccept: (offer: SparkOffer, by: 'manual' | 'bot') => void;
  onDecline: (offer: SparkOffer) => void;
}

export default function ActiveOffers({ offers, filters, onAccept, onDecline }: ActiveOffersProps) {
  // We want to calculate a live progress bar for each offer's expiration.
  // Although we have high-level timers, syncing a stateful feedback in React
  // allows fluid countdown bars.
  const [now, setNow] = useState(Date.now());
  const [tgRoutingActive, setTgRoutingActive] = useState(() => {
    return localStorage.getItem('spark_bot_send_leads') !== 'false';
  });
  const [waRoutingActive, setWaRoutingActive] = useState(() => {
    return localStorage.getItem('spark_bot_wa_active') === 'true';
  });

  useEffect(() => {
    let interval = setInterval(() => {
      setNow(Date.now());
    }, 150);
    return () => clearInterval(interval);
  }, []);

  // Poll configuration settings with short intervals so change elsewhere reflects instantly
  useEffect(() => {
    const syncStorage = () => {
      const tg = localStorage.getItem('spark_bot_send_leads') !== 'false';
      const wa = localStorage.getItem('spark_bot_wa_active') === 'true';
      if (tg !== tgRoutingActive) {
        setTgRoutingActive(tg);
      }
      if (wa !== waRoutingActive) {
        setWaRoutingActive(wa);
      }
    };
    const interval = setInterval(syncStorage, 1000);
    return () => clearInterval(interval);
  }, [tgRoutingActive, waRoutingActive]);

  const toggleTelegramOption = () => {
    const nextVal = !tgRoutingActive;
    setTgRoutingActive(nextVal);
    localStorage.setItem('spark_bot_send_leads', String(nextVal));
    setTimeout(() => {
      window.dispatchEvent(new Event('storage'));
    }, 0);
  };

  const toggleWhatsAppOption = () => {
    const nextVal = !waRoutingActive;
    setWaRoutingActive(nextVal);
    localStorage.setItem('spark_bot_wa_active', String(nextVal));
    setTimeout(() => {
      window.dispatchEvent(new Event('storage'));
    }, 0);
  };

  const getPlatformStyle = (platform: string) => {
    switch (platform) {
      case 'Spark':
        return {
          bg: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
          badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
          dot: 'bg-blue-500',
          name: 'Walmart Spark',
        };
      case 'Instacart':
        return {
          bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
          badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
          dot: 'bg-emerald-500',
          name: 'Instacart Shopper',
        };
      case 'DoorDash':
        return {
          bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
          badge: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
          dot: 'bg-rose-500',
          name: 'DoorDash Driver',
        };
      case 'Amazon Flex':
        return {
          bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
          badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
          dot: 'bg-amber-500',
          name: 'Amazon Flex',
        };
      case 'Uber Eats':
        return {
          bg: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
          badge: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
          dot: 'bg-teal-500',
          name: 'Uber Eats',
        };
      case 'Shipt':
        return {
          bg: 'bg-green-500/10 text-green-400 border-green-500/20',
          badge: 'bg-green-500/10 text-green-400 border-green-500/20',
          dot: 'bg-green-500',
          name: 'Shipt Shopper',
        };
      case 'Roadie':
        return {
          bg: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
          badge: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
          dot: 'bg-yellow-500',
          name: 'Roadie Delivery',
        };
      case 'Bungii':
        return {
          bg: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
          badge: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
          dot: 'bg-purple-500',
          name: 'Bungii Hauler',
        };
      case 'GoShare':
        return {
          bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
          badge: 'bg-indigo-400/10 text-indigo-400 border-indigo-400/20',
          dot: 'bg-indigo-550',
          name: 'GoShare Logistics',
        };
      case 'Lyft':
        return {
          bg: 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20',
          badge: 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20',
          dot: 'bg-fuchsia-500',
          name: 'Lyft Rideshare',
        };
      case 'Veho':
        return {
          bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
          badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
          dot: 'bg-emerald-500',
          name: 'Veho Logistics',
        };
      case 'Postmates':
        return {
          bg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
          badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
          dot: 'bg-cyan-500',
          name: 'Postmates Driver',
        };
      default:
        return {
          bg: 'bg-neutral-800 text-neutral-400 border-neutral-700',
          badge: 'bg-neutral-800 text-neutral-400 border-neutral-700Style',
          dot: 'bg-neutral-600',
          name: 'Gig Order',
        };
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

  const activePendings = offers.filter(o => o.status === 'pending');

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 h-full flex flex-col justify-between min-h-[420px]">
      <div>
        {/* Header containing feed info */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800 mb-5">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping" />
            <span className="text-sm font-sans font-medium text-white uppercase tracking-wider">Live Offers Dispatch</span>
          </div>
          <div className="text-[10px] text-neutral-400 font-mono">
            Feed active • {activePendings.length} on-board
          </div>
        </div>

        {/* Offers Feed container */}
        <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
          <AnimatePresence mode="popLayout">
            {activePendings.length === 0 ? (
              <motion.div
                key="empty-feed"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-neutral-800 rounded-lg p-6 bg-neutral-950/20"
              >
                <div className="w-12 h-12 rounded-full border border-neutral-800 flex items-center justify-center text-neutral-600 mb-3 animate-pulse">
                  <BellDot className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-mono text-neutral-300 font-bold uppercase tracking-wider mb-1">
                  Scanning Dispatch Wave...
                </h4>
                <p className="text-[10px] text-neutral-500 max-w-[280px]">
                  Walmart FCFS dispatches emerge at random intervals based on local grocery orders.
                </p>
                {filters.isEnabled && (
                  <div className="flex items-center gap-1.5 mt-4 text-[10px] text-amber-400/90 font-mono bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-full animate-bounce">
                    <Zap className="w-3 h-3 fill-current" />
                    <span>Bot Shield Active & Snatching</span>
                  </div>
                )}
              </motion.div>
            ) : (
              activePendings.map((offer) => {
                const totalSpan = offer.expiresAt - offer.createdAt;
                const remaining = Math.max(0, offer.expiresAt - now);
                const pct = Math.min(100, Math.max(0, (remaining / totalSpan) * 100));
                const payPerMi = (offer.totalPay / offer.distance).toFixed(2);

                const isShopAndDeliverType = 
                  offer.type === 'Shop & Deliver' || 
                  offer.type === 'Full Service' || 
                  offer.type === 'Shop & Deliver (DD)' || 
                  offer.type === 'Shop & Bag';
                const isCurbsideOrDeliveryType = 
                  offer.type === 'Curbside Pickup' || 
                  offer.type === 'Delivery Only' || 
                  offer.type === 'Restaurant Delivery' || 
                  offer.type === 'Food Courier' || 
                  offer.type === 'DashMart Pack';
                const isCourierOrBlockType = 
                  offer.type === 'Dotcom Delivery' || 
                  offer.type === 'Logistics Block' || 
                  offer.type === 'Prime Now Block' || 
                  offer.type === 'Whole Foods Block' || 
                  offer.type === 'UberX Ride' || 
                  offer.type === 'Uber Connect';

                const matchesType =
                  (isShopAndDeliverType && filters.shopAndDeliver) ||
                  (isCurbsideOrDeliveryType && filters.curbsidePickup) ||
                  (isCourierOrBlockType && filters.dotcomDelivery);

                const matchesPlatform = filters.activePlatforms ? filters.activePlatforms.includes(offer.platform) : true;

                const matchesFilters = 
                  offer.totalPay >= filters.minTotalPay &&
                  offer.distance <= filters.maxDistance &&
                  parseFloat(payPerMi) >= filters.minPayPerMile &&
                  matchesType &&
                  matchesPlatform;

                const platformBrand = getPlatformStyle(offer.platform);

                return (
                  <motion.div
                    key={offer.id}
                    layout
                    initial={{ opacity: 0, x: -20, height: 0 }}
                    animate={{ opacity: 1, x: 0, height: 'auto' }}
                    exit={{ opacity: 0, x: 20, height: 0 }}
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    className={`bg-neutral-950 rounded-xl border p-4 select-none relative overflow-hidden ${
                      matchesFilters && filters.isEnabled 
                        ? 'border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.05)]' 
                        : 'border-neutral-800'
                    }`}
                  >
                    {/* Expiration Bar Indicator */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-neutral-900 border-b border-neutral-950">
                      <div 
                        className={`h-full transition-all duration-150 ${pct < 25 ? 'bg-rose-500' : pct < 50 ? 'bg-amber-400' : 'bg-emerald-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-start gap-2 pt-2">
                      <div>
                        {/* ID, Type Badge and Class */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-mono font-bold text-neutral-300">#{offer.id}</span>
                          <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded-full border flex items-center gap-1 shrink-0 ${platformBrand.badge}`}>
                            {offer.platform}
                          </span>
                          <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded-full border flex items-center gap-1 shrink-0 ${getOrderTypeStyle(offer.type)}`}>
                            {getOrderIcon(offer.type)}
                            {offer.type}
                          </span>
                        </div>

                        {/* Store Reference */}
                        <h4 className="text-xs leading-none font-sans font-medium text-white mt-2.5">
                          {offer.storeName}
                        </h4>
                        <span className="text-[10px] font-mono text-neutral-500 mt-1 block">
                          {platformBrand.name} Hub #{offer.storeNumber}
                        </span>

                        {/* Order Description details */}
                        <div className="mt-3 text-[10px] text-neutral-400 bg-neutral-900/60 inline-flex items-center px-2 py-1 rounded">
                          {offer.type === 'UberX Ride' ? (
                            <span>Standard Trip • Seat booking</span>
                          ) : (
                            <span>{offer.itemsCount} {offer.type.includes('Delivery') || offer.type.includes('Block') ? 'stop units' : 'items'} • Cargo loading ready</span>
                          )}
                        </div>

                        {/* Dynamic Forwarding Options for telegram/whatsapp on lead */}
                        <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                          <span className="text-[7.5px] font-mono text-neutral-500 uppercase tracking-tight">Active Channels:</span>
                          <button
                            type="button"
                            onClick={toggleTelegramOption}
                            className={`px-1.5 py-0.5 rounded border text-[8px] font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                              tgRoutingActive 
                                ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/35 hover:bg-cyan-500/20' 
                                : 'bg-neutral-900 border-neutral-850 text-neutral-600 hover:text-neutral-450'
                            }`}
                            title="Indicates & controls Telegram transmission. Click to toggle state."
                          >
                            <span className={`w-1 h-1 rounded-full ${tgRoutingActive ? 'bg-cyan-400 animate-pulse' : 'bg-neutral-600'}`}></span>
                            <span>📡 Telegram</span>
                          </button>
                          
                          <button
                            type="button"
                            onClick={toggleWhatsAppOption}
                            className={`px-1.5 py-0.5 rounded border text-[8px] font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                              waRoutingActive 
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/35 hover:bg-emerald-500/20' 
                                : 'bg-neutral-900 border-neutral-850 text-neutral-600 hover:text-neutral-450'
                            }`}
                            title="Indicates & controls WhatsApp transmission. Click to toggle state."
                          >
                            <span className={`w-1 h-1 rounded-full ${waRoutingActive ? 'bg-emerald-400 animate-pulse' : 'bg-neutral-600'}`}></span>
                            <span>🟢 WhatsApp</span>
                          </button>
                        </div>
                      </div>

                      {/* Pay Metrics */}
                      <div className="text-right">
                        <div className="text-xl font-sans font-extrabold text-neutral-100">
                          ${offer.totalPay.toFixed(2)}
                        </div>
                        <div className="text-[9px] font-mono text-neutral-400 mt-0.5">
                          Base: ${offer.basePay.toFixed(2)} {offer.tip > 0 && `+ Tip: $${offer.tip.toFixed(2)}`}
                        </div>
                        
                        {/* Yield performance details */}
                        <div className="mt-3 text-[10px] font-mono text-neutral-300">
                          <span className="text-neutral-500">Rate:</span> <span className="font-bold text-emerald-400">${payPerMi}/mi</span>
                        </div>
                        <div className="text-[9px] font-mono text-neutral-400 flex items-center justify-end gap-1 mt-0.5">
                          <Navigation className="w-2.5 h-2.5" />
                          <span>{offer.distance} mi total</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Panel: Accept Decline */}
                    <div className="mt-4 pt-3 border-t border-neutral-900 flex justify-between items-center bg-neutral-950">
                      <div className="text-[9.5px] font-mono text-neutral-500">
                        {matchesFilters ? (
                          <span className="text-emerald-400 font-bold">Matches Filters</span>
                        ) : (
                          <span className="text-neutral-500">Filters check fail</span>
                        )}
                        {filters.isEnabled && (
                          <span className="block text-[8.5px] text-neutral-600 mt-0.5">
                            {matchesFilters ? 'Bot trying to catch...' : 'Bot ignored'}
                          </span>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <button
                          id={`decline-btn-${offer.id}`}
                          onClick={() => onDecline(offer)}
                          className="p-1 px-2.5 text-xs font-mono text-rose-400 hover:text-white bg-rose-500/15 hover:bg-rose-500 border border-rose-500/20 hover:border-transparent rounded-lg cursor-pointer transition-all flex items-center gap-1 select-none"
                        >
                          <X className="w-3 h-3" />
                          <span>Decline</span>
                        </button>
                        <button
                          id={`accept-btn-${offer.id}`}
                          onClick={() => onAccept(offer, 'manual')}
                          className="p-1 px-3 text-xs font-mono text-emerald-400 hover:text-neutral-950 bg-emerald-500/10 hover:bg-emerald-400 border border-emerald-500/20 hover:border-transparent rounded-lg font-bold cursor-pointer transition-all flex items-center gap-1 select-none"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Accept</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Manual user helper */}
      <p className="text-[9.5px] text-neutral-500 font-mono mt-4 leading-relaxed bg-neutral-950/40 p-2 rounded border border-neutral-800/30">
        📢 <span className="text-neutral-400">GIG CONSTRAINTS:</span> Real Spark offers have no sound cues. When the bot is OFF, you must click <span className="text-emerald-400 font-bold">Accept</span> before competitors swipe them!
      </p>
    </div>
  );
}
