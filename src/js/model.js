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

  self.sortingAlgorithms = ko.observableArray(["Jaccard", "Tanimoto"]);

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
    if (newValue === "Jaccard") {
      App.data = App.jaccard;
    }
    else {
      App.data = App.tanimoto;
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
    .defer(d3.json, "data/jaccard.json")
    .defer(d3.json, "data/tanimoto.json")
    .await(function (error, jaccard, tanimoto) {
      if (error) return console.warn(error);

      App.jaccard = jaccard;
      App.tanimoto = tanimoto;

      App.sites = [];

      /* Iterate through the data and pull out each patient's information */
      App.jaccard.forEach(function (patient) {

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

      App.data = App.jaccard;

      ko.applyBindings(new Patients());
    });

})();