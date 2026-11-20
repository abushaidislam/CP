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

        // Zero-Lag Replay Capture (records tiny interaction events at 0% encoding load)
        replayRecording: false,
        replayStartTs: 0,
        replayEvents: [],
        lastReplayMoveTs: 0,

        // Cached stylesheet text for fast Blob DOM snapshots
        cachedStyleSig: "",
        cachedStylesText: "",
        externalImgCache: new Map(),
        hoveredAncestors: [],

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
        "textarea:not([disabled])",
        "a[href]",
        "[data-interactive]",
        "[aria-haspopup]",
        "[aria-expanded]",
        "[aria-pressed]",
        "canvas[tabindex]",
      ].join(",");

      function waitForComponentMount(maxWaitMs) {
        const limit = Math.max(100, Number(maxWaitMs || 1800));
        return new Promise((resolve) => {
          const start = performance.now();
          function check() {
            const root = document.getElementById("root");
            const hasMountedTree =
              root &&
              root.children.length > 0 &&
              root.getBoundingClientRect().height > 12;
            if (
              (window.__STUDIO_COMPONENT_MOUNTED__ && hasMountedTree) ||
              hasMountedTree ||
              performance.now() - start >= limit
            ) {
              resolve();
              return;
            }
            requestAnimationFrame(check);
          }
          check();
        });
      }

      function isInteractiveAtPoint(x, y) {
        try {
          const el = document.elementFromPoint(x, y);
          if (!el || !(el instanceof Element)) return false;
          if (el.closest && el.closest("#__video_studio_overlay__")) return false;
          if (el.matches && el.matches(INTERACTIVE_SELECTOR)) return true;
          if (el.closest && el.closest(INTERACTIVE_SELECTOR)) return true;
          const style = window.getComputedStyle(el);
          return (
            style.cursor === "pointer" ||
            style.cursor === "grab" ||
            style.cursor === "grabbing"
          );
        } catch (e) {
          return false;
        }
      }

      function findScrollContainer() {
        const docEl = document.scrollingElement || document.documentElement;
        const rawDocScroll = Math.max(0, docEl.scrollHeight - window.innerHeight);
        // Ignore tiny < 96px wrapper padding overflows around min-h-screen components
        const docScrollable = rawDocScroll > 96 ? rawDocScroll : 0;

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
              if (dist > 80 && el.clientHeight > 140 && dist > bestInnerDist) {
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
        if (!el || !(el instanceof Element)) return false;
        if (el.closest && el.closest("#__video_studio_overlay__")) return false;
        const style = window.getComputedStyle(el);
        if (
          style.display === "none" ||
          style.visibility === "hidden" ||
          parseFloat(style.opacity) < 0.06 ||
          style.pointerEvents === "none"
        ) {
          return false;
        }
        const rect = el.getBoundingClientRect();
        if (rect.width < 10 || rect.height < 10) return false;
        if (rect.width > window.innerWidth * 0.96 && rect.height > window.innerHeight * 0.96) {
          return false;
        }
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        if (cx < 4 || cx > window.innerWidth - 4 || cy < 4 || cy > window.innerHeight - 4) {
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

        // Also detect interactive <canvas> elements (3D sculptures, interactive visualizations)
        const canvases = document.body.querySelectorAll("#root canvas");
        for (let i = 0; i < canvases.length; i++) {
          const c = canvases[i];
          if (seen.has(c) || !isVisibleInViewport(c)) continue;
          const style = window.getComputedStyle(c);
          const isInteractiveCanvas =
            c.hasAttribute("tabindex") ||
            style.cursor === "grab" ||
            style.cursor === "pointer" ||
            style.cursor === "crosshair" ||
            canvases.length === 1;
          if (isInteractiveCanvas) {
            seen.add(c);
            list.push(c);
          }
        }

        const extraEls = document.body.querySelectorAll(
          "#root div, #root li, #root label, #root article, #root span, #root section"
        );
        for (let i = 0; i < extraEls.length && list.length < 48; i++) {
          const el = extraEls[i];
          if (seen.has(el) || !isVisibleInViewport(el)) continue;
          const style = window.getComputedStyle(el);
          if (style.cursor !== "pointer" && style.cursor !== "grab") continue;
          const rect = el.getBoundingClientRect();
          if (
            rect.width >= 24 &&
            rect.height >= 20 &&
            rect.width <= window.innerWidth * 0.78 &&
            rect.height <= window.innerHeight * 0.65
          ) {
            if (!el.querySelector("button, a[href], [role='menuitem'], [role='option'], canvas")) {
              seen.add(el);
              list.push(el);
            }
          }
        }

        return list;
      }

      function getElementDescriptorText(el) {
        if (!el || !(el instanceof Element)) return "";
        return (
          (el.textContent || "") +
          " " +
          (el.getAttribute("aria-label") || "") +
          " " +
          (el.getAttribute("title") || "") +
          " " +
          (el.getAttribute("data-state") || "")
        )
          .trim()
          .toLowerCase();
      }

      function isCloseOrDismissButton(el) {
        if (!el || !(el instanceof Element)) return false;
        const desc = getElementDescriptorText(el);
        if (/\\b(close|dismiss|cancel|exit)\\b/.test(desc)) return true;
        const trimmed = (el.textContent || "").trim();
        if (trimmed === "×" || trimmed === "✕" || trimmed === "✖") return true;
        const inDialog = el.closest && el.closest("[role='dialog'], [aria-modal='true']");
        if (inDialog) {
          const rect = el.getBoundingClientRect();
          if (rect.width <= 44 && rect.height <= 44 && trimmed.length <= 1) {
            return true;
          }
        }
        return false;
      }

      function isLikelyDropdownTrigger(el) {
        if (!el || !(el instanceof Element)) return false;
        if (
          el.hasAttribute("aria-haspopup") ||
          el.hasAttribute("aria-expanded") ||
          el.hasAttribute("aria-controls")
        ) {
          return true;
        }
        const desc = getElementDescriptorText(el);
        return /menu|dropdown|select|filter|sort|more|options|category|product|resource|solution|company/.test(
          desc
        );
      }

      function isLikelyMultiClickControl(el) {
        if (!el || !(el instanceof Element)) return false;
        const role = (el.getAttribute("role") || "").toLowerCase();
        if (role === "switch" || role === "checkbox") return true;
        const desc = getElementDescriptorText(el);
        return /next|prev|shuffle|swap|increment|plus|\\+|add|toggle|switch|cycle|step|like|heart|upvote|count|reforge/.test(
          desc
        );
      }

      function isDecrementOrPrevControl(el) {
        if (!el || !(el instanceof Element)) return false;
        const desc = getElementDescriptorText(el);
        return /\\b(down|prev|previous|subtract|minus|decrement|back)\\b/.test(desc);
      }

      function isIncrementOrNextControl(el) {
        if (!el || !(el instanceof Element)) return false;
        const desc = getElementDescriptorText(el);
        return /\\b(up|next|add|plus|increment|forward)\\b/.test(desc);
      }

      function isPrimaryStartOrActionControl(el) {
        if (!el || !(el instanceof Element)) return false;
        const desc = getElementDescriptorText(el);
        return /\\b(start|play|run|launch|confirm|begin|watch demo|active|inactive)\\b/.test(
          desc
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
            (other) => Math.hypot(other.cx - cx, other.cy - cy) < (minDistance || 28)
          );
          if (!tooClose) {
            results.push({ el, cx, cy, rect });
          }
        }
        return results;
      }

      function discoverPrimaryTargets() {
        const all = getAllVisibleInteractiveElements();
        const deduped = deduplicateTargets(all, 28);

        deduped.sort((a, b) => {
          // Prioritize interactive HTML controls before large canvases so CTAs are visited cleanly
          const aIsCanvas = a.el.tagName === "CANVAS" ? 1 : 0;
          const bIsCanvas = b.el.tagName === "CANVAS" ? 1 : 0;
          if (aIsCanvas !== bIsCanvas && deduped.length <= 4) {
            return aIsCanvas - bIsCanvas;
          }
          const bandA = Math.floor(a.cy / 75);
          const bandB = Math.floor(b.cy / 75);
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
            if (isCloseOrDismissButton(node)) return -5;
            const role = node.getAttribute("role") || "";
            if (role === "menuitem" || role === "option" || role === "tab") return 4;
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

        return deduplicateTargets(fresh, 20).slice(0, 5);
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
      // Synthetic Pointer / Hover / Click / Drag Dispatch (Auto-Pilot)
      // -----------------------------------------------------------------------
      function createPointerInit(x, y, overrides) {
        return Object.assign(
          {
            bubbles: true,
            cancelable: true,
            composed: true,
            view: window,
            detail: 1,
            clientX: x,
            clientY: y,
            screenX: x,
            screenY: y,
            pointerId: 1,
            pointerType: "mouse",
            isPrimary: true,
            button: 0,
            buttons: 0,
          },
          overrides || {}
        );
      }

      function createMouseInit(x, y, overrides) {
        return Object.assign(
          {
            bubbles: true,
            cancelable: true,
            composed: true,
            view: window,
            detail: 1,
            clientX: x,
            clientY: y,
            screenX: x,
            screenY: y,
            button: 0,
            buttons: 0,
          },
          overrides || {}
        );
      }

      function markHoverAncestors(targetEl) {
        if (state.hoveredAncestors && state.hoveredAncestors.length > 0) {
          for (let i = 0; i < state.hoveredAncestors.length; i++) {
            try {
              state.hoveredAncestors[i].removeAttribute("data-studio-hover");
            } catch (e) {}
          }
          state.hoveredAncestors = [];
        }
        let curr = targetEl;
        let depth = 0;
        while (curr && curr instanceof Element && curr.id !== "root" && depth < 6) {
          try {
            curr.setAttribute("data-studio-hover", "true");
            state.hoveredAncestors.push(curr);
          } catch (e) {}
          curr = curr.parentElement;
          depth++;
        }
      }

      function clearSyntheticHover() {
        markHoverAncestors(null);
        if (state.lastHoveredEl) {
          try {
            state.lastHoveredEl.removeAttribute("data-studio-hover");
            state.lastHoveredEl.dispatchEvent(
              new PointerEvent("pointerout", createPointerInit(state.x, state.y))
            );
            state.lastHoveredEl.dispatchEvent(
              new PointerEvent(
                "pointerleave",
                createPointerInit(state.x, state.y, { bubbles: false, cancelable: false })
              )
            );
            state.lastHoveredEl.dispatchEvent(
              new MouseEvent("mouseout", createMouseInit(state.x, state.y))
            );
            state.lastHoveredEl.dispatchEvent(
              new MouseEvent(
                "mouseleave",
                createMouseInit(state.x, state.y, { bubbles: false, cancelable: false })
              )
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
              new PointerEvent("pointerout", createPointerInit(x, y))
            );
            state.lastHoveredEl.dispatchEvent(
              new PointerEvent(
                "pointerleave",
                createPointerInit(x, y, { bubbles: false, cancelable: false })
              )
            );
            state.lastHoveredEl.dispatchEvent(
              new MouseEvent("mouseout", createMouseInit(x, y))
            );
            state.lastHoveredEl.dispatchEvent(
              new MouseEvent(
                "mouseleave",
                createMouseInit(x, y, { bubbles: false, cancelable: false })
              )
            );
          } catch (e) {}
        }

        if (state.lastHoveredEl !== el) {
          state.lastHoveredEl = el;
          markHoverAncestors(el);
          try {
            el.setAttribute("data-studio-hover", "true");
            el.dispatchEvent(new PointerEvent("pointerover", createPointerInit(x, y)));
            el.dispatchEvent(
              new PointerEvent(
                "pointerenter",
                createPointerInit(x, y, { bubbles: false, cancelable: false })
              )
            );
            el.dispatchEvent(new MouseEvent("mouseover", createMouseInit(x, y)));
            el.dispatchEvent(
              new MouseEvent(
                "mouseenter",
                createMouseInit(x, y, { bubbles: false, cancelable: false })
              )
            );
          } catch (e) {}
        }

        try {
          el.dispatchEvent(new PointerEvent("pointermove", createPointerInit(x, y)));
          el.dispatchEvent(new MouseEvent("mousemove", createMouseInit(x, y)));
        } catch (e) {}

        return el;
      }

      function dispatchTactileClick(x, y, targetOverride) {
        // Snap cursor tip to exact click coordinate so visual cursor & ripple are 100% aligned
        state.targetX = x;
        state.targetY = y;
        state.x = x;
        state.y = y;
        state.vx = 0;
        state.vy = 0;

        const hitEl = document.elementFromPoint(x, y);
        const el =
          targetOverride && document.contains(targetOverride)
            ? targetOverride
            : hitEl;

        state.isPressed = true;
        state.targetScale = 0.86;
        spawnMinimalClickPulse(x, y);
        emitCursorTelemetryNow();

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
              if (typeof el.focus === "function") {
                el.focus({ preventScroll: true });
              }
              el.dispatchEvent(
                new PointerEvent("pointerdown", createPointerInit(x, y, { buttons: 1 }))
              );
              el.dispatchEvent(
                new MouseEvent("mousedown", createMouseInit(x, y, { buttons: 1 }))
              );
            } catch (e) {}

            setTimeout(() => {
              state.isPressed = false;
              state.targetScale = 1;
              try {
                el.dispatchEvent(
                  new PointerEvent("pointerup", createPointerInit(x, y, { buttons: 0 }))
                );
                el.dispatchEvent(
                  new MouseEvent("mouseup", createMouseInit(x, y, { buttons: 0 }))
                );

                // For native checkboxes/radios/summaries, .click() toggles native checked state;
                // for all other elements, dispatch a MouseEvent("click") with exact clientX/clientY
                const tag = (el.tagName || "").toUpperCase();
                const inputType = (el.getAttribute && el.getAttribute("type")) || "";
                if (
                  (tag === "INPUT" && (inputType === "checkbox" || inputType === "radio")) ||
                  tag === "SUMMARY" ||
                  tag === "LABEL"
                ) {
                  if (typeof el.click === "function") {
                    el.click();
                  }
                } else {
                  el.dispatchEvent(
                    new MouseEvent("click", createMouseInit(x, y, { buttons: 0 }))
                  );
                }
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

      /**
       * Smooth 3D/Canvas interactive drag-orbit gesture + click for <canvas> targets
       */
      async function dispatchCanvasDragGesture(canvasEl, durationMs) {
        if (!canvasEl || !document.contains(canvasEl)) return;
        const rect = canvasEl.getBoundingClientRect();
        const cx = rect.left + rect.width * 0.5;
        const cy = rect.top + rect.height * 0.5;
        const rx = Math.min(95, rect.width * 0.24);
        const ry = Math.min(55, rect.height * 0.18);

        const startX = cx - rx * 0.65;
        const startY = cy + ry * 0.35;
        await glideTo(startX, startY, 260, true);
        if (state.choreographyCancelled) return;

        state.isPressed = true;
        state.targetScale = 0.88;
        spawnMinimalClickPulse(startX, startY);

        try {
          canvasEl.dispatchEvent(
            new PointerEvent("pointerdown", createPointerInit(startX, startY, { buttons: 1 }))
          );
          canvasEl.dispatchEvent(
            new MouseEvent("mousedown", createMouseInit(startX, startY, { buttons: 1 }))
          );
        } catch (e) {}

        const dragDuration = Math.max(420, Math.min(950, Number(durationMs || 680)));
        const dragStart = performance.now();

        await new Promise((resolve) => {
          function step(now) {
            if (state.choreographyCancelled) {
              resolve();
              return;
            }
            const raw = Math.min(1, (now - dragStart) / dragDuration);
            const eased = easeInOutSine(raw);
            const angle = eased * Math.PI * 1.15;
            const curX = cx - Math.cos(angle) * rx * 0.75;
            const curY = cy + Math.sin(angle * 1.5) * ry * 0.65;

            state.targetX = curX;
            state.targetY = curY;
            state.x = curX;
            state.y = curY;

            try {
              canvasEl.dispatchEvent(
                new PointerEvent("pointermove", createPointerInit(curX, curY, { buttons: 1 }))
              );
              canvasEl.dispatchEvent(
                new MouseEvent("mousemove", createMouseInit(curX, curY, { buttons: 1 }))
              );
            } catch (e) {}

            if (raw >= 1) {
              resolve();
              return;
            }
            state.choreographyRaf = requestAnimationFrame(step);
          }
          state.choreographyRaf = requestAnimationFrame(step);
        });

        state.isPressed = false;
        state.targetScale = 1;
        try {
          canvasEl.dispatchEvent(
            new PointerEvent("pointerup", createPointerInit(state.x, state.y, { buttons: 0 }))
          );
          canvasEl.dispatchEvent(
            new MouseEvent("mouseup", createMouseInit(state.x, state.y, { buttons: 0 }))
          );
        } catch (e) {}

        if (state.choreographyCancelled) return;
        await waitMs(180);
        if (state.choreographyCancelled) return;

        // Follow up with a crisp center tap to trigger reforge / canvas click handlers
        await glideTo(cx, cy, 200, true);
        if (!state.choreographyCancelled && state.autoClick) {
          await dispatchTactileClick(cx, cy, canvasEl);
          await waitMs(280);
        }
      }

      // -----------------------------------------------------------------------
      // Master 60fps Spring Physics & Minimal Pulse Loop (Zero Camera Zoom)
      // -----------------------------------------------------------------------
      function stepPhysics(now) {
        const dt = Math.min(0.035, Math.max(0.004, (now - state.lastFrameTs) / 1000));
        state.lastFrameTs = now;

        // Guard: keep overlay connected if DOM was mutated
        if (!overlay.isConnected && document.body) {
          document.body.appendChild(overlay);
        }

        const isManualDriving = state.manualActive || state.mode === "manual";
        // In Auto-Pilot, glideTo already computes a cubic-eased Bézier curve, so use a high-precision
        // critically-damped tracking spring (820 / 58) so the cursor tip never lags behind clicks
        const stiffness = isManualDriving ? 460 : 820;
        const damping = isManualDriving ? 38 : 58;

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
          const startX = state.x;
          const startY = state.y;
          const midX = (startX + destX) / 2;
          const midY = (startY + destY) / 2;
          const dx = destX - startX;
          const dy = destY - startY;
          const dist = Math.hypot(dx, dy);
          const curveOffset = Math.min(64, dist * 0.16) * (dx >= 0 ? -1 : 1);
          const ctrlX = midX - (dy / Math.max(1, dist)) * curveOffset;
          const ctrlY = midY + (dx / Math.max(1, dist)) * curveOffset;

          const start = performance.now();
          let settleStart = 0;

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
              if (!settleStart) settleStart = now;
              const errDist = Math.hypot(state.x - destX, state.y - destY);
              if (errDist <= 1.8 || now - settleStart >= 55) {
                state.targetX = destX;
                state.targetY = destY;
                state.x = destX;
                state.y = destY;
                state.vx = 0;
                state.vy = 0;
                if (dispatchHover) {
                  dispatchPointerAt(destX, destY);
                }
                emitCursorTelemetryNow();
                resolve();
                return;
              }
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

        // Separate primary revealed items from modal close/dismiss buttons
        const actionItems = revealedItems.filter((item) => !isCloseOrDismissButton(item.el));
        const closeItems = revealedItems.filter((item) => isCloseOrDismissButton(item.el));
        const activeDialog = document.querySelector("[role='dialog'], [aria-modal='true']");

        // If a dialog/modal opened and only has a Close button (e.g. InkOrbitHero workflow dialog),
        // showcase the live dialog animation before optionally closing it!
        if (actionItems.length === 0 && closeItems.length > 0) {
          if (activeDialog) {
            const dlgRect = activeDialog.getBoundingClientRect();
            const dcx = dlgRect.left + dlgRect.width * 0.46;
            const dcy = dlgRect.top + dlgRect.height * 0.52;
            await glideTo(dcx, dcy, 320, state.autoHover);
            if (state.choreographyCancelled) return;
            const showcaseWait = Math.min(
              2200,
              Math.max(700, (deadlineTs - performance.now()) * 0.58)
            );
            await waitMs(showcaseWait);
            if (state.choreographyCancelled) return;
          }
          if (state.autoClick && performance.now() < deadlineTs - 420) {
            const closeBtn = closeItems[0];
            if (document.contains(closeBtn.el) && isVisibleInViewport(closeBtn.el)) {
              const r = closeBtn.el.getBoundingClientRect();
              const cx = r.left + r.width / 2;
              const cy = r.top + r.height / 2;
              await glideTo(cx, cy, 260, state.autoHover);
              if (!state.choreographyCancelled) {
                await waitMs(140);
                await dispatchTactileClick(cx, cy, closeBtn.el);
                await waitMs(220);
              }
            }
          }
          return;
        }

        const maxHoverItems = Math.min(actionItems.length, 3);
        for (let i = 0; i < maxHoverItems; i++) {
          if (state.choreographyCancelled || performance.now() > deadlineTs - 240) return;
          const item = actionItems[i];
          if (!document.contains(item.el) || !isVisibleInViewport(item.el)) continue;

          const r = item.el.getBoundingClientRect();
          const ix = r.left + r.width / 2;
          const iy = r.top + r.height / 2;

          await glideTo(ix, iy, 260, state.autoHover);
          if (state.choreographyCancelled) return;
          await waitMs(170);

          const shouldClickItem =
            state.autoClick &&
            (i === maxHoverItems - 1 || (maxHoverItems >= 2 && i === 1));

          if (shouldClickItem) {
            const subBefore = new Set(getAllVisibleInteractiveElements());
            await dispatchTactileClick(ix, iy, item.el);
            await waitMs(260);
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

        // Ensure React component has mounted into #root before scanning targets
        await waitForComponentMount(1800);
        if (state.choreographyCancelled) return;

        const totalMs = Math.max(3000, (config.durationSec || state.durationSec || 8) * 1000);
        const startTime = performance.now();
        const scrollInfo = findScrollContainer();
        setScrollTop(scrollInfo, 0);

        const vw = Math.max(320, window.innerWidth);
        const vh = Math.max(180, window.innerHeight);

        state.x = vw * 0.82;
        state.y = vh * 0.8;
        state.targetX = state.x;
        state.targetY = state.y;
        state.vx = 0;
        state.vy = 0;
        state.cursorVisible = true;
        emitCursorTelemetryNow([]);

        const { targets } = scanAndReportTargets();
        const shouldScroll = state.autoScroll && scrollInfo.maxScroll > 96;

        const entryMs = Math.round(totalMs * 0.08);
        const scrollDownMs = shouldScroll ? Math.round(totalMs * 0.24) : 0;
        const scrollReturnMs = shouldScroll && state.loopReturnToTop ? Math.round(totalMs * 0.12) : 0;
        const settleMs = Math.round(totalMs * 0.06);
        const interactionBudgetMs = Math.max(
          1800,
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
          const isSingleTarget = targets.length === 1;
          const maxVisits = Math.min(targets.length, totalMs >= 10000 ? 6 : 5);
          let clickedIncrementRecently = false;
          let triggeredStartAction = false;

          for (let i = 0; i < maxVisits; i++) {
            if (state.choreographyCancelled || performance.now() > interactionDeadline - 220) {
              break;
            }
            const t = targets[i];
            if (!document.contains(t.el) || !isVisibleInViewport(t.el)) continue;

            // Interactive 3D / Canvas target: perform smooth drag-orbit + reforge click
            if (t.el.tagName === "CANVAS") {
              const remainingBudget = Math.max(520, interactionDeadline - performance.now());
              await dispatchCanvasDragGesture(t.el, Math.min(820, remainingBudget * 0.45));
              continue;
            }

            // If we just clicked an "Up / Next / Increment" button, skip clicking its immediate "Down / Prev" counterpart
            // so we don't undo the state transition (e.g. RetroHardwareHandheldClock Rocker Up vs Rocker Down)
            const skipUndoClick =
              clickedIncrementRecently &&
              isDecrementOrPrevControl(t.el) &&
              targets.length >= 3;

            const freshRect = t.el.getBoundingClientRect();
            const tx = freshRect.left + freshRect.width / 2;
            const ty = freshRect.top + freshRect.height / 2;

            const beforeHoverSet = new Set(getAllVisibleInteractiveElements());

            const remainingTargets = Math.max(1, maxVisits - i);
            const remainingBudget = Math.max(480, interactionDeadline - performance.now());
            const slotMs = Math.min(1800, Math.floor(remainingBudget / remainingTargets));
            const moveMs = Math.max(220, Math.min(500, Math.round(slotMs * 0.36)));

            await glideTo(tx, ty, moveMs, state.autoHover);
            if (state.choreographyCancelled) return;
            await waitMs(170);
            if (state.choreographyCancelled) return;

            const hoverRevealed = findNewlyRevealedTargets(beforeHoverSet, t.el);
            if (hoverRevealed.length > 0) {
              await exploreRevealedLayer(hoverRevealed, interactionDeadline, 1);
              if (state.choreographyCancelled) return;
              continue;
            }

            if (state.autoClick && !skipUndoClick) {
              const isStartAction = isPrimaryStartOrActionControl(t.el);
              if (isIncrementOrNextControl(t.el)) {
                clickedIncrementRecently = true;
              }

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

              if (isStartAction) {
                triggeredStartAction = true;
                // Let the live running state (e.g. countdown timer, blinking colon, progress ring) play out!
                const showcaseRunningMs = Math.min(
                  1800,
                  Math.max(450, (interactionDeadline - performance.now()) * 0.55)
                );
                await waitMs(showcaseRunningMs);
                continue;
              }

              const wantsMultiClick =
                !isLikelyDropdownTrigger(t.el) &&
                (isSingleTarget || isLikelyMultiClickControl(t.el));

              if (wantsMultiClick && performance.now() < interactionDeadline - 650) {
                const extraClicks = isSingleTarget ? 2 : 1;
                for (let c = 0; c < extraClicks; c++) {
                  if (
                    state.choreographyCancelled ||
                    performance.now() > interactionDeadline - 380 ||
                    !document.contains(t.el) ||
                    !isVisibleInViewport(t.el)
                  ) {
                    break;
                  }
                  await waitMs(400);
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
            } else if (!skipUndoClick) {
              const orbit = Math.min(26, freshRect.width * 0.24);
              await glideTo(tx + orbit, ty - 5, 260, true);
              await glideTo(tx - orbit * 0.6, ty + 5, 260, true);
            }
          }

          // Only revisit target[0] at the end if we didn't just trigger a live start/run action
          if (
            !state.choreographyCancelled &&
            !triggeredStartAction &&
            targets.length >= 2 &&
            performance.now() < interactionDeadline - 850
          ) {
            const freshList = discoverPrimaryTargets();
            const revisit = freshList[0];
            if (
              revisit &&
              revisit.el.tagName !== "CANVAS" &&
              document.contains(revisit.el) &&
              isVisibleInViewport(revisit.el)
            ) {
              const r = revisit.el.getBoundingClientRect();
              await glideTo(r.left + r.width / 2, r.top + r.height / 2, 340, state.autoHover);
              if (
                state.autoClick &&
                !state.choreographyCancelled &&
                isLikelyMultiClickControl(revisit.el)
              ) {
                await waitMs(140);
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
          await glideTo(vw * 0.78, vh * 0.52, 260, state.autoHover);
          if (state.choreographyCancelled) return;
          await smoothScrollTo(scrollInfo, scrollInfo.maxScroll, scrollDownMs);
          if (state.choreographyCancelled) return;

          if (state.loopReturnToTop) {
            await waitMs(220);
            if (state.choreographyCancelled) return;
            await smoothScrollTo(scrollInfo, 0, scrollReturnMs);
          }
        }

        const remainingSettle = Math.max(
          160,
          Math.min(settleMs + 400, totalMs - (performance.now() - startTime))
        );
        await waitMs(remainingSettle);
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

      function recordReplayEvent(kind, clientX, clientY) {
        if (!state.replayRecording) return;
        const now = performance.now();
        if (kind === "move" && now - state.lastReplayMoveTs < 14) return;
        if (kind === "move") state.lastReplayMoveTs = now;
        const vw = Math.max(1, window.innerWidth);
        const vh = Math.max(1, window.innerHeight);
        const scrollInfo = findScrollContainer();
        state.replayEvents.push({
          t: Math.max(0, Math.round(now - state.replayStartTs)),
          kind: kind,
          nx: Math.max(0, Math.min(1, clientX / vw)),
          ny: Math.max(0, Math.min(1, clientY / vh)),
          scrollY: getScrollTop(scrollInfo),
        });
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
          state.x = clientX;
          state.y = clientY;
          state.vx = 0;
          state.vy = 0;
        }
        state.cursorVisible = true;
        syncNativeCursorVisibility();
        recordReplayEvent("move", clientX, clientY);

        const now = performance.now();
        if (now - state.lastHoverCheckTs >= 40) {
          state.lastHoverCheckTs = now;
          state.hoveringInteractive = isInteractiveAtPoint(clientX, clientY);
          const hoveredEl = document.elementFromPoint(clientX, clientY);
          if (hoveredEl && hoveredEl !== state.lastHoveredEl) {
            state.lastHoveredEl = hoveredEl;
            markHoverAncestors(hoveredEl);
          }
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
        recordReplayEvent("down", clientX, clientY);
      }

      function handleManualUp() {
        if (!isManualCursorTrackingEnabled()) return;
        state.isPressed = false;
        state.targetScale = 1;
        recordReplayEvent("up", state.lastKnownX, state.lastKnownY);
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
        if (state.replayRecording) {
          setTimeout(() => {
            recordReplayEvent("scroll", state.lastKnownX, state.lastKnownY);
          }, 16);
        }
      };
      const onCaptureScroll = () => {
        if (state.replayRecording) {
          recordReplayEvent("scroll", state.lastKnownX, state.lastKnownY);
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
      document.addEventListener("scroll", onCaptureScroll, { capture: true, passive: true });
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
      // Zero-Lag Replay Playback Engine
      // -----------------------------------------------------------------------
      async function runRecordedReplay(events, durationMs) {
        cancelChoreography();
        state.choreographyCancelled = false;
        state.activeSession = true;
        state.manualActive = false;
        state.replayRecording = false;
        state.cursorVisible = true;
        state.isPressed = false;
        state.targetScale = 1;
        syncNativeCursorVisibility();

        const scrollInfo = findScrollContainer();
        setScrollTop(scrollInfo, 0);

        const vw = Math.max(1, window.innerWidth);
        const vh = Math.max(1, window.innerHeight);

        if (events && events.length > 0) {
          state.x = events[0].nx * vw;
          state.y = events[0].ny * vh;
          state.targetX = state.x;
          state.targetY = state.y;
          state.vx = 0;
          state.vy = 0;
        }
        emitCursorTelemetryNow([]);

        const totalMs = Math.max(400, Number(durationMs || 0));
        const playStart = performance.now();
        let idx = 0;

        await new Promise((resolve) => {
          function tick(now) {
            if (state.choreographyCancelled) {
              resolve();
              return;
            }
            const elapsed = now - playStart;
            while (idx < events.length && events[idx].t <= elapsed) {
              const ev = events[idx];
              idx += 1;
              const px = ev.nx * vw;
              const py = ev.ny * vh;
              if (ev.kind === "move") {
                state.targetX = px;
                state.targetY = py;
                dispatchPointerAt(px, py);
              } else if (ev.kind === "down") {
                state.targetX = px;
                state.targetY = py;
                void dispatchTactileClick(px, py);
              } else if (ev.kind === "up") {
                state.isPressed = false;
                state.targetScale = 1;
              } else if (ev.kind === "scroll") {
                setScrollTop(scrollInfo, ev.scrollY || 0);
              }
            }
            if (elapsed >= totalMs + 180) {
              resolve();
              return;
            }
            state.choreographyRaf = requestAnimationFrame(tick);
          }
          state.choreographyRaf = requestAnimationFrame(tick);
        });

        if (state.choreographyCancelled) return;
        clearSyntheticHover();
        state.activeSession = false;
        state.cursorVisible = false;
        state.hoveringInteractive = false;
        syncNativeCursorVisibility();
        emitCursorTelemetryNow([]);
        postToParent({
          type: "VIDEO_STUDIO_CHOREOGRAPHY_COMPLETE",
          dryRun: false,
        });
      }

      // -----------------------------------------------------------------------
      // Turbo Low-Overhead Frame Snapshot Helper (Hybrid Canvas+DOM + Cached Styles + Blob)
      // -----------------------------------------------------------------------
      function warmExternalImageCache() {
        try {
          const imgs = document.querySelectorAll("img[src]");
          for (let i = 0; i < imgs.length; i++) {
            const src = imgs[i].getAttribute("src") || "";
            if (
              (src.startsWith("http://") || src.startsWith("https://")) &&
              !state.externalImgCache.has(src)
            ) {
              state.externalImgCache.set(src, "");
              fetch(src, { mode: "cors" })
                .then((r) => (r.ok ? r.blob() : null))
                .then((blob) => {
                  if (!blob) return;
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    if (typeof reader.result === "string") {
                      state.externalImgCache.set(src, reader.result);
                    }
                  };
                  reader.readAsDataURL(blob);
                })
                .catch(() => {});
            }
          }
        } catch (e) {}
      }

      function getCachedStylesText() {
        const styleElements = document.querySelectorAll("style");
        let sig = String(styleElements.length);
        for (let i = 0; i < styleElements.length; i++) {
          const el = styleElements[i];
          if (el.id === "__video_studio_styles__" || el.id === "__video_studio_hover_mirror__") continue;
          sig += ":" + el.innerHTML.length;
        }
        if (sig === state.cachedStyleSig && state.cachedStylesText) {
          return state.cachedStylesText;
        }
        const nl = String.fromCharCode(10);
        let stylesText = "";
        for (let i = 0; i < styleElements.length; i++) {
          const el = styleElements[i];
          if (el.id === "__video_studio_styles__" || el.id === "__video_studio_hover_mirror__") continue;
          stylesText += el.innerHTML + nl;
        }
        // Mirror :hover rules to [data-studio-hover="true"] so synthetic hover & SVG foreignObject snapshots display hover states
        let hoverMirrorCss = "";
        try {
          for (let s = 0; s < document.styleSheets.length; s++) {
            const sheet = document.styleSheets[s];
            let rules;
            try {
              rules = sheet.cssRules;
            } catch (e) {
              continue;
            }
            if (!rules) continue;
            for (let r = 0; r < rules.length; r++) {
              const ruleText = rules[r].cssText || "";
              if (ruleText.indexOf(":hover") !== -1) {
                hoverMirrorCss += ruleText.replace(/:hover/g, '[data-studio-hover="true"]') + nl;
              }
            }
          }
        } catch (e) {}

        if (hoverMirrorCss) {
          let mirrorEl = document.getElementById("__video_studio_hover_mirror__");
          if (!mirrorEl) {
            mirrorEl = document.createElement("style");
            mirrorEl.id = "__video_studio_hover_mirror__";
            document.head.appendChild(mirrorEl);
          }
          if (mirrorEl.textContent !== hoverMirrorCss) {
            mirrorEl.textContent = hoverMirrorCss;
          }
          stylesText += hoverMirrorCss;
        }

        // Prevent accidental CDATA termination inside XML SVG foreignObject and strip external rules
        stylesText = stylesText.replace(/\\]\\]>/g, "");
        stylesText = stylesText.replace(/@import\s+[^;]+;/gi, "");
        stylesText = stylesText.replace(/@charset\s+[^;]+;/gi, "");
        state.cachedStyleSig = sig;
        state.cachedStylesText = stylesText;
        return stylesText;
      }

      function prepareCloneForXml(sourceNode, clonedNode) {
        if (!sourceNode || !clonedNode || !(clonedNode instanceof Element)) return;

        // 1. Remove inline <script> and <style> from cloned DOM (all styles are already injected in top CDATA block)
        const removable = clonedNode.querySelectorAll("script, style");
        for (let i = 0; i < removable.length; i++) {
          removable[i].remove();
        }

        // 2. Composite live <canvas> elements into <img> snapshots so hybrid 3D/canvas + HTML components capture 100% intact
        const liveCanvases = sourceNode.querySelectorAll("canvas");
        const clonedCanvases = clonedNode.querySelectorAll("canvas");
        for (let i = 0; i < liveCanvases.length && i < clonedCanvases.length; i++) {
          const liveC = liveCanvases[i];
          const cloneC = clonedCanvases[i];
          if (liveC.width > 0 && liveC.height > 0) {
            try {
              const dataUrl = liveC.toDataURL("image/png");
              const imgReplacement = document.createElement("img");
              imgReplacement.setAttribute("src", dataUrl);
              if (liveC.className) {
                imgReplacement.setAttribute("class", liveC.className);
              }
              const rect = liveC.getBoundingClientRect();
              const prevStyle = liveC.getAttribute("style") || "";
              imgReplacement.setAttribute(
                "style",
                prevStyle +
                  (prevStyle && !prevStyle.endsWith(";") ? ";" : "") +
                  (rect.width > 0 ? "width:" + Math.round(rect.width) + "px;" : "") +
                  (rect.height > 0 ? "height:" + Math.round(rect.height) + "px;" : "")
              );
              cloneC.replaceWith(imgReplacement);
            } catch (e) {}
          }
        }

        // 3. Sync live form control state (inputs, checkboxes, selects, textareas)
        const liveInputs = sourceNode.querySelectorAll("input, textarea, select");
        const clonedInputs = clonedNode.querySelectorAll("input, textarea, select");
        for (let i = 0; i < liveInputs.length && i < clonedInputs.length; i++) {
          const liveIn = liveInputs[i];
          const cloneIn = clonedInputs[i];
          try {
            if (liveIn.tagName === "INPUT") {
              if (liveIn.type === "checkbox" || liveIn.type === "radio") {
                if (liveIn.checked) cloneIn.setAttribute("checked", "checked");
                else cloneIn.removeAttribute("checked");
              } else {
                cloneIn.setAttribute("value", liveIn.value || "");
              }
            } else if (liveIn.tagName === "TEXTAREA") {
              cloneIn.textContent = liveIn.value || "";
            }
          } catch (e) {}
        }

        // 4. Inline cached data URLs for external images so SVG foreignObject never blocks or stalls
        const clonedImgs = clonedNode.querySelectorAll("img[src]");
        for (let i = 0; i < clonedImgs.length; i++) {
          const imgEl = clonedImgs[i];
          const src = imgEl.getAttribute("src") || "";
          if (src.startsWith("http://") || src.startsWith("https://")) {
            const cached = state.externalImgCache.get(src);
            if (cached) {
              imgEl.setAttribute("src", cached);
            } else {
              warmExternalImageCache();
              imgEl.setAttribute(
                "src",
                "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Crect width='100%25' height='100%25' fill='%2327272a'/%3E%3C/svg%3E"
              );
            }
          }
        }
      }

      async function captureFastFrame(requestId) {
        const t0 = performance.now();
        try {
          const root = document.getElementById("root");
          if (!root) {
            postToParent({ type: "VIDEO_STUDIO_FRAME_DATA", requestId, dataUrl: null, captureMs: 4 });
            return;
          }

          const width = Math.max(window.innerWidth || 1280, 320);
          const height = Math.max(window.innerHeight || 720, 180);

          // Fast Path 1: Only use direct ImageBitmap when the component is a pure full-stage canvas with no HTML UI
          const allCanvases = root.querySelectorAll("canvas");
          const hasHtmlUi =
            root.querySelectorAll("button, a, input, select, textarea, h1, h2, h3, p, [role='dialog'], [role='menu']").length > 0 ||
            (root.textContent || "").trim().length > 48;

          if (allCanvases.length === 1 && !hasHtmlUi) {
            const innerCanvas = allCanvases[0];
            if (innerCanvas && innerCanvas.width > 0 && innerCanvas.height > 0) {
              if (typeof createImageBitmap === "function") {
                try {
                  const bitmap = await createImageBitmap(innerCanvas);
                  const captureMs = Math.max(1, Math.round(performance.now() - t0));
                  window.parent.postMessage(
                    { type: "VIDEO_STUDIO_FRAME_BITMAP", requestId, bitmap, captureMs },
                    "*",
                    [bitmap]
                  );
                  return;
                } catch (e) {}
              }
            }
          }

          // Fast Path 2: Full DOM + Hybrid Canvas Compositor via SVG foreignObject Blob
          const stylesText = getCachedStylesText();
          const serializer = new XMLSerializer();
          const scrollY = window.scrollY || document.documentElement.scrollTop || 0;

          const clonedRoot = root.cloneNode(true);
          prepareCloneForXml(root, clonedRoot);
          let serializedRoot = serializer.serializeToString(clonedRoot);
          serializedRoot = serializedRoot.replace(/&nbsp;/g, "&#160;");

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
            const clonedPortal = child.cloneNode(true);
            prepareCloneForXml(child, clonedPortal);
            serializedPortals += serializer.serializeToString(clonedPortal);
          }

          const isDark = document.documentElement.classList.contains("dark");
          const wrapperClasses = (
            document.documentElement.className +
            " " +
            document.body.className
          )
            .replace(/__vs_hide_native_cursor__/g, "")
            .trim();

          const nl = String.fromCharCode(10);
          const svgString =
            '<svg xmlns="http://www.w3.org/2000/svg" width="' +
            width +
            '" height="' +
            height +
            '" viewBox="0 0 ' +
            width +
            " " +
            height +
            '">' +
            '<foreignObject width="100%" height="100%">' +
            '<div xmlns="http://www.w3.org/1999/xhtml" class="' +
            wrapperClasses +
            '" style="position:relative;width:' +
            width +
            "px;height:" +
            height +
            "px;overflow:hidden;background-color:" +
            (isDark ? "#09090b" : "#ffffff") +
            ";color:" +
            (isDark ? "#fafafa" : "#09090b") +
            ';">' +
            "<style>/* <![CDATA[ */" +
            nl +
            stylesText +
            nl +
            "/* ]]> */</style>" +
            '<div style="width:100%;min-height:100%;transform:translateY(-' +
            scrollY +
            'px);">' +
            serializedRoot +
            "</div>" +
            serializedPortals +
            "</div>" +
            "</foreignObject>" +
            "</svg>";

          const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
          const captureMs = Math.max(1, Math.round(performance.now() - t0));

          postToParent({
            type: "VIDEO_STUDIO_FRAME_BLOB",
            requestId,
            blob: svgBlob,
            captureMs,
          });
        } catch (err) {
          postToParent({
            type: "VIDEO_STUDIO_FRAME_DATA",
            requestId,
            dataUrl: null,
            captureMs: Math.max(1, Math.round(performance.now() - t0)),
          });
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

        if (msg.type === "VIDEO_STUDIO_START_REPLAY_CAPTURE") {
          cancelChoreography();
          if (msg.config) {
            Object.assign(state, msg.config);
          }
          state.mode = "manual";
          state.activeSession = true;
          state.manualActive = true;
          state.cursorVisible = true;
          state.replayRecording = true;
          state.replayStartTs = performance.now();
          state.replayEvents = [];
          state.lastReplayMoveTs = 0;
          if (state.hasRealPointer) {
            state.targetX = state.lastKnownX;
            state.targetY = state.lastKnownY;
            state.x = state.lastKnownX;
            state.y = state.lastKnownY;
          }
          state.vx = 0;
          state.vy = 0;
          syncNativeCursorVisibility();
          emitCursorTelemetryNow([]);
          recordReplayEvent("move", state.x, state.y);
        }

        if (msg.type === "VIDEO_STUDIO_STOP_REPLAY_CAPTURE") {
          const durationMs = Math.max(300, Math.round(performance.now() - state.replayStartTs));
          const events = state.replayEvents.slice();
          state.replayRecording = false;
          state.replayEvents = [];
          state.activeSession = false;
          state.manualActive = false;
          state.isPressed = false;
          state.targetScale = 1;
          syncNativeCursorVisibility();
          postToParent({
            type: "VIDEO_STUDIO_REPLAY_TAKE",
            events,
            durationMs,
          });
        }

        if (msg.type === "VIDEO_STUDIO_PLAY_REPLAY") {
          if (msg.config) {
            Object.assign(state, msg.config);
          }
          runRecordedReplay(Array.isArray(msg.events) ? msg.events : [], msg.durationMs || 3000);
        }

        if (msg.type === "VIDEO_STUDIO_STOP") {
          cancelChoreography();
          state.replayRecording = false;
          state.replayEvents = [];
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
          state.replayRecording = false;
          state.replayEvents = [];
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

      let scanDebounceTimer = null;
      const scheduleAutoScan = (delayMs = 120) => {
        if (state.activeSession || state.manualActive) return;
        if (scanDebounceTimer) clearTimeout(scanDebounceTimer);
        scanDebounceTimer = setTimeout(() => {
          scanDebounceTimer = null;
          if (!state.activeSession && !state.manualActive) {
            warmExternalImageCache();
            scanAndReportTargets();
          }
        }, delayMs);
      };

      window.addEventListener("__STUDIO_COMPONENT_MOUNTED__", () => {
        scheduleAutoScan(60);
        setTimeout(() => scheduleAutoScan(60), 400);
      });

      const rootNode = document.getElementById("root");
      if (rootNode && typeof MutationObserver !== "undefined") {
        const rootObserver = new MutationObserver(() => {
          if (!state.activeSession && !state.manualActive) {
            scheduleAutoScan(160);
          }
        });
        rootObserver.observe(rootNode, {
          childList: true,
          subtree: true,
        });
      }

      setTimeout(() => {
        scheduleAutoScan(40);
      }, 350);
      setTimeout(() => {
        scheduleAutoScan(40);
      }, 1200);
    })();
  `;
}
