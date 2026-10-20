import { AFFILIATION_LABELS, hasFilterProfile } from "@/lib/community/policy";

const dateLabel = (value: unknown) => {
  if (!value) return "Не указано";
  const date = new Date(String(value));
  return Number.isFinite(date.getTime()) ? date.toLocaleDateString("ru-RU", { timeZone: "Asia/Jerusalem" }) : "Не указано";
};
const valueLabel = (value: unknown) => value === null || value === undefined ? "Не указано" : value === "" ? "Пустое значение" : String(value);

/** All values are the authorized CRM query's persisted PostgreSQL fields. */
export default function CommunityProfileDetails({ user }: { user: any }) {
  const fields = [
    ["Связь с еврейством", AFFILIATION_LABELS[user.affiliation as keyof typeof AFFILIATION_LABELS] || "Не указано"],
    ["Актуальный фильтр", hasFilterProfile(user) ? "Пройден" : "Новый фильтр не пройден"],
    ["Уточнение гиюра", user.affiliation !== "giyur" ? "Не применяется" : user.giyurStage === "completed" ? "Гиюр завершён" : user.giyurStage === "advanced" ? "Продвинутый этап" : "Этап не уточнён"],
    ["Пол", user.gender === "female" ? "Женский" : user.gender === "male" ? "Мужской" : "Не указано"],
    ["Имя", valueLabel(user.firstName)], ["Фамилия", valueLabel(user.lastName)],
    ["Email аккаунта Clerk", valueLabel(user.email)], ["Телефон", valueLabel(user.phone)],
    ["Дата рождения", dateLabel(user.dateOfBirth)], ["Город", valueLabel(user.city)],
    ["Семейное положение", ({ single: "Холост / Не замужем", married: "В браке", divorced: "В разводе", widowed: "Вдовец / Вдова" } as Record<string, string>)[user.maritalStatus] || "Не указано"],
    ["Имя супруга/и", valueLabel(user.spouseName)],
    ["Ответ «Есть дети»", user.hasChildren === null ? "Не указано" : user.hasChildren ? "Да" : "Нет"],
    ["Согласие с политикой", user.agreedToPrivacy ? "Да" : "Нет"],
    ["Источник (сохранённый)", valueLabel(user.source)],
    ["Дата прохождения", dateLabel(user.filterCompletedAt)],
  ];
  return <section className="px-6 py-5 border-b border-neutral-200 dark:border-neutral-800 shrink-0 max-h-[45vh] overflow-y-auto" aria-label="Сохранённая анкета">
    <h3 className="font-bold mb-4">Сохранённая анкета</h3>
    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">{fields.map(([label, value]) => <div key={label} className="min-w-0"><dt className="text-neutral-500">{label}</dt><dd className="font-medium break-words">{value}</dd></div>)}</dl>
    <h4 className="font-bold mt-5">Сохранённые дети</h4>
    {Array.isArray(user.childrenData) && user.childrenData.length ? <ul className="mt-2 space-y-2 text-sm">{user.childrenData.map((child: any, i: number) => <li key={child.id || i} className="break-words">{valueLabel(child.name)} · {dateLabel(child.dateOfBirth || child.birthDate)}</li>)}</ul> : <p className="text-sm mt-2">Пустой список</p>}
  </section>;
}
