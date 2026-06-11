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

def is_chat_authorized(chat_id: int) -> bool:
    """Check if the given Telegram chat ID is authorized in Supabase or matches env."""
    if TELEGRAM_CHAT_ID and str(chat_id).strip() == str(TELEGRAM_CHAT_ID).strip():
        return True
    if not SUPABASE_URL or not SUPABASE_KEY:
        return False
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json"
    }
    # Query users with matching telegramChatId and enabled flag
    url = f"{SUPABASE_URL}/rest/v1/admin_collab_users?telegramChatId=eq.{chat_id}&telegramEnabled=eq.true"
    try:
        resp = requests.get(url, headers=headers)
        resp.raise_for_status()
        users = resp.json()
        return len(users) > 0
    except Exception as e:
        print(f"Errore nella verifica Telegram chat ID: {e}")
        return False

def get_all_authorized_chat_ids() -> list:
    """Retrieve all authorized chat IDs from Supabase and .env."""
    chat_ids = set()
    if TELEGRAM_CHAT_ID:
        chat_ids.add(str(TELEGRAM_CHAT_ID).strip())
        
    if not SUPABASE_URL or not SUPABASE_KEY:
        return list(chat_ids)
        
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json"
    }
    url = f"{SUPABASE_URL}/rest/v1/admin_collab_users?telegramEnabled=eq.true"
    try:
        resp = requests.get(url, headers=headers)
        resp.raise_for_status()
        users = resp.json()
        for u in users:
            cid = u.get("telegramChatId")
            if cid:
                chat_ids.add(str(cid).strip())
    except Exception as e:
        print(f"Errore nel recupero dei chat ID abilitati: {e}")
    return list(chat_ids)

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

def send_telegram_message(text, chat_id=None):
    if not TELEGRAM_TOKEN:
        print("ATTENZIONE: TELEGRAM_BOT_TOKEN mancante nel file .env")
        return
    
    if chat_id:
        chat_ids = [str(chat_id).strip()]
    else:
        chat_ids = get_all_authorized_chat_ids()
        
    if not chat_ids:
        print("ATTENZIONE: Nessun Chat ID Telegram configurato o abilitato.")
        return

    url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage"
    for cid in chat_ids:
        payload = {
            "chat_id": cid,
            "text": text,
            "parse_mode": "HTML",
            "disable_web_page_preview": True
        }
        try:
            response = requests.post(url, json=payload)
            response.raise_for_status()
            print(f"Messaggio Telegram inviato con successo a {cid}!")
        except Exception as e:
            print(f"Errore nell'invio del messaggio Telegram a {cid}: {e}")

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
                    if not is_chat_authorized(chat_id):
                        # Optionally notify user about lack of permission
                        send_telegram_message("❌ Accesso non autorizzato.", chat_id=chat_id)
                        continue
                    if text.startswith("/help"):
                        help_text = "Comandi disponibili:\n/help – Questa guida\n/status – Numero richieste di accesso pendenti\n/list – Elenca tutte le richieste pendenti\n/delete <id> – Cancella una richiesta specifica"
                        send_telegram_message(help_text, chat_id=chat_id)
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
                                send_telegram_message("✅ Nessuna richiesta pendente.", chat_id=chat_id)
                            else:
                                lines = ["📋 Richieste pendenti:"]
                                for u in pending:
                                    uid = u.get("id")
                                    name = u.get("name")
                                    email = u.get("email")
                                    lines.append(f"{uid}: {name} ({email})")
                                send_telegram_message("\n".join(lines), chat_id=chat_id)
                        except Exception as e:
                            send_telegram_message(f"⚠️ Errore nel recupero delle richieste: {e}", chat_id=chat_id)
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
                                send_telegram_message(f"✅ Richiesta {del_id} cancellata.", chat_id=chat_id)
                            except Exception as e:
                                send_telegram_message(f"❌ Errore nella cancellazione: {e}", chat_id=chat_id)
                        else:
                            send_telegram_message("❗ Usa /delete <id> per cancellare una richiesta.", chat_id=chat_id)
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
                        send_telegram_message(f"⚡ Ci sono {count} richieste di accesso pendenti.", chat_id=chat_id)
        except Exception as e:
            print(f"Errore nei comandi Telegram: {e}")
        poll_supabase()
        time.sleep(30)
