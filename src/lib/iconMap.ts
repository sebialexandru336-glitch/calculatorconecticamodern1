export const AVAILABLE_ICONS = [
  { id: 'connector', label: 'Conector (Negru)', path: '/connector_black.png' },
  { id: 'connector-simple', label: 'Conector (Normal)', path: '/connector_simple.png' }
];

export const parseOperationName = (rawName: string) => {
  const match = rawName.match(/\[ICON:(.+?)\]\s*(.*)/);
  if (match) {
    return {
      iconId: match[1],
      displayName: match[2],
      iconPath: AVAILABLE_ICONS.find((i) => i.id === match[1])?.path || null,
    };
  }
  return {
    iconId: null,
    displayName: rawName,
    iconPath: null,
  };
};

export const formatOperationName = (displayName: string, iconId: string | null) => {
  if (!iconId) return displayName.trim();
  return `[ICON:${iconId}] ${displayName.trim()}`;
};
