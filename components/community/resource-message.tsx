import { COMMUNITY_RESOURCES, RESOURCE_PARAGRAPHS } from "@/lib/community/copy";
export default function ResourceMessage({ paragraphs = RESOURCE_PARAGRAPHS, labels, title = "Ресурсы для интересующихся иудаизмом", external = " (откроется в новой вкладке)" }: {
  paragraphs?: readonly string[]; labels?: readonly string[]; title?: string; external?: string;
}) {
  return <section className="space-y-5 text-neutral-700 dark:text-neutral-300" aria-label={title}>
    {paragraphs.map(text => <p key={text} className="leading-relaxed">{text}</p>)}
    <ul className="space-y-3">{COMMUNITY_RESOURCES.map((link, index) => <li key={link.href}>
      <a href={link.href} target="_blank" rel="noopener noreferrer" className="font-bold text-amber-700 dark:text-amber-400 underline underline-offset-4">{labels?.[index] ?? link.label}<span className="sr-only">{external}</span></a>
    </li>)}</ul>
  </section>;
}
