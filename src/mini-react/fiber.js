import { renderDom } from './react-dom';
import { commitRoot } from './commit';

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

// 执行当前工作单元并设置下一个要执行的工作单元
function performUnitOfWork(workInProgress) {
  if (!workInProgress.stateNode) {
    // 若当前 fiber 没有 stateNode，则根据 fiber 挂载的 element 的属性创建
    workInProgress.stateNode = renderDom(workInProgress.element);
  }

  let children = workInProgress.element?.props?.children;

  let type = workInProgress.element?.type;
  if (typeof type === 'function') {
    // 当前 fiber 对应 React 组件时，对其 return 迭代
    if (type.prototype.isReactComponent) {
      // 类组件
      const { props, type: Comp } = workInProgress.element;
      const component = new Comp(props);
      const jsx = component.render();
      children = [jsx];
    } else {
      // 函数组件
      const { props, type: Fn } = workInProgress.element;
      const jsx = Fn(props);
      children = [jsx];
    }
  }

  if (children) {
    // children 存在时，对 children 迭代
    let elements = Array.isArray(children) ? children : [children];
    // 打平列表渲染时二维数组的情况（暂不考虑三维及以上数组的情形）
    elements = elements.flat();

    let index = 0; // 当前遍历的子元素在父节点下的下标
    let prevSibling = null; // 记录上一个兄弟节点

    while (index < elements.length) {
      // 遍历子元素
      const element = elements[index];
      // 创建新的 fiber
      const newFiber = {
        element,
        return: workInProgress,
        stateNode: null,
      };
      if (index === 0) {
        // 如果下标为 0，则将当前fiber设置为父 fiber 的 child
        workInProgress.child = newFiber;
      } else {
        // 否则通过 sibling 作为兄弟 fiber 连接
        prevSibling.sibling = newFiber;
      }
      prevSibling = newFiber;
      index++;
    }
  }

  // 设置下一个工作单元
  if (workInProgress.child) {
    // 如果有子 fiber，则下一个工作单元是子 fiber
    nextUnitOfWork = workInProgress.child;
  } else {
    let nextFiber = workInProgress;
    while (nextFiber) {
      if (nextFiber.sibling) {
        // 没有子 fiber 有兄弟 fiber，则下一个工作单元是兄弟 fiber
        nextUnitOfWork = nextFiber.sibling;
        return;
      } else {
        // 子 fiber 和兄弟 fiber 都没有，深度优先遍历返回上一层
        nextFiber = nextFiber.return;
      }
    }
    if (!nextFiber) {
      // 若返回最顶层，表示迭代结束，将 nextUnitOfWork 置空
      nextUnitOfWork = null;
    }
  }
}

// 处理循环和中断逻辑
function workLoop(deadline) {
  let shouldYield = false;
  while (nextUnitOfWork && !shouldYield) {
    // 循环执行工作单元任务
    performUnitOfWork(nextUnitOfWork);
    shouldYield = deadline.timeRemaining() < 1;
  }
  if (!nextUnitOfWork && rootFiber) {
    // 表示进入 commit 阶段
    commitRoot(rootFiber);
    rootFiber = null;
  }
  requestIdleCallback(workLoop);
}

requestIdleCallback(workLoop);
