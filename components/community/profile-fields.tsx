"use client";
import CityPicker, { type CityPickerCopy } from "./city-picker";

export type CommunityFields = { firstName: string; lastName: string; phone: string; dateOfBirth: string; city: string;
  maritalStatus: "" | "single" | "married" | "divorced" | "widowed"; spouseName: string; hasChildren: boolean };
export const profileFieldCopy = { firstName: "Имя", lastName: "Фамилия", phone: "Номер телефона", dateOfBirth: "Дата рождения",
  city: "Город проживания", marital: "Семейное положение", choose: "Выберите…", single: "Холост / Не замужем",
  married: "В браке", divorced: "В разводе", widowed: "Вдовец / Вдова", spouse: "Имя супруга/и", hasChildren: "Есть дети" };
export type ProfileFieldCopy = typeof profileFieldCopy;
const inputClass = "w-full rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 px-4 py-3 outline-none focus:ring-2 focus:ring-[#FFB800] min-w-0";

export default function ProfileFields({ fields, onChange, cityId, onCityChange, copy = profileFieldCopy, cityCopy }: {
  fields: CommunityFields; onChange: (value: CommunityFields) => void; cityId: string | null;
  onCityChange: (city: string, id: string | null) => void; copy?: ProfileFieldCopy; cityCopy?: CityPickerCopy;
}) {
  return <>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
      {([['firstName', 'text', 'given-name'], ['lastName', 'text', 'family-name'], ['phone', 'tel', 'tel'], ['dateOfBirth', 'date', 'bday']] as const).map(([name, type, autoComplete]) => <div key={name}>
        <label htmlFor={`profile-${name}`} className="block font-bold text-sm mb-2">{copy[name]} *</label>
        <input id={`profile-${name}`} name={name} type={type} autoComplete={autoComplete} required value={fields[name]}
          onChange={event => onChange({ ...fields, [name]: event.target.value })} className={inputClass} />
      </div>)}
      <div><label htmlFor="profile-city" className="block font-bold text-sm mb-2">{copy.city} *</label>
        <CityPicker value={fields.city} cityId={cityId} onChange={onCityChange} copy={cityCopy} /></div>
      <div><label htmlFor="profile-marital" className="block font-bold text-sm mb-2">{copy.marital} *</label>
        <select id="profile-marital" required value={fields.maritalStatus} onChange={event => onChange({ ...fields, maritalStatus: event.target.value as CommunityFields['maritalStatus'] })} className={inputClass}>
          <option value="" disabled>{copy.choose}</option>{(['single', 'married', 'divorced', 'widowed'] as const).map(value => <option key={value} value={value}>{copy[value]}</option>)}
        </select></div>
    </div>
    {fields.maritalStatus === "married" && <div><label htmlFor="profile-spouse" className="block font-bold text-sm mb-2">{copy.spouse} *</label>
      <input id="profile-spouse" required value={fields.spouseName} onChange={event => onChange({ ...fields, spouseName: event.target.value })} className={inputClass} /></div>}
    <label className="flex gap-3 items-center min-h-11"><input type="checkbox" checked={fields.hasChildren} onChange={event => onChange({ ...fields, hasChildren: event.target.checked })} className="accent-[#FFB800]" />{copy.hasChildren}</label>
  </>;
}
