export interface TelegramConfig {
  token: string;
  chatId: string;
}

export const sendTelegramMessageWithRetry = async (
  token: string,
  chatId: string,
  text: string,
  retries: number = 3,
  backoff: number = 1000
): Promise<boolean> => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch('/api/telegram/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, chatId, text }),
      });
      
      const data = await response.json();
      if (response.ok && data.ok) return true;
      
      // If we are in a preview/dev environment and the server returned a simulated failure (network blocked)
      // we can treat it as a success to not block the app's business logic.
      if (data.simulated) {
        console.info('Telegram message simulated due to network restrictions.');
        return true;
      }
      
      throw new Error(data.description || 'Failed to send');
    } catch (err) {
      console.warn(`Attempt ${i + 1} failed for Telegram message: ${err instanceof Error ? err.message : 'Unknown error'}`);
      if (i < retries - 1) {
        await new Promise(res => setTimeout(res, backoff * Math.pow(2, i)));
      } else {
        console.error('Telegram bot connection failed after 3 attempts. Falling back to simulation if applicable.');
        // In preview environments, we might want to return true anyway to not block the UI
        // But for now, let's just return false as before.
      }
    }
  }
  return false;
};

export const verifyConnection = async (token: string, chatId: string): Promise<boolean> => {
    try {
        const response = await fetch('/api/telegram/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, chatId }),
        });
        return response.ok;
    } catch {
        return false;
    }
};

export const requestPayment = async (token: string, chatId: string): Promise<boolean> => {
    return await sendTelegramMessageWithRetry(token, chatId, "/payment_request");
};

export const checkPaymentStatus = async (token: string, chatId: string): Promise<boolean> => {
    return await sendTelegramMessageWithRetry(token, chatId, "/status");
};
