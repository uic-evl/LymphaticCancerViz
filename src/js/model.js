var App = App || {};

/*** KO Class ***/
function Patients() {
    let self = this;

    // rankings of the patients
    self.rankings = ko.observableArray();
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

        patient.similarity.forEach(function(id){
            self.rankings.push(App.sites[id-1]);
        });
        // Render to the screen
        createVisualizations(self.rankings());
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

        // Check to see if the code lymph node 5 is infected
        let lymphNode5 = patient.nodes.indexOf("5");
        /* If so, we want to split 5 into 5A and 5B */
        if(lymphNode5 > -1){
          patient.nodes[lymphNode5] = "5A";
          patient.nodes.push("5B");
        }

        let site = {
          "patient"  : patient.id,
          "nodes"    : patient.nodes,
          "position" : patient.position
        };
        App.sites.push(site);
      });

        ko.applyBindings(new Patients());

    });

})();