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
    // @ts-ignore
  } = this.query

  const normalizedPagesPath = pagesPath.replace(/\\/g, '/')
  const normalizedResourcePath =
    // @ts-ignore
    this.resourcePath.replace(/\\/g, '/')

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
  if (pageNoExt === '//_app') {
    console.log('in HOC, Not touching it now')
    return rawCode
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
    return templateWithHoc(rawCode, { typescript })
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
  })
}

module.exports = Loader
