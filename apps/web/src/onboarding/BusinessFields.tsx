import {
  BEAUTY_SUBTYPES,
  BUSINESS_COUNTRIES,
} from "../../../api/src/onboarding/onboarding.contract";
import type { BusinessProfile } from "./onboarding-api";
export const COUNTRIES = BUSINESS_COUNTRIES;
export function BusinessFields({
  value,
  onChange,
  required = true,
}: {
  value: BusinessProfile;
  onChange: (key: keyof BusinessProfile, value: string) => void;
  required?: boolean;
}) {
  return (
    <div className="onboard-fields">
      <label className="onboard-wide">
        Nombre comercial
        <input
          name="commercialName"
          autoComplete="organization"
          required
          maxLength={120}
          value={value.commercialName}
          onChange={(e) => onChange("commercialName", e.target.value)}
        />
      </label>
      <label>
        Tipo de negocio <span>Opcional</span>
        <select
          value={value.beautySubtype ?? ""}
          onChange={(e) => onChange("beautySubtype", e.target.value)}
        >
          <option value="">Elige si te representa</option>
          {Object.entries(BEAUTY_SUBTYPES).map(([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>
      </label>
      <label>
        País
        <select
          required={required}
          autoComplete="country"
          value={value.countryCode ?? ""}
          onChange={(e) => onChange("countryCode", e.target.value)}
        >
          <option value="">Selecciona tu país</option>
          {COUNTRIES.map(([id, label]) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Ciudad
        <input
          required={required}
          autoComplete="address-level2"
          maxLength={100}
          value={value.city ?? ""}
          onChange={(e) => onChange("city", e.target.value)}
        />
      </label>
      <label>
        Zona horaria
        <input
          required
          maxLength={64}
          list="onboard-time-zones"
          value={value.timeZone}
          onChange={(e) => onChange("timeZone", e.target.value)}
        />
        <datalist id="onboard-time-zones">
          {[
            "America/Guayaquil",
            "Pacific/Galapagos",
            "America/Bogota",
            "America/Lima",
            "America/Santiago",
            "America/Mexico_City",
            "Europe/Madrid",
          ].map((zone) => (
            <option key={zone} value={zone} />
          ))}
        </datalist>
      </label>
      <label className="onboard-wide">
        Dirección <span>Opcional si no tienes un local físico</span>
        <input
          autoComplete="street-address"
          maxLength={250}
          value={value.address ?? ""}
          onChange={(e) => onChange("address", e.target.value)}
        />
      </label>
      <label>
        Teléfono comercial
        <input
          type="tel"
          autoComplete="tel"
          required={required}
          maxLength={32}
          value={value.businessPhone ?? ""}
          onChange={(e) => onChange("businessPhone", e.target.value)}
        />
      </label>
      <label>
        Correo comercial
        <input
          type="email"
          autoComplete="email"
          required={required}
          maxLength={320}
          value={value.businessEmail ?? ""}
          onChange={(e) => onChange("businessEmail", e.target.value)}
        />
      </label>
      <label className="onboard-wide">
        Sobre tu negocio <span>Opcional · hasta 1000 caracteres</span>
        <textarea
          rows={3}
          maxLength={1000}
          value={value.description ?? ""}
          onChange={(e) => onChange("description", e.target.value)}
        />
      </label>
    </div>
  );
}
