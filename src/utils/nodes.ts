export type Property = {
  type: string
  value: string | number | boolean | null
  skeleton?: string
  searched?: boolean
} | null

export type Properties = { [propType: string]: string }

export const NODE_DISPLAY_NAMES = [
  'displayName (String)',
  'node_name (String)',
  'surname (String)',
  'lastname (String)',
  'name (String)',
  'label (String)',
  'title (String)',
  'displayName',
  'node_name',
  'surname',
  'lastname',
  'name',
  'label',
  'title',
]

export const getNodeName = (nodeProperties: Properties): Property => {
  for (const prop of NODE_DISPLAY_NAMES) {
    const v = nodeProperties[prop]

    if (v) {
      return { type: prop, value: v }
    }
  }

  return null
}
