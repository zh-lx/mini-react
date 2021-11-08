import { commitRender } from './fiber';
export class Component {
  constructor(props) {
    this.props = props;
  }
}
Component.prototype.isReactComponent = true;

Component.prototype.setState = function (param) {
  if (typeof param === 'function') {
    const result = param(this.state, this.props);
    this.state = {
      ...this.state,
      ...result,
    };
  } else {
    this.state = {
      ...this.state,
      ...param,
    };
  }

  commitRender();
};

Component.prototype._UpdateProps = function (props) {
  this.props = props;
};
