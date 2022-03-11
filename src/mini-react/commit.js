import { updateAttributes } from './react-dom';
import { getDeletions } from './fiber';

// 从根节点开始 commit
export function commitRoot(rootFiber) {
  const deletions = getDeletions();
  deletions.forEach(commitWork);

  commitWork(rootFiber.child);
}

// 递归执行 commit，此过程不中断
function commitWork(fiber) {
  if (!fiber) {
    return;
  }

  let parentDom = fiber.return.stateNode;
  if (fiber.flag === 'Deletion') {
    if (typeof fiber.element?.type !== 'function') {
      parentDom.removeChild(fiber.stateNode);
    }
    return;
  }

  // 深度优先遍历，先遍历 child，后遍历 sibling
  commitWork(fiber.child);
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
  } else if (fiber.flag === 'Update') {
    const { children, ...newAttributes } = fiber.element.props;
    const oldAttributes = Object.assign({}, fiber.alternate.element.props);
    delete oldAttributes.children;
    updateAttributes(fiber.stateNode, newAttributes, oldAttributes);
  }

  commitWork(fiber.sibling);
}
