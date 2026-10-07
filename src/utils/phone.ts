/** Default country calling code for numbers typed in local format (Indonesia). */
export const DEFAULT_COUNTRY_CODE = '62';

/**
 * Normalises a guardian phone number to the digits-only international form `wa.me` expects.
 *   "0812-3456-7890"   -> "6281234567890"   (local format, leading 0)
 *   "+62 812 3456 7890" -> "6281234567890"
 *   "812 3456 7890"    -> "6281234567890"   (leading 0 dropped by the user)
 *   "00 62 812…"       -> "62812…"          (international 00 prefix)
 * Returns '' when no digits remain.
 */
export function toWhatsAppNumber(raw: string | undefined | null, countryCode: string = DEFAULT_COUNTRY_CODE): string {
  let digits = (raw || '').replace(/[^0-9]/g, '');
  if (!digits) return '';
  if (digits.startsWith('00')) digits = digits.slice(2);
  else if (digits.startsWith('0')) digits = countryCode + digits.slice(1);
  else if (!digits.startsWith(countryCode) && digits.length <= 11) digits = countryCode + digits;
  return digits;
}
