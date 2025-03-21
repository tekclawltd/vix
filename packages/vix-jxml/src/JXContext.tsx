import React, { useState, useContext, useEffect } from 'react';
import * as JXComponent from './components';
import { computeJSTemplate, contextBuild, getHooks } from './libs/utils';
import { jsYaml } from '@tekclaw/vix-yaml';
import { get as _get, merge as _merge } from 'lodash';
import { useImmer } from 'use-immer';

const MicroEvent = {
    emit: (event: string, data: any) => {
        const packed = { event, data };
        window.postMessage(packed, '*');
    },
    on: (event: string, callback: any) => {
        window.addEventListener('message', ({ data }) => {
            switch (data.event) {
                case event:
                    callback && callback(data);
                    break;
                default:
            }
        });
    },
};

const JXContext = React.createContext({});

export const useJXContext = () => useContext(JXContext);

export const buildContext = ({ context, yaml, props }: any): any => {
    const [state, setState] = useImmer({});
    const { components, scope, thisContext } = context || {};
    const [jxml, setJxml] = useState(yaml);
    const schemaJson = jsYaml.load(jxml, true);
    const [schema, setSchema]: any = useImmer(schemaJson);
    const newContext = {
        EnvScope: {
            ...scope,
            ...components,
            JXComponent,
            React,
            MicroEvent,
        },
        ThisContext: {
            ...thisContext,
            setState,
            state,
            schema,
            setSchema,
            props: {
                context,
                children: yaml,
                ...props,
            },
        },
    };
    useEffect(() => {
        const computedYaml = computeJSTemplate(yaml, newContext);
        const initSchema: any = jsYaml.load(computedYaml);
        setJxml(computedYaml);
        setSchema(initSchema);
    }, [yaml]);

    const hooks = getHooks(schema.hooks, newContext);
    const jsContext = contextBuild(newContext).toThis({
        hooks,
        schema,
        setSchema,
    });
    // useEffect(() => {
    //     const { onMount, onUnMount } = schema;
    //     try {
    //         isFunction(onMount) && bindFn(onMount, scope, jsContext)();
    //         console.log('onMount:');
    //     } catch (error) {
    //         console.error(error);
    //     }
    //     return () => {
    //         try {
    //             isFunction(onUnMount) && bindFn(onMount, scope, jsContext)();
    //         } catch (error) {
    //             console.error(error);
    //         }
    //     };
    // }, [schema, jsContext]);

    return jsContext;
};

export default JXContext;
