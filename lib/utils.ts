import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getImageUrl(url?: string | null): string {
  if (!url) return "";
  if (url.startsWith("data:") || url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  const cleanPath = url.startsWith("/") ? url.slice(1) : url;

  if (typeof window !== "undefined") {
    const pathname = window.location.pathname;
    
    // Check for known routes
    const routes = ["/cms", "/portfolio", "/enroll", "/schedule", "/pay"];
    for (const route of routes) {
      const idx = pathname.indexOf(route);
      if (idx !== -1) {
        const basePath = pathname.substring(0, idx);
        return `${basePath}/${cleanPath}`;
      }
    }
    
    // If no known route matches, check if the first segment is not a known root route
    const pathSegments = pathname.split("/").filter(Boolean);
    if (pathSegments.length > 0) {
      const firstSegment = pathSegments[0];
      const knownRootRoutes = ["cms", "portfolio", "enroll", "schedule", "pay", "about", "contact", "courses", "classes", "teachers"];
      if (!knownRootRoutes.includes(firstSegment)) {
        return `/${firstSegment}/${cleanPath}`;
      }
    }
  }

  return `/${cleanPath}`;
}
