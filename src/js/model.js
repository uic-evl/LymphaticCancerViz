"use strict";

var App = App || {};

/*** KO Class ***/
function Patients() {
  let self = this;

  /* Determine how many nodes will fit onto the screen in a single row */
  self.maxNodes = parseInt(window.innerWidth / (App.graphSVGWidth + 2 * App.padding));

  // rankings of the patients
  self.rankings = ko.observableArray();
  self.optionsCaption = ko.observable('Select a Patient');

  self.patients = ko.observableArray();

  App.data.forEach(function (patient) {
    self.patients.push(patient);
  });

  self.sortingAlgorithms = ko.observableArray(["Tanimoto Edges", "Tanimoto Nodes", "Tanimoto Weighted"]);

  self.currentPatient = ko.observable(self.patients[0]);
  self.currentSorting = ko.observable(self.sortingAlgorithms[0]);

  // subscribe to the change of the selection
  self.currentPatient.subscribe(function (newValue) {
    self.optionsCaption(undefined);

    let patient = _.find(App.data, function (o) {
      return o.id == newValue.id;
    });

    // clear the array
    self.rankings.removeAll();

    patient.similarity.forEach(function (id, i) {

      /* I just want the first 50 */
      // if (i > 50) return;

      let site = _.find(App.sites, {patient: id});

      site.score = patient.scores[i].toFixed(5);
      // if(score )
      self.rankings.push(site);
    });

    // Render to the screen
    App.createVisualizations(self.rankings());
  });

  /*Subscribe the the change in similarity metric */
  self.currentSorting.subscribe(function (newValue) {
    if (newValue === "Tanimoto Edges") {
      App.data = App.edges;
    }
    else if (newValue === "Tanimoto Nodes") {
      App.data = App.nodes;
    }
    else {
      App.data = App.weighted;
    }

    /* Touch the current observable to re-render the scene */
    if(self.currentPatient()) {
      self.currentPatient(self.currentPatient());
    }

  });

}

/*** IFE to load the data and apply the KO bindings ***/
(function () {

  queue()
    .defer(d3.json, "data/tanimoto_edges.json")
    .defer(d3.json, "data/tanimoto_nodes.json")
    .defer(d3.json, "data/tanimoto_weighted.json")
    .await(function (error, edges, nodes, weighted) {
      if (error) return console.warn(error);

      App.edges = edges;
      App.nodes = nodes;
      App.weighted = weighted;

      App.sites = [];

      /* Iterate through the data and pull out each patient's information */
      App.edges.forEach(function (patient) {

        let site = {
          "patient": patient.id,
          "nodes": _.chain(patient.nodes).partition(function (p) {
            return p[0] === 'L';
          }).value(),
          "position": patient.position,
          "gender": patient.gender,
          "score": []
        };
        App.sites.push(site);
      });

      App.data = App.edges;

      ko.applyBindings(new Patients());
    });

})();