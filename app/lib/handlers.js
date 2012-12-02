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

    // if (req && req.url) {
    //   var pathname = url.parse(req.url).pathname.replace(/^\//, '');
    //   var pageMatch = /\/(\d+)$/.exec(pathname);
    //   if (pageMatch && pageMatch[1])
    //     ctx.page = pageMatch[1];
    //   else
    //     ctx.page = 1;
    // }

    // Select ids to display in the current page and add their contents
    if (Σ.index && Σ.index['n']) {
      var indexer = Indexer.createIndexer();
      var ids = indexer.publicIds();
      var startId = Σ.cfg.pageSize * (route.page - 1);
      var endId = Σ.cfg.pageSize * (route.page);
      ctx.ids = ids.slice(startId, endId);

      ctx.items = ctx.ids.map(function(id) {
        return Σ.index.id[id];
      });

      if (Σ.index.n.length < Σ.cfg.pageSize * (route.page + 1)) {
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

    // Get search filter if set
    // var tagFilter, timeFilter;
    // if (req && req.url) {
    //   var parsedUrl = url.parse(req.url);
    //   var pathname = parsedUrl.pathname.replace(/^\//, '');
    //   var idxSlash = pathname.indexOf('/');
    //   if (idxSlash >= 0 && pathname.length > idxSlash)
    //     var params = pathname.substring(idxSlash + 1);
    //   if (params) {
    //     var slashed = params.split('/');
    //     if (slashed) {
    //       if (slashed.length == 1) {
    //         ctx.filter = slashed[0];
    //         tagFilter = true;
    //       }
    //       else if (slashed.length == 2) {
    //         // Tags cannot be pure numbers, as they are interpreted as dates
    //         if (!slashed[0].match(/^\d+$/)) {
    //           ctx.filter = slashed[0];
    //           ctx.page = slashed[1];
    //           tagFilter = true;
    //         }
    //         else {
    //           ctx.filter = slashed[0] + '/' + slashed[1];
    //           timeFilter = true;
    //         }
    //       }
    //       else if (slashed.length == 3) {
    //         ctx.filter = slashed[0] + '/' + slashed[1];
    //         ctx.page = slashed[2];
    //         timeFilter = true;
    //       }
    //     }
    //   }
    // }

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
          if (ctx.items.length > 0)
            ctx.count = ctx.items.length;
        }
      }
    }

    return ctx;
  },

  rss: function(route) {
    var ctx = {
      language: null,
      lastBuildDate: null,
      ttl: null,
      atomLink: null,
      items: []
    };

    var MAX_COUNT = 12;

    var baseUrl = route.parsedUrl.protocol + '//' + route.parsedUrl.host;

    ctx.language = Σ.cfg.locale;
    ctx.ttl = 'TODO';
    ctx.atomLink = baseUrl + route.pathname;

    // Select ids to display in the RSS feed
    if (Σ.index && Σ.index['id'].length > 0 && Σ.index['n']) {
      var indexer = Indexer.createIndexer();
      var ids = indexer.publicIds();
      ctx.items = ids.slice(ids.length >= MAX_COUNT ? -MAX_COUNT : -ids.length).map(function(id) {
        var doc = Σ.index['id'][id];
        return {
          'title': doc['title'],
          'link': baseUrl + '/' + id,
          'pubDate': doc['modified'],
          'description': doc['abstract']
        };
      });

      // Latest modified document in the index is global last modified date
      // TODO format as RSS date: .toISOString()?
      ctx.lastBuildDate = Σ.index['id'][Σ.index['n'].slice(-1)]['modified'];
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
  if (slashed && slashed.length == 2) {
    // Try to guess which of the supported locales has been set in config.
    // We do not enforce a specific format for specifying the locale (eg. 'en_EN', 'it'...)
    var locale;
    [
      { lang: 'en', re: /en/i },
      { lang: 'it', re: /it/i }
    ].forEach(function(l) { if (l.re.exec(Σ.cfg.locale)) { locale = l.lang; } });
    name = (MONTHS[Σ.cfg.locale][slashed[1].replace(/^0/, '') - 1] || slashed[1]) + ' ' + slashed[0];
  }
  return { 'name': name, 'href': d };
}


// TODO i18n
var MONTHS = {
  it: [
    'Gennaio',
    'Febbraio',
    'Marzo',
    'Aprile',
    'Maggio',
    'Giugno',
    'Luglio',
    'Agosto',
    'Settembre',
    'Ottobre',
    'Novembre',
    'Dicembre'
  ],
  en: [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
  ]
};
