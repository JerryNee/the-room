# Jerry's Room — Interactive 3D Portfolio

[English](#jerrys-room--interactive-3d-portfolio) | [简体中文](#简体中文)

An interactive 3D portfolio. You arrive at a door floating in a bright void;
open it and step into Jerry's room, where a Studio Display on the desk runs
**JianweiOS** — a fully working retro-style desktop OS with my projects,
resume, photo albums, music, and a word game inside.

**Live site:** deployed on Vercel from `main`.

## How it works

- **Outer scene** (`src/outer/`) — a three.js room rendered with WebGL:
  door-opening portal transition (stencil-based), free-orbit camera with
  zoom-follow framing, baked lighting surfaces, and spatial audio.
- **Inner OS** (`src/os/`) — a React 18 desktop that runs in an iframe and is
  composited onto the monitor through CSS3D + a WebGL occlusion punch-out.
  Mouse, wheel, and keyboard input are forwarded from the 3D scene into the
  iframe while the screen is focused.
- Apps on the desktop: My Showcase, Projects, Resume, Photos, Music Disk,
  Jerryordle (Wordle with a Jerry twist), and Credits.

## Development

```bash
npm install
npm run dev        # local dev server
npm run build      # production build to dist/
npm run typecheck  # tsc --noEmit
```

## Project structure

```
src/outer/   three.js entry scene (door, room, monitor compositing)
src/os/      JianweiOS — the React desktop inside the monitor
public/      models (GLB), baked textures, licensed audio
```

## Credits

- Computer model by Mickael Boitte; environment models by Sean Nicolas.
- Office ambience by Sound Cassette; other audio licensed per
  `docs/audio-assets.md`.
- Inspiration: Bruno Simon, Jesse Zhou, Pink Yellow, Vivek Patel.

Content, 3D composition, JianweiOS apps, and all customization by
**Jianwei (Jerry) Ni**.

## 简体中文

一个可交互的 3D 作品集:推开悬浮在光里的门,走进 Jerry 的房间,桌上的
显示器运行着 **JianweiOS** —— 一个真正可用的复古桌面系统,里面有我的
项目、简历、相册、音乐和猜词游戏。

- 外层场景(`src/outer/`):three.js 房间,门口传送门过渡、自由环绕
  相机、烘焙光照与空间音频;
- 内层系统(`src/os/`):React 18 桌面,通过 CSS3D 合成到显示器屏幕,
  聚焦屏幕后鼠标、滚轮、键盘事件都会转发进系统;
- 开发:`npm install && npm run dev`,构建 `npm run build`。

MIT 许可,资产致谢详见上方 Credits。
