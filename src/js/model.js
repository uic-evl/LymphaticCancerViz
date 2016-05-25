var App = App || {};

/*** KO Class ***/
function Patients() {
    var self = this;

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

        var patient = _.find(App.data, function(o) { return o.id == newValue.id; });

        // clear the array
        self.rankings.removeAll();

        patient.similarity.forEach(function(id){
            self.rankings.push(sites[id-1]);
        });

        createVisualizations(self.rankings());
    });
}

/*** IFE to load the data and apply the KO bindings ***/
(function(){

    d3.json("data/rankings.json", function(error, json) {
        if (error) return console.warn(error);

        App.data = json;
        ko.applyBindings(new Patients());

    });

})();