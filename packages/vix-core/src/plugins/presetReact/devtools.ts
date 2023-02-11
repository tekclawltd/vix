import type { Plugin } from 'vite';
import type { ReactDevtoolsOption } from './index';

export function reactDevtoolsPlugin(
  removeDevtoolsInProd: ReactDevtoolsOption
): Plugin {
  const plugin: Plugin = {
    name: 'react:devtools',

    // Ensure that we resolve before everything else
    enforce: 'pre',

    // Run only on build
    apply: 'build',
    transformIndexHtml(code) {
      return {
        html: code,
        tags: [
          Object.assign(
            {
              injectTo: 'body',
              tag: `script`,
              children: `
              function isFunction(obj) {
                return typeof obj == 'function';
              }
              
              function isObject(obj) {
                var type = typeof obj;
                return type === 'function' || (type === 'object' && !!obj);
              }
              // Ensure the React Developer Tools global hook exists
              if (isObject(window.__REACT_DEVTOOLS_GLOBAL_HOOK__)) {
                // Replace all global hook properties with a no-op function or a null value
                for (const prop in window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
                  if (prop === "renderers") {
                    // prevents console error when dev tools try to iterate of renderers
                    window.__REACT_DEVTOOLS_GLOBAL_HOOK__[prop] = new Map();
                    continue;
                  }
                  window.__REACT_DEVTOOLS_GLOBAL_HOOK__[prop] = isFunction(
                    window.__REACT_DEVTOOLS_GLOBAL_HOOK__[prop]
                  )
                    ? Function.prototype
                    : null;
                }
              }
              `,
            },
            removeDevtoolsInProd.nonce && {
              attrs: {
                nonce: removeDevtoolsInProd.nonce,
              },
            }
          ),
          ...removeDevtoolsInProd.tags,
        ],
      };
    },
  };

  return plugin;
}
