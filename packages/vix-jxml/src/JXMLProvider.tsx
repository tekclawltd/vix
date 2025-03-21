import ErrorBoundary from './components/ErrorBoundary';
import JXProvider from './JXProvider';
import JXContext, { buildContext } from './JXContext';

const JXMLProvider = ({ context, children, ...restProps }: any) => {
    if (!children) {
        return null;
    }

    const jsContext = buildContext({
        context,
        props: restProps,
        yaml: children,
    });

    const {
        ThisContext: { schema },
    } = jsContext;
    return (
        <JXContext.Provider value={jsContext}>
            <JXProvider {...restProps}>{schema}</JXProvider>
        </JXContext.Provider>
    );
};

export default (props: any) => (
    <ErrorBoundary>
        <JXMLProvider {...props} />
    </ErrorBoundary>
);
