(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);

  const els = {
    title: $("title"),
    subtitle: $("subtitle"),
    msg: $("msg"),
    from: $("from"),
    date: $("date"),
    btnCelebrate: $("btnCelebrate"),
    btnCandle: $("btnCandle"),
    btnTheme: $("btnTheme"),
    btnMusic: $("btnMusic"),
    bgMusic: $("bgMusic"),
    toast: $("toast"),
    canvas: $("confetti"),
  };

  function clampText(s, maxLen) {
    if (typeof s !== "string") return "";
    const t = s.trim();
    if (!t) return "";
    return t.length > maxLen ? t.slice(0, maxLen) + "…" : t;
  }

  function getQuery() {
    const sp = new URLSearchParams(location.search);
    return {
      to: clampText(sp.get("to") || "", 20),
      from: clampText(sp.get("from") || "", 20),
      title: clampText(sp.get("title") || "", 26),
      msg: clampText(sp.get("msg") || "", 240),
      date: clampText(sp.get("date") || "", 24),
    };
  }

  function formatDate(d = new Date()) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}.${m}.${day}`;
  }

  function setMsgText(container, text) {
    // 纯文本渲染（防 XSS），支持 \n 分段
    container.replaceChildren();
    const lines = String(text || "")
      .split(/\n+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (!lines.length) return;
    for (const line of lines) {
      const p = document.createElement("p");
      p.textContent = line;
      container.appendChild(p);
    }
  }

  let toastTimer = 0;
  function toast(text) {
    if (!els.toast) return;
    window.clearTimeout(toastTimer);
    els.toast.textContent = text;
    els.toast.classList.add("show");
    toastTimer = window.setTimeout(() => {
      els.toast.classList.remove("show");
    }, 1600);
  }

  async function copyText(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {
      // fallthrough
    }
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "true");
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      ta.style.top = "0";
      document.body.appendChild(ta);
      ta.select();
      ta.setSelectionRange(0, ta.value.length);
      const ok = document.execCommand("copy");
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }

  function setTheme(theme) {
    const root = document.documentElement;
    if (theme === "night") {
      root.setAttribute("data-theme", "night");
    } else {
      root.removeAttribute("data-theme");
    }
    try {
      localStorage.setItem("birthday_theme", theme);
    } catch {
      // ignore
    }
  }

  function getInitialTheme() {
    try {
      const t = localStorage.getItem("birthday_theme");
      if (t === "night" || t === "day") return t;
    } catch {
      // ignore
    }
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "night" : "day";
  }

  class Confetti {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d", { alpha: true });
      this.particles = [];
      this.running = false;
      this.dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      this.resize = this.resize.bind(this);
      this.tick = this.tick.bind(this);
      this.resize();
      window.addEventListener("resize", this.resize, { passive: true });
    }

    resize() {
      const { canvas } = this;
      const rect = canvas.getBoundingClientRect();
      const w = Math.max(1, Math.floor(rect.width));
      const h = Math.max(1, Math.floor(rect.height));
      this.dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      canvas.width = Math.floor(w * this.dpr);
      canvas.height = Math.floor(h * this.dpr);
      this.width = w;
      this.height = h;
    }

    burst(cx, cy, amount = 140) {
      const colors = ["#ff4d7d", "#ffd166", "#06d6a0", "#4ea8de", "#b5179e", "#ffffff"];
      for (let i = 0; i < amount; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = 2.2 + Math.random() * 7.0;
        const size = 4 + Math.random() * 7;
        this.particles.push({
          x: cx,
          y: cy,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp - (1.8 + Math.random() * 3.2),
          g: 0.14 + Math.random() * 0.12,
          rot: Math.random() * Math.PI,
          vr: (Math.random() - 0.5) * 0.35,
          size,
          w: size * (0.7 + Math.random() * 0.9),
          h: size * (0.9 + Math.random() * 1.3),
          color: colors[(Math.random() * colors.length) | 0],
          ttl: 90 + ((Math.random() * 70) | 0),
          life: 0,
        });
      }
      this.start();
    }

    start() {
      if (this.running) return;
      this.running = true;
      requestAnimationFrame(this.tick);
    }

    tick() {
      const ctx = this.ctx;
      if (!ctx) return;
      const cw = this.canvas.width;
      const ch = this.canvas.height;
      ctx.clearRect(0, 0, cw, ch);
      ctx.save();
      ctx.scale(this.dpr, this.dpr);

      const still = [];
      for (const p of this.particles) {
        p.life += 1;
        p.vy += p.g;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        p.vx *= 0.992;
        p.vy *= 0.996;

        const t = p.life / p.ttl;
        const alpha = t < 0.75 ? 1 : Math.max(0, 1 - (t - 0.75) / 0.25);
        if (alpha <= 0) continue;

        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

        if (p.y < this.height + 80 && p.x > -120 && p.x < this.width + 120) still.push(p);
      }
      ctx.restore();

      this.particles = still;
      if (this.particles.length) {
        requestAnimationFrame(this.tick);
      } else {
        this.running = false;
      }
    }
  }

  // 移动端触摸优化：防止双击缩放延迟
  let lastTouchEnd = 0;
  document.addEventListener("touchend", (e) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
      e.preventDefault();
    }
    lastTouchEnd = now;
  }, { passive: false });

  function init() {
    // 主题
    const initialTheme = getInitialTheme();
    setTheme(initialTheme);
    if (els.btnTheme) {
      const handleThemeToggle = () => {
        const isNight = document.documentElement.getAttribute("data-theme") === "night";
        setTheme(isNight ? "day" : "night");
        toast(isNight ? "已切换：明亮" : "已切换：夜空");
      };
      els.btnTheme.addEventListener("click", handleThemeToggle);
      els.btnTheme.addEventListener("touchend", (e) => {
        e.preventDefault();
        handleThemeToggle();
      });
    }

    // 背景音乐：通过“点击开启音乐”遮罩满足浏览器要求，点击后才有声音
    const musicUnlock = $("musicUnlock");
    if (els.bgMusic && els.btnMusic) {
      const updateMusicBtn = () => {
        const playing = !els.bgMusic.paused;
        els.btnMusic.classList.toggle("playing", playing);
        els.btnMusic.classList.toggle("paused", !playing);
        els.btnMusic.setAttribute("aria-label", playing ? "暂停音乐" : "播放音乐");
        if (playing && musicUnlock) {
          musicUnlock.classList.add("hidden");
        }
      };
      const startMusic = () => {
        els.bgMusic.play().then(() => updateMusicBtn()).catch(() => {});
      };
      const handleMusicToggle = () => {
        if (els.bgMusic.paused) {
          startMusic();
        } else {
          els.bgMusic.pause();
          updateMusicBtn();
        }
      };

      els.bgMusic.addEventListener("play", updateMusicBtn);
      els.bgMusic.addEventListener("pause", updateMusicBtn);
      updateMusicBtn();

      // 点击“开启音乐”遮罩时再播放（必须在用户点击的同一事件里调用 play()，浏览器才允许）
      if (musicUnlock) {
        const unlock = () => {
          startMusic();
          musicUnlock.classList.add("hidden");
          musicUnlock.removeEventListener("click", unlock);
          musicUnlock.removeEventListener("touchend", unlockTouch);
        };
        const unlockTouch = (e) => {
          e.preventDefault();
          unlock();
        };
        musicUnlock.addEventListener("click", unlock);
        musicUnlock.addEventListener("touchend", unlockTouch);
      }

      els.btnMusic.addEventListener("click", handleMusicToggle);
      els.btnMusic.addEventListener("touchend", (e) => {
        e.preventDefault();
        handleMusicToggle();
      });
    }

    // 内容：链接参数定制
    const q = getQuery();
    const toName = q.to;
    const fromName = q.from;
    const title = q.title || (toName ? `${toName}，生日快乐` : "生日快乐");

    if (els.title) els.title.textContent = title;
    document.title = title;
    if (els.subtitle) {
      els.subtitle.textContent = toName ? `愿你新的一岁，事事顺意，天天开心` : "愿你今天被快乐紧紧拥抱";
    }
    if (q.msg && els.msg) setMsgText(els.msg, q.msg);

    // footer：署名 + 日期
    if (els.from) {
      if (fromName) {
        els.from.textContent = `— ${fromName}`;
        els.from.style.display = "";
      } else {
        els.from.textContent = "";
        els.from.style.display = "none";
      }
    }
    if (els.date) {
      els.date.textContent = q.date || formatDate();
    }

    // 隐藏分隔点
    const sep = document.querySelector(".sep");
    if (sep) sep.style.display = fromName ? "" : "none";

    // 彩带烟花
    const confetti = new Confetti(els.canvas);
    const burstCenter = () => confetti.burst(confetti.width * 0.5, confetti.height * 0.35, 160);

    if (els.btnCelebrate) {
      const handleCelebrate = () => {
        const x = confetti.width * (0.25 + Math.random() * 0.5);
        const y = confetti.height * (0.22 + Math.random() * 0.25);
        confetti.burst(x, y, 170);
        window.setTimeout(() => confetti.burst(confetti.width * 0.5, confetti.height * 0.2, 120), 140);
        window.setTimeout(() => confetti.burst(confetti.width * 0.75, confetti.height * 0.32, 130), 240);
        if (navigator.vibrate) navigator.vibrate([20, 30, 20]);
        toast("生日快乐！");
      };
      els.btnCelebrate.addEventListener("click", handleCelebrate);
      els.btnCelebrate.addEventListener("touchend", (e) => {
        e.preventDefault();
        handleCelebrate();
      });
    }

    // 点蜡烛按钮
    if (els.btnCandle) {
      const handleCandle = () => {
        // 获取当前 URL 参数，传递到蜡烛页面
        const params = new URLSearchParams(location.search);
        const candleUrl = `candle.html${params.toString() ? `?${params.toString()}` : ""}`;
        window.location.href = candleUrl;
      };
      els.btnCandle.addEventListener("click", handleCandle);
      els.btnCandle.addEventListener("touchend", (e) => {
        e.preventDefault();
        handleCandle();
      });
    }

    // 打开时来一次轻量效果
    window.setTimeout(burstCenter, 480);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
