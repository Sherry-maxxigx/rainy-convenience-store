# 开发说明

这是已整理的独立项目，以完成的 v13 场景为基线。`src/scene.js` 是直接编辑的源码，没有依赖旧版本目录的生成链，也不需要 Python。

## 修改入口

- 场景与交互：`src/scene.js`。代码内部按建筑、商品、街道、天气、渲染和控制分段。
- 页面布局与样式：`src/page.html`。
- 材质列表：`src/assets.js`，对应 `assets/textures/`。
- 环境光：`src/night.js`，对应 `assets/environment/night.hdr`。
- 模型列表：`src/models.js`，对应 `assets/models/` 中的内嵌 glTF。

`npm run build` 将上述源码打包为根目录的 `app.js` 和 `index.html`。这两个文件是提交到仓库的发布产物；不要只修改产物，否则下次构建会覆盖改动。

## 两种交付格式

网站版的所有资源路径相对于页面所在目录，例如 `./assets/textures/asphalt_02_diff.jpg`。本地用 `npm start` 预览，上传时保持原有目录关系。这使它既能在网站根目录运行，也能在 GitHub Pages 的仓库子目录运行。

`npm run build:offline` 使用同一份源码，把材质、HDR 和模型内嵌到 `dist/rainy-corner.html`。此文件可以直接双击运行，但不会提交到 Git，也不用于网页拖拽上传。

## 渲染和性能

默认只有实时高画质路径，没有点击后重新构建整个场景的路径追踪模式。主要效果包括 PBR、静态阴影缓存、GTAO、平面水反射、泛光和抗锯齿。首次载入会预编译匹配实际渲染目标的程序，运行时按帧耗时调整分辨率。

上层和雨棚/招牌属于可隐藏的独立分组。静态几何按材质合并，重复商品与零件使用实例绘制。修改合批或可隐藏分组时，要同时检查店内剖视。

雨、积水和雷暴使用同一时钟；暂停时不推进。雷声需用户开启，并延后于闪电。减少动态效果偏好会让场景默认暂停。

## 验收

`npm test` 会分别在 `/` 和 `/rainy-convenience-store/` 路径启动临时服务器，检查资源是否缺失、是否请求外部网络、默认画质、商品与路灯、剖视和拖动。若生成过离线版，还会检查离线 HTML。

`npm run test:ui`、`npm run test:storm` 和 `npm run test:render` 使用离线版，因此先执行 `npm run build:offline`。它们保留了桌面与移动端交互、降动态偏好、雷暴与音频，以及默认渲染性能的检查。

依赖版本由 `package-lock.json` 锁定。`npm ci` 可重新安装。浏览器安装和图形硬件会影响测试耗时，性能测试不应当作为所有设备上相同帧率的保证。
