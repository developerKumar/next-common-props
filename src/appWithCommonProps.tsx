import React from 'react'
import { LoaderConfig } from '.'
import { CommonPropsHOCProvider } from './commonPropsHOCContext'

type Props = {
  [key: string]: any
}

interface PartialNextContext {
  res?: any
  AppTree?: NextComponentType<PartialNextContext>
  Component?: NextComponentType<PartialNextContext>
  ctx?: PartialNextContext
  [key: string]: any
}

type NextComponentType<
  C extends PartialNextContext = PartialNextContext,
  IP = {},
  P = {}
> = React.ComponentType<P> & {
  getInitialProps?(context: C): IP | Promise<IP>
}

export default function appWithCommonProps(
  AppToTranslate: NextComponentType,
  config: LoaderConfig = {}
) {
  if (!config.isLoader && config.loader !== false) {
    console.warn(
      '🚨 [next-common-props] You can remove the "appWithCommonProps" HoC on the _app.js, unless you set "loader: false" in your common-props.config.js file.'
    )
  }

  function AppToCommonProps(props: Props) {
    return (
      <CommonPropsHOCProvider value={props.common || props.pageProps.common}>
        <AppToTranslate {...props} />
      </CommonPropsHOCProvider>
    )
  }
  let { currentPageConfig } = config
  const currnetPageConfigExists =
    currentPageConfig && currentPageConfig.length > 0
  if (config.skipInitialProps && !currnetPageConfigExists)
    return AppToCommonProps

  AppToCommonProps.getInitialProps = async (appCtx: any) => {
    let appProps: object = { pageProps: {} }

    let dProps: any = {}
    if (currentPageConfig) {
      for (let i = 0; i < currentPageConfig.length; i++) {
        dProps[currentPageConfig[i].key] = await currentPageConfig[i].data()
      }
    }
    if (AppToTranslate.getInitialProps) {
      appProps = (await AppToTranslate.getInitialProps(appCtx)) || {}
    }

    return {
      ...appProps,
      common: dProps,
    }
  }

  return AppToCommonProps
}
