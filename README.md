<Center>*Easy props sharing with nested components without drilling for Next.js +10*</Center>

<Center>*Next plugin*</Center>

**The main goal of this library is to avoid the prop drilling as simple as possible in a Next.js environment.**

**Features**  ✨

-   🚀  ・ Works well with automatic page optimization.
-   🦄  ・ Easy to use and configure.
-   🈂️  ・ It loads only the necessary data (for page).
-   📦  ・ Tiny (~1kb) and tree shakable. No dependencies.

### How are props loaded?

In the configuration file, you specify each page that needs the props:

**common-props.config.js**

    module.exports = function () {
	    return {
		    '/index': [
			    {
				    key:  'mediaPosts',
				    data:  async () => ({test: 'some text'}),
			    },
			  ],
		   };
	};

You can also, import any function to data key.

Next-translate ensures that each page only has its props. So if we have 100 common props, only required(or specified in config file) will be loaded.

In order to do this we use a  **webpack loader**  that loads the necessary translation files inside the Next.js methods (**getStaticProps**,  **getServerSideProps**  or  **getInitialProps**). If you have one of these methods already on your page, the webpack loader will use your own method, but the defaults it will use are:

-   **`getStaticProps`**. This is the  **default method used on most pages**, unless it is a page specified in the next two points. This is for performance, so the calculations are done in build time instead of request time.
-   **`getServerSideProps`**. This is the  **default method for dynamic pages**  like  `[slug].js`  or  `[...catchall].js`. This is because for these pages it is necessary to define the  `getStaticPaths`  and there is no knowledge of how the slugs should be for each locale. Likewise, how is it by default, only that you write the getStaticPaths then it will already use the getStaticProps to load the translations.
-   **`getInitialProps`**. This is the  **default method for these pages that use a HoC**. This is in order to avoid conflicts because HoC could overwrite a  `getInitialProps`.

This  **whole process is transparent**, so in your pages you can directly consume the  `useCommonProps`  hook to use the props, and you don't need to do anything else.


## [](https://www.npmjs.com/package/next-translate#2-getting-started)2. Getting started

### [](https://www.npmjs.com/package/next-common-props#install)Install

-   `yarn add next-common-props`

### [](https://www.npmjs.com/package/next-translate#add-next-translate-plugin)Add next-common-props plugin

In your  **next.config.js**  file:

const nextCommonProps = require('next-common-props')

module.exports = nextCommonProps()

Or if you already have  **next.config.js**  file and want to keep the changes in it, pass the config object to the  `nextCommonProps()`. For example for webpack you could do it like this:

const nextCommonProps = require('next-common-props')

module.exports = nextCommonProps({
  webpack: (config, { isServer, webpack }) => {
    return config;
  }
})

### [](https://www.npmjs.com/package/next-translate#add-i18njs-config-file)Add common-props.config.js config file

Add a configuration file  `common-props.config.js`   with  `module.exports`) in the root of the project. Each page should have its prop key and data as function. 

    module.exports = function () {
    	    return {
    		    '/index': [
    			    {
    				    key:  'mediaPosts',
    				    data:  async () => ({test: 'some text'}),
    			    },
    			  ],
    		   };
    	};

## 4. API

### [](https://www.npmjs.com/package/next-translate#usetranslation)useCommonProps

**Size**: ~378b  📦

This hook is the recommended way to use props in your pages / components.

-   **Input**: NA
-   **Output**: Object<any, any>

Example:

    import React from 'react'
    import useCommonProps from 'next-common-props/useCommonProps'
    
    export default function Description() {
      const { common } = useCommonProps()
      return (
        <>
          <h1>{common.mediaPosts.test}</h1>
        <>
      )
    }

Where `common.mediaPosts.test` is accessed based on we will have to declare key as `mediaPosts` and `data` as a `function` which will return an object with key `test`.