import { renderDom } from './react-dom';

let nextUnitOfWork = null;
let rootFiber = null;

// 创建 rootFiber 作为首个 nextUnitOfWork
export function createRoot(element, container) {
  rootFiber = {
    stateNode: container, // 记录对应的真实 dom 节点
    element: {
      // 挂载 element
      props: { children: [element] },
    },
  };
  nextUnitOfWork = rootFiber;
}

// 执行当前工作单元任务并设置下一个要执行的工作单元
function performUnitOfWork(workInProgress) {
  // 根据 fiber 创建对应 dom
  if (!workInProgress.stateNode) {
    // 若当前 fiber 没有 stateNode，则根据 fiber 挂载的 element 的属性创建
    workInProgress.stateNode = renderDom(workInProgress.element);
  }
  if (workInProgress.return) {
    // 如果 fiber 有父 fiber，将当前 dom 挂载到父 fiber 的 stateNode 下
    workInProgress.return.stateNode.appendChild(workInProgress.stateNode);
  }
}
