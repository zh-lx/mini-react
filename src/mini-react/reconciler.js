import { deleteFiber } from './fiber';

export function reconcileChildren(workInProgress, elements) {
  let index = 0; // 当前遍历的子元素在父节点下的下标
  let prevSibling = null; // 记录上一个兄弟节点
  let oldFiber = workInProgress?.alternate?.child; // 对应的旧 fiber

  while (index < elements.length || oldFiber) {
    // 遍历 elements 和 oldFiber
    const element = elements[index];
    // 创建新的 fiber
    let newFiber = null;
    const isSameType =
      element?.type &&
      oldFiber?.element?.type &&
      element.type === oldFiber.element.type;

    // 添加 flag 副作用
    if (isSameType) {
      // type相同，表示更新
      newFiber = {
        element: {
          ...element,
          props: element.props,
        },
        stateNode: oldFiber.stateNode,
        return: workInProgress,
        alternate: oldFiber,
        flag: 'Update',
      };
    } else {
      // type 不同，表示添加或者删除
      if (element || element === 0) {
        // element 存在，表示添加
        newFiber = {
          element,
          stateNode: null,
          return: workInProgress,
          alternate: null,
          flag: 'Placement',
          index,
        };
      }
      if (oldFiber) {
        // oldFiber存在，删除 oldFiber
        oldFiber.flag = 'Deletion';
        deleteFiber(oldFiber);
      }
    }

    if (oldFiber) {
      // oldFiber 存在，则继续遍历其 sibling
      oldFiber = oldFiber.sibling;
    }

    if (index === 0) {
      // 如果下标为 0，则将当前fiber设置为父 fiber 的 child
      workInProgress.child = newFiber;
      prevSibling = newFiber;
    } else if (newFiber) {
      // newFiber 和 prevSibling 存在，通过 sibling 作为兄弟 fiber 连接
      prevSibling.sibling = newFiber;
      prevSibling = newFiber;
    }
    index++;
  }
}
