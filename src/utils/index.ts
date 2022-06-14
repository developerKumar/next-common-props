export function hasHOC(rawData: string) {
  if (!rawData.includes('export default')) return false
  if (
    hasExportName(rawData, 'getStaticProps') ||
    hasExportName(rawData, 'getServerSideProps') ||
    hasExportName(rawData, 'getStaticPaths')
  ) {
    return false
  }
  const data = rawData
    // Clear all comments
    .replace(clearCommentsRgx, '')

  // If is exported normally (function, var, etc), is not a HOC
  const exportedNormally = new RegExp(
    `export default (\\(.*\\) *=>|function|class)`
  ).test(data)
  if (exportedNormally) return false

  const ref = getRef(data)

  // If the ref includes a "(", is a HOC
  if (ref.includes('(')) return true

  // If not, the export default is just a reference defined on other place.
  // So let's look all the lines that include the reference
  return (
    data.split('\n').filter((line: string) => {
      const isRefLine = line.includes(ref) && !/export +default/.test(line)
      const isComp = new RegExp(`(function|class) +${ref}\\W`).test(line)
      const isCompInVar = new RegExp(` *${ref} += +(function|class) +`).test(
        line
      )
      const isArrowFunc = new RegExp(` *${ref}(: *\\w+ *)? += +\\(.*=>`).test(
        line
      )
      const isPotentialHOC = /=.*\(/.test(line)

      return (
        isRefLine && !isComp && !isCompInVar && !isArrowFunc && isPotentialHOC
      )
    }).length > 0
  )
}
const specFileOrFolderRgx =
  /(__mocks__|__tests__)|(\.(spec|test)\.(tsx|ts|js|jsx)$)/

export const clearCommentsRgx = /\/\*[\s\S]*?\*\/|\/\/.*/g

export function isPageToIgnore(page: string) {
  return Boolean(
    page.startsWith('/api/') ||
      page.startsWith('/api.') ||
      page.startsWith('/_document.') ||
      page.startsWith('_middleware') ||
      page.match(specFileOrFolderRgx) ||
      page.startsWith('//api/') ||
      page.startsWith('//api.') ||
      page.startsWith('//_document.') ||
      page.startsWith('/_middleware')
  )
}
function getRef(data: string) {
  const escapeRegex = (str: string) =>
    str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
  const ref = (data.replace(/ /g, '').match(`exportdefault*([^\\n|;]*)`) ||
    [])[1]
  const prevRef = (data.match(
    new RegExp(`${escapeRegex(ref)} += +(\\w+)($| |;|\\n)`)
  ) || [])[1]

  return prevRef || ref
}
export function hasExportName(data: string, name: string) {
  return Boolean(
    data.match(
      new RegExp(`export +(const|var|let|async +function|function) +${name}`)
    ) ||
      data.match(
        new RegExp(`export\\s*\\{[^}]*(?<!\\w)${name}(?!\\w)[^}]*\\}`, 'm')
      )
  )
}
