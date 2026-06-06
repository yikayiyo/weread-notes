"use client";

import { useState } from "react";

export function SyncCommand({ command = "npm run sync" }: { command?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="sync-command group"
      aria-label={`复制命令：${command}`}
    >
      <code>{command}</code>
      <span className="sync-command-hint">
        {copied ? "已复制" : "点击复制"}
      </span>
    </button>
  );
}
