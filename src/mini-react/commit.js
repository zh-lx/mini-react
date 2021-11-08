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
  if (fiber.flag === 'Placement') {
    // 添加 dom
    const targetPositionDom = parentDom.childNodes[fiber.index]; // 要插入到那个 dom 之前
    if (targetPositionDom) {
      // targetPositionDom 存在，则插入
      parentDom.insertBefore(fiber.stateNode, targetPositionDom);
    } else {
      // targetPositionDom 不存在，插入到最后
      parentDom.appendChild(fiber.stateNode);
    }
  }

  commitWork(fiber.sibling);
}
