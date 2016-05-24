var App = App || {};

/*** KO Class ***/
function Patients() {
    var self = this;

    self.patients = ko.observableArray();

    App.data.forEach(function(patient){
        self.patients.push(patient);
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