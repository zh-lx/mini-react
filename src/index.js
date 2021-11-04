import { Component } from 'react';
import ReactDOM from './mini-react/react-dom';
import './index.css';

class ClassComp extends Component {
  render() {
    return <div>this is a class-component</div>;
  }
}

function FunctionComp() {
  return <div>this is a function-component</div>;
}

const jsx = (
  <div>
    root div
    <ClassComp />
    <FunctionComp />
    <div className="box">
      this is div level1
      <a href="https://github.com/zh-lx/mini-react"> mini react link</a>
      <p style={{ color: 'red' }}>this is a p</p>
      <>
        this is fragment
        <div>this is div level2.1</div>
        <div>this is div level2.2</div>
      </>
    </div>
    <div>
      this is condition render
      {true && <div>condition true</div>}
      {false && <div>condition false</div>}
      <input
        type="button"
        value="Hello"
        onClick={() => {
          alert('hello');
        }}
      />
    </div>
    {['item1', 'item2', 'item3'].map((item) => (
      <li key={item}>{item}</li>
    ))}
  </div>
);

ReactDOM.render(jsx, document.getElementById('root'));
