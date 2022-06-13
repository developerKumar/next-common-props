import nextCommonProps from './plugin'

export interface LoaderConfig {
  locale?: string
  router?: { locale: string }
  pathname?: string
  skipInitialProps?: boolean
  loaderName?: string
  isLoader?: boolean
  [key: string]: any
}

module.exports = nextCommonProps;