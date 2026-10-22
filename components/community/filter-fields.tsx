"use client";
import { AFFILIATIONS, AFFILIATION_LABELS, type Affiliation, type Gender } from "@/lib/community/policy";

export const filterFieldCopy = { title: "Пожалуйста, укажите Вашу связь с еврейством:",
  categories: AFFILIATION_LABELS, gender: "Пол", male: "Мужской", female: "Женский" };
export type FilterFieldCopy = typeof filterFieldCopy;

/** Presentation only. Both adapters use the same categories and server policy. */
export default function FilterFields({ affiliation, gender, onAffiliation, onGender, disabled = false, copy = filterFieldCopy }: {
  affiliation: Affiliation | ""; gender: Gender | ""; onAffiliation: (value: Affiliation) => void;
  onGender: (value: Gender) => void; disabled?: boolean; copy?: FilterFieldCopy;
}) {
  return <>
    <fieldset disabled={disabled} className="space-y-4">
      <legend className="font-bold text-lg mb-4">{copy.title}</legend>
      {AFFILIATIONS.map(value => <label key={value} className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer ${affiliation === value ? "border-[#FFB800] bg-amber-50 dark:bg-amber-950/20" : "border-neutral-200 dark:border-neutral-700"}`}>
        <input type="radio" required name="affiliation" value={value} checked={affiliation === value} onChange={() => onAffiliation(value)} className="mt-1 accent-[#FFB800]" />
        <span>{copy.categories[value]}</span>
      </label>)}
    </fieldset>
    {(affiliation === "maternal" || affiliation === "giyur") && <fieldset disabled={disabled}>
      <legend className="font-bold mb-3">{copy.gender}</legend><div className="flex flex-wrap gap-5">
        {(["male", "female"] as const).map(value => <label key={value} className="flex items-center gap-2 min-h-11">
          <input type="radio" required name="gender" value={value} checked={gender === value} onChange={() => onGender(value)} className="accent-[#FFB800]" />{copy[value]}</label>)}
      </div>
    </fieldset>}
  </>;
}
