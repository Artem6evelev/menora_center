import { cn } from "@/lib/utils";

interface ArticleContentProps {
  content: string;
  className?: string;
}

export default function ArticleContent({
  content,
  className,
}: ArticleContentProps) {
  return (
    <div
      className={cn(
        "prose prose-neutral dark:prose-invert max-w-none w-full",
        "prose-lg md:prose-xl",
        "prose-headings:font-black prose-headings:tracking-tighter prose-headings:text-neutral-900 dark:prose-headings:text-white",
        "prose-p:leading-relaxed prose-p:text-neutral-800 dark:prose-p:text-neutral-200",
        "prose-a:text-[#FFB800] prose-a:font-bold hover:prose-a:underline",
        "prose-img:rounded-[24px] md:prose-img:rounded-[40px] prose-img:shadow-2xl",
        "prose-blockquote:border-l-[#FFB800] prose-blockquote:bg-neutral-50 dark:prose-blockquote:bg-neutral-900/50 prose-blockquote:px-6 prose-blockquote:rounded-r-2xl",
        "text-left break-words",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
