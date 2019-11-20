"use strict";
var App = App || {};

(function () {

  App.Utilities = function () {

    function modified_bfs(source, selected_nodes, all_pairs, visited) {

      let q = [],
        current_group = [], i, nextVertex, pair,
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
    function connected_components(infected_nodes, all_nodes) {

      let visited = {},
          touched_nodes = [];

      infected_nodes.forEach(function (node) {

        /* If the node has not been visited yet*/
        if (!visited[node]) {
          let touched = modified_bfs(node, infected_nodes, all_nodes, visited);
          touched_nodes.push(touched);
        }
      });

      return touched_nodes;
    }

    function read_input_files(cb) {

      queue()
      .defer(d3.json, "synthetic_data/example_patients.json")
      .defer(d3.csv, "synthetic_data/example_bigram_clusters.csv")
      .defer(d3.csv, "synthetic_data/example_unigram_clusters.csv")
      .await(cb)
    }

    function getQueryVariable(variable) {
      var query = window.location.search.substring(1);
      var vars = query.split("&");
      for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split("=");
        if (pair[0] == variable) {
          return pair[1];
        }
      }
      return (false);
    }

    return {
      connectedComponents: connected_components,
      readFiles : read_input_files,
      getQueryVariable : getQueryVariable
    }

  }

})();