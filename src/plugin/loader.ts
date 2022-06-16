import { hasHOC, isPageToIgnore } from "../utils"
import templateWithHoc from "./templateWithHoc"

const templateWithLoaderFunc = require('./templateWithLoader')
const clearCommentsRgx = /\/\*[\s\S]*?\*\/|\/\/.*/g

function hasExportName(data: string, name: string) {
  return Boolean(
    data.match(
      new RegExp(`export +(const|var|let|async +function|function) +${name}`)
    ) ||
      data.match(
        new RegExp(`export\\s*\\{[^}]*(?<!\\w)${name}(?!\\w)[^}]*\\}`, 'm')
      )
  )
}
function Loader(rawCode: string) {
  const {
    pagesPath,
    extensionsRgx,
    hasGetInitialPropsOnAppJs,
    hasAppJs,
    // @ts-ignore
  } = this.query

  const normalizedPagesPath = pagesPath.replace(/\\/g, '/')
  const normalizedResourcePath =
    // @ts-ignore
    this.resourcePath.replace(/\\/g, '/')
  // In case that there aren't /_app.js we want to overwrite the default _app
  // to provide the I18Provider on top.
  if (normalizedResourcePath.includes('node_modules/next/dist/pages/_app')) {
    // There are cases that a default appjs is served even if it already has
    // an appjs defined. For example when using a class extended from NextApp.
    // For these cases we must not overwrite it.
    if (hasAppJs) return rawCode
    return rawCode
  }

  if (!normalizedResourcePath.startsWith(normalizedPagesPath)) return rawCode
  const page = normalizedResourcePath.replace(normalizedPagesPath, '/')
  const pageNoExt = page.replace(extensionsRgx, '')
  const code = rawCode.replace(clearCommentsRgx, '')
  const typescript = page.endsWith('.ts') || page.endsWith('.tsx')

  if (!/(?<=export(.*)default)(.*)/g.test(code)) return rawCode
  if (code.match(/export *\w* *(__N_SSP|__N_SSG) *=/)) {
    return rawCode
  }
  /** started HOC */
  if (hasGetInitialPropsOnAppJs) {
    return pageNoExt === '//_app'
      ? templateWithHoc(rawCode, { typescript, page: pageNoExt })
      : rawCode
  }
  if (pageNoExt === '//_app') {
    return templateWithHoc(rawCode, {
      skipInitialProps: true,
      typescript,
      page: pageNoExt
    })
  }

  // There are some files that although they are inside pages, are not pages:
  // _app, _document, /api... In that case, let's skip any transformation :)
  if (isPageToIgnore(page)) return rawCode

  const isWrapperWithExternalHOC = hasHOC(code)
  const isDynamicPage = page.includes('[')
  const isGetInitialProps = !!code.match(/\WgetInitialProps\W/g)
  const isGetServerSideProps = hasExportName(code, 'getServerSideProps')
  const isGetStaticPaths = hasExportName(code, 'getStaticPaths')
  const isGetStaticProps = hasExportName(code, 'getStaticProps')
  const hasLoader =
    isGetStaticProps || isGetServerSideProps || isGetInitialProps

  if (isGetInitialProps || (!hasLoader && isWrapperWithExternalHOC)) {
    return templateWithHoc(rawCode, { typescript, page: pageNoExt })
  }
  const loader =
    isGetServerSideProps || (!hasLoader && isDynamicPage && !isGetStaticPaths)
      ? 'getServerSideProps'
      : 'getStaticProps'
  /** Ended HOC */

  return templateWithLoaderFunc(rawCode, {
    pagesPath,
    page: pageNoExt,
    hasLoader,
    loader,
    typescript,
  })
}

module.exports = Loader
