import { DEFAULT_COUNTRY_CODE } from "@/shared/config/constants";

const E164_PATTERN = /^\+[1-9][0-9]{7,14}$/;
const NATIONAL_NUMBER_LENGTH = 10;

/** Devuelve el teléfono en formato E.164 o null si no es válido. Asume Colombia sin prefijo. */
export function normalizePhone(input: string): string | null {
  const cleaned = input.replace(/[\s().-]/g, "");
  const candidate = resolveInternational(cleaned);
  return candidate && E164_PATTERN.test(candidate) ? candidate : null;
}

function resolveInternational(cleaned: string): string | null {
  if (cleaned.startsWith("+")) return cleaned;
  if (cleaned.startsWith("00")) return `+${cleaned.slice(2)}`;
  const countryDigits = DEFAULT_COUNTRY_CODE.slice(1);
  if (cleaned.startsWith(countryDigits) && cleaned.length === countryDigits.length + NATIONAL_NUMBER_LENGTH) {
    return `+${cleaned}`;
  }
  if (/^\d+$/.test(cleaned) && cleaned.length === NATIONAL_NUMBER_LENGTH) {
    return `${DEFAULT_COUNTRY_CODE}${cleaned}`;
  }
  return null;
}
