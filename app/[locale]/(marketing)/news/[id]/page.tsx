import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Clock, Share2 } from "lucide-react";
import Balancer from "react-wrap-balancer";
import { cn } from "@/lib/utils";
import { CTA } from "@/components/cta";

// 🚀 В реальном приложении здесь будет fetch из Supabase по параметру params.id
// const post = await supabase.from('posts').select('*').eq('slug', params.id).single();

const getPostData = (id: string) => {
  // Моковые данные для демонстрации
  return {
    id,
    title:
      "Как правильно подготовить кухню к Песаху: пошаговая инструкция от Раввина",
    category: "Статья",
    date: "20 Марта 2026",
    readTime: "5 мин чтения",
    image: "/images/news-1.webp", // Убедись, что картинка есть в public/images/
    color: "bg-blue-100 text-blue-700",
    content: `
      <p>Подготовка к Песаху — это не просто генеральная уборка, это духовный процесс очищения нашего дома и сердца от «хамеца» (закваски), которая символизирует гордыню.</p>
      <h3>С чего начать?</h3>
      <p>Самое важное правило: не пытайтесь сделать всё в последний день. Разделите кухню на зоны. Начните с тех шкафов, которыми вы пользуетесь реже всего. Уберите оттуда все продукты, содержащие хамец, тщательно протрите полки и заклейте их лентой, чтобы случайно не открыть до праздника.</p>
      <blockquote>«Очищая дом от хамеца, мы освобождаем место для свободы, которую приносит Песах», — отмечает раввин.</blockquote>
      <h3>Кашерование поверхностей</h3>
      <p>Столешницы из камня или металла можно откашеровать с помощью кипящей воды (ируй). Раковину необходимо тщательно вымыть со средством, оставить на 24 часа без использования горячей воды, а затем обдать кипятком.</p>
      <p>Если вам нужна помощь в кашеровании плиты или духовки, наша община предоставляет такую услугу абсолютно бесплатно. Просто оставьте заявку в разделе «Услуги».</p>
    `,
    author: {
      name: "Раввин Имя Фамилия",
      role: "Духовный лидер общины",
      avatar: "/images/rabbi-profile.webp",
    },
  };
};

// Next.js генерация метаданных для SEO и шаринга в Telegram/WhatsApp
export async function generateMetadata({ params }: { params: { id: string } }) {
  const post = getPostData(params.id);
  return {
    title: `${post.title} | Menora Center`,
    description: post.content.substring(3, 150) + "...", // Вырезаем теги для описания
  };
}

export default function SingleNewsPage({ params }: { params: { id: string } }) {
  const post = getPostData(params.id);

  return (
    <main className="relative min-h-screen bg-white pt-24 pb-20">
      <article className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* 1. Навигация назад */}
        <div className="mb-8 pt-8">
          <Link
            href="/news"
            className="inline-flex items-center text-sm font-semibold text-neutral-500 hover:text-blue-600 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" />
            Ко всем новостям
          </Link>
        </div>

        {/* 2. Шапка статьи (Hero) */}
        <header className="mb-12">
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <span
              className={cn(
                "text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full",
                post.color,
              )}
            >
              {post.category}
            </span>
            <div className="flex items-center text-neutral-500 text-sm font-medium">
              <CalendarDays className="w-4 h-4 mr-1.5" />
              {post.date}
            </div>
            <div className="flex items-center text-neutral-500 text-sm font-medium">
              <Clock className="w-4 h-4 mr-1.5" />
              {post.readTime}
            </div>
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold text-neutral-900 leading-[1.2] mb-8 tracking-tight">
            <Balancer>{post.title}</Balancer>
          </h1>

          {/* Главное фото */}
          <div className="relative w-full aspect-video md:aspect-[21/9] rounded-[2rem] overflow-hidden bg-neutral-100 shadow-sm border border-neutral-100">
            <Image
              src={post.image}
              alt={post.title}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 1024px"
            />
          </div>
        </header>

        {/* 3. Контент и боковая панель */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
          {/* Левая боковая панель (Share + Автор на десктопе липкая) */}
          <aside className="md:col-span-3 order-2 md:order-1">
            <div className="sticky top-32 flex flex-col gap-8">
              {/* Блок автора */}
              <div className="flex items-center gap-4 md:flex-col md:items-start md:gap-3">
                <div className="relative w-12 h-12 rounded-full overflow-hidden bg-neutral-100 shrink-0">
                  <Image
                    src={post.author.avatar}
                    alt={post.author.name}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                </div>
                <div>
                  <div className="text-sm font-bold text-neutral-900">
                    {post.author.name}
                  </div>
                  <div className="text-xs text-neutral-500 mt-0.5">
                    {post.author.role}
                  </div>
                </div>
              </div>

              {/* Кнопка Share */}
              <div className="border-t border-neutral-100 pt-6">
                <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider block mb-3">
                  Поделиться
                </span>
                <button className="flex items-center justify-center w-10 h-10 rounded-full bg-neutral-50 hover:bg-blue-50 text-neutral-600 hover:text-blue-600 border border-neutral-100 transition-colors">
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </aside>

          {/* Основной текст статьи */}
          <div className="md:col-span-9 order-1 md:order-2">
            {/* 🚀 Используем кастомные стили для типографики (вместо стандартного prose), 
              чтобы сохранить контроль над дизайном (Linear-style).
            */}
            <div
              className="article-content text-neutral-700 text-lg leading-relaxed space-y-6"
              dangerouslySetInnerHTML={{ __html: post.content }} // В реальном проекте используем next-mdx-remote или html-react-parser
            />
          </div>
        </div>
      </article>

      {/* 4. Блок призыва к действию внизу (чтобы юзер не уходил с сайта) */}
      <div className="mt-24">
        <CTA />
      </div>
    </main>
  );
}
