import React from 'react';
import {
    isPlainObject,
} from 'lodash';
import { getType, contextBuild } from './libs/utils';

export function renderAst(json: any, context: any, key: string) {
    if (isPlainObject(json)) {
        const { EnvScope, ThisContext } = contextBuild(context).toThis({
            ownProps: json,
        });
        const type = getType(json.component, EnvScope);
        const keyPath = [key, json.name].filter(Boolean).join('.');
        const children = Array.isArray(json.props?.children)
            ? json.props?.children.map((child: any, index: number) =>
                  renderAst(child, { EnvScope, ThisContext }, keyPath)
              )
            : json.props?.children;
        const props = {
            ...(type && json.props),
            key: keyPath,
            ...(type && { 'data-keypath': keyPath }),
            ...(children && { children }),
        };

        try {
            return Boolean(props.hidden)
                ? null
                : React.createElement(type || React.Fragment, props);
        } catch (error) {
            console.log(error);
        }
    } else {
        return json || React.Fragment;
    }
}

export default renderAst;
