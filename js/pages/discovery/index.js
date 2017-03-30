var router = require('../../router.js');
var config = require('../../config.js');
var loading = require('../../loading.js');
var request = require('../../request.js');
var template = require('art-template-native');
var gui = require('./gui.js');

import { Viewer } from '../../viewer.js';
import { Pen } from '../../pen.js';


var N_VIEWER = 2;

var work_id_to_filename = {};

var viewers = [];

var works_dom = [];

function work_on_click() {
  router.active({
    page: 'editor',
    filename: work_id_to_filename[this.work_id]
  });
}

function update_viewer(n_page) {
  loading.show();
  return request_popular_works(n_page).then(function(works) {
    loading.hide();
    var html = '';

    for (var i = 0;i < works.length && i < N_VIEWER; ++i) {
      var data = works[i];
      viewers[i].work_id = data.id;
      work_id_to_filename[data.id] = data.cdn_filename;
      $(works_dom[i]).find('.work-name').text(data.name);
      viewers[i].load_from_url(config.cdn_works_path + data.cdn_filename);
    }

    gui.set_n_page(opts.n_page);
    return new Promise();
  });
}

function init() {
  var html = '';
  var i;
  for (i = 0; i < N_VIEWER; ++i) {
    html += template('template-discovery-work', {});
  }
  $('.works-wrap').html(html);
  for (i = 0; i < N_VIEWER; ++i) {
    var v = new Viewer({
      dom: $('.work-item .viewer-wrap')[i],
      container: $('.work-item .viewer-container')[i],
      pen: new Pen(),
      controls_on_click: work_on_click,
    });
    v.auxiliary.show();
    viewers.push(v);
    works_dom.push($('.work-item')[i]);
  }
  gui.init(update_viewer);
}

function pause() {
  for (var i = 0; i < N_VIEWER; ++i) {
    viewers[i].pause();
  }
  gui.pause();
}

function active(opts) {
  for (var i = 0; i < N_VIEWER; ++i) {
    viewers[i].active();
  }

  update_viewer(opts.n_page);
  gui.active();
}

function dispose() {
  var page_name = 'discovery';
  $('.page[data-page=' + page_name + ']').html('');
}

function request_popular_works(n_page) {
  return request.post(config.get_popular_works_url, {
    type: 'popular',
    skip: (n_page - 1) * N_VIEWER,
    limit: N_VIEWER,
  }).then(function(result) {
    if (result.code !== 0) {
      console.error(result);
      return [];
    }
    return result.data;
  });
}

module.exports = {
  init: init,
  pause: pause,
  active: active,
  dispose: dispose,
};
