# 上传到 GitHub，并生成可分享的网页

整理日期：2026 年 11 月 14 日。

项目文件夹是 `D:\GitHubProjects\rainy-convenience-store`。同级的 `rainy-convenience-store-github.zip` 是干净的上传备份；使用前请先解压。不要只把 ZIP 本身传进仓库，否则 GitHub Pages 无法直接显示里面的网页。

同级的 `rainy-convenience-store-offline.html` 是双击使用的离线版。上传仓库时使用项目文件夹里的分文件版本。

## 方法一：网页上传，适合第一次操作

1. 登录 GitHub，打开 <https://github.com/new>。
2. 在 **Repository name** 填 `rainy-convenience-store`。描述可以写：`可交互的暴雨便利店与街道场景，基于 Three.js`。
3. 想用免费 GitHub Pages 分享网页，就选择 **Public**。如果只想保存代码，可以选择 **Private**。不要勾选自动添加 README、`.gitignore` 或 License，因为本地已有项目说明和忽略配置。
4. 点击 **Create repository**。
5. 在新仓库空白页点击 **uploading an existing file**；已有文件时，使用 **Add file → Upload files**。
6. 打开项目文件夹，把它**里面的文件与子文件夹**拖入上传页面，保留目录结构。上传后仓库根目录应直接看到 `index.html`、`app.js`、`assets/` 和 `README.md`，不要再多套一层 `rainy-convenience-store/`。
7. 等待所有文件上传完成。在提交说明里填 `Initial project upload`，点击 **Commit changes**。
8. 回到仓库首页，确认 README 能显示截图，`assets/` 中有 `textures/`、`environment/` 和 `models/`。

整理完成的文件夹没有 `node_modules/`、`dist/` 或 `reports/`。如果你后来运行过安装或测试命令，这些目录可能重新生成；网页拖拽不会根据 `.gitignore` 帮你过滤，所以不要选择它们。也不要拖入 `.git/`。使用提供的 ZIP 解压副本可以获得干净的上传目录。

当前项目中单个文件都小于 GitHub 网页上传的 25 MiB 限制，文件总数少于单次上传的 100 个限制。网络不稳定时，可以分批上传，先传根目录文件，再传 `assets/`、`src/` 等文件夹。

## 开启 GitHub Pages

上传代码后，再设置网页发布：

1. 在仓库中打开 **Settings → Pages**。
2. 在 **Build and deployment** 下，将 **Source** 设置为 **Deploy from a branch**。
3. 将 **Branch** 选择为 `main`，目录选择 **/(root)**，点击 **Save**。如果实际分支名不是 `main`，选择上传文件所在的分支。
4. 等待发布完成，然后使用 Pages 页面显示的 **Visit site** 链接。仓库名保持上面名称时，地址通常是：

   ```text
   https://你的用户名.github.io/rainy-convenience-store/
   ```

这个目录已有构建好的静态网页，不需要先配置 GitHub Actions。仅上传源码而漏掉 `app.js` 或 `assets/` 会导致场景无法加载。默认免费方案的 GitHub Pages 使用公开仓库；私人仓库的 Pages 可用性取决于账号方案。

## 方法二：Git 命令上传，适合以后经常修改

这是一条替代路线。如果你已通过网页上传初始版本，后续请克隆那个仓库再继续修改，避免把两个独立初始化的仓库直接合并。

先按方法一的第 1–4 步创建一个**空仓库**。在 Windows 终端的 PowerShell 中执行：

```powershell
cd D:\GitHubProjects\rainy-convenience-store
git init -b main
```

首次使用 Git 且尚未设置身份时，先填写自己的提交身份。下面的两个值需要替换；邮箱可使用 GitHub 邮箱设置中提供的 noreply 地址。

```powershell
git config user.name "你的名字或GitHub用户名"
git config user.email "你的提交邮箱"
```

然后提交。`git status` 可以让你先查看将要上传的文件：

```powershell
git add .
git status
git commit -m "Initial rainy convenience store project"
```

把下一行的 `你的用户名` 换成真实 GitHub 用户名；也可以直接复制仓库首页 **Code → HTTPS** 中的地址：

```powershell
git remote add origin https://github.com/你的用户名/rainy-convenience-store.git
git push -u origin main
```

如果弹出 GitHub 登录或授权窗口，按提示登录。Git 的 HTTPS 操作需要受支持的认证方式；账号登录密码不能直接当作 Git 密码。Windows 的 Git Credential Manager 可提供浏览器登录；其他方式可参照下方官方认证说明。

以后修改源码后：

```powershell
npm ci
npm run build
git add .
git commit -m "Update rainy street scene"
git push
```

依赖没有变化时，不需要每次重新运行 `npm ci`。网页由根目录的构建产物发布，因此修改 `src/` 后记得运行 `npm run build`，再一起提交更新后的 `index.html`、`app.js` 和源码。

## 常见情况

- **看到仓库文件列表，而没有三维画面**：仓库首页用于浏览代码；场景要通过 Settings → Pages 显示的网站地址访问。
- **提示文件太大**：确认没有选中同级的离线 HTML。网站版资源已经分开，不需要 Git LFS。
- **网页提示资源载入失败**：检查仓库根目录有 `index.html`、`app.js`，并完整上传了 `assets/`。打开浏览器开发者工具的 Network 查看是否有 404。
- **本地双击 index.html 没显示场景**：运行 `preview.cmd` 或 `npm start`，然后打开本地服务器地址；也可以使用同级的离线 HTML。
- **PowerShell 禁止执行 npm.ps1**：使用 `npm.cmd ci`、`npm.cmd run build`、`npm.cmd start`，不必修改执行策略。
- **git 提示 remote origin already exists**：先用 `git remote -v` 查看。确认只是地址填写错误后，使用 `git remote set-url origin 正确地址`。
- **git push 提示 non-fast-forward**：通常是远程仓库已有提交。不要直接强制覆盖；先克隆远程仓库，把项目文件复制进去再提交。

## 官方参考

以下操作和网页上传限制已按整理日期核对：

- [GitHub：上传文件](https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository)
- [GitHub：上传本地项目](https://docs.github.com/en/migrations/importing-source-code/using-the-command-line-to-import-source-code/adding-locally-hosted-code-to-github)
- [GitHub：配置 Pages 发布来源](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
- [GitHub：HTTPS 凭据与 Git Credential Manager](https://docs.github.com/en/get-started/git-basics/caching-your-github-credentials-in-git)
