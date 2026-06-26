import { readJson, updateJson } from "./jsonStore";

export interface Photo {
  id: string;
  filename: string;
  url: string;
  caption: string;
  order: number;
  createdAt: string;
}

const FILE = "photos.json";

export async function getPhotos(): Promise<Photo[]> {
  const photos = await readJson<Photo[]>(FILE, []);
  return [...photos].sort((a, b) => a.order - b.order);
}

export async function addPhoto(photo: Omit<Photo, "order">): Promise<Photo> {
  let created: Photo | undefined;
  await updateJson<Photo[]>(FILE, [], (current) => {
    const maxOrder = current.reduce((max, p) => Math.max(max, p.order), -1);
    created = { ...photo, order: maxOrder + 1 };
    return [...current, created];
  });
  return created as Photo;
}

export async function updatePhoto(
  id: string,
  updates: Partial<Pick<Photo, "caption" | "order">>
): Promise<Photo | null> {
  let updated: Photo | null = null;
  await updateJson<Photo[]>(FILE, [], (current) =>
    current.map((p) => {
      if (p.id === id) {
        updated = { ...p, ...updates };
        return updated;
      }
      return p;
    })
  );
  return updated;
}

export async function deletePhoto(id: string): Promise<Photo | null> {
  let removed: Photo | null = null;
  await updateJson<Photo[]>(FILE, [], (current) => {
    removed = current.find((p) => p.id === id) ?? null;
    return current.filter((p) => p.id !== id);
  });
  return removed;
}

export async function reorderPhotos(orderedIds: string[]): Promise<Photo[]> {
  let result: Photo[] = [];
  await updateJson<Photo[]>(FILE, [], (current) => {
    const byId = new Map(current.map((p) => [p.id, p]));
    result = orderedIds
      .map((id, index) => {
        const photo = byId.get(id);
        if (!photo) return null;
        return { ...photo, order: index };
      })
      .filter((p): p is Photo => p !== null);
    // include any photos not present in orderedIds at the end, preserving them
    const remaining = current.filter((p) => !orderedIds.includes(p.id));
    return [...result, ...remaining];
  });
  return result;
}
