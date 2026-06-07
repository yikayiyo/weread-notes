import { stripExcerptArtifacts } from "@/lib/excerpt-filter";
import { replaceWechatEmoticons } from "@/lib/wechat-emoji";

export function FormattedText({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  return (
    <span className={className}>
      {replaceWechatEmoticons(stripExcerptArtifacts(children))}
    </span>
  );
}
