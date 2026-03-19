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
  if (rawName.startsWith("[JSON:")) {
    const splitIdx = rawName.lastIndexOf("] ");
    if (splitIdx !== -1) {
      const jsonStr = rawName.substring(6, splitIdx);
      const displayName = rawName.substring(splitIdx + 2);
      try {
        const data = JSON.parse(jsonStr);
        return {
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

  const match = rawName.match(/^\[ICON:(.+?)\]\s*(.*)/);
  if (match) {
    return {
      isComplex: false,
      iconId: match[1],
      displayName: match[2],
      iconPath: AVAILABLE_ICONS.find((i) => i.id === match[1])?.path || null,
      variants: [],
    };
  }
  
  return {
    isComplex: false,
    iconId: null,
    displayName: rawName,
    iconPath: null,
    variants: [],
  };
};

export const formatOperationName = (displayName: string, iconId: string | null) => {
  if (!iconId) return displayName.trim();
  return `[ICON:${iconId}] ${displayName.trim()}`;
};

export const formatComplexOperationName = (displayName: string, variants: OperationVariant[]) => {
  const jsonStr = JSON.stringify({ v: variants });
  return `[JSON:${jsonStr}] ${displayName.trim()}`;
};
