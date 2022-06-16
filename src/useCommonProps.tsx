import { useContext, useMemo } from 'react'
import CommonPropsHOCContext from './commonPropsHOCContext'

export default function useCommonProps() {
  const ctxAppJs = useContext(CommonPropsHOCContext)
  return useMemo(() => ({ common: { ...ctxAppJs } }), [ctxAppJs])
}
