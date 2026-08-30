import * as React from "react";
import { gooeyToast } from "goey-toast";

export interface ToastProps {
  id?: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  variant?: "default" | "success" | "destructive" | "warning" | "info";
  duration?: number;
  action?: React.ReactNode;
  [key: string]: any;
}

export function toast({
  title,
  description,
  variant = "default",
  duration = 4000,
  ...props
}: ToastProps) {
  // Clean title: remove emojis / icons for a clean text appearance
  const rawTitle = title ? (typeof title === "string" ? title : String(title)) : "";
  const titleText = rawTitle
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}✓🚨]/gu, "")
    .trim();

  const descriptionText = description
    ? typeof description === "string"
      ? description
      : String(description)
    : undefined;

  const options: Record<string, any> = {
    description: descriptionText,
    duration,
    ...props,
  };

  switch (variant) {
    case "success":
      return gooeyToast.success(titleText || "Successo", options);
    case "destructive":
      return gooeyToast.error(titleText || "Errore", options);
    case "warning":
      return gooeyToast.warning(titleText || "Attenzione", options);
    case "info":
      return gooeyToast.info(titleText || "Informazione", options);
    default:
      return gooeyToast(titleText || "Notifica", options);
  }
}

export function useToast() {
  return {
    toast,
    dismiss: (toastId?: string) => gooeyToast.dismiss(toastId),
    toasts: [],
  };
}
