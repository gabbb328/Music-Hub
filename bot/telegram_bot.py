import os
import time
import requests
import json
import html as html_module
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("VITE_SUPABASE_ANON_KEY")
TELEGRAM_TOKEN = os.getenv("VITE_TELEGRAM_BOT_TOKEN")
TELEGRAM_CHAT_ID = os.getenv("VITE_TELEGRAM_CHAT_ID")
APP_URL = "https://music-hub-three.vercel.app"

SUPABASE_HEADERS = {}

def get_supabase_headers():
    return {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json"
    }

def is_chat_authorized(chat_id: int) -> bool:
    if TELEGRAM_CHAT_ID and str(chat_id).strip() == str(TELEGRAM_CHAT_ID).strip():
        return True
    if not SUPABASE_URL or not SUPABASE_KEY:
        return False
    url = f"{SUPABASE_URL}/rest/v1/admin_collab_users?telegramChatId=eq.{chat_id}&telegramEnabled=eq.true"
    try:
        resp = requests.get(url, headers=get_supabase_headers())
        resp.raise_for_status()
        return len(resp.json()) > 0
    except Exception as e:
        print(f"Errore verifica chat ID: {e}")
        return False

def get_all_authorized_chat_ids() -> list:
    chat_ids = set()
    if TELEGRAM_CHAT_ID:
        chat_ids.add(str(TELEGRAM_CHAT_ID).strip())
    if not SUPABASE_URL or not SUPABASE_KEY:
        return list(chat_ids)
    url = f"{SUPABASE_URL}/rest/v1/admin_collab_users?telegramEnabled=eq.true"
    try:
        resp = requests.get(url, headers=get_supabase_headers())
        resp.raise_for_status()
        for u in resp.json():
            cid = u.get("telegramChatId")
            if cid:
                chat_ids.add(str(cid).strip())
    except Exception as e:
        print(f"Errore recupero chat ID: {e}")
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

def send_telegram_message(text, chat_id=None, parse_mode="HTML"):
    if not TELEGRAM_TOKEN:
        print("ATTENZIONE: TELEGRAM_BOT_TOKEN mancante")
        return
    chat_ids = [str(chat_id).strip()] if chat_id else get_all_authorized_chat_ids()
    if not chat_ids:
        print("ATTENZIONE: Nessun Chat ID configurato.")
        return
    url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage"
    for cid in chat_ids:
        payload = {"chat_id": cid, "text": text, "disable_web_page_preview": True}
        if parse_mode:
            payload["parse_mode"] = parse_mode
        try:
            response = requests.post(url, json=payload, timeout=10)
            if not response.ok:
                print(f"Telegram error ({cid}): {response.text}")
            else:
                print(f"Messaggio inviato a {cid}")
        except Exception as e:
            print(f"Errore invio a {cid}: {e}")
            
def set_bot_commands():
    url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/setMyCommands"
    commands = [
        {"command": "help", "description": "Mostra la guida"},
        {"command": "status", "description": "Numero richieste pendenti"},
        {"command": "list", "description": "Elenca richieste pendenti"},
        {"command": "delete", "description": "Cancella una richiesta per ID"},
    ]
    try:
        resp = requests.post(url, json={"commands": commands}, timeout=10)
        resp.raise_for_status()
        print("Comandi bot registrati.")
    except Exception as e:
        print(f"Errore registrazione comandi: {e}")

def get_pending_requests():
    url = f"{SUPABASE_URL}/rest/v1/admin_collab_users?status=eq.pending&order=requestedAt.asc"
    resp = requests.get(url, headers=get_supabase_headers(), timeout=10)
    resp.raise_for_status()
    return resp.json()

def poll_supabase():
    if not SUPABASE_URL or not SUPABASE_KEY:
        return
    print("Controllo nuove richieste su Supabase...")
    last_timestamp = get_last_notified()
    try:
        users = get_pending_requests()
        for user in users:
            req_at = user.get("requestedAt", "")
            if not last_timestamp or req_at > last_timestamp:
                name  = html_module.escape(str(user.get("name", "Sconosciuto")))
                email = html_module.escape(str(user.get("email", "Nessuna email")))
                msg   = html_module.escape(str(user.get("message", "Nessun messaggio")))
                uid   = str(user.get("id", ""))

                accept_link = f"{APP_URL}/collab/approve?status=accepted&user={uid}"
                reject_link = f"{APP_URL}/collab/approve?status=rejected&user={uid}"

                text = (
                    f"🚨 <b>Nuova Richiesta!</b>\n\n"
                    f"👤 <b>Utente:</b> {name}\n"
                    f"📧 <b>Email:</b> {email}\n"
                    f"📝 <b>Messaggio:</b> {msg}\n\n"
                    f'✅ <a href="{accept_link}">Approva</a>  '
                    f'❌ <a href="{reject_link}">Rifiuta</a>'
                )
                send_telegram_message(text)
                set_last_notified(req_at)
                time.sleep(1)
    except Exception as e:
        print(f"Errore poll Supabase: {e}")

if __name__ == "__main__":
    print("Avvio Bot Telegram... Premi Ctrl+C per fermare.")
    set_bot_commands()
    while True:
        try:
            updates_resp = requests.get(
                f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/getUpdates",
                params={"offset": LAST_UPDATE_ID, "timeout": 5},
                timeout=10
            )
            updates_resp.raise_for_status()
            data = updates_resp.json()
            if data.get("ok"):
                for upd in data.get("result", []):
                    LAST_UPDATE_ID = upd["update_id"] + 1
                    message = upd.get("message", {})
                    text = message.get("text", "").strip()
                    chat_id = message.get("chat", {}).get("id")
                    if not text or not chat_id:
                        continue
                    if not is_chat_authorized(chat_id):
                        send_telegram_message("Accesso non autorizzato.", chat_id=chat_id, parse_mode=None)
                        continue

                    cmd = text.split()[0].lower().split("@")[0]  # gestisce /cmd@botname

                    if cmd == "/help":
                        help_text = (
                            "Comandi disponibili:\n"
                            "/help - Questa guida\n"
                            "/status - Numero richieste pendenti\n"
                            "/list - Elenca richieste pendenti\n"
                            "/delete ID - Cancella una richiesta"
                        )
                        send_telegram_message(help_text, chat_id=chat_id, parse_mode=None)

                    elif cmd == "/status":
                        try:
                            users = get_pending_requests()
                            count = len(users)
                        except Exception as e:
                            print(f"Errore status: {e}")
                            count = "?"
                        send_telegram_message(f"Ci sono {count} richieste pendenti.", chat_id=chat_id, parse_mode=None)

                    elif cmd == "/list":
                        try:
                            pending = get_pending_requests()
                            if not pending:
                                send_telegram_message("Nessuna richiesta pendente.", chat_id=chat_id, parse_mode=None)
                            else:
                                lines = ["Richieste pendenti:\n"]
                                for u in pending:
                                    uid   = str(u.get("id", "?"))
                                    name  = str(u.get("name", "?"))
                                    email = str(u.get("email", "?"))
                                    req   = str(u.get("requestedAt", ""))[:10]
                                    lines.append(f"ID: {uid}\nNome: {name}\nEmail: {email}\nData: {req}\n")
                                send_telegram_message("\n".join(lines), chat_id=chat_id, parse_mode=None)
                        except Exception as e:
                            print(f"Errore /list: {e}")
                            send_telegram_message(f"Errore nel recupero: {e}", chat_id=chat_id, parse_mode=None)

                    elif cmd == "/delete":
                        parts = text.split()
                        if len(parts) < 2:
                            send_telegram_message("Usa /delete ID per cancellare.", chat_id=chat_id, parse_mode=None)
                        else:
                            del_id = parts[1]
                            try:
                                del_resp = requests.delete(
                                    f"{SUPABASE_URL}/rest/v1/admin_collab_users?id=eq.{del_id}",
                                    headers=get_supabase_headers(),
                                    timeout=10
                                )
                                print(f"DELETE response: {del_resp.status_code} {del_resp.text}")
                                if del_resp.status_code in (200, 204):
                                    send_telegram_message(f"Richiesta {del_id} cancellata.", chat_id=chat_id, parse_mode=None)
                                else:
                                    send_telegram_message(f"Errore cancellazione: {del_resp.status_code} - {del_resp.text}", chat_id=chat_id, parse_mode=None)
                            except Exception as e:
                                print(f"Errore /delete: {e}")
                                send_telegram_message(f"Errore: {e}", chat_id=chat_id, parse_mode=None)

        except Exception as e:
            print(f"Errore loop principale: {e}")

        poll_supabase()
        time.sleep(1)