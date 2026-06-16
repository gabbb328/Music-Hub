import { VercelRequest, VercelResponse } from "@vercel/node";
import { Telegraf } from "telegraf";
import { createClient } from "@supabase/supabase-js";

// Inizializza Supabase e Telegram dalle variabili d'ambiente
const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || "";
const telegramToken = process.env.VITE_TELEGRAM_BOT_TOKEN || "";
const authorizedChatId = process.env.VITE_TELEGRAM_CHAT_ID || "";
const appUrl = "https://music-hub-three.vercel.app";

const supabase = createClient(supabaseUrl, supabaseKey);
const bot = new Telegraf(telegramToken);

// Funzione per verificare se l'utente è autorizzato
async function isChatAuthorized(chatId: number): Promise<boolean> {
  if (authorizedChatId && String(chatId).trim() === authorizedChatId.trim()) {
    return true;
  }
  const { data, error } = await supabase
    .from("admin_collab_users")
    .select("telegramChatId")
    .eq("telegramChatId", chatId)
    .eq("telegramEnabled", true);

  if (error || !data) return false;
  return data.length > 0;
}

// Comando /help
bot.command("help", async (ctx) => {
  if (!(await isChatAuthorized(ctx.chat.id)))
    return ctx.reply("Accesso non autorizzato.");
  return ctx.reply(
    "Comandi disponibili:\n" +
      "/help - Questa guida\n" +
      "/status - Numero richieste pendenti\n" +
      "/list - Elenca richieste pendenti\n" +
      "/delete ID - Cancella una richiesta",
  );
});

// Comando /status
bot.command("status", async (ctx) => {
  if (!(await isChatAuthorized(ctx.chat.id)))
    return ctx.reply("Accesso non autorizzato.");

  const { data, error } = await supabase
    .from("admin_collab_users")
    .select("id")
    .eq("status", "pending");

  if (error) {
    return ctx.reply("⚠️ Errore nel recupero dei dati da Supabase.");
  }
  return ctx.reply(`Ci sono ${data.length} richieste pendenti.`);
});

// Comando /list
bot.command("list", async (ctx) => {
  if (!(await isChatAuthorized(ctx.chat.id)))
    return ctx.reply("Accesso non autorizzato.");

  const { data: pending, error } = await supabase
    .from("admin_collab_users")
    .select("id, name, email, requestedAt")
    .eq("status", "pending")
    .order("requestedAt", { ascending: true });

  if (error) return ctx.reply("⚠️ Errore nel recupero della lista.");
  if (!pending || pending.length === 0)
    return ctx.reply("Nessuna richiesta pendente.");

  let lines = ["Richieste pendenti:\n"];
  pending.forEach((u) => {
    const date = u.requestedAt ? String(u.requestedAt).substring(0, 10) : "?";
    lines.push(
      `ID: ${u.id}\nNome: ${u.name}\nEmail: ${u.email}\nData: ${date}\n`,
    );
  });

  return ctx.reply(lines.join("\n"));
});

// Comando /delete
bot.command("delete", async (ctx) => {
  if (!(await isChatAuthorized(ctx.chat.id)))
    return ctx.reply("Accesso non autorizzato.");

  const parts = ctx.message.text.split(" ");
  if (parts.length < 2) {
    return ctx.reply("Usa /delete ID per cancellare.");
  }

  const delId = parts[1];
  const { error } = await supabase
    .from("admin_collab_users")
    .delete()
    .eq("id", delId);

  if (error) {
    return ctx.reply(`Errore cancellazione: ${error.message}`);
  }
  return ctx.reply(`Richiesta ${delId} cancellata.`);
});

// Gestore Serverless per Vercel
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "POST") {
    try {
      // Elabora l'aggiornamento ricevuto da Telegram
      await bot.handleUpdate(req.body);
      res.status(200).send("OK");
    } catch (err) {
      console.error(err);
      res.status(500).send("Internal Server Error");
    }
  } else {
    res.status(200).send("Il bot Vercel Webhook è attivo!");
  }
}
