import { get as _get, merge as _merge } from 'lodash';
import htmltags from './htmltags';

export const isLetterUpperCase = (word: string, which: number) => {
    return word.charCodeAt(which) >= 65 && word.charCodeAt(which) <= 90;
};

export const componentLibs = (components: any) =>
    Object.keys(components)
        .filter((name) => isLetterUpperCase(name, 0))
        .map(
            (name) =>
                `const ${name} = ({ children }) => <${components[name]}> {children} </${components[name]}> ;\n`
        )
        .join('');

export const importLibs = (imports: []) =>
    imports
        .map((item: any) =>
            Array.isArray(item)
                ? `import ${item[0]} from '${item[1]}'; `
                : `import * from '${item}';`
        )
        .join('\n');

export const bindScopeEnv = function (scope: any, context: any) {
    return (code: string) => {
        const sandbox = new Function(
            Object.keys(scope).join(','),
            `return ${code}`
        );
        const scopedSandbox = sandbox.apply(context, Object.values(scope));
        return scopedSandbox && scopedSandbox.bind
            ? scopedSandbox.bind(context)
            : scopedSandbox;
    };
};

export const bindFn = function (
    fn: Function,
    scope: any = {},
    context: any = {}
) {
    delete scope.default;
    const newScope = { ...scope };
    const newContext = { ...context };
    const sandbox = new Function(
        Object.keys(newScope).join(','),
        `return ${fn}`
    );
    const scopedSandbox = sandbox.apply(newContext, Object.values(newScope));
    return scopedSandbox && scopedSandbox.bind
        ? scopedSandbox.bind(newContext)
        : scopedSandbox;
};

export const getType = (type: any, components: any) =>
    _get(components, type, htmltags(type));

export const getHooks = (json: any, context: any) => {
    return Object.keys(json || {}).reduce((props, name) => {
        const hook = json[name];
        const { ThisContext, EnvScope } = context;

        return {
            ...props,
            [name]: bindFn(hook, EnvScope, { ...ThisContext })(),
        };
    }, {});
};

export const contextBuild = (context: any = {}) => {
    const { ThisContext = {}, EnvScope = {} } = context;
    return {
        toThis: (data: any) => ({
            EnvScope,
            ThisContext: { ...ThisContext, ...data },
        }),
        toEnv: (data: any) => ({
            EnvScope: { ...EnvScope, ...data },
            ...ThisContext,
        }),
    };
};

export const computeJSTemplate = (
    yaml: string,
    { EnvScope, ThisContext }: any = {}
) => {
    const parsedYaml = bindFn(
        new Function(`return \`${yaml}\``),
        EnvScope,
        ThisContext
    )();
    const cleanYaml = parsedYaml.replace(/undefined\n/g, '');
    return cleanYaml;
};
