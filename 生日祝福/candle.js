(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);

  const els = {
    candlesContainer: $("candlesContainer"),
    wishHint: $("wishHint"),
    blowHint: $("blowHint"),
    wishResult: $("wishResult"),
    btnBlow: $("btnBlow"),
    btnBack: $("btnBack"),
    btnBackHome: $("btnBackHome"),
    candleTitle: $("candleTitle"),
    candleSubtitle: $("candleSubtitle"),
    starsCanvas: $("stars"),
  };

  let candles = [];
  let allBlown = false;
  let wishStarted = false;

  // 获取 URL 参数
  function getQuery() {
    const sp = new URLSearchParams(location.search);
    return {
      to: (sp.get("to") || "").trim(),
      from: (sp.get("from") || "").trim(),
      title: (sp.get("title") || "").trim(),
      msg: (sp.get("msg") || "").trim(),
    };
  }

  // 创建星星背景
  function initStars() {
    const canvas = els.starsCanvas;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

    function resize() {
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      ctx.scale(dpr, dpr);
      drawStars();
    }

    function drawStars() {
      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
      ctx.fillStyle = "rgba(255, 255, 255, 0.8)";

      const stars = [];
      const count = Math.floor((canvas.width / dpr) * (canvas.height / dpr) * 0.0003);

      for (let i = 0; i < count; i++) {
        const x = Math.random() * (canvas.width / dpr);
        const y = Math.random() * (canvas.height / dpr);
        const size = Math.random() * 1.5 + 0.5;
        const opacity = Math.random() * 0.5 + 0.5;

        ctx.globalAlpha = opacity;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();

        stars.push({ x, y, size, opacity });
      }

      ctx.globalAlpha = 1;
    }

    resize();
    window.addEventListener("resize", resize, { passive: true });

    // 星星闪烁动画
    function twinkle() {
      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
      ctx.fillStyle = "rgba(255, 255, 255, 0.8)";

      const count = Math.floor((canvas.width / dpr) * (canvas.height / dpr) * 0.0003);
      for (let i = 0; i < count; i++) {
        const x = Math.random() * (canvas.width / dpr);
        const y = Math.random() * (canvas.height / dpr);
        const size = Math.random() * 1.5 + 0.5;
        const opacity = Math.random() * 0.5 + 0.5;

        ctx.globalAlpha = opacity;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    setInterval(twinkle, 2000);
  }

  // 创建蜡烛
  function createCandle(index) {
    const candleDiv = document.createElement("div");
    candleDiv.className = "candle-item";
    candleDiv.dataset.index = index;

    const candleBody = document.createElement("div");
    candleBody.className = "candle-body";

    const flameContainer = document.createElement("div");
    flameContainer.className = "flame-container";

    const flame = document.createElement("div");
    flame.className = "flame";

    const smoke = document.createElement("div");
    smoke.className = "smoke";

    flameContainer.appendChild(flame);
    candleDiv.appendChild(flameContainer);
    candleDiv.appendChild(candleBody);
    candleDiv.appendChild(smoke);

    // 点击蜡烛吹灭
    candleDiv.addEventListener("click", () => {
      if (!candleDiv.classList.contains("blown")) {
        blowCandle(candleDiv, index);
      }
    });

    candleDiv.addEventListener("touchend", (e) => {
      e.preventDefault();
      if (!candleDiv.classList.contains("blown")) {
        blowCandle(candleDiv, index);
      }
    });

    return candleDiv;
  }

  // 吹灭蜡烛
  function blowCandle(candleElement, index) {
    if (candleElement.classList.contains("blown")) return;

    candleElement.classList.add("blown");
    candles[index].blown = true;

    // 震动反馈
    if (navigator.vibrate) {
      navigator.vibrate(30);
    }

    // 检查是否全部吹灭
    const allBlownNow = candles.every((c) => c.blown);
    if (allBlownNow && !allBlown) {
      allBlown = true;
      setTimeout(() => {
        showWishResult();
      }, 1000);
    }
  }

  // 显示许愿结果
  function showWishResult() {
    els.wishHint.style.display = "none";
    els.blowHint.style.display = "none";
    els.wishResult.style.display = "block";

    // 添加彩带效果
    createConfetti();
  }

  // 创建彩带效果
  function createConfetti() {
    const colors = ["#ff4d7d", "#ffd700", "#06d6a0", "#4ea8de", "#ffffff"];
    const count = 50;

    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        const confetti = document.createElement("div");
        confetti.style.position = "fixed";
        confetti.style.left = `${Math.random() * 100}%`;
        confetti.style.top = "-10px";
        confetti.style.width = "10px";
        confetti.style.height = "10px";
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.borderRadius = "50%";
        confetti.style.pointerEvents = "none";
        confetti.style.zIndex = "9999";

        document.body.appendChild(confetti);

        const angle = Math.random() * Math.PI * 2;
        const velocity = 2 + Math.random() * 3;
        const rotation = Math.random() * 360;
        const rotationSpeed = (Math.random() - 0.5) * 10;

        let x = parseFloat(confetti.style.left);
        let y = -10;
        let rot = rotation;

        function animate() {
          x += Math.cos(angle) * velocity;
          y += Math.sin(angle) * velocity + 0.5;
          rot += rotationSpeed;

          confetti.style.left = `${x}%`;
          confetti.style.top = `${y}px`;
          confetti.style.transform = `rotate(${rot}deg)`;

          if (y < window.innerHeight + 50) {
            requestAnimationFrame(animate);
          } else {
            confetti.remove();
          }
        }

        animate();
      }, i * 20);
    }
  }

  function init() {
    // 初始化星星背景
    initStars();

    // 获取 URL 参数
    const q = getQuery();
    const toName = q.to;
    const title = q.title || (toName ? `${toName}，生日快乐` : "生日快乐");

    if (els.candleTitle) {
      els.candleTitle.textContent = toName ? `${toName}，许个愿吧` : "许个愿吧";
    }

    // 创建蜡烛（根据年龄或默认数量）
    const candleCount = 3; // 默认 3 根蜡烛，你可以根据年龄动态设置
    candles = [];

    for (let i = 0; i < candleCount; i++) {
      const candle = createCandle(i);
      candles.push({ element: candle, blown: false });
      els.candlesContainer.appendChild(candle);
    }

    // 3 秒后显示吹灭提示
    setTimeout(() => {
      if (!allBlown) {
        els.wishHint.style.display = "none";
        els.blowHint.style.display = "block";
        wishStarted = true;
      }
    }, 3000);

    // 吹灭所有按钮
    if (els.btnBlow) {
      const handleBlowAll = () => {
        candles.forEach((candle, index) => {
          if (!candle.blown) {
            setTimeout(() => {
              blowCandle(candle.element, index);
            }, index * 150);
          }
        });
      };
      els.btnBlow.addEventListener("click", handleBlowAll);
      els.btnBlow.addEventListener("touchend", (e) => {
        e.preventDefault();
        handleBlowAll();
      });
    }

    // 返回按钮
    if (els.btnBack) {
      const handleBack = () => {
        const params = new URLSearchParams(location.search);
        const backUrl = `index.html${params.toString() ? `?${params.toString()}` : ""}`;
        window.location.href = backUrl;
      };
      els.btnBack.addEventListener("click", handleBack);
      els.btnBack.addEventListener("touchend", (e) => {
        e.preventDefault();
        handleBack();
      });
    }

    // 返回首页按钮
    const btnNext = $("btnNext");
    if (btnNext) {
      const handleBackHome = () => {
        const params = new URLSearchParams(location.search);
        const homeUrl = `index.html${params.toString() ? `?${params.toString()}` : ""}`;
        window.location.href = homeUrl;
      };
      btnNext.addEventListener("click", handleBackHome);
      btnNext.addEventListener("touchend", (e) => {
        e.preventDefault();
        handleBackHome();
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
