function templateWithLoader(
  rawCode: string,
  {
    page = "",
    typescript = false,
    loader = "getStaticProps",
    hasLoader = false,
    hasLoadLocaleFrom = false,
    revalidate = 0,
  } = {}
) {
  console.log(page.replace("/", ""), "page");
  const currentPage = page.replace("/", "");
  const tokenToReplace = `__CODE_TOKEN_${Date.now().toString(16)}__`;
  let modifiedCode = rawCode;

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
            r.replace(loader, "__" + loader)
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
        (v) => v.replace("export", "")
      )
      // Replacing: "export { getStaticProps }" to ""
      .replace(/export +\{ *(getStaticProps|getServerSideProps)( |,)*\}/, "")
      // Replacing:
      //    export { something, getStaticProps, somethingelse }
      // To:
      //    export { something, somethingelse }
      // And:
      //    export { getStaticPropsFake, somethingelse, b as getStaticProps }
      // To:
      //    export { getStaticPropsFake, somethingelse }
      .replace(new RegExp(`^ *export {(.|\n)*${loader}(.|\n)*}`, "gm"), (v) => {
        return v
          .replace(new RegExp(`(\\w+ +as +)?${loader}\\W`, "gm"), (v) =>
            v.endsWith(loader) ? "" : v[v.length - 1]
          )
          .replace(/,( |\n)*,/gm, ",")
          .replace(/{( |\n)*,/gm, "{")
          .replace(/{,( \n)*}/gm, "}")
          .replace(/^ *export +{( |\n)*}\W*$/gm, "");
      })
      // Replacing:
      //    import { something, getStaticProps, somethingelse } from './getStaticProps'
      // To:
      //    import { something, getStaticProps as _getStaticProps, somethingelse } from './getStaticProps'
      .replace(/^ *import +{( |\n)*[^}]*/gm, (v) => {
        if (v.match(new RegExp(`\\W+${loader} +as `))) return v;
        return v.replace(new RegExp(`\\W+${loader}(\\W|$)`), (r) =>
          r.replace(loader, `${loader} as __${loader}`)
        );
      });
  }
  /**
   * find template name first
   */
  const regex1 = /(?<=export(.*)default(.*)function)(.*)(?=\()/g;
  const regex2 = /(?<=export(.*)default)(.*)/g;
  const regEx1Match = rawCode.match(regex1);
  const regEx2Match = rawCode.match(regex2);
  let componentName = "";
  if (regEx1Match && (regEx1Match?.length > 0)) {
    componentName = regEx1Match[0].trim();
  } else if (regEx2Match && (regEx2Match?.length > 0)) {
    componentName = regEx2Match[0].trim().replace(';', '');
    
  } else {
    console.error("Unable to find component name!!!");
    return rawCode;
  }
  modifiedCode = modifiedCode.replace(/(export(.*)default)/g, '');
  let template = `
    import conf from '@next-common-root/common-props.config.js'
    import { useContext } from 'react';
    import { CommonPropsProvider } from 'next-common-props/commonPropsContext'

    ${tokenToReplace}
    export async function ${loader}(ctx) {
      let dProps = {};
      let currentPageConfig = conf()['${currentPage}']
      if (currentPageConfig) {
        for (let i = 0; i < currentPageConfig.length; i++) {
          dProps[currentPageConfig[i].key] = await currentPageConfig[i].data()
        }
        
      }
        ${hasLoader ? `let res = __${loader}(ctx)` : ""}
        ${hasLoader ? `if(typeof res.then === 'function') res = await res` : ""}
        return {
          ${hasLoader && revalidate > 0 ? `revalidate: ${revalidate},` : ""}
          ${hasLoader ? "...res," : ""}
          props: {
            ${hasLoader ? "...(res.props || {})," : ""}
            common: {...dProps}
          }
        }
    }
    const HOC = (WrappedComponent) => {

      const MyComponent = props => {
        return (
           <CommonPropsProvider value={{common: props?.common || {}}}>
              <WrappedComponent {...props} />
           </CommonPropsProvider>
         );
       }
       
      return MyComponent;
    }
    export default HOC(${componentName})
  `;

  if (typescript) template = template.replace(/\n/g, "\n// @ts-ignore\n");
  const finalCode = template.replace(tokenToReplace, () => {
    return `\n${modifiedCode}\n`;
  });

  // console.log(finalCode.replace('default', ''))
  // Use callback to avoid parsing special patterns specific for .replace()
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace#specifying_a_string_as_a_parameter
  return finalCode;
}

module.exports = templateWithLoader;
