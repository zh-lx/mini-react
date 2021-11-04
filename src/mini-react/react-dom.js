function render(element, container) {
  const dom = renderDom(element);
  container.appendChild(dom);
}

// 将 React.Element 渲染为真实 dom
function renderDom(element) {}

const ReactDOM = {
  render,
};
export default ReactDOM;
