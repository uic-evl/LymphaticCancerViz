"use strict";
var App = App || {};

const Utilities = (function() {

  function Utilities() {

    let self = this;

    this.extractNodes = function(patient, between){
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

  }

  Utilities.prototype.iterativeInOrder = function(node, cb) {
    let self = this;

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

  Utilities.prototype.getGroupConsensus = function(group) {

  };

  return Utilities;

})();