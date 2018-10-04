"use strict";

var App = App || {};

(function(){

  App.dendrogram = new Dendrogram(["#1b9e77", "#d95f02", "#7570b3", "#e7298a", "#66a61e", "#e6ab02", "#a6761d"]);
  App.GraphFactory = new PatientGraph();
  App.graphUtilities = new Utilities();

  function init() {
    queue()
      .defer(d3.json, "non-spatial_hierarchy.json")
      .defer(d3.json, "../data/1.3.1/json/tanimoto_weighted_UPPER.json")
      .await(function(err, dendrogram, patients){

        App.graphUtilities.parsePatientData(patients);

        let queryID = App.graphUtilities.getQueryVariable("id");

        App.GraphFactory.init({width:250, height:250, radius: 15})
          .then(O_o => {

            App.GraphFactory.newGraph("#templates");

            App.dendrogram.init(dendrogram, {width:250, height:250, radius: 15, id:queryID});

            App.dendrogram.update();

          });
      });

    App.dendrogram.setCut(5.4);
  }

  /* start the application once the DOM is ready */
  document.addEventListener('DOMContentLoaded', init);

})();