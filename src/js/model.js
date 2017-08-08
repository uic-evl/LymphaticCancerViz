"use strict";

var App = App || {};

/*** KO Class ***/
function Patients() {
  let self = this;

  let dropdown = document.getElementById("clusterLabel");

  function setupObservables(){
    /* Determine how many nodes will fit onto the screen in a single row */
    self.maxNodes = parseInt(window.innerWidth / (App.graphSVGWidth + 2 * App.padding));

    // rankings of the patients
    self.rankings = ko.observableArray();
    self.optionsCaption = ko.observable('Select a Patient');
    self.clusterCaption = ko.observable('Select a Cluster');

    self.patients = ko.observableArray();
    App.data.forEach(function (patient) {
      if(patient.nodes.length > 1)
        self.patients.push(patient);
    });

    let cluster_groups = [];
    _.keys(App.sites[0].clusters).forEach(function(name){
      let cluster_names = [];
      _.range(1, parseInt(name[name.length-1])+1).forEach(function(c){
        cluster_names.push({name: "Cluster " + c, cluster: name});
      });
      cluster_groups.push({name:name, count:cluster_names, group: name.split("_")[0]})
    });
    self.cluster_groups = _.partition(cluster_groups, function(o) { return (o.name.split('_')[0] === "weighted") } );

    // clusters
    self.clusters = ko.observableArray(_.clone(self.cluster_groups[0]));

    self.sortingAlgorithms = ko.observableArray(["Tanimoto Weighted", "Tanimoto Nodes",
      // "Tanimoto Edges",  "Jaccard"
    ]);

    self.selections = ko.observableArray(["By Patient", "By Cluster"]);

    self.numberToDisplay = ko.observableArray([50, 100, 'All']);
    self.currentPatient = ko.observable(self.patients[0]);
    self.currentSorting = ko.observable(self.sortingAlgorithms[0]);
    self.currentDisplay = ko.observable(self.numberToDisplay[0]);
    self.currentCluster = ko.observable();
    self.currentType = ko.observable(self.selections[0]);
  }

  function filterPatients(patient) {
    // filter the patients based on similarity
    patient.similarity.forEach(function (id, i) {

      /* I just want the first 50, etc */
      if (self.rankings().length >= parseInt(self.currentDisplay())) return;

      let site = _.find(App.sites, {patient: id});
      if(!site) return;

      /* Filter by cluster grouping */
      if(self.currentCluster()){
        let cluster = parseInt(site.clusters[self.currentCluster().name]);
        if(self.currentCluster().value !== cluster) return;
      }

      site.score = patient.scores[i].toFixed(5);
      self.rankings.push(site);
    });
  }

  function placeSelectedPatientFirst(patient) {
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
  }

  function changeCurrentPatient(newValue) {
    self.optionsCaption(undefined);

    let patient = _.find(App.data, function (o) {
      return o.id === newValue.id;
    });

    // clear the array
    self.rankings.removeAll();

    filterPatients(patient);
    placeSelectedPatientFirst(patient);

    /// / Render to the screen
    App.createVisualizations(self.rankings());
  }

  function changeCurrentSorting(newValue) {
    if (newValue === "Tanimoto Edges") {
      App.data = App.edges;
    }
    else if (newValue === "Tanimoto Nodes") {
      App.data = App.nodes;
      if(self.cluster_groups){
        self.clusters.removeAll();
        self.cluster_groups[1].forEach(function(c){
          self.clusters.push(c);
        });

      }
    }
    else if (newValue === "Jaccard") {
      App.data = App.jaccard;
    }
    else {
      App.data = App.weighted;
      if(self.cluster_groups){
        self.clusters.removeAll();
        self.cluster_groups[0].forEach(function(c){
          self.clusters.push(c);
        });
      }
    }

    /* Reset the cluster drop down*/
    self.currentCluster(undefined);
    dropdown.firstChild.textContent = "ChiSquared Cluster";

    /* Touch the current observable to re-render the scene */
    if(self.currentPatient()) {
      self.currentPatient(self.currentPatient());
    }
  }

  function changeNumberOfPatients(newValue) {

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

  }

  function changeFilteringMode(newValue) {

    if(newValue === "By Patient"){

      self.currentPatient(self.patients[0]);
      self.currentSorting (self.sortingAlgorithms[0]);
      self.currentDisplay(self.numberToDisplay[0]);
      self.currentCluster(undefined);

    }
    else if(newValue === "By Cluster"){
      self.clusters.removeAll();
      _.flatten(_.clone(self.cluster_groups)).forEach(function(c){
        self.clusters.push(c);
      });
    }
  }

  function setupMenu() {
    /*Subscribe the the change in clustering menu */
    let menu = document.getElementById("clusterMenu");


    menu.addEventListener("click", function(e){
      if (e.target.className === 'cluster') {

        let value = e.target.value || e.target.firstChild.value;

        dropdown.firstChild.textContent = value + ": " + e.target.textContent + ' ';
        // set the cluster selector to the value
        let cluster = {name: value, value: parseInt(e.target.textContent.split(" ")[1])};
        self.currentCluster(cluster);

        /* Touch the current observable to re-render the scene */
        if(self.currentPatient()) {
          self.currentPatient(self.currentPatient());
        }
      }
    });

  }

  // initialize the observables
  setupObservables();
  // initialize the menu
  setupMenu();

  // subscribe to the change of the selection
  self.currentPatient.subscribe(changeCurrentPatient);

  /*Subscribe the the change in similarity metric */
  self.currentSorting.subscribe(changeCurrentSorting);

  // subscribe to the change of the how many patients to display
  self.currentDisplay.subscribe(changeNumberOfPatients);

  self.currentType.subscribe(changeFilteringMode);

}

/*** IFE to load the data and apply the KO bindings ***/
(function () {

  queue()
    .defer(d3.json, "data/json/tanimoto_nodes.json")
    .defer(d3.json, "data/json/tanimoto_weighted.json")
    .defer(d3.csv, "data/csv/cluster_results_simple_0803.csv")
    // .defer(d3.json, "data/json/tanimoto_edges.json")
    // .defer(d3.json, "data/json/jaccard.json")
      .await(function (error,  nodes, weighted, clusters//, edges, jaccard
      ) {
      if (error) return console.warn(error);

      // App.edges = edges;
      App.nodes = nodes;
      App.weighted = weighted;
      // App.jaccard = jaccard;

      App.sites = [];

      /* Iterate through the data and pull out each patient's information */
      App.nodes.forEach(function (patient) {

        if(patient.nodes.length <= 1)
          return;

        // extract the clusters based on the patient's id
        let patient_clusters = _.find(clusters, function(o){ return parseInt(o.pid) === patient.id });

        let site = {
          "patient": patient.id,
          "nodes": _.chain(patient.nodes).partition(function (p) {
            return p[0] === 'L';
          }).value(),
          "position": patient.position,
          "gender": patient.gender,
          "score": [],
          "feedingTube_post": patient["Feeding_tube_6m"] ? patient["Feeding_tube_6m"] : "NA",
          "feedingTube_pre": !!patient["Tube_removal"] ? "N": patient["Feeding_tube_6m"],
          "aspiration_pre" : patient["Aspiration_rate_Pre-therapy"] ? patient["Aspiration_rate_Pre-therapy"] : "NA" ,
          "aspiration_post" : patient["Aspiration_rate_Post-therapy"] ? patient["Aspiration_rate_Post-therapy"] : "NA",
          clusters: _.omit(patient_clusters, ["pid", ""])
        };

        App.sites.push(site);

      });

      App.data = App.weighted;

      ko.applyBindings(new Patients());
    });

})();