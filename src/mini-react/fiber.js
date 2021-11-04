import { renderDom } from './react-dom';
import { commitRoot } from './commit';
import { reconcileChildren } from './reconciler';

let nextUnitOfWork = null;
let workInProgressRoot = null; // 当前工作的 fiber 树
let currentRoot = null; // 上一次渲染的 fiber 树

// 创建 rootFiber 作为首个 nextUnitOfWork
export function createRoot(element, container) {
  workInProgressRoot = {
    stateNode: container, // 记录对应的真实 dom 节点
    element: {
      // 挂载 element
      props: { children: [element] },
    },
    alternate: currentRoot,
  };
  nextUnitOfWork = workInProgressRoot;
}

// 执行当前工作单元任务并设置下一个要执行的工作单元
function performUnitOfWork(workInProgress) {
  // 根据 fiber 创建对应 dom
  if (!workInProgress.stateNode) {
    // 若当前 fiber 没有 stateNode，则根据 fiber 挂载的 element 的属性创建
    workInProgress.stateNode = renderDom(workInProgress.element);
  }

  // 迭代处理函数组件、类组件、列表渲染和 children 等情况
  const children = workInProgress.element?.props?.children;
  if (children) {
    let elements = Array.isArray(children) ? children : [children];
    elements = handleElements(elements);
    reconcileChildren(workInProgress, elements);
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

// 列表渲染、条件渲染、React 组件等情况进行处理
function handleElements(children) {
  let result = [];
  children.forEach((child) => {
    if (Array.isArray(child)) {
      // 如果 child 时数组，打平数组
      result = result.concat(handleElements(child));
    } else if (child?.type?.toString() === 'Symbol(react.fragment)') {
      // fragment 处理，直接对其 children 处理
      let children = child.props.children;
      if (children) {
        const elements = Array.isArray(children) ? children : [children];
        result = result.concat(handleElements(elements));
      }
    } else if (typeof child?.type === 'function') {
      // react 组件的处理
      if (child?.type.prototype.isReactComponent) {
        // 类组件
        const { props, type: Comp } = child;
        const component = new Comp(props);
        const jsx = component.render();
        result = result.concat(handleElements([jsx]));
      } else {
        // 函数组件
        const { props, type: Fn } = child;
        const jsx = Fn(props);
        result = result.concat(handleElements([jsx]));
      }
    } else if (!child) {
      // 条件渲染为假时，忽略其渲染
    } else {
      result.push(child);
    }
  });
  return result;
}

// 处理循环和中断逻辑
function workLoop(deadline) {
  let shouldYield = false;
  while (nextUnitOfWork && !shouldYield) {
    // 循环执行工作单元任务
    performUnitOfWork(nextUnitOfWork);
    shouldYield = deadline.timeRemaining() < 1;
  }
  if (!nextUnitOfWork && workInProgressRoot) {
    // 表示进入 commit 阶段
    commitRoot(workInProgressRoot);
    currentRoot = workInProgressRoot;
    workInProgressRoot = null;
  }
  requestIdleCallback(workLoop);
}

requestIdleCallback(workLoop);
