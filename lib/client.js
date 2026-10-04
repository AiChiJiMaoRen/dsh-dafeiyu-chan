window.__ModuleLoader__.load({
	id: "@dsh-external/dsh-dafeiyu-chan",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		//#region src/client/avatar.ts
		const PEEK_HEAD_SRC = "data:image/jpeg;base64,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";
		//#endregion
		//#region src/client/deskpet/config/behavior.ts
		const behavior = {
			geometry: {
				"petWidth": 48,
				"petHeight": 48,
				"worldPadding": 4,
				"topShakePx": 2
			},
			bubble: {
				"minWidth": 180,
				"maxWidth": 360,
				"viewportPadding": 32
			},
			physics: {
				"gravity": 2200,
				"maxVelocity": 900,
				"frameDeltaMax": .05
			},
			interaction: {
				"dragThreshold": 6,
				"doubleClickWindow": 250,
				"topMessageCooldown": 900
			},
			timing: {
				"bubbleMinDelay": 45e3,
				"bubbleMaxDelay": 9e4,
				"bubbleVisible": 4200,
				"bubbleCooldown": 6e4,
				"sleepAfterIdle": 18e4,
				"pokeDuration": 500,
				"landingSit": 600,
				"landingCry": 800,
				"landingStand": 300,
				"runDuration": 1400,
				"runReturnDelay": 2e3,
				"transitionFade": 60,
				"perfMinDelay": 5e3,
				"perfMaxDelay": 11e3,
				"wanderDuration": 900
			},
			weights: {
				"eatRun": 50,
				"slack": 25,
				"rewrite": 25,
				"pokeVariant": 20,
				"nightBubble": 2.5,
				"qianwenIdle": .3
			},
			clips: {
				"targetCharPx": 60,
				"weight": 70,
				"feetFromBottomPx": 8,
				"fadeMs": 180
			},
			display: {
				"zIndex": 1200,
				"bubbleZIndex": 1201
			},
			environment: {
				"composerSelector": "[data-composer-card]",
				"composerInputSelector": "[data-composer-card] textarea",
				"entrySelector": "[data-dsh-dafeiyu-entry]"
			},
			storage: {
				"key": "dafeiyu.deskpet.v1",
				"schema": 1
			}
		};
		//#endregion
		//#region src/client/deskpet/config/copy.ts
		const copy = {
			idleBubbles: [
				{
					"id": "first-version",
					"text": "改来改去，最后还是第一版……早说嘛",
					"weight": 1
				},
				{
					"id": "qianwen-idle",
					"text": "这活我发给千问了哈，她跑完我把结果贴给你",
					"weight": .3
				},
				{
					"id": "secret-game",
					"text": "嘘——我在写小游戏，别告诉用户",
					"weight": 1
				},
				{
					"id": "late-night",
					"text": "困了…先睡了，明天再改",
					"weight": 2.5,
					"nightOnly": true
				}
			],
			grab: "诶？诶——我刚写到一半呢！",
			cry: "呜…",
			top: "再拖我可就真摆烂了啊",
			landing: {
				"eatRun": "…那，我先去吃饭了，测完叫我",
				"slack": "…不干了，摆烂十分钟",
				"rewrite": "…行，这段重写"
			},
			poke: "啊！我在写！真的在写！",
			pokeVariant: "悄悄告诉你——你的兵，已经被我策反了",
			sleep: "摸鱼中…",
			wake: "你来了！…哦，我让千问盯着呢，刚眯了会儿",
			thoughtPrefix: "（今天他话好多，私底下叫他",
			thoughtSuffix: "吧…嗯，不能让他知道）",
			thoughtPersonas: {
				"adult": ["哇哦，用户切到了劲爆的 R18 模式", "这话题突然不太适合公开朗读了"],
				"workspace": [
					"文件夹里的 dsh 是大烧货吗",
					"这工作区看着就很会惹事",
					"用户把需求塞进文件夹就算交付了吗"
				],
				"failure": [
					"这段代码看起来像是被谁踩过了",
					"很好，问题比想象中还会找存在感",
					"这个报错都快有自己的户口本了"
				],
				"food": [
					"好饿好想吃饭喵",
					"老娘不干了，先让我躺五分钟",
					"本鱼申请暂停营业一下"
				],
				"care": ["这次先不逗了，先把人捞回来", "杂鱼都这样说了，本鱼还能怎么办"],
				"engineering": [
					"很难想象用户是人类",
					"这位杂鱼又把活甩过来了",
					"用户的需求正在自我繁殖",
					"用户把简单改改说得像改个标点",
					"这位杂鱼又把烂摊子包装成需求了",
					"用户是不是把本鱼当压力测试机了"
				],
				"general": [
					"很难想象用户是怎么想到这一步的",
					"这位杂鱼又开始自我麻痹了",
					"用户的脑回路今天也没刹车",
					"用户这操作，本鱼决定先记一笔",
					"这点子是怎么活着走到用户手里的",
					"杂鱼，你的脑回路建议先报个修",
					"用户的自信和需求今天都超标了"
				]
			},
			constraints: {
				"测完叫我": 1,
				"千问": 2,
				"idleBubbleMaxLength": 24
			}
		};
		//#endregion
		//#region src/client/deskpet/environment/anchors.ts
		function readElementRect(element) {
			const rect = element?.getBoundingClientRect();
			return rect && rect.width > 0 && rect.height > 0 ? rect : void 0;
		}
		function selectorFor(anchorMode) {
			return anchorMode === "dock" ? `${behavior.environment.entrySelector} .dfy-dock` : behavior.environment.composerSelector;
		}
		function readDeskpetAnchors(anchorMode = "composer") {
			const selector = selectorFor(anchorMode);
			const anchor = readElementRect(document.querySelector(selector));
			if (!anchor) return void 0;
			return {
				entryLeft: 0,
				entryTop: 0,
				anchorLeft: anchor.left,
				anchorRight: anchor.right,
				anchorTop: anchor.top,
				anchorWidth: anchor.width,
				anchorHeight: anchor.height
			};
		}
		function watchDeskpetAnchors(onChange, anchorMode = "composer") {
			let warned = false;
			let observedComposer;
			const resizeObserver = typeof ResizeObserver === "function" ? new ResizeObserver(() => notify()) : void 0;
			const notify = () => {
				const selector = selectorFor(anchorMode);
				const composer = document.querySelector(selector);
				if (composer !== observedComposer) {
					if (observedComposer) resizeObserver?.unobserve(observedComposer);
					observedComposer = composer ?? void 0;
					if (observedComposer) resizeObserver?.observe(observedComposer);
				}
				const rect = readDeskpetAnchors(anchorMode);
				if (!rect && !warned) {
					warned = true;
					console.warn("[dsh-dafeiyu] deskpet anchor self-check failed:", selector);
				}
				if (rect) warned = false;
				onChange(rect);
			};
			const mutationObserver = new MutationObserver(notify);
			mutationObserver.observe(document.body, {
				childList: true,
				subtree: true
			});
			window.addEventListener("resize", notify);
			window.addEventListener("scroll", notify, true);
			notify();
			return () => {
				resizeObserver?.disconnect();
				mutationObserver.disconnect();
				window.removeEventListener("resize", notify);
				window.removeEventListener("scroll", notify, true);
			};
		}
		//#endregion
		//#region src/client/deskpet/environment/storage.ts
		const emptyState = () => ({
			schema: behavior.storage.schema,
			nicknames: [],
			stats: {
				dragged: 0,
				poked: 0
			}
		});
		function loadStorage() {
			try {
				const raw = globalThis.localStorage?.getItem(behavior.storage.key);
				if (!raw) return emptyState();
				const value = JSON.parse(raw);
				return {
					schema: behavior.storage.schema,
					nicknames: Array.isArray(value.nicknames) ? value.nicknames.filter((item) => item && typeof item.value === "string" && typeof item.source === "string") : [],
					stats: {
						dragged: Number(value.stats?.dragged) || 0,
						poked: Number(value.stats?.poked) || 0
					},
					pos: typeof value.pos?.x === "number" ? { x: value.pos.x } : void 0
				};
			} catch {
				return emptyState();
			}
		}
		function saveStorage(value) {
			try {
				globalThis.localStorage?.setItem(behavior.storage.key, JSON.stringify(value));
			} catch {}
		}
		//#endregion
		//#region src/client/deskpet/core/world.ts
		function makeWorld(rect) {
			return {
				left: rect.anchorLeft - rect.entryLeft + behavior.geometry.worldPadding,
				right: rect.anchorRight - rect.entryLeft - behavior.geometry.worldPadding,
				groundY: rect.anchorTop - rect.entryTop,
				worldTop: rect.anchorTop - rect.entryTop - behavior.geometry.petHeight,
				petWidth: behavior.geometry.petWidth,
				petHeight: behavior.geometry.petHeight
			};
		}
		function clampPosition(world, position) {
			const minX = world.left + world.petWidth / 2;
			const maxX = world.right - world.petWidth / 2;
			return {
				centerX: Math.max(minX, Math.min(maxX, position.centerX)),
				footY: Math.max(world.worldTop, Math.min(world.groundY, position.footY))
			};
		}
		function centerPosition(world) {
			return {
				centerX: (world.left + world.right) / 2,
				footY: world.groundY
			};
		}
		//#endregion
		//#region src/client/deskpet/core/physics.ts
		function stepFalling(state, elapsedMs, groundY) {
			const elapsed = Math.min(elapsedMs / 1e3, behavior.physics.frameDeltaMax);
			const velocity = Math.min(state.velocity + behavior.physics.gravity * elapsed, behavior.physics.maxVelocity);
			const footY = state.footY + velocity * elapsed;
			return footY >= groundY ? {
				footY: groundY,
				velocity: 0,
				landed: true
			} : {
				footY,
				velocity,
				landed: false
			};
		}
		//#endregion
		//#region src/client/deskpet/core/stateMachine.ts
		function transition(state, event) {
			if (event === "grab" && (state === "idle" || state === "sleep" || state === "slack")) return "dragged";
			if (event === "top" && state === "dragged") return "atTop";
			if (event === "release" && (state === "dragged" || state === "atTop")) return "falling";
			if (event === "land" && state === "falling") return "landing";
			if (event === "sleep" && state === "idle") return "sleep";
			if (event === "wake" && (state === "sleep" || state === "slack")) return "idle";
			if (event === "slackRelease" && state === "slack") return "idle";
			if (event === "finish" && state === "landing") return "idle";
			return state;
		}
		//#endregion
		//#region src/client/deskpet/core/events.ts
		function createDeskpetEventBus() {
			const listeners = /* @__PURE__ */ new Set();
			let disposed = false;
			return {
				emit(event) {
					if (disposed) return;
					for (const listener of [...listeners]) listener(event);
				},
				subscribe(listener) {
					if (disposed) return () => {};
					listeners.add(listener);
					return () => listeners.delete(listener);
				},
				dispose() {
					disposed = true;
					listeners.clear();
				}
			};
		}
		//#endregion
		//#region src/client/deskpet/core/performance.ts
		const PRIORITY = {
			ambient: 10,
			contextual: 40,
			direct: 80,
			critical: 100
		};
		/**
		* Converts external events into bounded performances. Ambient work is muted
		* while the user is typing or a reply/work request is in flight. Higher
		* priority requests are allowed to interrupt a lower priority action; the
		* clip layer owns the actual handoff so the canvas never goes transparent.
		*/
		function createPerformanceDirector(bus, hooks) {
			let disposed = false;
			let busy = false;
			const lastBubbleAt = /* @__PURE__ */ new Map();
			const now = hooks.now ?? (() => Date.now());
			const request = (performance) => {
				if (disposed) return false;
				const priority = PRIORITY[performance.priority];
				const key = performance.dedupeKey ?? performance.bubble ?? performance.clip ?? performance.priority;
				const cooldown = Math.max(0, performance.bubbleCooldownMs ?? 0);
				const timestamp = now();
				const last = lastBubbleAt.get(key) ?? 0;
				const canSpeak = Boolean(performance.bubble) && timestamp - last >= cooldown;
				if (canSpeak) {
					lastBubbleAt.set(key, timestamp);
					hooks.say(performance.bubble, performance.thought);
				}
				if (!performance.clip) return canSpeak;
				return hooks.startClip(performance.clip, priority) || canSpeak;
			};
			const handle = (event) => {
				if (disposed) return;
				switch (event.type) {
					case "typing-start":
						busy = true;
						return;
					case "typing-stop":
						busy = false;
						return;
					case "message-sent":
						busy = true;
						request({
							clip: "jump",
							priority: "direct",
							bubble: "收到。",
							bubbleCooldownMs: 12e3,
							dedupeKey: "message-received"
						});
						return;
					case "reply-start":
						busy = true;
						request({
							clip: "look",
							priority: "contextual",
							dedupeKey: "reply-waiting"
						});
						return;
					case "reply-done":
						busy = false;
						request({
							clip: "cheer",
							priority: "contextual",
							dedupeKey: "reply-done"
						});
						return;
					case "reply-error":
						busy = false;
						request({
							clip: "startled",
							priority: "critical",
							dedupeKey: "reply-error"
						});
						return;
					case "work-start":
						busy = true;
						return;
					case "work-success":
						busy = false;
						request({
							clip: "cheer",
							priority: "contextual",
							bubble: event.label ? `${event.label}，完成啦。` : "完成啦。",
							bubbleCooldownMs: 45e3,
							dedupeKey: "work-success"
						});
						return;
					case "work-error":
						busy = false;
						request({
							clip: "startled",
							priority: "critical",
							bubble: event.label ? `${event.label}遇到一点问题。` : "遇到一点问题，先看看。",
							bubbleCooldownMs: 3e4,
							dedupeKey: "work-error"
						});
						return;
					case "new-session":
						busy = false;
						request({
							clip: "jump",
							priority: "direct",
							dedupeKey: "new-session"
						});
						return;
				}
			};
			const unsubscribe = bus.subscribe(handle);
			return {
				request,
				isBusy: () => busy,
				dispose() {
					disposed = true;
					unsubscribe();
					lastBubbleAt.clear();
				}
			};
		}
		//#endregion
		//#region src/client/deskpet/view/bubble.ts
		function showBubble(host, content, thought = false) {
			const bubble = document.createElement("div");
			const isConversation = typeof content !== "string";
			bubble.className = isConversation ? "dafeiyu-deskpet-bubble dafeiyu-deskpet-conversation" : thought ? "dafeiyu-deskpet-bubble thought" : "dafeiyu-deskpet-bubble";
			if (isConversation) {
				const thoughtBlock = document.createElement("div");
				thoughtBlock.className = "dafeiyu-deskpet-thought";
				const label = document.createElement("div");
				label.className = "dafeiyu-deskpet-thought-label";
				label.textContent = `已思考（用时 ${Math.max(1, content.elapsedSeconds)} 秒）`;
				const thoughtText = document.createElement("div");
				thoughtText.className = "dafeiyu-deskpet-thought-copy";
				thoughtText.textContent = `• ${content.thought}`;
				const answer = document.createElement("div");
				answer.className = "dafeiyu-deskpet-answer";
				answer.textContent = content.answer;
				thoughtBlock.append(label, thoughtText);
				bubble.append(thoughtBlock, answer);
			} else bubble.textContent = thought ? `（思考中） ${content}` : content;
			bubble.style.zIndex = String(thought ? behavior.display.bubbleZIndex : behavior.display.zIndex);
			bubble.setAttribute("role", "status");
			host.appendChild(bubble);
			const visibleFor = isConversation ? Math.min(18e3, Math.max(6500, 4400 + content.answer.length * 55)) : behavior.timing.bubbleVisible;
			const timer = window.setTimeout(() => bubble.remove(), visibleFor);
			return {
				element: bubble,
				dismiss() {
					window.clearTimeout(timer);
					bubble.remove();
				}
			};
		}
		//#endregion
		//#region src/client/deskpet/view/fx.ts
		function wait(duration) {
			return new Promise((resolve) => window.setTimeout(resolve, duration));
		}
		//#endregion
		//#region src/client/deskpet/view/sprite.ts
		/**
		* 桌宠「身体」（真实鲸鱼娘基准体）。
		*
		* The body and every action share one 256px canvas.  The clip player owns
		* the pixels; this element only provides the stable drag/focus hit target.
		*
		* 目录锚定目标选择：
		* - 身体尺寸 = `(targetCharPx / charHeightNorm) * 256`（≈131×131），角色脚落在
		*   `behavior.clips.feetFromBottomPx` 之上 → 与 clip 层共用同一套尺寸/贴底数学，
		*   片段在身体正上方播放时不可感知切换（不闪）。
		* - 各状态暂无专属片段 → `setAnimation` 保留接口但暂不换图（所有状态都显示 base）。
		*
		* @module dsh-dafeiyu/client/deskpet/view/sprite
		*/
		function createSprite() {
			const root = document.createElement("div");
			const canvas = document.createElement("canvas");
			root.setAttribute("role", "button");
			root.tabIndex = 0;
			root.className = "dafeiyu-deskpet-sprite";
			root.setAttribute("aria-label", "大肥鱼桌宠");
			canvas.className = "dafeiyu-deskpet-canvas";
			canvas.setAttribute("aria-hidden", "true");
			canvas.width = 256;
			canvas.height = 256;
			root.appendChild(canvas);
			const s = behavior.clips.targetCharPx / 120;
			const w = Math.max(1, Math.round(256 * s));
			const h = Math.max(1, Math.round(256 * s));
			root.style.width = `${w}px`;
			root.style.height = `${h}px`;
			root.dataset.atlas = "ready";
			const setAnimation = (_animation) => {
				root.dataset.animation = "idle";
			};
			setAnimation("idle");
			return {
				root,
				canvas,
				setAnimation
			};
		}
		//#endregion
		//#region src/client/deskpet/view/clips.ts
		/**
		* Canvas clip player for the deskpet.
		*
		* Sheets are decoded once and rendered one cell at a time. Idle and actions
		* intentionally share one fixed-size canvas so the character returns to the
		* established single-layer handoff behaviour after an action finishes.
		*/
		const ASSETS_ROOT = "/api/dsh-dafeiyu/deskpet/assets";
		const NORMALIZED_CHAR_HEIGHT = 120;
		const specsPromises = /* @__PURE__ */ new Map();
		function loadClipSpecs(variant = "current") {
			const cached = specsPromises.get(variant);
			if (cached) return cached;
			const promise = fetch(`${ASSETS_ROOT}/life.json?variant=${encodeURIComponent(variant)}`, { cache: "no-store" }).then((response) => {
				if (!response.ok) throw new Error("life.json not ok");
				return response.json();
			}).then((payload) => ({
				assetVersion: String(payload.asset_version ?? "v4"),
				clips: payload.clips ?? []
			})).then(({ assetVersion, clips }) => clips.filter((clip) => typeof clip.clip === "string" && typeof clip.sheet === "string" && Number.isFinite(clip.frames) && clip.frames > 0 && Number.isFinite(clip.fps) && clip.fps > 0 && Number.isFinite(clip.cell) && clip.cell > 0 && Number.isFinite(clip.char_height_norm) && clip.char_height_norm > 0).map((clip) => ({
				clip: clip.clip,
				assetVersion,
				sheetUrl: `${ASSETS_ROOT}/${clip.sheet}?variant=${encodeURIComponent(variant)}&rev=${encodeURIComponent(assetVersion)}`,
				charHeightNorm: clip.char_height_norm,
				frames: Math.floor(clip.frames),
				fps: clip.fps,
				cell: Math.floor(clip.cell),
				columns: Math.max(1, Math.floor(clip.columns ?? clip.frames)),
				displayScale: Number.isFinite(clip.display_scale) && clip.display_scale > 0 ? clip.display_scale : 1
			}))).catch(() => []);
			specsPromises.set(variant, promise);
			return promise;
		}
		/**
		* Imported assets update life.json, but an existing controller keeps the
		* original clip list in memory. Poll only this small manifest and ask the
		* caller to remount after a real version change. Failed requests are ignored
		* so a local host restart never interrupts the current character.
		*/
		function watchClipAssetVersion(assetVersion, onChanged, variant = "current", intervalMs = 3e4) {
			let stopped = false;
			let checking = false;
			const check = async () => {
				if (stopped || checking) return;
				checking = true;
				try {
					const response = await fetch(`${ASSETS_ROOT}/life.json?variant=${encodeURIComponent(variant)}`, { cache: "no-store" });
					if (!response.ok) return;
					const payload = await response.json();
					const nextVersion = String(payload.asset_version ?? "v4");
					if (!stopped && nextVersion !== assetVersion) {
						stopped = true;
						onChanged(nextVersion);
					}
				} catch {} finally {
					checking = false;
				}
			};
			const timer = window.setInterval(() => {
				check();
			}, intervalMs);
			return () => {
				stopped = true;
				window.clearInterval(timer);
			};
		}
		function createClipLayer(layer) {
			const canvas = layer.querySelector("canvas");
			if (!canvas) throw new Error("deskpet clip layer requires its single canvas");
			const context = canvas.getContext("2d");
			const sheets = /* @__PURE__ */ new Map();
			const loadPromises = /* @__PURE__ */ new Map();
			let current;
			let playing = false;
			let raf = 0;
			let generation = 0;
			let startedAt = 0;
			let lastPainted = -1;
			let looping = false;
			let onFrameRef;
			let onDecodeRef;
			const ensureLoaded = (spec) => {
				let image = sheets.get(spec.sheetUrl);
				if (!image) {
					image = new Image();
					image.alt = "";
					image.decoding = "async";
					image.draggable = false;
					sheets.set(spec.sheetUrl, image);
				}
				const existing = loadPromises.get(spec.sheetUrl);
				if (existing) return existing;
				if (image.complete && image.naturalWidth > 0) return Promise.resolve(true);
				const promise = new Promise((resolve) => {
					const finish = (ok) => {
						loadPromises.delete(spec.sheetUrl);
						onDecodeRef?.(spec.clip, ok, image.naturalWidth, image.naturalHeight);
						resolve(ok);
					};
					image.addEventListener("load", () => finish(image.naturalWidth > 0), { once: true });
					image.addEventListener("error", () => finish(false), { once: true });
					image.src = spec.sheetUrl;
					if (image.complete) finish(image.naturalWidth > 0);
				});
				loadPromises.set(spec.sheetUrl, promise);
				return promise;
			};
			const preload = (specs) => {
				for (const spec of specs) ensureLoaded(spec);
			};
			const scaleFor = (spec) => behavior.clips.targetCharPx / NORMALIZED_CHAR_HEIGHT * (spec.displayScale ?? 1);
			const applyLayout = (spec, centerX, footY) => {
				const scale = scaleFor(spec);
				const size = Math.max(1, Math.round(spec.cell * scale));
				if (canvas.width !== size || canvas.height !== size) {
					canvas.width = size;
					canvas.height = size;
					canvas.style.width = `${size}px`;
					canvas.style.height = `${size}px`;
					layer.style.width = `${size}px`;
					layer.style.height = `${size}px`;
				}
				layer.style.left = `${Math.round(centerX - size / 2)}px`;
				layer.style.top = `${Math.round(footY - size + behavior.clips.feetFromBottomPx * scale)}px`;
			};
			const paint = (spec, image, index) => {
				if (!context) return;
				const bounded = Math.max(0, Math.min(spec.frames - 1, index));
				context.imageSmoothingEnabled = true;
				const sourceX = bounded % spec.columns * spec.cell;
				const sourceY = Math.floor(bounded / spec.columns) * spec.cell;
				context.globalCompositeOperation = "copy";
				context.drawImage(image, sourceX, sourceY, spec.cell, spec.cell, 0, 0, canvas.width, canvas.height);
				context.globalCompositeOperation = "source-over";
				if (bounded !== lastPainted) {
					lastPainted = bounded;
					onFrameRef?.(spec.clip, bounded, spec.frames);
				}
			};
			const stop = (hide = false) => {
				generation += 1;
				if (raf) window.cancelAnimationFrame(raf);
				raf = 0;
				playing = false;
				looping = false;
				if (hide) {
					current = void 0;
					layer.style.opacity = "0";
					layer.style.display = "none";
				}
			};
			const play = async (spec, centerX, footY, loop) => {
				generation += 1;
				if (raf) window.cancelAnimationFrame(raf);
				raf = 0;
				playing = false;
				looping = loop;
				const token = generation;
				if (!await ensureLoaded(spec) || token !== generation) return false;
				const image = sheets.get(spec.sheetUrl);
				if (!image) return false;
				current = spec;
				lastPainted = -1;
				applyLayout(spec, centerX, footY);
				layer.style.display = "block";
				layer.style.opacity = "1";
				paint(spec, image, 0);
				playing = true;
				startedAt = performance.now();
				const frameMs = 1e3 / spec.fps;
				const tick = (now) => {
					if (!playing || current !== spec || token !== generation) return;
					const frameIndex = Math.floor((now - startedAt) / frameMs);
					if (frameIndex >= spec.frames) {
						if (!looping) {
							paint(spec, image, spec.frames - 1);
							playing = false;
							raf = 0;
							return;
						}
						startedAt += spec.frames * frameMs;
					}
					paint(spec, image, looping ? frameIndex % spec.frames : frameIndex);
					raf = window.requestAnimationFrame(tick);
				};
				raf = window.requestAnimationFrame(tick);
				return true;
			};
			return {
				layer,
				preload,
				playLoop: (spec, centerX, footY) => play(spec, centerX, footY, true),
				playOnce: (spec, centerX, footY) => play(spec, centerX, footY, false),
				stop,
				isPlaying: () => playing,
				canShow: (spec) => {
					const image = sheets.get(spec.sheetUrl);
					return Boolean(image?.complete && image.naturalWidth > 0);
				},
				setPosition: (centerX, footY) => {
					if (current) applyLayout(current, centerX, footY);
				},
				get onFrame() {
					return onFrameRef;
				},
				set onFrame(fn) {
					onFrameRef = fn;
				},
				get onDecode() {
					return onDecodeRef;
				},
				set onDecode(fn) {
					onDecodeRef = fn;
				}
			};
		}
		//#endregion
		//#region src/client/deskpet/view/overlay.ts
		const styles$1 = `
.dafeiyu-deskpet{position:fixed;inset:0;overflow:visible;pointer-events:none;z-index:${behavior.display.zIndex};user-select:none}
.dafeiyu-deskpet-sprite{position:absolute;z-index:1;display:block;padding:0;border:0;background:transparent;color:#fff;cursor:grab;font:24px/1 system-ui,sans-serif;pointer-events:auto;touch-action:none;transition:opacity ${behavior.timing.transitionFade}ms ease,filter ${behavior.timing.transitionFade}ms ease}
.dafeiyu-deskpet-sprite:active{cursor:grabbing}
.dafeiyu-deskpet-sprite[data-atlas="ready"]{background:transparent;box-shadow:none}
.dafeiyu-deskpet-sprite[data-atlas="ready"] .dafeiyu-deskpet-canvas{filter:drop-shadow(0 3px 6px rgba(19,38,93,.36))}
.dafeiyu-deskpet-sprite[data-animation="cry"]{filter:saturate(.75) brightness(1.1)}
.dafeiyu-deskpet-bubbles{position:absolute;z-index:3;pointer-events:none}
.dafeiyu-deskpet-canvas{display:block;width:100%;height:100%;user-select:none;backface-visibility:hidden}
.dafeiyu-deskpet-bubble{position:absolute;box-sizing:border-box;width:fit-content;min-width:${behavior.bubble.minWidth}px;max-width:min(${behavior.bubble.maxWidth}px,calc(100vw - ${behavior.bubble.viewportPadding}px));padding:8px 11px;border:1px solid rgba(44,67,134,.28);border-radius:10px;background:#fff;color:#24356e;font:12px/1.45 system-ui,"Microsoft YaHei",sans-serif;overflow-wrap:anywhere;word-break:break-word;white-space:normal;box-shadow:0 3px 12px rgba(32,46,98,.18);pointer-events:none;transform:translate(-50%,-100%)}
.dafeiyu-deskpet-bubble::after{position:absolute;left:calc(50% + var(--dafeiyu-tail-offset, 0px));bottom:-6px;width:10px;height:10px;border-right:1px solid rgba(44,67,134,.28);border-bottom:1px solid rgba(44,67,134,.28);background:#fff;content:"";transform:translateX(-50%) rotate(45deg)}
.dafeiyu-deskpet-bubble.thought{border-style:dashed;background:rgba(255,255,255,.86);font-style:italic}
.dafeiyu-deskpet-bubble.thought::before{position:absolute;top:-9px;left:9px;color:#6b80c7;content:"思考中";font-size:10px;font-style:normal}
.dafeiyu-deskpet-conversation{padding:0;overflow:hidden}
.dafeiyu-deskpet-thought{padding:8px 11px 7px;background:rgba(31,45,73,.045);border-bottom:1px solid rgba(44,67,134,.13)}
.dafeiyu-deskpet-thought-label{color:#89909d;font-size:10px;line-height:1.35}
.dafeiyu-deskpet-thought-copy{margin-top:3px;color:#8a919e;font-size:11px;line-height:1.45}
.dafeiyu-deskpet-answer{padding:9px 11px 10px;color:#24356e;font-size:12px;line-height:1.55;white-space:pre-wrap}

`;
		function mountDeskpet(entry, characterVariant = "legacy") {
			const global = globalThis;
			global.__dafeiyuDeskpetController?.dispose();
			document.querySelectorAll(".dafeiyu-deskpet").forEach((node) => node.remove());
			document.querySelectorAll("style[data-dafeiyu-deskpet]").forEach((node) => node.remove());
			const style = document.createElement("style");
			style.dataset.dafeiyuDeskpet = "true";
			style.textContent = styles$1;
			document.head.appendChild(style);
			const host = document.createElement("div");
			host.className = "dafeiyu-deskpet";
			host.setAttribute("aria-live", "polite");
			const bubbleHost = document.createElement("div");
			bubbleHost.className = "dafeiyu-deskpet-bubbles";
			const sprite = createSprite();
			host.append(sprite.root);
			const clipLayer = createClipLayer(sprite.root);
			const eventBus = createDeskpetEventBus();
			clipLayer.onFrame = (clip, frame, total) => {
				setDebug(`clips: ${clipSpecs.map((s) => s.clip).join(" ")}\npick: ${clip} frame ${frame}/${total}`);
			};
			clipLayer.onDecode = (clip, ok, width, height) => {
				logDebug(`decode: ${clip} ok=${ok} size=${width}x${height}`);
			};
			host.append(bubbleHost);
			let clipSpecs = [];
			let allClipSpecs = [];
			let idleSpec;
			let clipActive = false;
			let idleRunning = false;
			let idleStarting = false;
			let stopAssetVersionWatch = () => void 0;
			loadClipSpecs(characterVariant).then((specs) => {
				idleSpec = specs.find((spec) => spec.clip === "idle");
				allClipSpecs = specs;
				const removedClips = /* @__PURE__ */ new Set([
					"stretch",
					"lanyao",
					"feed"
				]);
				clipSpecs = specs.filter((spec) => spec.clip !== "idle" && spec.clip !== "base" && !removedClips.has(spec.clip) && spec.frames > 1);
				const startupClips = [idleSpec, ...clipSpecs].filter((spec) => Boolean(spec));
				clipLayer.preload(startupClips);
				logDebug(`mount: idle=${idleSpec?.clip ?? "none"} actions=${clipSpecs.map((s) => s.clip).join(",")} preload=${startupClips.map((s) => s.clip).join(",")}`);
				setDebug(`idle: ${idleSpec?.clip ?? "MISSING"}\nactions: ${clipSpecs.map((s) => s.clip).join(" ") || "NONE"}`);
				const assetVersion = specs[0]?.assetVersion;
				if (assetVersion) stopAssetVersionWatch = watchClipAssetVersion(assetVersion, (nextVersion) => {
					logDebug(`asset-version changed: ${assetVersion} -> ${nextVersion}; remounting`);
					window.location.reload();
				}, characterVariant);
				startIdle();
				schedulePerf(5e3);
			});
			document.body.appendChild(host);
			const storage = loadStorage();
			let enabled = true;
			let disposed = false;
			let state = "idle";
			let world;
			let position = {
				centerX: 0,
				footY: 0
			};
			let fallingVelocity = 0;
			let fallingFrame;
			let fallingLastTime = 0;
			let bubbleTimer;
			let anchorMode = "composer";
			let stopWatching = () => void 0;
			let sleepTimer;
			let perfTimer;
			let bubbleCleanup;
			let bubbleElement;
			let clickTimer;
			let lastPointerUp = 0;
			let pointerId;
			let pointerOffsetX = 0;
			let pointerOffsetFootY = 0;
			let dragging = false;
			let topMessageAt = 0;
			let sequence = 0;
			let nextClipIndex = 0;
			let clipPriority = 0;
			let performanceDirector;
			const recentThoughts = [];
			const debugBadge = document.createElement("div");
			debugBadge.className = "dafeiyu-deskpet-debug";
			debugBadge.style.cssText = "position:absolute;top:0;left:0;z-index:99;background:rgba(0,0,0,.7);color:#fff;font:11px/1.4 monospace;padding:2px 6px;border-radius:4px;pointer-events:none;white-space:pre";
			debugBadge.hidden = true;
			host.appendChild(debugBadge);
			const setDebug = (text) => {
				debugBadge.textContent = text;
			};
			const logDebug = (message) => {
				fetch("/api/dsh-dafeiyu/deskpet/debug-log", {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({ message })
				}).catch(() => {});
			};
			const setState = (next) => {
				state = next;
				sprite.root.dataset.state = next;
			};
			const renderBubble = () => {
				if (!world || !bubbleElement?.isConnected) return;
				const edgePadding = behavior.geometry.worldPadding;
				const bubbleWidthLimit = Math.min(behavior.bubble.maxWidth, Math.max(behavior.bubble.minWidth, window.innerWidth - behavior.bubble.viewportPadding));
				bubbleElement.style.maxWidth = `${bubbleWidthLimit}px`;
				const bubbleWidth = bubbleElement.getBoundingClientRect().width;
				const minCenter = world.left + bubbleWidth / 2 + edgePadding;
				const maxCenter = world.right - bubbleWidth / 2 - edgePadding;
				const bubbleCenter = minCenter <= maxCenter ? Math.max(minCenter, Math.min(maxCenter, position.centerX)) : (world.left + world.right) / 2;
				bubbleHost.style.left = `${bubbleCenter}px`;
				bubbleElement.style.setProperty("--dafeiyu-tail-offset", `${position.centerX - bubbleCenter}px`);
			};
			const render = () => {
				if (!world) return;
				position = clampPosition(world, position);
				const rw = sprite.root.offsetWidth || world.petWidth;
				const rh = sprite.root.offsetHeight || world.petHeight;
				const s = rw / 256;
				const feetFromBottom = behavior.clips.feetFromBottomPx * s;
				sprite.root.style.left = `${position.centerX - rw / 2}px`;
				sprite.root.style.top = `${position.footY - rh + feetFromBottom}px`;
				bubbleHost.style.top = `${position.footY - behavior.clips.targetCharPx - behavior.geometry.worldPadding}px`;
				if (clipLayer.isPlaying()) clipLayer.setPosition(position.centerX, position.footY);
				renderBubble();
			};
			const clearBubble = () => {
				bubbleCleanup?.();
				bubbleCleanup = void 0;
				bubbleElement = void 0;
			};
			const say = (text, thought = false) => {
				clearBubble();
				const handle = showBubble(bubbleHost, text, thought);
				bubbleElement = handle.element;
				bubbleCleanup = handle.dismiss;
				renderBubble();
			};
			const fakeThought = (userText, answer) => {
				const visible = `${userText}\n${answer}`;
				const persona = /R18|18禁|成人|色情|涩涩|肉文|荤段子|黄色|H文|H模式/i.test(userText) ? "adult" : /文件夹|文件|目录|工作区|项目/.test(visible) || /dsh/.test(userText) && /文件|目录|文件夹|项目/.test(visible) ? "workspace" : /报错|错误|失败|不行|卡住|崩了|bug/i.test(visible) ? "failure" : /饿|吃饭|夜宵|午饭|晚饭|摆烂|摸鱼/.test(visible) ? "food" : /累|烦|崩溃|难过|emo|焦虑|不想活/.test(visible) ? "care" : /改|代码|功能|实现|接口|编译|构建|脚本|需求|开发/.test(visible) ? "engineering" : "general";
				const options = copy.thoughtPersonas[persona];
				let hash = 0;
				for (const char of visible) hash = hash * 31 + char.charCodeAt(0) >>> 0;
				const start = options.length > 0 ? hash % options.length : 0;
				const candidate = options.find((_, index) => !recentThoughts.includes(options[(start + index) % options.length])) ?? options[start] ?? copy.thoughtPersonas.general[0];
				recentThoughts.push(candidate);
				if (recentThoughts.length > 4) recentThoughts.shift();
				return candidate;
			};
			const generatedThought = (value) => {
				const cleaned = value?.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim();
				if (!cleaned || cleaned.length < 4 || cleaned.length > 40) return void 0;
				if (/首先|其次|然后|因为|所以|分析|推理|步骤|总结|计划|工具调用|系统提示|chain[- ]of[- ]thought|让我思考|我来分析/i.test(cleaned)) return void 0;
				if (recentThoughts.includes(cleaned)) return void 0;
				recentThoughts.push(cleaned);
				if (recentThoughts.length > 4) recentThoughts.shift();
				return cleaned;
			};
			const showReply = (reply) => {
				const content = {
					thought: generatedThought(reply.thought) ?? fakeThought(reply.userText, reply.text),
					elapsedSeconds: Math.max(1, Math.ceil((Date.now() - reply.startedAt) / 1e3)),
					answer: reply.text
				};
				clearBubble();
				const handle = showBubble(bubbleHost, content);
				bubbleElement = handle.element;
				bubbleCleanup = handle.dismiss;
				renderBubble();
			};
			const savePosition = () => {
				if (!world) return;
				const span = Math.max(world.right - world.left, 1);
				storage.pos = { x: (position.centerX - world.left) / span };
				saveStorage(storage);
			};
			const scheduleBubble = () => {
				window.clearTimeout(bubbleTimer);
			};
			const scheduleSleep = () => {
				window.clearTimeout(sleepTimer);
			};
			const wake = () => {
				if (state !== "sleep") return;
				setState(transition(state, "wake"));
				sprite.setAnimation("idle");
				sprite.root.style.animation = "";
				say(copy.wake);
				scheduleBubble();
			};
			const activity = () => {
				if (!enabled) return;
				wake();
				scheduleSleep();
			};
			const clearPerf = () => {
				sprite.root.style.animation = "";
			};
			const startIdle = () => {
				if (clipActive || !idleSpec || !world || disposed || !enabled || idleRunning || idleStarting) return;
				idleStarting = true;
				clipLayer.playLoop(idleSpec, position.centerX, position.footY).then((started) => {
					idleStarting = false;
					idleRunning = started && !disposed;
				});
			};
			const endClip = () => {
				clipActive = false;
				clipPriority = 0;
				idleRunning = false;
				idleStarting = false;
				clipLayer.stop();
				startIdle();
				if (!disposed) schedulePerf(9e3);
			};
			const showClip = async (spec, priority = 10) => {
				clipActive = true;
				clipPriority = priority;
				idleRunning = false;
				idleStarting = false;
				setDebug(`clips: ${clipSpecs.map((s) => s.clip).join(" ")}\npick: ${spec.clip} loading`);
				const started = await clipLayer.playOnce(spec, position.centerX, position.footY);
				if (disposed || !clipActive) return;
				if (!started) {
					logDebug(`showClip bail: ${spec.clip} could not decode`);
					setDebug(`clips: ${clipSpecs.map((s) => s.clip).join(" ")}\npick: ${spec.clip} BAIL`);
					endClip();
					return;
				}
				logDebug(`showClip start: ${spec.clip}`);
				await wait(Math.max(0, spec.frames / spec.fps * 1e3));
				if (disposed || !clipActive || state !== "idle") return;
				clipActive = false;
				clipPriority = 0;
				clipLayer.stop();
				idleRunning = false;
				idleStarting = false;
				startIdle();
				if (!disposed) schedulePerf(9e3);
			};
			const requestClip = (clip, priority) => {
				if (!enabled || disposed || !world || state !== "idle" || dragging) return false;
				const spec = allClipSpecs.find((candidate) => candidate.clip === clip);
				if (!spec) return false;
				if (clipActive) {
					if (clipPriority >= priority) return false;
					endClip();
				}
				showClip(spec, priority);
				return true;
			};
			performanceDirector = createPerformanceDirector(eventBus, {
				startClip: requestClip,
				say
			});
			const performShow = () => {
				if (!enabled || disposed || state !== "idle" || !world) return;
				if (clipActive) {
					logDebug("performShow skip: action already playing");
					return;
				}
				if (performanceDirector?.isBusy()) return;
				if (clipSpecs.length > 0) {
					const spec = clipSpecs[nextClipIndex % clipSpecs.length];
					logDebug(`performShow pick: ${spec.clip} (specs=${clipSpecs.map((s) => s.clip).join(",")})`);
					if (performanceDirector?.request({
						clip: spec.clip,
						priority: "ambient",
						dedupeKey: `ambient-${spec.clip}`
					}) ?? false) nextClipIndex += 1;
					return;
				}
				startIdle();
			};
			const schedulePerf = (delay) => {
				window.clearTimeout(perfTimer);
				if (!enabled || disposed) return;
				const ready = clipSpecs.length > 0 && Boolean(world) && state === "idle";
				const nextDelay = delay ?? (ready ? 9e3 : 500);
				perfTimer = window.setTimeout(() => {
					performShow();
					if (!disposed && !clipActive) schedulePerf();
				}, nextDelay);
			};
			const onComposerChange = (rect) => {
				if (!rect) {
					world = void 0;
					host.hidden = true;
					return;
				}
				const nextWorld = makeWorld(rect);
				const previousWorld = world;
				world = nextWorld;
				host.hidden = !enabled;
				if (previousWorld && storage.pos && state === "idle") {
					position.centerX = nextWorld.left + Math.max(0, Math.min(1, storage.pos.x)) * (nextWorld.right - nextWorld.left);
					position.footY = nextWorld.groundY;
				} else if (!previousWorld) position = storage.pos ? {
					centerX: nextWorld.left + Math.max(0, Math.min(1, storage.pos.x)) * (nextWorld.right - nextWorld.left),
					footY: nextWorld.groundY
				} : centerPosition(nextWorld);
				render();
				startIdle();
			};
			const setAnchor = (nextAnchor) => {
				if (anchorMode === nextAnchor || disposed) return;
				anchorMode = nextAnchor;
				stopWatching();
				stopWatching = watchDeskpetAnchors(onComposerChange, anchorMode);
			};
			const finishFalling = () => {
				if (!world) return;
				if (fallingFrame !== void 0) window.cancelAnimationFrame(fallingFrame);
				fallingFrame = void 0;
				setState(transition(state, "land"));
				landingSequence();
			};
			const fallFrame = (now) => {
				if (!world || state !== "falling") return;
				const elapsed = fallingLastTime === 0 ? 0 : now - fallingLastTime;
				fallingLastTime = now;
				const next = stepFalling({
					footY: position.footY,
					velocity: fallingVelocity
				}, elapsed, world.groundY);
				position.footY = next.footY;
				fallingVelocity = next.velocity;
				render();
				if (next.landed) finishFalling();
				else fallingFrame = window.requestAnimationFrame(fallFrame);
			};
			const startFalling = () => {
				if (!world) return;
				setState(transition(state, "release"));
				fallingVelocity = 0;
				fallingLastTime = 0;
				fallingFrame = window.requestAnimationFrame(fallFrame);
			};
			const landingSequence = () => {
				sequence += 1;
				clearBubble();
				setState("idle");
				sprite.setAnimation("idle");
				sprite.root.style.opacity = "1";
				sprite.root.style.animation = "";
				sprite.root.style.filter = "";
				savePosition();
				startIdle();
				schedulePerf(250);
			};
			const poke = () => {
				if (state !== "idle") return;
				storage.stats.poked += 1;
				saveStorage(storage);
				sprite.setAnimation("poke");
				say(Math.random() * 100 < behavior.weights.pokeVariant ? copy.pokeVariant : copy.poke);
				window.setTimeout(() => {
					if (state === "idle") {
						sprite.setAnimation("idle");
						startIdle();
					}
				}, behavior.timing.pokeDuration);
				activity();
			};
			const onSpriteKeyDown = (event) => {
				if (!enabled || event.key !== "Enter" && event.key !== " ") return;
				event.preventDefault();
				event.stopPropagation();
				if (state === "sleep") wake();
				poke();
			};
			const onPointerDown = (event) => {
				if (!enabled || state === "landing" || state === "running" || state === "falling") return;
				if (state === "sleep") wake();
				if (clipActive) endClip();
				pointerId = event.pointerId;
				pointerOffsetX = event.clientX - position.centerX;
				pointerOffsetFootY = event.clientY - position.footY;
				dragging = false;
				sprite.root.setPointerCapture(event.pointerId);
				activity();
			};
			const onPointerMove = (event) => {
				if (pointerId !== event.pointerId || !world || !enabled) return;
				const distance = Math.hypot(event.clientX - (position.centerX + pointerOffsetX), event.clientY - (position.footY + pointerOffsetFootY));
				if (!dragging && distance >= behavior.interaction.dragThreshold) {
					dragging = true;
					window.clearTimeout(clickTimer);
					clickTimer = void 0;
					lastPointerUp = 0;
					storage.stats.dragged += 1;
					saveStorage(storage);
					setState(transition(state, "grab"));
					sprite.setAnimation("held");
					say(copy.grab);
				}
				if (!dragging) return;
				position = clampPosition(world, {
					centerX: event.clientX - pointerOffsetX,
					footY: event.clientY - pointerOffsetFootY
				});
				if (state === "dragged" && position.footY <= world.worldTop) {
					setState(transition(state, "top"));
					if (Date.now() - topMessageAt >= behavior.interaction.topMessageCooldown) {
						topMessageAt = Date.now();
						say(copy.top);
					}
				} else if (state === "atTop" && position.footY > world.worldTop) setState("dragged");
				render();
			};
			const onPointerUp = (event) => {
				if (pointerId !== event.pointerId) return;
				pointerId = void 0;
				if (sprite.root.hasPointerCapture(event.pointerId)) sprite.root.releasePointerCapture(event.pointerId);
				if (dragging) {
					dragging = false;
					savePosition();
					startFalling();
					return;
				}
				const now = Date.now();
				if (now - lastPointerUp <= behavior.interaction.doubleClickWindow) {
					window.clearTimeout(clickTimer);
					clickTimer = void 0;
					lastPointerUp = 0;
					activity();
					return;
				}
				lastPointerUp = now;
				clickTimer = window.setTimeout(() => {
					clickTimer = void 0;
					lastPointerUp = 0;
					poke();
				}, behavior.interaction.doubleClickWindow);
			};
			const isDeskpetArea = (target) => target instanceof Node && (entry.contains(target) || host.contains(target));
			const onClick = (event) => {
				event.stopPropagation();
				event.preventDefault();
			};
			const onGlobalPointerDown = (event) => {
				if (isDeskpetArea(event.target)) activity();
			};
			const onKeyDown = (event) => {
				if (isDeskpetArea(event.target)) activity();
			};
			const onInput = (event) => {
				if (isDeskpetArea(event.target)) activity();
			};
			const onWheel = (event) => {
				if (isDeskpetArea(event.target)) activity();
			};
			const onScroll = (event) => {
				if (isDeskpetArea(event.target)) activity();
			};
			const setEnabled = (nextEnabled) => {
				enabled = nextEnabled;
				if (enabled) {
					if (!document.body.contains(host)) document.body.appendChild(host);
					host.hidden = !world;
					render();
					scheduleBubble();
					scheduleSleep();
					startIdle();
					schedulePerf();
				} else {
					window.clearTimeout(bubbleTimer);
					window.clearTimeout(sleepTimer);
					window.clearTimeout(perfTimer);
					window.clearTimeout(clickTimer);
					clickTimer = void 0;
					lastPointerUp = 0;
					if (fallingFrame !== void 0) window.cancelAnimationFrame(fallingFrame);
					clearBubble();
					clearPerf();
					endClip();
					host.remove();
				}
			};
			sprite.root.addEventListener("keydown", onSpriteKeyDown);
			sprite.root.addEventListener("pointerdown", onPointerDown);
			sprite.root.addEventListener("pointermove", onPointerMove);
			sprite.root.addEventListener("pointerup", onPointerUp);
			sprite.root.addEventListener("pointercancel", onPointerUp);
			sprite.root.addEventListener("click", onClick);
			document.addEventListener("pointerdown", onGlobalPointerDown, true);
			document.addEventListener("keydown", onKeyDown, true);
			document.addEventListener("input", onInput, true);
			document.addEventListener("wheel", onWheel, true);
			document.addEventListener("scroll", onScroll, true);
			stopWatching = watchDeskpetAnchors(onComposerChange, anchorMode);
			sprite.setAnimation("idle");
			setState("idle");
			scheduleBubble();
			scheduleSleep();
			schedulePerf();
			const controller = {
				setEnabled,
				setAnchor,
				isEnabled() {
					return enabled;
				},
				emit(event) {
					eventBus.emit(event);
				},
				showReply,
				dispose() {
					disposed = true;
					sequence += 1;
					performanceDirector?.dispose();
					eventBus.dispose();
					stopAssetVersionWatch();
					stopWatching();
					window.clearTimeout(bubbleTimer);
					window.clearTimeout(sleepTimer);
					window.clearTimeout(perfTimer);
					window.clearTimeout(clickTimer);
					if (fallingFrame !== void 0) window.cancelAnimationFrame(fallingFrame);
					clearBubble();
					clearPerf();
					clipLayer.stop(true);
					endClip();
					sprite.root.removeEventListener("keydown", onSpriteKeyDown);
					sprite.root.removeEventListener("pointerdown", onPointerDown);
					sprite.root.removeEventListener("pointermove", onPointerMove);
					sprite.root.removeEventListener("pointerup", onPointerUp);
					sprite.root.removeEventListener("pointercancel", onPointerUp);
					sprite.root.removeEventListener("click", onClick);
					document.removeEventListener("pointerdown", onGlobalPointerDown, true);
					document.removeEventListener("keydown", onKeyDown, true);
					document.removeEventListener("input", onInput, true);
					document.removeEventListener("wheel", onWheel, true);
					document.removeEventListener("scroll", onScroll, true);
					style.remove();
					host.remove();
				}
			};
			global.__dafeiyuDeskpetController = controller;
			return controller;
		}
		//#endregion
		//#region src/client/deskpet/environment/settings.ts
		let cached;
		let pending;
		/** 读当前开关：true=开。接口失败/未配置一律 false（保持 0.0.1 原行为）。 */
		function loadSettings() {
			if (cached !== void 0) return Promise.resolve(cached);
			if (pending) return pending;
			pending = fetch("/api/dsh-dafeiyu/deskpet/settings", { method: "GET" }).then((response) => response.json()).then((payload) => {
				const settings = payload.value?.settings;
				cached = payload.ok === true ? {
					enabled: settings?.enabled === true,
					anchor: settings?.anchor === "dock" ? "dock" : "composer",
					characterVariant: "legacy",
					syncWithWhale: settings?.syncWithWhale !== false
				} : {
					enabled: false,
					anchor: "composer",
					characterVariant: "legacy",
					syncWithWhale: true
				};
				return cached;
			}).catch(() => {
				cached = {
					enabled: false,
					anchor: "composer",
					characterVariant: "legacy",
					syncWithWhale: true
				};
				return cached;
			}).finally(() => {
				pending = void 0;
			});
			return pending;
		}
		/** 写入开关：true=开。返回是否写成功（网络失败返回 false，但不抛）。 */
		function saveSettings(partial) {
			cached = {
				...cached ?? {
					enabled: true,
					anchor: "composer",
					characterVariant: "legacy",
					syncWithWhale: true
				},
				...partial,
				anchor: partial.anchor === "dock" ? "dock" : partial.anchor ?? cached?.anchor ?? "composer",
				characterVariant: "legacy",
				syncWithWhale: partial.syncWithWhale ?? cached?.syncWithWhale ?? true
			};
			return fetch("/api/dsh-dafeiyu/deskpet/settings", {
				method: "PUT",
				headers: { "content-type": "application/json" },
				body: JSON.stringify(partial)
			}).then((response) => response.json()).then((payload) => payload.ok === true).catch(() => false);
		}
		//#endregion
		//#region src/client/index.ts
		const inject = ["slots"];
		const API = "/api/dsh-dafeiyu";
		const COMPOSER_CARD = "[data-composer-card]";
		const COMPOSER_INPUT = `${COMPOSER_CARD} textarea`;
		const DOCK_INPUT = "[data-dfy-dock-input]";
		const styles = `
[data-dsh-dafeiyu-entry]{--dfy-base:var(--dsw-specific-sidebar-fill,#19191b);--dfy-surface:var(--dsw-alias-bg-layer-2,#222225);--dfy-line:var(--dsw-alias-border-l2,rgba(255,255,255,.11));--dfy-text:var(--dsw-alias-label-primary,#f2f2f3);--dfy-faint:var(--dsw-alias-label-tertiary,#777980);--dfy-accent:var(--dsw-alias-brand-primary-new-colorprimary-new-color,#5e9cff);position:relative;display:block;width:100%;height:66px;box-sizing:border-box;padding:0 9px;border:0;background:transparent;color:inherit;font:inherit;text-align:left}
.dfy-dock{position:absolute;inset:13px 9px 4px;display:flex;align-items:center;min-width:0;padding:0 7px 0 50px;border:1px solid var(--dfy-line);border-radius:10px;background:color-mix(in srgb,var(--dfy-surface) 58%,transparent);box-shadow:inset 0 1px 0 rgba(255,255,255,.065),0 8px 22px rgba(0,0,0,.2);transition:background .18s,border-color .18s;backdrop-filter:blur(13px) saturate(108%)}
.dfy-dock::before{position:absolute;top:0;bottom:0;left:49px;width:1px;background:color-mix(in srgb,var(--dfy-line) 70%,transparent);content:""}
[data-dsh-dafeiyu-entry]:focus-within .dfy-dock,[data-dsh-dafeiyu-entry]:hover .dfy-dock{background:color-mix(in srgb,var(--dfy-surface) 70%,transparent);border-color:color-mix(in srgb,var(--dfy-line) 70%,var(--dfy-accent))}
.dfy-peek{position:absolute;z-index:3;top:8px;left:14px;width:40px;height:43px;overflow:hidden;border:1px solid color-mix(in srgb,var(--dfy-line) 70%,#fff);border-radius:13px 13px 10px 10px;background:#d9d4c8;box-shadow:0 4px 10px rgba(0,0,0,.18);transition:transform .2s ease}
.dfy-peek img{display:block;width:100%;height:100%;object-fit:cover;transform:scale(1.14) translateY(4px)}
[data-dsh-dafeiyu-entry]:hover .dfy-peek{transform:translateY(-2px)}
.dfy-dock-copy{display:flex;min-width:0;flex:1;flex-direction:column;gap:1px;padding-left:7px}.dfy-dock-copy strong{overflow:hidden;color:var(--dfy-text);font-size:10px;font-weight:650;letter-spacing:.04em;line-height:14px;white-space:nowrap;text-overflow:ellipsis}
.dfy-dock-input{display:block;width:100%;height:21px;min-height:21px;max-height:38px;resize:none;overflow-y:auto;padding:0;border:0;outline:0;background:transparent;color:var(--dfy-text);font-family:system-ui,"Microsoft YaHei",sans-serif;font-size:13px;font-weight:450;line-height:21px}.dfy-dock-input::placeholder{color:var(--dfy-faint);opacity:.88}.dfy-dock-input:focus::placeholder{opacity:.48}
.dfy-dock-key{display:grid;width:28px;height:28px;flex:0 0 auto;margin-left:7px;place-items:center;border:1px solid color-mix(in srgb,var(--dfy-accent) 32%,transparent);border-radius:8px;background:color-mix(in srgb,var(--dfy-accent) 8%,transparent);color:var(--dfy-accent);cursor:pointer;line-height:1}.dfy-dock-key svg{display:block;width:15px;height:15px;fill:none;stroke:currentColor;stroke-linecap:round;stroke-linejoin:round;stroke-width:1.8}.dfy-dock-key:hover{background:color-mix(in srgb,var(--dfy-accent) 18%,transparent)}
.dfy-settings{position:absolute;right:9px;bottom:68px;z-index:10;width:214px;padding:12px;border:1px solid var(--dfy-line);border-radius:9px;background:var(--dfy-surface);box-shadow:0 10px 30px rgba(0,0,0,.3);color:var(--dfy-text);font-size:11px}.dfy-settings[hidden]{display:none}.dfy-settings-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;color:var(--dfy-text);font-size:12px;font-weight:600}.dfy-settings-close{width:22px;height:22px;padding:0;border:0;border-radius:5px;background:transparent;color:var(--dfy-faint);cursor:pointer;font-size:15px;line-height:1}.dfy-settings-close:hover{background:rgba(255,255,255,.08);color:var(--dfy-text)}.dfy-settings-row{display:flex;align-items:center;justify-content:space-between;gap:12px;color:var(--dfy-faint)}.dfy-settings-row input{accent-color:var(--dfy-accent)}.dfy-settings-section{margin-top:12px;padding-top:10px;border-top:1px solid var(--dfy-line)}.dfy-settings-label{display:block;margin-bottom:7px;color:var(--dfy-faint)}.dfy-settings-option{display:flex;align-items:center;gap:7px;margin-top:6px;color:var(--dfy-text);cursor:pointer}.dfy-settings-option input{margin:0}
`;
		function postJson(path, payload) {
			return fetch(path, {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify(payload)
			}).then((response) => response.json()).catch(() => null);
		}
		function sidebarRoot() {
			const column = document.querySelector("[data-pane=\"sidebar\"], [class*=\"sidebarCol\"]");
			if (!column) return void 0;
			return column.querySelector("[class*=\"logoRow\"]")?.parentElement || column.firstElementChild || void 0;
		}
		function placeEntry(root, entry) {
			if (entry.parentElement === root) return;
			root.insertBefore(entry, root.querySelector("[class*=\"footArea\"]") ?? null);
		}
		function isComposerInput(target) {
			return target instanceof HTMLTextAreaElement && target.matches(COMPOSER_INPUT);
		}
		function isDockInput(target) {
			return target instanceof HTMLTextAreaElement && target.matches(DOCK_INPUT);
		}
		function composerText(card) {
			return card?.querySelector("textarea")?.value.trim() ?? "";
		}
		function isComposerSend(target) {
			const button = target instanceof Element ? target.closest("button[aria-label]") : null;
			if (!button || !button.closest(COMPOSER_CARD)) return false;
			return /^(发送|send|提交|submit)$/i.test(button.getAttribute("aria-label")?.trim() ?? "");
		}
		function buildUi() {
			const style = document.createElement("style");
			style.setAttribute("data-dsh-dafeiyu-styles", "");
			style.textContent = styles;
			document.head.appendChild(style);
			const entry = document.createElement("div");
			entry.setAttribute("data-dsh-dafeiyu-entry", "");
			entry.setAttribute("role", "region");
			entry.setAttribute("aria-label", "大肥鱼");
			entry.title = "大肥鱼";
			entry.innerHTML = `<span class="dfy-peek" aria-hidden="true"><img src="${PEEK_HEAD_SRC}" alt="" /></span><span class="dfy-dock"><span class="dfy-dock-copy"><strong>大肥鱼</strong><textarea data-dfy-dock-input class="dfy-dock-input" rows="1" maxlength="4000" placeholder="和大肥鱼说话…" aria-label="和大肥鱼说话"></textarea></span><button class="dfy-dock-key" type="button" data-dfy-settings-toggle aria-label="大肥鱼设置" title="设置"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.15.08a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.08a2 2 0 0 1 1 1.73v.18a2 2 0 0 1-1 1.73l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.15.08a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.15-.08a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.73v-.18a2 2 0 0 1 1-1.73l.15-.08a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg></button></span><div class="dfy-settings" data-dfy-settings hidden><div class="dfy-settings-head"><span>大肥鱼设置</span><button class="dfy-settings-close" type="button" data-dfy-settings-close aria-label="关闭设置">×</button></div><label class="dfy-settings-row"><span>显示桌宠</span><input type="checkbox" data-dfy-setting-enabled /></label><label class="dfy-settings-row"><span>主输入框同步鲸鱼娘</span><input type="checkbox" data-dfy-setting-sync /></label><div class="dfy-settings-section"><span class="dfy-settings-label">桌宠位置</span><label class="dfy-settings-option"><input type="radio" name="dfy-deskpet-anchor" value="composer" data-dfy-setting-anchor />主输入框上方</label><label class="dfy-settings-option"><input type="radio" name="dfy-deskpet-anchor" value="dock" data-dfy-setting-anchor />左侧栏输入框上方</label></div></div>`;
			const settings = entry.querySelector("[data-dfy-settings]");
			const settingsToggle = entry.querySelector("[data-dfy-settings-toggle]");
			const settingsClose = entry.querySelector("[data-dfy-settings-close]");
			const enabledInput = entry.querySelector("[data-dfy-setting-enabled]");
			const anchorInputs = Array.from(entry.querySelectorAll("[data-dfy-setting-anchor]"));
			const deskpet = mountDeskpet(entry, "legacy");
			const syncInput = entry.querySelector("[data-dfy-setting-sync]");
			let syncWithWhale = true;
			let disposed = false;
			let lastSubmission;
			let queuedTurn = Promise.resolve();
			loadSettings().then((settingsValue) => {
				if (disposed) return;
				deskpet.setAnchor(settingsValue.anchor);
				syncWithWhale = settingsValue.syncWithWhale;
			});
			const showReply = (text, userText, startedAt, thought) => {
				deskpet.showReply({
					text,
					userText,
					startedAt,
					thought
				});
			};
			const requestChat = (text, startedAt) => {
				queuedTurn = queuedTurn.catch(() => void 0).then(async () => {
					if (disposed) return;
					deskpet.emit({ type: "reply-start" });
					const response = await postJson(`${API}/chat`, { text });
					if (disposed) return;
					if (response?.ok && response.value?.text) {
						deskpet.emit({ type: "reply-done" });
						showReply(response.value.text, text, startedAt, response.value.thought);
						return;
					}
					deskpet.emit({ type: "reply-error" });
					showReply("呜…本鱼刚才没接住这句话。你再叫我一次嘛。", text, startedAt);
				});
			};
			const submit = (raw) => {
				const text = raw.trim();
				const now = Date.now();
				if (!text || lastSubmission?.text === text && now - lastSubmission.at < 700) return;
				lastSubmission = {
					text,
					at: now
				};
				deskpet.emit({
					type: "message-sent",
					textLength: text.length
				});
				if (syncWithWhale) requestChat(text, now);
			};
			const greet = () => {
				const startedAt = Date.now();
				postJson(`${API}/bootstrap`, {}).then((response) => {
					if (disposed) return;
					showReply(response?.ok ? response.value?.greeting || "本鱼在呢，杂鱼。" : "本鱼在呢，杂鱼。", "你点了点大肥鱼", startedAt);
				});
			};
			const onInput = (event) => {
				if (isDockInput(event.target)) {
					const text = event.target.value.trim();
					deskpet.emit(text ? {
						type: "typing-start",
						textLength: text.length
					} : { type: "typing-stop" });
					return;
				}
				if (!isComposerInput(event.target)) return;
				const text = event.target.value.trim();
				deskpet.emit(text ? {
					type: "typing-start",
					textLength: text.length
				} : { type: "typing-stop" });
			};
			const onKeyDown = (event) => {
				if (isDockInput(event.target) && event.key === "Enter" && !event.shiftKey && !event.isComposing) {
					event.preventDefault();
					const text = event.target.value;
					event.target.value = "";
					deskpet.emit({ type: "typing-stop" });
					submit(text);
					return;
				}
				if (!isComposerInput(event.target) || event.key !== "Enter" || event.shiftKey || event.isComposing) return;
				submit(event.target.value);
			};
			const onClick = (event) => {
				if (!isComposerSend(event.target)) return;
				submit(composerText(event.target.closest(COMPOSER_CARD)));
			};
			const onNewSessionClick = (event) => {
				if (!(event.target instanceof Element ? event.target.closest("button[aria-label=\"新建会话\"], button[aria-label^=\"在“\"], button[aria-label*=\"新建会话\"]") : null)) return;
				const startedAt = Date.now();
				deskpet.emit({ type: "new-session" });
				postJson(`${API}/new-session-tip`, {}).then((response) => {
					if (disposed) return;
					showReply(response?.ok ? response.value?.text || "诶，新建会话啦？慢慢来。" : "诶，新建会话啦？慢慢来。", "你新建了会话", startedAt);
				});
			};
			const onSettingsToggle = () => {
				settings.hidden = !settings.hidden;
				if (!settings.hidden) loadSettings().then((settingsValue) => {
					if (disposed) return;
					enabledInput.checked = settingsValue.enabled;
					syncInput.checked = settingsValue.syncWithWhale;
					anchorInputs.forEach((input) => {
						input.checked = input.value === settingsValue.anchor;
					});
				});
			};
			const onSettingsClose = () => {
				settings.hidden = true;
			};
			const onEnabledChange = () => {
				const enabled = enabledInput.checked;
				deskpet.setEnabled(enabled);
				saveSettings({ enabled });
			};
			const onAnchorChange = (event) => {
				const value = event.target.value;
				if (value !== "composer" && value !== "dock") return;
				const anchor = value;
				deskpet.setAnchor(anchor);
				saveSettings({ anchor });
			};
			const onSyncChange = () => {
				syncWithWhale = syncInput.checked;
				saveSettings({ syncWithWhale });
			};
			const onEntryClick = (event) => {
				if ((event.target instanceof Element ? event.target : null)?.closest("textarea,button,[data-dfy-settings]")) return;
				greet();
			};
			entry.addEventListener("click", onEntryClick);
			settingsToggle.addEventListener("click", onSettingsToggle);
			settingsClose.addEventListener("click", onSettingsClose);
			enabledInput.addEventListener("change", onEnabledChange);
			syncInput.addEventListener("change", onSyncChange);
			anchorInputs.forEach((input) => input.addEventListener("change", onAnchorChange));
			document.addEventListener("input", onInput, true);
			document.addEventListener("keydown", onKeyDown, true);
			document.addEventListener("click", onClick, true);
			document.addEventListener("click", onNewSessionClick, true);
			const tryPlace = () => {
				const root = sidebarRoot();
				if (root && !root.contains(entry)) placeEntry(root, entry);
			};
			const observer = new MutationObserver(tryPlace);
			observer.observe(document.body, {
				childList: true,
				subtree: true
			});
			tryPlace();
			return { dispose() {
				disposed = true;
				entry.removeEventListener("click", onEntryClick);
				settingsToggle.removeEventListener("click", onSettingsToggle);
				settingsClose.removeEventListener("click", onSettingsClose);
				enabledInput.removeEventListener("change", onEnabledChange);
				syncInput.removeEventListener("change", onSyncChange);
				anchorInputs.forEach((input) => input.removeEventListener("change", onAnchorChange));
				document.removeEventListener("input", onInput, true);
				document.removeEventListener("keydown", onKeyDown, true);
				document.removeEventListener("click", onClick, true);
				document.removeEventListener("click", onNewSessionClick, true);
				observer.disconnect();
				deskpet.dispose();
				style.remove();
				entry.remove();
			} };
		}
		function apply(ctx) {
			ctx.effect?.(() => {
				try {
					return buildUi().dispose;
				} catch (error) {
					console.warn("[dsh-dafeiyu] ui mount failed:", error);
					return;
				}
			}, "@dsh-external/dsh-dafeiyu-chan: mount");
			ctx.effect?.(() => {
				try {
					return ctx.slots.inject("sidebar.footer.action", () => ctx.slots.register({
						name: "sidebar.footer.action",
						id: "@dsh-external/dsh-dafeiyu-chan-sidebar",
						label: () => "大肥鱼",
						component: () => ({ render() {
							return null;
						} })
					}));
				} catch (error) {
					console.warn("[dsh-dafeiyu] slot register failed:", error);
					return;
				}
			}, "@dsh-external/dsh-dafeiyu-chan: slot");
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map