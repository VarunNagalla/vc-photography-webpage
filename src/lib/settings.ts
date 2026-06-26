import { readJson, writeJson } from "./jsonStore";

export interface SiteSettings {
  // Empty string means "no custom background uploaded yet" — the site
  // falls back to the built-in animated 3D backdrop.
  backgroundImage: string;
}

const FILE = "settings.json";

export const DEFAULT_SETTINGS: SiteSettings = {
  backgroundImage: "",
};

export async function getSettings(): Promise<SiteSettings> {
  return readJson<SiteSettings>(FILE, DEFAULT_SETTINGS);
}

export async function setBackgroundImage(url: string): Promise<SiteSettings> {
  const updated: SiteSettings = { backgroundImage: url };
  await writeJson(FILE, updated);
  return updated;
}
