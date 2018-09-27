"use strict";

var App = App || {};
/* Utility functions */
App.utils = App.Utilities();

function patient_sort(key, left, right) {
    return parseInt(left[key]) === parseInt(right[key]) ? 0 :
        (parseInt(left[key]) < parseInt(right[key]) ? -1 : 1);
}

/*** KO Class ***/
function Patients() {
    let self = this,
        dropdown = document.getElementById("clusterLabel"),
        dendroDrop = document.getElementById("dendroLabel"),

        SEdropdown = document.getElementById("SELabel"),
        sideEffectMap = {"Feeding Tube":"feedingTube_post", "Aspiration":"aspiration_post", "Neck Boost":"neck_boost"};
        App.self = self;

    App.changePatient = function(patient) {
        /* Get the selected patient */
        let selected_patient = _.find(self.patients(), {id:patient.patient});
        /* Change the current patient to the selected one */
        self.currentPatient(selected_patient);
    };

    function setupClusterObservables() {
        self.clusters = ko.observableArray();
        self.dendrogram = ko.observableArray();
        self.currentCluster = ko.observable();
        self.currentGroup = ko.observable();

        let cluster_groups = [];
        _.keys(App.sites[0].clusters).forEach(function(name){
            let cluster_names = [];
            _.range(1, parseInt(name.replace(/[^0-9]/g, ''))+1).forEach(function(c){
                cluster_names.push({cluster: c, name: name});
            });
            cluster_groups.push({name:name, count:cluster_names, group: name.split("_")[0]})
        });


        let dendrogram_groups = [];
        _.keys(App.sites[0].dendrogram).forEach(function(name){
            let dendro_names = [],
            m = _.maxBy(App.sites, function(o) {
                return o.dendrogram[name];
            }).dendrogram[name];
            _.range(1, m+1).forEach(function(c){
                dendro_names.push({dendrogram: c, name: name});
            });
            dendrogram_groups.push({name:name, count:dendro_names, group: name.split("_")[0]})
        });
        self.cluster_groups = [cluster_groups];
        self.dendrogram_groups = [dendrogram_groups];
        self.sortingAlgorithms = ko.observableArray(["Tanimoto Weighted"]);//, "Jaccard", "Tanimoto Nodes"]);
    }

    function setupPredictionObservables() {
        self.predictions = ko.observableArray();
        self.currentPrediction = ko.observable();
        self.currentPredictionVariable = ko.observable();

        let prediction_groups = [];
        for(let i = 0; i < 20; i++){
            prediction_groups.push(parseFloat(i)/20);
        }

        self.prediction_groups = [];
        prediction_groups.forEach(function(p,i){
            if(i === 0) return;
            let group = "" + (prediction_groups[i-1]) + " <= p < " + p;
            self.prediction_groups.push(group);
        });

        let enjoyment_groups = [];
        for(let i = 0; i < 10; i++){
            enjoyment_groups.push(parseFloat(i));
        }
        self.enjoyment_groups = [];
        enjoyment_groups.forEach(function(p,i){
            if(i === 0) return;
            let group = "" + (enjoyment_groups[i-1]) + " <= p < " + p;
            self.enjoyment_groups.push(group);
        });
    }

    function setupPatients() {
        self.patients.removeAll();
        App.data.forEach(function (patient) {
            self.patients.push(_.clone(patient));
        });
    }

    function setupObservables() {
        /* Determine how many nodes will fit onto the screen in a single row */
        self.maxNodes = parseInt(window.innerWidth / (App.graphSVGWidth + 2 * App.padding));

        /* Setup the drop down data */
        setupClusterObservables();
        // setupPredictionObservables();

        // rankings of the patients
        self.rankings = ko.observableArray();
        self.patients = ko.observableArray();

        setupPatients();

        /* Menu captions */
        self.optionsCaption = ko.observable('Select a Patient');
        self.clusterCaption = ko.observable('Select a Cluster');
        self.sideEffectCaption = ko.observable('Select a Side-Effect');
        // self.predictionCaption = ko.observable('Select a Variable');
        // self.predictionProbCaption = ko.observable('Select a Probability');

        /* Menu drop-downs */
        // self.predictionVariable = ko.observableArray(["Feeding Tube","Aspirating","Enjoyment"]);
        self.selections = ko.observableArray(["By Patient","By Cluster"]);//, "By Prediction"]);
        self.sideEffect = ko.observableArray(['Feeding Tube', 'Aspiration', "Neck Boost"]);
        self.numberToDisplay = ko.observableArray([50, 100, 'All']);

        /* Current menu selections */
        self.currentPatient    = ko.observable(undefined);
        self.currentSorting    = ko.observable(self.sortingAlgorithms[0]);
        self.currentDisplay    = ko.observable(self.numberToDisplay[0]);
        self.currentSideEffect = ko.observable(self.sideEffect[0]);
        self.currentType       = ko.observable(self.selections[0]);
    }

    function filterPatients(patient) {
        // filter the patients based on similarity
        patient.similarity.forEach(function (id, i) {
            let p  = _.find(self.patients(), {id: id});
            if(!p) return;

            let site = _.find(App.sites, {patient: id});

            /* I just want the first 50, etc */
            if (self.rankings().length >= parseInt(self.currentDisplay()) || !site) return;

            /* Filter by cluster grouping */
            if(self.currentCluster()){
                let cluster = parseInt(site.clusters[self.currentCluster().name]);
                if(self.currentCluster().value !== cluster) return;
            }

            if(self.sideEffect_class) {
                if(site[sideEffectMap[self.sideEffect_class]] !== self.sideEffect_value) return;
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
        if(!newValue) return;

        /* Clear the default caption if it exists */
        self.optionsCaption(undefined);

        if(self.currentType() === "By Patient"){
            //dropdown.firstChild.textContent = "ChiSquared Cluster";
            self.currentCluster(undefined);

            let site = _.find(App.sites, {patient: newValue.id}),
                patient_clusters = [], patient_dendrogram = [];

            self.clusters().forEach(function(c){
                patient_clusters.push(c.name + "_" + site.clusters[c.name]);
            });
            self.dendrogram().forEach(function(c){
                patient_dendrogram.push(c.name + "_" + site.dendrogram[c.name]);
            });

            newValue.clusters = patient_clusters;
            newValue.dendrogram = patient_dendrogram;
        }
        // clear the array
        self.rankings.removeAll();

        let current = _.find(App.data, {id: newValue.id});

        filterPatients(current);
        placeSelectedPatientFirst(current);

        /* Set the menu/body margin */
        let h = $("#menuBody")[0].clientHeight;
        d3.select("#mainContainer").style("margin-top", h+(h/10));

        // Render to the screen
        App.createVisualizations(self.rankings());
    }

    function changeCurrentSorting(newValue) {
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
            if(self.cluster_groups){
                self.clusters.removeAll();
                self.cluster_groups[0].forEach(function(c){
                    self.clusters.push(c);
                });

                self.dendrogram.removeAll();
                self.dendrogram_groups[0].forEach(function(c){
                    self.dendrogram.push(c);
                });
            }
        }

        /* Reset the cluster drop down*/
        self.currentCluster(undefined);
        // dropdown.firstChild.textContent = "ChiSquared Cluster";

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

    function changeProbabilityRange(newValue){
        /* no value provided */
        if(!newValue)return;

        /* Clear the default caption if it exists */
        // self.predictionProbCaption(undefined);
        // clear the patient list
        self.rankings.removeAll();
        self.patients.removeAll();

        let split = newValue.split(" <= p < "),
            min = parseFloat(split[0]), max = parseFloat(split[1]),
            idx = self.prediction_groups.indexOf(newValue),
            variable = _.chain(self.currentPredictionVariable()).toLower().replace(" ", "_").value();

        // add to the list only the patients in the current cluster
        _.filter(App.sites,
            function(s) {
                return s.predictions[variable] >= min && s.predictions[variable] < max;
            }).forEach(function(p){
            // find the patient in the data and add it to the list
            let patient = _.find(App.data, function (o) {
                return o.id === p.patient;
            });
            self.patients.push(_.clone(patient));
        });
        //self.patients(self.patients().sort(patient_sort));

        self.currentPatient(self.patients()[0]);
    }

    function changeProbabilityVariable(newValue){
        /* no value provided */
        if(!newValue)return;

        /* Clear the default caption if it exists */
        self.predictionCaption(undefined);
        self.predictionProbCaption("Select a Probability");

        self.currentPredictionVariable(newValue);
        self.currentPrediction(undefined);
        self.predictions.removeAll();
        self.rankings.removeAll();
        self.patients.removeAll();

        let variable = _.chain(newValue).toLower().replace(" ", "_").value(),
            groupings = (variable === 'enjoyment') ? self.enjoyment_groups : self.prediction_groups;

        groupings.forEach(function(p){
            let split = p.split(" <= p < "),
                min = parseFloat(split[0]), max = parseFloat(split[1]);

            let r = _.find(App.sites, function(s){
                return s.predictions[variable] >= min && s.predictions[variable] < max;
            });
            /* If any of the elements falls into this bin */
            if(r){
                self.predictions.push(p);
            }
        });

    }

    function changeFilteringMode(newValue) {

        if(newValue === "By Patient"){
            self.optionsCaption('Select a Patient');
            SEdropdown.firstChild.textContent = "Side-Effect";

            // clear the patient list
            self.rankings.removeAll();

            // self.currentPredictionVariable(undefined);
            // self.currentPrediction(undefined);
            self.currentPatient(undefined);
            self.sideEffectCaption(undefined);
            self.sideEffect_class = null;

            self.currentSorting(self.sortingAlgorithms[0]);

            setupPatients();
        }
        else if(newValue === "By Cluster"){
            self.optionsCaption('Select a Patient');
            SEdropdown.firstChild.textContent = "Side-Effect";

            self.currentCluster(undefined);
            self.currentPatient(undefined);
            self.sideEffectCaption(undefined);
            self.sideEffect_class = null;

            // self.currentPrediction(undefined);
            // self.currentPredictionVariable(undefined);

            self.rankings.removeAll();
            self.clusters.removeAll();
            self.dendrogram.removeAll();

            _.flatten(_.clone(self.cluster_groups)).forEach(function(c){ self.clusters.push(c); });
            _.flatten(_.clone(self.dendrogram_groups)).forEach(function(c){
                self.dendrogram.push(c);
            });

            console.log();
        }

        else if(newValue === "By Prediction"){
            self.predictionCaption("Select a Variable");
            self.predictionProbCaption("Select a Probability");
            SEdropdown.firstChild.textContent = "Side-Effect";

            App.data = App.weighted;

            self.currentCluster(undefined);
            self.currentPatient(undefined);
            self.sideEffectCaption(undefined);

            self.currentPrediction(undefined);
            self.currentPredictionVariable(undefined);

            self.predictions.removeAll();
            self.rankings.removeAll();
            self.clusters.removeAll();
        }

    }

    function setup2WayBindings(){
        // subscribe to the change of the selection
        self.currentPatient.subscribe(changeCurrentPatient);

        /*Subscribe the the change in similarity metric */
        self.currentSorting.subscribe(changeCurrentSorting);

        // self.currentPrediction.subscribe(changeProbabilityRange);
        // self.currentPredictionVariable.subscribe(changeProbabilityVariable);

        // subscribe to the change of the how many patients to display
        self.currentDisplay.subscribe(changeNumberOfPatients);

        // subscribe to the primary filter type
        self.currentType.subscribe(changeFilteringMode);
    }

    function filterByCluster(seClass) {
        // clear the patient list
        self.patients.removeAll();
        self.rankings.removeAll();

        if(!seClass) {
            SEdropdown.firstChild.textContent = "Side-Effect";
            self.sideEffect_class = null;
        }

        App.data = App.weighted;

        // add to the list only the patients in the current cluster
        _.filter(App.sites, function(site) {
            return parseInt(site.clusters[self.currentCluster().name]) === parseInt(self.currentCluster().value);
        })
        .forEach(function(p){
            // find the patient in the data and add it to the list
            let patient = _.find(App.data, function (o) {
                return o.id === p.patient;
            });
            self.patients.push(_.clone(patient));
        });
    }

    function filterByGroup(seClass) {
        // clear the patient list
        self.patients.removeAll();
        self.rankings.removeAll();

        if(!seClass) {
            SEdropdown.firstChild.textContent = "Side-Effect";
            self.sideEffect_class = null;
        }

        App.data = App.weighted;

        // add to the list only the patients in the current cluster
        _.filter(App.sites, function(site) {
            return parseInt(site.dendrogram[self.currentGroup().name]) === parseInt(self.currentGroup().value);
        })
            .forEach(function(p){
                // find the patient in the data and add it to the list
                let patient = _.find(App.data, function (o) {
                    return o.id === p.patient;
                });
                self.patients.push(_.clone(patient));
            });
    }

    function setupMenu() {
        /*Subscribe the the change in clustering menu */
        let clusterMenu = document.getElementById("clusterMenu");
        let groupMenu = document.getElementById("dendroMenu");
        let sideEffectMenu = document.getElementById("SEMenu");

        clusterMenu.addEventListener("click", function(e){

            if (e.target.className === 'cluster') {
                self.cluster_class = e.target.value || e.target.firstElementChild.value;
                let cluster_value = _.trim(e.target.textContent);

                dropdown.firstChild.textContent = self.cluster_class + ": " + cluster_value + ' ';

                // set the cluster selector to the value
                let cluster = {name: self.cluster_class, value: parseInt(cluster_value.split(" ")[1])};
                self.currentCluster(cluster);

                if(self.currentType() === "By Cluster" && self.currentCluster()) {
                    filterByCluster();
                    self.currentPatient(self.patients()[0]);
                }
                /* Touch the current observable to re-render the scene */
                else if(self.currentPatient()) {
                    self.rankings.removeAll();
                    filterPatients(self.currentPatient());
                    // Render to the screen
                    App.createVisualizations(self.rankings());
                }
            }
        });

        groupMenu.addEventListener("click", function(e){

            if (e.target.className === 'cluster') {
                self.group_class = e.target.value || e.target.firstElementChild.value;
                let group_value = _.trim(e.target.textContent);

                dendroDrop.firstChild.textContent = self.group_class + ": " + group_value + ' ';

                // set the cluster selector to the value
                let group = {name: self.group_class, value: parseInt(group_value.split(" ")[1])};
                self.currentGroup(group);

                if(self.currentType() === "By Cluster" && self.currentGroup()) {
                    filterByGroup();
                    self.currentPatient(self.patients()[0]);
                }
                /* Touch the current observable to re-render the scene */
                else if(self.currentPatient()) {
                    self.rankings.removeAll();
                    filterPatients(self.currentPatient());
                    // Render to the screen
                    App.createVisualizations(self.rankings());
                }
            }
        });


        sideEffectMenu.addEventListener("click", function(e) {
            if (e.target.className === 'sideEffect') {
                self.sideEffect_class = e.target.value || e.target.firstElementChild.value;
                self.sideEffect_value = _.trim(e.target.textContent);

                SEdropdown.firstChild.textContent = self.sideEffect_class + ": " + self.sideEffect_value + ' ';

                if(self.currentType() === "By Cluster" && self.currentCluster()) {
                    filterByCluster(self.sideEffect_class);
                }
                // // add to the list only the patients in the current cluster
                let new_pats = [];
                _.filter(App.sites, function(site) {
                    return site[sideEffectMap[self.sideEffect_class]] === self.sideEffect_value;
                })
                .forEach(function(p){
                    // find the patient in the data and add it to the list
                    let patient = _.find(self.patients(), function (o) {
                        return o.id === p.patient;
                    });
                    if(patient){
                        new_pats.push(_.clone(patient));
                    }
                });

                self.rankings.removeAll();
                self.patients.removeAll();
                self.patients(new_pats);


                self.currentPatient(new_pats[0]);

            }
        });
    }

    // initialize the observables
    setupObservables();
    setup2WayBindings();

    // initialize the menu
    setupMenu();
}

/*** IFE to load the data and apply the KO bindings ***/
(function () {

    function round(value, step) {
        step || (step = 1.0);
        let inv = 1.0 / step;
        return Math.ceil(value * inv) / inv;
    }

    // function bin_prediction(p) {
    //     return round(p, 0.05);
    // }
    //
    // function parse_predictions(patient,predictions) {
    //     /* extract the prediction clusters based on the id */
    //     let nodes = _.chain(predictions)
    //         .find(function(o){ return parseInt(o.id) === patient.id })
    //         .omit(["", "id"]).value();
    //
    //     let index = -1;
    //     if(index = _.indexOf(nodes, "23") > -1){
    //         nodes[index] = "2/3"
    //     }
    //     if(index = _.indexOf(nodes, "34") > -1){
    //         nodes[index] = "3/4"
    //     }
    //
    //     return nodes
    // }

    function extract_nodes(patient, between){
        return _.chain(patient.nodes)
            .reduce(function(result, value) {
                /* Check for two digits */
                if( _.parseInt(value.substring(1)) > 9){
                    between.push(value);
                }
                else {
                    result.push(value);
                    if(value.length === 2 && value[1] === "2"){
                        result.push(value[0] + value[1] + 'A');
                        result.push(value[0] + value[1] + 'B');
                    }
                    else {
                        result.push(value);
                    }
                }
                return result;
            }, [])
            .partition(function (p) {
                return p[0] === 'L';
            }).value();

    }

    function parse_clusters(patient, clusters, key, labels){
        /* iterate over the clusters and extract the patient's cluster */
        let centers = {};
        clusters.forEach(function(cluster,i){
            let pat = _.find(cluster, function(o) {return o["patientId"] == patient});
            if(pat) {centers[labels[i]] = parseInt(pat[key]);}
            else {centers[labels[i]] = -1}
        });
        return centers;
    }

    function extract_bubble_groups(patient) {
        /* Store the two groups of nodes for the convex hull -- left and right */
        let groups = [], involvement = _.clone(patient.nodes), between_nodes = [],
            nodes = App.template.nodes;

//         /* Check for in-between nodes */
//         patient.between_nodes.forEach(function(btw){
//
//             let nodes_split = [ btw.slice(1, -1), btw.slice(-1)],
//                 semantic_idx = (btw[0] === "L") ? 0 : 1;
//
//             for(let i = 0; i < nodes_split.length; i++){
//                 // if(nodes_split[i] === "2") {
//                 //     involvement[semantic_idx] = _.difference(involvement[semantic_idx], [btw[0]+"2A", btw[0]+"2B"]);
//                 //     between_nodes = [btw[0]+"2A", btw[0]+"2B"];
//                 // }
//                 // else {
//                     between_nodes.push(btw[0]+nodes_split[i]);
// //                }
//             }
//         });
//
//         /* Add the between nodes to the tumor groups */
//         if(between_nodes.length > 0) {
//             let found = false;
//             involvement.forEach(function(t,i){
//                 if(_.intersection(t, between_nodes).length === between_nodes.length) {
//                     involvement[i] = {nodes:between_nodes, between: true};
//                     found = true;
//                 }
//             });
//             if(!found){
//                 involvement.push({nodes:between_nodes, between: true});
//             }
//         }

      involvement.forEach(function (t,i) {
            let between = false;
            // if(!_.isArray(t)){
            //     t = t.nodes;
            //     between = true;
            // }

            /* Check for empty sets */
            if(t.length === 0) return;

            /* Parse the data from the partitions */
            let group = _.chain(t).map(function (p) {
                return p.substring(1)
            }).value();

            let connected_components = [group];
            /* Check the connectedness of the nodes */
            if(group.length > 1){
                connected_components = App.utils.connectedComponents(group, App.template.edgeList);
            }

            /* Iterate over the node groupings */
            connected_components.forEach(function (component_nodes) {

                /* Collect the nodes to be used in the convex hull*/
                let group_nodes = d3.nest().key(function (d) {
                    return (_.indexOf(component_nodes, d.name) >= 0) ? d & 3 : 1;
                }).entries(nodes);

                group_nodes = _.filter(group_nodes, function (o) {
                    return o.key === "0";
                });

                /* Add the nodes to the list */
                groups.push({
                    orientation: function() {

                        if(i === 0) return "left";
                        else if(i === 1) return "right";

                        if(t.length > 0) return (t[0][0]==="R") ? "right" : "left";

                    }(),
                    nodes: group_nodes,
                    between_nodes: between
                });
            });
        });

        return groups;
    }

       App.utils.readFiles(function (error, weighted,weighted_w6, weighted_n6,
                                         /*weighted_c2, weighted_c3 , weighted_c4, weighted_c5, weighted_c6, weighted_w2, weighted_w3 , weighted_w4, weighted_w5,weighted_w6,
                                         nodes_c2, nodes_c3 , nodes_c4, nodes_c5, nodes_c6, nodes_w2, nodes_w3 , nodes_w4, nodes_w5,nodes_w6 //diffs_n_b

       */

       )
       {
            if (error){ return console.warn(error); }

            App.weighted = weighted;
            App.sites = [];

            /* Iterate through the data and pull out each patient's information */
            App.weighted.forEach(function (patient) {

                // extract the clusters based on the patient's id
                let patient_groups = parse_clusters(patient.id,
                    [
                        // bigrams_c2, bigrams_c3 , bigrams_c4,
                        // weighted_w3,
                        // weighted_w4,
                        weighted_w6,
                      // weighted_c3,
                      // weighted_c4,
                      weighted_n6,
                        // bigrams_w2, bigrams_w3 , bigrams_w4,
                        // bigrams_w6,
                        // nodes_c2, nodes_c3 , nodes_c4,
                        // nodes_c6,
                        // nodes_w2, nodes_w3 , nodes_w4,
                        //nodes_w4,// diffs_n_b
                    ],
                    "groupId",
                    [
                        // "Bigrams, Comp. k=2", "Bigrams, Comp. k=3","Bigrams, Comp. k=4",
                        // "Weighted, Comp. k=6",
                        // "Bigrams, Weight. k=2", "Bigrams, Weight. k=3","Bigrams, Weight. k=4",
                        "Spatial k=6",                        // "Bigrams, Weight. k=6",
                        "Non-Spatial k=6",                        // "Bigrams, Weight. k=6",
                        // "Bigrams, Weight. k=6",
                        // "Labels, Comp. k=2", "Labels, Comp. k=3","Labels, Comp. k=4",
                        // "Labels, Comp. k=6",
                        // "Labels, Weight. k=2", "Labels, Weight. k=3","Labels, Weight. k=4",
                        // "Labels, Weight. k=4",// "Diffs, Labels & Bigrams"
                    ] ),
                    patient_dendogramIds = parse_clusters(patient.id,
                    [
                        // bigrams_c2, bigrams_c3 , bigrams_c4,
                      weighted_w6,
                      weighted_n6,
                      // bigrams_w2, bigrams_w3 , bigrams_w4,
                        // bigrams_w6,
                        // nodes_c2, nodes_c3 , nodes_c4,
                        // nodes_c6,
                        // nodes_w2, nodes_w3 , nodes_w4,
                        // nodes_w4,// diffs_n_b
                    ],
                    "dendogramId",
                    [
                        // "Bigrams, Comp. k=2", "Bigrams, Comp. k=3","Bigrams, Comp. k=4",
                        // "Weighted, Comp. k=6",
                        // "Bigrams, Weight. k=2", "Bigrams, Weight. k=3","Bigrams, Weight. k=4",
                      // "Weighted, Weight. k=3",
                      // "Weighted, Weight. k=4",
                      // "Weighted, Weight. k=6",
                      // "Weighted, Comp. k=3",
                      // "Weighted, Comp. k=4",
                      "Spatial k=6",                        // "Bigrams, Weight. k=6",
                      "Non-Spatial k=6",                        // "Bigrams, Weight. k=6",
                        // "Labels, Comp. k=2", "Labels, Comp. k=3","Labels, Comp. k=4",
                        // "Labels, Comp. k=6",
                        // "Labels, Weight. k=2", "Labels, Weight. k=3","Labels, Weight. k=4",
                        //"Labels, Weight. k=4",// "Diffs, Labels & Bigrams"
                    ] ),
                    between = [],
                    nodes = extract_nodes(patient, between);

                // nodes[0] = _.uniqBy(nodes[0], function(e){return e});
                // nodes[1] = _.uniqBy(nodes[1], function(e){return e});

                let site = {
                    "patient": patient.id,
                    "nodes": nodes,
                    "position": patient.position,
                    "gender": patient.gender,
                    "score": [],
                    "between_nodes": between,
                    "feedingTube_post": patient["Feeding_tube_6m"] ? patient["Feeding_tube_6m"] : "NA",
                    "feedingTube_pre": !!patient["Tube_removal"] ? "N": patient["Feeding_tube_6m"],
                    "aspiration_pre" : patient["Aspiration_rate_Pre-therapy"] ? patient["Aspiration_rate_Pre-therapy"] : "NA" ,
                    "aspiration_post" : patient["Aspiration_rate_Post-therapy"] ? patient["Aspiration_rate_Post-therapy"] : "NA",
                    "neck_boost" : patient["Neck_boost"] ? patient["Neck_boost"] : "NA",
                    "clusters": patient_groups,
                    "dendrogram": patient_dendogramIds
                };
                /* Create the bubble sets for every patient */
                site.groups  = extract_bubble_groups(site);
                App.sites.push(site);
            });

            App.sites = App.sites.sort(patient_sort.bind(null, "patient"));
            App.data = App.weighted.sort(patient_sort.bind(null, "id") );

            /* Load the dropdown templates */
            let d1 =  new $.Deferred(),
                d2 =  new $.Deferred(),
                d3 =  new $.Deferred();

            $.when(d1,d2/*,d3*/).done(function(){
                ko.applyBindings(new Patients());
                $("#appBody").removeClass("hidden");
                $("#menuBody").removeClass("hidden");
                setTimeout(App.initializeLegend, 500)


            });

            $("#byPatient").load("src/htmlTemplates/byPatient.html", ()=>{d1.resolve()});
            $("#byCluster").load("src/htmlTemplates/byCluster.html", ()=>{d2.resolve()});
            // $("#byPrediction").load("src/htmlTemplates/byPrediction.html", ()=>{d3.resolve()});
        });

})();
