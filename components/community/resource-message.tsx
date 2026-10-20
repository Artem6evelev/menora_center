import { COMMUNITY_RESOURCES, RESOURCE_PARAGRAPHS } from "@/lib/community/copy";
export default function ResourceMessage() {
  return <section className="space-y-5 text-neutral-700 dark:text-neutral-300" aria-label="Ресурсы для интересующихся иудаизмом">
    {RESOURCE_PARAGRAPHS.map(text => <p key={text} className="leading-relaxed">{text}</p>)}
    <ul className="space-y-3">{COMMUNITY_RESOURCES.map(link => <li key={link.href}>
      <a href={link.href} target="_blank" rel="noopener noreferrer" className="font-bold text-amber-700 dark:text-amber-400 underline underline-offset-4">{link.label}<span className="sr-only"> (откроется в новой вкладке)</span></a>
    </li>)}</ul>
  </section>;
}
