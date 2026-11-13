# 第三方资源说明

## Three.js

项目使用 Three.js 0.180.0，包括 OrbitControls、后处理、模型与环境光加载器等模块。库采用 MIT 许可，原始许可文本保存在 [licenses/three-MIT.txt](licenses/three-MIT.txt)。打包程序保留库的许可注释。

## Poly Haven 资源

项目保留了以下 Poly Haven CC0 资源，文件来源记录见 [assets/sources.json](assets/sources.json)：

- `asphalt_02`：路面材质，1K。
- `brick_wall_001`：砖墙材质，1K。
- `concrete_wall_007`：混凝土材质，1K。
- `white_plaster_rough_01`：墙面材质，2K。
- `moonless_golf`：1K HDR 环境。
- `folding_wooden_stool`：折叠木凳。
- `metal_trash_can`：金属垃圾桶。

两个 glTF 模型的纹理和缓冲数据已经内嵌，以便独立保存和离线构建。场景中对资源的色调、光照和摆放作了调整。

商品包装图集、标牌、程序化建筑、街道、天气效果和 `water_nor_gl.jpg` 由项目代码制作。资源清单没有包含旧版本中已不再使用的食品模型。

## 开发工具

构建使用 esbuild，浏览器验收使用 Playwright。它们由 npm 安装，版本与依赖见 `package.json` 和 `package-lock.json`；`node_modules/` 不随仓库提交。
