"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { DEFAULT_TECHNICAL_REFERENCES } from "@/config/card-template";
import { COMPANY } from "@/config/company";
import { ERROR_MESSAGE_KEYS } from "@/i18n/errors";
import { useLanguage, type TranslationKey } from "@/i18n/LanguageProvider";
import {
  MIN_MODEL_YEAR,
  maxModelYear,
  normalizeCardInput,
  validateCardInput,
  type CardField,
  type CardInput,
  type FieldErrors,
} from "@/lib/card-validation";
import { todayInRiyadh, type CardErrorCode, type UpdCard } from "@/lib/cards";
import { SERIAL_LENGTH, buildUpdType, type UpdSides } from "@/lib/under-run-number";
import { Spinner } from "@/components/Spinner";
import { UnderRunNumberInput } from "./UnderRunNumberInput";

type TextFields = Exclude<CardField, "upd_type" | "under_run_number_suffix">;

function initialValues(): Record<TextFields, string> {
  const today = todayInRiyadh();
  return {
    manufacturer_name: COMPANY.name_ar,
    manufacturer_code: COMPANY.manufacturer_code,
    country_of_origin: COMPANY.country_of_origin_ar,
    date_of_manufacture: today,
    technical_references: DEFAULT_TECHNICAL_REFERENCES,
    vehicle_model_name: "",
    vehicle_brand: "",
    vehicle_model_year: "",
    vehicle_chassis_number: "",
    card_issue_date: today,
  };
}

const EMPTY_SIDES: UpdSides = { front: false, side: false, rear: false };
const emptySerial = () => Array<string>(SERIAL_LENGTH).fill("");

const inputClass = (invalid?: boolean) =>
  `w-full rounded-md border bg-white px-3 py-2 outline-none focus:border-brand focus:ring-2 focus:ring-brand/30 ${
    invalid ? "border-red-400" : "border-slate-300"
  }`;

export function CardForm() {
  const { t } = useLanguage();
  const router = useRouter();

  const [values, setValues] = useState(initialValues);
  const [sides, setSides] = useState<UpdSides>(EMPTY_SIDES);
  const [serial, setSerial] = useState<string[]>(emptySerial);
  const [serverErrors, setServerErrors] = useState<FieldErrors>({});
  const [showErrors, setShowErrors] = useState(false);
  const [formMessage, setFormMessage] = useState<TranslationKey | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);

  const updType = buildUpdType(sides);
  const input: CardInput = useMemo(
    () => normalizeCardInput({ ...values, upd_type: updType, under_run_number_suffix: serial.join("") }),
    [values, updType, serial],
  );
  const clientErrors = useMemo(() => validateCardInput(input), [input]);
  const errors: FieldErrors = showErrors ? { ...clientErrors, ...serverErrors } : serverErrors;

  const fixedCells = [...`${COMPANY.country_code}${input.manufacturer_code.padEnd(3, " ")}`.slice(0, 6)].map((c) =>
    c.trim(),
  );
  fixedCells.push(updType);
  const fullNumber = fixedCells.join("") + serial.map((c) => c || "·").join("");

  const errorText = (code?: CardErrorCode) =>
    code ? t(ERROR_MESSAGE_KEYS[code], { min: String(MIN_MODEL_YEAR), max: String(maxModelYear()) }) : null;

  const set = (field: TextFields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setValues((v) => ({ ...v, [field]: e.target.value }));
    setServerErrors(({ [field]: _removed, ...rest }) => rest); // eslint-disable-line @typescript-eslint/no-unused-vars
  };

  const reset = () => {
    setValues(initialValues());
    setSides(EMPTY_SIDES);
    setSerial(emptySerial());
    setServerErrors({});
    setShowErrors(false);
    setFormMessage(null);
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setShowErrors(true);
    if (Object.keys(clientErrors).length > 0) {
      setFormMessage("messages.fixErrors");
      focusField(Object.keys(clientErrors)[0] as CardField);
      return;
    }

    setSubmitting(true);
    setSessionExpired(false);
    setFormMessage("messages.generating");
    let res: Response;
    try {
      res = await fetch("/api/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
    } catch {
      // Offline, DNS failure, connection dropped… — nothing was saved.
      setFormMessage("messages.networkError");
      setSubmitting(false);
      return;
    }

    // Error pages from proxies/CDNs may not be JSON.
    const body: { card?: UpdCard; error?: CardErrorCode; field?: CardField; fieldErrors?: FieldErrors } = await res
      .json()
      .catch(() => ({}));

    if (res.ok && body.card) {
      router.push(`/cards/${body.card.id}/preview?created=1`); // spinner stays until the preview renders
      return;
    }
    if (res.status === 401) {
      setSessionExpired(true);
      setFormMessage("auth.sessionExpired");
    } else if (body.field && body.error) {
      setServerErrors(body.fieldErrors ?? { [body.field]: body.error });
      setFormMessage(ERROR_MESSAGE_KEYS[body.error]);
      focusField(body.field);
    } else {
      setFormMessage(body.error ? ERROR_MESSAGE_KEYS[body.error] : "messages.saveFailed");
    }
    setSubmitting(false);
  }

  const isError = formMessage !== null && formMessage !== "messages.generating";

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <Section title={t("form.sectionManufacturer")}>
        <Field id="manufacturer_name" label={t("form.manufacturerName")} error={errorText(errors.manufacturer_name)}>
          <input id="manufacturer_name" dir="auto" value={values.manufacturer_name} onChange={set("manufacturer_name")} className={inputClass(!!errors.manufacturer_name)} />
        </Field>
        <Field id="manufacturer_code" label={t("form.manufacturerCode")} hint={t("form.manufacturerCodeHint")} error={errorText(errors.manufacturer_code)}>
          <input id="manufacturer_code" dir="ltr" maxLength={3} value={values.manufacturer_code} onChange={set("manufacturer_code")} className={`${inputClass(!!errors.manufacturer_code)} text-left uppercase rtl:text-right`} />
        </Field>
        <Field id="country_of_origin" label={t("form.countryOfOrigin")} error={errorText(errors.country_of_origin)}>
          <input id="country_of_origin" dir="auto" value={values.country_of_origin} onChange={set("country_of_origin")} className={inputClass(!!errors.country_of_origin)} />
        </Field>
        <Field id="date_of_manufacture" label={t("form.dateOfManufacture")} error={errorText(errors.date_of_manufacture)}>
          <input id="date_of_manufacture" type="date" required value={values.date_of_manufacture} onChange={set("date_of_manufacture")} className={inputClass(!!errors.date_of_manufacture)} />
        </Field>
        <Field id="technical_references" label={t("form.technicalReferences")} wide error={errorText(errors.technical_references)}>
          <textarea id="technical_references" dir="auto" rows={2} value={values.technical_references} onChange={set("technical_references")} className={inputClass(!!errors.technical_references)} />
        </Field>
      </Section>

      <Section title={t("form.sectionVehicle")}>
        <Field id="vehicle_model_name" label={t("form.vehicleModelName")} error={errorText(errors.vehicle_model_name)}>
          <input id="vehicle_model_name" dir="auto" required value={values.vehicle_model_name} onChange={set("vehicle_model_name")} className={inputClass(!!errors.vehicle_model_name)} />
        </Field>
        <Field id="vehicle_brand" label={t("form.vehicleBrand")} error={errorText(errors.vehicle_brand)}>
          <input id="vehicle_brand" dir="auto" required value={values.vehicle_brand} onChange={set("vehicle_brand")} className={inputClass(!!errors.vehicle_brand)} />
        </Field>
        <Field id="vehicle_model_year" label={t("form.vehicleModelYear")} error={errorText(errors.vehicle_model_year)}>
          <input id="vehicle_model_year" dir="ltr" inputMode="numeric" maxLength={4} required placeholder={t("form.yearPlaceholder")} value={values.vehicle_model_year} onChange={set("vehicle_model_year")} className={`${inputClass(!!errors.vehicle_model_year)} text-left rtl:text-right`} />
        </Field>
        <Field id="vehicle_chassis_number" label={t("form.chassisNumber")} hint={t("form.vinHint")} error={errorText(errors.vehicle_chassis_number)}>
          <input id="vehicle_chassis_number" dir="ltr" maxLength={17} required autoComplete="off" spellCheck={false} value={values.vehicle_chassis_number} onChange={set("vehicle_chassis_number")} className={`${inputClass(!!errors.vehicle_chassis_number)} text-left font-mono uppercase rtl:text-right`} />
        </Field>
        <Field id="upd_type" label={t("form.updType")} hint={t("form.updTypeHint")} wide error={errorText(errors.upd_type)}>
          <div id="upd_type" className="flex flex-wrap items-center gap-2" role="group" tabIndex={-1}>
            {(
              [
                ["front", "form.updFront", "F"],
                ["side", "form.updSide", "S"],
                ["rear", "form.updRear", "R"],
              ] as const
            ).map(([side, labelKey, letter]) => (
              <button
                key={side}
                type="button"
                aria-pressed={sides[side]}
                onClick={() => setSides((s) => ({ ...s, [side]: !s[side] }))}
                className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors ${
                  sides[side] ? "border-brand bg-brand text-white" : "border-slate-300 bg-white text-slate-700 hover:border-brand"
                }`}
              >
                {t(labelKey)} <span className="font-mono opacity-70">({letter})</span>
              </button>
            ))}
            <span className="ms-2 text-sm text-slate-500">
              {t("form.updTypeCode")}:{" "}
              <b dir="ltr" className="font-mono text-slate-800">
                {updType || "—"}
              </b>
            </span>
          </div>
        </Field>
      </Section>

      <Section title={t("form.sectionNumber")}>
        <Field id="under_run_number_suffix" label={t("form.serial")} hint={t("form.numberHint")} wide error={errorText(errors.under_run_number_suffix)}>
          <div id="under_run_number_suffix" tabIndex={-1}>
            <UnderRunNumberInput
              fixedCells={fixedCells}
              serial={serial}
              onSerialChange={(next) => {
                setSerial(next);
                setServerErrors(({ under_run_number_suffix: _removed, ...rest }) => rest); // eslint-disable-line @typescript-eslint/no-unused-vars
              }}
              invalid={!!errors.under_run_number_suffix}
              describedBy="under_run_number_suffix-hint"
            />
            <p className="mt-3 text-sm text-slate-600">
              {t("form.fullNumberPreview")}:{" "}
              <b dir="ltr" className="inline-block font-mono tracking-wider text-slate-900">
                {fullNumber}
              </b>
            </p>
          </div>
        </Field>
        <Field id="card_issue_date" label={t("form.cardIssueDate")} error={errorText(errors.card_issue_date)}>
          <input id="card_issue_date" type="date" required value={values.card_issue_date} onChange={set("card_issue_date")} className={inputClass(!!errors.card_issue_date)} />
        </Field>
      </Section>

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={submitting} className="flex items-center gap-2 rounded-md bg-brand px-6 py-2.5 font-semibold text-white shadow-sm hover:bg-brand/90 disabled:opacity-70">
          {submitting && <Spinner />}
          {submitting ? t("messages.generating") : t("actions.generate")}
        </button>
        <button type="button" onClick={reset} disabled={submitting} className="rounded-md border border-slate-300 bg-white px-4 py-2.5 text-slate-700 hover:border-brand">
          {t("actions.reset")}
        </button>
        {formMessage && (
          <p role={isError ? "alert" : "status"} className={`text-sm ${isError ? "text-red-600" : "text-slate-600"}`}>
            {t(formMessage)}
            {sessionExpired && (
              <>
                {" "}
                {/* Opens in a new tab so the filled-in form isn't lost. */}
                <Link href="/login" target="_blank" className="font-semibold underline">
                  {t("auth.loginAgain")}
                </Link>
              </>
            )}
          </p>
        )}
      </div>
    </form>
  );
}

function focusField(field: CardField) {
  const el = document.getElementById(field);
  el?.scrollIntoView({ behavior: "smooth", block: "center" });
  (el?.querySelector("input") ?? el)?.focus({ preventScroll: true });
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <legend className="px-2 text-lg font-bold text-brand">{title}</legend>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

function Field({
  id,
  label,
  hint,
  error,
  wide,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string | null;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <label htmlFor={id} className="mb-1 block text-sm font-semibold text-slate-700">
        {label}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1 text-xs text-slate-500">
          {hint}
        </p>
      )}
      {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}
