"use strict";
var App = App || {};

const Utilities = (function() {

  function Utilities() {

    let self = this;
    self.patients = null;
    self.consensus = {};

    this.extractNodes = function(patient, between){
      return _.chain(patient.nodes)
      .reduce(function(result, value) {
        /* Check for two digits */
        if( _.parseInt(value.substring(1)) > 9){
          between.push(value);
        }
        else {
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
      .partition(function (p) { return p[0] === 'L';}).value();

    };

    function modified_bfs(source, selected_nodes, all_pairs, visited) {

      let q = [],
        current_group = [],
        i, nextVertex, pair,
        length_all_pairs = all_pairs.length;

      q.push(source);

      while (q.length > 0) {

        nextVertex = q.shift();

        /* Modification: Check if the node is infected and has been visited */
        if (selected_nodes.indexOf(nextVertex) > -1 && !visited[nextVertex]) {

          visited[nextVertex] = true;
          current_group.push(nextVertex);

          // go through the input array to find vertices that are
          // directly adjacent to the current vertex, and put them
          // onto the queue
          for (i = 0; i < length_all_pairs; i += 1) {

            pair = all_pairs[i];

            if (pair[0] === nextVertex && !visited[pair[1]]) {
              q.push(pair[1]);

            }
            else if (pair[1] === nextVertex && !visited[pair[0]]) {
              q.push(pair[0]);
            }
          }
        }
      }
      // return everything in the current "group"
      return current_group;
    }

    /* Function to test of a node is isolated from the rest */
    this.connectedComponents = function(involved_nodes, all_nodes) {
      let visited = {}, touched_nodes = [];
      involved_nodes.forEach(function (node) {
        /* If the node has not been visited yet*/
        if (!visited[node]) {
          touched_nodes.push(modified_bfs(node, involved_nodes, all_nodes, visited));
        }
      });
      return touched_nodes;
    }
  }

  Utilities.prototype.iterativeInOrder = function(node, cb) {
    let stack = []
      , currentNode = node;

    while(stack.length > 0 || currentNode) {
      if(currentNode) {
        stack.push(currentNode);
        currentNode = (currentNode.children && currentNode.children.length) ? currentNode.children[0] : null;
      }
      else {
        currentNode = stack.pop();
        cb(currentNode);
        currentNode = (currentNode.children && currentNode.children.length > 1) ? currentNode.children[1] : null;
      }
    }

  };

  Utilities.prototype.parsePatientData = function(patients) {
    let self = this, parsed_patients = {};

    patients.forEach(function(patient){

      let nodes = self.extractNodes(patient, []);
      parsed_patients[patient.id] = {
        "patient": patient.id,
        "nodes": nodes,
        "position": patient.position,
        "gender": patient.gender,
        "score": [],
        "feedingTube_post": patient["Feeding_tube_6m"] ? patient["Feeding_tube_6m"] : "NA",
        "feedingTube_pre": !!patient["Tube_removal"] ? "N": patient["Feeding_tube_6m"],
        "aspiration_pre" : patient["Aspiration_rate_Pre-therapy"] ? patient["Aspiration_rate_Pre-therapy"] : "NA" ,
        "aspiration_post" : patient["Aspiration_rate_Post-therapy"] ? patient["Aspiration_rate_Post-therapy"] : "NA",
        "neck_boost" : patient["Neck_boost"] ? patient["Neck_boost"] : "NA",
      };
    });

    self.patients = parsed_patients;
  };

  Utilities.prototype.getGroupConsensus = function(clusters, threshold) {
    let self = this;
    self.iterativeInOrder(clusters[0], function(node){
      /* Make sure the node has the clustered patients */
      if(!(node.cluster && node.cluster.length > 0)) return;

      let involvement_occurrences = { "a":{}, "b":{} };
      /* Iterate over the ids and get the patients' nodes */
      node.cluster.forEach(function(p_id) {

        let patient_nodes = _.flatten(self.patients[p_id].nodes);

        let levels = [];
        patient_nodes.forEach(function (involvement) {
          levels.push(involvement.substr(1));
        });

        let bilateral = _.filter(levels, (val, i, iteratee) => _.includes(iteratee, val, i + 1))
          , unilateral = _.difference(levels, bilateral);

        /* Add the bilateral nodes*/
        bilateral.forEach(function(involvement){
          /* Check if the first side has recorded this involvement */
          if(_.has(involvement_occurrences["a"], involvement)) {involvement_occurrences["a"][involvement] += 1;}
          else {involvement_occurrences["a"][involvement] = 1;}

          /* Check if the second side has recorded this involvement */
          if(_.has(involvement_occurrences["b"], involvement)) { involvement_occurrences["b"][involvement] += 1;}
          else {involvement_occurrences["b"][involvement] = 1;}
        });

        unilateral.forEach(function(involvement) {
          /* Check if the first side has recorded this involvement */
          if (_.has(involvement_occurrences["a"], involvement)) {involvement_occurrences["a"][involvement] += 1;}
          else {involvement_occurrences["a"][involvement] = 1;}
        });
      });

      /* Get the percentage involvement */
      _.forIn(involvement_occurrences["a"], (value, key)=>{involvement_occurrences["a"][key] = value / node.count;});
      _.forIn(involvement_occurrences["b"], (value, key) =>{involvement_occurrences["a"][key] = value / node.count;});

      let threshold_A = _.pickBy(involvement_occurrences["a"], value=> _.gt(value, threshold))
        , threshold_B = _.pickBy(involvement_occurrences["b"], value=> _.gt(value, threshold))
        , involvedA = [], involvedB = [];

      _.keys(threshold_A).forEach(function(inv){
        if(threshold_A.length > threshold_B.length) { involvedA.push(`L${inv}`) }
        else { involvedA.push(`R${inv}`) }
      });

      _.keys(threshold_B).forEach(function(inv){
        if(threshold_B.length > threshold_A.length) { involvedB.push(`L${inv}`) }
        else { involvedB.push(`R${inv}`) }
      });

      /* Save the percentages */
      self.consensus[node.node_id] = [involvedA, involvedB];
    });
  };

  Utilities.prototype.getConsensus = function(id) {
    if(_.isArray(id)) return _.pick(this.consensus, id);
    else {return (id) ? this.consensus[id] : this.consensus}
  };

  return Utilities;

})();