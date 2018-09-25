"use strict";

var App = App || {};

(function(){

  App.dendrogram = new Dendrogram(["#1b9e77", "#d95f02", "#7570b3", "#e7298a", "#66a61e", "#e6ab02", "#a6761d"]);
  App.graphUtilities = new Utilities();

  function init() {
    queue()
      .defer(d3.json, "d3-dendrogram.json")
      .await(function(err, data){
        App.dendrogram.init(data);
      });
    App.dendrogram.setCut(5.4);
  }

  /* start the application once the DOM is ready */
  document.addEventListener('DOMContentLoaded', init);

})();