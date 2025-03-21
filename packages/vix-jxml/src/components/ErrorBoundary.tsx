import React from 'react';
import ErrorRenderer from './Error';

export default class ErrorBoundary extends React.Component<any, any> {
    constructor(props: any) {
        super(props);
        this.state = { hasError: false };
    }

    override componentDidCatch(error: any, info: any) {
        // Display fallback UI
        this.setState((preState: any) => ({
            ...preState,
            hasError: [error, info.componentStack],
        }));
    }
    override componentDidUpdate(prevProps: any) {
        const { children } = this.props;
        if (children !== prevProps.children) {
            this.setState({ hasError: undefined }); // eslint-disable-line react/no-did-update-set-state
        }
    }

    override render() {
        const { hasError }: any = this.state;
        if (hasError) {
            return <ErrorRenderer>{hasError}</ErrorRenderer>;
        }
        return this.props.children;
    }
}
