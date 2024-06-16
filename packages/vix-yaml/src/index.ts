import yaml from 'js-yaml';
import XRegExp from 'xregexp';
import unsafe from './js-types';

const schema = yaml.DEFAULT_SCHEMA.extend(unsafe);

const noTemplate = (src: string) =>
    XRegExp.matchRecursive(src, '#js::begin', '#js::end', 'g').reduce(
        (root: string, next: string) => {
            return root?.replace(next, '');
        },
        src
    );

export const jsYaml = {
    load: (src: string, noTemplateLiterals: boolean = false) => {
        const noJsYaml = noTemplateLiterals ? noTemplate(src) : src;
        return yaml.load(noJsYaml, { schema });
    },
    loadAll: (src: string, noTemplateLiterals: boolean = false) => {
        const noJsYaml = noTemplateLiterals ? noTemplate(src) : src;
        return yaml.loadAll(noJsYaml, function (doc) {}, { schema });
    },
    dump: yaml.dump,
};

export default jsYaml;
