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

<samp>Jerry's Room</samp> is designed and developed by Jianwei Ni. The current 3D scene combines custom composition and implementation with credited models by Ibrahim.Bhl, crumhirnd, Cre8t!ve V!be, Baldev Ranna, 45P3R4, danish_blends, Blizzy, and MADE.COM. Room-entry audio is sourced from BigSoundBank / LaSonotheque and edited and integrated for this project; details are documented in <samp>docs/audio-assets.md</samp>. Built with Three.js, React, and Framer Motion.

<br>

## 简体中文

这是我的作品集网站 <a href="https://jerrynee-github-io.vercel.app"><samp>Jerry's Room</samp></a> 的仓库:推开悬浮在光里的门,走进房间,桌上的显示器运行着 <samp>JianweiOS</samp> —— 一个真正可用的桌面系统。外层 three.js 场景在 <samp>src/outer/</samp>,内层 React 桌面在 <samp>src/os/</samp>。开发:<samp>npm i && npm run dev</samp>。有任何问题欢迎邮件联系。
