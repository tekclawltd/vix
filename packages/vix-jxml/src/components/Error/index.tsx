type ErrorRendererProps = {
    children: string;
    title?: string;
};
const ErrorRenderer = ({ children }: ErrorRendererProps) => {
    return (
        <div>
            <h6 className="pt-3">
                <pre
                    style={{
                        overflowX: 'auto',
                        maxHeight: 'auto',
                        background: 'rgba(255, 0, 0, .1)',
                    }}
                >
                    {`Invalid React:\n${children.toString()}`}
                </pre>
            </h6>
        </div>
    );
};

export default ErrorRenderer;
