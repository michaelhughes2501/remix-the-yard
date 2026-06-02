import { Resource } from "./types";

export const UA_CHECK_INS: Resource[] = [
  {
    id: "rmoms-1",
    title: "RMOMS Denver",
    category: "ua",
    description: "Urine Analysis check-in line for Denver metro area.",
    phone: "303-555-0123"
  },
  {
    id: "ua-general",
    title: "National UA Hotline",
    category: "ua",
    description: "General check-in line for federal parolees.",
    phone: "800-555-9999"
  }
];

export const PAROLE_RESOURCES: Resource[] = [
  {
    id: "parole-ca",
    title: "California Dept of Corrections",
    category: "parole",
    description: "Parole division contact and check-in information.",
    url: "https://www.cdcr.ca.gov/parole/"
  },
  {
    id: "parole-ny",
    title: "New York State Parole",
    category: "parole",
    description: "Resources for parolees in NY state.",
    url: "https://doccs.ny.gov/community-supervision"
  }
];

export const MENTAL_HEALTH_RESOURCES: Resource[] = [
  {
    id: "mh-1",
    title: "Crisis Text Line",
    category: "mental_health",
    description: "Text HOME to 741741 to connect with a Crisis Counselor.",
    phone: "741741"
  },
  {
    id: "mh-2",
    title: "SAMHSA’s National Helpline",
    category: "mental_health",
    description: "Treatment referral and information service.",
    phone: "1-800-662-HELP"
  }
];
