import React from 'react';

import JXRender from './JXRender';

const JXProvider = ({ children }: any): any => {
    if (!children) {
        return React.Fragment;
    }
    try {
        return <JXRender>{children.default}</JXRender>;
    } catch (error) {
        console.error(error);
    }
};

export default JXProvider;
