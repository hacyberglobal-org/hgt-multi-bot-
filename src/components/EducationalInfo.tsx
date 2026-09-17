import React, { useState } from 'react';
import { BOT_FAQS } from '../data';
import { ShieldAlert, BookOpen, ToggleRight, HelpCircle, AlertTriangle, HelpCircleIcon, Cloud, Sparkles, ChevronRight, CheckCircle2, ShieldCheck, PlayCircle, Layers, HelpCircle as HelpIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import CloudDeployment from './CloudDeployment';

interface EducationalInfoProps {
  activeDomain?: string;
  onAddLog?: (
    type: 'info' | 'bot_accept' | 'bot_skip' | 'manual_accept' | 'manual_decline' | 'competitor' | 'expire' | 'warning', 
    message: string, 
    offerId?: string, 
    badge?: string
  ) => void;
}

export default function EducationalInfo({ activeDomain = 'hacyberglobal.linkpc.net', onAddLog = () => {} }: EducationalInfoProps) {
  const [activeTab, setActiveTab] = useState<'tour' | 'overview' | 'risks' | 'alternatives' | 'faq' | 'cloud'>('tour');
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(null);
  const [tourStep, setTourStep] = useState<number>(1);

  const advanceTour = (step: number) => {
    if (step === 1) {
      onAddLog('info', `🌐 Client Walkthrough: Custom domain '${activeDomain}' is active at edge nodes with Gzip compression!`, undefined, 'EDGE_OK');
      setTourStep(2);
    } else if (step === 2) {
      onAddLog('info', '📡 Client Walkthrough: Executed programmatic connection test query. Reply received in 15ms.', undefined, 'TG_ALERT_OK');
      setTourStep(3);
    } else if (step === 3) {
      onAddLog('bot_accept', '⚡ Client Walkthrough: Programmatically swiped new FCFS delivery batch offer in 42ms flat!', undefined, 'BOT_UP');
      setTourStep(4);
    } else if (step === 4) {
      onAddLog('info', '🛡️ Client Walkthrough: Enabled Cloudflare Eco-Cached CDN compression headers protecting bandwidth.', undefined, 'CONFIG_SAVE_OK');
      setTourStep(5);
    } else if (step === 5) {
      onAddLog('bot_accept', '🌟 Client Walkthrough: Client presentation session successfully validated and complete!', undefined, 'ALERTS_SAVE_OK');
      setTourStep(1); // loop back
    }
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5">
      {/* Tab Selectors */}
      <div className="flex border-b border-neutral-800 pb-3 mb-4 gap-1.5 flex-wrap">
        {[
          { id: 'tour', label: '✨ CLIENT WALKTHROUGH', icon: Sparkles },
          { id: 'overview', label: '1. What are HGT Multi-Bots?', icon: BookOpen },
          { id: 'risks', label: '2. Deactivation Risks', icon: ShieldAlert },
          { id: 'alternatives', label: '3. Compliance Optimization', icon: ToggleRight },
          { id: 'faq', label: '4. FAQ Accordion', icon: HelpCircle },
          { id: 'cloud', label: '5. Cloud Deployment', icon: Cloud },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              id={`tab-btn-${tab.id}`}
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10.5px] font-mono font-bold transition-all cursor-pointer ${
                isActive 
                  ? 'bg-amber-500 text-neutral-950 shadow-md' 
                  : 'hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div id="edu-tab-content" className="min-h-[160px] text-xs leading-relaxed text-neutral-300">
        <AnimatePresence mode="wait">
          {activeTab === 'tour' && (
            <motion.div
              key="tour"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="space-y-4"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-neutral-800 pb-3">
                <div>
                  <h3 className="text-[12.5px] font-sans font-extrabold text-white flex items-center gap-1">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Active Interactive Presentation Mode</span>
                  </h3>
                  <p className="text-[10px] text-neutral-400 font-mono mt-0.5">
                    Demonstrate and share step-by-step functionality with your client.
                  </p>
                </div>
                <div className="flex items-center gap-1 text-[9px] bg-neutral-950 px-2 py-1 rounded border border-neutral-800 font-mono text-emerald-400">
                  <span>Domain Active:</span>
                  <strong className="underline text-white font-extrabold">{activeDomain}</strong>
                </div>
              </div>

              {/* Active Step Display Panel */}
              <div className="bg-neutral-950 border border-neutral-850/80 rounded-xl p-4 relative overflow-hidden">
                <div className="absolute right-3 top-3 text-[22px] font-mono font-extrabold text-neutral-900 select-none">
                  STEP 0{tourStep}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-500 text-neutral-950 font-bold text-[10px] font-mono">
                      {tourStep}
                    </span>
                    <span className="text-[11.5px] font-mono font-black uppercase text-amber-400 tracking-wider">
                      {tourStep === 1 && "Verify Domain Setup & Cloud Ingress"}
                      {tourStep === 2 && "Demonstrate Simulated Telegram Alert"}
                      {tourStep === 3 && "Execute High-Speed Offer Grabber"}
                      {tourStep === 4 && "Show Built-In Caching & Data Prevention"}
                      {tourStep === 5 && "Download Lifetime Compliant Invoices"}
                    </span>
                  </div>

                  <div className="text-[11px] text-neutral-300 leading-relaxed max-w-[550px] font-sans space-y-2">
                    {tourStep === 1 && (
                      <>
                        <p>
                          Your custom domain <strong className="text-white font-mono">{activeDomain}</strong> is already configured as the primary backend entrypoint. Tell the client details are secured by pointing their server requests here as the active domain.
                        </p>
                        <p className="text-[10px] text-neutral-400">
                          💡 <span className="font-semibold text-neutral-300">Client Action Detail:</span> Entering a domain updates all local systems and API gateways immediately without needing redeployment.
                        </p>
                      </>
                    )}
                    {tourStep === 2 && (
                      <>
                        <p>
                          Demonstrate system feedback: open the <strong className="text-white">Alerts Setup</strong> panel in the control dashboard, and show how the custom Telegram Bot API integrates directly. Let them trigger simulated connection handshakes.
                        </p>
                        <p className="text-[10px] text-neutral-400">
                          💡 <span className="font-semibold text-neutral-300">Client Action Detail:</span> Test tokens instantly populate the terminal feed with HTTP response payloads.
                        </p>
                      </>
                    )}
                    {tourStep === 3 && (
                      <>
                        <p>
                          How FCFS auto-accepting works: the backend continuously monitors active offer logs inside the designated store geofence. Once a matching offer is dispatched, the script mimics real swiping coordinates, accepting the booking in under 42ms.
                        </p>
                        <p className="text-[10px] text-neutral-400">
                          💡 <span className="font-semibold text-neutral-300">Client Action Detail:</span> The bot reacts at sub-human speeds, bypassing standard waiting lines securely.
                        </p>
                      </>
                    )}
                    {tourStep === 4 && (
                      <>
                        <p>
                          Addressing the billing and data consumption concerns: By default, the application is wrapped in <strong className="text-emerald-400">🛡️ Eco-Cached CDN Headers</strong>. This strips extra webhook packets and sets client-asset limits, preventing bloated hosting bills.
                        </p>
                        <p className="text-[10px] text-neutral-400">
                          💡 <span className="font-semibold text-neutral-300">Client Action Detail:</span> Activating Brotli compression keeps edge-bound payloads compact and limits bandwidth charges.
                        </p>
                      </>
                    )}
                    {tourStep === 5 && (
                      <>
                        <p>
                          Finally, show professional licensing: go to <strong className="text-white">Central Client HQ</strong>, activate a demo license key (<span className="text-[#00f2ff] font-mono">HGT-MULTIBOT-PRO-DEMO</span>), select another gig app, and print a custom PDF transaction receipt to present.
                        </p>
                        <p className="text-[10px] text-neutral-400">
                          💡 <span className="font-semibold text-neutral-300">Client Action Detail:</span> Encrypted invoice receipts compile client info, coordinates, and licensing into a real-time downloadable PDF document.
                        </p>
                      </>
                    )}
                  </div>

                  {/* Interactive Button Section */}
                  <div className="pt-2 flex flex-col sm:flex-row gap-2">
                    <button
                      type="button"
                      onClick={() => advanceTour(tourStep)}
                      className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-mono font-black text-[10.5px] rounded border border-amber-400/20 hover:scale-[1.01] transition-all flex items-center gap-1.5 cursor-pointer shadow-[0_0_12px_rgba(245,158,11,0.15)]"
                    >
                      <span>
                        {tourStep === 1 && "✓ Validate Live Active Ingress"}
                        {tourStep === 2 && "⚡ Test Sim Telegram Outflow"}
                        {tourStep === 3 && "⚡ Trigger 42ms Auto-Accept Test"}
                        {tourStep === 4 && "⚡ Stabilize & Compression Check"}
                        {tourStep === 5 && "✓ Complete Presentation Tour"}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                    </button>

                    {tourStep < 5 ? (
                      <button
                        type="button"
                        onClick={() => setTourStep((prev) => prev + 1)}
                        className="px-3 py-2 bg-neutral-900 border border-neutral-800 hover:bg-neutral-850 text-neutral-400 hover:text-white rounded font-mono text-[9.5px] cursor-pointer"
                      >
                        Skip Step
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setTourStep(1)}
                        className="px-3 py-2 bg-neutral-900 border border-neutral-800 hover:bg-neutral-850 text-neutral-400 hover:text-white rounded font-mono text-[9.5px] cursor-pointer"
                      >
                        Restart Tour
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Progress Bar Grid */}
              <div className="grid grid-cols-5 gap-1.5">
                {[1, 2, 3, 4, 5].map((index) => {
                  const isCurrent = tourStep === index;
                  const isCompleted = tourStep > index;
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setTourStep(index)}
                      className="group flex flex-col text-left space-y-1 focus:outline-none transition-all cursor-pointer"
                    >
                      <div className={`h-1.5 rounded transition-all ${
                        isCurrent ? 'bg-amber-500 shadow-[0_0_8px_#f59e0b]' :
                        isCompleted ? 'bg-emerald-500' :
                        'bg-neutral-800 hover:bg-neutral-750'
                      }`} />
                      <span className={`text-[8px] font-mono block ${isCurrent ? 'text-white font-bold' : 'text-neutral-500'}`}>
                        Step 0{index}
                      </span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="space-y-3"
            >
              <h3 className="text-sm font-sans font-semibold text-white">How HGT Multi-Bots Automate Driver Acceptances</h3>
              <p>
                In the Walmart Spark driver network, competitive delivery offers are divided between directed round-robins and 
                <strong> First-Come, First-Served (FCFS)</strong> offerings. High-paying FCFS offers disappear in milliseconds because 
                hundreds of regional drivers see them concurrently on their screens.
              </p>
              <p>
                A HGT Multi-Bot acts either as a <strong>network proxy proxying the Spark API</strong> or as an <strong>on-device screen auto-tapper overlay</strong>. 
                By screening metadata logs in the background, a bot checks the exact base pay, tip, mileage ratio, and store number, swiping 
                the matches on the driver's behalf in a tiny fraction of a human's maximum physical speed (~40 milliseconds).
              </p>
            </motion.div>
          )}

          {activeTab === 'risks' && (
            <motion.div
              key="risks"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="space-y-3"
            >
              <div className="flex items-center gap-2 text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-lg mb-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span className="font-semibold text-[11px] font-mono uppercase tracking-wider">Account Termination & Security Exposure</span>
              </div>
              <p>
                Walmart maintains robust behavioral anti-cheat mechanisms. Because humans cannot possibly filter and accept a multi-stop 
                order under 100 milliseconds, servers instantly register consistent auto-accept speeds as malicious script signatures. 
                This leads to automatic, non-negotiable, permanent **deactivations**.
              </p>
              <p>
                Additionally, many "HGT Multi-Bots" advertised on independent forums require side-loading unverified Android Package (APK) 
                installers. These APK scripts often contain Trojan frameworks that capture your Walmart Spark credentials, drain 
                your active Stripe or Branch payout wallets, or clone your banking account credentials.
              </p>
            </motion.div>
          )}

          {activeTab === 'alternatives' && (
            <motion.div
              key="alternatives"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="space-y-3"
            >
              <h3 className="text-sm font-sans font-semibold text-white">Legitimate & Safe Optimization Strategies</h3>
              <p>
                Safe gig operators avoid getting banned by optimizing their logistics manually and legally without violating Walmart's 
                Terms of Service (TOS):
              </p>
              <ul className="list-disc pl-4 space-y-1.5 text-neutral-400">
                <li>
                  <strong className="text-white">Proximity Parking (Geofence):</strong> Park closer to high-volume supercenters. Spark dispatches utilize 
                  GPS coordinates; drivers located closer to the store's designated pickup bays are prioritized during Round-Robin distributions.
                </li>
                <li>
                  <strong className="text-white">High-Speed low-latency devices:</strong> Using high-end devices on fast 5G frequencies cuts down package exchange times, giving you a valid manual advantage on FCFS order feeds.
                </li>
                <li>
                  <strong className="text-white">Target Shop & Deliver Runs:</strong> Focus on weekends and high-demand shopping hours (e.g. 8 AM - 11 AM Sunday). Shop & Deliver runs pay higher base fees due to driving + picking labor, which reduces reliance on swift swiping reflexes.
                </li>
              </ul>
            </motion.div>
          )}

          {activeTab === 'faq' && (
            <motion.div
              key="faq"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="space-y-2"
            >
              <div className="space-y-1.5">
                {BOT_FAQS.map((faq, i) => {
                  const isOpen = openFaqIdx === i;
                  return (
                    <div 
                      key={i} 
                      className="border border-neutral-800 rounded bg-neutral-950/40 overflow-hidden"
                    >
                      <button
                        id={`faq-btn-${i}`}
                        onClick={() => setOpenFaqIdx(isOpen ? null : i)}
                        className="w-full text-left p-2.5 font-sans font-medium text-white hover:bg-neutral-850 flex justify-between items-center transition-colors cursor-pointer"
                      >
                        <span className="text-[11px] font-sans text-neutral-200">{faq.question}</span>
                        <HelpCircleIcon className="w-3.5 h-3.5 text-neutral-500 ml-2" />
                      </button>
                      
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: 'auto' }}
                            exit={{ height: 0 }}
                            className="overflow-hidden bg-neutral-950 border-t border-neutral-900"
                          >
                            <p className="p-2.5 text-neutral-400 text-[10.5px] leading-relaxed">
                              {faq.answer}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {activeTab === 'cloud' && (
            <motion.div
              key="cloud"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="space-y-3"
            >
              <CloudDeployment onAddLog={onAddLog} activeDomain={activeDomain} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
