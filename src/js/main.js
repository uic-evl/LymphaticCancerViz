"use strict";

var App = App || {};

(function () {

  /* The current graph template */
  App.template = {};

  App.template.nodes_new = [
    {
      name: "1A",
      x: 230,
      y: 125,
      index: 0
    },
    {
      name: "1B",
      x: 157,
      y: 80,
      index: 1
    },
    {
      name: "2A",
      x: 112,
      y: 112,
      index: 2
    },
    {
      name: "2B",
      x: 82,
      y: 80,
      index: 3
    },
    {
      name: "3",
      x: 132,
      y: 140,
      index: 4
    },
    {
      name: "4",
      x: 132,
      y: 232,
      index: 5
    },
    {
      name: "5A",
      x: 41,
      y: 140,
      index: 6
    },
    {
      name: "5B",
      x: 41,
      y: 232,
      index: 7
    },
    {
      name: "6",
      x: 230,
      y: 186,
      index: 8
    },
    {
      name: "RP",
      x: 17,
      y: 20,
      index: 9
    },

    // {
    //   name: "2/3",
    //   x: 83,
    //   y: 125
    // },
    // {
    //   name: "3/4",
    //   x: 100,
    //   y: 187
    // }
  ];
  App.template.nodes = [
    {
      name: "1A",
      x: 165,
      y: 125,
      index: 0
    },
    {
      name: "1B",
      x: 125,
      y: 90,
      index: 1
    },
    {
      name: "2A",
      x: 80,
      y: 112,
      index: 2
    },
    {
      name: "2B",
      x: 50,
      y: 90,
      index: 3
    },
    {
      name: "3",
      x: 100,
      y: 150,
      index: 4
    },
    {
      name: "4",
      x: 100,
      y: 225,
      index: 5
    },
    {
      name: "5A",
      x: 25,
      y: 150,
      index: 6
    },
    {
      name: "5B",
      x: 25,
      y: 225,
      index: 7
    },
    {
      name: "6",
      x: 165,
      y: 186,
      index: 8
    },
    {
      name: "RP",
      x: 15,
      y: 50,
      index: 9
    }];
  App.template.links = [
    {
      source: _.find(App.template.nodes, {"name": "1A"}).index,
      target: _.find(App.template.nodes, {"name": "1B"}).index,
      name: "1A-1B"
    },
    {
      source: _.find(App.template.nodes, {"name": "1A"}).index,
      target: _.find(App.template.nodes, {"name": "6"}).index,
      name: "1A-6"
    },
    {
      source: _.find(App.template.nodes, {"name": "1B"}).index,
      target: _.find(App.template.nodes, {"name": "2A"}).index,
      name: "1B-2A"
    },
    {
      source: _.find(App.template.nodes, {"name": "1B"}).index,
      target: _.find(App.template.nodes, {"name": "3"}).index,
      name: "1B-3"
    },
    {
      source: _.find(App.template.nodes, {"name": "2A"}).index,
      target: _.find(App.template.nodes, {"name": "2B"}).index,
      name: "2A-2B"
    },
    {
      source: _.find(App.template.nodes, {"name": "2A"}).index,
      target: _.find(App.template.nodes, {"name": "3"}).index,
      name: "2A-3"
    },
    // {
    //   source: _.find(App.template.nodes, {"name": "2A"}).index,
    //   target: _.find(App.template.nodes, {"name": "5A"}).index,
    // },
    {
      source: _.find(App.template.nodes, {"name": "2B"}).index,
      target: _.find(App.template.nodes, {"name": "5A"}).index,
      name: "2B-5A"
    },
    {
      source: _.find(App.template.nodes, {"name": "3"}).index,
      target: _.find(App.template.nodes, {"name": "4"}).index,
      name: "3-4"
    },
    // {
    //   source: _.find(App.template.nodes, {"name": "3"}).index,
    //   target: _.find(App.template.nodes, {"name": "1B"}).index,
    // },
    {
      source: _.find(App.template.nodes, {"name": "3"}).index,
      target: _.find(App.template.nodes, {"name": "5A"}).index,
      name: "3-5A"
    },
    {
      source: _.find(App.template.nodes, {"name": "3"}).index,
      target: _.find(App.template.nodes, {"name": "6"}).index,
      name: "3-6"
    },
    {
      source: _.find(App.template.nodes, {"name": "4"}).index,
      target: _.find(App.template.nodes, {"name": "5B"}).index,
      name: "4-5B"
    },
    {
      source: _.find(App.template.nodes, {"name": "4"}).index,
      target: _.find(App.template.nodes, {"name": "6"}).index,
      name: "4-6"
    },
    {
      source: _.find(App.template.nodes, {"name": "5A"}).index,
      target: _.find(App.template.nodes, {"name": "5B"}).index,
      name: "5A-5B"
    }
  ];
  App.template.edgeList = [
    ["1A", "1B"],
    ["1A", "6"],
    ["1B", "2A" ],
    ["2A", "2B" ],
    ["2A" , "3" ],
    ["2B" , "5A" ],
    ["3" , "4" ],
    ["3" , "5A" ],
    ["3" , "6" ],
    ["4" , "5B" ],
    ["4" , "6" ],
    ["5A" , "5B" ],
  ];


  // for(let i = 0; i < App.template.nodes.length; i++){
  //   App.template.nodes[i].x = 250 - App.template.nodes[i].x;
  // }


  /* Initialize the styling variables*/
  App.graphSVGWidth = 250;
  App.graphSVGHeight = 250;
  App.padding = parseInt($('.patient_container').css('padding-left')) || 10;

  /* The radius of a graph node */
  App.nodeRadius = 15;

  /* Define the end-to-end size of the graph */
  App.graphWidth = _.find(App.template.nodes, {"name": "6"}).x - _.find(App.template.nodes, {"name": "RP"}).x;
  App.graphHeight = _.find(App.template.nodes, {"name": "4"}).y - _.find(App.template.nodes, {"name": "RP"}).y;

  let template_svg = d3.select("#virtualGraph")
      .append("svg")
      .attr("width", App.graphSVGWidth)
      .attr("height", App.graphSVGHeight);
  createNetwork(template_svg, App.template);

  /* Utility functions */
  let utils = App.Utilities();

  let groupPath = function (d) {
    // add fake points to the hull if there are < 3
    // Inspiration: http://jsfiddle.net/y4amnsbn/
    let fakePoints = [];
    if (d.values.length < 3) {
      fakePoints = [
        [d.values[0].x + 0.001, d.values[0].y - 0.001],
        [d.values[0].x - 0.001, d.values[0].y + 0.001],
        [d.values[0].x - 0.001, d.values[0].y + 0.001]
      ];
    }

    // construct the convex hull
    return "M" +
        d3.geom.hull(
          d.values.map(function (i) {return [i.x, i.y]; }).concat(fakePoints)
        ).join("L") + "Z";
  };

  let groupFill = function (d) {
    return (d.orientation === "left");
  };

  function createBubbles(svg, nodes, patient) {
    /* Store the two groups of nodes for the convex hull -- left and right */
    let groups = [], tumors = _.clone(patient.nodes), between_nodes = [];

    /* Check for in-between nodes */
    patient.between_nodes.forEach(function(btw){

      let nodes_split = [ btw.slice(1, -1), btw.slice(-1)],
          semantic_idx = (btw[0] === "L") ? 0 : 1;

      for(let i = 0; i < nodes_split.length; i++){
        if(nodes_split[i] === "2") {
          tumors[semantic_idx] = _.difference(tumors[semantic_idx], [btw[0]+"2A", btw[0]+"2B"]);
          between_nodes = [btw[0]+"2A", btw[0]+"2B"];
        }
        else {
          //tumors[semantic_idx] = _.difference(tumors[semantic_idx], [btw[0]+nodes_split[i]]);
          between_nodes.push(btw[0]+nodes_split[i]);
        }
      }

    });

    /* Add the between nodes to the tumor groups */
    tumors.push(between_nodes);

    tumors.forEach(function (t,i) {

      /* Parse the data from the partitions */
      let group = _.chain(t).map(function (p) {
        return p.substring(1)
      }).value();

      let connected_components = [group];
      /* Check the connectedness of the nodes */
      if(group.length > 1){
        connected_components = utils.connectedComponents(group, App.template.edgeList);
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
          nodes: group_nodes});
      });

    });

    /** Adds the convex hulls **/
    svg.selectAll("path")
        .data(groups)
        .attr("d", groupPath)
        .enter().insert("path", "circle")
        .classed("hull", true)
        .classed("between_nodes", (d,i)=>{return (i > 1)})
        .classed("hull_left", (d)=>{return groupFill(d)})
        .classed("hull_right", (d)=>{return !groupFill(d)})
        .attr("d", function (d) {
          if (d.nodes.length > 0) {
            return groupPath(d.nodes[0]);
          }
        });
  }

  function addNodes(svg, lymphNodes) {
    let nodes = svg.selectAll("circle.node")
        .append('g')
        .data(lymphNodes)
        .enter();

    /** Adds the nodes **/
    nodes
        .append("circle")
        .classed("node", true)
        .attr("cx", function (d) {
          return d.x
        })
        .attr("cy", function (d) {
          return d.y
        })
        .attr("r", App.nodeRadius)
        .attr("fill", function (d, i) {
          return "#f0f0f0";
        })
        .style("stroke", "gray");

    /** Adds the text on top of the nodes **/
    nodes
        .append("text")
        .attr("x", function (d) {
          return d.x;
        })
        .attr("y", function (d) {
          return d.y;
        })
        .attr("dy", ".35em")
        .style({'text-anchor': 'middle', 'fill': 'black'})
        .text(function (d) {
          return d.name;
        });
  }

  function addLinks(svg, data) {
    /** Adds the links between the nodes **/
    svg.selectAll("link")
        .data(data.links)
        .enter()
        .append("line")
        .classed("link", true)
        .attr("x1", function (l) {
          let sourceNode = data.nodes.filter(function (d, i) {
            return i === l.source
          })[0];

          d3.select(this).attr("y1", sourceNode.y);
          return sourceNode.x
        })
        .attr("x2", function (l) {
          let targetNode = data.nodes.filter(function (d, i) {
            return i === l.target
          })[0];

          d3.select(this).attr("y2", targetNode.y);
          return targetNode.x
        })
        .attr("fill", "none")
        .attr("stroke", "black");
  }

  function createNetwork(svg, data) {
    /*Add a group to house each graph and center it in the container */
    let transformX = (App.graphSVGWidth - App.graphWidth) / 2.0 +
        (App.nodeRadius - _.find(App.template.nodes, {"name": "5A"}).x) * 2.0,

        transformY = (App.graphSVGHeight - App.graphHeight) / 2.0 +
            (App.nodeRadius - _.find(App.template.nodes, {"name": "5B"}).x) * 2.0;

    let g = svg.append("g")
        .attr("transform", "translate(" + transformX + ",-"
            + transformY + ")");

    /* Add the links to the network*/
    addLinks(g, data);

    /* Add the nodes to the network */
    addNodes(g, data.nodes);

    return svg;
  }

  App.createVisualizations = function (ranking) {
    ranking.forEach(function (patient) {
      let clone = template_svg.node().cloneNode(true),
          $network = $('#patient' + patient.patient).append(clone),
          g = $network.find('g')[0];
      /*Create the bubbles around the infected nodes */
      createBubbles(d3.select(g), App.template.nodes, patient);
    });
  }

})();
