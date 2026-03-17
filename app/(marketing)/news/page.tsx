import { Newspaper } from "lucide-react";

export default function NewsPlaceholderPage() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 text-center animate-in fade-in duration-1000">
      <div className="w-24 h-24 bg-[#F8F9FA] rounded-full flex items-center justify-center mb-8 shadow-inner border border-gray-100">
        <Newspaper size={40} className="text-[#D4AF37]" strokeWidth={1} />
      </div>
      <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
        Новости общины
      </h1>
      <p className="text-lg text-gray-500 max-w-lg mx-auto">
        Этот раздел находится в разработке. Скоро здесь появятся актуальные
        события, интервью и статьи.
      </p>
    </div>
  );
}
