import { redirect } from "next/navigation";

// Contact now lives as a section on the single-page site.
export default function ContactRedirect() {
  redirect("/#contact");
}
