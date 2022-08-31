import { clearCommentsRgx } from "../utils"

export default function templateWithHoc(
  code: string,
  {
    skipInitialProps = false,
    typescript = false,
    pageName = '__Page_Next_Common__',
    page = '',
  } = {}
) {
  const tokenToReplace = `__CODE_TOKEN_${Date.now().toString(16)}__`
  const codeWithoutComments = code.replace(clearCommentsRgx, '')

  // Replacing all the possible "export default" (if there are comments
  // can be possible to have more than one)
  let modifiedCode = code.replace(/export +default/g, `const ${pageName} =`)

  // It is necessary to change the name of the page that uses getInitialProps
  // to ours, this way we avoid issues.
  const [, , componentName] =
    codeWithoutComments.match(
      /export +default +(function|class) +([A-Z]\w*)/
    ) || []

  if (componentName) {
    modifiedCode = modifiedCode.replace(
      new RegExp(`\\W${componentName}\\.getInitialProps`, 'g'),
      `${pageName}.getInitialProps`
    )
  }
  const currentPage = page.replace("/", "");

  let template = `
    import appWithCommonProps from 'next-common-props/appWithCommonProps'
    
    ${tokenToReplace}
    export default appWithCommonProps(__Page_Next_Common__, {
      isLoader: true,
      skipInitialProps: ${skipInitialProps},
      currentPage: '${currentPage}'
    });
  `

  if (typescript) template = template.replace(/\n/g, '\n// @ts-ignore\n')

  // Use callback to avoid parsing special patterns specific for .replace()
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace#specifying_a_string_as_a_parameter
  return template.replace(tokenToReplace, () => {
    return `\n${modifiedCode}\n`
  })
}