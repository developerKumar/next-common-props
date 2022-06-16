import { hasHOC } from "../utils";

function pkgDir() {
  try {
    return require("pkg-dir").sync() || process.cwd();
  } catch (e) {
    return process.cwd();
  }
}

function nextCommonProp(nextConfig: any = {}) {
  const fs = require("fs");
  const path = require("path");
  const test = /\.(tsx|ts|js|mjs|jsx)$/;

  const dir = path.resolve(
    path.relative(pkgDir(), process.env.NEXT_TRANSLATE_PATH || ".")
  );
  let hasGetInitialPropsOnAppJs = false

  let pagesInDir = "";
  if (!pagesInDir) {
    pagesInDir = "pages";
    if (fs.existsSync(path.join(dir, "src/pages"))) {
      pagesInDir = "src/pages";
    } else if (fs.existsSync(path.join(dir, "app/pages"))) {
      pagesInDir = "app/pages";
    } else if (fs.existsSync(path.join(dir, "integrations/pages"))) {
      pagesInDir = "integrations/pages";
    }
  }

  const pagesPath = path.join(dir, pagesInDir);
  const app = fs
    .readdirSync(pagesPath)
    .find((page: string) => page.startsWith('_app.'))

  if (app) {
    const code = fs.readFileSync(path.join(pagesPath, app)).toString('UTF-8')
    hasGetInitialPropsOnAppJs =
      !!code.match(/\WgetInitialProps\W/g) || hasHOC(code)
  }

  return {
    ...nextConfig,
    webpack(conf: any, options: Record<string, any>) {
      const config =
        typeof nextConfig.webpack === "function"
          ? nextConfig.webpack(conf, options)
          : conf;

      config.resolve.alias = {
        ...(config.resolve.alias || {}),
        "@next-common-root": path.resolve(dir),
      };

      // we give the opportunity for people to use next-translate without altering
      // any document, allowing them to manually add the necessary helpers on each
      // page to load the namespaces.
      // if (!loader) return config
      config.module.rules.push({
        test,
        use: {
          loader: `${__dirname + "/loader"}`,
          options: {
            example: true,
            pagesPath,
            extensionsRgx: test,
            hasGetInitialPropsOnAppJs,
            hasAppJs: !!app
          },
        },
      });

      return config;
    },
  };
}
export default nextCommonProp;
