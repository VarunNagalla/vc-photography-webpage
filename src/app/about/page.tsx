import { redirect } from "next/navigation";

// About now lives as a section on the single-page site.
export default function AboutRedirect() {
  redirect("/#about");
}
