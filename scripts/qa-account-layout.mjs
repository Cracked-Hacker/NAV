// Browser-validated account QA. The fixture uses real auth HTML + CSS, but
// does not call Supabase or accept credentials. GitHub Actions serves it locally.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";

const raw = readFileSync("account/auth.html", "utf8");
const destination = "account/.qa-auth.html";
const outDir = "qa-screenshots";
mkdirSync(outDir, { recursive: true });

const injection = '<script>window.addEventListener("load",function(){' +
  'var mode=new URLSearchParams(location.search).get("mode")||"login";' +
  'document.querySelector("#"+mode+"-form").hidden=false;' +
  'document.querySelector("#account-status").hidden=true;' +
  'requestAnimationFrame(function(){' +
  'var width=window.innerWidth;' +
  'var contentWidth=document.documentElement.scrollWidth;' +
  'var card=document.querySelector(".account-card");' +
  'var layout=document.querySelector(".account-auth-layout");' +
  'document.body.setAttribute("data-qa-viewport",String(width));' +
  'document.body.setAttribute("data-qa-overflow",String(contentWidth>width+1));' +
  'document.body.setAttribute("data-qa-card-width",String(Math.round(card.getBoundingClientRect().width)));' +
  'document.body.setAttribute("data-qa-column-count",String(getComputedStyle(layout).gridTemplateColumns.trim().split(/\s+/).length));' +
  '});});</script></body>';

const fixture = raw
  .replace(/<meta http-equiv="Content-Security-Policy"[^>]*>/i, "")
  .replace(/<script type="module" src="(?:navigation|auth)\.js"><\/script>/g, "")
  .replace("</body>", injection);
writeFileSync(destination, fixture);

const widths = [320, 390, 768, 1024, 1440];
try {
  for (const mode of ["login", "signup"]) {
    for (const width of widths) {
      const url = "http://127.0.0.1:4173/account/.qa-auth.html?mode=" + mode;
      const common = [
        "--headless", "--no-sandbox", "--disable-gpu", "--hide-scrollbars",
        "--disable-background-networking", "--force-device-scale-factor=1",
        "--window-size=" + width + ",1000", "--virtual-time-budget=1500"
      ];
      const dom = spawnSync("google-chrome", [...common, "--dump-dom", url], {
        encoding: "utf8", timeout: 30000, maxBuffer: 4_000_000
      });
      assert.equal(dom.status, 0, "Chrome DOM failed for " + mode + "/" + width + ": " + (dom.stderr || "").slice(-500));
      const attribute = name => {
        const match = dom.stdout.match(new RegExp(" data-qa-" + name + '="([^"]+)"'));
        assert.ok(match, "Missing computed viewport evidence: " + mode + "/" + width + "/" + name);
        return match[1];
      };
      const actualWidth = Number(attribute("viewport"));
      const cardWidth = Number(attribute("card-width"));
      const columns = Number(attribute("column-count"));
      assert.equal(actualWidth, width, "Chrome did not honor requested viewport " + width);
      assert.equal(attribute("overflow"), "false", "Horizontal overflow: " + mode + "/" + width);
      assert.ok(cardWidth >= (width >= 1440 ? 520 : width >= 768 ? 450 : 240),
        "Account card too narrow at viewport " + width + ": " + cardWidth);
      assert.equal(columns, width > 1100 ? 2 : 1, "Unexpected column count at " + width);
      const screenshot = outDir + "/account-" + mode + "-" + width + ".png";
      const shot = spawnSync("google-chrome", [...common, "--screenshot=" + screenshot, url], {
        encoding: "utf8", timeout: 30000, maxBuffer: 1_000_000
      });
      assert.equal(shot.status, 0, "Chrome screenshot failed for " + mode + "/" + width);
      console.log("NAV account viewport PASS", { mode, requestedWidth: width, actualWidth, cardWidth, columns, overflow: false });
    }
  }
} finally {
  rmSync(destination, { force: true });
}
