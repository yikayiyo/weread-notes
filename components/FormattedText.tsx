import { replaceWechatEmoticons } from "@/lib/wechat-emoji";

export function FormattedText({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  return (
    <span className={className}>{replaceWechatEmoticons(children)}</span>
  );
}
