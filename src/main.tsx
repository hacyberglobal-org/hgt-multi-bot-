import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { Toaster } from 'sonner';
import './index.css';
import { safeStorage as localStorage } from './lib/safeStorage';
import { saveMessagingPlatforms, loadMessagingPlatforms } from './lib/messagingPlatforms';

// Auto-activate the user's new Telegram Bot Token and Chat ID variables!
const targetToken = '8737167779:AAE2WWVpZcQP-wJvilmvXFi-EP1C7zpe0WE';
const targetChatId = '5642832782';

if (localStorage.getItem('spark_bot_tg_token') !== targetToken || localStorage.getItem('spark_bot_tg_chat_id') !== targetChatId) {
  localStorage.setItem('spark_bot_tg_token', targetToken);
  localStorage.setItem('spark_bot_tg_chat_id', targetChatId);
  localStorage.setItem('spark_bot_billing_token', targetToken);
  localStorage.setItem('spark_bot_billing_chat_id', targetChatId);
  
  // Also synchronize the unified platform config
  try {
    const currentPlatforms = loadMessagingPlatforms();
    currentPlatforms.telegram.token = targetToken;
    currentPlatforms.telegram.chatId = targetChatId;
    currentPlatforms.telegram.enabled = true;
    saveMessagingPlatforms(currentPlatforms);
  } catch (err) {
    console.error('Failed to sync messaging platforms configuration:', err);
  }
  
  console.log('✅ Active variables initialized: Telegram Bot Token and Chat ID are fully activated.');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Toaster position="bottom-right" theme="dark" />
    <App />
  </StrictMode>,
);





