"use strict";
var App = App || {};

const Utilities = (function() {


  function Utilities() {

    let self = this;

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

  return Utilities;

})();