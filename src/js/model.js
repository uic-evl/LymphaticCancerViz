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
    if(patient.nodes.length > 1)
      self.patients.push(patient);
  });

  self.sortingAlgorithms = ko.observableArray(["Tanimoto Weighted", "Tanimoto Edges", "Tanimoto Nodes", "Jaccard"]);
  self.numberToDisplay = ko.observableArray([50, 100, 'All']);

  self.currentPatient = ko.observable(self.patients[0]);
  self.currentSorting = ko.observable(self.sortingAlgorithms[0]);
  self.currentDisplay = ko.observable(self.numberToDisplay[0]);

  // subscribe to the change of the selection
  self.currentPatient.subscribe(function (newValue) {
    self.optionsCaption(undefined);

    let patient = _.find(App.data, function (o) {
      return o.id === newValue.id;
    });

    // clear the array
    self.rankings.removeAll();

    patient.similarity.forEach(function (id, i) {

      /* I just want the first 50 */
      if ( parseInt(self.currentDisplay()) <= i) return;

      let site = _.find(App.sites, {patient: id});
      if(!site) return;
      site.score = patient.scores[i].toFixed(5);
      self.rankings.push(site);
    });

    /* Ensure the patient is first */
    let pat = _.find(self.rankings(), {patient: patient.id});
    let index =self.rankings().indexOf(pat);
    if(index > 0){
      self.rankings.remove(pat);
      self.rankings.unshift(pat);
    }

    self.rankings().sort(function(l,r){
      if(l.patient === patient.id) return true;
      if(l.score !== r.score){
        return r.score - l.score;
      }
      else{
        let a = (l.position === "Right") ? 2 : (l.position === "Left") ? 1 : 0;
        let b = (r.position === "Right") ? 2 : (r.position === "Left") ? 1 : 0;
        return b-a;
      }
    });

    /// / Render to the screen
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
    else if (newValue === "Jaccard") {
      App.data = App.jaccard;
    }
    else {
      App.data = App.weighted;
    }

    /* Touch the current observable to re-render the scene */
    if(self.currentPatient()) {
      self.currentPatient(self.currentPatient());
    }

  });

  self.currentDisplay.subscribe(function (newValue) {

    if(newValue === "All"){
      self.currentDisplay(App.sites.length);
    }
    else {
      self.currentDisplay(newValue);
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
    .defer(d3.json, "data/json/tanimoto_edges.json")
    .defer(d3.json, "data/json/tanimoto_nodes.json")
    .defer(d3.json, "data/json/tanimoto_weighted.json")
    .defer(d3.json, "data/json/jaccard.json")
    .await(function (error, edges, nodes, weighted, jaccard) {
      if (error) return console.warn(error);

      App.edges = edges;
      App.nodes = nodes;
      App.weighted = weighted;
      App.jaccard = jaccard;

      App.sites = [];

      /* Iterate through the data and pull out each patient's information */
      App.edges.forEach(function (patient) {

        if(patient.nodes.length <= 1)
          return;

        let site = {
          "patient": patient.id,
          "nodes": _.chain(patient.nodes).partition(function (p) {
            return p[0] === 'L';
          }).value(),
          "position": patient.position,
          "gender": patient.gender,
          "score": [],
          "feedingTube_post": patient["Feeding_tube_6m"] ? patient["Feeding_tube_6m"] : "NA",
          "feedingTube_pre": !!patient["Tube_removal"]? "N": patient["Feeding_tube_6m"],
          "aspiration_pre" : patient["Aspiration_rate_Pre-therapy"] ? patient["Aspiration_rate_Pre-therapy"] : "NA" ,
          "aspiration_post" : patient["Aspiration_rate_Post-therapy"] ? patient["Aspiration_rate_Post-therapy"] : "NA"
        };

        App.sites.push(site);

      });

      App.data = App.weighted;

      ko.applyBindings(new Patients());
    });

})();