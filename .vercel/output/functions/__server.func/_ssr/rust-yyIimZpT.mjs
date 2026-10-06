import { i as __toESM } from "../_runtime.mjs";
import { q as require_react, x as require_jsx_runtime, y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/rust-yyIimZpT.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function rustApi() {
	return window.wimampgtm;
}
function RustPlayer() {
	const [error, setError] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		let dead = false;
		const boot = () => {
			const api = rustApi();
			if (!api) {
				if (!dead) setError("Rust player failed to load");
				return;
			}
			api({ module_or_path: "/rust/wimampgtm_bg.wasm" }).then(() => {
				if (dead) {
					api.stop();
					return;
				}
				api.start();
			}).catch((cause) => {
				if (!dead) setError(cause instanceof Error ? cause.message : "Rust player failed to load");
			});
		};
		let script = document.querySelector("script[data-wimamp-rust]");
		if (!script) {
			script = document.createElement("script");
			script.src = "/rust/wimampgtm.js";
			script.dataset.wimampRust = "1";
			document.head.appendChild(script);
		}
		if (rustApi()) boot();
		else script.addEventListener("load", boot);
		return () => {
			dead = true;
			script?.removeEventListener("load", boot);
			rustApi()?.stop();
		};
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "desk-hint rust-back",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/",
				children: "JS skin"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: " · Rust build of the stock skin" })]
		}),
		error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "desk-hint",
			children: error
		}) : null,
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			id: "wimamp-rust",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "desk-hint",
				children: "Loading the Rust player…"
			})
		})
	] });
}
//#endregion
export { RustPlayer as component };
