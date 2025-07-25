import React from 'react'

export const useInitState = <Type>(
  v: Type
): [
  Type,
  React.Dispatch<React.SetStateAction<Type>>,
  (v: Type) => void,
  React.MutableRefObject<boolean>,
] => {
  const [state, set] = React.useState<Type>(v)
  const initialized = React.useRef<boolean>(false)

  const init = React.useCallback((v: Type) => {
    if (initialized.current) return

    initialized.current = true
    set(v)
  }, [])

  return [state, set, init, initialized]
}
