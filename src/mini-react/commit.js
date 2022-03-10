// 从根节点开始 commit
export function commitRoot(rootFiber) {
  commitWork(rootFiber.child);
}

// 递归执行 commit，此过程不中断
function commitWork(fiber) {
  if (!fiber) {
    return;
  }
  // 深度优先遍历，先遍历 child，后遍历 sibling
  commitWork(fiber.child);
  let parentDom = fiber.return.stateNode;
  if (fiber.stateNode) {
    parentDom.appendChild(fiber.stateNode);
  }
  commitWork(fiber.sibling);
}
