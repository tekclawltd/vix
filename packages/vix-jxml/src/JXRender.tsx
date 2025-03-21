import { transform } from './transform';
import renderAst from './renderAst';
import { useJXContext } from './JXContext';

export default ({ children }: any) => {
    const context = useJXContext();
    try {
        const transformRender =
            children &&
            transform({
                json: children,
                context,
            });
        return renderAst(transformRender, context, '');
    } catch (error: any) {
        console.error(error.message);
    }
};
