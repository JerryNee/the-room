# Jerry's Room

This is the repository for my portfolio website, <a href="https://jerrynee-github-io.vercel.app"><samp>Jerry's Room</samp></a>. You arrive at a door floating in a bright void; open it and step into my room, where the display on the desk runs <samp>JianweiOS</samp> — a working desktop with my projects, resume, photo albums, music, and a word game inside.

Both layers live in this one repo: the three.js scene is in <samp>src/outer/</samp>, and the React desktop that gets composited onto the monitor is in <samp>src/os/</samp>. Thanks for taking the time to check this out! If you have any questions or comments, feel free to shoot me an email at <samp><a href="mailto:nijianweijerry@gmail.com">nijianweijerry@gmail.com</a></samp> or find me on GitHub <a href="https://github.com/JerryNee"><samp>@JerryNee</samp></a>.

<br>

To setup a dev environment:

```bash
# Clone the repository

# Install dependencies
npm i

# Run the local dev server
npm run dev
```

To build for production:

```bash
# Type-check
npm run typecheck

# Build for production (outputs to dist/)
npm run build
```

<br>

## Credits

Computer model by Mickael Boitte, environment models by Sean Nicolas, office ambience by Sound Cassette; other audio licensed per <samp>docs/audio-assets.md</samp>. Inspired by the work of Bruno Simon, Henry Heffernan, Jesse Zhou, Pink Yellow, and Vivek Patel.

<br>

## 简体中文

这是我的作品集网站 <a href="https://jerrynee-github-io.vercel.app"><samp>Jerry's Room</samp></a> 的仓库:推开悬浮在光里的门,走进房间,桌上的显示器运行着 <samp>JianweiOS</samp> —— 一个真正可用的桌面系统。外层 three.js 场景在 <samp>src/outer/</samp>,内层 React 桌面在 <samp>src/os/</samp>。开发:<samp>npm i && npm run dev</samp>。有任何问题欢迎邮件联系。
