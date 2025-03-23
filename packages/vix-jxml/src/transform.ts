import {
  isPlainObject as _isPlainObject,
  isFunction as _isFunction,
} from 'lodash';
import { isLetterUpperCase, bindFn, contextBuild } from './libs/utils';
import renderAst from './renderAst';

export const transformPropValueStr = ({
  propName,
  value,
  context,
}: any): any => {
  const { ThisContext, EnvScope } = context;

  try {
    if (propName === 'style') {
      if (_isPlainObject(value)) {
        return value;
      } else {
        return undefined;
      }
    }
    if (
      [
        propName.startsWith('on'),
        isLetterUpperCase(propName, 2),
        _isFunction(value),
      ].every(Boolean)
    ) {
      return bindFn(value, EnvScope, ThisContext);
    }

    // if (_isFunction(value)) {
    //     return bindFn(value, EnvScope, ThisContext);
    // }

    if (_isPlainObject(value)) {
      const result = getProps({
        json: value,
        context,
      });
      // console.log(result);
      return result;
    }
    return value;
  } catch (error) {
    console.log(error);
  }
};

export function getProps({ json, context }: any): any {
  const result = Object.keys(json || {})
    .filter(name =>
      [!isLetterUpperCase(name, 0), name !== 'children'].every(Boolean)
    )
    .reduce((root, name) => {
      const comp = json[name];
      const children = getChildren({
        json: comp,
        context,
      });
      if ([_isPlainObject(comp), children.length > 0].every(Boolean)) {
        const childrenAst = children.map((child: any) =>
          renderAst(child, context, [name, child.name].join('.'))
        );
        return {
          ...root,
          [name]: childrenAst,
        };
      }
      if (Array.isArray(comp)) {
        const resultMap = comp.map((v, i) => {
          const type = typeof v;
          if (v === null) {
            return v;
          } else if (
            [
              'string',
              'number',
              'boolean',
              'symbol',
              'bigint',
              'undefined',
            ].includes(type)
          ) {
            return v;
          } else if (_isFunction(v)) {
            return transformPropValueStr({
              propName: name,
              value: v,
              context: contextBuild(context).toThis({
                ownProps: comp,
              }),
            });
          }
          const _props = getProps({ json: v, context });
          const children = getChildren({
            json: v,
            context,
          });
          const props =
            children.length > 0
              ? {
                  ..._props,
                  children: children.map((child: any) =>
                    renderAst(child, context, [name, child.name].join('.'))
                  ),
                }
              : { ..._props };
          return props;
        });
        return {
          ...root,
          [name]: resultMap,
        };
      }
      return {
        ...root,
        [name]: transformPropValueStr({
          propName: name,
          value: json[name],
          context: contextBuild(context).toThis({ ownProps: root }),
        }),
      };
    }, {});
  return result;
}

export function getChildren({ json, context }: any): any {
  return Object.keys(json || {})
    .filter(name =>
      [isLetterUpperCase(name, 0), name == 'children'].some(Boolean)
    )
    .map(name => {
      const obj = json[name];
      const { ThisContext, EnvScope } = contextBuild(context).toThis({
        ownProps: json,
      });
      const [componentType] = name.split('_');
      const children = transformPropValueStr({
        propName: name,
        value: obj,
        context,
        ownProps: json,
      });
      const props =
        children || (Array.isArray(children) && children.length > 0)
          ? { children }
          : {};

      if (name === 'children') {
        if (_isPlainObject(obj)) {
          return transform({ json: obj, tagName: name, context });
        } else if (_isFunction(obj)) {
          const value = bindFn(obj, EnvScope, ThisContext)();

          return _isPlainObject(value)
            ? transform({ json: value, tagName: name, context })
            : value;
        }
        return children;
      } else if (_isPlainObject(obj)) {
        return transform({
          json: obj,
          tagName: name,
          context,
        });
      } else {
        return {
          component: componentType,
          name,
          props,
        };
      }
    });
}

export function transform({ json, tagName = 'default', context }: any) {
  const _props = getProps({ json, context });

  const children = getChildren({
    json,
    context,
  });

  const [componentType] = tagName?.split('_');
  const props =
    children.length > 0
      ? {
          ..._props,
          children,
        }
      : { ..._props };
  const result = {
    component: componentType,
    name: tagName,
    props,
    ...(json.hooks && { hooks: json.hooks }),
  };

  return result;
}
