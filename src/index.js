import { Component } from 'react';
import ReactDOM from 'react-dom';
import './index.css';

class ClassComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    return (
      <div className="class-component">
        <div>this is a class Component</div>
        <div>prop value is: {this.props.value}</div>
      </div>
    );
  }
}

function FunctionComponent(props) {
  return (
    <div className="function-component">
      <div>this is a function Component</div>
      <div>prop value is: {props.value}</div>
    </div>
  );
}

const jsx = (
  <div className="deep1-box">
    <ClassComponent value={666} />
    <FunctionComponent value={100} />
    <div className="deep2-box-1">
      <a href="https://github.com/zh-lx/mini-react">mini react link</a>
      <p style={{ color: 'red' }}> this is a red p</p>
      <div className="deep3-box">
        {true && <div>condition true</div>}
        {false && <div>condition false</div>}
        <input
          type="button"
          value="say hello"
          onClick={() => {
            alert('hello');
          }}
        />
      </div>
    </div>
    <div className="deep2-box-2">
      {['item1', 'item2', 'item3'].map((item) => (
        <li key={item}>{item}</li>
      ))}
    </div>
  </div>
);

ReactDOM.render(jsx, document.getElementById('root'));
