"use client";
import { useEffect, useRef, useState } from "react";
import ProfileFields, { type CommunityFields } from "@/components/community/profile-fields";
import ChildEditor, { type ChildValue } from "@/components/community/child-editor";
import type { MiniAppCopy } from "@/lib/telegram/miniapp-i18n";
import type { MiniAppProfileData } from "@/lib/telegram/miniapp-profile";
import { MiniAppRequestError } from "@/lib/telegram/miniapp-client";

export function requestMessage(error: unknown, copy: MiniAppCopy) {
  const code = error instanceof MiniAppRequestError ? error.code : "generic";
  return copy.errors[code as keyof typeof copy.errors] ?? copy.errors.generic;
}

export default function MiniAppProfileForm({ data, copy, onSave, onDirty }: {
  data: MiniAppProfileData; copy: MiniAppCopy; onSave: (input: unknown) => Promise<void>; onDirty: (value: boolean) => void;
}) {
  const initial = data.profile;
  const [fields, setFields] = useState<CommunityFields>({ ...initial, maritalStatus: initial.maritalStatus as CommunityFields['maritalStatus'] });
  const [cityId, setCityId] = useState(initial.cityId);
  const [children, setChildren] = useState<ChildValue[]>(initial.childrenData);
  const [childrenChanged, setChildrenChanged] = useState(false), [childEditing, setChildEditing] = useState(false);
  const [agreed, setAgreed] = useState(initial.agreedToPrivacy), [pending, setPending] = useState(false), [error, setError] = useState("");
  const baseline = useRef(JSON.stringify({ fields, cityId, children, agreed }));
  const dirty = baseline.current !== JSON.stringify({ fields, cityId, children, agreed }) || childEditing;
  useEffect(() => { onDirty(dirty); return () => onDirty(false); }, [dirty, onDirty]);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError("");
    if (childEditing) { setError(copy.errors.childUnsaved); return; }
    if (!cityId && (initial.cityId || !initial.city || fields.city !== initial.city)) { setError(copy.errors.cityRequired); return; }
    setPending(true);
    try {
      await onSave({ firstName: fields.firstName, lastName: fields.lastName, phone: fields.phone,
        dateOfBirth: fields.dateOfBirth, city: fields.city, cityId, maritalStatus: fields.maritalStatus,
        spouseName: fields.maritalStatus === "married" ? fields.spouseName : null, hasChildren: fields.hasChildren,
        agreedToPrivacy: agreed,
        ...(data.permissions.canEditChildren && (fields.hasChildren || (childrenChanged && !children.length)) ? { childrenData: children } : {}) });
    } catch (failure) { setError(requestMessage(failure, copy)); }
    finally { setPending(false); }
  }
  return <form onSubmit={submit} className="space-y-6" data-miniapp-form="profile">
    <fieldset disabled={pending} className="space-y-6 min-w-0">
      <ProfileFields fields={fields} onChange={setFields} cityId={cityId} copy={copy.fields} cityCopy={copy.city}
        onCityChange={(city, id) => { setFields(previous => ({ ...previous, city })); setCityId(id); }} />
      {data.permissions.canEditChildren && fields.hasChildren ? <>
        <ChildEditor items={children} copy={copy.children} disabled={pending} onEditingChange={setChildEditing}
          onSave={async next => { setChildren(next); setChildrenChanged(true); if (!next.length) setFields(previous => ({ ...previous, hasChildren: false })); }} />
        <p className="miniapp-muted text-sm">{copy.childHint}</p>
      </> : fields.hasChildren ? <p className="miniapp-note">{copy.childRestricted}</p> : null}
      <label className="flex gap-3 items-start min-h-11"><input type="checkbox" required checked={agreed} onChange={event => setAgreed(event.target.checked)} className="mt-1 accent-[#FFB800]" />
        <span>{copy.privacy} <a href="/privacy" target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">{copy.privacyLink}<span className="sr-only">{copy.external}</span></a>.</span>
      </label>
      {error && <p role="alert" className="miniapp-error">{error}</p>}
      <button type="submit" className="miniapp-primary w-full" disabled={pending}>
        {pending ? copy.saving : data.summary.nextStep === "home" ? copy.saveEdit : copy.save}</button>
    </fieldset>
  </form>;
}
