import yaml from 'js-yaml';
import unsafe from './js-types';

const schema = yaml.DEFAULT_SCHEMA.extend(unsafe);

export default {
  load: (src: string) => {
    return yaml.load(src, { schema });
  },
  loadAll: (src: string) => {
    return yaml.loadAll(src, function (doc) {}, { schema });
  },
};
