export function reconcileChildren(workInProgress, elements) {
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
