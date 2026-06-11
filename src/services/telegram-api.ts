import { getCollabUsers, saveCollabUsers } from "./supabase-api";

/**
 * Invia un messaggio Telegram a UN singolo chat ID.
 */
const sendToChat = async (token: string, chatId: string, text: string): Promise<boolean> => {
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });
    if (!res.ok) {
      console.error(`Errore invio Telegram a ${chatId}:`, await res.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error(`Errore di rete Telegram a ${chatId}:`, err);
    return false;
  }
};

/**
 * Invia un messaggio a TUTTI gli utenti che hanno abilitato Telegram
 * (telegramEnabled: true e telegramChatId valorizzato).
 * Ritorna il numero di invii riusciti.
 */
export const sendTelegramMessage = async (text: string): Promise<number> => {
  const token = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.warn("Telegram: manca VITE_TELEGRAM_BOT_TOKEN nel .env");
    return 0;
  }

  let users: Awaited<ReturnType<typeof getCollabUsers>> = [];
  try {
    users = await getCollabUsers();
  } catch (e) {
    console.error("Telegram: impossibile leggere gli utenti", e);
  }

  const chatIds = new Set<string>();

  // Aggiungi il default chat id dal file env
  const defaultChatId = import.meta.env.VITE_TELEGRAM_CHAT_ID;
  if (defaultChatId) {
    chatIds.add(defaultChatId.trim());
  }

  // Aggiungi tutti i chat id abilitati dei collaboratori accettati
  users.forEach((u) => {
    if (u.telegramEnabled && u.telegramChatId && u.status === "accepted") {
      chatIds.add(u.telegramChatId.trim());
    }
  });

  if (chatIds.size === 0) {
    console.info("Telegram: nessun utente con Telegram abilitato.");
    return 0;
  }

  const targets = Array.from(chatIds);
  const results = await Promise.all(
    targets.map((chatId) => sendToChat(token, chatId, text)),
  );

  const ok = results.filter(Boolean).length;
  console.info(`Telegram: inviato a ${ok}/${targets.length} utenti.`);
  return ok;
};

/**
 * Salva il Telegram Chat ID per un utente e abilita l'integrazione.
 * Viene chiamato DALL'UTENTE nella propria UI di impostazioni.
 */
export const saveTelegramChatId = async (
  userId: string,
  chatId: string,
): Promise<boolean> => {
  try {
    const users = await getCollabUsers();
    const updated = users.map((u) =>
      u.id === userId
        ? { ...u, telegramChatId: chatId, telegramEnabled: true }
        : u,
    );
    await saveCollabUsers(updated);
    return true;
  } catch (e) {
    console.error("Errore salvataggio Telegram Chat ID:", e);
    return false;
  }
};

/**
 * Rimuove il Telegram Chat ID di un utente ma mantiene l'abilitazione attiva.
 */
export const removeTelegramChatId = async (userId: string): Promise<boolean> => {
  try {
    const users = await getCollabUsers();
    const updated = users.map((u) =>
      u.id === userId
        ? { ...u, telegramChatId: undefined }
        : u,
    );
    await saveCollabUsers(updated);
    return true;
  } catch (e) {
    console.error("Errore rimozione Telegram Chat ID:", e);
    return false;
  }
};
