import os
import time
import requests
import json
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("VITE_SUPABASE_ANON_KEY")
TELEGRAM_TOKEN = os.getenv("VITE_TELEGRAM_BOT_TOKEN")
TELEGRAM_CHAT_ID = os.getenv("VITE_TELEGRAM_CHAT_ID")
APP_URL = "https://music-hub-three.vercel.app/"

STATE_FILE = "last_notified.txt"

def get_last_notified():
    if os.path.exists(STATE_FILE):
        with open(STATE_FILE, "r") as f:
            return f.read().strip()
    return ""

def set_last_notified(timestamp):
    with open(STATE_FILE, "w") as f:
        f.write(timestamp)

LAST_UPDATE_ID = 0

def send_telegram_message(text):
    if not TELEGRAM_TOKEN or not TELEGRAM_CHAT_ID:
        print("ATTENZIONE: TELEGRAM_BOT_TOKEN o TELEGRAM_CHAT_ID mancanti nel file .env")
        return
    url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage"
    payload = {
        "chat_id": TELEGRAM_CHAT_ID,
        "text": text,
        "parse_mode": "HTML",
        "disable_web_page_preview": True
    }
    try:
        response = requests.post(url, json=payload)
        response.raise_for_status()
        print("Messaggio Telegram inviato con successo!")
    except Exception as e:
        print(f"Errore nell'invio del messaggio Telegram: {e}")

def set_bot_commands():
    """Register bot commands for Telegram client suggestions."""
    url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/setMyCommands"
    commands = [
        {"command": "help", "description": "Mostra la guida"},
        {"command": "status", "description": "Numero richieste pendenti"},
        {"command": "list", "description": "Elenca richieste pendenti"},
        {"command": "delete", "description": "Cancella una richiesta"},
    ]
    try:
        resp = requests.post(url, json={"commands": commands})
        resp.raise_for_status()
        print("Comandi del bot registrati con successo.")
    except Exception as e:
        print(f"Errore nella registrazione dei comandi: {e}")


def poll_supabase():
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("ATTENZIONE: Variabili Supabase mancanti.")
        return
    print("Controllo nuove richieste su Supabase...")
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }
    last_timestamp = get_last_notified()
    url = f"{SUPABASE_URL}/rest/v1/admin_collab_users?status=eq.pending&order=requestedAt.asc"
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        users = response.json()
        for user in users:
            if not last_timestamp or user.get("requestedAt", "") > last_timestamp:
                name = user.get("name", "Sconosciuto")
                email = user.get("email", "Nessuna email")
                msg = user.get("message", "Nessun messaggio")
                accept_link = f"{APP_URL}/collab/approve?status=accepted&user={name.replace(' ', '%20')}"
                reject_link = f"{APP_URL}/collab/approve?status=rejected&user={name.replace(' ', '%20')}"
                text = (
                    f"🚨 <b>Nuova Richiesta Ricevuta!</b>\n\n"
                    f"👤 <b>Utente:</b> {name}\n"
                    f"📧 <b>Email:</b> {email}\n"
                    f"📝 <b>Messaggio:</b> {msg}\n\n"
                    f"✅ <a href='{accept_link}'>Approva</a>\n"
                    f"❌ <a href='{reject_link}'>Rifiuta</a>"
                )
                send_telegram_message(text)
                set_last_notified(user.get("requestedAt", ""))
                time.sleep(1)
    except Exception as e:
        print(f"Errore nella lettura da Supabase: {e}")

if __name__ == "__main__":
    print("Avvio Bot Telegram (Polling)... Premi Ctrl+C per fermare.")
    print("Assicurati di aver compilato VITE_TELEGRAM_BOT_TOKEN e VITE_TELEGRAM_CHAT_ID nel file .env")
    set_bot_commands()
    while True:
        try:
            updates_resp = requests.get(f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/getUpdates", params={"offset": LAST_UPDATE_ID})
            updates_resp.raise_for_status()
            data = updates_resp.json()
            if data.get("ok"):
                for upd in data.get("result", []):
                    LAST_UPDATE_ID = upd["update_id"] + 1
                    message = upd.get("message", {})
                    text = message.get("text", "")
                    chat_id = message.get("chat", {}).get("id")
                    if not text or not chat_id:
                        continue
                    if text.startswith("/help"):
                        help_text = "Comandi disponibili:\n/help – Questa guida\n/status – Numero richieste di accesso pendenti\n/list – Elenca tutte le richieste pendenti\n/delete <id> – Cancella una richiesta specifica"
                        send_telegram_message(help_text)
                    elif text.startswith("/list"):
                        try:
                            resp = requests.get(f"{SUPABASE_URL}/rest/v1/admin_collab_users?status=eq.pending", headers={
                                "apikey": SUPABASE_KEY,
                                "Authorization": f"Bearer {SUPABASE_KEY}",
                                "Content-Type": "application/json"
                            })
                            resp.raise_for_status()
                            pending = resp.json()
                            if not pending:
                                send_telegram_message("✅ Nessuna richiesta pendente.")
                            else:
                                lines = ["📋 Richieste pendenti:"]
                                for u in pending:
                                    uid = u.get("id")
                                    name = u.get("name")
                                    email = u.get("email")
                                    lines.append(f"{uid}: {name} ({email})")
                                send_telegram_message("\n".join(lines))
                        except Exception as e:
                            send_telegram_message(f"⚠️ Errore nel recupero delle richieste: {e}")
                    elif text.startswith("/delete"):
                        parts = text.split()
                        if len(parts) >= 2:
                            del_id = parts[1]
                            try:
                                del_resp = requests.delete(
                                    f"{SUPABASE_URL}/rest/v1/admin_collab_users?id=eq.{del_id}",
                                    headers={
                                        "apikey": SUPABASE_KEY,
                                        "Authorization": f"Bearer {SUPABASE_KEY}",
                                        "Content-Type": "application/json"
                                    }
                                )
                                del_resp.raise_for_status()
                                send_telegram_message(f"✅ Richiesta {del_id} cancellata.")
                            except Exception as e:
                                send_telegram_message(f"❌ Errore nella cancellazione: {e}")
                        else:
                            send_telegram_message("❗ Usa /delete <id> per cancellare una richiesta.")
                    elif text.startswith("/status"):
                        try:
                            resp = requests.get(f"{SUPABASE_URL}/rest/v1/admin_collab_users?status=eq.pending&select=count", headers={
                                "apikey": SUPABASE_KEY,
                                "Authorization": f"Bearer {SUPABASE_KEY}",
                                "Content-Type": "application/json",
                                "Prefer": "count=exact"
                            })
                            resp.raise_for_status()
                            count = resp.headers.get("content-range", "0/0").split("/")[1]
                        except Exception:
                            count = "?"
                        send_telegram_message(f"⚡ Ci sono {count} richieste di accesso pendenti.")
        except Exception as e:
            print(f"Errore nei comandi Telegram: {e}")
        poll_supabase()
        time.sleep(30)
