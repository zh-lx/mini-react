## 前言(必看)
本章将基于 react17 版本实现一个 mini react，涵盖了 react 源码所有的知识点例如 fiber 架构、render 和 commit 阶段、diff 算法、类组件、函数组件、hooks 等绝大部分 react 原理的知识点。

<b>强烈建议对照我仓库的 [commit记录](https://github.com/zh-lx/mini-react/commits/main) 来看本文，里面有本文每一步的代码提交，你可以清晰的看到每一步的代码变动情况：</b>
![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/58bb8cc3aac04c3ca608a4a0fe877504~tplv-k3u1fbpfcp-watermark.image?)
<b>本文的每节标题中带有 👉 标志的即有对应的 commit 记录，点击标题链接也可直接跳转</b>

## [一: 初始化项目 👉](https://github.com/zh-lx/mini-react/commit/2fbbb63bf6686fd301f1418dc07a6bfe255db895)
首先我们通过 react 官方的脚手架 `create-react-app` 初始化一个 react 项目，在终端执行如下指令：
```
create-react-app mini-react
```
然后执行 `cd ./mini-react` 进入到我们的项目，将多余的文件和代码移除，只保留 `index.js` 和 `index.css` 文件即可，初始化后的项目目录结构如下：
```
📦mini-react
 ┣ 📂public
 ┣ 📂src
 ┃ ┣ 📜index.css
 ┃ ┗ 📜index.js
 ┣ 📜.gitignore
 ┣ 📜package.json
 ┣ 📜README.md
 ┗ 📜yarn.lock
```
`index.js` 文件中，包含一个 jsx 结构，它包含了类组件、函数组件、普通 dom、条件渲染和列表渲染等多种类型的 jsx 内容（后面会用于我们渲染时要考虑的多种情况的处理），然后通过 `ReactDOM.render`将其渲染在页面上，代码如下：
```js
import { Component } from 'react';
import ReactDOM from 'react-dom';
import './index.css';

class ClassComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    return (
      <div className="class-component">
        <div>this is a class Component</div>
        <div>prop value is: {this.props.value}</div>
      </div>
    );
  }
}

function FunctionComponent(props) {
  return (
    <div className="function-component">
      <div>this is a function Component</div>
      <div>prop value is: {props.value}</div>
    </div>
  );
}

const jsx = (
  <div className="deep1-box">
    <ClassComponent value={666} />
    <FunctionComponent value={100} />
    <div className="deep2-box-1">
      <a href="https://github.com/zh-lx/mini-react">mini react link</a>
      <p style={{ color: 'red' }}> this is a red p</p>
      <div className="deep3-box">
        {true && <div>condition true</div>}
        {false && <div>condition false</div>}
        <input
          type="button"
          value="say hello"
          onClick={() => {
            alert('hello');
          }}
        />
      </div>
    </div>
    <div className="deep2-box-2">
      {['item1', 'item2', 'item3'].map((item) => (
        <li key={item}>{item}</li>
      ))}
    </div>
  </div>
);

ReactDOM.render(jsx, document.getElementById('root')); 
```
`index.css` 内容主要是给各种类名添加对应的样式，用以在页面的视觉效果上区分它们的层级关系，代码如下：
```css
.deep1-box {
  border: 1px solid rgb(146, 89, 236);
  padding: 8px;
}
.class-component {
  border: 1px solid rgb(228, 147, 147);
  padding: 8px;
}
.function-component {
  margin-top: 8px;
  padding: 8px;
  border: 1px solid rgb(133, 233, 120);
}
.deep2-box-1 {
  margin-top: 8px;
  padding: 8px;
  border: 1px solid rgb(233, 224, 107);
}
.deep3-box {
  padding: 8px;
  border: 1px solid rgb(55, 189, 241);
}
.deep2-box-2 {
  margin-top: 8px;
  padding: 8px;
  border: 1px solid rgb(23, 143, 77);
}
```
如此一来，项目的初始化就完成了，页面的效果如图所示：
![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/95b7775d25604a12a4ce57d10081ff1f~tplv-k3u1fbpfcp-watermark.image?)
接下来进入到我们相关的源码实现环节。
## 二: 实现 ReactDOM.render
我们创建项目用的 react 版本是 17.0.2，所以我们上面的 jsx 内容在运行时已经被 babel 编译为了 `React.Element` 的形式，不需要像 React16.x 及之前的版本需要 `React.createElement` api 进行转换了（这方面的内容可以看我之前的文章 [jsx 转换及 React.createElement](https://juejin.cn/post/7015855371847729166)）。

所以我们不需要额外实现 `React.createElement` 这个 api 了，直接从 `ReactDOM.render` 的实现开始。

### [创建 ReactDOM.render 👉](https://github.com/zh-lx/mini-react/commit/a844706548f3708b7b4ba1647edb67beacf3425c)
首先我们在 src 目录下创建一个名为 mini-react 的文件夹，用于保存我们自己实现的 react 源码，然后在 `/src/mini-react` 目录下创建一个 `react-dom.js` 文件，在里面导出挂载有 `render` 函数的 `ReactDOM` 对象，`render` 函数要做的事情就是接收 element 和 container 两个参数，并将 element 渲染为真实 dom 挂载到 container 上。<br/>
`src/mini-react/react-dom.js` 代码如下：
```js
function render(element, container) {
  const dom = renderDom(element);
  container.appendChild(dom);
}

// 将 React.Element 渲染为真实 dom
function renderDom(element) {}

const ReactDOM = {
  render,
};
export default ReactDOM;
```
### [根据 React.element 创建 dom 👉](https://github.com/zh-lx/mini-react/commit/b5ef737086a416d8daf6546f3c7765e73a412413)
接下来我们要做的在 `renderDom` 函数中实现根据 React.element 创建真实 dom，React.element 的结构在之前 [jsx 转换及 React.createElement](https://juejin.cn/post/7015855371847729166#heading-3) 篇中讲过，这里我们也可以再在控制台打印一下 jsx 的内容：
![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/3314766840674717aaae3e4c37ef031e~tplv-k3u1fbpfcp-watermark.image?)
所以我们要将 React.element 渲染为 dom，主要就是看 React.element 本身的类型以及它的 `type` 和 `props` 参数，所以接下来根据我们上面的 jsx 不同类型的元素，在将 React.element 转换为真实 dom 时要考虑如下情况：
1. 当 element 为假 (!element === true) 且不为 0 时，表示条件渲染的假值，不进行渲染(或者通过 `document.createDocumentFragment` 创建空的文档节点)
2. 当 element 自身为 string 类型时，表示为文本节点，通过调用 `document.createTextNode` 进行创建
3. 当 element 自身为 number 类型时，将其转换为 string 类型，然后通过调用 `document.createTextNode` 创建文本节点
4. 当 element 自身为 Array 类型是，表示为数组(例如 map 返回的元素数组)，需要通过一个 fragment 挂载所有的数组元素，再将 fragment 挂载到对应的父节点下
5. 当 element 的 `type` 为 string 类型时，表示为常规的 dom 元素，直接调用 `document.createElement` 创建 dom。
6. 当 element 的 `type` 为 function 类型时，表示类组件或者函数组件，需要针对处理
7. 如果 element 的 children 不为 null，需要递归创建子元素
8. 还有其他的情况如 react 的一些内置组件如 `React.fragment`、`Context`、`Portal` 等，我们以实现 react 主功能为主，暂时不考虑这些情况了

完整的 `renderDom` 的内容如下：
```js
// 将 React.Element 渲染为真实 dom
function renderDom(element) {
  let dom = null; // 要返回的 dom

  if (!element && element !== 0) {
    // 条件渲染为假，返回 null
    return null;
  }

  if (typeof element === 'string') {
    // 如果 element 本身为 string，返回文本节点
    dom = document.createTextNode(element);
    return dom;
  }

  if (typeof element === 'number') {
    // 如果 element 本身为 number，将其转为 string 后返回文本节点
    dom = document.createTextNode(String(element));
    return dom;
  }

  if (Array.isArray(element)) {
    // 列表渲染
    dom = document.createDocumentFragment();
    for (let item of element) {
      const child = renderDom(item);
      dom.appendChild(child);
    }
    return dom;
  }

  const {
    type,
    props: { children },
  } = element;

  if (typeof type === 'string') {
    // 常规 dom 节点的渲染
    dom = document.createElement(type);
  } else if (typeof type === 'function') {
    // React组件的渲染
    if (type.prototype.isReactComponent) {
      // 类组件
      const { props, type: Comp } = element;
      const component = new Comp(props);
      const jsx = component.render();
      dom = renderDom(jsx);
    } else {
      // 函数组件
      const { props, type: Fn } = element;
      const jsx = Fn(props);
      dom = renderDom(jsx);
    }
  } else {
    // 其他情况暂不考虑
    return null
  }

  if (children) {
    // children 存在，对子节点递归渲染
    const childrenDom = renderDom(children);
    if (childrenDom) {
      dom.appendChild(childrenDom);
    }
  }

  return dom;
}
```
然后在我们的 `/src/index.js` 中引入我们自己写的 `react-dom.js` 替换 `react-dom` 包：
```diff
import React from 'react';
- import ReactDOM from 'react-dom'; 
+ import ReactDOM from './mini-react/react-dom';
import './index.css';
// ...
```
运行之后可以看到，现在我们的页面中已经渲染出了相关的 dom 元素了：
![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/c4a19bc267724f16bcb8e6bdd22b3ecf~tplv-k3u1fbpfcp-watermark.image?)

### [更新 dom 属性 👉](https://github.com/zh-lx/mini-react/commit/79a61e710053bcbe58e7bdaf2f3295654a49f904)
上一步我们的页面中已经渲染出了相关的 dom 元素，但是元素的属性例如我们给 `a` 标签添加的 href、`p` 标签的 style、以及元素的 classname 等等都没生效，而且我们的 `input[button]` 显示的是输入框，说明我们元素上面挂载的属性都没有生效。

所以接下来我们需要对元素的各种属性进行挂载，通过打印我们可以得知，元素的属性都是在 React.element 的 `props` 上：
![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/616e761e1d8e4d69a45659ef517433ba~tplv-k3u1fbpfcp-watermark.image?)
针对元素 `props` 中的各种属性，我们需要考虑如下情况：
1. 如果是 `children`，表示是元素的子元素，不是其属性
2. 如果是 `className`，要将其转换为元素对应的 class
3. 如果是 `style`，需要将对象中的键值对取出一一更新到元素的样式上
4. 如果是以 `on` 开头的属性，说明是事件，需要作为事件处理
5. 其他属性直接挂载
我们用一个 `updateAttributes` 函数处理元素属性的更新，在 `react-dom.js` 文件中添加如下代码：
```js
// 更新 dom 属性
function updateAttributes(dom, attributes) {
  Object.keys(attributes).forEach((key) => {
    if (key.startsWith('on')) {
      // 事件的处理
      const eventName = key.slice(2).toLowerCase();
      dom.addEventListener(eventName, attributes[key]);
    } else if (key === 'className') {
      // className 的处理
      const classes = attributes[key].split(' ');
      classes.forEach((classKey) => {
        dom.classList.add(classKey);
      });
    } else if (key === 'style') {
      // style处理
      const style = attributes[key];
      Object.keys(style).forEach((styleName) => {
        dom.style[styleName] = style[styleName];
      });
    } else {
      // 其他属性的处理
      dom[key] = attributes[key];
    }
  });
}
```
然后在 `renderDom` 函数中调用 `updateAttributes` 函数：
```diff
function renderDom(element) {
  // ...
  const {
    type,
-   props: { children },
+   props: { children, ...attributes },
  } = element
  // ...  
+ updateAttributes(dom, attributes);
  return dom;
}
```
再来看我们的页面效果，元素属性都已经挂载上去了：
![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/7b486583f939475aadb652bff5252ebf~tplv-k3u1fbpfcp-watermark.image?)
## 三: 实现 fiber 架构
我们上面 `renderDom` 的代码中，有一个问题，在类组件
、函数组件、列表渲染以及 children 等情况下，我们都会去递归调用 `renderDom` 函数。如果我们的组件树特别的大，那么我们的 mini-react 会一直递归去渲染，导致整个渲染完成的时间过长。由于 js 是单线程，如果此时有更高级别的任务例如用户输入、动画等，这些任务就需要等待，那么用户视觉上就会感到页面卡顿。

这就来到了 react 的核心概念之一 —— fiber，我们将大的渲染任务拆分为多个小的渲染任务，每个小任务都是一个工作单元，用 fiber 结构表示这一个工作单元，fiber 与 fiber 之间构成了一颗 fiber 树。（如果你不知道什么是 fiber，可以看我前面的文章 [深入理解 fiber](https://juejin.cn/post/7016512949330116645)）。然后在浏览器的每一帧优先执行高优先级任务，空闲时间去执行低优先级任务。

 [深入理解 fiber](https://juejin.cn/post/7016512949330116645) 中讲过，fiber 与 fiber 之间通过 `child`、`sibling`、`return` 几个字段相互连接构成了一颗 fiber 树。react 处理任务时，会从 root fiber 开始，采用深度优先遍历的策略处理 fiber：处理完当前 fiber 后，如果有 child，则继续处理 child；如果没有 child，则处理其 sibling；当一个 fiber 的child 和 sibling 都处理完后，通过 return 返回上级节点继续处理。如我们此应用中的 jsx 结构，对应的 fiber 树结构如下：
![fiber.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/c358c8e604d1414885cdb7c24568598a~tplv-k3u1fbpfcp-watermark.image?)
上图中箭头上的数字就是 fiber 的执行顺序。
### [创建 rootFiber 和 nextUnitOfWork 👉](https://github.com/zh-lx/mini-react/commit/c6441df9abef4eb09f65be2809789d2cd77d44e2)
我们在 `/src/mini-react` 目录下新建 `fiber.js` 文件，用来存储和 fiber 相关的实现代码。首先因为我们是深度优先遍历去进行迭代处理任务单元及 fiber，所以我们需要一个全局的 `nextUnitOfWork` 变量，作为下一个要处理的任务单元。

然后我们说过了 fiber 的迭代是从 root fiber 开始的，因此我们需要根据 `ReactDOM.render` 接收的 `element` 和 `container` 参数，创建一个 `rootFiber`，指向 root fiber。每个 fiber 上都需要挂载 `stateNode` 和 `element` 属性，`stateNode` 指向根据此 fiber 创建的真实 dom 节点，用于渲染，`element` 指向 fiber 所对应的 `React.element`。`rootFiber` 创建好之后，将 `nextUnitOfWork` 指向它，它会作为第一个要处理的任务单元。

`/src/mini-react/fiber.js` 代码如下：
```js
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
```
然后在 `/src/mini-react/react-dom.js` 文件引入 `createRoot` 函数并在 `render` 函数中调用，传入 element 和 container 去创建 root fiber：
```diff
+ import { createRoot } from './fiber';

function render(element, container) {
- const dom = renderDom(element);
- container.appendChild(dom);
+ createRoot(element, container);
}
```
### [递归改成迭代 👉](https://github.com/zh-lx/mini-react/commit/e6967c0374060eb110e83469e1b696c6ffc38855)
#### 去掉递归逻辑
接下里我们要将递归逻辑改成迭代去执行，所以我们先将 `renderDom` 中所有的递归逻辑去掉，并将其导出以便后面我们再 `/src/mini-react/fiber.js` 文件中引用：
```diff
// 将 React.Element 渲染为真实 dom
function renderDom(element) {
  //...

- if (Array.isArray(element)) {
-   // 列表渲染
-   dom = document.createDocumentFragment();
-   for (let item of element) {
-     const child = renderDom(item);
-     dom.appendChild(child);
-   }
-   return dom;
- }

  const {
    type,
    props: { children },
  } = element;

  if (typeof type === 'string') {
    // 常规 dom 节点的渲染
    dom = document.createElement(type);
- } else if (typeof type === 'function') {
-   // React组件的渲染
-   if (type.prototype.isReactComponent) {
-     // 类组件
-     const { props, type: Comp } = element;
-     const component = new Comp(props);
-     const jsx = component.render();
-     dom = renderDom(jsx);
-  } else {
-     // 函数组件
-     const { props, type: Fn } = element;
-     const jsx = Fn(props);
-     dom = renderDom(jsx);
-   }
  } else {
    // 其他情况暂不考虑
    return null
  }

- if (children) {
-   // children 存在，对子节点递归渲染
-   const childrenDom = renderDom(children);
-   if (childrenDom) {
-     dom.appendChild(childrenDom);
-   }
- }

  // ...
}
```
#### 根据 fiber 创建 dom
然后我们再 `/src/mini-react/fiber.js` 文件中引入 `renderDom` 函数，并新创建一个 `performUnitOfWork` 函数，里面包含迭代处理 fiber 的逻辑。

首先我们要根据 fiber 去创建 dom，当 fiber 的 `stateNode` 属性为空时，表示还没有对其创建 dom，所以我们调用 `renderDom` 函数，根据 fiber 的 `element` 属性去创建对应的 dom，并将其挂载到父节点下。

父节点根据 fiber 的 `return` 属性去寻找父 fiber，值得注意的是，由于我们在 `renderDom` 中去除了迭代逻辑后，在 React 组件或者条件渲染为假值时返回的 dom 会为空。所以我们只有在创建好的 `stateNode` 不为空时才进行挂载，同样的道理，向上通过 `return` 寻找的父 fiber 的 `stateNode` 也可能为空，这种情况我们继续通过 `return` 向上寻找，直到找到 `stateNode` 不为空的 fiber 节点再进行挂在即可。

代码如下：

```js
import { renderDom } from './react-dom';

// ...

// 执行当前工作单元并设置下一个要执行的工作单元
function performUnitOfWork(workInProgress) {
  if (!workInProgress.stateNode) {
    // 若当前 fiber 没有 stateNode，则根据 fiber 挂载的 element 的属性创建
    workInProgress.stateNode = renderDom(workInProgress.element);
  }
  if (workInProgress.return && workInProgress.stateNode) {
    // 如果 fiber 有父 fiber且有 dom
    // 向上寻找能挂载 dom 的节点进行 dom 挂载
    let parentFiber = workInProgress.return;
    while (!parentFiber.stateNode) {
      parentFiber = parentFiber.return;
    }
    parentFiber.stateNode.appendChild(workInProgress.stateNode);
  }
}
```
#### 构造 fiber 树
现在我们只有 root fiber 一个 fiber，我们需要构造 fiber 树结构，所以要根据 React.element 去创建对应的 fiber，并通过 `child`、 `sibling` 和 `return` 这几个字段的形成 fiber 树。父子关系除了 React.element 有 `children` 属性这种情况外，React 组件以及列表渲染，也会构成父子关系。所以我们做如下考虑：
1. 当 React.element 的 `type` 属性是 `function` 时，表示 react 组件，我们将其渲染后所得到的 jsx 作为 children 处理。
2. 如果 React.element 的 `type` 属性是 `Array`，表示列表渲染，此时 array 这个节点时没有意义的，不需要形成 fiber，所以我们直接将 array 中的子节点打平放到与 array 同级的 children 数组中进行处理，生成对应 fiber
3. 当前 fiber 的 element 属性的 `children` 不为空时，根据 children 去迭代构建 fiber 树

上面三种情况，无论 children 是一个节点还是多个节点的数组，为了代码简洁我们最终都将其处理为数组形式。然后 children 数组的第一个节点生成的 fiber 通过当前 fiber 的 `child` 属性连接到 fiber 树中，其他的 fiber 通过上一个子 fiber 的 `sibling` 属性链接。

代码如下：
```js
// 执行当前工作单元并设置下一个要执行的工作单元
function performUnitOfWork(workInProgress) {
  // 根据fiber创建 dom
  // ...

  let children = workInProgress.element?.props?.children;
  let type = workInProgress.element?.type;
  
  if (typeof type === 'function') {
    // 当前 fiber 对应 React 组件时，对其 return 迭代
    if (type.prototype.isReactComponent) {
      // 类组件，通过生成的类实例的 render 方法返回 jsx
      const { props, type: Comp } = workInProgress.element;
      const component = new Comp(props);
      const jsx = component.render();
      children = [jsx];
    } else {
      // 函数组件，直接调用函数返回 jsx
      const { props, type: Fn } = workInProgress.element;
      const jsx = Fn(props);
      children = [jsx];
    }
  }

  if (children || children === 0) {
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
        // 如果下标为 0，则将当前 fiber 设置为父 fiber 的 child
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
```

#### 设置下一个工作单元
如我们这一节的开头所说，fiber 树的遍历采用深度优先遍历，如果当前 fiber 有 `child`，则设置 `child` 作为下一个工作单元；若无 `child` 但是有 `sibling`，则设置 `sibling` 作为下一个工作单元；如果都没有则深度优先遍历通过 `return` 返回父 fiber。代码如下：
```js
function performUnitOfWork(fiber) {
  // 根据 fiber 创建 dom
  // ...

  // 构建 fiber 树
  // ...

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
```
### [创建 workLoop 👉](https://github.com/zh-lx/mini-react/commit/5b5c5faa7faa354d091dff1ae7e3c4cab1128322)
现在我们迭代处理的逻辑都实现完成了，那么我们在什么时间出执行迭代逻辑呢？我们要在 `/src/mini-react/fiber.js` 中创建一个名为 `workLoop` 函数，这个函数中我们会浏览器每帧的空闲时间段迭代处理 `nextUnitOfWork`，若一帧处理不完，则中断当前迭代，留到下一帧继续处理。代码如下：
```js
// 处理循环和中断逻辑
function workLoop(deadline) {
  let shouldYield = false;
  while (nextUnitOfWork && !shouldYield) {
    // 循环执行工作单元任务
    performUnitOfWork(nextUnitOfWork);
    shouldYield = deadline.timeRemaining() < 1;
  }
  requestIdleCallback(workLoop);
}
```
我们使用 [requestIdleCallback](https://developer.mozilla.org/zh-CN/docs/Web/API/Window/requestIdleCallback) 函数在浏览器每帧空闲时期去调用回调函数 `workLoop`，`requestIdleCallback`会给回调函数传入一个 deadline 参数我们可以使用它来检查当前帧还有多少时间浏览器空闲时间。我们用一个 `shouldYied` 的变量表示是否应该中断当前循环，当 `deadline.timeRemaining() < 1` 时， `shouldYied` 为 true，会中断当前迭代，留到下一帧再继续执行。(由于 `requestIdleCallback` 执行较慢及兼容性问题，React 现在不再使用 `requestIdleCallback` 了，而是自己实现了类似的功能，不过这里我们为了方便还是直接使用就行，思想上是相同的。)

最后我们在 `/src/mini-react/fiber.js` 中初始化通过 `requestIdleCallback` 去调用 `workLoop` 就大功告成了:
```js
requestIdleCallback(workLoop);
```
## [四: render 和 commit 分离 👉](https://github.com/zh-lx/mini-react/commit/fce38e53a0980deaab6685f9c2073c2e5058d1a8)
上面的代码中还有一个问题，看下面这一段代码，我们在迭代的过程中，是从 root fiber 开始向子 fiber 迭代的，每处理完一个 fiber，就创建相应 dom 挂载到页面上。但是我们的迭代任务是可中断的，如果中途中断，那么在页面上用户就会看到不完整的 ui：
```js
function performUnitOfWork(fiber) {
  // ...
  
  if (workInProgress.return && workInProgress.stateNode) {
    // 如果 fiber 有父 fiber且有 dom
    // 向上寻找能挂载 dom 的节点进行 dom 挂载
    let parentFiber = workInProgress.return;
    while (!parentFiber.stateNode) {
      parentFiber = parentFiber.return;
    }
    parentFiber.stateNode.appendChild(workInProgress.stateNode);
  }
  
  // ...
}
```
这并不是我们理想的效果，我们可以考虑将所有的 dom 都创建完成之后再挂载到页面上。

这就来到了 react 的 render 和 commit 阶段，我们在 render 阶段去只处理工作单元，创建 dom 但是不挂载  dom，等到所有的工作单元全部处理完成之后，再在 commit 阶段同步执行 dom 的挂载。

所以总结下我们要做的工作如下：
1. `performUnitOfWork` 中移除 dom 挂载的操作，只处理 fiber 创建对应 dom 但是并不挂载
2. 实现一个 `commitRoot` 函数，执行 dom 的挂载操作，这个阶段是同步执行的，不可被打断
3. 在 `workLoop` 中，当 nextUnitOfWork 为 null 且 `rootFiber` 存在时，表示 render 阶段执行结束，开始调用 `commitRoot` 函数进入 commit 阶段。

在 `/src/mini-react` 文件夹下新建 `commit.js` 文件，里面导出 `commitRoot` 文件，由于这个过程是不可中断的，所以我们递归去执行 dom 的挂载。同时我们的挂载采用字底向上的挂载，先挂载子节点，最后在挂载父节点，这样可以减少页面的重排和重绘，节省性能。
```js
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
  parentDom.appendChild(fiber.stateNode);
  commitWork(fiber.sibling);
}
```
由于是自底向上挂载 dom，所以当 fiber 对应 React 组件时，我们可以在 `renderDom` 函数中返回一个 `document.createDocumentFragment()` 文档节点去挂载组件下面的子节点，这样就不用考虑 `stateNode` 为空的情况了（条件渲染为假值的情况在迭代创建 fiber 的过程中已经被过滤了，所以也不需要考虑）。这样有利于后续我们自己实现类组件和函数组件相关的 api。`/src/mini-react/react-dom.js` 文件改动如下：
```diff
// 将 React.Element 渲染为真实 dom
export function renderDom(element) {
  // ...

  if (typeof type === 'string') {
    // 常规 dom 节点的渲染
    dom = document.createElement(type);
+ } else if (typeof type === 'function') {
+   // React 组件的渲染
+   dom = document.createDocumentFragment();
  } else {
    // 其他情况暂不考虑
    return null;
  }

  // ...
}
```
最后在 `/src/mini-react/fiber.js` 中引入 `/src/mini-react/commit.js` 中的 `commitRoot` 函数，并在 render 结束时调用该函数，commit 阶段结束则重置 rootFiber。同时去掉 `performUnitOfWork` 函数中的创建 dom 逻辑：
```diff
+ import { commitRoot } from './commit';

function performUnitOfWork(fiber) {
  // ...
  
- if (workInProgress.return && workInProgress.stateNode) {
-   // 如果 fiber 有父 fiber且有 dom
-   // 向上寻找能挂载 dom 的节点进行 dom 挂载
-   let parentFiber = workInProgress.return;
-   while (!parentFiber.stateNode) {
-     parentFiber = parentFiber.return;
-   }
-   parentFiber.stateNode.appendChild(workInProgress.stateNode);
- }
  
  // ...
}

// 处理循环和中断逻辑
function workLoop(deadline) {
  // ...
+ if (!nextUnitOfWork && rootFiber) {
+   // 表示进入 commit 阶段
+   commitRoot(rootFiber);
+   rootFiber = null;
+ }
  requestIdleCallback(workLoop);
}
```
## 五: diff 算法 —— 实现更新和删除
前面我们只说到了首次渲染时 dom 的创建过程，那么元素的删除和更新等情况又是如何处理的呢？这就来到了 react 又一大核心 —— diff 算法。关于 diff 算法的理解，同样可以看我之前的文章 [全面理解 diff 算法](https://juejin.cn/post/7020595059095666724)，在这里我们不过多展开了，直接进入到代码的实现环节。
### [current 和 workInProgess 👉](https://github.com/zh-lx/mini-react/commit/50a52fbb70b5e126eca4a479ad189237889234db)
我们在 diff 算法中讲过，diff 过程中，react 中有两棵 fiber 树：current fiber 树（上一次渲染时生成的 fiber 树）和 workInProgress fiber 树（本次渲染的 fiber 树），diff 过程实际上就是这两棵 fiber 树之间的 diff。

我们代码中每次 render 阶段执行的 fiber 树，实际上就是 workInProgress fiber 树，rootFiber 就是 workInProgress fiber 树的根结点，所以我们需要再维护一棵 current fiber 树。同时为了便于理解，我们将 `rootFiber` 更名为 `workInProgressRoot`:
```diff
- let rootFiber = null;
+ let workInProgressRoot = null; // 当前工作的 fiber 树,
+ let currentRoot = null; // 上一次渲染的 fiber 树
```
所有用到了 `rootFiber` 的地方全部更名为 `workInProgressRoot`，这里就不展开了。

然后我们之前的文章  [深入理解 fiber](https://juejin.cn/post/7016512949330116645) 中也讲过，workInProgress fiber 中有一个 `alternate` 属性，指向对应的 current fiber。在 react 更新流程（commit 阶段）结束后，会将当前的 currentRoot 指向 workInProgressRoot，代码如下：
```diff
// 创建 rootFiber 作为首个 nextUnitOfWork
export function createRoot(element, container) {
  workInProgressFiber = {
    stateNode: container, // 记录对应的真实 dom 节点
    element: {
      // 挂载 element
      props: { children: [element] },
    },
+   alternate: currentRoot
  };
  nextUnitOfWork = workInProgressFiber;
}

// ...

// 处理循环和中断逻辑
function workLoop(deadline) {
  // ...
- if (!nextUnitOfWork && rootFiber) {
+ if (!nextUnitOfWork && workInProgressRoot) {
    // 表示进入 commit 阶段
-   commitRoot(rootFiber);
+   commitRoot(workInProgressRoot);
    // commit 阶段结束，重置变量
-   rootFiber = null;
+   currentRoot = workInProgressRoot;
+   workInProgressRoot = null;
  }
  requestIdleCallback(workLoop);
}
```
### [创建 reconciler 👉](https://github.com/zh-lx/mini-react/commit/7eebaac428789ea2048c92661636378d686b42c7)
下面开始实现 diff 过程，diff 过程是以 `reconcileChildren` 为入口函数的，在 fiber 树的构建过程中，对 fiber 打上不同的 `flag` 副作用标签。在 `/src/mini-react` 目录下新建 `reconciler.js` 文件，其中导出 `reconcileChildren` 函数，将 `performUnitOfWork` 函数中的 fiber 构造 fiber 树逻辑迁移到该函数中。代码如下：
```js
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
```
在 `performUnitOfWork` 函数中移除构造 fiber 树的逻辑，并引入引入上面函数`reconcileChildren` 函数：
```diff
+ import { reconcileChildren } from './reconciler';

// 执行当前工作单元任务并设置下一个要执行的工作单元
function performUnitOfWork(workInProgress) {
  // 根据 fiber 创建对应 dom
  // ...

  // 迭代处理函数组件、类组件、列表渲染和 children 等情况
  // ...
  if (children || children === 0) {
    // children 存在时，对 children 迭代
    let elements = Array.isArray(children) ? children : [children];
    // 打平列表渲染时二维数组的情况（暂不考虑三维及以上数组的情形）
    elements = elements.flat();
-   // 移除此段构造 fiber 树的逻辑
+   reconcileChildren(workInProgress, elements);
  }

  // 设置下一个工作单元
  // ...
}
```
### [diff 并添加 flag 👉](https://github.com/zh-lx/mini-react/commit/538421d67d76e2e48ee5fcadbb0369a19fe963cc)
现在我们 `reconcileChildren` 函数中已经有了 elements 了，elements 使我们想要渲染到页面上的元素，为了使渲染性能最高，我们需要知道如何对旧的 dom 树进行操作的开销最小。所以我们需要就 elements 和旧的 fiber 进行 diff，与 elements 所对应的旧 fiber，就是 `workInProgress.alternate` 下的子元素了。

我们对 elements 和 oldFiber 同时遍历，根据 element 的 type 和 olderFiber 对应的 element type 去比较，并对 diff 的结果添加 flag 副作用标签：
- 如果 type 相同，表示是相同的元素，添加 `Update` 的 flag，直接更新 dom 元素的属性
- 如果 type 不同且新的 element 存在，添加 `Placement` 的 flag，表示需要创建新的 dom。同时还要对其添加 `index` 属性，记录在插入时在父节点下的下标位置
- 如果 type 不同且 oldFiber 存在，添加 `Deletion` 的 flag，表示需要对旧的 element 进行删除
（react 中使用 type 和 key 同时比较，这样做在某些情况下例如列表渲染列表项改变时更加高效，但由于实现较为麻烦我们这里只使用 type。同时 react 中除了删除、更新和添加还有其他的副作用标签，因此会使用 flags 二进制运算添加多个标签，这里我们也不考虑那么复杂的情况了。）

调整后的 `reconcileChildren` 代码如下：
```js
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
```
### [Placement —— 添加 dom 👉](https://github.com/zh-lx/mini-react/commit/d5d5f6e360417c8f4ff537270f84b0704742bd0f)
当 fiber 被打上 `Placement` 的 flag 标签时，表示添加元素，我们根据元素所对应 fiber 的 `index` 属性，去寻找要在父元素的哪一个子元素之前插入。如果 `parentDom.childNodes[fiber.index]` 存在，说明要在这个元素前插入，通过 `insertBefore` 插入元素；如果不存在，则说明要插入到父元素最后，直接通过 `appendChild` 插入。

代码如下：
```js
// 递归执行 commit，此过程不中断
function commitWork(fiber) {
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
  commitWork(fiber.sibling)
}
```
### [Update —— 更新 dom 👉](https://github.com/zh-lx/mini-react/commit/bc9053286848749fb9d1b0cbdd2c18f0b7daad76)
当 fiber 被打上 `Update` 的 flag 标签时，表示更新 dom，那么我们要对旧的 dom 中的属性及监听事件进行移除，并添加新的属性和监听事件。

这里我们直接对 `updateAttributes` 函数进行修改并导出，里面添加移除旧的属性的逻辑：
```js
export function updateAttributes(dom, attributes, oldAttributes) {
  if (oldAttributes) {
    // 有旧属性，移除旧属性
    Object.keys(oldAttributes).forEach((key) => {
      if (key.startsWith('on')) {
        // 移除旧事件
        const eventName = key.slice(2).toLowerCase();
        dom.removeEventListener(eventName, oldAttributes[key]);
      } else if (key === 'className') {
        // className 的处理
        const classes = oldAttributes[key].split(' ');
        classes.forEach((classKey) => {
          dom.classList.remove(classKey);
        });
      } else if (key === 'style') {
        // style处理
        const style = oldAttributes[key];
        Object.keys(style).forEach((styleName) => {
          dom.style[styleName] = 'initial';
        });
      } else {
        // 其他属性的处理
        dom[key] = '';
      }
    });
  }
  
  Object.keys(attributes).forEach((key) => {
    // ... 之前添加新属性的逻辑
  }
}
```
然后再 `/src/mini-react/commit.js` 中引入`updateAttributes` 函数，更新 dom 时去调用它：
```diff
+ import { updateAttributes } from './react-dom';
// ...

function commitWork(fiber) {
  // ...
  if (fiber.flag === 'Placement') {
    // ...
+  } else if (fiber.flag === 'Update') {
+    const { children, ...newAttributes } = fiber.element.props;
+    const oldAttributes = Object.assign({}, fiber.alternate.element.props);
+    delete oldAttributes.children;
+    updateAttributes(fiber.stateNode, newAttributes, oldAttributes);
  }
  commitWork(fiber.sibling)
}
```
### [Deletion —— 删除 dom 👉](https://github.com/zh-lx/mini-react/commit/5592e5f32743cbfc7066a87f3a3a85a6754f33e7)
当 fiber 被打上 `Deletion` 的 flag 标签时，表示删除元素，对于删除元素我们这里要思考两个问题：
1. 对于打上了 `Deletion` flag 的 fiber，说明是在之前 current fiber 树中有，但是 workInProgress fiber 树中没有的，那么我们在 workInProgress fiber 树中遍历是找不到它的。
2. 要删除的元素，只需要从它的父节点上直接删除它就行，不需要再去遍历整个 fiber 树
所以基于以上两点，我们需要一个全局的 `deletions` 数组，存储所有要删除 dom 的对应 fiber。

我们在 `/src/mini-react/fiber.js` 中，定义一个全局变量 `deletions`，同时导出获取 `deletions` 和向 `deletions` 中添加 fiber 的方法：
```js
let deletions = []; // 要执行删除 dom 的 fiber

// 将某个 fiber 加入 deletions 数组
export function deleteFiber(fiber) {
  deletions.push(fiber);
}

// 获取 deletions 数组
export function getDeletions() {
  return deletions;
}
```
然后在 `performUnitOfWork` 函数中，每次对 fiber 添加 `Deletion` 的 flag 副作用标签时，调用 `deleteFiber` 函数，将该 fiber 添加到 `deletions` 数组中：
```diff
+ import { deleteFiber } from './fiber';

export function reconcileChildren(workInProgress, elements) {
  // ...
  
  if (oldFiber) {
    // oldFiber存在，删除 oldFiber
    oldFiber.flag = 'Deletion';
+   deleteFiber(oldFiber);
  }
  
  // ...
}
```
然后我们在 `/src/mini-react/commit.js` 中，添加删除 dom 的相关逻辑，对于删除 dom，我们只要对 `deletions` 数组遍历一遍执行删除动作即可，删除完毕直接 return，不需要继续去执行递归操作了。调整后的 `commit.js` 内容如下（代码的删改请看 github 我本次 [commit]((https://github.com/zh-lx/mini-react/commit/5592e5f32743cbfc7066a87f3a3a85a6754f33e7)) 的变动）：
```js
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
```
最后还要记得，当本次 `commitRoot` 执行完毕后，在 `/src/mini-react/fiber.js` 中的 `workLoop` 函数将 `deletions` 数组置空：
```diff
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
+   deletions = [];
  }
  requestIdleCallback(workLoop);
}
```
### 检查效果
#### 代码
如此一来，我们添加、更新和删除 dom 的内容都实现了，我们在 `/src/index.js` 中，设置 5s 的延迟后改变一下 jsx 的内容。5s 后我们删除 `a` 标签、去掉 `p` 标签的红色字体样式，并且给 `li` 标签设置字体大小(此部分代码改动只做效果预览使用，不会提交上去)：
```js
import { Component } from 'react';
import ReactDOM from './mini-react/react-dom';
import './index.css';

class ClassComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    return (
      <div className="class-component">
        <div>this is a class Component</div>
        <div>prop value is: {this.props.value}</div>
      </div>
    );
  }
}

function FunctionComponent(props) {
  return (
    <div className="function-component">
      <div>this is a function Component</div>
      <div>prop value is: {props.value}</div>
    </div>
  );
}

const jsx = (
  <div className="deep1-box">
    <ClassComponent value={666} />
    <FunctionComponent value={100} />
    <div className="deep2-box-1">
      <a href="https://github.com/zh-lx/mini-react">mini react link</a>
      <p style={{ color: 'red' }}> this is a red p</p>
      <div className="deep3-box">
        {true && <div>condition true</div>}
        {false && <div>condition false</div>}
        <input
          type="button"
          value="say hello"
          onClick={() => {
            alert('hello');
          }}
        />
      </div>
    </div>
    <div className="deep2-box-2">
      {['item1', 'item2', 'item3'].map((item) => (
        <li key={item}>{item}</li>
      ))}
    </div>
  </div>
);

ReactDOM.render(jsx, document.getElementById('root'));

setTimeout(() => {
  const jsx = (
    <div className="deep1-box">
      <ClassComponent value={666} />
      <FunctionComponent value={100} />
      <div className="deep2-box-1">
        <p> this is a red p</p>
        <div className="deep3-box">
          {true && <div>condition true</div>}
          {false && <div>condition false</div>}
          <input
            type="button"
            value="say hello"
            onClick={() => {
              alert('hello');
            }}
          />
        </div>
      </div>
      <div className="deep2-box-2">
        {['item1', 'item2', 'item3'].map((item) => (
          <li style={{ fontSize: '20px' }} key={item}>
            {item}
          </li>
        ))}
      </div>
    </div>
  );

  ReactDOM.render(jsx, document.getElementById('root'));
}, 5000);
```
#### 预览
效果预览如下：
![Nov-11-2021 18-16-57.gif](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/e3045c9e08e046c2924719557456e129~tplv-k3u1fbpfcp-watermark.image?)
## 六: 实现 React.Component
现在我们 `/src/index` 中的 `React.Component` api 还是从 react 库中引用的，接下来我们要自己对其实现。
### [完善类组件功能 👉](https://github.com/zh-lx/mini-react/commit/6144a2d43143c6860ccb7a48182a1430ee07b1e7)
现在我们先完善一下我们的 ClassComponent 组件，添加一个点击按钮让 `count` 加 1 的功能：
```js
class ClassComponent extends Component {
  constructor(props) {
    super(props);
    this.state = { count: 0 };
  }

  addCount = () => {
    this.setState({
      count: this.state.count + 1,
    });
  };

  render() {
    return (
      <div className="class-component">
        <div>this is a class Component</div>
        <div>prop value is: {this.props.value}</div>
        <div>count is: {this.state.count}</div>
        <input type="button" value="add count" onClick={this.addCount} />
      </div>
    );
  }
}
```
### [实现 setState 👉](https://github.com/zh-lx/mini-react/commit/a0e9d46e2f3185e48f1edbd4601c291fdbb149af)
我们知道，类组件是通过类创建出一个实例，然后调用实例上的 `render` 方法去返回 jsx。我们执行 `setState` 时，需要改变 `state` 的值，然后触发类组件的更新去渲染新的 dom。

所以我们需要调整一下类组件的渲染逻辑，我们将 `performUnitOfWork` 函数中类组件迭代的逻辑抽离出来，新建一个 `updateClassComponent` 函数去进行扩展：
```diff
function performUnitOfWork(workInProgress) {
  // 当前 fiber 对应 React 组件时，对其 return 迭代
  if (type.prototype.isReactComponent) {
    // 类组件
-   const { props, type: Comp } = workInProgress.element;
-   const component = new Comp(props);
-   const jsx = component.render();
-   children = [jsx];
+   updateClassComponent(workInProgress);
  }

  // ...
}
```
然后再 `updateClassComponent` 函数中，我们比较 fiber.alternate 是否存在。如果存在，说明类组件之前渲染过，那我们复用之前的类实例（之前的类实例中保存着最新的 `state` 状态，不然重新创建类实例 `state` 状态会重置），然后在 `Component` 类上创建一个 `_UpdateProps` 方法，更新最新的 props；如果不存在，则调用类方法创建一个新的类实例，进行渲染。

代码如下：
```js
function updateClassComponent(fiber) {
  let jsx;
  if (fiber.alternate) {
    // 有旧组件，复用
    const component = fiber.alternate.component;
    fiber.component = component;
    component._UpdateProps(fiber.element.props);
    jsx = component.render();
  } else {
    // 没有则创建新组件
    const { props, type: Comp } = fiber.element;
    const component = new Comp(props);
    fiber.component = component;
    jsx = component.render();
  }

  reconcileChildren(fiber, [jsx]);
}
```
接下来我们在 `/src/mini-react` 中新建 `react.js` 文件，在里面自己实现一下 `Component` 及 `setState` 的相关逻辑Component 类包含以下逻辑
1. Component 类接受 props 参数，并挂载到 `this` 对象上
2. 在原型链上添加 `isReactComponent` 属性，用于 react 识别是类组件还是函数组件
3. 原型链上添加 `setState` 方法，其接受一个 `object` 或者是 `function` 类型的参数，如果是 `function` 类型，该函数接受 `this.state` 和 `this.props` 回参，返回更新后的 state 值，将其合并至 `this.state` 中；如果是 `object` 类型，直接将其合并至 `this.state` 中。然后调用 `commitRender` 函数去出发更新(接下来会说这个函数的逻辑)
4. 原型链上添加 `_UpdateProps` 方法，用于更新类组件时更新 props
综上的逻辑，`/src/mini-react/react.js` 的内容如下：
```js
import { commitRender } from './fiber';
export class Component {
  constructor(props) {
    this.props = props;
  }
}
Component.prototype.isReactComponent = true;

Component.prototype.setState = function (param) {
  if (typeof param === 'function') {
    const result = param(this.state, this.props);
    this.state = {
      ...this.state,
      ...result,
    };
  } else {
    this.state = {
      ...this.state,
      ...param,
    };
  }

  commitRender();
};

Component.prototype._UpdateProps = function (props) {
  this.props = props;
};
```
然后回到上面提到的 `commitRender` 函数，这里面的逻辑比较简单，就是将当前的 `currentRoot` 作为 `workInProgressRoot`，并将 `nextUnitOfWork` 指向它，去触发 render：
```js
export function commitRender() {
  workInProgressRoot = {
    stateNode: currentRoot.stateNode, // 记录对应的真实 dom 节点
    element: currentRoot.element,
    alternate: currentRoot,
  };
  nextUnitOfWork = workInProgressRoot;
}
```
最后在 `/src/index.js` 引入我们自己实现的 `React.Component` 即可：
```diff
- import { Component } from 'react';
+ import { Component } from './mini-react/react';
```
### 效果预览
效果预览如下，非常 nice！
![Nov-11-2021 20-00-52.gif](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/4bee026aa31c4714bdc91245d0ae6170~tplv-k3u1fbpfcp-watermark.image?)
## [七: 实现 hooks 👉](https://github.com/zh-lx/mini-react/commit/b796bca22792a598b9ac499ecdf9748d2f25aadf)
最后我们再来实现一下函数组件的 hooks 功能。
### 完善函数组件功能
和类组件一样，我们先完善一下函数组件的功能，引入 `useState` hook，然后在点击按钮时让 `count` 的值 +1。代码如下：
```js
import { useState } from 'react';

function FunctionComponent(props) {
  const [count, setCount] = useState(0);
  const addCount = () => {
    setCount(count + 1);
  };
  return (
    <div className="function-component">
      <div>this is a function Component</div>
      <div>prop value is: {props.value}</div>
      <div>count is: {count}</div>
      <input type="button" value="add count" onClick={addCount} />
    </div>
  );
}
```
### 实现 useState
上面说到了，类组件是在调用 `setState` api 时，改变当前类实例中的 state 状态，然后触发更新去渲染 dom。但是类组件的 `setState` 中，可以通过 `this` 获取到类实例然后拿到 `state`，而函数组件无法通过 `this` 获取，那应该如何操作呢？

我们可以在 `/src/mini-react/fiber.js` 中设置一个全局变量 `currentFunctionFiber`，指向render 过程中当前处理的函数组件对应的 fiber，并用它来挂载这个函数组件当前的 hooks。同时因为一个函数组件中可能有多个 hooks，所以我们还需要有一个全局的 `hookIndex` 变量来记录当前执行的 hooks 是当前函数组件中的第几个，同时导出 `getCurrentFunctionFiber` 和 `getHookIndex` 的函数来获取 `currentFunctionFiber` 和 `hookIndex`，方便后面 `/src/mini-react/react` 文件中引入使用：
```js
let currentFunctionFiber = null; // 当前正在执行的函数组件对应 fiber
let hookIndex = 0; //  当前正在执行的函数组件 hook 的下标

// 获取当前的执行的函数组件对应的 fiber
export function getCurrentFunctionFiber() {
  return currentFunctionFiber;
}

// 获取当前 hook 下标
export function getHookIndex() {
  return hookIndex++;
}
```
然后同类组件一样，我们将 `performUnitOfWork` 函数组件的处理逻辑也单独抽离到一个 `updateFunctionComponent` 函数中：
```diff
function performUnitOfWork(workInProgress) {
  // ...

  if (typeof type === 'function') {
    // 当前 fiber 对应 React 组件时，对其 return 迭代
    if (type.prototype.isReactComponent) {
      // 类组件
      updateClassComponent(workInProgress);
    } else {
      // 函数组件
-     const { props, type: Fn } = workInProgress.element;
-     const jsx = Fn(props);
-     children = [jsx];
+     updateFunctionComponent(workInProgress);
    }
  }
  
  // ...
}
```
`updateFunctionComponent` 函数中，会将 `currentFunctionFiber` 指向 `workInProgress`，并将其上面挂载的 hooks 数组置空，将全局的 `hookIndex` 重置为0。然后调用函数组件构造函数，返回对应的 jsx 结构，代码如下：
```js
// 函数组件的更新
function updateFunctionComponent(fiber) {
  currentFunctionFiber = fiber;
  currentFunctionFiber.hooks = [];
  hookIndex = 0;
  const { props, type: Fn } = fiber.element;
  const jsx = Fn(props);
  reconcileChildren(fiber, [jsx]);
}
```
最后就是去实现我们的 `useState` 这个函数了。首先其接受一个初始值，并返回一个数组，然后通过 `getCurrentFunctionFiber` 和 `getHookIndex` 函数来获取 `currentFunctionFiber` 和 `hookIndex`。

然后根据 `currentFunctionFiber.alternate.hooks.[hookIndex]` 判断有没有已经存在的对应的旧的 hook，如果有，则直接取过来用以便获取之前的 hook 的状态值；若没有则使用传入的初始值初始化一个 hook。

一个 hook 上有两个属性：
- state: 表示当前 `useState` hook 要返回的值
- queue: 存储了本次 render 过程要对这个 `state` 进行的操作数组

所以我们 `useState` 的返回值就很明确了，返回一个数组，数组第一个值是 `hook.state`，第二个值是一个函数，这个函数的功能就是将接收的参数 push 到 `hook.queue` 中。

综上代码如下：
```js
export function useState(initial) {
  const currentFunctionFiber = getCurrentFunctionFiber();
  const hookIndex = getHookIndex();
  // 取当前执行的函数组件之前的 hook
  const oldHook = currentFunctionFiber?.alternate?.hooks?.[hookIndex];

  // oldHook存在，取之前的值，否则取现在的值
  const hook = {
    state: oldHook ? oldHook.state : initial,
    queue: [], // 一次函数执行过程中可能调用多次 setState，将其放进队列一并执行
  };

  const actions = oldHook ? oldHook.queue : [];
  actions.forEach((action) => {
    hook.state = action(hook.state);
  });

  const setState = (action) => {
    if (typeof action === 'function') {
      hook.queue.push(action);
    } else {
      hook.queue.push(() => {
        return action;
      });
    }
    commitRender();
  };
  currentFunctionFiber.hooks.push(hook);
  return [hook.state, setState];
}
```
### 效果预览
最后在我们的 `/src/index.js` 中引入自己实现的 `useState` 之后，看一下效果：
![Nov-13-2021 22-48-40.gif](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/bc46d47e6db54a41bb3370226bce5cfe~tplv-k3u1fbpfcp-watermark.image?)

## 总结
OK，到这里我们的 mini react 就实现完成了，基本涵盖了 react 源码所有的知识点例如 fiber 架构、render 和 commit 阶段、diff 算法、类组件、函数组件、hooks 等等。

当然源码中也有一些不足，例如对于 dom 的创建还未考虑 `React.fragment`、其他内置组件以及嵌套的列表渲染等等。另外我们的 diff 算法的实现是一个简易版的 diff，并未考虑 key 值和 type 共同 diff 等，感兴趣的可以去 [mini react](https://github.com/zh-lx/mini-react) 仓库再次基础上进行扩充和完善。

通过实现本次的 mini react，希望你对 react 的原理有了一个更清晰的认知，也欢迎关注我的 [react17源码专栏](https://juejin.cn/column/7014776835166699556)，里面有我之前写的一系列 react17 源码的阅读及解析~
