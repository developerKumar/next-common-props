import React from 'react'
import { LoaderConfig } from '.'

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

    return <AppToTranslate {...props}/>
  }

  if (config.skipInitialProps) return AppToCommonProps

  AppToCommonProps.getInitialProps = async (appCtx: any) => {
    let appProps: object = { pageProps: {} }

    if (AppToTranslate.getInitialProps) {
      appProps = (await AppToTranslate.getInitialProps(appCtx)) || {}
    }

    return {
      ...appProps,
    }
  }

  return AppToCommonProps
}
