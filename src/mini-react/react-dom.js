import { createRoot } from './fiber';

function render(element, container) {
  createRoot(element, container);
}

// 将 React.Element 渲染为真实 dom
export function renderDom(element) {
  let dom = null; // 要返回的 dom

  if (typeof element === 'string') {
    // 如果 element 本身为 string，表示文本节点，不需要考虑其 props 直接返回
    dom = document.createTextNode(element);
    return dom;
  }

  const {
    type,
    props: { children, ...attributes },
  } = element;

  if (typeof type === 'string') {
    // 常规 dom 节点的渲染
    dom = document.createElement(type);
  } else {
    // 其他情况暂不考虑
  }

  updateAttributes(dom, attributes);

  return dom;
}

// 更新 dom 属性
export function updateAttributes(dom, attributes, oldAttributes) {
  if (oldAttributes) {
    // oldAttributes存在，移除旧的属性
    const events = Object.keys(oldAttributes).filter((attribute) =>
      attribute.startsWith('on')
    );
    const attrs = Object.keys(oldAttributes).filter(
      (attribute) => !attribute.startsWith('on')
    );
    // 移除事件
    events.forEach((event) => {
      const eventName = event.slice(2).toLowerCase();
      dom.removeEventListener(eventName, oldAttributes[event]);
    });
    // 移除属性
    attrs.forEach((key) => {
      if (key === 'className') {
        // className 的处理
        const classes = oldAttributes[key].split(' ');
        classes.forEach((classKey) => {
          dom.classList.remove(classKey);
        });
      } else if (key === 'style') {
        // style处理
        const style = oldAttributes[key];
        Object.keys(style).forEach((styleKey) => {
          dom.style[styleKey] = 'initial';
        });
      } else {
        // 其他属性的处理
        dom[key] = '';
      }
    });
  }

  // 挂载新的属性
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
