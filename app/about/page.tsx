import { ScrollReveal } from "@/components/ScrollReveal";

export const metadata = {
  title: "关于 · 不高山",
};

export default function AboutPage() {
  return (
    <div className="page-stack about-page">
      <ScrollReveal>
        <figure className="about-poem">
          <blockquote className="about-poem-text font-title text-wrap-pretty">
            莫听穿林打叶声，何妨吟啸且徐行。
            <br />
            竹杖芒鞋轻胜马，谁怕？一蓑烟雨任平生。
            <br />
            料峭春风吹酒醒，微冷，山头斜照却相迎。
            <br />
            回首向来萧瑟处，归去，也无风雨也无晴。
          </blockquote>
          <figcaption className="about-poem-caption">
            苏轼 ·《定风波》
          </figcaption>
        </figure>
      </ScrollReveal>
    </div>
  );
}
