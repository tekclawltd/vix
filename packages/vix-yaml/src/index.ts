import YAML from 'js-yaml';
import toSource from 'tosource';
import { createFilter, makeLegalIdentifier } from '@rollup/pluginutils';
import jsYaml from './yaml';

export { jsYaml, toSource };

const defaults = {
  documentMode: 'single',
  safe: true,
  transform: undefined,
};

export type YamlOption = {
  documentMode?: string;
  include?: string[];
  exclude?: string[];
  safe: boolean;
  transform?: (content: any, id: string) => {};
};
const ext = /\.ya?ml$/;

export default (opts: YamlOption = defaults) => {
  const options: YamlOption = Object.assign({}, defaults, opts);
  const { documentMode, safe } = options;
  const filter = createFilter(options.include, options.exclude);
  let loadMethod: any = null;

  if (documentMode === 'single') {
    loadMethod = safe ? YAML.load : jsYaml.load;
  } else if (documentMode === 'multi') {
    loadMethod = safe ? YAML.loadAll : jsYaml.loadAll;
  } else {
    (this as any).error(
      `plugin-yaml → documentMode: '${documentMode}' is not a valid value. Please choose 'single' or 'multi'`
    );
  }

  return {
    name: '@vix-plugin:yaml',
    transform(content: string, id: string) {
      if (!ext.test(id)) return null;
      if (!filter(id)) return null;

      let data = loadMethod(content);

      if (typeof options.transform === 'function') {
        const result = options.transform(data, id);
        // eslint-disable-next-line no-undefined
        if (result !== undefined) {
          data = result;
        }
      }

      const keys = Object.keys(data).filter(
        key => key === makeLegalIdentifier(key)
      );
      const code = `var data = ${toSource(data)};\n\n`;
      const exports = ['export default data;']
        .concat(keys.map(key => `export var ${key} = data.${key};`))
        .join('\n');

      return {
        code: code + exports,
        map: { mappings: '' },
      };
    },
  };
};
