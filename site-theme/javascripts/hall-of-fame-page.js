/*
 * The Hall of Fame page of the site: fills the places of the boards
 * (.gr-hof-board[data-board]) with the boards of Guinea Run, read from the
 * game's database in the reader's browser, with the game's own code
 * (guinea-run/core/online.js). Any other page: nothing happens.
 *
 * The words come from the page itself (#gr-hof-words, written by
 * scripts/lib/pages.mjs in the page's language). The theme swaps pages
 * without reloading, so it runs on every page change.
 */
(function () {
  var current = document.currentScript;
  var BASE = current && current.src ? current.src.replace(/[^/]*$/, "") : "";
  var PICTURE = BASE + "../images/guinea-pig-small.webp";
  var modules = null;

  function setUp() {
    var places = document.querySelectorAll(".gr-hof-board[data-board]");
    var source = document.getElementById("gr-hof-words");
    if (!places.length || !source) {
      return;
    }
    var words;
    try {
      words = JSON.parse(source.textContent);
    } catch (error) {
      return;
    }
    if (!modules) {
      modules = Promise.all([import(BASE + "guinea-run/core/online.js"), import(BASE + "guinea-run/core/online-config.js")]);
    }
    modules.then(
      function (loaded) {
        var online = loaded[0];
        var config = loaded[1];
        var net = online.createNet({ url: config.ONLINE_URL, key: config.ONLINE_KEY });
        Array.prototype.forEach.call(places, function (place) {
          var board = place.getAttribute("data-board");
          net.readBoard(board, words.top).then(function (list) {
            fill(place, board, list, words, online);
          });
        });
      },
      function () {
        Array.prototype.forEach.call(places, function (place) {
          message(place, words.offline);
        });
      }
    );
  }

  function fill(place, board, list, words, online) {
    if (!list) {
      message(place, words.offline);
      return;
    }
    if (!list.length) {
      message(place, board === "all" ? words.empty : board === "pinball" ? words.pinballEmpty : board === "orgman" ? words.orgmanEmpty : words.worldEmpty);
      return;
    }
    var number = new Intl.NumberFormat(words.lang);
    var seconds = new Intl.NumberFormat(words.lang, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    var minutes = function (ms) {
      return String(Math.max(1, Math.round(ms / 60000)));
    };
    var columns;
    var cells;
    if (board === "all") {
      columns = words.generalColumns;
      cells = function (p) {
        return [number.format(p.total), String(p.stars)];
      };
    } else if (board === "pinball") {
      columns = words.pinballColumns;
      cells = function (p) {
        return [number.format(p.score), String(p.level), String(p.missions), minutes(p.ms)];
      };
    } else if (board === "orgman") {
      columns = words.orgmanColumns;
      cells = function (p) {
        return [number.format(p.score), String(p.level), String(p.admins), minutes(p.ms)];
      };
    } else {
      columns = words.worldColumns;
      cells = function (p) {
        var boss = typeof p.bossMs === "number" ? words.seconds.replace("{value}", seconds.format(p.bossMs / 1000)) : "-";
        return [number.format(p.score), words.modes[p.mode] || p.mode, String(p.stars), boss];
      };
    }
    // Numbers line up on the right, the rank, the player and the mode on the left
    var left = board === "all" || board === "pinball" || board === "orgman" ? [0, 1] : [0, 1, 3];
    var table = document.createElement("table");
    var head = table.createTHead().insertRow();
    columns.forEach(function (title, i) {
      var th = document.createElement("th");
      th.textContent = title;
      if (left.indexOf(i) < 0) {
        th.style.textAlign = "right";
      }
      head.appendChild(th);
    });
    var body = table.createTBody();
    list.forEach(function (p, i) {
      var row = body.insertRow();
      row.insertCell().textContent = String(i + 1);
      var who = row.insertCell();
      var pic = document.createElement("span");
      pic.className = "gr-hof-coat";
      pic.style.backgroundImage = "url('" + PICTURE + "')";
      pic.style.filter = online.COAT_FILTERS[p.coat] || "none";
      pic.title = words.coats[p.coat] || "";
      who.appendChild(pic);
      // The nickname as text, never as HTML: players type it
      who.appendChild(document.createTextNode(p.name));
      cells(p).forEach(function (text, j) {
        var cell = row.insertCell();
        cell.textContent = text;
        if (left.indexOf(j + 2) < 0) {
          cell.style.textAlign = "right";
        }
      });
    });
    var wrap = document.createElement("div");
    wrap.className = "md-typeset__table";
    wrap.appendChild(table);
    place.replaceChildren(wrap);
  }

  function message(place, text) {
    var p = document.createElement("p");
    p.textContent = text;
    place.replaceChildren(p);
  }

  if (typeof document$ !== "undefined" && document$.subscribe) {
    document$.subscribe(setUp);
  } else {
    document.addEventListener("DOMContentLoaded", setUp);
  }
})();
