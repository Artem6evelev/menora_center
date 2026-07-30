"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence, Variants } from "framer-motion";
import {
  ArrowRight,
  Users,
  Brain,
  Calendar,
  Sun,
  Palette,
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
  MessageSquare,
  Compass,
  Gift,
} from "lucide-react";

export default function KidsProgramsClient() {
  const [selectedProgram, setSelectedProgram] = useState<any | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // --- ДАННЫЕ ДЛЯ КАРУСЕЛИ В HERO (ОБНОВЛЕНО С ПУТЯМИ К КАРТИНКАМ) ---
  const heroSlides = [
    {
      title: "Счастливые дети",
      image: "/kids/kids1.webp",
      alt: "Счастливые дети на занятиях в Menorah Kids",
    },
    {
      title: "Творческие занятия",
      image: "/kids/kids2.webp",
      alt: "Творческие детские занятия и мастер-классы",
    },
    {
      title: "Комфортная среда",
      image: "/kids/kids3.webp",
      alt: "Комфортная и безопасная среда для развития детей",
    },
  ];

  // Авто-прокрутка карусели
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
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
  const programs = [
    {
      title: "Занятия по еврейской традиции и изучению Торы",
      age: "4-12 лет",
      icon: Star,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      glowBg: "bg-amber-500",
      border: "hover:border-amber-400",
      desc: "Изучение праздников и традиций через увлекательные истории и интерактивные форматы.",
      fullDesc:
        "Знакомство с культурой через увлекательные истории, веселые песни, танцы и мастер-классы. Мы прививаем любовь к своим корням в веселой, современной и абсолютно доступной для детей форме.",
    },
    {
      title: "Творческие мастерские",
      age: "4-12 лет",
      icon: Palette,
      color: "text-pink-500",
      bg: "bg-pink-500/10",
      glowBg: "bg-pink-500",
      border: "hover:border-pink-400",
      desc: "Живопись, лепка, развитие креативного мышления и мелкой моторики.",
      fullDesc:
        "Использование различных материалов (глина, акварель, пастель, природные материалы). Занятия помогают раскрыть творческий потенциал ребенка, безопасно выразить свои эмоции через арт-практики и развить нестандартное мышление.",
    },
    {
      title: "Программы для детей с нейроотличиями",
      age: "3-12 лет",
      icon: Brain,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      glowBg: "bg-emerald-500",
      border: "hover:border-emerald-400",
      desc: "Дополнительные программы, бережно адаптированные под индивидуальные возможности детей.",
      fullDesc:
        "Занятия выстроены с учетом особенностей восприятия каждого ребенка. Мы используем методики сенсорной интеграции и мягкие подходы, которые помогают детям лучше чувствовать границы своего тела, снижают уровень тревожности и создают безопасное пространство для развития.",
    },
    {
      title: "Совместные праздники и встречи",
      age: "Все возрасты",
      icon: Sun,
      color: "text-orange-500",
      bg: "bg-orange-500/10",
      glowBg: "bg-orange-500",
      border: "hover:border-orange-400",
      desc: "Теплые мероприятия в духе нашей общины для всей семьи.",
      fullDesc:
        "Регулярные встречи, где дети и родители могут вместе отметить важные даты, проникнуться духом общины и просто хорошо провести время в кругу единомышленников. Настоящая теплая и семейная атмосфера.",
    },
    {
      title: "Коммуникативные навыки и лидерство",
      age: "6-12 лет",
      icon: Users,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      glowBg: "bg-blue-500",
      border: "hover:border-blue-400",
      desc: "Развитие уверенности в себе, эмоционального интеллекта и уважения к окружающим.",
      fullDesc:
        "Обучение базовым правилам взаимодействия в коллективе, умению экологично выражать свои эмоции и прислушиваться к другим. Занятия помогают развить лидерские качества, уверенность в себе и заложить фундамент для крепкой дружбы.",
    },
    {
      title: "Разговорный клуб иврита",
      age: "4-12 лет",
      icon: MessageCircleQuestion,
      color: "text-teal-500",
      bg: "bg-teal-500/10",
      glowBg: "bg-teal-500",
      border: "hover:border-teal-400",
      desc: "Изучение языка через живое общения, игры и творчество.",
      fullDesc:
        "Легкое и естественное погружение в языковую среду. Никаких скучных зубрежек — только интерактив, игровые формы, песни и живое общение, которые помогают детям быстро преодолеть языковой барьер.",
    },
    {
      title: "Разговорный клуб русского языка",
      age: "4-12 лет",
      icon: MessageSquare,
      color: "text-indigo-500",
      bg: "bg-indigo-500/10",
      glowBg: "bg-indigo-500",
      border: "hover:border-indigo-400",
      desc: "Поддержание и развитие грамотной речи, обогащение словарного запаса.",
      fullDesc:
        "Клуб для детей, которым важно сохранить и развить русский язык. Мы читаем интересные истории, обсуждаем сказки, играем в словесные игры и учимся красиво и правильно формулировать свои мысли.",
    },
    {
      title: "Подростковые клубы «Я и мой путь»",
      age: "12-17 лет",
      icon: Compass,
      color: "text-red-500",
      bg: "bg-red-500/10",
      glowBg: "bg-red-500",
      border: "hover:border-red-400",
      desc: "Регулярные встречи: для мальчиков с Раввином и для девочек с Рабанит (2 раза в месяц).",
      fullDesc:
        "Безопасное пространство для подростков, где можно обсудить важные жизненные вопросы, свой путь в большом мире, ценности и ориентиры. Встречи проходят в доверительной атмосфере два раза в месяц, раздельно для мальчиков (с Раввином) и девочек (с Рабанит).",
    },
  ];

  // --- ВОПРОСЫ И ОТВЕТЫ ---
  const faqs = [
    {
      q: "Как записаться на пробное занятие?",
      a: "Вы можете нажать на кнопку «Записать ребенка» в любой программе или оставить заявку внизу страницы. Наш администратор свяжется с вами, чтобы подобрать удобное время и рассказать детали.",
    },
    {
      q: "Могу ли я присутствовать на занятиях вместе с ребенком?",
      a: "Да.",
    },
    {
      q: "Кто работает с нейроотличными детьми?",
      a: "С детьми с нейроотличиями занимается квалифицированная команда специалистов, которая имеет большой опыт работы с разными видами развития.",
    },
    {
      q: "Предоставляется ли питание?",
      a: "Детям предоставляется легкий перекус в течение пребывания в центре.",
    },
  ];

  const fadeUpVariant: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 },
    },
  };

  return (
    <main className="min-h-screen bg-white dark:bg-neutral-950 pt-32 pb-24 relative overflow-hidden font-sans selection:bg-[#FFB800] selection:text-black">
      {/* Плавные летающие элементы на фоне */}
      <motion.div
        animate={{ y: [0, -30, 0], rotate: [0, 15, -15, 0] }}
        transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
        className="absolute top-40 left-5 md:left-20 text-amber-300/30 dark:text-amber-500/10 -z-10 blur-[2px]"
        aria-hidden="true"
      >
        <Sun size={140} />
      </motion.div>
      <motion.div
        animate={{ y: [0, 40, 0], x: [0, -20, 0], rotate: [0, -20, 10, 0] }}
        transition={{ repeat: Infinity, duration: 10, ease: "easeInOut" }}
        className="absolute top-[40%] right-5 md:right-20 text-blue-300/30 dark:text-blue-500/10 -z-10 blur-[2px]"
        aria-hidden="true"
      >
        <Music size={120} />
      </motion.div>

      {/* Фоновая сетка */}
      <div
        className="absolute inset-0 h-full w-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none -z-20"
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 space-y-32">
        {/* 1. HERO СЕКЦИЯ */}
        <section className="flex flex-col lg:flex-row items-center gap-12 pt-10">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="flex-1 space-y-8"
          >
            <motion.div
              variants={fadeUpVariant}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-black uppercase tracking-widest shadow-sm"
            >
              <Baby size={16} aria-hidden="true" />
              <span>Menorah Kids</span>
            </motion.div>

            <motion.h1
              variants={fadeUpVariant}
              className="text-5xl md:text-6xl lg:text-7xl font-black text-neutral-900 dark:text-white tracking-tighter leading-[1.1]"
            >
              Детство, полное <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-500 to-pink-500 animate-gradient-x">
                радости и открытий
              </span>
            </motion.h1>

            <motion.p
              variants={fadeUpVariant}
              className="text-lg md:text-xl text-neutral-500 font-medium max-w-2xl leading-relaxed"
            >
              В мире существует огромное количество нейроотличий. Открывая наш
              центр, мы делаем особый акцент на подборе персонала с опытом
              работы с нейроотличными детьми и глубоким пониманием их
              особенностей. Наш центр открыт для всех детей общины. Здесь их
              ждет теплая, комфортная обстановка и созданное пространство, где
              дети играют, учатся и находят настоящих друзей.
            </motion.p>

            <motion.div
              variants={fadeUpVariant}
              className="flex flex-wrap items-center gap-4 pt-4"
            >
              <button
                onClick={() =>
                  document
                    .getElementById("programs")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
                className="px-8 py-4 bg-[#FFB800] text-black font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-amber-400 hover:scale-105 active:scale-95 transition-all duration-300 shadow-xl shadow-[#FFB800]/20 flex items-center gap-2 group"
              >
                Наши программы{" "}
                <ArrowRight
                  size={16}
                  className="group-hover:translate-x-1 transition-transform"
                  aria-hidden="true"
                />
              </button>
            </motion.div>
          </motion.div>

          {/* ИГРИВАЯ КАРУСЕЛЬ С ФОТОГРАФИЯМИ */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, rotate: -3 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
            className="flex-1 w-full relative"
          >
            <div className="aspect-[4/3] rounded-[48px] overflow-hidden relative shadow-2xl border-4 border-white dark:border-neutral-800 group bg-neutral-100 dark:bg-neutral-900">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlide}
                  initial={{ opacity: 0, scale: 1.1 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.7, ease: "easeOut" }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <Image
                    src={heroSlides[currentSlide].image}
                    alt={heroSlides[currentSlide].alt}
                    fill
                    className="object-cover"
                    priority={currentSlide === 0} // Приоритетная загрузка для первой картинки (важно для SEO/LCP)
                  />
                  {/* Затемняющий слой для читаемости текста поверх фото */}
                  <div className="absolute inset-0 bg-black/40" />

                  <motion.span
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-white font-black uppercase tracking-widest text-xl md:text-2xl text-center px-8 relative z-10 drop-shadow-lg"
                  >
                    {heroSlides[currentSlide].title}
                  </motion.span>
                </motion.div>
              </AnimatePresence>

              <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <button
                  aria-label="Предыдущий слайд"
                  onClick={() =>
                    setCurrentSlide((prev) =>
                      prev === 0 ? heroSlides.length - 1 : prev - 1,
                    )
                  }
                  className="w-12 h-12 bg-white/50 backdrop-blur-md rounded-full flex items-center justify-center text-black hover:bg-white hover:scale-110 active:scale-95 transition-all"
                >
                  <ChevronLeft size={24} aria-hidden="true" />
                </button>
                <button
                  aria-label="Следующий слайд"
                  onClick={() =>
                    setCurrentSlide((prev) => (prev + 1) % heroSlides.length)
                  }
                  className="w-12 h-12 bg-white/50 backdrop-blur-md rounded-full flex items-center justify-center text-black hover:bg-white hover:scale-110 active:scale-95 transition-all"
                >
                  <ChevronRight size={24} aria-hidden="true" />
                </button>
              </div>

              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 bg-black/20 backdrop-blur-md px-5 py-3 rounded-full">
                {heroSlides.map((_, i) => (
                  <button
                    key={i}
                    aria-label={`Перейти к слайду ${i + 1}`}
                    onClick={() => setCurrentSlide(i)}
                    className={`w-2.5 h-2.5 rounded-full transition-all duration-500 ${
                      i === currentSlide
                        ? "bg-[#FFB800] scale-150 w-8"
                        : "bg-white/70 hover:bg-white"
                    }`}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </section>

        {/* 2. НАШИ ЦЕННОСТИ */}
        <section className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUpVariant}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-black tracking-tighter mb-4 text-neutral-900 dark:text-white">
              Больше, чем просто детский центр
            </h2>
            <p className="text-neutral-500 text-lg">
              Фундамент, на котором строятся все наши программы.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {[
              {
                icon: ShieldCheck,
                title: "Абсолютная безопасность",
                desc: "Продуманные пространства без острых углов, закрытая территория и строгий контроль доступа.",
                color: "blue",
              },
              {
                icon: Heart,
                title: "Принятие и любовь",
                desc: "Мы не сравниваем детей друг с другом. Мы помогаем каждому раскрыть свой собственный потенциал.",
                color: "pink",
              },
              {
                icon: Smile,
                title: "Еврейская теплота",
                desc: "Воспитание на основе традиционных ценностей: уважения к старшим, взаимопомощи и доброты.",
                color: "amber",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                variants={fadeUpVariant}
                whileHover={{ y: -10 }}
                className={`bg-neutral-50 dark:bg-neutral-900 p-8 rounded-[32px] text-center border border-neutral-200 dark:border-neutral-800 hover:border-${item.color}-400 hover:shadow-2xl hover:shadow-${item.color}-500/10 transition-all duration-300 group`}
              >
                <div
                  className={`w-16 h-16 bg-${item.color}-100 dark:bg-${item.color}-500/10 text-${item.color}-500 mx-auto rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300`}
                >
                  <item.icon size={32} aria-hidden="true" />
                </div>
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-neutral-500 text-sm">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* 3. ПРОГРАММЫ */}
        <section id="programs" className="scroll-mt-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16 max-w-3xl mx-auto"
          >
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-6 text-neutral-900 dark:text-white">
              Направления развития
            </h2>
          </motion.div>

          <div className="relative">
            <div
              className={`overflow-hidden transition-[max-height] duration-1000 ease-in-out md:!max-h-none ${
                isExpanded ? "max-h-[6000px]" : "max-h-[1250px]"
              }`}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto pb-6">
                {programs.map((program, i) => (
                  <motion.div
                    key={program.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.05 }}
                    className={`bg-white dark:bg-neutral-900 p-8 rounded-[40px] border-2 border-transparent ${program.border} shadow-md hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 ease-out group flex flex-col h-full cursor-pointer relative overflow-hidden`}
                    onClick={() => setSelectedProgram(program)}
                  >
                    <div
                      className={`absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl opacity-0 group-hover:opacity-40 transition-opacity duration-500 ${program.glowBg}`}
                    />

                    <div className="flex justify-between items-start mb-6 relative z-10">
                      <div
                        className={`w-16 h-16 rounded-[20px] flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-300 ${program.bg} ${program.color}`}
                      >
                        <program.icon size={28} aria-hidden="true" />
                      </div>
                      <span className="px-4 py-2 rounded-full bg-neutral-100 dark:bg-neutral-800 text-[10px] font-black uppercase tracking-widest text-neutral-500 group-hover:bg-white group-hover:shadow-sm transition-colors duration-300">
                        {program.age}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold mb-3 tracking-tight relative z-10">
                      {program.title}
                    </h3>
                    <p className="text-neutral-500 text-sm leading-relaxed mb-8 flex-1 relative z-10">
                      {program.desc}
                    </p>

                    <button
                      className={`text-sm font-black uppercase tracking-widest flex items-center gap-2 transition-colors mt-auto relative z-10 ${program.color}`}
                    >
                      Узнать подробнее{" "}
                      <ArrowRight
                        size={16}
                        className="group-hover:translate-x-2 transition-transform duration-300"
                        aria-hidden="true"
                      />
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>

            <AnimatePresence>
              {!isExpanded && (
                <motion.div
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="absolute bottom-0 left-0 w-full h-[400px] bg-gradient-to-t from-white via-white/95 dark:from-neutral-950 dark:via-neutral-950/95 to-transparent flex items-end justify-center pb-8 z-20 md:hidden pointer-events-none"
                >
                  <button
                    onClick={() => setIsExpanded(true)}
                    className="pointer-events-auto px-8 py-4 bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl border border-neutral-200/50 dark:border-neutral-800/50 text-neutral-800 dark:text-neutral-200 font-black uppercase tracking-[0.15em] text-[11px] rounded-full shadow-[0_10px_40px_rgb(0,0,0,0.12)] hover:shadow-[0_10px_40px_rgb(0,0,0,0.2)] hover:-translate-y-1 active:scale-95 transition-all duration-300 flex items-center gap-3 group"
                  >
                    Все направления
                    <div className="w-7 h-7 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center group-hover:bg-[#FFB800] group-hover:text-black transition-colors duration-300">
                      <ChevronDown
                        size={14}
                        className="animate-bounce"
                        aria-hidden="true"
                      />
                    </div>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* 4. КОМАНДА И СРЕДА */}
        <section>
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="bg-neutral-900 rounded-[48px] p-8 md:p-16 overflow-hidden relative border border-neutral-800 shadow-2xl"
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
              className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[120px] pointer-events-none"
              aria-hidden="true"
            />

            <div className="relative z-10 flex flex-col lg:flex-row gap-12 items-center">
              <div className="flex-1 text-white space-y-6">
                <div className="w-14 h-14 bg-purple-500/20 text-purple-400 rounded-2xl flex items-center justify-center mb-4">
                  <Users size={28} aria-hidden="true" />
                </div>
                <h2 className="text-4xl md:text-5xl font-black tracking-tighter">
                  С вашими детьми работают профессионалы
                </h2>
                <p className="text-neutral-400 text-lg leading-relaxed">
                  Команда нашего центра регулярно проходит супервизии и обучение
                  современным, экологичным методикам взаимодействия с детьми.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="bg-white/5 border border-white/10 p-5 rounded-3xl transition-transform"
                  >
                    <div className="text-xl font-black text-[#FFB800] mb-2 leading-tight">
                      Большая база специалистов
                    </div>
                    <div className="text-xs font-bold uppercase tracking-widest text-neutral-400">
                      которые работают с нашим центром
                    </div>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="bg-white/5 border border-white/10 p-5 rounded-3xl transition-transform"
                  >
                    <div className="text-3xl font-black text-blue-400 mb-2">
                      100%
                    </div>
                    <div className="text-xs font-bold uppercase tracking-widest text-neutral-400">
                      Индивидуальный подход
                    </div>
                  </motion.div>
                </div>
              </div>

              <div className="flex-1 w-full">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="aspect-square bg-white/5 border border-white/10 rounded-[32px] flex items-center justify-center text-center relative overflow-hidden transition-transform duration-500 cursor-pointer group"
                >
                  <Image
                    src="/kids/kids4.webp"
                    alt="Профессиональная команда Menorah Kids"
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-300" />
                  <span className="text-white/80 font-bold uppercase tracking-widest text-sm relative z-10 group-hover:text-white transition-colors duration-300 mt-auto mb-8">
                    Индивидуальный подход
                  </span>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* 5. FAQ / ЧАСТЫЕ ВОПРОСЫ */}
        <section className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-900 text-neutral-500 mx-auto rounded-2xl flex items-center justify-center mb-6">
              <MessageCircleQuestion size={32} aria-hidden="true" />
            </div>
            <h2 className="text-3xl md:text-5xl font-black tracking-tighter mb-4 text-neutral-900 dark:text-white">
              Частые вопросы
            </h2>
          </motion.div>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl overflow-hidden hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  aria-expanded={openFaq === i}
                  aria-controls={`faq-answer-${i}`}
                  className="w-full px-6 py-6 flex items-center justify-between text-left focus:outline-none"
                >
                  <span className="font-bold text-lg pr-4">{faq.q}</span>
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                      openFaq === i
                        ? "bg-[#FFB800] text-black rotate-180 scale-110 shadow-lg shadow-[#FFB800]/20"
                        : "bg-white dark:bg-neutral-950 text-neutral-500"
                    }`}
                  >
                    <ChevronDown size={20} aria-hidden="true" />
                  </div>
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div
                      id={`faq-answer-${i}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      <div className="px-6 pb-6 text-neutral-500 leading-relaxed">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </section>

        {/* 6. CTA БЛОК (Запись) */}
        <section>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, type: "spring", bounce: 0.3 }}
            className="bg-[#FFB800] rounded-[48px] p-8 md:p-16 text-center border border-amber-300 relative overflow-hidden shadow-2xl shadow-[#FFB800]/20"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.4, 0.3] }}
              transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] h-[200%] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.8)_0,transparent_50%)] pointer-events-none"
              aria-hidden="true"
            />

            <div className="relative z-10 max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-5xl font-black text-black tracking-tighter mb-6">
                Хотите видеть вашего ребёнка в совместном пути с нами?
              </h2>
              <p className="text-neutral-800 font-medium text-lg mb-10 leading-relaxed">
                Оставляйте заявку, и мы свяжемся с вами, чтобы пригласить на
                ознакомительную экскурсию по центру или консультацию со
                специалистом.
              </p>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-10 py-5 bg-black text-white font-black uppercase tracking-widest text-sm rounded-2xl shadow-2xl"
              >
                Записаться на встречу
              </motion.button>
            </div>
          </motion.div>
        </section>

        {/* 7. БЛОК ПОЖЕРТВОВАНИЙ (Donation) */}
        <section className="pb-12">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-gradient-to-r from-emerald-400 to-teal-500 rounded-[48px] p-8 md:p-12 text-center relative overflow-hidden shadow-2xl shadow-teal-500/20"
          >
            <motion.div
              animate={{ y: [0, -20, 0], rotate: [0, 10, 0] }}
              transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
              className="absolute -top-10 -left-10 text-white/20 blur-sm"
              aria-hidden="true"
            >
              <Gift size={250} />
            </motion.div>

            <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center">
              <motion.div
                whileHover={{ rotate: 15, scale: 1.1 }}
                className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-white mb-6 backdrop-blur-sm cursor-pointer transition-transform"
                aria-hidden="true"
              >
                <Heart size={32} fill="currentColor" />
              </motion.div>
              <h2 className="text-3xl md:text-4xl font-black text-white tracking-tighter mb-4">
                Хотите поддержать наш детский центр?
              </h2>
              <p className="text-emerald-50 font-medium text-lg mb-8 leading-relaxed max-w-2xl">
                У нас есть отдельная страница для партнеров и тех, кто уже
                жертвует на развитие программ. Мы делаем всё максимально
                прозрачно. Ваша поддержка помогает нам создавать лучшие условия
                для каждого ребенка.
              </p>

              <motion.a
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                href="https://shutaf.im/cba301"
                className="px-10 py-5 bg-white text-teal-600 font-black uppercase tracking-widest text-sm rounded-2xl shadow-xl flex items-center gap-2 group"
              >
                Сделать пожертвование{" "}
                <ArrowRight
                  size={16}
                  className="group-hover:translate-x-1 transition-transform"
                  aria-hidden="true"
                />
              </motion.a>
            </div>
          </motion.div>
        </section>
      </div>

      {/* МОДАЛЬНОЕ ОКНО ПРОГРАММЫ */}
      <AnimatePresence>
        {selectedProgram && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6">
            <motion.div
              initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
              animate={{ opacity: 1, backdropFilter: "blur(8px)" }}
              exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
              transition={{ duration: 0.3 }}
              onClick={() => setSelectedProgram(null)}
              className="absolute inset-0 bg-neutral-900/40 dark:bg-black/60 cursor-pointer"
              aria-hidden="true"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 40 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="bg-white dark:bg-neutral-900 w-full max-w-2xl rounded-[40px] shadow-2xl relative z-10 overflow-hidden border border-neutral-200 dark:border-neutral-800 flex flex-col max-h-[90vh]"
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-title"
            >
              <div
                className={`p-8 pb-6 flex items-start gap-6 border-b border-neutral-100 dark:border-neutral-800 transition-colors duration-500 ${selectedProgram.bg}`}
              >
                <motion.div
                  initial={{ scale: 0, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", delay: 0.1, damping: 15 }}
                  className={`w-16 h-16 rounded-[20px] bg-white dark:bg-neutral-950 flex items-center justify-center shadow-sm shrink-0 ${selectedProgram.color}`}
                  aria-hidden="true"
                >
                  <selectedProgram.icon size={28} />
                </motion.div>
                <div className="flex-1 pt-1">
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="inline-block px-3 py-1 mb-3 rounded-full bg-white/50 dark:bg-black/20 text-[10px] font-black uppercase tracking-widest text-neutral-600 dark:text-neutral-300"
                  >
                    Возраст: {selectedProgram.age}
                  </motion.span>
                  <motion.h3
                    id="modal-title"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white tracking-tighter leading-tight"
                  >
                    {selectedProgram.title}
                  </motion.h3>
                </div>
                <button
                  aria-label="Закрыть окно программы"
                  onClick={() => setSelectedProgram(null)}
                  className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 flex items-center justify-center transition-colors text-neutral-500 shrink-0 hover:rotate-90 duration-300"
                >
                  <X size={20} aria-hidden="true" />
                </button>
              </div>

              <div className="p-8 overflow-y-auto custom-scrollbar">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <h4 className="text-xs font-black uppercase tracking-widest text-neutral-400 mb-4">
                    Описание программы
                  </h4>
                  <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed text-lg">
                    {selectedProgram.fullDesc}
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="mt-8 grid grid-cols-2 gap-4"
                >
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
                      Формат
                    </div>
                    <div className="font-bold text-sm">
                      Групповой / Индивидуальный
                    </div>
                  </div>
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="p-6 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950/50 flex gap-4"
              >
                <button
                  onClick={() => setSelectedProgram(null)}
                  className="flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
                >
                  Закрыть
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex-[2] py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] text-white shadow-xl flex items-center justify-center gap-2 ${selectedProgram.glowBg}`}
                >
                  <Calendar size={16} aria-hidden="true" /> Оставить заявку
                </motion.button>
              </motion.div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
