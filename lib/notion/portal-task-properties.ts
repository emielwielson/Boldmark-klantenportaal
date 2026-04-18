import {
  getCachedPropertyType,
  isCachedPropertyEditable,
  matchPropertyKey,
} from "@/lib/notion/cached-property-display";

/**
 * Visible task columns in the portal: order and editability.
 * Titles are matched against Notion property keys with the same trim rules as Klant V2.
 */
export type PortalTaskPropertyRow = {
  title: string;
  editable: boolean;
};

export const PORTAL_TASK_PROPERTIES: PortalTaskPropertyRow[] = [
  { title: "Opmerking", editable: true },
  { title: "Status", editable: true },
  { title: "Categorie", editable: false },
  { title: "Kanaal", editable: false },
  { title: "Productiedatum", editable: false },
  { title: "Klant V2", editable: false },
  { title: "Publicatiedatum", editable: false },
  { title: "Toegewezen aan", editable: false },
];

/** Property keys present on the page, in portal order (unknown columns omitted). */
export function getPortalOrderedPropertyKeys(
  properties: Record<string, unknown>,
): string[] {
  const out: string[] = [];
  for (const { title } of PORTAL_TASK_PROPERTIES) {
    const key = matchPropertyKey(properties, title);
    if (key) out.push(key);
  }
  return out;
}

export function getPortalPropertyRow(
  properties: Record<string, unknown>,
  propertyKey: string,
): PortalTaskPropertyRow | undefined {
  for (const cfg of PORTAL_TASK_PROPERTIES) {
    if (matchPropertyKey(properties, cfg.title) === propertyKey) {
      return cfg;
    }
  }
  return undefined;
}

/**
 * True when the portal allows editing this cell: row is marked editable and Notion type is supported.
 */
export function shouldShowPropertyEditor(
  properties: Record<string, unknown>,
  propertyKey: string,
  snapshot: unknown,
): boolean {
  const row = getPortalPropertyRow(properties, propertyKey);
  if (!row?.editable) return false;
  const type = getCachedPropertyType(snapshot);
  return isCachedPropertyEditable(type);
}
