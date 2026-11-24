import { prisma } from "../lib/prisma";
import { cleanText } from "../utils/sanitize";
import { SETTING_KEYS } from "../validators";

export type SettingsMap = Record<(typeof SETTING_KEYS)[number], string>;

// Every key is always present in the response (empty string when not configured),
// so the storefront can simply hide sections whose value is empty.
export async function getSettings(): Promise<SettingsMap> {
  const rows = await prisma.siteSetting.findMany();
  const map = Object.fromEntries(SETTING_KEYS.map((k) => [k, ""])) as SettingsMap;
  for (const row of rows) {
    if ((SETTING_KEYS as readonly string[]).includes(row.key)) {
      map[row.key as keyof SettingsMap] = row.value;
    }
  }
  return map;
}

export async function updateSettings(values: Partial<SettingsMap>) {
  await prisma.$transaction(
    Object.entries(values).map(([key, value]) =>
      prisma.siteSetting.upsert({
        where: { key },
        update: { value: cleanText(value ?? "") },
        create: { key, value: cleanText(value ?? "") },
      }),
    ),
  );
  return getSettings();
}
