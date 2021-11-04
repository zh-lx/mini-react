import { createRoot } from './fiber';

function render(element, container) {
  createRoot(element, container);
}

// 将 React.Element 渲染为真实 dom
export function renderDom(element) {
  let dom = null; // 要返回的 dom

  if (!element) {
    return document.createDocumentFragment();
  }

  if (typeof element === 'string') {
    // 如果 element 本身为 string，表示文本节点，不需要考虑其 props 直接返回
    dom = document.createTextNode(element);
    return dom;
  }

  if (Array.isArray(element)) {
    // 数组类型的渲染
    dom = document.createDocumentFragment();
    for (let item of element) {
      const child = renderDom(item);
      dom.appendChild(child);
    }
    return dom;
  }

  const {
    type,
    props: { children, ...attributes },
  } = element;

  if (typeof type === 'string') {
    // 常规 dom 节点的渲染
    dom = document.createElement(type);
  } else if (typeof type === 'function') {
    // React组件的渲染
    if (type.prototype.isReactComponent) {
      // 类组件
      const { props, type: Comp } = element;
      const component = new Comp(props);
      const jsx = component.render();
      dom = renderDom(jsx);
    } else {
      // 函数组件
      const { props, type: Fn } = element;
      const jsx = Fn(props);
      dom = renderDom(jsx);
    }
  } else if (type.toString() === 'Symbol(react.fragment)') {
    // React.Fragment 的渲染
    dom = document.createDocumentFragment();
  } else {
    // 其他情况暂不考虑
  }

  if (children) {
    // children 存在，对子节点递归渲染
    const childrenDom = renderDom(children);
    dom.appendChild(childrenDom);
  }

  updateAttributes(dom, attributes);

  return dom;
}

// 更新 dom 属性
function updateAttributes(dom, attributes) {
  const events = Object.keys(attributes).filter((attribute) =>
    attribute.startsWith('on')
  );
  const attrs = Object.keys(attributes).filter(
    (attribute) => !attribute.startsWith('on')
  );
  // 绑定事件
  events.forEach((event) => {
    const eventName = event.slice(2).toLowerCase();
    dom.addEventListener(eventName, attributes[event]);
  });
  // 添加属性
  attrs.forEach((key) => {
    if (key === 'className') {
      // className 的处理
      const classes = attributes[key].split(' ');
      classes.forEach((classKey) => {
        dom.classList.add(classKey);
      });
    } else if (key === 'style') {
      // style处理
      const style = attributes[key];
      Object.keys(style).forEach((styleKey) => {
        dom.style[styleKey] = style[styleKey];
      });
    } else {
      // 其他属性的处理
      dom[key] = attributes[key];
    }
  });
}

const ReactDOM = {
  render,
};
export default ReactDOM;
