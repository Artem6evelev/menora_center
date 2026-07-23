"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  HeartHandshake,
  Users,
  Brain,
  Calendar,
  Sparkles,
  Sun,
  Palette,
  BookOpen,
  Puzzle,
  Baby,
  Star,
  X,
  ChevronRight,
  ChevronLeft,
  Music,
  ShieldCheck,
  Heart,
  Smile,
  ChevronDown,
  MessageCircleQuestion,
} from "lucide-react";

export default function KidsProgramsPage() {
  const [activeTrack, setActiveTrack] = useState<"general" | "special">(
    "general",
  );
  const [selectedProgram, setSelectedProgram] = useState<any | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // --- ДАННЫЕ ДЛЯ КАРУСЕЛИ В HERO ---
  const heroSlides = [
    { title: "Счастливые дети", color: "from-amber-200 to-orange-400" },
    { title: "Творческие занятия", color: "from-blue-300 to-purple-400" },
    { title: "Сенсорная комната", color: "from-emerald-200 to-teal-400" },
  ];

  // Авто-прокрутка карусели
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  // Блокировка скролла при открытом модальном окне
  useEffect(() => {
    if (selectedProgram) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [selectedProgram]);

  // --- ПРОГРАММЫ ---
  const generalPrograms = [
    {
      title: "Мини-сад «Звездочки»",
      age: "3-6 лет",
      icon: Sun,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      border: "hover:border-amber-500/50",
      desc: "Комплексное развитие, игры, творчество и первые знания в теплой атмосфере.",
      fullDesc:
        "В нашем мини-саду дети учатся самостоятельности и заводят первых друзей. Режим дня включает вкусное кошерное питание, прогулки, занятия с логопедом, ритмику и лепку. Мы создаем атмосферу, где малыш чувствует себя как дома, учится взаимодействовать в коллективе и познавать мир безопасно и радостно.",
    },
    {
      title: "Подготовка к школе",
      age: "5-7 лет",
      icon: BookOpen,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      border: "hover:border-blue-500/50",
      desc: "Чтение, математика, логика и развитие усидчивости без стресса.",
      fullDesc:
        "Занятия проходят в игровой форме, чтобы не отбить у ребенка желание учиться. Мы изучаем буквы, цифры, тренируем руку к письму и, что самое важное, развиваем эмоциональный интеллект перед первым классом.",
    },
    {
      title: "Арт-студия",
      age: "4-12 лет",
      icon: Palette,
      color: "text-pink-500",
      bg: "bg-pink-500/10",
      border: "hover:border-pink-500/50",
      desc: "Живопись, лепка, развитие креативного мышления и мелкой моторики.",
      fullDesc:
        "Использование различных материалов (глина, акварель, пастель, природные материалы). Занятия помогают раскрыть творческий потенциал ребенка, снять зажимы через арт-терапевтические методики и развить нестандартное мышление.",
    },
    {
      title: "Еврейские традиции",
      age: "От 4 лет",
      icon: Star,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
      border: "hover:border-purple-500/50",
      desc: "Изучение праздников и традиций через песни, поделки и интерактивные игры.",
      fullDesc:
        "Знакомство с культурой через увлекательные истории, веселые песни, танцы и кулинарные мастер-классы. Мы прививаем любовь к своим корням в веселой, современной и абсолютно доступной для детей форме.",
    },
  ];

  const specialPrograms = [
    {
      title: "Сенсорная интеграция",
      age: "3-12 лет",
      icon: Brain,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      border: "hover:border-emerald-500/50",
      desc: "Занятия в специально оборудованной сенсорной комнате для снятия напряжения.",
      fullDesc:
        "Глубокая работа над нейромоторными навыками. Мы используем гамаки, утяжеленные одеяла, балансиры и тактильные панели. Это помогает ребенку лучше чувствовать границы своего тела, снижает уровень тревожности и улучшает концентрацию внимания.",
    },
    {
      title: "Коммуникативные группы",
      age: "4-10 лет",
      icon: Users,
      color: "text-orange-500",
      bg: "bg-orange-500/10",
      border: "hover:border-orange-500/50",
      desc: "Мягкая социализация и развитие навыков общения в микро-группах (2-3 ребенка).",
      fullDesc:
        "Обучение базовым правилам игры, умению ждать своей очереди и экологично выражать эмоции. Занятия проводят опытные психологи и тьюторы в максимально бережной среде, где каждый шаг к общению поощряется.",
    },
    {
      title: "Индивидуальный тьюторинг",
      age: "Все возрасты",
      icon: HeartHandshake,
      color: "text-red-500",
      bg: "bg-red-500/10",
      border: "hover:border-red-500/50",
      desc: "Персональное сопровождение профильными специалистами и дефектологами.",
      fullDesc:
        "Составление индивидуального образовательного маршрута. Точечная работа над конкретными дефицитами (речь, моторика, внимание, академические навыки) в формате один на один с чутким педагогом.",
    },
    {
      title: "Адаптивное творчество",
      age: "4-12 лет",
      icon: Puzzle,
      color: "text-teal-500",
      bg: "bg-teal-500/10",
      border: "hover:border-teal-500/50",
      desc: "Арт-терапия для безопасного самовыражения и развития моторики.",
      fullDesc:
        "Использование сенсорно-приятных и безопасных материалов (кинетический песок, пальчиковые краски, экологичное тесто для лепки). Арт-терапия помогает детям с РАС мягко взаимодействовать с миром через творчество и снимает сенсорный перегруз.",
    },
  ];

  const currentPrograms =
    activeTrack === "general" ? generalPrograms : specialPrograms;

  // --- ВОПРОСЫ И ОТВЕТЫ ---
  const faqs = [
    {
      q: "Как записаться на пробное занятие?",
      a: "Вы можете нажать на кнопку «Записать ребенка» в любой программе или оставить заявку внизу страницы. Наш администратор свяжется с вами, чтобы подобрать удобное время и рассказать детали.",
    },
    {
      q: "Могу ли я присутствовать на занятиях вместе с ребенком?",
      a: "В первые дни адаптации (особенно в программах 'Особая забота') присутствие родителя возможно и даже приветствуется, чтобы ребенок чувствовал себя в безопасности.",
    },
    {
      q: "Кто работает с особенными детьми?",
      a: "С детьми занимаются квалифицированные дефектологи, детские психологи и сертифицированные тьюторы, имеющие большой опыт работы с РАС и другими особенностями развития.",
    },
    {
      q: "Предоставляете ли вы питание?",
      a: "Да, для программ длительного пребывания (например, мини-сад) мы обеспечиваем детей свежим, сбалансированным и строго кошерным питанием.",
    },
  ];

  return (
    <main className="min-h-screen bg-white dark:bg-neutral-950 pt-32 pb-24 relative overflow-hidden font-sans">
      {/* Игривые плавающие элементы на фоне */}
      <motion.div
        animate={{ y: [0, -20, 0], rotate: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
        className="absolute top-40 left-10 text-amber-300/30 dark:text-amber-500/10 -z-10"
      >
        <Sun size={120} />
      </motion.div>
      <motion.div
        animate={{ y: [0, 20, 0], rotate: [0, -10, 0] }}
        transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
        className="absolute top-[30%] right-10 text-blue-300/30 dark:text-blue-500/10 -z-10"
      >
        <Music size={100} />
      </motion.div>

      {/* Фоновая сетка */}
      <div className="absolute inset-0 h-full w-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none -z-20" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 space-y-32">
        {/* 1. HERO СЕКЦИЯ */}
        <section className="flex flex-col lg:flex-row items-center gap-12 pt-10">
          <div className="flex-1 space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-black uppercase tracking-widest shadow-sm">
              <Baby size={16} />
              <span>Menorah Kids</span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-neutral-900 dark:text-white tracking-tighter leading-[1.1]">
              Детство, полное <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-500 to-pink-500">
                радости и открытий
              </span>
            </h1>

            <p className="text-lg md:text-xl text-neutral-500 font-medium max-w-2xl leading-relaxed">
              Развивающие программы и инклюзивная среда для каждого ребенка. Мы
              создаем пространство, где дети играют, учатся и находят настоящих
              друзей.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-4">
              <button
                onClick={() =>
                  document
                    .getElementById("programs")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
                className="px-8 py-4 bg-[#FFB800] text-black font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-amber-400 hover:scale-105 transition-all shadow-xl shadow-[#FFB800]/20 flex items-center gap-2"
              >
                Выбрать программу <ArrowRight size={16} />
              </button>
            </div>
          </div>

          {/* ИГРИВАЯ КАРУСЕЛЬ */}
          <div className="flex-1 w-full relative">
            <div className="aspect-[4/3] rounded-[48px] overflow-hidden relative shadow-2xl border-4 border-white dark:border-neutral-800 group bg-neutral-100 dark:bg-neutral-900">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlide}
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className={`absolute inset-0 bg-gradient-to-br ${heroSlides[currentSlide].color} flex items-center justify-center`}
                >
                  <span className="text-black/50 dark:text-white/50 font-black uppercase tracking-widest text-xl text-center px-8 mix-blend-overlay">
                    {heroSlides[currentSlide].title}
                  </span>
                </motion.div>
              </AnimatePresence>

              <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() =>
                    setCurrentSlide((prev) =>
                      prev === 0 ? heroSlides.length - 1 : prev - 1,
                    )
                  }
                  className="w-10 h-10 bg-white/50 backdrop-blur-md rounded-full flex items-center justify-center text-black hover:bg-white transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={() =>
                    setCurrentSlide((prev) => (prev + 1) % heroSlides.length)
                  }
                  className="w-10 h-10 bg-white/50 backdrop-blur-md rounded-full flex items-center justify-center text-black hover:bg-white transition-colors"
                >
                  <ChevronRight size={20} />
                </button>
              </div>

              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 bg-black/20 backdrop-blur-md px-4 py-2 rounded-full">
                {heroSlides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentSlide(i)}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${i === currentSlide ? "bg-white scale-125 w-6" : "bg-white/50 hover:bg-white/80"}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 2. НАШИ ЦЕННОСТИ (НОВАЯ СЕКЦИЯ) */}
        <section className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black tracking-tighter mb-4 text-neutral-900 dark:text-white">
              Больше, чем просто детский центр
            </h2>
            <p className="text-neutral-500 text-lg">
              Фундамент, на котором строятся все наши программы.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-neutral-50 dark:bg-neutral-900 p-8 rounded-[32px] text-center border border-neutral-200 dark:border-neutral-800 hover:border-blue-400 transition-colors group">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-500/10 text-blue-500 mx-auto rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <ShieldCheck size={32} />
              </div>
              <h3 className="text-xl font-bold mb-3">
                Абсолютная безопасность
              </h3>
              <p className="text-neutral-500 text-sm">
                Продуманные пространства без острых углов, закрытая территория и
                строгий контроль доступа.
              </p>
            </div>

            <div className="bg-neutral-50 dark:bg-neutral-900 p-8 rounded-[32px] text-center border border-neutral-200 dark:border-neutral-800 hover:border-pink-400 transition-colors group">
              <div className="w-16 h-16 bg-pink-100 dark:bg-pink-500/10 text-pink-500 mx-auto rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Heart size={32} />
              </div>
              <h3 className="text-xl font-bold mb-3">Принятие и любовь</h3>
              <p className="text-neutral-500 text-sm">
                Мы не сравниваем детей друг с другом. Мы помогаем каждому
                раскрыть свой собственный потенциал.
              </p>
            </div>

            <div className="bg-neutral-50 dark:bg-neutral-900 p-8 rounded-[32px] text-center border border-neutral-200 dark:border-neutral-800 hover:border-amber-400 transition-colors group">
              <div className="w-16 h-16 bg-amber-100 dark:bg-amber-500/10 text-amber-500 mx-auto rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Smile size={32} />
              </div>
              <h3 className="text-xl font-bold mb-3">Еврейская теплота</h3>
              <p className="text-neutral-500 text-sm">
                Воспитание на основе традиционных ценностей: уважения к старшим,
                взаимопомощи и доброты.
              </p>
            </div>
          </div>
        </section>

        {/* 3. ИНТЕРАКТИВНЫЕ ПРОГРАММЫ (TABS) */}
        <section id="programs" className="scroll-mt-32">
          <div className="text-center mb-12 max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-6 text-neutral-900 dark:text-white">
              Направления развития
            </h2>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16 p-2 bg-neutral-100 dark:bg-neutral-900 rounded-3xl max-w-fit mx-auto border border-neutral-200 dark:border-neutral-800">
            <button
              onClick={() => setActiveTrack("general")}
              className={`px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all duration-300 flex items-center justify-center gap-3 ${
                activeTrack === "general"
                  ? "bg-white dark:bg-neutral-800 text-black dark:text-white shadow-md"
                  : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
              }`}
            >
              <Sparkles
                size={18}
                className={activeTrack === "general" ? "text-amber-500" : ""}
              />{" "}
              Для всех деток
            </button>

            <button
              onClick={() => setActiveTrack("special")}
              className={`px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all duration-300 flex items-center justify-center gap-3 ${
                activeTrack === "special"
                  ? "bg-[#FFB800] text-black shadow-md"
                  : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
              }`}
            >
              <HeartHandshake
                size={18}
                className={activeTrack === "special" ? "text-black" : ""}
              />{" "}
              Особая забота
            </button>
          </div>

          <motion.div
            layout
            className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto"
          >
            <AnimatePresence mode="popLayout">
              {currentPrograms.map((program, i) => (
                <motion.div
                  key={program.title}
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -20 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  className={`bg-white dark:bg-neutral-900 p-8 rounded-[40px] border-2 border-transparent ${program.border} shadow-sm hover:shadow-xl transition-all group flex flex-col h-full cursor-pointer relative overflow-hidden`}
                  onClick={() => setSelectedProgram(program)}
                >
                  <div
                    className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-0 group-hover:opacity-50 transition-opacity ${program.bg.replace("/10", "")}`}
                  />

                  <div className="flex justify-between items-start mb-6 relative z-10">
                    <div
                      className={`w-16 h-16 rounded-[20px] flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:rotate-6 transition-all ${program.bg} ${program.color}`}
                    >
                      <program.icon size={28} />
                    </div>
                    <span className="px-4 py-2 rounded-full bg-neutral-100 dark:bg-neutral-800 text-[10px] font-black uppercase tracking-widest text-neutral-500 group-hover:bg-white group-hover:shadow-sm transition-colors">
                      {program.age}
                    </span>
                  </div>

                  <h3 className="text-2xl font-bold mb-3 tracking-tight relative z-10">
                    {program.title}
                  </h3>
                  <p className="text-neutral-500 leading-relaxed mb-8 flex-1 relative z-10">
                    {program.desc}
                  </p>

                  <button
                    className={`text-sm font-black uppercase tracking-widest flex items-center gap-2 transition-colors mt-auto relative z-10 ${program.color}`}
                  >
                    Узнать подробнее{" "}
                    <ArrowRight
                      size={16}
                      className="group-hover:translate-x-1 transition-transform"
                    />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </section>

        {/* 4. КОМАНДА И СРЕДА (НОВАЯ СЕКЦИЯ) */}
        <section>
          <div className="bg-neutral-900 rounded-[48px] p-8 md:p-16 overflow-hidden relative border border-neutral-800">
            <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="relative z-10 flex flex-col lg:flex-row gap-12 items-center">
              <div className="flex-1 text-white space-y-6">
                <div className="w-14 h-14 bg-purple-500/20 text-purple-400 rounded-2xl flex items-center justify-center mb-4">
                  <Users size={28} />
                </div>
                <h2 className="text-4xl md:text-5xl font-black tracking-tighter">
                  С вашими детьми работают профессионалы
                </h2>
                <p className="text-neutral-400 text-lg leading-relaxed">
                  Мы тщательно отбираем команду. Каждый педагог и тьютор
                  проходит регулярные супервизии и обучение современным,
                  экологичным методикам взаимодействия с детьми.
                </p>
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="bg-white/5 border border-white/10 p-4 rounded-3xl">
                    <div className="text-3xl font-black text-[#FFB800] mb-1">
                      15+
                    </div>
                    <div className="text-xs font-bold uppercase tracking-widest text-neutral-400">
                      Педагогов и тьюторов
                    </div>
                  </div>
                  <div className="bg-white/5 border border-white/10 p-4 rounded-3xl">
                    <div className="text-3xl font-black text-blue-400 mb-1">
                      100%
                    </div>
                    <div className="text-xs font-bold uppercase tracking-widest text-neutral-400">
                      Индивидуальный подход
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1 w-full">
                <div className="aspect-square bg-white/5 border border-white/10 rounded-[32px] flex items-center justify-center p-8 text-center relative overflow-hidden">
                  {/* Плейсхолдер для фото команды */}
                  <span className="text-neutral-500 font-bold uppercase tracking-widest text-sm relative z-10">
                    [Фотография команды или <br /> процесса занятия]
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 5. FAQ / ЧАСТЫЕ ВОПРОСЫ (НОВАЯ СЕКЦИЯ) */}
        <section className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-900 text-neutral-500 mx-auto rounded-2xl flex items-center justify-center mb-6">
              <MessageCircleQuestion size={32} />
            </div>
            <h2 className="text-3xl md:text-5xl font-black tracking-tighter mb-4 text-neutral-900 dark:text-white">
              Частые вопросы
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full px-6 py-6 flex items-center justify-between text-left focus:outline-none"
                >
                  <span className="font-bold text-lg pr-4">{faq.q}</span>
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-transform duration-300 ${openFaq === i ? "bg-[#FFB800] text-black rotate-180" : "bg-white dark:bg-neutral-950 text-neutral-500"}`}
                  >
                    <ChevronDown size={20} />
                  </div>
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-6 pb-6 text-neutral-500 leading-relaxed"
                    >
                      {faq.a}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </section>

        {/* 6. CTA БЛОК (Запись) */}
        <section className="pb-12">
          <div className="bg-[#FFB800] rounded-[48px] p-8 md:p-16 text-center border border-amber-300 relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.8)_0,transparent_100%)] opacity-30 pointer-events-none" />

            <div className="relative z-10 max-w-2xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-black text-black tracking-tighter mb-6">
                Начните увлекательное путешествие
              </h2>
              <p className="text-neutral-800 font-medium text-lg mb-10 leading-relaxed">
                Оставьте заявку, и мы свяжемся с вами, чтобы пригласить на
                ознакомительную экскурсию по центру или консультацию со
                специалистом.
              </p>

              <button className="px-10 py-5 bg-black text-white font-black uppercase tracking-widest text-sm rounded-2xl hover:scale-105 transition-transform shadow-2xl">
                Записаться на встречу
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* МОДАЛЬНОЕ ОКНО ПРОГРАММЫ */}
      <AnimatePresence>
        {selectedProgram && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProgram(null)}
              className="absolute inset-0 bg-neutral-900/40 dark:bg-black/60 backdrop-blur-sm cursor-pointer"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-neutral-900 w-full max-w-2xl rounded-[40px] shadow-2xl relative z-10 overflow-hidden border border-neutral-200 dark:border-neutral-800 flex flex-col max-h-[90vh]"
            >
              <div
                className={`p-8 pb-6 flex items-start gap-6 border-b border-neutral-100 dark:border-neutral-800 ${selectedProgram.bg}`}
              >
                <div
                  className={`w-16 h-16 rounded-[20px] bg-white dark:bg-neutral-950 flex items-center justify-center shadow-sm shrink-0 ${selectedProgram.color}`}
                >
                  <selectedProgram.icon size={28} />
                </div>
                <div className="flex-1 pt-1">
                  <span className="inline-block px-3 py-1 mb-3 rounded-full bg-white/50 dark:bg-black/20 text-[10px] font-black uppercase tracking-widest text-neutral-600 dark:text-neutral-300">
                    Возраст: {selectedProgram.age}
                  </span>
                  <h3 className="text-3xl font-black text-neutral-900 dark:text-white tracking-tighter leading-tight">
                    {selectedProgram.title}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedProgram(null)}
                  className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 flex items-center justify-center transition-colors text-neutral-500"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 overflow-y-auto custom-scrollbar">
                <h4 className="text-xs font-black uppercase tracking-widest text-neutral-400 mb-4">
                  Описание программы
                </h4>
                <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed text-lg">
                  {selectedProgram.fullDesc}
                </p>

                <div className="mt-8 grid grid-cols-2 gap-4">
                  <div className="bg-neutral-50 dark:bg-neutral-950 p-4 rounded-2xl border border-neutral-100 dark:border-neutral-800">
                    <div className="text-xs font-black uppercase text-neutral-400 mb-1">
                      Расписание
                    </div>
                    <div className="font-bold text-sm">
                      Уточняется при записи
                    </div>
                  </div>
                  <div className="bg-neutral-50 dark:bg-neutral-950 p-4 rounded-2xl border border-neutral-100 dark:border-neutral-800">
                    <div className="text-xs font-black uppercase text-neutral-400 mb-1">
                      Группа
                    </div>
                    <div className="font-bold text-sm">
                      Индивидуально / Микро
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/50 flex gap-4">
                <button
                  onClick={() => setSelectedProgram(null)}
                  className="flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
                >
                  Закрыть
                </button>
                <button
                  className={`flex-[2] py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] text-white shadow-xl hover:opacity-90 hover:scale-[1.02] transition-all flex items-center justify-center gap-2 ${selectedProgram.color.replace("text-", "bg-")}`}
                >
                  <Calendar size={16} /> Оставить заявку
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
