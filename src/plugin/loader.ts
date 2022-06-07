
const templateWithLoader = require("./templateWithLoader");
const clearCommentsRgx = /\/\*[\s\S]*?\*\/|\/\/.*/g

function Loader(rawCode: string) {
  const {
    pagesPath,
    extensionsRgx
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

  if (!(/(?<=export(.*)default)(.*)/g).test(code)) return rawCode
  if (code.match(/export *\w* *(__N_SSP|__N_SSG) *=/)) {
    return rawCode
  }
  /** started HOC */
  if (pageNoExt === '//_app') {
    console.log('in HOC, Not touching it now')
    return rawCode
  }

  /** Ended HOC */

  return templateWithLoader(rawCode, {pagesPath, page: pageNoExt})
}

module.exports = Loader;