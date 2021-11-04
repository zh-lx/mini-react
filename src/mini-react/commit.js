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
  if (fiber) {
    let parentDom = fiber.return.stateNode;
    if (fiber.flag === 'Placement') {
      // 添加 dom
      const target = parentDom.childNodes[fiber.index];
      if (!target) {
        parentDom.appendChild(fiber.stateNode);
      } else {
        parentDom.insertBefore(fiber.stateNode, target);
      }
    } else if (fiber.flag === 'Update') {
      const { children, ...newAttributes } = fiber.element.props;
      const oldAttributes = Object.assign({}, fiber.alternate.element.props);
      delete oldAttributes['children'];
      updateAttributes(fiber.stateNode, newAttributes, oldAttributes);
    } else if (fiber.flag === 'Deletion') {
      parentDom.removeChild(fiber.stateNode);
      return;
    }
    // 深度优先遍历，先遍历 child，后遍历 sibling
    commitWork(fiber.child);
    commitWork(fiber.sibling);
  }
}
