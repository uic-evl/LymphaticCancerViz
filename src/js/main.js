"use strict";

var App = App || {};

(function () {

  /* The current graph template */
  App.template = {};
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
  App.template.links = [
    {
      source: _.find(App.template.nodes, {"name": "1A"}).index,
      target: _.find(App.template.nodes, {"name": "1B"}).index,
    },
    {
      source: _.find(App.template.nodes, {"name": "1A"}).index,
      target: _.find(App.template.nodes, {"name": "6"}).index,
    },
    {
      source: _.find(App.template.nodes, {"name": "1B"}).index,
      target: _.find(App.template.nodes, {"name": "2A"}).index,
    },
    {
      source: _.find(App.template.nodes, {"name": "1B"}).index,
      target: _.find(App.template.nodes, {"name": "3"}).index,
    },
    {
      source: _.find(App.template.nodes, {"name": "2A"}).index,
      target: _.find(App.template.nodes, {"name": "2B"}).index,
    },
    {
      source: _.find(App.template.nodes, {"name": "2A"}).index,
      target: _.find(App.template.nodes, {"name": "3"}).index,
    },
    // {
    //   source: _.find(App.template.nodes, {"name": "2A"}).index,
    //   target: _.find(App.template.nodes, {"name": "5A"}).index,
    // },
    {
      source: _.find(App.template.nodes, {"name": "2B"}).index,
      target: _.find(App.template.nodes, {"name": "5A"}).index,
    },
    {
      source: _.find(App.template.nodes, {"name": "3"}).index,
      target: _.find(App.template.nodes, {"name": "4"}).index,
    },
    // {
    //   source: _.find(App.template.nodes, {"name": "3"}).index,
    //   target: _.find(App.template.nodes, {"name": "1B"}).index,
    // },
    {
      source: _.find(App.template.nodes, {"name": "3"}).index,
      target: _.find(App.template.nodes, {"name": "5A"}).index,
    },
    {
      source: _.find(App.template.nodes, {"name": "3"}).index,
      target: _.find(App.template.nodes, {"name": "6"}).index,
    },
    {
      source: _.find(App.template.nodes, {"name": "4"}).index,
      target: _.find(App.template.nodes, {"name": "5B"}).index,
    },
    {
      source: _.find(App.template.nodes, {"name": "4"}).index,
      target: _.find(App.template.nodes, {"name": "6"}).index,
    },
    {
      source: _.find(App.template.nodes, {"name": "5A"}).index,
      target: _.find(App.template.nodes, {"name": "5B"}).index,
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

  /* Initialize the styling variables*/
  App.graphSVGWidth = 250;
  App.graphSVGHeight = 250;
  App.padding = parseInt($('.patient_container').css('padding-left')) || 10;

  /* The radius of a graph node */
  App.nodeRadius = 15;

  /* Define the end-to-end size of the graph */
  App.graphWidth = _.find(App.template.nodes, {"name": "6"}).x - _.find(App.template.nodes, {"name": "5A"}).x;
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
    let fakePoints = [];
    if (d.values.length < 3) {
      fakePoints = [[d.values[0].x + 0.001, d.values[0].y - 0.001],
        [d.values[0].x - 0.001, d.values[0].y + 0.001],
        [d.values[0].x - 0.001, d.values[0].y + 0.001]];
    }

    // construct the convex hull
    return "M" +
        d3.geom.hull(d.values.map(function (i) {
              return [i.x, i.y];
            }
        ).concat(fakePoints)).join("L") + "Z";
  };

  let groupFill = function (d) {
    // console.log(d);
    if (d.orientation === "left")
      return '#1b9e77';
    else
      return "#7570b3";
  };

  function createBubbles(svg, nodes, tumors) {
    /* Store the two groups of nodes for the convex hull -- left and right */
    let groups = [];

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
        groups.push({orientation: (i===0) ? "left" : "right", nodes: group_nodes});

      });

    });

    /** Adds the convex hulls **/
    svg.selectAll("path")
        .data(groups)
        .attr("d", groupPath)
        .enter().insert("path", "circle")
        .style("fill", groupFill)
        .style("stroke", groupFill)
        .style("stroke-width", 40)
        .style("stroke-linejoin", "round")
        .style("opacity", .4)
        .attr("d", function (d) {
          if (d.nodes.length > 0)
            return groupPath(d.nodes[0]);
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
      createBubbles(d3.select(g), App.template.nodes, patient.nodes);
    });
  }

})();
