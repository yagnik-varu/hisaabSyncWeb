import { redirect } from "next/navigation";

import { DEFAULT_AUTHENTICATED_PATH } from "@/lib/auth/constants";

/** "/" has no content of its own; src/proxy.ts sends signed-out visitors to /login first. */
export default function HomePage() {
  redirect(DEFAULT_AUTHENTICATED_PATH);
}
