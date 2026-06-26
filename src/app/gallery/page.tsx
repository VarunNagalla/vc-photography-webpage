import { redirect } from "next/navigation";

// Gallery now lives as a section on the single-page site.
export default function GalleryRedirect() {
  redirect("/#gallery");
}
