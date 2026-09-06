import { useId, useMemo, useState, type FormEvent } from "react";
import { createRoot } from "react-dom/client";
import type { ArchiveData, Book } from "@weread/core/types";
import { filterVisibleHighlights, filterVisibleNotes } from "@weread/core/excerpt-filter";
import { ReadingDeck, type ReadingDeckItem } from "./components/ReadingDeck";
import { ArchiveExplorer, BookGrid } from "./components/ArchiveExplorer";
import { NotesExplorer } from "./components/NotesExplorer";
import { HighlightCard } from "./components/HighlightCard";
import { NoteCard } from "./components/NoteCard";
import { PageSection } from "./components/PageSection";
import { SectionHeading } from "./components/SectionHeading";
import { ThemeToggle } from "./components/ThemeToggle";
import Link, { RouteProvider, ThemeProvider, usePathname, useRouter, useTheme } from "./ui-adapters";

export interface ReadingAppProps {
  archive: ArchiveData | null;
  connecting: boolean;
  syncing: boolean;
  saving?: boolean;
  progress: { completed: number; total: number; message: string } | null;
  error: string | null;
  hasKey: boolean;
  onConnect: (key: string) => Promise<boolean>;
  onSync: () => void;
  onCancel: () => void;
  onSettings: () => void;
}

function time(value?: string) {
  return Date.parse(value ?? "") || 0;
}

function prepareArchive(archive: ArchiveData) {
  const highlights = filterVisibleHighlights(archive.highlights).sort((a, b) => time(b.createdAt) - time(a.createdAt));
  const notes = filterVisibleNotes(archive.notes).sort((a, b) => time(b.createdAt) - time(a.createdAt));
  const latest = new Map<string, ReadingDeckItem["excerpt"]>();
  for (const item of [...highlights.map((item) => ({ ...item, kind: "highlight" as const })), ...notes.map((item) => ({ ...item, kind: "note" as const }))].sort((a, b) => time(b.createdAt) - time(a.createdAt))) {
    if (!latest.has(item.bookId)) latest.set(item.bookId, item);
  }
  const reading = archive.books
    .filter((book) => book.progress > 0 && book.progress < 100 && !book.finishedAt)
    .sort((a, b) => time(b.lastReadAt) - time(a.lastReadAt));
  const deck: ReadingDeckItem[] = reading.slice(0, 6).map((book) => ({ ...book, excerpt: latest.get(book.id) ?? null }));
  const finished = archive.books
    .filter((book) => book.progress >= 100 || Boolean(book.finishedAt))
    .sort((a, b) => time(b.finishedAt || b.lastReadAt) - time(a.finishedAt || a.lastReadAt));
  const groups = new Map<string, { key: string; label: string; books: Book[] }>();
  for (const book of finished) {
    const date = new Date(time(book.finishedAt));
    const dated = time(book.finishedAt) > 0;
    const key = dated ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}` : "unknown";
    if (!groups.has(key)) groups.set(key, { key, label: dated ? `${date.getFullYear()}年${date.getMonth() + 1}月` : "未记录完成日期", books: [] });
    groups.get(key)!.books.push(book);
  }
  return { books: archive.books, highlights, notes, reading, deck, finished, groups: [...groups.values()] };
}

function ConnectForm({ props, onConnected }: { props: ReadingAppProps; onConnected?: () => void }) {
  const id = useId();
  const [key, setKey] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const busy = submitting || props.connecting || props.syncing || props.saving;

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!key.trim() || busy) return;
    setSubmitting(true);
    setError("");
    try {
      if (await props.onConnect(key.trim())) {
        setKey("");
        onConnected?.();
      }
    } catch {
      setError("连接未完成，请重新同步。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="bgs-connect-form" onSubmit={submit}>
      <label htmlFor={id}>API Key</label>
      <div className="bgs-connect-row">
        <input id={id} type="password" name="weread-api-key" autoComplete="off" autoCapitalize="none" spellCheck={false} required value={key} onChange={(event) => setKey(event.target.value)} disabled={busy} placeholder="粘贴你的 API Key" aria-describedby={`${id}-help`} className="input-line focus-ring" />
        <button type="submit" className="bgs-primary focus-ring" disabled={busy || !key.trim()}>{props.saving ? "正在保存…" : props.syncing ? "正在同步…" : busy ? "正在连接…" : "同步数据"}</button>
      </div>
      <p id={`${id}-help`} className="bgs-form-help">使用你自己的微信读书服务 API Key，获取书籍、划线和笔记。</p>
      {error && <p className="bgs-form-help" role="alert">{error}</p>}
    </form>
  );
}

function SyncStatus(props: ReadingAppProps) {
  if (!props.connecting && !props.syncing && !props.saving) return null;
  return (
    <div className="bgs-sync-status" role="status" aria-live="polite">
      <p>{props.saving ? "正在保存阅读记录…" : props.syncing ? props.progress?.message || "正在获取阅读记录…" : "正在连接微信读书…"}</p>
      {props.syncing && !props.saving && props.progress && props.progress.total > 0 && <progress value={Math.min(props.progress.completed, props.progress.total)} max={props.progress.total} aria-label={`同步进度 ${props.progress.completed}/${props.progress.total}`} />}
    </div>
  );
}

function Welcome(props: ReadingAppProps) {
  const [changeKey, setChangeKey] = useState(false);
  const router = useRouter();
  const busy = props.connecting || props.syncing || props.saving;
  return (
    <section className="bgs-welcome first-run-enter">
      <h1 className="first-run-title">你的阅读，从这里开始</h1>
      <p className="first-run-lede">连接自己的微信读书，把读过的书、划线与笔记，留在这个阅读空间里。</p>
      {!props.hasKey || changeKey ? <ConnectForm props={props} onConnected={() => { setChangeKey(false); router.replace("/"); }} /> : <div className="bgs-welcome-actions">
        <button type="button" className="bgs-primary focus-ring" disabled={busy} onClick={props.onSync}>{props.saving ? "正在保存…" : props.syncing ? "正在同步…" : "同步数据"}</button>
        <button type="button" className="bgs-text-button focus-ring" disabled={busy} onClick={() => setChangeKey(true)}>更换 API Key</button>
      </div>}
      <SyncStatus {...props} />
      {props.syncing && !props.saving && <button type="button" className="bgs-text-button focus-ring" onClick={props.onCancel}>取消同步</button>}
      <p className="bgs-welcome-footnote">同步后，随时回来翻阅。阅读数据保存在当前仓库。</p>
    </section>
  );
}

function ReadingApp(props: ReadingAppProps) {
  const { theme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const [changeKey, setChangeKey] = useState(false);
  const data = useMemo(() => props.archive ? prepareArchive(props.archive) : null, [props.archive]);
  const hasData = Boolean(data && (data.books.length || data.highlights.length || data.notes.length));
  const ready = Boolean(props.archive?.meta.lastSyncedAt) || hasData;
  const busy = props.connecting || props.syncing || props.saving;
  const lastSync = props.archive?.meta.lastSyncedAt;
  const syncFailures = props.archive?.meta.syncFailures ?? [];

  return (
    <div className={`bgs-root${theme === "dark" ? " dark" : ""}`}>
      <div className="page-shell">
        <header className={`bgs-toolbar${ready ? "" : " bgs-welcome-toolbar"}`}>
          {ready && <div><h1 className="page-heading">我的阅读</h1><p className="bgs-sync-time">{lastSync && time(lastSync) ? `更新于 ${new Date(lastSync).toLocaleString()}` : "书籍、划线与笔记，都在这里"}</p></div>}
          <div className="bgs-actions">
            {ready && <>
              <button type="button" className="bgs-text-button focus-ring" disabled={busy} aria-expanded={changeKey || !props.hasKey} onClick={() => setChangeKey((value) => !value)}>{changeKey ? "收起" : "更换 API Key"}</button>
              <button type="button" className="bgs-primary focus-ring" disabled={props.saving || (props.connecting && !props.syncing)} onClick={props.syncing ? props.onCancel : props.hasKey ? props.onSync : () => setChangeKey(true)}>{props.saving ? "正在保存…" : props.syncing ? "取消同步" : props.connecting ? "正在连接…" : "更新数据"}</button>
            </>}
            <ThemeToggle />
          </div>
        </header>
        {props.error && <div className="bgs-error" role="alert"><p>{props.error}</p>{ready && <p className="text-secondary">仍在显示上次保存的阅读记录，可以重新同步。</p>}</div>}
        {ready && <>
          {(changeKey || !props.hasKey) && <div className="bgs-change-key"><ConnectForm props={props} onConnected={() => { setChangeKey(false); router.replace("/"); }} /></div>}
          <SyncStatus {...props} />
          {syncFailures.length > 0 && <section className="bgs-error bgs-sync-partial" aria-label="部分同步完成">
            <p role="status">已显示可获取的阅读记录，{syncFailures.length} 本书未完成同步。</p>
            <details>
              <summary className="focus-ring">查看未完成的书籍</summary>
              <ul>{syncFailures.map((failure) => <li key={failure.bookId}><p>{failure.title || `书籍 ${failure.bookId}`}</p><p className="text-secondary">{failure.message}</p></li>)}</ul>
            </details>
            <button type="button" className="bgs-text-button focus-ring" disabled={busy} onClick={props.onSync}>重试未完成数据</button>
          </section>}
        </>}
        <main className="content-column" aria-label="我的阅读内容">
          {!ready || !data ? <Welcome {...props} /> : pathname === "/notes" ? <div className="page-stack">
            <Link href="/" className="bgs-back-link focus-ring">← 返回我的阅读</Link>
            <NotesExplorer books={data.books} highlights={data.highlights} notes={data.notes} />
          </div> : pathname === "/archive" ? <div className="page-stack">
            <Link href="/" className="bgs-back-link focus-ring">← 返回我的阅读</Link>
            <header><h2 className="page-heading">读过的书</h2><p className="page-kicker">共读完 {data.finished.length} 本电子书</p></header>
            {data.finished.length ? <ArchiveExplorer groups={data.groups} /> : <p className="empty-state-inline">读完一本书后，它会出现在这里。</p>}
          </div> : <div className="page-stack bgs-overview">
            <dl className="bgs-stats">{[["已读", data.finished.length], ["在读", data.reading.length], ["划线", data.highlights.length], ["笔记", data.notes.length]].map(([label, count]) => <div key={label}><dt>{label}</dt><dd>{count}</dd></div>)}</dl>
            {!hasData ? <section className="bgs-account-empty"><h2 className="page-heading">{syncFailures.length ? "阅读记录尚未完整" : "还没有阅读记录"}</h2><p className="page-kicker">{syncFailures.length ? "部分书籍暂时无法获取，可以重试未完成的数据。" : "已经连接成功。开始阅读后，再更新一次，记录就会出现在这里。"}</p></section> : <>
              {data.deck.length ? <ReadingDeck books={data.deck} /> : <PageSection><SectionHeading title="最近在读" initialVisible /><p className="empty-state-inline">还没有在读记录，翻开一本书后再来看看。</p></PageSection>}
              <PageSection>
                <SectionHeading title="读过的书" href={data.finished.length > 6 ? "/archive" : undefined} linkLabel={`查看全部 ${data.finished.length} 本`} initialVisible />
                {data.finished.length ? <BookGrid books={data.finished.slice(0, 6)} /> : <p className="empty-state-inline">读完一本书后，它会收在这里。</p>}
              </PageSection>
              <PageSection>
                <SectionHeading title="最近划线" href={data.highlights.length ? "/notes" : undefined} linkLabel="查看全部划线" accent="ochre" initialVisible />
                {data.highlights.length ? <div className="excerpt-list">{data.highlights.slice(0, 3).map((highlight) => <HighlightCard key={highlight.id} highlight={highlight} books={data.books} reveal={false} />)}</div> : <p className="empty-state-inline">书里打动你的句子，会留在这里。</p>}
              </PageSection>
              <PageSection>
                <SectionHeading title="最近笔记" href={data.notes.length ? "/notes?tab=notes" : undefined} linkLabel="查看全部笔记" accent="mauve" initialVisible />
                {data.notes.length ? <div className="excerpt-list">{data.notes.slice(0, 3).map((note) => <NoteCard key={note.id} note={note} books={data.books} reveal={false} />)}</div> : <p className="empty-state-inline">阅读时写下的想法，会留在这里。</p>}
              </PageSection>
            </>}
          </div>}
        </main>
      </div>
    </div>
  );
}

export function mountReadingApp(container: HTMLElement, props: ReadingAppProps) {
  const root = createRoot(container);
  const initialDark = container.ownerDocument.body.classList.contains("theme-dark");
  const update = (nextProps: ReadingAppProps) => root.render(
    <ThemeProvider initialDark={initialDark}><RouteProvider><ReadingApp {...nextProps} /></RouteProvider></ThemeProvider>,
  );
  update(props);
  return { update, destroy: () => root.unmount() };
}
