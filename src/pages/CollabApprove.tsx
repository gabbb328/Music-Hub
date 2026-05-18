import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

export default function CollabApprove() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const status = params.get("status");

    if (status === "accepted") {
      localStorage.setItem("collab_accepted", "true");
      localStorage.setItem("collab_requested", "true");
    }

    if (status === "rejected") {
      localStorage.setItem("collab_accepted", "false");
      localStorage.setItem("collab_requested", "false");
    }

    setTimeout(() => {
      navigate("/");
    }, 1500);
  }, []);

  return (
    <div className="flex h-screen items-center justify-center">
      <p className="text-sm text-muted-foreground">
        Aggiornamento collaborazione...
      </p>
    </div>
  );
}
