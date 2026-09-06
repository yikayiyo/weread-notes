import { stripExcerptArtifacts } from "@weread/core/excerpt-filter";
import { replaceWechatEmoticons } from "@weread/core/wechat-emoji";

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
