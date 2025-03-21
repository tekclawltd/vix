import { getChildren } from '../../transform';
import { isLetterUpperCase } from '../../libs/utils';
import renderAst from '../../renderAst';

export function getRawProps({ json }: any) {
    return Object.keys(json)
        .filter((name) =>
            [!isLetterUpperCase(name, 0), name !== 'children'].every(Boolean)
        )
        .reduce((props, name) => {
            return {
                ...props,
                [name]: json[name],
            };
        }, {});
}

export default (templateJson: any, context: any) => {
    return Object.keys(templateJson).reduce((root, next) => {
        const json = templateJson[next];
        return {
            ...root,
            [next]: (props: any) => {
                const defaultProps = getRawProps({ json });
                const ownProps = { ...defaultProps, ...props };
                const { ThisContext } = context;
                const mergeContext = {
                    ...context,
                    ThisContext: {
                        ...ThisContext,
                        ownProps,
                    },
                };
                const render = getChildren({
                    json,
                    context: mergeContext,
                });

                return render.map((comp: any, index: number) =>
                    renderAst(comp, mergeContext, next)
                );
            },
        };
    }, {});
};
