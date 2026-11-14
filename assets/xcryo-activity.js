/* Page-activity events for the X°CRYO lander and order form.
   Uses the page's existing track(event, extra) so attribution stays identical.
   Each event fires once per page view. */
function bindActivity(track){
  var firedScroll = {};
  function scrollDepth(){
    var el = document.scrollingElement || document.documentElement;
    var top = el.scrollTop || window.pageYOffset || 0;
    var full = el.scrollHeight || 0;
    var view = el.clientHeight || window.innerHeight || 0;
    var max = full - view;
    /* A few pixels covers subpixel rounding at the real bottom. */
    if (max <= 16 || top >= max - 16) return 100;
    return Math.min(100, (top / max) * 100);
  }
  function checkScroll(){
    var d = scrollDepth();
    [25, 50, 75, 100].forEach(function(mark){
      if (!firedScroll[mark] && d + 0.5 >= mark) {
        firedScroll[mark] = true;
        track("scroll_" + mark);
      }
    });
    if (firedScroll[100]) window.removeEventListener("scroll", onScroll);
  }
  var ticking = false;
  function onScroll(){
    if (ticking) return;
    ticking = true;
    (window.requestAnimationFrame || function(fn){ return setTimeout(fn, 50); })(function(){
      ticking = false;
      checkScroll();
    });
  }
  window.addEventListener("scroll", onScroll, {passive: true});
  window.addEventListener("resize", checkScroll);
  window.addEventListener("load", checkScroll);
  Array.prototype.forEach.call(document.images || [], function(img){
    if (!img.complete) img.addEventListener("load", checkScroll, {once: true});
  });
  checkScroll();

  function sectionLabel(el){
    if (el.id) return el.id;
    var h = el.querySelector("h1, h2, h3");
    var text = h ? h.textContent.replace(/\s+/g, " ").trim() : "";
    return text.slice(0, 80) || "section";
  }
  if ("IntersectionObserver" in window) {
    var seen = {};
    var targets = [];
    function add(el){
      if (el && targets.indexOf(el) === -1) targets.push(el);
    }
    Array.prototype.forEach.call(document.querySelectorAll("section"), add);
    Array.prototype.forEach.call(document.querySelectorAll("nav a[href^='#']"), function(a){
      var id = (a.getAttribute("href") || "").slice(1);
      if (id) add(document.getElementById(id));
    });
    var steps = [];
    for (var i = 0; i <= 20; i++) steps.push(i / 20);
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        var el = entry.target;
        var label = sectionLabel(el);
        if (seen[label]) return;
        var vh = (entry.rootBounds && entry.rootBounds.height) || window.innerHeight || 1;
        var visible = entry.intersectionRect ? entry.intersectionRect.height : 0;
        /* A section taller than the screen can never be 50% inside the viewport.
           Count it once it fills at least half the screen. */
        var tall = el.getBoundingClientRect().height > vh;
        var half = entry.intersectionRatio >= 0.5 || (tall && visible >= vh * 0.5);
        if (entry.isIntersecting && half) {
          seen[label] = true;
          track("section_view", {section: label});
          io.unobserve(el);
        }
      });
    }, {threshold: steps});
    targets.forEach(function(el){ io.observe(el); });
  }

  document.addEventListener("click", function(e){
    var node = e.target;
    var a = null;
    while (node && node !== document) {
      if (node.tagName === "A") { a = node; break; }
      node = node.parentNode;
    }
    if (!a) return;
    var href = a.getAttribute("href") || "";
    if (href.indexOf("tel:") === 0) track("tel_click", {href: href.slice(0, 180)});
    else if (href.indexOf("mailto:") === 0) track("email_click", {href: href.split("?")[0].slice(0, 180)});
    else if (/^https?:\/\//i.test(href)) {
      try {
        var host = new URL(href, location.href).hostname;
        if (host && host !== location.hostname) track("outbound_click", {href: href.slice(0, 180)});
      } catch(err){}
    }
  }, true);

  [30, 120].forEach(function(seconds){
    setTimeout(function(){ track("time_on_page", {seconds: seconds}); }, seconds * 1000);
  });
}
