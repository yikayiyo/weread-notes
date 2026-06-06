import Link from "next/link";
import { SyncCommand } from "./SyncCommand";

const PREVIEW_QUOTE =
  "某一刻，一句话忽然与你相遇——那是阅读留在纸页上的印记。";

export function FirstRunWelcome({
  variant = "home",
  context,
}: {
  variant?: "home" | "compact";
  context?: "notes" | "archive";
}) {
  if (variant === "compact") {
    const title = context === "archive" ? "藏书等待归档" : "摘录等待落笔";
    const detail =
      context === "archive"
        ? "同步后，读过的书会按年月排列在这里。"
        : "同步后，你的划线与笔记会在这里呈现。";

    return (
      <div className="first-run first-run-compact">
        <p className="first-run-compact-title font-title">{title}</p>
        <p className="first-run-compact-detail">{detail}</p>
        <div className="first-run-compact-action">
          <span>运行 </span>
          <SyncCommand />
          <span> 从微信读书导入数据。</span>
        </div>
      </div>
    );
  }

  return (
    <div className="first-run first-run-enter">
      <header className="first-run-hero">
        <p className="first-run-eyebrow font-title">私人阅读档案</p>
        <h1 className="first-run-title">等待第一本书</h1>
        <p className="first-run-lede">
          不高山是一座安静的阅读档案。同步微信读书后，划线、笔记与藏书会在这里慢慢展开。
        </p>
      </header>

      <figure className="first-run-preview" aria-hidden="true">
        <blockquote className="first-run-preview-quote text-wrap-pretty">
          {PREVIEW_QUOTE}
        </blockquote>
        <figcaption className="first-run-preview-caption">
          同步后，你的划线会像这样呈现
        </figcaption>
      </figure>

      <section className="first-run-steps" aria-labelledby="first-run-steps-title">
        <h2
          id="first-run-steps-title"
          className="first-run-steps-heading font-title"
        >
          开始
        </h2>
        <ol className="first-run-step-list">
          <li className="first-run-step">
            <span className="first-run-step-num font-english">1</span>
            <div className="first-run-step-body">
              <p>复制 <code className="first-run-code">.env.example</code> 为{" "}
                <code className="first-run-code">.env.local</code>，填入 WeRead
                API Key。
              </p>
            </div>
          </li>
          <li className="first-run-step">
            <span className="first-run-step-num font-english">2</span>
            <div className="first-run-step-body">
              <span>在项目根目录运行 </span>
              <SyncCommand />
              <span>。</span>
            </div>
          </li>
          <li className="first-run-step">
            <span className="first-run-step-num font-english">3</span>
            <div className="first-run-step-body">
              <p>
                刷新此页。划线、笔记与藏书会出现在
                <Link href="/notes" className="first-run-link">
                  摘录
                </Link>
                与
                <Link href="/archive" className="first-run-link">
                  归档
                </Link>
                中。
              </p>
            </div>
          </li>
        </ol>
        <p className="first-run-footer">
          <Link href="/about" className="first-run-link">
            关于 →
          </Link>
        </p>
      </section>
    </div>
  );
}
