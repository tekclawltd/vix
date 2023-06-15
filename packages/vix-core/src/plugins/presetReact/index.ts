import type { Options } from '@vitejs/plugin-react';
import react from '@vitejs/plugin-react';
import type { Plugin, PluginOption } from 'vite';

import { reactDevtoolsPlugin } from './devtools';

export interface ReactDevtoolsOption {
  readonly nonce?: string;
  readonly tags?: any[];
}

export type ReactDevtoolsPluginOptions = ReactDevtoolsOption | boolean;
export interface ReactPresetPluginOptions extends Options {
  /** Disabled React devtools in production */
  readonly removeDevtoolsInProd?: ReactDevtoolsPluginOptions | boolean;

  /** Inject `React` into every file to not declare `import React from 'react';` everywhere */
  readonly injectReact?: boolean;
}

export default function reactPlugin({
  removeDevtoolsInProd = false,
  injectReact = true,
  ...restReactOptions
}: ReactPresetPluginOptions = {}): (Plugin | PluginOption[])[] {
  return [
    // @ts-ignore
    react({
      jsxRuntime: injectReact ? 'automatic' : 'classic',
      ...restReactOptions,
    }),
    removeDevtoolsInProd &&
      reactDevtoolsPlugin(
        Object.assign(
          {
            nonce: null,
            tags: [],
          },
          typeof removeDevtoolsInProd === 'object' && removeDevtoolsInProd
        )
      ),
  ].filter(Boolean);
}
