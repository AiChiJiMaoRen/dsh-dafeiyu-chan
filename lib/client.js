window.__ModuleLoader__.load({
	id: "@dsh-external/dsh-dafeiyu-chan",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		//#region src/client/avatar.ts
		const PEEK_HEAD_SRC = "data:image/jpeg;base64,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";
		//#endregion
		//#region src/client/index.ts
		const inject = ["slots"];
		const API = "/api/dsh-dafeiyu";
		/** 鲸鱼娘主动消息展示后自动收起对话框的延迟（差不多够读完的时长；常驻后不生效）。 */
		const AUTO_CLOSE_MS = 8e3;
		const styles = `
[data-dsh-dafeiyu-entry],.dfy-panel{--dfy-base:var(--dsw-specific-sidebar-fill,#19191b);--dfy-surface:var(--dsw-alias-bg-layer-2,#222225);--dfy-line:var(--dsw-alias-border-l2,rgba(255,255,255,.11));--dfy-text:var(--dsw-alias-label-primary,#f2f2f3);--dfy-muted:var(--dsw-alias-label-secondary,#a3a4aa);--dfy-faint:var(--dsw-alias-label-tertiary,#777980);--dfy-accent:var(--dsw-alias-brand-primary-new-colorprimary-new-color,#5e9cff)}
[data-dsh-dafeiyu-entry]{position:relative;display:block;width:100%;height:66px;box-sizing:border-box;padding:0 9px;border:0;background:transparent;color:inherit;cursor:pointer;font:inherit;text-align:left}
.dfy-dock{position:absolute;inset:17px 9px 4px;display:flex;align-items:center;min-width:0;padding:0 11px 0 54px;border:1px solid var(--dfy-line);border-radius:10px;background:color-mix(in srgb,var(--dfy-surface) 78%,transparent);transition:background .18s,border-color .18s,border-radius .18s}.dfy-dock::before{position:absolute;top:0;bottom:0;left:54px;width:1px;background:color-mix(in srgb,var(--dfy-line) 70%,transparent);content:""}
[data-dsh-dafeiyu-entry]:hover .dfy-dock{background:var(--dfy-surface);border-color:color-mix(in srgb,var(--dfy-line) 70%,var(--dfy-accent))}[data-dsh-dafeiyu-entry][data-open] .dfy-dock{border-top-color:transparent;border-radius:0 0 10px 10px;background:var(--dfy-base)}
.dfy-peek{position:absolute;z-index:3;top:3px;left:15px;width:47px;height:51px;overflow:hidden;border:1px solid color-mix(in srgb,var(--dfy-line) 70%,#fff);border-radius:16px 16px 11px 11px;background:#d9d4c8;box-shadow:0 4px 10px rgba(0,0,0,.18);transition:transform .2s ease,opacity .16s}.dfy-peek img{display:block;width:100%;height:100%;object-fit:cover;transform:scale(1.14) translateY(4px)}[data-dsh-dafeiyu-entry]:hover .dfy-peek{transform:translateY(-2px)}[data-dsh-dafeiyu-entry][data-open] .dfy-peek{opacity:.64;transform:translateY(3px) scale(.92)}
.dfy-dock-copy{display:flex;min-width:0;flex:1;flex-direction:column;gap:2px;padding-left:7px}.dfy-dock-copy strong{overflow:hidden;color:var(--dfy-text);font-size:11px;font-weight:600;line-height:1;white-space:nowrap;text-overflow:ellipsis}.dfy-dock-copy span{overflow:hidden;color:var(--dfy-faint);font-size:10px;line-height:1;white-space:nowrap;text-overflow:ellipsis}.dfy-dock-key{display:grid;width:20px;height:20px;flex:0 0 auto;margin-left:8px;place-items:center;border:1px solid color-mix(in srgb,var(--dfy-accent) 34%,transparent);border-radius:7px;background:color-mix(in srgb,var(--dfy-accent) 12%,transparent);color:var(--dfy-accent);font-size:11px;line-height:1;transition:background .16s,border-color .16s}[data-dsh-dafeiyu-entry]:hover .dfy-dock-key{border-color:color-mix(in srgb,var(--dfy-accent) 62%,transparent);background:color-mix(in srgb,var(--dfy-accent) 22%,transparent)}
.dfy-panel{position:fixed;z-index:10000;display:flex;flex-direction:column;box-sizing:border-box;min-height:270px;max-height:min(540px,calc(100vh - 105px));overflow:hidden;border:1px solid var(--dfy-line);border-bottom:0;border-radius:12px 12px 0 0;background:var(--dfy-base);box-shadow:0 -12px 28px rgba(0,0,0,.09);opacity:0;pointer-events:none;transform:translateY(7px);transform-origin:left bottom;transition:opacity .16s,transform .18s ease,visibility .18s;visibility:hidden}.dfy-panel[data-open]{opacity:1;pointer-events:auto;transform:translateY(0);visibility:visible}
.dfy-head{display:flex;align-items:center;gap:10px;flex:0 0 auto;padding:12px 13px 11px;border-bottom:1px solid var(--dfy-line)}.dfy-portrait{width:44px;height:48px;overflow:hidden;flex:0 0 auto;border-radius:13px 13px 9px 9px;background:#d9d4c8}.dfy-portrait img{display:block;width:100%;height:100%;object-fit:cover;transform:scale(1.16) translateY(4px)}.dfy-title{display:flex;min-width:0;flex:1;flex-direction:column;gap:4px}.dfy-title strong{color:var(--dfy-text);font-size:13px;font-weight:620;line-height:1}.dfy-title span{color:var(--dfy-muted);font-size:10px;line-height:1}.dfy-close{display:grid;width:24px;height:24px;padding:0;place-items:center;border:0;border-radius:6px;background:transparent;color:var(--dfy-faint);cursor:pointer}.dfy-close:hover{background:var(--dfy-surface);color:var(--dfy-text)}
.dfy-memory{margin:0 13px;padding:9px 0;border-bottom:1px solid color-mix(in srgb,var(--dfy-line) 72%,transparent);color:var(--dfy-muted);font-size:11px;line-height:1.5}.dfy-memory[hidden]{display:none}.dfy-memory-label{margin-right:5px;color:var(--dfy-accent)}
.dfy-notes{display:flex;flex:1 1 auto;flex-direction:column;gap:13px;min-height:102px;padding:14px 13px 10px;overflow-y:auto;scrollbar-width:thin;scrollbar-color:color-mix(in srgb,var(--dfy-line) 88%,transparent) transparent}.dfy-empty{margin:auto 0;color:var(--dfy-faint);font-size:11px;line-height:1.6;text-align:center}.dfy-message{max-width:100%;animation:dfy-in .18s ease both}.dfy-message[data-role="whale"]{padding-left:10px;border-left:1px solid color-mix(in srgb,var(--dfy-accent) 68%,transparent)}.dfy-message[data-role="user"]{align-self:flex-end;max-width:88%;text-align:right}.dfy-message-meta{margin-bottom:4px;color:var(--dfy-faint);font-size:10px;line-height:1}.dfy-message-copy{color:var(--dfy-text);font-size:12px;line-height:1.65;white-space:pre-wrap;overflow-wrap:anywhere}.dfy-message[data-role="user"] .dfy-message-copy{color:color-mix(in srgb,var(--dfy-text) 88%,var(--dfy-accent))}.dfy-sticker{display:block;max-width:148px;max-height:148px;margin-top:6px;border-radius:10px;border:1px solid color-mix(in srgb,var(--dfy-line) 78%,transparent);object-fit:contain;filter:saturate(.94) brightness(.98);box-shadow:0 2px 8px rgba(0,0,0,.16)}
.dfy-action-row{display:flex;flex:0 0 auto;padding:7px 13px 4px;border-top:1px solid var(--dfy-line)}.dfy-quick{display:inline-flex;align-items:center;gap:5px;padding:3px 0;border:0;background:transparent;color:var(--dfy-muted);font:inherit;font-size:11px;cursor:pointer}.dfy-quick:hover:not(:disabled){color:var(--dfy-text)}.dfy-quick:disabled{cursor:wait;opacity:.54}
.dfy-compose{display:flex;align-items:center;flex:0 0 auto;gap:7px;padding:7px 9px 9px;background:var(--dfy-base)}.dfy-input{display:block;min-width:0;flex:1;padding:8px 5px;border:0;outline:0;background:transparent;color:var(--dfy-text);font:inherit;font-size:12px;line-height:1.4}.dfy-input::placeholder{color:var(--dfy-faint)}.dfy-input:focus{color:var(--dfy-text)}.dfy-send{display:grid;width:30px;height:30px;flex:0 0 auto;padding:0;place-items:center;border:0;border-radius:8px;background:transparent;color:var(--dfy-accent);cursor:pointer}.dfy-send:hover:not(:disabled){background:color-mix(in srgb,var(--dfy-accent) 12%,transparent)}.dfy-send:disabled{cursor:wait;opacity:.45}
/* Translucent refinement: preserve the original dark DSH surface, then reveal its depth. */
.dfy-dock{background:color-mix(in srgb,var(--dfy-surface) 58%,transparent);box-shadow:inset 0 1px 0 rgba(255,255,255,.065),0 8px 22px rgba(0,0,0,.2);-webkit-backdrop-filter:blur(13px) saturate(108%);backdrop-filter:blur(13px) saturate(108%)}
[data-dsh-dafeiyu-entry]:hover .dfy-dock{background:color-mix(in srgb,var(--dfy-surface) 70%,transparent);box-shadow:inset 0 1px 0 rgba(255,255,255,.09),0 10px 26px rgba(0,0,0,.24)}[data-dsh-dafeiyu-entry][data-open] .dfy-dock{background:color-mix(in srgb,var(--dfy-base) 60%,transparent)}
.dfy-panel{background:color-mix(in srgb,var(--dfy-base) 62%,transparent);border-color:color-mix(in srgb,var(--dfy-line) 86%,rgba(255,255,255,.12));box-shadow:inset 0 1px 0 rgba(255,255,255,.075),0 -14px 34px rgba(0,0,0,.24);-webkit-backdrop-filter:blur(18px) saturate(108%);backdrop-filter:blur(18px) saturate(108%)}
.dfy-head{background:rgba(255,255,255,.018)}.dfy-action-row{background:rgba(0,0,0,.035)}.dfy-compose{background:rgba(0,0,0,.035)}.dfy-input{background:rgba(255,255,255,.025);border-radius:8px}.dfy-input:focus{background:rgba(255,255,255,.04)}.dfy-send{background:rgba(255,255,255,.035);box-shadow:inset 0 1px 0 rgba(255,255,255,.06)}
@keyframes dfy-in{from{opacity:0;transform:translateY(3px)}to{opacity:1;transform:translateY(0)}}@media(prefers-reduced-motion:reduce){.dfy-panel,.dfy-peek,.dfy-dock{transition:none}.dfy-message{animation:none}}
`;
		function postJson(path, payload) {
			return fetch(path, {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify(payload ?? {})
			}).then((response) => response.json()).catch(() => null);
		}
		function sidebarRoot() {
			const column = document.querySelector("[data-pane=\"sidebar\"], [class*=\"sidebarCol\"]");
			if (!column) return void 0;
			return column.querySelector("[class*=\"logoRow\"]")?.parentElement || column.firstElementChild || void 0;
		}
		/**
		* 把鱼条插到导航列**最底部、设置区上方**：当前 shell 的底部区域类名含 `footArea`
		* （CSS-module 词根稳定，hash 前缀可变化），鱼条插在它**之前**（= 工作区列表之下、设置之上）；
		* 放在 footArea 之后会跑到「设置」下面显得太贴底。找不到时直接 append 根末尾兜底。
		*/
		function placeEntry(root, entry) {
			if (entry.parentElement === root) return;
			const foot = root.querySelector("[class*=\"footArea\"]");
			root.insertBefore(entry, foot ?? null);
		}
		function icon(name) {
			return {
				sparkle: "<svg viewBox=\"0 0 16 16\" width=\"12\" height=\"12\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.35\" stroke-linecap=\"round\"><path d=\"M8 1.8c.45 3.78 1.92 5.95 5.5 6.2-3.58.25-5.05 2.42-5.5 6.2C7.55 10.42 6.08 8.25 2.5 8 6.08 7.75 7.55 5.58 8 1.8Z\"/></svg>",
				send: "<svg viewBox=\"0 0 16 16\" width=\"15\" height=\"15\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"m2.2 7.6 11.2-4.5-4.5 11.2-1.6-4.1-5.1-2.6Z\"/><path d=\"m7.3 10.2 2.4-2.4\"/></svg>",
				close: "<svg viewBox=\"0 0 16 16\" width=\"14\" height=\"14\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"round\"><path d=\"m4 4 8 8M12 4l-8 8\"/></svg>"
			}[name];
		}
		function buildUi(state) {
			const style = document.createElement("style");
			style.setAttribute("data-dsh-dafeiyu-styles", "");
			style.textContent = styles;
			document.head.appendChild(style);
			const entry = document.createElement("button");
			entry.type = "button";
			entry.setAttribute("data-dsh-dafeiyu-entry", "");
			entry.setAttribute("aria-label", "和大肥鱼聊天");
			entry.title = "大肥鱼 · 想说点什么？";
			entry.innerHTML = `<span class="dfy-peek" aria-hidden="true"><img src="${PEEK_HEAD_SRC}" alt="" /></span><span class="dfy-dock"><span class="dfy-dock-copy"><strong>大肥鱼</strong><span data-dfy-dock-copy>想和我说什么？</span></span><span class="dfy-dock-key" aria-hidden="true">→</span></span>`;
			const panel = document.createElement("section");
			panel.className = "dfy-panel";
			panel.setAttribute("aria-label", "大肥鱼私密便签");
			panel.innerHTML = `<header class="dfy-head"><span class="dfy-portrait" aria-hidden="true"><img src="${PEEK_HEAD_SRC}" alt="" /></span><span class="dfy-title"><strong>大肥鱼</strong><span>你的小看板娘</span></span><button class="dfy-close" type="button" aria-label="收起大肥鱼">${icon("close")}</button></header><div class="dfy-memory" hidden></div><div class="dfy-notes" role="log" aria-live="polite"><p class="dfy-empty">今天也可以从一句碎碎念开始。</p></div><div class="dfy-action-row"><button class="dfy-quick" type="button" title="让我看看工作区和草稿，给你几个下一步的点子">${icon("sparkle")} 给我个点子</button></div><div class="dfy-compose"><textarea class="dfy-input" rows="1" placeholder="想和大肥鱼说什么？" aria-label="给大肥鱼的消息"></textarea><button class="dfy-send" type="button" aria-label="发送消息">${icon("send")}</button></div>`;
			const close = panel.querySelector(".dfy-close");
			const notes = panel.querySelector(".dfy-notes");
			const memory = panel.querySelector(".dfy-memory");
			const ideas = panel.querySelector(".dfy-quick");
			const input = panel.querySelector(".dfy-input");
			const send = panel.querySelector(".dfy-send");
			const dockCopy = entry.querySelector("[data-dfy-dock-copy]");
			const setBusy = (busy) => {
				send.disabled = busy;
			};
			const positionPanel = () => {
				if (!state.open || !entry.isConnected) return;
				const rect = entry.getBoundingClientRect();
				if (rect.width === 0 || rect.height === 0 || rect.left === 0 && rect.top === 0) return;
				const left = Math.max(9, rect.left + 9);
				panel.style.left = `${left}px`;
				panel.style.width = `${Math.max(160, Math.min(rect.width - 18, window.innerWidth - left - 8))}px`;
				panel.style.bottom = `${Math.max(8, window.innerHeight - (rect.top + 17))}px`;
			};
			const resizeInput = () => {
				input.style.height = "auto";
				input.style.height = `${Math.min(input.scrollHeight, 72)}px`;
			};
			const renderMemory = () => {
				const focus = state.memory?.currentFocus?.trim();
				const latest = state.memory?.progressLog?.[0]?.text?.trim();
				const note = focus || latest;
				memory.hidden = !note;
				if (!note) return;
				memory.replaceChildren();
				const label = document.createElement("span");
				label.className = "dfy-memory-label";
				label.textContent = focus ? "我记得：" : "上次你说：";
				memory.append(label, document.createTextNode(note));
			};
			let autoCloseTimer;
			const armAutoClose = () => {
				if (state.persistent) return;
				window.clearTimeout(autoCloseTimer);
				autoCloseTimer = window.setTimeout(() => {
					if (!state.open || state.persistent) return;
					if (panel.matches(":hover")) {
						armAutoClose();
						return;
					}
					if (input.value.trim() !== "") {
						armAutoClose();
						return;
					}
					state.open = false;
					render();
				}, AUTO_CLOSE_MS);
			};
			panel.addEventListener("pointerenter", () => {
				window.clearTimeout(autoCloseTimer);
			});
			panel.addEventListener("pointerleave", () => {
				if (state.open && !state.persistent) armAutoClose();
			});
			const enterPersistent = () => {
				if (state.persistent) return;
				state.persistent = true;
				window.clearTimeout(autoCloseTimer);
			};
			const addMessage = (role, text) => {
				notes.querySelector(".dfy-empty")?.remove();
				const message = document.createElement("article");
				message.className = "dfy-message";
				message.dataset.role = role;
				const meta = document.createElement("div");
				meta.className = "dfy-message-meta";
				meta.textContent = role === "whale" ? "大肥鱼" : "你";
				const copy = document.createElement("div");
				copy.className = "dfy-message-copy";
				copy.textContent = text;
				message.append(meta, copy);
				notes.appendChild(message);
				notes.scrollTop = notes.scrollHeight;
			};
			const addSticker = (file) => {
				const img = document.createElement("img");
				img.className = "dfy-sticker";
				img.src = `${API}/stickers/${encodeURIComponent(file)}`;
				img.alt = "表情";
				const last = notes.lastElementChild;
				if (last instanceof HTMLElement && last.classList.contains("dfy-message") && last.dataset.role === "whale") last.appendChild(img);
				else {
					const wrap = document.createElement("article");
					wrap.className = "dfy-message";
					wrap.dataset.role = "whale";
					wrap.appendChild(img);
					notes.appendChild(wrap);
				}
				notes.scrollTop = notes.scrollHeight;
			};
			const render = (focusInput = false) => {
				entry.toggleAttribute("data-open", state.open);
				panel.toggleAttribute("data-open", state.open);
				dockCopy.textContent = state.open ? "在这里，慢慢说。" : "想和我说什么？";
				positionPanel();
				if (state.open && focusInput) window.setTimeout(() => input.focus(), 90);
			};
			const open = (focusInput = true) => {
				if (state.loading) return;
				if (state.greeted) {
					state.open = true;
					render(focusInput);
					armAutoClose();
					return;
				}
				state.loading = true;
				state.greeted = true;
				setBusy(true);
				dockCopy.textContent = "正在冒泡泡…";
				postJson(`${API}/bootstrap`, {}).then((response) => {
					state.loading = false;
					setBusy(false);
					if (response?.ok && response.value) {
						state.memory = response.value.memory;
						renderMemory();
						addMessage("whale", response.value.greeting || "本鱼在啦。今天想聊点什么？");
						if (response.value.sticker?.file) addSticker(response.value.sticker.file);
						const files = Array.isArray(response.value.stickers) ? response.value.stickers : [];
						for (const file of files) {
							const pre = new Image();
							pre.src = `${API}/stickers/${encodeURIComponent(file)}`;
						}
					} else addMessage("whale", "本鱼在啦。今天想聊点什么？");
					state.open = true;
					render(focusInput);
					armAutoClose();
					postJson(`${API}/ideas`, {}).then((ideasResponse) => {
						if (ideasResponse?.ok && ideasResponse.value?.isNewProject) addMessage("whale", "诶，这里像是个新地盘。想要起步点子的话，点下面「给我个点子」就好。");
					});
				});
			};
			const fetchIdeas = () => {
				ideas.disabled = true;
				ideas.innerHTML = `${icon("sparkle")} 正在翻小本本…`;
				setBusy(true);
				postJson(`${API}/ideas`, {}).then((response) => {
					ideas.disabled = false;
					ideas.innerHTML = `${icon("sparkle")} 给我个点子`;
					setBusy(false);
					if (!response?.ok || !response.value) return addMessage("whale", "呜…本鱼的脑瓜短路了一下，待会儿再叫我想想嘛。");
					const list = Array.isArray(response.value.ideas) ? response.value.ideas : [];
					if (response.value.isNewProject) addMessage("whale", "诶，这里像是个新地盘。我先记下几个起步点子：");
					if (list.length === 0) return addMessage("whale", "本鱼暂时没翻到特别好的点子，等你多写一点再叫我。");
					for (const idea of list) addMessage("whale", String(idea));
					if (response.value.note) addMessage("whale", `（${response.value.note}）`);
				});
			};
			const sendTurn = () => {
				const text = input.value.trim();
				if (!text || send.disabled) return;
				enterPersistent();
				addMessage("user", text);
				input.value = "";
				resizeInput();
				setBusy(true);
				postJson(`${API}/chat`, { text }).then((response) => {
					setBusy(false);
					if (response?.ok && response.value) {
						state.memory = response.value.memory;
						renderMemory();
						addMessage("whale", response.value.text || "唔，本鱼听着呢。");
						if (response.value.sticker?.file) addSticker(response.value.sticker.file);
					} else addMessage("whale", "呜…本鱼现在连不上，稍后再和我说一次好不好？");
				});
			};
			entry.addEventListener("click", () => {
				if (state.open) {
					state.open = false;
					render();
				} else open();
			});
			close.addEventListener("click", () => {
				state.open = false;
				render();
			});
			ideas.addEventListener("click", fetchIdeas);
			send.addEventListener("click", sendTurn);
			input.addEventListener("input", resizeInput);
			input.addEventListener("keydown", (event) => {
				if (event.key === "Enter" && !event.shiftKey) {
					event.preventDefault();
					sendTurn();
				}
			});
			window.addEventListener("resize", positionPanel);
			window.addEventListener("scroll", positionPanel, true);
			document.body.appendChild(panel);
			const tryPlace = () => {
				const root = sidebarRoot();
				if (root && !root.contains(entry)) placeEntry(root, entry);
				positionPanel();
			};
			const observer = new MutationObserver(tryPlace);
			observer.observe(document.body, {
				childList: true,
				subtree: true
			});
			tryPlace();
			render();
			const onNewSessionClick = (event) => {
				if (!event.target?.closest("button[aria-label=\"新建会话\"], button[aria-label^=\"在“\"], button[aria-label*=\"新建会话\"]")) return;
				if (state.loading) return;
				state.loading = true;
				state.greeted = true;
				setBusy(true);
				dockCopy.textContent = "正在冒泡泡…";
				postJson(`${API}/new-session-tip`, {}).then((response) => {
					state.loading = false;
					setBusy(false);
					addMessage("whale", response?.ok ? response.value?.text || "诶，新建会话啦？想好要做什么了吗？" : "诶，新建会话啦？想好要做什么了吗？");
					if (response?.ok && response.value?.sticker?.file) addSticker(response.value.sticker.file);
					state.open = true;
					render(false);
					armAutoClose();
				});
			};
			document.addEventListener("click", onNewSessionClick, true);
			return { dispose() {
				document.removeEventListener("click", onNewSessionClick, true);
				window.removeEventListener("resize", positionPanel);
				window.removeEventListener("scroll", positionPanel, true);
				observer.disconnect();
				style.remove();
				entry.remove();
				panel.remove();
			} };
		}
		function apply(ctx) {
			const state = {
				open: false,
				greeted: false,
				persistent: false,
				loading: false
			};
			ctx.effect?.(() => {
				try {
					return buildUi(state).dispose;
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