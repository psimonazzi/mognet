var url = require('url');

var Σ = require('../lib/state');
var Indexer = require('../lib/indexer');

module.exports = {
  menu: function(route) {
    var ctx = {
      tags: [],
      tagsOverflow: false,
      dates: [],
      datesOverflow: false
    };

    var MAX_COUNT = 20;
    if (Σ.index) {
      var tags = Object.keys(Σ.index.tag).sort();
      if (tags.length > MAX_COUNT) {
        tags = tags.slice(0, MAX_COUNT);
        ctx.tagsOverflow = true;
      }
      ctx.tags = tags.map(mapTagNames);

      var dates = Object.keys(Σ.index.time).sort();
      if (dates.length > MAX_COUNT) {
        dates = dates.slice(0, MAX_COUNT);
        ctx.datesOverflow = true;
      }
      ctx.dates = dates.map(mapDateNames);
    }
    return ctx;
  },

  index: function(route) {
    var ctx = {
      index: true,
      nextPage: 2,
      prevPage: null,
      ids: [],
      items: []
    };

    // Select ids to display in the current page and add their contents
    if (Σ.index && Σ.index['n']) {
      var indexer = Indexer.createIndexer();
      var ids = indexer.publicIds();
      var startId = Σ.cfg.pageSize * (route.page - 1);
      var endId = Σ.cfg.pageSize * (route.page);
      ctx.ids = ids.reverse().slice(startId, endId);

      ctx.items = ctx.ids.map(function(id) {
        return Σ.index.id[id];
      });

      if (Σ.index.n.length <= Σ.cfg.pageSize * route.page) {
        ctx.nextPage = null;
        ctx.nextTitle = '/';
      }
      else {
        ctx.nextPage = 'index/' + (route.page + 1);
      }

      if (route.page - 1 <= 0) {
        ctx.prevPage = null;
        ctx.prevTitle = '/';
      }
      else {
        ctx.prevPage = 'index/' + (route.page - 1);
      }
    }

    return ctx;
  },

  search: function(route) {
    var ctx = {
      search: true,
      doc: true,
      count: 0,
      tags: [],
      dates: [],
      items: []
    };

    if (!route.filter) {
      // Search options / archive
      ctx.tags = Object.keys(Σ.index.tag).sort().map(mapTagNames);
      ctx.dates = Object.keys(Σ.index.time).sort().map(mapDateNames);
    }
    else {
      try {
        route.filter = decodeURIComponent(route.filter);
      } catch (ex) { }

      // Search results
      if (route.filterType && Σ.index && Σ.index[route.filterType]) {
        // Select ids to display in the current page
        var ids = Σ.index[route.filterType][route.filter];
        // TODO Add paging in search results
        if (ids) {
          var indexer = Indexer.createIndexer();
          ids.forEach(function(id) {
            var doc = Σ.index.id[id];
            if (doc && indexer.isPublicId(id))
              ctx.items.push(doc);
          });
          if (ctx.items.length > 0) {
            ctx.count = ctx.items.length;
            //TODO are they ordered?
            ctx.items.reverse();
          }
        }
      }
    }

    return ctx;
  },

  rss: function(route) {
    var ctx = {
      lastBuildDate: null,
      atomLink: null,
      link: null,
      generator: null,
      items: []
    };

    var MAX_COUNT = 12;

    ctx.atomLink = Σ.cfg.baseUrl + '/' + route.key;
    ctx.link = Σ.cfg.baseUrl + '/';
    ctx.generator = 'Mognet (' + Σ.cfg.version + ')';

    // Select ids to display in the RSS feed
    if (Σ.index && Σ.index['n']) {
      var indexer = Indexer.createIndexer();
      var ids = indexer.publicIds();
      if (ids) {
        ids = ids.slice(ids.length >= MAX_COUNT ? -MAX_COUNT : -ids.length);
        ctx.items = ids.map(function(id) {
          var doc = Σ.index.id[id];
          return {
            title: doc.title.replace(/<.+?>/g, '').trim(), // TODO reuse titleSafe
            description: doc.content,
            link: Σ.cfg.baseUrl + '/' + id,
            guid: Σ.cfg.baseUrl + '/' + id,
            pubDate: toRFC2822(doc.timestamp)
          };
        }).reverse();
      }
    }

    return ctx;
  }

};


function mapTagNames(t) {
  return { 'name': t, 'href': encodeURIComponent(t) };
}

function mapDateNames(d) {
  var name = d;
  var slashed = d.split('/');
  if (slashed && slashed.length == 2)
    name = slashed[1] + '/' + slashed[0];
  return { 'name': name, 'href': d };
}


function toRFC2822(oDate) {
  var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  function padWithZero(val) {
    if (val < 10)
      return '0' + val;
    return val;
  }

  function getTZOString(timezoneOffset) {
    var hours = Math.floor(timezoneOffset / 60);
    var modMin = Math.abs(timezoneOffset % 60);
    var s = (hours > 0) ? "-" : "+";
    var absHours = Math.abs(hours);
    s += (absHours < 10) ? "0" + absHours : absHours;
    s += (modMin == 0) ? "00" : modMin;
    return s;
  }

  var dtm;
  dtm = days[oDate.getDay()] + ", ";
  dtm += padWithZero(oDate.getDate()) + " ";
  dtm += months[oDate.getMonth()] + " ";
  dtm += oDate.getFullYear() + " ";
  dtm += padWithZero(oDate.getHours()) + ":";
  dtm += padWithZero(oDate.getMinutes()) + ":";
  dtm += padWithZero(oDate.getSeconds()) + " " ;
  dtm += getTZOString(oDate.getTimezoneOffset());
  return dtm;
}
