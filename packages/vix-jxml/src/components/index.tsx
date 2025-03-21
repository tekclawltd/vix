import React from 'react';
import JXProvider from '../JXProvider';

const mergeProps = (child: any, props: any) => {
    return {
        ...child,
        props: {
            ...child.props,
            ...props,
        },
    };
};

const mergeChildrenProps = (children: any, props: any) =>
    children.map((child: any) => mergeProps(child, props));

export const Render = ({
    children,
    onMapProps,
    onMount,
    onUnMount,
    ...ownProps
}: any) => {
    const [props, setProps] = React.useState(ownProps);
    const context = {
        props,
        setProps: React.useCallback(
            (newState: any) => {
                setProps(newState);
            },
            [setProps]
        ),
    };
    React.useEffect(() => {
        onMount && onMount(context);
        return () => {
            onUnMount && onUnMount(context);
        };
    }, []);

    const mapProps = onMapProps && onMapProps(context);
    const renderPropsArray = () =>
        mapProps.map((props: any) => mergeChildrenProps(children, props));
    const renderProps = () => mergeChildrenProps(children, mapProps);
    return Array.isArray(mapProps) ? renderPropsArray() : renderProps();
};

export const JxmlView = ({ url, ...props }: any) => {
    const [jxml, setJxml] = React.useState(null);
    React.useEffect(() => {
        async function fetchData() {
            const response = await fetch(url);
            const jxmlText: any = await response.text();
            try {
                setJxml(jxmlText);
            } catch (error) {
                console.log(error);
            }
        }
        fetchData();
    }, [url]);
    return <JXProvider children={jxml} {...props} />;
};
