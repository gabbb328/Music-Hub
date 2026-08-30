import { GooeyToaster } from "goey-toast";

export function Toaster() {
  return (
    <GooeyToaster
      position="top-right"
      theme="dark"
      preset="bouncy"
      visibleToasts={5}
      closeButton="top-right"
      showProgress={true}
      showTimestamp={false}
    />
  );
}
