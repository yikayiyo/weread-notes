import { getMeta } from "@/lib/data";
import { formatDate } from "@/lib/format";

export function SiteFooter() {
  const { lastSyncedAt } = getMeta();
  const lastSynced = lastSyncedAt ? formatDate(lastSyncedAt) : null;

  return (
    <footer className="site-footer mt-[var(--section-gap)] pt-[var(--block-gap)] text-center text-sm text-secondary">
      {lastSynced && (
        <p className="mb-4 text-xs tracking-wide text-sage/80">
          数据更新于 {lastSynced}
        </p>
      )}
      <p>
        浪漫在哪里
        <br />
        made with ❤️ by{" "}
        <a
          href="https://github.com/yikayiyo"
          className="focus-ring text-secondary underline decoration-border/60 underline-offset-[3px] transition-colors hover:text-accent hover:decoration-accent/50"
          target="_blank"
          rel="noopener noreferrer"
        >
          legao
        </a>
      </p>
    </footer>
  );
}
