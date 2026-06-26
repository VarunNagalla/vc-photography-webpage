import { readJson, writeJson } from "./jsonStore";

export interface SiteSettings {
    // Empty string means "no custom background uploaded yet" — the site
  // falls back to the built-in animated 3D backdrop.
  backgroundImage: string;
    // Empty string means "no photo uploaded yet" — the About page renders
  // text-only.
  aboutImage: string;
}

const FILE = "settings.json";

export const DEFAULT_SETTINGS: SiteSettings = {
    backgroundImage: "",
    aboutImage: "",
};

export async function getSettings(): Promise<SiteSettings> {
    return readJson<SiteSettings>(FILE, DEFAULT_SETTINGS);
}

export async function setBackgroundImage(url: string): Promise<SiteSettings> {
    const current = await getSettings();
    const updated: SiteSettings = { ...current, backgroundImage: url };
    await writeJson(FILE, updated);
    return updated;
}

export async function setAboutImage(url: string): Promise<SiteSettings> {
    const current = await getSettings();
    const updated: SiteSettings = { ...current, aboutImage: url };
    await writeJson(FILE, updated);
    return updated;
}
