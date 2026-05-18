import { useState, useEffect } from "react";
import AdminLogin, { getAdminSession, setAdminSession, AdminSession } from "./AdminLogin";
import AdminDashboard from "./AdminDashboard";

export default function AdminPage() {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const s = getAdminSession();
    setSession(s);
    setChecked(true);
  }, []);

  useEffect(() => {
    const targets = [document.documentElement, document.body, document.getElementById("root")];
    const saved = targets.map(el => el ? { overflow: el.style.overflow, position: el.style.position, height: el.style.height } : null);

    targets.forEach(el => {
      if (!el) return;
      el.style.overflow = "auto";
      el.style.position = "static";
      el.style.height    = "auto";
    });

    return () => {
      targets.forEach((el, i) => {
        if (!el || !saved[i]) return;
        el.style.overflow = saved[i]!.overflow;
        el.style.position = saved[i]!.position;
        el.style.height   = saved[i]!.height;
      });
    };
  }, []);

  const handleLoginSuccess = (username: string) => {
    setAdminSession(username);
    setSession(getAdminSession());
  };

  const handleLogout = () => setSession(null);

  if (!checked) return null;
  if (!session) return <AdminLogin onSuccess={handleLoginSuccess} />;
  return <AdminDashboard session={session} onLogout={handleLogout} />;
}
