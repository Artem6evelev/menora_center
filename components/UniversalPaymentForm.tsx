"use client";

import { useState, useEffect } from "react";
import { Loader2, X, Coins, Check } from "lucide-react";
import { useUser } from "@clerk/nextjs"; // Используем Clerk для получения данных, если юзер залогинен

export default function UniversalPaymentForm() {
  const { user } = useUser();
  const [amount, setAmount] = useState<string>("");
  const [purpose, setPurpose] = useState<string>("general_donation");
  const [customPurpose, setCustomPurpose] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);

  // Блокируем скролл фона, когда открыт iframe
  useEffect(() => {
    if (iframeUrl) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [iframeUrl]);

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const finalPurpose = purpose === "other" ? customPurpose : purpose;
    const paymentAmount = Number(amount);

    if (paymentAmount <= 0) {
      alert("Сумма должна быть больше нуля");
      setIsLoading(false);
      return;
    }

    // Базовый URL из твоего примера
    const baseUrl = "https://shutaf.im/donate/menorah_rishon";

    // Формируем параметры
    const params = new URLSearchParams({
      price: paymentAmount.toString(),
      quantity: "1",
      cur: "ILS",
      payments: "1", // Единоразовый платеж
      lang: "ru",
      // Если Шутафим поддерживает предзаполнение (проверь документацию), можно добавить:
      // description: finalPurpose,
      // info: finalPurpose,
      // name: user?.fullName || "",
      // email: user?.primaryEmailAddress?.emailAddress || "",
    });

    const finalUrl = `${baseUrl}?${params.toString()}`;

    // Имитируем небольшую задержку для UX
    setTimeout(() => {
      setIframeUrl(finalUrl);
      setIsLoading(false);
    }, 500);
  };

  return (
    <div className="max-w-md mx-auto w-full">
      <div className="bg-white dark:bg-neutral-900 rounded-[32px] p-6 md:p-8 shadow-xl border border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-2xl text-[#FFB800]">
            <Coins size={28} />
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-neutral-900 dark:text-white">
            Оплата
          </h2>
        </div>

        <form onSubmit={handlePayment} className="space-y-5">
          {/* Назначение платежа */}
          <div>
            <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">
              Назначение платежа
            </label>
            <select
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="w-full border-2 border-neutral-200 dark:border-neutral-700 p-3.5 rounded-xl outline-none focus:border-[#FFB800] bg-white dark:bg-neutral-800 text-sm font-medium transition-colors cursor-pointer"
            >
              <option value="general_donation">
                Свободное пожертвование / Цдака
              </option>
              <option value="shabbat_meal">Шаббатняя трапеза</option>
              <option value="education_course">Образовательный курс</option>
              <option value="other">Другое (указать вручную)</option>
            </select>
          </div>

          {/* Если выбрали "Другое" - показываем инпут */}
          {purpose === "other" && (
            <div className="animate-in fade-in slide-in-from-top-2">
              <input
                type="text"
                required
                value={customPurpose}
                onChange={(e) => setCustomPurpose(e.target.value)}
                placeholder="За что вы переводите средства?"
                className="w-full border-2 border-neutral-200 dark:border-neutral-700 p-3.5 rounded-xl outline-none focus:border-[#FFB800] bg-white dark:bg-neutral-800 text-sm"
              />
            </div>
          )}

          {/* Сумма */}
          <div>
            <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">
              Сумма к оплате (₪)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-black text-neutral-400">
                ₪
              </span>
              <input
                type="number"
                min="1"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="w-full border-2 border-neutral-200 dark:border-neutral-700 p-4 pl-10 rounded-xl outline-none focus:border-[#FFB800] bg-white dark:bg-neutral-800 text-2xl font-black transition-colors"
              />
            </div>
          </div>

          {/* Быстрые суммы */}
          <div className="flex gap-2">
            {[50, 100, 200].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setAmount(preset.toString())}
                className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${
                  amount === preset.toString()
                    ? "bg-[#FFB800] text-black shadow-md border-transparent"
                    : "bg-white dark:bg-neutral-800 border-2 border-neutral-200 dark:border-neutral-700 text-neutral-500 hover:border-neutral-300 dark:hover:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                }`}
              >
                {preset}
              </button>
            ))}
          </div>

          {/* Кнопка оплаты */}
          <button
            type="submit"
            disabled={!amount || isLoading}
            className="w-full py-4 bg-gradient-to-r from-[#FFB800] to-orange-500 text-white rounded-2xl font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-[#FFB800]/20 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-70 disabled:grayscale mt-4"
          >
            {isLoading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              `Перейти к оплате ${amount ? amount + " ₪" : ""}`
            )}
          </button>
        </form>
      </div>

      {/* МОДАЛКА С IFRAME */}
      {iframeUrl && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="relative w-full max-w-2xl h-[90vh] bg-white dark:bg-neutral-900 rounded-[32px] overflow-hidden shadow-2xl flex flex-col">
            <div className="p-4 md:p-5 bg-neutral-50 dark:bg-neutral-950 flex justify-between items-center border-b border-neutral-200 dark:border-neutral-800">
              <div>
                <h3 className="font-black text-lg text-neutral-900 dark:text-white leading-none mb-1">
                  Безопасная оплата
                </h3>
                <p className="text-xs font-bold text-[#FFB800] uppercase tracking-widest">
                  Secured by Shutafim
                </p>
              </div>
              <button
                onClick={() => setIframeUrl(null)}
                className="p-2.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-700 transition active:scale-90"
              >
                <X
                  size={20}
                  className="text-neutral-600 dark:text-neutral-300"
                />
              </button>
            </div>

            {/* Контейнер для iframe */}
            <div className="flex-1 w-full bg-white relative">
              {/* Loader пока грузится iframe */}
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white z-0">
                <Loader2
                  className="animate-spin text-[#FFB800] mb-4"
                  size={40}
                />
                <p className="text-neutral-500 font-medium">
                  Загрузка платежного шлюза...
                </p>
              </div>

              <iframe
                src={iframeUrl}
                className="w-full h-full relative z-10 border-none bg-white"
                allow="payment"
                title="Оплата Shutafim"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
