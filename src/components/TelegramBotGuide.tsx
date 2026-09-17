import React from 'react';
import { Bot, Copy, HelpCircle, Check, MessageSquare } from 'lucide-react';

export default function TelegramBotGuide({ chatId }: { chatId: string }) {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-4 bg-neutral-950/60 p-5 rounded-lg border border-neutral-800 text-[11px] font-mono text-neutral-300 shadow-xl max-h-96 overflow-y-auto">
      <div className="flex items-center gap-2 text-[#00f2ff] font-bold border-b border-neutral-800 pb-3 uppercase tracking-wider">
        <Bot className="w-5 h-5" />
        <span>Telegram Bot Setup & Payment Integration</span>
      </div>

      <div className="space-y-4">
        {/* Step 1 */}
        <div>
          <h4 className="font-bold text-white mb-1 flex items-center gap-2">
            <span className="bg-neutral-800 w-5 h-5 flex items-center justify-center rounded-full text-[10px]">1</span>
            Create Your Bot with @BotFather
          </h4>
          <p className="pl-7 mb-2">Open Telegram, search for <span className="text-[#00f2ff]">@BotFather</span>, and send the following command:</p>
          <div className="pl-7">
            <code className="bg-neutral-900 p-2 rounded block border border-neutral-700 flex justify-between items-center">
              /newbot
              <button onClick={() => copyToClipboard('/newbot')}><Copy className="w-3 h-3 text-neutral-500 hover:text-white" /></button>
            </code>
          </div>
          <p className="pl-7 mt-1 text-[10px] text-neutral-500">Follow the prompts to name your bot. Upon completion, BotFather will provide an <strong>API Token</strong>.</p>
        </div>

        {/* Step 2 */}
        <div>
          <h4 className="font-bold text-white mb-1 flex items-center gap-2">
            <span className="bg-neutral-800 w-5 h-5 flex items-center justify-center rounded-full text-[10px]">2</span>
            Retrieve Your Chat/Group ID
          </h4>
          <p className="pl-7 mb-2">To connect this app to a specific chat (for payment notifications), search for <span className="text-[#00f2ff]">@userinfobot</span>, start it, and copy your numerical ID.</p>
          <p className="pl-7 text-[10px] text-neutral-500">Input this number in the "Your Telegram ID" field in the settings above.</p>
        </div>

        {/* Step 3 */}
        <div>
          <h4 className="font-bold text-white mb-1 flex items-center gap-2">
            <span className="bg-neutral-800 w-5 h-5 flex items-center justify-center rounded-full text-[10px]">3</span>
            Configure for Payment/Billing
          </h4>
          <p className="pl-7 text-[10px] text-neutral-500">
            Once linked, your bot will automatically intercept payment webhook events. 
            Ensure your Bot is added to the Channel or Group, and that you have Admin rights to post messages.
          </p>
        </div>
      </div>
    </div>
  );
}
