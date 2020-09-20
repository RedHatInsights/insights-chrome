import React, { PureComponent, createRef } from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';

class RenderWrapper extends PureComponent {
    ref = createRef();
    remediationsRef = createRef();

    renderApp = () => {
        const { cmp, onAppRender, ...props } = this.props;
        const Component = cmp;
        if (this.ref.current) {
            onAppRender(this.remediationsRef);
            ReactDOM.render(
                <Component {...props} ref={this.remediationsRef}/>,
                this.ref.current
            );
        }
    }

    componentDidMount() {
        this.renderApp();
    }

    componentWillUnmount() {
        if (this.ref.current) {
            ReactDOM.unmountComponentAtNode(this.ref.current);
        }
    }

    render() {
        return <article ref={ this.ref }/>;
    }
}

RenderWrapper.propTypes = {
    cmp: PropTypes.any,
    store: PropTypes.object,
    onAppRender: PropTypes.func
};

export default RenderWrapper;
