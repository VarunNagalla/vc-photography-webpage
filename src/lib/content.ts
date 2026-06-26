import { readJson, writeJson } from "./jsonStore";

export interface SiteContent {
  hero: {
    title: string;
    subtitle: string;
  };
  about: {
    heading: string;
    body: string;
  };
  contact: {
    email: string;
    phone: string;
    instagram: string;
    location: string;
  };
}

const FILE = "content.json";

export const DEFAULT_CONTENT: SiteContent = {
  hero: {
    title: "Varun Nagalla",
    subtitle: "Photography that holds still time in motion.",
  },
  about: {
    heading: "About the Work",
    body:
      "I'm a photographer focused on capturing honest, atmospheric moments — light, landscape, and life as it happens. Every frame here is part of an ongoing visual journal.",
  },
  contact: {
    email: "varunchowdary3345@gmail.com",
    phone: "",
    instagram: "",
    location: "",
  },
};

export async function getContent(): Promise<SiteContent> {
  return readJson<SiteContent>(FILE, DEFAULT_CONTENT);
}

export async function updateContent(content: SiteContent): Promise<SiteContent> {
  await writeJson(FILE, content);
  return content;
}
