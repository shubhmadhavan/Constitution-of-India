/*
 * mobile.js – mobile-only enhancements for the Constitution viewer.
 * Load AFTER main.js and search.js. Does nothing visible on desktop
 * (the bottom bar and part labels are hidden by style.css above 768px).
 */
$(function () {

    var MOBILE = window.matchMedia("(max-width: 767.98px)");

    // Tap an article box to open it straight away (desktop needs a double-click).
    // Set to false if you'd rather tap = highlight amendments only.
    var OPEN_ON_TAP = true;

    var order = [];   // article numbers in book order, from data/articles.json


    /* ---------------------------------------------------------
       1. Part names: the left sidebar is hidden on phones, so
          show each part's name as a heading above its articles.
       --------------------------------------------------------- */
    $("#parts_div .part").each(function () {

        var label = $(".part_names." + this.id).first().text().trim();

        if (label)
            $('<div class="mobile_part_label"></div>')
                .text(label)
                .prependTo(this);

    });


    /* ---------------------------------------------------------
       1b. Part chips: a sticky row of buttons, one per Part.
           Tapping scrolls to that Part's articles. The choice is
           saved in localStorage and restored on reload.
       --------------------------------------------------------- */
    var STORE_KEY = "coi.selectedPart";

    function readSaved() {
        try { return window.localStorage.getItem(STORE_KEY); } catch (e) { return null; }
    }

    function writeSaved(id) {
        try { window.localStorage.setItem(STORE_KEY, id); } catch (e) { /* private mode etc. */ }
    }

    var $chips = $('<div class="part-chips" id="partChips" role="group" aria-label="Jump to a Part"></div>');
    var chipIds = {};

    $("#parts_div .part").each(function () {

        var full = $(".part_names." + this.id).first().text().trim();

        if (!full)
            return;

        // "XXI. Temporary, Transitional ... (369-392)"  ->  numeral + name
        var m = full.match(/^([IVXLC]+A?)\.\s*(.*?)\s*(?:\([^)]*\))?\s*$/);
        var num = m ? m[1] : "";
        var name = m ? m[2] : full;

        $("<button type='button' class='part-chip'></button>")
            .attr({ "data-part": this.id, "aria-pressed": "false", "aria-label": "Part " + full, title: full })
            .append($("<b></b>").text(num))
            .appendTo($chips);

        chipIds[this.id] = true;

    });

    // Schedules aren't a numbered Part, but are worth a chip
    if ($("#schedules_label").length) {

        $("<button type='button' class='part-chip'></button>")
            .attr({ "data-part": "schedules", "aria-pressed": "false" })
            .append($("<span></span>").text("Schedules"))
            .appendTo($chips);

        chipIds.schedules = true;

    }

    // Lives outside #coi_panel so it survives when an article replaces the grid
    $chips.insertAfter($(".title-header").first());

    function partTarget(id) {
        return id === "schedules"
            ? document.getElementById("schedules_label")
            : $("#" + id + " .mobile_part_label")[0];
    }

    function markChip(id, animate) {

        var $all = $chips.find(".part-chip");

        $all.attr("aria-pressed", "false");

        var $c = $all.filter(function () { return $(this).data("part") === id; });

        if (!$c.length)
            return;

        $c.attr("aria-pressed", "true");

        // centre the chip inside the scrolling row (horizontal only)
        var row = $chips[0], el = $c[0];
        var left = el.offsetLeft - (row.clientWidth - el.offsetWidth) / 2;

        if (row.scrollTo)
            row.scrollTo({ left: left, behavior: animate ? "smooth" : "auto" });
        else
            row.scrollLeft = left;

    }

    function scrollToPart(id, animate) {

        var t = partTarget(id);

        if (!t)
            return;

        var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        t.scrollIntoView({ behavior: (animate && !reduce) ? "smooth" : "auto", block: "start" });

    }

    $chips.on("click", ".part-chip", function () {

        var id = $(this).data("part");

        markChip(id, true);
        writeSaved(id);

        // Reading an article? The grid isn't in the page, so go back to it;
        // the saved part is scrolled into view on load.
        if (!$("#parts_div").length) {
            window.location.href = window.location.origin + window.location.pathname;
            return;
        }

        scrollToPart(id, true);

    });

    // Restore on load
    var saved = readSaved();

    if (saved && chipIds[saved]) {

        markChip(saved, false);

        // only jump when showing the grid (no ?article= / ?schedule= / ?year= / ?amendment=)
        if (MOBILE.matches && !window.location.search) {

            scrollToPart(saved, false);

            $(window).one("load", function () {
                setTimeout(function () { scrollToPart(saved, false); }, 120);
            });

        }

    }


    /* ---------------------------------------------------------
       2. Tap to open
          main.js's own click handler runs first (it sets ?article=),
          then we trigger the existing #detail handler.
       --------------------------------------------------------- */
    $(document).on("click", ".article-list .box", function () {

        if (!OPEN_ON_TAP || !MOBILE.matches)
            return;

        setTimeout(function () {
            $("#detail").trigger("click");
        }, 0);

    });


    /* ---------------------------------------------------------
       3. Bottom bar: Index | Search | Prev | Next
       --------------------------------------------------------- */
    var icons = {
        grid:   '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>',
        search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>',
        prev:   '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
        next:   '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>'
    };

    var $bar = $(
        '<nav class="mobile-bar" aria-label="Quick actions">' +
            '<button type="button" class="mb-btn mb-home" aria-label="Back to all articles">' + icons.grid + '</button>' +
            '<button type="button" class="mb-search" aria-label="Search articles">' + icons.search + '<span>Search articles…</span></button>' +
            '<button type="button" class="mb-btn mb-prev" aria-label="Previous article" hidden>' + icons.prev + '</button>' +
            '<button type="button" class="mb-btn mb-next" aria-label="Next article" hidden>' + icons.next + '</button>' +
        '</nav>'
    ).appendTo("body");

    var $prev = $bar.find(".mb-prev");
    var $next = $bar.find(".mb-next");


    function param(name) {
        return new URLSearchParams(window.location.search).get(name);
    }

    function currentIndex() {

        var c = param("article");

        if (!c)
            return -1;

        c = c.toLowerCase();

        for (var i = 0; i < order.length; i++)
            if (order[i].toLowerCase() === c)
                return i;

        return -1;
    }

    function refreshBar() {

        var i = currentIndex();
        var reading = i > -1 || !!param("article") || !!param("schedule");

        $bar.toggleClass("reading", reading);

        $prev.prop("hidden", !(i > 0));
        $next.prop("hidden", !(i > -1 && i < order.length - 1));

    }

    function go(step) {

        var i = currentIndex();
        var target = order[i + step];

        if (i === -1 || target === undefined)
            return;

        history.pushState({}, "", "?article=" + encodeURIComponent(target));

        $("#detail").trigger("click");

    }


    $bar.on("click", ".mb-search", function () {
        if (window.openArticleSearch)
            window.openArticleSearch();
    });

    $bar.on("click", ".mb-home", function () {
        window.location.href = window.location.origin + window.location.pathname;
    });

    $prev.on("click", function () { go(-1); });
    $next.on("click", function () { go(1); });


    // Whenever an article/schedule is rendered, update the bar and jump to the top
    $(document).on("click", "#detail", function () {

        setTimeout(function () {

            refreshBar();

            if (MOBILE.matches)
                window.scrollTo(0, 0);

        }, 0);

    });

    $.getJSON("data/articles.json", function (data) {

        order = data.map(function (a) { return String(a.article); });

        refreshBar();

    });

    refreshBar();


    /* ---------------------------------------------------------
       4. Keep the search sheet above the on-screen keyboard
          (iOS Safari doesn't resize the layout viewport).
       --------------------------------------------------------- */
    if (window.visualViewport) {

        var vv = window.visualViewport;
        var root = document.documentElement;

        var syncViewport = function () {

            var kb = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);

            root.style.setProperty("--kb", kb + "px");
            root.style.setProperty("--vvh", vv.height + "px");

        };

        vv.addEventListener("resize", syncViewport);
        vv.addEventListener("scroll", syncViewport);

        syncViewport();

    }

});
