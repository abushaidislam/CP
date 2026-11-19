/**
 * In-sandbox 60fps Interaction Choreography & Minimal Spring Virtual Cursor Runtime.
 *
 * Features:
 * - Zero camera zoom-in/zoom-out (rock-steady edge-to-edge 16:9 framing).
 * - Refined minimal precision cursor with 60fps critically-damped spring physics.
 * - Ultra-minimal single hairline click pulse + micro contact point.
 * - Rock-solid Manual Live tracking:
 *   - Capture-phase document listeners for pointer/mouse/touch/wheel events so no
 *     component calling stopPropagation() or setPointerCapture() can drop tracking.
 *   - Live manual cursor preview on stage hover even before pressing Record.
 *   - Subtle interactive hover-target detection + zero-jump recording handoff.
 * - Smart Live-DOM Choreography:
 *   - Detects hover-revealed menus (mega-menus, hover cards) and traverses into them.
 *   - Detects click-revealed dropdowns, popovers, accordions, and nested menus, then
 *     smoothly hovers and clicks through the revealed sub-items.
 *   - Supports natural multi-click interactions for stateful buttons, carousels, card
 *     decks, switches, steppers, and segmented tab groups.
 *   - Smooth eased auto-scroll + optional return-to-top loop.
 */
export function buildVideoStudioRuntimeScript(): string {
  return `
    // =========================================================================
    // VIDEO STUDIO 60FPS SMART CHOREOGRAPHY & MINIMAL SPRING CURSOR RUNTIME
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
        renderInParentOverlay: false,
        activeSession: false,
        manualActive: false,
        cursorVisible: false,

        // Cursor spring physics (viewport px)
        targetX: window.innerWidth * 0.5,
        targetY: window.innerHeight * 0.5,
        x: window.innerWidth * 0.5,
        y: window.innerHeight * 0.5,
        vx: 0,
        vy: 0,
        scale: 1,
        targetScale: 1,
        tilt: 0,
        isPressed: false,
        hoveringInteractive: false,

        // Manual pointer memory & deduplication
        hasRealPointer: false,
        lastKnownX: window.innerWidth * 0.5,
        lastKnownY: window.innerHeight * 0.5,
        lastHoverCheckTs: 0,
        lastClickPulseTs: 0,
        lastEmittedVisible: false,

        // Minimal click pulse pool
        ripples: [],

        // Choreography runner
        choreographyRaf: null,
        choreographyCancelled: false,
        lastHoveredEl: null,
        masterRaf: null,
        lastFrameTs: performance.now(),
      };

      // Refined minimal cursor & hairline pulse styles (no camera zoom transforms)
      const styleEl = document.createElement("style");
      styleEl.id = "__video_studio_styles__";
      styleEl.textContent = \`
        html.__vs_hide_native_cursor__,
        html.__vs_hide_native_cursor__ * {
          cursor: none !important;
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
          width: 26px;
          height: 26px;
          margin-left: -3px;
          margin-top: -2px;
          pointer-events: none;
          will-change: transform, opacity;
          opacity: 0;
          transition: opacity 130ms cubic-bezier(0.22, 1, 0.36, 1);
          filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.36)) drop-shadow(0 1px 2px rgba(0, 0, 0, 0.28));
        }
        #__video_studio_hover_halo__ {
          position: fixed;
          top: 0;
          left: 0;
          width: 24px;
          height: 24px;
          margin-left: -12px;
          margin-top: -12px;
          border-radius: 9999px;
          pointer-events: none;
          will-change: transform, opacity;
          opacity: 0;
          transition: opacity 150ms cubic-bezier(0.22, 1, 0.36, 1);
        }
        .__vs_pulse_ring__,
        .__vs_pulse_dot__ {
          position: fixed;
          top: 0;
          left: 0;
          pointer-events: none;
          border-radius: 9999px;
          will-change: transform, opacity;
        }
      \`;
      document.head.appendChild(styleEl);

      // Build in-iframe overlay DOM (auto-hidden when parent top-layer overlay is active)
      const overlay = document.createElement("div");
      overlay.id = "__video_studio_overlay__";

      const hoverHaloEl = document.createElement("div");
      hoverHaloEl.id = "__video_studio_hover_halo__";
      overlay.appendChild(hoverHaloEl);

      const cursorEl = document.createElement("div");
      cursorEl.id = "__video_studio_cursor__";
      cursorEl.innerHTML = \`
        <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4.2 2.6L20.4 12.6C21.15 13.06 20.92 14.22 20.04 14.38L13.3 15.55L10.35 21.65C9.95 22.48 8.74 22.36 8.5 21.46L3.25 3.62C3.05 2.9 3.6 2.23 4.2 2.6Z" fill="#09090B" stroke="#FFFFFF" stroke-width="1.75" stroke-linejoin="round"/>
        </svg>
      \`;
      overlay.appendChild(cursorEl);
      if (document.body) {
        document.body.appendChild(overlay);
      }

      function syncNativeCursorVisibility() {
        const shouldHideOsCursor =
          state.showCursor &&
          (state.activeSession ||
            state.manualActive ||
            (state.mode === "manual" && state.cursorVisible));
        if (shouldHideOsCursor) {
          document.documentElement.classList.add("__vs_hide_native_cursor__");
        } else {
          document.documentElement.classList.remove("__vs_hide_native_cursor__");
        }
      }

      function postToParent(payload) {
        try {
          window.parent.postMessage(payload, "*");
        } catch (e) {}
      }

      // -----------------------------------------------------------------------
      // Scroll Container & Smart Interactive Target Discovery
      // -----------------------------------------------------------------------
      const INTERACTIVE_SELECTOR = [
        "button:not([disabled])",
        "[role='button']:not([aria-disabled='true'])",
        "[role='tab']",
        "[role='switch']",
        "[role='menuitem']",
        "[role='option']",
        "[role='checkbox']",
        "[role='radio']",
        "[role='slider']",
        "summary",
        "input:not([type='hidden']):not([disabled])",
        "select:not([disabled])",
        "a[href]",
        "[data-interactive]",
        "[aria-haspopup]",
        "[aria-expanded]",
      ].join(",");

      function isInteractiveAtPoint(x, y) {
        try {
          const el = document.elementFromPoint(x, y);
          if (!el || !(el instanceof HTMLElement)) return false;
          if (el.closest && el.closest("#__video_studio_overlay__")) return false;
          if (el.matches && el.matches(INTERACTIVE_SELECTOR)) return true;
          if (el.closest && el.closest(INTERACTIVE_SELECTOR)) return true;
          const style = window.getComputedStyle(el);
          return style.cursor === "pointer";
        } catch (e) {
          return false;
        }
      }

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

      function isVisibleInViewport(el) {
        if (!el || !(el instanceof HTMLElement)) return false;
        if (el.closest && el.closest("#__video_studio_overlay__")) return false;
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
        if (rect.width < 14 || rect.height < 14) return false;
        if (rect.width > window.innerWidth * 0.96 && rect.height > window.innerHeight * 0.96) {
          return false;
        }
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        if (cx < 6 || cx > window.innerWidth - 6 || cy < 6 || cy > window.innerHeight - 6) {
          return false;
        }
        return true;
      }

      function getAllVisibleInteractiveElements() {
        const list = [];
        const seen = new Set();

        const primaryEls = document.body.querySelectorAll(INTERACTIVE_SELECTOR);
        for (let i = 0; i < primaryEls.length; i++) {
          const el = primaryEls[i];
          if (isVisibleInViewport(el) && !seen.has(el)) {
            seen.add(el);
            list.push(el);
          }
        }

        const extraEls = document.body.querySelectorAll("div, li, label, article");
        for (let i = 0; i < extraEls.length && list.length < 48; i++) {
          const el = extraEls[i];
          if (seen.has(el) || !isVisibleInViewport(el)) continue;
          const style = window.getComputedStyle(el);
          if (style.cursor !== "pointer") continue;
          const rect = el.getBoundingClientRect();
          if (
            rect.width >= 36 &&
            rect.height >= 24 &&
            rect.width <= window.innerWidth * 0.78 &&
            rect.height <= window.innerHeight * 0.65
          ) {
            if (!el.querySelector("button, a[href], [role='menuitem'], [role='option']")) {
              seen.add(el);
              list.push(el);
            }
          }
        }

        return list;
      }

      function isLikelyDropdownTrigger(el) {
        if (!el || !(el instanceof HTMLElement)) return false;
        if (
          el.hasAttribute("aria-haspopup") ||
          el.hasAttribute("aria-expanded") ||
          el.hasAttribute("aria-controls")
        ) {
          return true;
        }
        const txt = (el.textContent || "").toLowerCase();
        const aria = (el.getAttribute("aria-label") || "").toLowerCase();
        return /menu|dropdown|select|filter|sort|more|options|category|product|resource|solution|company/.test(
          txt + " " + aria
        );
      }

      function isLikelyMultiClickControl(el) {
        if (!el || !(el instanceof HTMLElement)) return false;
        const role = (el.getAttribute("role") || "").toLowerCase();
        if (role === "switch" || role === "checkbox") return true;
        const text = ((el.textContent || "") + " " + (el.getAttribute("aria-label") || "")).toLowerCase();
        return /next|prev|shuffle|swap|increment|plus|\\+|add|toggle|switch|cycle|play|step|like|heart|upvote|count/.test(
          text
        );
      }

      function deduplicateTargets(elements, minDistance) {
        const results = [];
        for (let i = 0; i < elements.length; i++) {
          const el = elements[i];
          const rect = el.getBoundingClientRect();
          const cx = rect.left + rect.width / 2;
          const cy = rect.top + rect.height / 2;
          const tooClose = results.some(
            (other) => Math.hypot(other.cx - cx, other.cy - cy) < (minDistance || 34)
          );
          if (!tooClose) {
            results.push({ el, cx, cy, rect });
          }
        }
        return results;
      }

      function discoverPrimaryTargets() {
        const all = getAllVisibleInteractiveElements();
        const deduped = deduplicateTargets(all, 38);

        deduped.sort((a, b) => {
          const bandA = Math.floor(a.cy / 85);
          const bandB = Math.floor(b.cy / 85);
          if (bandA !== bandB) return bandA - bandB;
          return a.cx - b.cx;
        });

        return deduped.slice(0, 8);
      }

      function findNewlyRevealedTargets(beforeSet, triggerEl) {
        const nowVisible = getAllVisibleInteractiveElements();
        const fresh = [];
        for (let i = 0; i < nowVisible.length; i++) {
          const el = nowVisible[i];
          if (beforeSet.has(el) || el === triggerEl) continue;
          if (triggerEl && triggerEl.contains(el)) continue;
          fresh.push(el);
        }

        fresh.sort((a, b) => {
          const score = (node) => {
            const role = node.getAttribute("role") || "";
            if (role === "menuitem" || role === "option") return 4;
            if (node.tagName === "BUTTON" || node.tagName === "A") return 3;
            return 1;
          };
          const diff = score(b) - score(a);
          if (diff !== 0) return diff;
          const ra = a.getBoundingClientRect();
          const rb = b.getBoundingClientRect();
          if (Math.abs(ra.top - rb.top) > 12) return ra.top - rb.top;
          return ra.left - rb.left;
        });

        return deduplicateTargets(fresh, 22).slice(0, 5);
      }

      function scanAndReportTargets() {
        const root = document.getElementById("root");
        const targets = discoverPrimaryTargets();
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
      // Minimal Editorial Click Pulse Effect (Single Hairline + Micro Dot)
      // -----------------------------------------------------------------------
      function spawnMinimalClickPulse(x, y) {
        if (!state.clickRipples) return;
        const createdAt = performance.now();
        if (createdAt - state.lastClickPulseTs < 45) return;
        state.lastClickPulseTs = createdAt;

        let ring = null;
        let dot = null;

        if (!state.renderInParentOverlay) {
          const isDark = document.documentElement.classList.contains("dark");
          ring = document.createElement("div");
          ring.className = "__vs_pulse_ring__";
          ring.style.width = "34px";
          ring.style.height = "34px";
          ring.style.marginLeft = "-17px";
          ring.style.marginTop = "-17px";
          ring.style.border = isDark
            ? "1.35px solid rgba(255, 255, 255, 0.65)"
            : "1.35px solid rgba(9, 9, 11, 0.55)";
          ring.style.background = "transparent";
          overlay.appendChild(ring);

          dot = document.createElement("div");
          dot.className = "__vs_pulse_dot__";
          dot.style.width = "6px";
          dot.style.height = "6px";
          dot.style.marginLeft = "-3px";
          dot.style.marginTop = "-3px";
          dot.style.background = isDark
            ? "rgba(255, 255, 255, 0.48)"
            : "rgba(9, 9, 11, 0.36)";
          overlay.appendChild(dot);
        }

        state.ripples.push({
          x,
          y,
          createdAt,
          duration: 420,
          ring,
          dot,
        });
      }

      // -----------------------------------------------------------------------
      // Telemetry Snapshot Helper (Synchronous + 60fps Continuous)
      // -----------------------------------------------------------------------
      function emitCursorTelemetryNow(activeRippleTelemetry) {
        const vw = Math.max(1, window.innerWidth);
        const vh = Math.max(1, window.innerHeight);
        const shouldShowCursor = state.showCursor && state.cursorVisible;
        state.lastEmittedVisible = shouldShowCursor;
        postToParent({
          type: "VIDEO_STUDIO_CURSOR_STATE",
          nx: Math.max(0, Math.min(1, state.x / vw)),
          ny: Math.max(0, Math.min(1, state.y / vh)),
          visible: shouldShowCursor,
          scale: state.scale,
          tilt: state.tilt,
          hoveringInteractive: state.hoveringInteractive,
          isPressed: state.isPressed,
          ripples: activeRippleTelemetry || [],
        });
      }

      // -----------------------------------------------------------------------
      // Synthetic Pointer / Hover / Click Dispatch (Auto-Pilot)
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
        state.hoveringInteractive = isInteractiveAtPoint(x, y);

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
        state.targetScale = 0.86;
        spawnMinimalClickPulse(x, y);

        return new Promise((resolve) => {
          if (el) {
            const anchor = el.closest ? el.closest("a[href]") : null;
            const prevHref = anchor ? anchor.getAttribute("href") : null;
            const isExternalLink =
              prevHref &&
              !prevHref.startsWith("#") &&
              !prevHref.startsWith("javascript:");

            const preventNav = (ev) => {
              if (isExternalLink) {
                ev.preventDefault();
              }
            };
            if (anchor && isExternalLink) {
              anchor.addEventListener("click", preventNav, { capture: true, once: true });
            }

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
                el.dispatchEvent(
                  new MouseEvent("click", {
                    bubbles: true,
                    cancelable: true,
                    clientX: x,
                    clientY: y,
                    button: 0,
                  })
                );
              } catch (e) {}
              if (anchor && isExternalLink) {
                anchor.removeEventListener("click", preventNav, { capture: true });
              }
              resolve();
            }, 85);
          } else {
            setTimeout(() => {
              state.isPressed = false;
              state.targetScale = 1;
              resolve();
            }, 85);
          }
        });
      }

      // -----------------------------------------------------------------------
      // Master 60fps Spring Physics & Minimal Pulse Loop (Zero Camera Zoom)
      // -----------------------------------------------------------------------
      function stepPhysics(now) {
        const dt = Math.min(0.04, Math.max(0.004, (now - state.lastFrameTs) / 1000));
        state.lastFrameTs = now;

        // Guard: keep overlay connected if DOM was mutated
        if (!overlay.isConnected && document.body) {
          document.body.appendChild(overlay);
        }

        const isManualDriving = state.manualActive || state.mode === "manual";
        const stiffness = isManualDriving ? 440 : 265;
        const damping = isManualDriving ? 37 : 28;

        const ax = (state.targetX - state.x) * stiffness - state.vx * damping;
        const ay = (state.targetY - state.y) * stiffness - state.vy * damping;
        state.vx += ax * dt;
        state.vy += ay * dt;
        state.x += state.vx * dt;
        state.y += state.vy * dt;

        // Crisp subtle press & hover scale
        const desiredScale = state.isPressed
          ? 0.86
          : state.hoveringInteractive
            ? 1.04
            : state.targetScale;
        state.scale += (desiredScale - state.scale) * Math.min(1, dt * 26);

        // Gentle velocity-based tilt (minimal & organic)
        const targetTilt = Math.max(-5.5, Math.min(5.5, state.vx * 0.0055));
        state.tilt += (targetTilt - state.tilt) * Math.min(1, dt * 16);

        const shouldShowCursor = state.showCursor && state.cursorVisible;
        const showInnerDom = !state.renderInParentOverlay;
        overlay.style.display = showInnerDom ? "block" : "none";

        if (showInnerDom) {
          const isDark = document.documentElement.classList.contains("dark");
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

          hoverHaloEl.style.border = isDark
            ? "1px solid rgba(255, 255, 255, 0.28)"
            : "1px solid rgba(9, 9, 11, 0.22)";
          hoverHaloEl.style.opacity =
            shouldShowCursor && state.hoveringInteractive && !state.isPressed ? "1" : "0";
          hoverHaloEl.style.transform =
            "translate3d(" +
            state.x.toFixed(2) +
            "px, " +
            state.y.toFixed(2) +
            "px, 0) scale(" +
            (state.hoveringInteractive ? "1" : "0.75") +
            ")";
        }

        // Update minimal hairline click pulses
        const activeRippleTelemetry = [];
        const vw = Math.max(1, window.innerWidth);
        const vh = Math.max(1, window.innerHeight);

        for (let i = state.ripples.length - 1; i >= 0; i--) {
          const r = state.ripples[i];
          const p = (now - r.createdAt) / r.duration;
          if (p >= 1) {
            if (r.ring) r.ring.remove();
            if (r.dot) r.dot.remove();
            state.ripples.splice(i, 1);
            continue;
          }

          if (showInnerDom && r.ring && r.dot) {
            const easeOutQuart = 1 - Math.pow(1 - p, 4);
            const ringScale = 0.28 + easeOutQuart * 0.88;
            const ringAlpha = Math.max(0, Math.pow(1 - p, 1.4));
            const dotProgress = Math.min(1, p * 2.4);
            const dotScale = 1 - dotProgress * 0.45;
            const dotAlpha = Math.max(0, 1 - dotProgress);

            r.ring.style.transform =
              "translate3d(" +
              r.x.toFixed(1) +
              "px, " +
              r.y.toFixed(1) +
              "px, 0) scale(" +
              ringScale.toFixed(3) +
              ")";
            r.ring.style.opacity = ringAlpha.toFixed(3);

            r.dot.style.transform =
              "translate3d(" +
              r.x.toFixed(1) +
              "px, " +
              r.y.toFixed(1) +
              "px, 0) scale(" +
              dotScale.toFixed(3) +
              ")";
            r.dot.style.opacity = dotAlpha.toFixed(3);
          }

          activeRippleTelemetry.push({
            nx: Math.max(0, Math.min(1, r.x / vw)),
            ny: Math.max(0, Math.min(1, r.y / vh)),
            progress: p,
          });
        }

        // Emit 60fps cursor telemetry to parent top-layer overlay & Direct Stage compositor
        const shouldEmit =
          state.activeSession ||
          state.manualActive ||
          shouldShowCursor ||
          state.lastEmittedVisible ||
          activeRippleTelemetry.length > 0;

        if (shouldEmit) {
          emitCursorTelemetryNow(activeRippleTelemetry);
        }

        state.masterRaf = requestAnimationFrame(stepPhysics);
      }
      state.masterRaf = requestAnimationFrame(stepPhysics);

      // -----------------------------------------------------------------------
      // Curved Bézier Glide, Dropdown Traversal & Multi-Click Choreography
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
          const midX = (startX + destX) / 2;
          const midY = (startY + destY) / 2;
          const dx = destX - startX;
          const dy = destY - startY;
          const dist = Math.hypot(dx, dy);
          const curveOffset = Math.min(72, dist * 0.18) * (dx >= 0 ? -1 : 1);
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

      async function exploreRevealedLayer(revealedItems, deadlineTs, depth) {
        if (!revealedItems || revealedItems.length === 0 || depth > 2) return;
        const maxHoverItems = Math.min(revealedItems.length, 3);

        for (let i = 0; i < maxHoverItems; i++) {
          if (state.choreographyCancelled || performance.now() > deadlineTs - 240) return;
          const item = revealedItems[i];
          if (!document.contains(item.el) || !isVisibleInViewport(item.el)) continue;

          const r = item.el.getBoundingClientRect();
          const ix = r.left + r.width / 2;
          const iy = r.top + r.height / 2;

          await glideTo(ix, iy, 280, state.autoHover);
          if (state.choreographyCancelled) return;
          await waitMs(170);

          const shouldClickItem =
            state.autoClick &&
            (i === maxHoverItems - 1 || (maxHoverItems >= 2 && i === 1));

          if (shouldClickItem) {
            const subBefore = new Set(getAllVisibleInteractiveElements());
            await dispatchTactileClick(ix, iy, item.el);
            await waitMs(280);
            if (state.choreographyCancelled) return;

            const nestedRevealed = findNewlyRevealedTargets(subBefore, item.el);
            if (nestedRevealed.length > 0 && performance.now() < deadlineTs - 450) {
              await exploreRevealedLayer(nestedRevealed, deadlineTs, depth + 1);
            }
            break;
          }
        }
      }

      async function runAutoPilotChoreography(config) {
        cancelChoreography();
        state.choreographyCancelled = false;
        state.activeSession = true;
        state.manualActive = false;
        state.hoveringInteractive = false;
        syncNativeCursorVisibility();

        const totalMs = Math.max(3000, (config.durationSec || state.durationSec || 8) * 1000);
        const startTime = performance.now();
        const scrollInfo = findScrollContainer();
        setScrollTop(scrollInfo, 0);

        const vw = window.innerWidth;
        const vh = window.innerHeight;

        state.x = vw * 0.84;
        state.y = vh * 0.82;
        state.targetX = state.x;
        state.targetY = state.y;
        state.vx = 0;
        state.vy = 0;
        state.cursorVisible = true;
        emitCursorTelemetryNow([]);

        const { targets } = scanAndReportTargets();
        const shouldScroll = state.autoScroll && scrollInfo.maxScroll > 36;

        const entryMs = Math.round(totalMs * 0.08);
        const scrollDownMs = shouldScroll ? Math.round(totalMs * 0.26) : 0;
        const scrollReturnMs = shouldScroll && state.loopReturnToTop ? Math.round(totalMs * 0.13) : 0;
        const settleMs = Math.round(totalMs * 0.05);
        const interactionBudgetMs = Math.max(
          1600,
          totalMs - entryMs - scrollDownMs - scrollReturnMs - settleMs
        );
        const interactionDeadline = startTime + entryMs + interactionBudgetMs;

        if (targets.length > 0) {
          await glideTo(targets[0].cx, targets[0].cy, entryMs, state.autoHover);
        } else {
          await glideTo(vw * 0.35, vh * 0.42, entryMs, state.autoHover);
        }
        if (state.choreographyCancelled) return;

        if (targets.length > 0 && (state.autoHover || state.autoClick)) {
          const singleOrPairControls = targets.length <= 2;
          const maxVisits = Math.min(targets.length, totalMs >= 10000 ? 6 : 5);

          for (let i = 0; i < maxVisits; i++) {
            if (state.choreographyCancelled || performance.now() > interactionDeadline - 220) {
              break;
            }
            const t = targets[i];
            if (!document.contains(t.el) || !isVisibleInViewport(t.el)) continue;

            const freshRect = t.el.getBoundingClientRect();
            const tx = freshRect.left + freshRect.width / 2;
            const ty = freshRect.top + freshRect.height / 2;

            const beforeHoverSet = new Set(getAllVisibleInteractiveElements());

            const remainingTargets = Math.max(1, maxVisits - i);
            const remainingBudget = Math.max(480, interactionDeadline - performance.now());
            const slotMs = Math.min(1800, Math.floor(remainingBudget / remainingTargets));
            const moveMs = Math.max(240, Math.min(540, Math.round(slotMs * 0.38)));

            await glideTo(tx, ty, moveMs, state.autoHover);
            if (state.choreographyCancelled) return;
            await waitMs(180);
            if (state.choreographyCancelled) return;

            const hoverRevealed = findNewlyRevealedTargets(beforeHoverSet, t.el);
            if (hoverRevealed.length > 0) {
              await exploreRevealedLayer(hoverRevealed, interactionDeadline, 1);
              if (state.choreographyCancelled) return;
              continue;
            }

            if (state.autoClick) {
              const beforeClickSet = new Set(getAllVisibleInteractiveElements());
              await dispatchTactileClick(tx, ty, t.el);
              await waitMs(280);
              if (state.choreographyCancelled) return;

              const clickRevealed = findNewlyRevealedTargets(beforeClickSet, t.el);
              if (clickRevealed.length > 0) {
                await exploreRevealedLayer(clickRevealed, interactionDeadline, 1);
                if (state.choreographyCancelled) return;
                await waitMs(160);
                continue;
              }

              const wantsMultiClick =
                !isLikelyDropdownTrigger(t.el) &&
                (singleOrPairControls || isLikelyMultiClickControl(t.el));

              if (wantsMultiClick && performance.now() < interactionDeadline - 650) {
                const extraClicks = singleOrPairControls ? 2 : 1;
                for (let c = 0; c < extraClicks; c++) {
                  if (
                    state.choreographyCancelled ||
                    performance.now() > interactionDeadline - 380 ||
                    !document.contains(t.el) ||
                    !isVisibleInViewport(t.el)
                  ) {
                    break;
                  }
                  await waitMs(420);
                  if (state.choreographyCancelled) return;
                  const updatedRect = t.el.getBoundingClientRect();
                  const ux = updatedRect.left + updatedRect.width / 2;
                  const uy = updatedRect.top + updatedRect.height / 2;
                  await glideTo(ux, uy, 140, state.autoHover);
                  await dispatchTactileClick(ux, uy, t.el);
                  await waitMs(260);
                }
              } else {
                await waitMs(Math.max(160, Math.min(360, slotMs * 0.25)));
              }
            } else {
              const orbit = Math.min(26, freshRect.width * 0.24);
              await glideTo(tx + orbit, ty - 5, 280, true);
              await glideTo(tx - orbit * 0.6, ty + 5, 280, true);
            }
          }

          if (
            !state.choreographyCancelled &&
            targets.length >= 2 &&
            performance.now() < interactionDeadline - 700
          ) {
            const freshList = discoverPrimaryTargets();
            const revisit = freshList[0];
            if (revisit && document.contains(revisit.el) && isVisibleInViewport(revisit.el)) {
              const r = revisit.el.getBoundingClientRect();
              await glideTo(r.left + r.width / 2, r.top + r.height / 2, 360, state.autoHover);
              if (state.autoClick && !state.choreographyCancelled) {
                await waitMs(120);
                await dispatchTactileClick(r.left + r.width / 2, r.top + r.height / 2, revisit.el);
              }
            }
          }
        } else if (state.autoHover) {
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
              await dispatchTactileClick(waypoints[i][0], waypoints[i][1]);
            }
          }
        } else {
          await waitMs(interactionBudgetMs);
        }
        if (state.choreographyCancelled) return;

        if (shouldScroll) {
          await glideTo(vw * 0.78, vh * 0.52, 280, state.autoHover);
          if (state.choreographyCancelled) return;
          await smoothScrollTo(scrollInfo, scrollInfo.maxScroll, scrollDownMs);
          if (state.choreographyCancelled) return;

          if (state.loopReturnToTop) {
            await waitMs(220);
            if (state.choreographyCancelled) return;
            await smoothScrollTo(scrollInfo, 0, scrollReturnMs);
          }
        }

        await waitMs(settleMs);
        if (state.choreographyCancelled) return;

        clearSyntheticHover();
        state.activeSession = false;
        state.cursorVisible = false;
        state.hoveringInteractive = false;
        syncNativeCursorVisibility();
        emitCursorTelemetryNow([]);
        postToParent({
          type: "VIDEO_STUDIO_CHOREOGRAPHY_COMPLETE",
          dryRun: !!config.dryRun,
        });
      }

      // -----------------------------------------------------------------------
      // Rock-Solid Capture-Phase Manual Live Pointer Tracking
      // (Works even if components call stopPropagation() or setPointerCapture())
      // -----------------------------------------------------------------------
      function isManualCursorTrackingEnabled() {
        return state.manualActive || (!state.activeSession && state.mode === "manual");
      }

      function handleManualMove(clientX, clientY) {
        if (!Number.isFinite(clientX) || !Number.isFinite(clientY)) return;
        const wasHidden = !state.cursorVisible;
        state.hasRealPointer = true;
        state.lastKnownX = clientX;
        state.lastKnownY = clientY;

        if (!isManualCursorTrackingEnabled()) return;

        state.targetX = clientX;
        state.targetY = clientY;
        if (wasHidden) {
          // Snap cleanly onto the pointer entry edge so cursor glides right under the hand
          state.x = clientX;
          state.y = clientY;
          state.vx = 0;
          state.vy = 0;
        }
        state.cursorVisible = true;
        syncNativeCursorVisibility();

        const now = performance.now();
        if (now - state.lastHoverCheckTs >= 40) {
          state.lastHoverCheckTs = now;
          state.hoveringInteractive = isInteractiveAtPoint(clientX, clientY);
        }
      }

      function handleManualDown(clientX, clientY) {
        if (!Number.isFinite(clientX) || !Number.isFinite(clientY)) return;
        state.hasRealPointer = true;
        state.lastKnownX = clientX;
        state.lastKnownY = clientY;

        if (!isManualCursorTrackingEnabled()) return;

        state.cursorVisible = true;
        state.targetX = clientX;
        state.targetY = clientY;
        state.isPressed = true;
        state.targetScale = 0.86;
        state.hoveringInteractive = isInteractiveAtPoint(clientX, clientY);
        syncNativeCursorVisibility();
        spawnMinimalClickPulse(clientX, clientY);
      }

      function handleManualUp() {
        if (!isManualCursorTrackingEnabled()) return;
        state.isPressed = false;
        state.targetScale = 1;
      }

      const onCapturePointerMove = (e) => {
        if (!e.isTrusted) return;
        handleManualMove(e.clientX, e.clientY);
      };
      const onCaptureMouseMove = (e) => {
        if (!e.isTrusted) return;
        handleManualMove(e.clientX, e.clientY);
      };
      const onCapturePointerDown = (e) => {
        if (!e.isTrusted) return;
        handleManualDown(e.clientX, e.clientY);
      };
      const onCaptureMouseDown = (e) => {
        if (!e.isTrusted) return;
        handleManualDown(e.clientX, e.clientY);
      };
      const onCaptureUp = (e) => {
        if (!e.isTrusted) return;
        handleManualUp();
      };
      const onCaptureWheel = (e) => {
        if (!e.isTrusted) return;
        if (typeof e.clientX === "number" && typeof e.clientY === "number") {
          handleManualMove(e.clientX, e.clientY);
        }
      };
      const onCaptureTouchStart = (e) => {
        if (!e.isTrusted || !e.touches || !e.touches[0]) return;
        handleManualDown(e.touches[0].clientX, e.touches[0].clientY);
      };
      const onCaptureTouchMove = (e) => {
        if (!e.isTrusted || !e.touches || !e.touches[0]) return;
        handleManualMove(e.touches[0].clientX, e.touches[0].clientY);
      };
      const onCaptureTouchEnd = (e) => {
        if (!e.isTrusted) return;
        handleManualUp();
      };

      document.addEventListener("pointermove", onCapturePointerMove, { capture: true, passive: true });
      document.addEventListener("mousemove", onCaptureMouseMove, { capture: true, passive: true });
      document.addEventListener("pointerdown", onCapturePointerDown, { capture: true, passive: true });
      document.addEventListener("mousedown", onCaptureMouseDown, { capture: true, passive: true });
      document.addEventListener("pointerup", onCaptureUp, { capture: true, passive: true });
      document.addEventListener("mouseup", onCaptureUp, { capture: true, passive: true });
      document.addEventListener("pointercancel", onCaptureUp, { capture: true, passive: true });
      document.addEventListener("wheel", onCaptureWheel, { capture: true, passive: true });
      document.addEventListener("touchstart", onCaptureTouchStart, { capture: true, passive: true });
      document.addEventListener("touchmove", onCaptureTouchMove, { capture: true, passive: true });
      document.addEventListener("touchend", onCaptureTouchEnd, { capture: true, passive: true });

      document.documentElement.addEventListener(
        "mouseleave",
        () => {
          if (!state.activeSession && state.mode === "manual") {
            state.cursorVisible = false;
            state.isPressed = false;
            state.hoveringInteractive = false;
            syncNativeCursorVisibility();
          }
        },
        { passive: true }
      );

      // -----------------------------------------------------------------------
      // Fast Frame Snapshot Helper for Direct Stage Fallback Engine
      // (Captures #root + Radix portals/dropdowns, excluding studio overlay)
      // -----------------------------------------------------------------------
      async function captureFastFrame(requestId) {
        try {
          const root = document.getElementById("root");
          if (!root) {
            postToParent({ type: "VIDEO_STUDIO_FRAME_DATA", requestId, dataUrl: null });
            return;
          }

          const innerCanvas = root.querySelector("canvas");
          if (innerCanvas && innerCanvas.width > 0 && innerCanvas.height > 0) {
            try {
              const canvasUrl = innerCanvas.toDataURL("image/jpeg", 0.9);
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

          const width = Math.max(window.innerWidth || 1280, 320);
          const height = Math.max(window.innerHeight || 720, 180);

          let stylesText = "";
          const styleElements = document.querySelectorAll("style");
          for (let i = 0; i < styleElements.length; i++) {
            const el = styleElements[i];
            if (el.id === "__video_studio_styles__") continue;
            stylesText += el.innerHTML + "\\n";
          }

          const serializer = new XMLSerializer();
          const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
          const serializedRoot = serializer.serializeToString(root.cloneNode(true));

          // Also serialize any portaled dropdowns/popovers/menus attached to document.body
          let serializedPortals = "";
          const bodyChildren = document.body.children;
          for (let i = 0; i < bodyChildren.length; i++) {
            const child = bodyChildren[i];
            if (
              child.id === "root" ||
              child.id === "__video_studio_overlay__" ||
              child.tagName === "SCRIPT" ||
              child.tagName === "STYLE"
            ) {
              continue;
            }
            serializedPortals += serializer.serializeToString(child.cloneNode(true));
          }

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
            '" style="position:relative;width:100%;height:100%;overflow:hidden;">' +
            "<style>/* <![CDATA[ */\\n" +
            stylesText +
            "\\n/* ]]> */</style>" +
            '<div style="transform:translateY(-' +
            scrollY +
            'px);">' +
            serializedRoot +
            "</div>" +
            serializedPortals +
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
          if (typeof msg.renderInParentOverlay === "boolean") {
            state.renderInParentOverlay = msg.renderInParentOverlay;
          }
          if (!state.activeSession && state.mode !== "manual") {
            state.cursorVisible = false;
            state.hoveringInteractive = false;
          }
          syncNativeCursorVisibility();
        }

        if (msg.type === "VIDEO_STUDIO_SCAN") {
          scanAndReportTargets();
        }

        if (msg.type === "VIDEO_STUDIO_EXTERNAL_POINTER") {
          if (!isManualCursorTrackingEnabled()) return;
          const vw = Math.max(1, window.innerWidth);
          const vh = Math.max(1, window.innerHeight);
          const px = Math.max(0, Math.min(1, Number(msg.nx || 0))) * vw;
          const py = Math.max(0, Math.min(1, Number(msg.ny || 0))) * vh;
          if (msg.eventType === "down") {
            handleManualDown(px, py);
          } else if (msg.eventType === "up") {
            handleManualUp();
          } else {
            handleManualMove(px, py);
          }
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

        if (msg.type === "VIDEO_STUDIO_PREPARE_MANUAL") {
          cancelChoreography();
          if (msg.config) {
            Object.assign(state, msg.config);
          }
          state.mode = "manual";
          state.manualActive = true;
          state.cursorVisible = true;
          if (state.hasRealPointer) {
            state.targetX = state.lastKnownX;
            state.targetY = state.lastKnownY;
            state.x = state.lastKnownX;
            state.y = state.lastKnownY;
          } else {
            state.targetX = window.innerWidth * 0.5;
            state.targetY = window.innerHeight * 0.5;
            state.x = state.targetX;
            state.y = state.targetY;
          }
          state.vx = 0;
          state.vy = 0;
          syncNativeCursorVisibility();
          emitCursorTelemetryNow([]);
        }

        if (msg.type === "VIDEO_STUDIO_START_MANUAL") {
          cancelChoreography();
          if (msg.config) {
            Object.assign(state, msg.config);
          }
          state.mode = "manual";
          state.activeSession = true;
          state.manualActive = true;
          state.cursorVisible = true;
          state.isPressed = false;
          state.targetScale = 1;
          if (state.hasRealPointer) {
            state.targetX = state.lastKnownX;
            state.targetY = state.lastKnownY;
            state.x = state.lastKnownX;
            state.y = state.lastKnownY;
          } else {
            state.targetX = window.innerWidth * 0.5;
            state.targetY = window.innerHeight * 0.5;
            state.x = state.targetX;
            state.y = state.targetY;
          }
          state.vx = 0;
          state.vy = 0;
          syncNativeCursorVisibility();
          emitCursorTelemetryNow([]);
        }

        if (msg.type === "VIDEO_STUDIO_STOP") {
          cancelChoreography();
          state.activeSession = false;
          state.manualActive = false;
          state.isPressed = false;
          state.targetScale = 1;
          if (state.mode !== "manual") {
            state.cursorVisible = false;
            state.hoveringInteractive = false;
          }
          syncNativeCursorVisibility();
          emitCursorTelemetryNow([]);
        }

        if (msg.type === "VIDEO_STUDIO_RESET") {
          cancelChoreography();
          state.activeSession = false;
          state.manualActive = false;
          state.isPressed = false;
          state.targetScale = 1;
          state.cursorVisible = false;
          state.hoveringInteractive = false;
          const scrollInfo = findScrollContainer();
          setScrollTop(scrollInfo, 0);
          syncNativeCursorVisibility();
          emitCursorTelemetryNow([]);
          scanAndReportTargets();
        }

        if (msg.type === "VIDEO_STUDIO_CAPTURE_FRAME") {
          captureFastFrame(msg.requestId);
        }
      });

      setTimeout(() => scanAndReportTargets(), 450);
      setTimeout(() => scanAndReportTargets(), 1400);
    })();
  `;
}
