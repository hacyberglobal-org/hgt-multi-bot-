export interface UnifiedPlatformConfig {
  enabled: boolean;
  token: string;
  chatId: string; // chatId for Telegram, phone number for WhatsApp
  autoRetry: boolean; // autoRetry for Telegram, attachCheckout for WhatsApp
}

export interface MessagingPlatforms {
  telegram: UnifiedPlatformConfig;
  whatsapp: UnifiedPlatformConfig;
  selectedPlatform: 'telegram' | 'whatsapp' | 'both' | 'none';
}

export const DEFAULT_MESSAGING_PLATFORMS: MessagingPlatforms = {
  telegram: {
    enabled: true,
    token: '8737167779:AAE2WWVpZcQP-wJvilmvXFi-EP1C7zpe0WE',
    chatId: '5642832782',
    autoRetry: true
  },
  whatsapp: {
    enabled: false,
    token: 'WA_LIVE_TOKEN_MOCK_88492',
    chatId: '+1 (360) 955-2434',
    autoRetry: true
  },
  selectedPlatform: 'telegram'
};

/**
 * Loads the unified messaging platforms config from localStorage.
 * Automatically performs backward-compatible migration of individual legacy keys.
 */
export function loadMessagingPlatforms(): MessagingPlatforms {
  const raw = localStorage.getItem('spark_messaging_platforms_config');
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.telegram && parsed.whatsapp) {
        // Ensure standard fields are available
        return {
          telegram: { ...DEFAULT_MESSAGING_PLATFORMS.telegram, ...parsed.telegram },
          whatsapp: { ...DEFAULT_MESSAGING_PLATFORMS.whatsapp, ...parsed.whatsapp },
          selectedPlatform: parsed.selectedPlatform || 'telegram'
        };
      }
    } catch (e) {
      console.warn('Syntax error parsing messaging configuration, resetting to defaults.', e);
    }
  }

  // Backup and fall back to individual legacy keys for lossless backward compatibility
  const tgToken = localStorage.getItem('spark_bot_tg_token') || DEFAULT_MESSAGING_PLATFORMS.telegram.token;
  const tgChatId = localStorage.getItem('spark_bot_tg_chat_id') || DEFAULT_MESSAGING_PLATFORMS.telegram.chatId;
  const tgEnabled = localStorage.getItem('spark_bot_send_leads') !== 'false';
  const tgAutoRetry = localStorage.getItem('spark_bot_tg_auto_retry') !== 'false';

  const waPhone = localStorage.getItem('spark_bot_wa_phone') || DEFAULT_MESSAGING_PLATFORMS.whatsapp.chatId;
  const waToken = localStorage.getItem('spark_bot_wa_token') || DEFAULT_MESSAGING_PLATFORMS.whatsapp.token;
  const waActive = localStorage.getItem('spark_bot_wa_active') === 'true';
  const waAttachCheckout = localStorage.getItem('spark_bot_wa_attach_checkout') !== 'false';

  // Active channel selection fallback
  let selectedPlat: 'telegram' | 'whatsapp' | 'both' | 'none' = 'telegram';
  if (tgEnabled && waActive) {
    selectedPlat = 'both';
  } else if (!tgEnabled && waActive) {
    selectedPlat = 'whatsapp';
  } else if (tgEnabled && !waActive) {
    selectedPlat = 'telegram';
  } else {
    selectedPlat = 'none';
  }

  const initialConfig: MessagingPlatforms = {
    telegram: {
      enabled: tgEnabled,
      token: tgToken,
      chatId: tgChatId,
      autoRetry: tgAutoRetry
    },
    whatsapp: {
      enabled: waActive,
      token: waToken,
      chatId: waPhone,
      autoRetry: waAttachCheckout
    },
    selectedPlatform: selectedPlat
  };

  localStorage.setItem('spark_messaging_platforms_config', JSON.stringify(initialConfig));
  return initialConfig;
}

/**
 * Saves the unified configuration to localStorage and keeps legacy keys synced.
 */
export function saveMessagingPlatforms(config: MessagingPlatforms) {
  localStorage.setItem('spark_messaging_platforms_config', JSON.stringify(config));

  // Sync back to individual legacy keys so other existing modules work with absolute zero friction
  localStorage.setItem('spark_bot_tg_token', config.telegram.token);
  localStorage.setItem('spark_bot_tg_chat_id', config.telegram.chatId);
  localStorage.setItem('spark_bot_send_leads', String(config.telegram.enabled));
  localStorage.setItem('spark_bot_tg_auto_retry', String(config.telegram.autoRetry));

  localStorage.setItem('spark_bot_wa_phone', config.whatsapp.chatId);
  localStorage.setItem('spark_bot_wa_token', config.whatsapp.token);
  // Synchronize both spark_bot_wa_active and spark_bot_send_leads with the active states
  localStorage.setItem('spark_bot_wa_active', String(config.whatsapp.enabled));
  
  // Custom event to handle instant live updates
  setTimeout(() => {
    window.dispatchEvent(new Event('storage'));
  }, 0);
}

/**
 * Calculates transmission success metrics for Telegram and WhatsApp from the dispatched leads report ledger.
 */
export function calculatePlatformStats() {
  const reportsRaw = localStorage.getItem('spark_bot_dispatched_leads_report');
  let reports: any[] = [];
  if (reportsRaw) {
    try {
      reports = JSON.parse(reportsRaw);
    } catch (e) {}
  }

  const tgReports = reports.filter((item: any) => {
    const isTg = item.paymentMethod === 'Telegram bot API' || 
                 (item.paymentMethod && !item.paymentMethod.includes('WhatsApp'));
    return isTg;
  });

  const waReports = reports.filter((item: any) => {
    return item.paymentMethod === 'WhatsApp Service' || 
           item.paymentMethod === 'WhatsApp Checkout' || 
           (item.paymentMethod && item.paymentMethod.toLowerCase().includes('whatsapp'));
  });

  const getStats = (list: any[]) => {
    if (list.length === 0) {
      return { total: 0, successes: 0, successRate: 100 };
    }
    const successes = list.filter((item: any) => item.status === 'SENT' || item.status === 'RETRIED_AND_SENT').length;
    return {
      total: list.length,
      successes,
      successRate: Math.round((successes / list.length) * 100)
    };
  };

  return {
    telegram: getStats(tgReports),
    whatsapp: getStats(waReports)
  };
}
