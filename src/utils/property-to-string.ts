export const keyToLabelMap: Record<string, string> = {
  dbId: 'database ID',
  text: 'description',
}

export function propertyKeyToString(key: string) {
  return keyToLabelMap[key] || key
}

export function propertyValueToString(value: string | number | boolean | null) {
  if (value === true) {
    return 'true'
  }
  if (value === false) {
    return 'false'
  }
  return value
}
