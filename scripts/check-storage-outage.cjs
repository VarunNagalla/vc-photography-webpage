const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");

const source = ts.transpileModule(fs.readFileSync("src/app/page.tsx", "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
const content = { hero: { title: "Default", subtitle: "" }, about: { heading: "", body: "" }, contact: {} };
const settings = { backgroundImage: "", aboutImage: "", logoImage: "https://example.com/shared-logo.png" };
async function check(failing) {
  const exports = {};
  const photos = [{ id: "photo", url: "/photo.jpg" }];
  const read = (name, value) => async () => {
    if (failing.includes(name)) throw new Error("Storage offline");
    return value;
  };
  vm.runInNewContext(source, { exports, console: { error() {} }, require(name) {
    if (name === "react/jsx-runtime") return require(name);
    if (name === "@/lib/photos") return { getPhotos: read("photos", photos) };
    if (name === "@/lib/content") return { getContent: read("content", content), DEFAULT_CONTENT: content };
    if (name === "@/lib/settings") return { getSettings: read("settings", settings), DEFAULT_SETTINGS: { ...settings, logoImage: "" } };
    return { default: "component", PhotoViewerProvider: "viewer" };
  } });
  const page = await exports.default();
  assert.equal(page.props.photos.length, failing.includes("photos") ? 0 : 1);
  assert.ok(JSON.stringify(page).includes("Default"));
  // The same uploaded image feeds the navbar and the contact section.
  assert.equal(JSON.stringify(page).split(settings.logoImage).length - 1, failing.includes("settings") ? 0 : 2);
}
(async () => {
  await check([]);
  await check(["settings"]);
  await check(["photos", "content", "settings"]);
  console.log("Homepage renders with healthy, partial, and unavailable storage.");
})().catch(error => { console.error(error); process.exitCode = 1; });
