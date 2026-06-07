import { getArchiveData } from "@/lib/data";
import { buildSharePool } from "@/lib/share-pool";
import { ShareCardProvider } from "./ShareCardProvider";
import { ShareCardModal } from "./ShareCardModal";
import { ShareCardFab } from "./ShareCardFab";

export function ShareCardShell({ children }: { children: React.ReactNode }) {
  const pool = buildSharePool(getArchiveData());

  return (
    <ShareCardProvider pool={pool}>
      {children}
      <ShareCardModal />
      <ShareCardFab />
    </ShareCardProvider>
  );
}
