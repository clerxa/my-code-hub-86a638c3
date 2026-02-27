import { useLocation } from "react-router-dom";

/**
 * Maps sidebar item IDs to the route(s) they navigate to.
 * Items not listed here stay on the current page (section-based navigation).
 */
const EMPLOYEE_ROUTE_MAP: Record<string, string[]> = {
  "dashboard": ["/employee"],
  "profile": ["/employee/profile"],
  "profile-info": ["/employee/profile"],
  "financial-profile": ["/employee/profile"],
  "parcours": ["/parcours"],
  "simulations": ["/employee/simulations"],
  "horizon": ["/employee/horizon"],
  "feedback": ["/employee/feedback"],
  "forum": ["/forum"],
  // "company" is dynamic (/company/:id), handled separately
};

const COMPANY_ROUTE_MAP: Record<string, string[]> = {
  "company-dashboard": ["/dashboard"], // ends with /dashboard
  "contacts": ["/contacts"], // ends with /contacts
};

/**
 * Determines if a sidebar item should be highlighted.
 * 
 * Rules (in priority order):
 * 1. If the item maps to a known route → match against current URL pathname
 * 2. If item is "company" → match /company/:id (exact, not sub-routes)
 * 3. Otherwise → fall back to activeSection === itemId (section-based items on same page)
 */
export function useSidebarActiveItem(
  activeSection: string,
  sidebarType: "employee" | "company",
  companyId?: string | null
) {
  const location = useLocation();
  const pathname = location.pathname;

  const isItemActive = (itemId: string): boolean => {
    if (sidebarType === "employee") {
      // Special case: company item with dynamic route
      if (itemId === "company" && companyId) {
        return pathname === `/company/${companyId}`;
      }

      const routes = EMPLOYEE_ROUTE_MAP[itemId];
      if (routes) {
        // "dashboard" should only match /employee exactly
        if (itemId === "dashboard") {
          return pathname === "/employee";
        }
        return routes.some(route => pathname.startsWith(route));
      }

      // Section-based items (offers, contacts, appointments, webinars, etc.)
      // Only active if we're on /employee AND the section matches
      if (pathname === "/employee") {
        return activeSection === itemId;
      }

      return false;
    }

    if (sidebarType === "company") {
      // company-dashboard and contacts use dynamic routes
      if (itemId === "company-dashboard" && companyId) {
        return pathname === `/company/${companyId}/dashboard`;
      }
      if (itemId === "contacts" && companyId) {
        return pathname === `/company/${companyId}/contacts`;
      }

      // Section-based items on the company page
      return activeSection === itemId;
    }

    return activeSection === itemId;
  };

  return { isItemActive };
}
