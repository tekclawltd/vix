import { register } from '.';

register({
  target: `node${process.version.slice(1)}`,
  include: [process.cwd()],
});
