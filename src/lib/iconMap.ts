export const AVAILABLE_ICONS = [
  { id: 'connector', label: 'Conector (Negru)', path: '/connector_black.png' },
  { id: 'connector-simple', label: 'Conector (Normal)', path: '/connector_simple.png' },
  { id: 'pin-header', label: 'Șir de Pini (90°)', path: '/pin_header_2.png' }
];

export interface OperationVariant {
  id: string;
  nume: string;
  iconId: string | null;
  valoare: string;
}

export const parseOperationName = (rawName: string) => {
  let category = "FLAKAFIX"; // Default to FLAKAFIX for old operations without category
  let restName = rawName.trim();

  const catMatch = restName.match(/^\[CAT:(.+?)\]\s*(.*)/);
  if (catMatch) {
    category = catMatch[1];
    restName = catMatch[2];
  }

  if (restName.startsWith("[JSON:")) {
    const splitIdx = restName.lastIndexOf("] ");
    if (splitIdx !== -1) {
      const jsonStr = restName.substring(6, splitIdx);
      const displayName = restName.substring(splitIdx + 2);
      try {
        const data = JSON.parse(jsonStr);
        return {
          category,
          isComplex: true,
          displayName: displayName,
          variants: data.v as OperationVariant[],
          iconId: null,
          iconPath: null,
        };
      } catch (e) {
        console.error("Failed to parse JSON variant:", e);
      }
    }
  }

  const match = restName.match(/^\[ICON:(.+?)\]\s*(.*)/);
  if (match) {
    return {
      category,
      isComplex: false,
      iconId: match[1],
      displayName: match[2],
      iconPath: AVAILABLE_ICONS.find((i) => i.id === match[1])?.path || null,
      variants: [],
    };
  }
  
  return {
    category,
    isComplex: false,
    iconId: null,
    displayName: restName,
    iconPath: null,
    variants: [],
  };
};

export const formatOperationName = (displayName: string, iconId: string | null, category: string) => {
  const catPrefix = category ? `[CAT:${category.trim()}] ` : `[CAT:FLAKAFIX] `;
  if (!iconId) return `${catPrefix}${displayName.trim()}`;
  return `${catPrefix}[ICON:${iconId}] ${displayName.trim()}`;
};

export const formatComplexOperationName = (displayName: string, variants: OperationVariant[], category: string) => {
  const jsonStr = JSON.stringify({ v: variants });
  const catPrefix = category ? `[CAT:${category.trim()}] ` : `[CAT:FLAKAFIX] `;
  return `${catPrefix}[JSON:${jsonStr}] ${displayName.trim()}`;
};
