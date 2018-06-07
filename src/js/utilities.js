"use strict";
var App = App || {};

(function () {

  App.Utilities = function () {

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
            .defer(d3.json, "data/json/tanimoto_bigrams_UPPER.json")
            .defer(d3.csv, "data/csv/clusters/06_06_2018/cluster_complete_weighted_6_2018_k=2.csv")
            .defer(d3.csv, "data/csv/clusters/06_06_2018/cluster_complete_weighted_6_2018_k=3.csv")
            .defer(d3.csv, "data/csv/clusters/06_06_2018/cluster_complete_weighted_6_2018_k=4.csv")
            .defer(d3.csv, "data/csv/clusters/06_06_2018/cluster_complete_weighted_6_2018_k=5.csv")
            .defer(d3.csv, "data/csv/clusters/06_06_2018/cluster_complete_weighted_6_2018_k=6.csv")
            .defer(d3.csv, "data/csv/clusters/06_06_2018/cluster_weighted_weighted_6_2018_k=2.csv")
            .defer(d3.csv, "data/csv/clusters/06_06_2018/cluster_weighted_weighted_6_2018_k=3.csv")
            .defer(d3.csv, "data/csv/clusters/06_06_2018/cluster_weighted_weighted_6_2018_k=4.csv")
            .defer(d3.csv, "data/csv/clusters/06_06_2018/cluster_weighted_weighted_6_2018_k=5.csv")
            .defer(d3.csv, "data/csv/clusters/06_06_2018/cluster_weighted_weighted_6_2018_k=6.csv")
            .defer(d3.csv, "data/csv/clusters/06_06_2018/cluster_complete_nodes_6_2018_k=2.csv")
            .defer(d3.csv, "data/csv/clusters/06_06_2018/cluster_complete_nodes_6_2018_k=3.csv")
            .defer(d3.csv, "data/csv/clusters/06_06_2018/cluster_complete_nodes_6_2018_k=4.csv")
            .defer(d3.csv, "data/csv/clusters/06_06_2018/cluster_complete_nodes_6_2018_k=5.csv")
            .defer(d3.csv, "data/csv/clusters/06_06_2018/cluster_complete_nodes_6_2018_k=6.csv")
            .defer(d3.csv, "data/csv/clusters/06_06_2018/cluster_weighted_nodes_6_2018_k=2.csv")
            .defer(d3.csv, "data/csv/clusters/06_06_2018/cluster_weighted_nodes_6_2018_k=3.csv")
            .defer(d3.csv, "data/csv/clusters/06_06_2018/cluster_weighted_nodes_6_2018_k=4.csv")
            .defer(d3.csv, "data/csv/clusters/06_06_2018/cluster_weighted_nodes_6_2018_k=5.csv")
            .defer(d3.csv, "data/csv/clusters/06_06_2018/cluster_weighted_nodes_6_2018_k=6.csv")
            // .defer(d3.csv, "data/csv/clusters/06_06_2018/differences/diffs_node_bigram.csv")
            .await(cb)
    }

    return {
      connectedComponents: connected_components
        , readFiles : read_input_files
    }

  }

})();