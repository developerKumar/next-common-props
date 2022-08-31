const { NAMES } = require('../utils')

function templateWithLoader(
  rawCode: string,
  {
    page = '',
    typescript = false,
    loader = 'getStaticProps',
    hasLoader = false,
    hasLoadLocaleFrom = false,
    revalidate = 0,
  } = {}
) {
  const currentPage = page.replace('/', '')
  const tokenToReplace = `__CODE_TOKEN_${Date.now().toString(16)}__`
  let modifiedCode = rawCode

  if (hasLoader) {
    modifiedCode = modifiedCode
      // Replacing:
      //    const getStaticProps = () => console.log('getStaticProps')
      //    import getStaticProps from './getStaticProps'
      // To:
      //    const _getStaticProps = () => console.log('getStaticProps')
      //    import _getStaticProps from './getStaticProps'
      .replace(
        new RegExp(
          `(const|var|let|async +function|function|import|import {.* as) +${loader}\\W`
        ),
        (v) =>
          v.replace(new RegExp(`\\W${loader}\\W`), (r) =>
            r.replace(loader, '__' + loader)
          )
      )
      // Replacing:
      //    export const _getStaticProps = () => ({ props: {} })
      // To:
      //    const _getStaticProps = () => ({ props: {} })
      .replace(
        new RegExp(
          `export +(const|var|let|async +function|function) +__${loader}`
        ),
        (v) => v.replace('export', '')
      )
      // Replacing: "export { getStaticProps }" to ""
      .replace(/export +\{ *(getStaticProps|getServerSideProps)( |,)*\}/, '')
      // Replacing:
      //    export { something, getStaticProps, somethingelse }
      // To:
      //    export { something, somethingelse }
      // And:
      //    export { getStaticPropsFake, somethingelse, b as getStaticProps }
      // To:
      //    export { getStaticPropsFake, somethingelse }
      .replace(new RegExp(`^ *export {(.|\n)*${loader}(.|\n)*}`, 'gm'), (v) => {
        return v
          .replace(new RegExp(`(\\w+ +as +)?${loader}\\W`, 'gm'), (v) =>
            v.endsWith(loader) ? '' : v[v.length - 1]
          )
          .replace(/,( |\n)*,/gm, ',')
          .replace(/{( |\n)*,/gm, '{')
          .replace(/{,( \n)*}/gm, '}')
          .replace(/^ *export +{( |\n)*}\W*$/gm, '')
      })
      // Replacing:
      //    import { something, getStaticProps, somethingelse } from './getStaticProps'
      // To:
      //    import { something, getStaticProps as _getStaticProps, somethingelse } from './getStaticProps'
      .replace(/^ *import +{( |\n)*[^}]*/gm, (v) => {
        if (v.match(new RegExp(`\\W+${loader} +as `))) return v
        return v.replace(new RegExp(`\\W+${loader}(\\W|$)`), (r) =>
          r.replace(loader, `${loader} as __${loader}`)
        )
      })
  }

  let template = `

    ${tokenToReplace}
    export async function ${loader}(ctx) {
      const conf = require('@next-common-root/common-props.config');
      let dProps = {};
      let currentPageConfig = [...(conf()['${currentPage}'] ? conf()['${currentPage}']  : []), ...(conf()['${
    NAMES.COMMON_FILE_NAME
  }'] || [])]
      if (currentPageConfig && currentPageConfig.length > 0) {
        for (let i = 0; i < currentPageConfig.length; i++) {
          dProps[currentPageConfig[i].key] = await currentPageConfig[i].data()
        }
        
      }
        ${hasLoader ? `let res = __${loader}(ctx)` : ''}
        ${hasLoader ? `if(typeof res.then === 'function') res = await res` : ''}
        return {
          ${hasLoader && revalidate > 0 ? `revalidate: ${revalidate},` : ''}
          ${hasLoader ? '...res,' : ''}
          props: {
            ${hasLoader ? '...(res.props || {}),' : ''}
            common: {...dProps}
          }
        }
    }
  `

  if (typescript) template = template.replace(/\n/g, '\n// @ts-ignore\n')
  const finalCode = template.replace(tokenToReplace, () => {
    return `\n${modifiedCode}\n`
  })

  // console.log(finalCode.replace('default', ''))
  // Use callback to avoid parsing special patterns specific for .replace()
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace#specifying_a_string_as_a_parameter
  return finalCode
}

module.exports = templateWithLoader
