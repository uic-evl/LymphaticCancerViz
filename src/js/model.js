var App = App || {};

/*** KO Class ***/
function Patients() {
    let self = this;

    /* Determine how many nodes will fit onto the screen in a single row */
    self.maxNodes = window.innerWidth / (App.graphSVGWidth + 2 * App.padding);

    console.log(self.maxNodes);

    // rankings of the patients
    self.rankings = ko.observableArray();
    self.scores   = [];
    self.optionsCaption = ko.observable('Select a Patient');

    self.patients = ko.observableArray();
    App.data.forEach(function(patient){
        self.patients.push(patient);
    });

    self.currentPatient = ko.observable(self.patients[0]);

    // subscribe to the change of the selection
    self.currentPatient.subscribe(function(newValue)
    {
        self.optionsCaption(undefined);

        let patient = _.find(App.data, function(o) { return o.id == newValue.id; });

        // clear the array
        self.rankings.removeAll();
        self.scores = [];

        patient.similarity.forEach(function(id, i){
            let site = _.find(App.sites, {patient: id});
            self.rankings.push(site);
            self.scores.push(patient.scores[i]);
        });

        // Render to the screen
        App.createVisualizations(self.rankings());
    });
}

/*** IFE to load the data and apply the KO bindings ***/
(function(){

    d3.json("data/data.json", function(error, json) {
        if (error) return console.warn(error);

        App.data = json;
        App.sites = [];

      /* Iterate through the data and pull out each patient's information */
      App.data.forEach(function(patient){

        let site = {
          "patient"  : patient.id,
          "nodes"    : _.chain(patient.nodes).partition(function(p){ return p[0] === 'L';}).value(),
          "position" : patient.position,
          "gender"   : patient.gender
        };
        App.sites.push(site);
      });
        ko.applyBindings(new Patients());
    });

})();