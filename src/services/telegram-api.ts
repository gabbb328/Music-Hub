export const sendTelegramMessage = async (text: string) => {
  const token = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
  const chatId = import.meta.env.VITE_TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn("Telegram non configurato in .env (mancano VITE_TELEGRAM_BOT_TOKEN o VITE_TELEGRAM_CHAT_ID)");
    return false;
  }

  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });
    
    if (!res.ok) {
      console.error("Errore invio Telegram:", await res.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error("Errore di rete invio Telegram:", err);
    return false;
  }
};
