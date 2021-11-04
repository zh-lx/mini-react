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

  // 迭代处理函数组件、类组件、列表渲染和 children 等情况
  const children = workInProgress.element?.props?.children;
  if (children) {
    let elements = Array.isArray(children) ? children : [children];
    elements = handleElements(elements);
    // element 存在，则遍历其挂载到 fiber 树上
    let index = 0; // 当前遍历的子元素在父节点下的下标
    let prevSibling = null; // 记录上一个兄弟节点

    while (index < elements.length) {
      // 遍历子元素
      const element = elements[index];
      // 创建新的 fiber
      const newFiber = {
        element: Array.isArray(element) // 针对嵌套数组处理
          ? {
              type: Symbol('react.fragment'),
              props: {
                children: element,
              },
            }
          : element,
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
