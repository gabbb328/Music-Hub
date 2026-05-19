import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

import { getCollabUsers, saveCollabUsers } from "@/services/supabase-api";

export default function CollabApprove() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const status = params.get("status");
    const user = params.get("user");

    const updateStatus = async () => {
      if (status === "accepted" || status === "rejected") {
        if (user) {
          const users = await getCollabUsers();
          const updatedUsers = users.map((u: any) => {
            if (u.name === user) {
              return {
                ...u,
                status: status,
                permissions: {
                  ...u.permissions,
                  canAccessAdmin: status === "accepted",
                  canAccessGithub: status === "accepted",
                },
              };
            }
            return u;
          });
          await saveCollabUsers(updatedUsers);
        }
      }
      setTimeout(() => {
        navigate("/");
      }, 1500);
    };

    updateStatus();
  }, [navigate, params]);

  return (
    <div className="flex h-screen items-center justify-center">
      <p className="text-sm text-muted-foreground">
        Aggiornamento collaborazione...
      </p>
    </div>
  );
}
