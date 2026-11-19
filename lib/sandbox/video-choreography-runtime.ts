/**
 * In-sandbox 60fps Interaction Choreography, Spring Physics Virtual Cursor,
 * Click Ripple Pool, and Subtle Auto-Zoom Camera Runtime.
 *
 * Injected into the compiled sandbox iframe ONLY when `videoStudio: true`
 * so the standard Component Studio preview remains zero-overhead.
 */
export function buildVideoStudioRuntimeScript(): string {
  return `
    // =========================================================================
    // VIDEO STUDIO 60FPS CHOREOGRAPHY, SPRING CURSOR & AUTO-ZOOM RUNTIME
    // =========================================================================
    (function initVideoStudioRuntime() {
      if (window.__VIDEO_STUDIO_RUNTIME_LOADED__) return;
      window.__VIDEO_STUDIO_RUNTIME_LOADED__ = true;

      const state = {
        mode: "autopilot",
        durationSec: 8,
        autoHover: true,
        autoClick: true,
        autoScroll: true,
        loopReturnToTop: true,
        showCursor: true,
        clickRipples: true,
        autoZoom: true,
        zoomIntensity: 1.18,
        activeSession: false, // true during dryRun or recording
        manualActive: false,
        cursorVisible: false,

        // Cursor spring physics (viewport coordinates in px)
        targetX: window.innerWidth * 0.5,
        targetY: window.innerHeight * 0.5,
        x: window.innerWidth * 0.85,
        y: window.innerHeight * 0.85,
        vx: 0,
        vy: 0,
        scale: 1,
        targetScale: 1,
        tilt: 0,
        isPressed: false,

        // Subtle camera auto-zoom spring
        zoom: 1,
        targetZoom: 1,
        zoomOriginX: window.innerWidth * 0.5,
        zoomOriginY: window.innerHeight * 0.5,
        currentOriginX: window.innerWidth * 0.5,
        currentOriginY: window.innerHeight * 0.5,
        zoomResetTimer: null,

        // Active ripples
        ripples: [],

        // Choreography runner
        choreographyRaf: null,
        choreographyCancelled: false,
        lastHoveredEl: null,
        lastTelemetryTs: 0,
        masterRaf: null,
        lastFrameTs: performance.now(),
      };

      // Inject crisp helper styles for cursor, ripples, and synthetic hover
      const styleEl = document.createElement("style");
      styleEl.id = "__video_studio_styles__";
      styleEl.textContent = \`
        html.__vs_hide_native_cursor__,
        html.__vs_hide_native_cursor__ * {
          cursor: none !important;
        }
        #root {
          transform-origin: 0 0;
          will-change: transform;
        }
        #__video_studio_overlay__ {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 2147483647;
          overflow: hidden;
        }
        #__video_studio_cursor__ {
          position: fixed;
          top: 0;
          left: 0;
          width: 30px;
          height: 30px;
          margin-left: -3px;
          margin-top: -2px;
          pointer-events: none;
          will-change: transform, opacity;
          opacity: 0;
          transition: opacity 180ms cubic-bezier(0.22, 1, 0.36, 1);
          filter: drop-shadow(0 6px 14px rgba(0, 0, 0, 0.38)) drop-shadow(0 2px 4px rgba(0, 0, 0, 0.28));
        }
        .__vs_ripple__ {
          position: fixed;
          top: 0;
          left: 0;
          pointer-events: none;
          border-radius: 9999px;
          will-change: transform, opacity;
        }
        [data-studio-hover="true"] {
          transition: transform 180ms cubic-bezier(0.22, 1, 0.36, 1), filter 180ms ease;
        }
      \`;
      document.head.appendChild(styleEl);

      // Build overlay DOM for Spring Cursor + Ripples
      const overlay = document.createElement("div");
      overlay.id = "__video_studio_overlay__";

      const cursorEl = document.createElement("div");
      cursorEl.id = "__video_studio_cursor__";
      cursorEl.innerHTML = \`
        <svg width="30" height="30" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M5.5 3.2L22.4 13.8C23.3 14.35 23.02 15.72 21.97 15.9L14.85 17.12L11.72 23.58C11.24 24.56 9.81 24.42 9.53 23.36L4.28 4.42C4.04 3.55 4.74 2.72 5.5 3.2Z" fill="#09090B" stroke="#FFFFFF" stroke-width="1.8" stroke-linejoin="round"/>
        </svg>
      \`;
      overlay.appendChild(cursorEl);
      document.body.appendChild(overlay);

      function postToParent(payload) {
        try {
          window.parent.postMessage(payload, "*");
        } catch (e) {}
      }

      // -----------------------------------------------------------------------
      // Scroll Container & Interactive Target Discovery
      // -----------------------------------------------------------------------
      function findScrollContainer() {
        const docEl = document.scrollingElement || document.documentElement;
        const docScrollable = Math.max(0, docEl.scrollHeight - window.innerHeight);

        let bestInner = null;
        let bestInnerDist = 0;

        const root = document.getElementById("root");
        if (root) {
          const all = root.querySelectorAll("*");
          for (let i = 0; i < all.length; i++) {
            const el = all[i];
            const style = window.getComputedStyle(el);
            const overflowY = style.overflowY;
            if (overflowY === "auto" || overflowY === "scroll") {
              const dist = el.scrollHeight - el.clientHeight;
              if (dist > 40 && el.clientHeight > 140 && dist > bestInnerDist) {
                bestInner = el;
                bestInnerDist = dist;
              }
            }
          }
        }

        if (docScrollable >= bestInnerDist) {
          return { el: window, isWindow: true, maxScroll: docScrollable };
        }
        return { el: bestInner, isWindow: false, maxScroll: bestInnerDist };
      }

      function setScrollTop(container, y) {
        if (!container) return;
        const clamped = Math.max(0, Math.min(container.maxScroll, y));
        if (container.isWindow) {
          window.scrollTo(0, clamped);
        } else if (container.el) {
          container.el.scrollTop = clamped;
        }
      }

      function getScrollTop(container) {
        if (!container) return 0;
        if (container.isWindow) {
          return window.scrollY || document.documentElement.scrollTop || 0;
        }
        return container.el ? container.el.scrollTop : 0;
      }

      function isVisibleElement(el) {
        if (!el || !(el instanceof HTMLElement)) return false;
        const style = window.getComputedStyle(el);
        if (
          style.display === "none" ||
          style.visibility === "hidden" ||
          parseFloat(style.opacity) < 0.08 ||
          style.pointerEvents === "none"
        ) {
          return false;
        }
        const rect = el.getBoundingClientRect();
        if (rect.width < 16 || rect.height < 14) return false;
        if (rect.width > window.innerWidth * 0.96 && rect.height > window.innerHeight * 0.96) {
          return false;
        }
        return true;
      }

      function discoverInteractiveTargets() {
        const root = document.getElementById("root");
        if (!root) return [];

        const primarySelector = [
          "button:not([disabled])",
          "[role='button']",
          "[role='tab']",
          "[role='switch']",
          "[role='slider']",
          "input:not([type='hidden']):not([disabled])",
          "select:not([disabled])",
          "a[href]",
          "[data-interactive]",
        ].join(",");

        const candidates = [];
        const seen = new Set();

        const primaryEls = root.querySelectorAll(primarySelector);
        primaryEls.forEach((el) => {
          if (isVisibleElement(el) && !seen.has(el)) {
            seen.add(el);
            candidates.push({ el, clickable: true, priority: 3 });
          }
        });

        // Also find hoverable interactive cards / cursor-pointer elements
        const allEls = root.querySelectorAll("div, section, article, li, label");
        for (let i = 0; i < allEls.length && candidates.length < 24; i++) {
          const el = allEls[i];
          if (seen.has(el) || !isVisibleElement(el)) continue;
          const style = window.getComputedStyle(el);
          const rect = el.getBoundingClientRect();
          const hasPointer = style.cursor === "pointer";
          const isReasonableCard =
            rect.width >= 60 &&
            rect.height >= 40 &&
            rect.width <= window.innerWidth * 0.82 &&
            rect.height <= window.innerHeight * 0.72;
          if (hasPointer && isReasonableCard) {
            seen.add(el);
            candidates.push({ el, clickable: true, priority: 2 });
          }
        }

        // Filter to elements currently within or near the initial viewport, deduplicating close centers
        const filtered = [];
        for (const item of candidates) {
          const rect = item.el.getBoundingClientRect();
          const cx = rect.left + rect.width / 2;
          const cy = rect.top + rect.height / 2;
          if (cx < 8 || cx > window.innerWidth - 8 || cy < 8 || cy > window.innerHeight - 8) {
            continue;
          }
          const tooClose = filtered.some((other) => {
            const dx = other.cx - cx;
            const dy = other.cy - cy;
            return Math.hypot(dx, dy) < 42;
          });
          if (!tooClose) {
            filtered.push({
              el: item.el,
              clickable: item.clickable,
              priority: item.priority,
              cx,
              cy,
              rect,
            });
          }
        }

        // Sort naturally in visual reading order (bands of 90px vertically, then left-to-right)
        filtered.sort((a, b) => {
          const bandA = Math.floor(a.cy / 90);
          const bandB = Math.floor(b.cy / 90);
          if (bandA !== bandB) return bandA - bandB;
          return a.cx - b.cx;
        });

        return filtered.slice(0, 7);
      }

      function scanAndReportTargets() {
        const root = document.getElementById("root");
        const targets = discoverInteractiveTargets();
        const scrollInfo = findScrollContainer();
        const hasCanvas = !!(root && root.querySelector("canvas"));

        postToParent({
          type: "VIDEO_STUDIO_TARGETS",
          interactiveCount: targets.length,
          scrollableDistance: Math.round(scrollInfo.maxScroll),
          hasCanvas: hasCanvas,
          viewportWidth: window.innerWidth,
          viewportHeight: window.innerHeight,
        });

        return { targets, scrollInfo, hasCanvas };
      }

      // -----------------------------------------------------------------------
      // Click Ripples & Camera Zoom Helpers
      // -----------------------------------------------------------------------
      function spawnRipple(x, y) {
        if (!state.clickRipples) return;
        const createdAt = performance.now();
        const isDark = document.documentElement.classList.contains("dark");

        const outer = document.createElement("div");
        outer.className = "__vs_ripple__";
        outer.style.width = "48px";
        outer.style.height = "48px";
        outer.style.marginLeft = "-24px";
        outer.style.marginTop = "-24px";
        outer.style.border = isDark
          ? "2px solid rgba(255, 255, 255, 0.85)"
          : "2px solid rgba(9, 9, 11, 0.72)";
        outer.style.background = isDark
          ? "rgba(255, 255, 255, 0.14)"
          : "rgba(9, 9, 11, 0.08)";
        overlay.appendChild(outer);

        const inner = document.createElement("div");
        inner.className = "__vs_ripple__";
        inner.style.width = "22px";
        inner.style.height = "22px";
        inner.style.marginLeft = "-11px";
        inner.style.marginTop = "-11px";
        inner.style.border = isDark
          ? "1.5px solid rgba(56, 189, 248, 0.9)"
          : "1.5px solid rgba(37, 99, 235, 0.85)";
        overlay.appendChild(inner);

        state.ripples.push({
          x,
          y,
          createdAt,
          duration: 560,
          outer,
          inner,
        });
      }

      function triggerSubtleZoom(x, y, holdMs) {
        if (!state.autoZoom) return;
        const intensity = Math.max(1.04, Math.min(1.32, state.zoomIntensity || 1.18));
        state.targetZoom = intensity;
        state.zoomOriginX = x;
        state.zoomOriginY = y;

        if (state.zoomResetTimer) clearTimeout(state.zoomResetTimer);
        state.zoomResetTimer = setTimeout(() => {
          state.targetZoom = 1;
        }, holdMs || 1150);
      }

      function resetCameraZoomImmediate() {
        if (state.zoomResetTimer) clearTimeout(state.zoomResetTimer);
        state.zoom = 1;
        state.targetZoom = 1;
        const root = document.getElementById("root");
        if (root) {
          root.style.transform = "";
        }
      }

      // -----------------------------------------------------------------------
      // Synthetic Pointer / Hover / Click Dispatch
      // -----------------------------------------------------------------------
      function clearSyntheticHover() {
        if (state.lastHoveredEl) {
          try {
            state.lastHoveredEl.removeAttribute("data-studio-hover");
            state.lastHoveredEl.dispatchEvent(
              new PointerEvent("pointerout", { bubbles: true, cancelable: true })
            );
            state.lastHoveredEl.dispatchEvent(
              new MouseEvent("mouseout", { bubbles: true, cancelable: true })
            );
            state.lastHoveredEl.dispatchEvent(
              new MouseEvent("mouseleave", { bubbles: false, cancelable: false })
            );
          } catch (e) {}
          state.lastHoveredEl = null;
        }
      }

      function dispatchPointerAt(x, y) {
        const el = document.elementFromPoint(x, y);
        if (!el) return null;

        if (state.lastHoveredEl && state.lastHoveredEl !== el) {
          try {
            state.lastHoveredEl.removeAttribute("data-studio-hover");
            state.lastHoveredEl.dispatchEvent(
              new PointerEvent("pointerout", {
                bubbles: true,
                cancelable: true,
                clientX: x,
                clientY: y,
                pointerType: "mouse",
              })
            );
            state.lastHoveredEl.dispatchEvent(
              new MouseEvent("mouseout", {
                bubbles: true,
                cancelable: true,
                clientX: x,
                clientY: y,
              })
            );
            state.lastHoveredEl.dispatchEvent(
              new MouseEvent("mouseleave", {
                bubbles: false,
                cancelable: false,
                clientX: x,
                clientY: y,
              })
            );
          } catch (e) {}
        }

        if (state.lastHoveredEl !== el) {
          state.lastHoveredEl = el;
          try {
            el.setAttribute("data-studio-hover", "true");
            el.dispatchEvent(
              new PointerEvent("pointerover", {
                bubbles: true,
                cancelable: true,
                clientX: x,
                clientY: y,
                pointerType: "mouse",
              })
            );
            el.dispatchEvent(
              new PointerEvent("pointerenter", {
                bubbles: false,
                cancelable: false,
                clientX: x,
                clientY: y,
                pointerType: "mouse",
              })
            );
            el.dispatchEvent(
              new MouseEvent("mouseover", {
                bubbles: true,
                cancelable: true,
                clientX: x,
                clientY: y,
              })
            );
            el.dispatchEvent(
              new MouseEvent("mouseenter", {
                bubbles: false,
                cancelable: false,
                clientX: x,
                clientY: y,
              })
            );
          } catch (e) {}
        }

        try {
          el.dispatchEvent(
            new PointerEvent("pointermove", {
              bubbles: true,
              cancelable: true,
              clientX: x,
              clientY: y,
              pointerType: "mouse",
            })
          );
          el.dispatchEvent(
            new MouseEvent("mousemove", {
              bubbles: true,
              cancelable: true,
              clientX: x,
              clientY: y,
            })
          );
        } catch (e) {}

        return el;
      }

      function dispatchTactileClick(x, y, targetOverride) {
        const el = targetOverride || document.elementFromPoint(x, y);
        state.isPressed = true;
        state.targetScale = 0.82;
        spawnRipple(x, y);
        triggerSubtleZoom(x, y, 1050);

        if (el) {
          // Guard external link navigation so component demos never leave the sandbox
          const anchor = el.closest ? el.closest("a[href]") : null;
          const prevHref = anchor ? anchor.getAttribute("href") : null;
          const isExternalLink =
            prevHref &&
            !prevHref.startsWith("#") &&
            !prevHref.startsWith("javascript:");

          try {
            el.dispatchEvent(
              new PointerEvent("pointerdown", {
                bubbles: true,
                cancelable: true,
                clientX: x,
                clientY: y,
                button: 0,
                buttons: 1,
                pointerType: "mouse",
              })
            );
            el.dispatchEvent(
              new MouseEvent("mousedown", {
                bubbles: true,
                cancelable: true,
                clientX: x,
                clientY: y,
                button: 0,
                buttons: 1,
              })
            );
          } catch (e) {}

          setTimeout(() => {
            state.isPressed = false;
            state.targetScale = 1;
            try {
              el.dispatchEvent(
                new PointerEvent("pointerup", {
                  bubbles: true,
                  cancelable: true,
                  clientX: x,
                  clientY: y,
                  button: 0,
                  pointerType: "mouse",
                })
              );
              el.dispatchEvent(
                new MouseEvent("mouseup", {
                  bubbles: true,
                  cancelable: true,
                  clientX: x,
                  clientY: y,
                  button: 0,
                })
              );
              if (!isExternalLink) {
                el.dispatchEvent(
                  new MouseEvent("click", {
                    bubbles: true,
                    cancelable: true,
                    clientX: x,
                    clientY: y,
                    button: 0,
                  })
                );
              }
            } catch (e) {}
          }, 95);
        } else {
          setTimeout(() => {
            state.isPressed = false;
            state.targetScale = 1;
          }, 95);
        }
      }

      // -----------------------------------------------------------------------
      // Master 60fps Spring Physics & Camera Zoom Loop
      // -----------------------------------------------------------------------
      function stepPhysics(now) {
        const dt = Math.min(0.04, Math.max(0.004, (now - state.lastFrameTs) / 1000));
        state.lastFrameTs = now;

        // Critically damped cursor spring
        const stiffness = state.manualActive ? 340 : 250;
        const damping = state.manualActive ? 32 : 27;

        const ax = (state.targetX - state.x) * stiffness - state.vx * damping;
        const ay = (state.targetY - state.y) * stiffness - state.vy * damping;
        state.vx += ax * dt;
        state.vy += ay * dt;
        state.x += state.vx * dt;
        state.y += state.vy * dt;

        // Press micro-scale easing
        state.scale += (state.targetScale - state.scale) * Math.min(1, dt * 24);

        // Velocity-proportional subtle tilt
        const targetTilt = Math.max(-9, Math.min(9, state.vx * 0.009));
        state.tilt += (targetTilt - state.tilt) * Math.min(1, dt * 16);

        // Apply cursor transform
        const shouldShowCursor = state.showCursor && state.cursorVisible;
        cursorEl.style.opacity = shouldShowCursor ? "1" : "0";
        cursorEl.style.transform =
          "translate3d(" +
          state.x.toFixed(2) +
          "px, " +
          state.y.toFixed(2) +
          "px, 0) rotate(" +
          state.tilt.toFixed(2) +
          "deg) scale(" +
          state.scale.toFixed(3) +
          ")";

        // Smooth camera auto-zoom with edge clamping (edge-to-edge zero gutters!)
        const zoomTarget = state.autoZoom ? state.targetZoom : 1;
        state.zoom += (zoomTarget - state.zoom) * Math.min(1, dt * 6.5);
        state.currentOriginX +=
          (state.zoomOriginX - state.currentOriginX) * Math.min(1, dt * 7);
        state.currentOriginY +=
          (state.zoomOriginY - state.currentOriginY) * Math.min(1, dt * 7);

        const root = document.getElementById("root");
        if (root) {
          if (Math.abs(state.zoom - 1) > 0.0015) {
            const vw = window.innerWidth;
            const vh = window.innerHeight;
            const z = state.zoom;
            // Compute translation that keeps focal point centered while clamping to [vw*(1-z), 0]
            let tx = state.currentOriginX * (1 - z);
            let ty = state.currentOriginY * (1 - z);
            tx = Math.min(0, Math.max(vw * (1 - z), tx));
            ty = Math.min(0, Math.max(vh * (1 - z), ty));
            root.style.transform =
              "translate3d(" +
              tx.toFixed(2) +
              "px, " +
              ty.toFixed(2) +
              "px, 0) scale(" +
              z.toFixed(4) +
              ")";
          } else if (root.style.transform) {
            root.style.transform = "";
          }
        }

        // Update active click ripples
        const activeRippleTelemetry = [];
        for (let i = state.ripples.length - 1; i >= 0; i--) {
          const r = state.ripples[i];
          const p = (now - r.createdAt) / r.duration;
          if (p >= 1) {
            r.outer.remove();
            r.inner.remove();
            state.ripples.splice(i, 1);
            continue;
          }
          const easeOut = 1 - Math.pow(1 - p, 3);
          const outerScale = 0.25 + easeOut * 1.45;
          const innerScale = 0.3 + easeOut * 1.1;
          const alpha = Math.max(0, 1 - p);

          r.outer.style.transform =
            "translate3d(" + r.x.toFixed(1) + "px, " + r.y.toFixed(1) + "px, 0) scale(" + outerScale.toFixed(3) + ")";
          r.outer.style.opacity = alpha.toFixed(3);

          r.inner.style.transform =
            "translate3d(" + r.x.toFixed(1) + "px, " + r.y.toFixed(1) + "px, 0) scale(" + innerScale.toFixed(3) + ")";
          r.inner.style.opacity = (alpha * 0.85).toFixed(3);

          activeRippleTelemetry.push({
            nx: r.x / Math.max(1, window.innerWidth),
            ny: r.y / Math.max(1, window.innerHeight),
            progress: p,
          });
        }

        // Emit cursor/camera telemetry at ~60fps when session is active (for Direct Stage Fallback)
        if (state.activeSession && now - state.lastTelemetryTs >= 15) {
          state.lastTelemetryTs = now;
          const vw = Math.max(1, window.innerWidth);
          const vh = Math.max(1, window.innerHeight);
          postToParent({
            type: "VIDEO_STUDIO_CURSOR_STATE",
            nx: state.x / vw,
            ny: state.y / vh,
            visible: shouldShowCursor,
            scale: state.scale,
            tilt: state.tilt,
            zoom: state.zoom,
            originNx: state.currentOriginX / vw,
            originNy: state.currentOriginY / vh,
            ripples: activeRippleTelemetry,
          });
        }

        state.masterRaf = requestAnimationFrame(stepPhysics);
      }
      state.masterRaf = requestAnimationFrame(stepPhysics);

      // -----------------------------------------------------------------------
      // Cubic Bézier Glide & Auto-Pilot Choreography Runner
      // -----------------------------------------------------------------------
      function easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      }

      function easeInOutSine(t) {
        return -(Math.cos(Math.PI * t) - 1) / 2;
      }

      function cancelChoreography() {
        state.choreographyCancelled = true;
        if (state.choreographyRaf) {
          cancelAnimationFrame(state.choreographyRaf);
          state.choreographyRaf = null;
        }
        clearSyntheticHover();
      }

      function waitMs(ms) {
        return new Promise((resolve) => {
          const start = performance.now();
          function tick(now) {
            if (state.choreographyCancelled) {
              resolve();
              return;
            }
            if (now - start >= ms) {
              resolve();
              return;
            }
            state.choreographyRaf = requestAnimationFrame(tick);
          }
          state.choreographyRaf = requestAnimationFrame(tick);
        });
      }

      function glideTo(destX, destY, durationMs, dispatchHover) {
        return new Promise((resolve) => {
          const startX = state.targetX;
          const startY = state.targetY;
          // Natural curved Bézier control point
          const midX = (startX + destX) / 2;
          const midY = (startY + destY) / 2;
          const dx = destX - startX;
          const dy = destY - startY;
          const dist = Math.hypot(dx, dy);
          const curveOffset = Math.min(90, dist * 0.22) * (dx >= 0 ? -1 : 1);
          const ctrlX = midX - (dy / Math.max(1, dist)) * curveOffset;
          const ctrlY = midY + (dx / Math.max(1, dist)) * curveOffset;

          const start = performance.now();
          function step(now) {
            if (state.choreographyCancelled) {
              resolve();
              return;
            }
            const raw = Math.min(1, (now - start) / Math.max(16, durationMs));
            const t = easeInOutCubic(raw);
            const inv = 1 - t;
            const curX = inv * inv * startX + 2 * inv * t * ctrlX + t * t * destX;
            const curY = inv * inv * startY + 2 * inv * t * ctrlY + t * t * destY;

            state.targetX = curX;
            state.targetY = curY;

            if (dispatchHover) {
              dispatchPointerAt(state.x, state.y);
            }

            if (raw >= 1) {
              if (dispatchHover) {
                dispatchPointerAt(destX, destY);
              }
              resolve();
              return;
            }
            state.choreographyRaf = requestAnimationFrame(step);
          }
          state.choreographyRaf = requestAnimationFrame(step);
        });
      }

      function smoothScrollTo(scrollContainer, targetY, durationMs) {
        return new Promise((resolve) => {
          const startY = getScrollTop(scrollContainer);
          const delta = targetY - startY;
          if (Math.abs(delta) < 2) {
            resolve();
            return;
          }
          const start = performance.now();
          function step(now) {
            if (state.choreographyCancelled) {
              resolve();
              return;
            }
            const raw = Math.min(1, (now - start) / Math.max(16, durationMs));
            const eased = easeInOutSine(raw);
            setScrollTop(scrollContainer, startY + delta * eased);

            // Gently drift cursor vertically during scroll for organic reading feel
            if (state.autoHover) {
              dispatchPointerAt(state.x, state.y);
            }

            if (raw >= 1) {
              resolve();
              return;
            }
            state.choreographyRaf = requestAnimationFrame(step);
          }
          state.choreographyRaf = requestAnimationFrame(step);
        });
      }

      async function runAutoPilotChoreography(config) {
        cancelChoreography();
        state.choreographyCancelled = false;
        state.activeSession = true;
        state.manualActive = false;
        document.documentElement.classList.add("__vs_hide_native_cursor__");

        const totalMs = Math.max(3000, (config.durationSec || state.durationSec || 8) * 1000);
        const scrollInfo = findScrollContainer();
        setScrollTop(scrollInfo, 0);
        resetCameraZoomImmediate();

        const vw = window.innerWidth;
        const vh = window.innerHeight;

        // Position cursor subtly near bottom-right entrance
        state.x = vw * 0.86;
        state.y = vh * 0.84;
        state.targetX = state.x;
        state.targetY = state.y;
        state.vx = 0;
        state.vy = 0;
        state.cursorVisible = true;

        const { targets } = scanAndReportTargets();
        const shouldScroll = state.autoScroll && scrollInfo.maxScroll > 36;

        // Allocate timeline budget cleanly
        const entryMs = Math.round(totalMs * 0.1);
        const scrollDownMs = shouldScroll ? Math.round(totalMs * 0.28) : 0;
        const scrollReturnMs = shouldScroll && state.loopReturnToTop ? Math.round(totalMs * 0.14) : 0;
        const settleMs = Math.round(totalMs * 0.06);
        const interactionBudgetMs = Math.max(
          1400,
          totalMs - entryMs - scrollDownMs - scrollReturnMs - settleMs
        );

        // Beat 1: Organic Entry Glide
        if (targets.length > 0) {
          await glideTo(targets[0].cx, targets[0].cy, entryMs, state.autoHover);
        } else {
          await glideTo(vw * 0.36, vh * 0.44, entryMs, state.autoHover);
        }
        if (state.choreographyCancelled) return;

        // Beat 2: Hover Sweeps & Tactile Clicks on discovered targets
        if (targets.length > 0 && (state.autoHover || state.autoClick)) {
          const maxVisits = Math.min(targets.length, totalMs >= 10000 ? 6 : 4);
          const perTargetMs = Math.floor(interactionBudgetMs / maxVisits);

          for (let i = 0; i < maxVisits; i++) {
            if (state.choreographyCancelled) return;
            const t = targets[i];
            // Re-measure target rect in case previous click opened a panel/tab
            const freshRect = t.el.getBoundingClientRect();
            const tx =
              freshRect.width > 0
                ? freshRect.left + freshRect.width / 2
                : t.cx;
            const ty =
              freshRect.height > 0
                ? freshRect.top + freshRect.height / 2
                : t.cy;

            const moveMs = Math.round(perTargetMs * 0.48);
            const dwellMs = Math.round(perTargetMs * 0.52);

            await glideTo(tx, ty, moveMs, state.autoHover);
            if (state.choreographyCancelled) return;

            if (state.autoClick && t.clickable) {
              await waitMs(Math.min(180, dwellMs * 0.25));
              if (state.choreographyCancelled) return;
              dispatchTactileClick(tx, ty, t.el);
              await waitMs(Math.max(240, dwellMs * 0.75));
            } else {
              // Subtle hover micro-orbit inside the target for spotlight / tilt effects
              const orbitOffset = Math.min(28, (freshRect.width || 60) * 0.25);
              await glideTo(tx + orbitOffset, ty - 6, dwellMs * 0.5, state.autoHover);
              await glideTo(tx - orbitOffset * 0.6, ty + 6, dwellMs * 0.5, state.autoHover);
            }
          }
        } else if (state.autoHover) {
          // Pure motion/shader/spotlight component: graceful figure-8 hover showcase
          const waypoints = [
            [vw * 0.28, vh * 0.36],
            [vw * 0.68, vh * 0.32],
            [vw * 0.72, vh * 0.64],
            [vw * 0.34, vh * 0.62],
            [vw * 0.5, vh * 0.48],
          ];
          const segMs = Math.floor(interactionBudgetMs / waypoints.length);
          for (let i = 0; i < waypoints.length; i++) {
            if (state.choreographyCancelled) return;
            await glideTo(waypoints[i][0], waypoints[i][1], segMs, true);
            if (state.autoClick && i === 2) {
              dispatchTactileClick(waypoints[i][0], waypoints[i][1]);
            }
          }
        } else {
          await waitMs(interactionBudgetMs);
        }
        if (state.choreographyCancelled) return;

        // Beat 3: Smooth Auto-Scroll Showcase
        if (shouldScroll) {
          state.targetZoom = 1;
          await glideTo(vw * 0.76, vh * 0.52, 320, state.autoHover);
          if (state.choreographyCancelled) return;
          await smoothScrollTo(scrollInfo, scrollInfo.maxScroll, scrollDownMs);
          if (state.choreographyCancelled) return;

          // Beat 4: Seamless Return to Top Loop
          if (state.loopReturnToTop) {
            await waitMs(220);
            if (state.choreographyCancelled) return;
            await smoothScrollTo(scrollInfo, 0, scrollReturnMs);
          }
        }

        // Gentle resting finish
        state.targetZoom = 1;
        await waitMs(settleMs);
        if (state.choreographyCancelled) return;

        clearSyntheticHover();
        state.activeSession = false;
        document.documentElement.classList.remove("__vs_hide_native_cursor__");
        postToParent({
          type: "VIDEO_STUDIO_CHOREOGRAPHY_COMPLETE",
          dryRun: !!config.dryRun,
        });
      }

      // -----------------------------------------------------------------------
      // Manual Live Record Pointer Tracking
      // -----------------------------------------------------------------------
      window.addEventListener(
        "pointermove",
        (e) => {
          if (!state.manualActive) return;
          state.cursorVisible = true;
          state.targetX = e.clientX;
          state.targetY = e.clientY;
        },
        { passive: true }
      );

      window.addEventListener(
        "pointerdown",
        (e) => {
          if (!state.manualActive) return;
          state.cursorVisible = true;
          state.targetX = e.clientX;
          state.targetY = e.clientY;
          state.isPressed = true;
          state.targetScale = 0.82;
          spawnRipple(e.clientX, e.clientY);
          triggerSubtleZoom(e.clientX, e.clientY, 1200);
        },
        { passive: true }
      );

      window.addEventListener(
        "pointerup",
        () => {
          if (!state.manualActive) return;
          state.isPressed = false;
          state.targetScale = 1;
        },
        { passive: true }
      );

      window.addEventListener(
        "wheel",
        () => {
          if (state.manualActive && state.targetZoom > 1) {
            state.targetZoom = 1;
          }
        },
        { passive: true }
      );

      // -----------------------------------------------------------------------
      // Fast Frame Snapshot Helper for Direct Stage Fallback Engine
      // -----------------------------------------------------------------------
      async function captureFastFrame(requestId) {
        try {
          const root = document.getElementById("root");
          if (!root) {
            postToParent({ type: "VIDEO_STUDIO_FRAME_DATA", requestId, dataUrl: null });
            return;
          }

          // Fast path: if component renders a live WebGL/2D canvas, capture directly
          const innerCanvas = root.querySelector("canvas");
          if (innerCanvas && innerCanvas.width > 0 && innerCanvas.height > 0) {
            try {
              const canvasUrl = innerCanvas.toDataURL("image/jpeg", 0.88);
              if (canvasUrl && canvasUrl.startsWith("data:image/")) {
                postToParent({
                  type: "VIDEO_STUDIO_FRAME_DATA",
                  requestId,
                  dataUrl: canvasUrl,
                });
                return;
              }
            } catch (e) {}
          }

          // SVG foreignObject rasterization of visible viewport
          const width = Math.max(window.innerWidth || 1280, 320);
          const height = Math.max(window.innerHeight || 720, 180);

          let stylesText = "";
          const styleElements = document.querySelectorAll("style");
          for (let i = 0; i < styleElements.length; i++) {
            const el = styleElements[i];
            if (el.id === "__video_studio_styles__") continue;
            stylesText += el.innerHTML + "\\n";
          }

          const clonedRoot = root.cloneNode(true);
          if (clonedRoot instanceof HTMLElement) {
            clonedRoot.style.transform = "";
          }
          const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
          const serializedHtml = new XMLSerializer().serializeToString(clonedRoot);
          const wrapperClasses = (
            document.documentElement.className +
            " " +
            document.body.className
          )
            .replace(/__vs_hide_native_cursor__/g, "")
            .trim();

          const svgString =
            '<svg xmlns="http://www.w3.org/2000/svg" width="' +
            width +
            '" height="' +
            height +
            '">' +
            '<foreignObject width="100%" height="100%">' +
            '<div xmlns="http://www.w3.org/1999/xhtml" class="' +
            wrapperClasses +
            '" style="width:100%;height:100%;overflow:hidden;">' +
            "<style>/* <![CDATA[ */\\n" +
            stylesText +
            "\\n/* ]]> */</style>" +
            '<div style="transform:translateY(-' +
            scrollY +
            'px);">' +
            serializedHtml +
            "</div>" +
            "</div>" +
            "</foreignObject>" +
            "</svg>";

          const svgDataUrl =
            "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgString);

          postToParent({
            type: "VIDEO_STUDIO_FRAME_DATA",
            requestId,
            dataUrl: svgDataUrl,
          });
        } catch (err) {
          postToParent({ type: "VIDEO_STUDIO_FRAME_DATA", requestId, dataUrl: null });
        }
      }

      // -----------------------------------------------------------------------
      // Parent Message Bridge
      // -----------------------------------------------------------------------
      window.addEventListener("message", (event) => {
        const msg = event.data;
        if (!msg || typeof msg !== "object") return;

        if (msg.type === "VIDEO_STUDIO_CONFIG") {
          if (msg.mode) state.mode = msg.mode;
          if (typeof msg.durationSec === "number") state.durationSec = msg.durationSec;
          if (typeof msg.autoHover === "boolean") state.autoHover = msg.autoHover;
          if (typeof msg.autoClick === "boolean") state.autoClick = msg.autoClick;
          if (typeof msg.autoScroll === "boolean") state.autoScroll = msg.autoScroll;
          if (typeof msg.loopReturnToTop === "boolean") state.loopReturnToTop = msg.loopReturnToTop;
          if (typeof msg.showCursor === "boolean") state.showCursor = msg.showCursor;
          if (typeof msg.clickRipples === "boolean") state.clickRipples = msg.clickRipples;
          if (typeof msg.autoZoom === "boolean") state.autoZoom = msg.autoZoom;
          if (typeof msg.zoomIntensity === "number") state.zoomIntensity = msg.zoomIntensity;
        }

        if (msg.type === "VIDEO_STUDIO_SCAN") {
          scanAndReportTargets();
        }

        if (msg.type === "VIDEO_STUDIO_START_AUTOPILOT") {
          if (msg.config) {
            Object.assign(state, msg.config);
          }
          runAutoPilotChoreography({
            durationSec: msg.durationSec || state.durationSec,
            dryRun: !!msg.dryRun,
          });
        }

        if (msg.type === "VIDEO_STUDIO_START_MANUAL") {
          cancelChoreography();
          if (msg.config) {
            Object.assign(state, msg.config);
          }
          state.activeSession = true;
          state.manualActive = true;
          state.cursorVisible = true;
          state.targetX = window.innerWidth * 0.5;
          state.targetY = window.innerHeight * 0.5;
          state.x = state.targetX;
          state.y = state.targetY;
          document.documentElement.classList.add("__vs_hide_native_cursor__");
        }

        if (msg.type === "VIDEO_STUDIO_STOP") {
          cancelChoreography();
          state.activeSession = false;
          state.manualActive = false;
          state.cursorVisible = false;
          state.targetZoom = 1;
          document.documentElement.classList.remove("__vs_hide_native_cursor__");
        }

        if (msg.type === "VIDEO_STUDIO_RESET") {
          cancelChoreography();
          state.activeSession = false;
          state.manualActive = false;
          state.cursorVisible = false;
          resetCameraZoomImmediate();
          const scrollInfo = findScrollContainer();
          setScrollTop(scrollInfo, 0);
          document.documentElement.classList.remove("__vs_hide_native_cursor__");
          scanAndReportTargets();
        }

        if (msg.type === "VIDEO_STUDIO_CAPTURE_FRAME") {
          captureFastFrame(msg.requestId);
        }
      });

      // Auto-scan once component mounts and settles
      setTimeout(() => scanAndReportTargets(), 450);
      setTimeout(() => scanAndReportTargets(), 1400);
    })();
  `;
}
