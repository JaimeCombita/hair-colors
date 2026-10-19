import Link from "next/link";
import { siteContent } from "@/content/site";
import { buttonStyles } from "@/shared/ui/button";
import { heroStyles } from "./hero.styles";

export function Hero() {
  const { title, subtitle, cta } = siteContent.hero;

  return (
    <section className={heroStyles.root}>
      <h1 className={heroStyles.title}>{title}</h1>
      <p className={heroStyles.subtitle}>{subtitle}</p>
      <Link href={cta.href} className={buttonStyles({ size: "lg" })}>
        {cta.label}
      </Link>
    </section>
  );
}
