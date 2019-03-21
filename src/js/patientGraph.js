"use strict";
var App = App || {};

const PatientGraph = (function(){

  function PatientGraph () {

    let self = this;

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

    this.createBubbles = function(svg, groups) {
      /* Adds the convex hulls */
      let bubbleSet = svg.append("g")
        .attr("transform", "translate(" + self.transformX + ",-" + self.transformY + ")");

      bubbleSet.selectAll("path")
        .data(groups)
        .enter().insert("path", "circle")
        .classed("hull", true)
        .classed("between_nodes", (d)=>{return d.between_nodes})
        .classed("hull_left", (d)=>d.orientation === "left")
        .classed("hull_right", (d)=>d.orientation === "right")
        .classed("hull_non", (d)=>d.orientation === "non")
        .attr("d", function (d) {if (d.nodes.length > 0) { return groupPath(d.nodes[0]); }});

      bubbleSet.selectAll(".hull")
        .attr("stroke-width", "40px")
        .attr("stroke-linejoin", "round")
        .attr("opacity", "0.6");

      bubbleSet.selectAll(".hull_left")
      .attr("fill", "#1b9e77")
      .attr("stroke", "#1b9e77");

      bubbleSet.selectAll(".hull_right")
      .attr("fill", "#7570b3")
      .attr("stroke", "#7570b3");

      bubbleSet.selectAll(".hull_non")
          .attr("fill", "#e41a1c")
          .attr("stroke", "#e41a1c");


      // if(laterality)
      // {
      //   if(laterality === "R") {
      //     bubbleSet.selectAll(".hull_right")
      //     .attr("fill", "#7570b3")
      //     .attr("stroke", "#7570b3");
      //   }
      //   else if(laterality === "L"){
      //     bubbleSet.selectAll(".hull_left")
      //     .attr("fill", "#1b9e77")
      //     .attr("stroke", "#1b9e77");
      //   }
      // }
      // else {
      //   bubbleSet.selectAll(".hull_left")
      //   .attr("fill", "#1b9e77")
      //   .attr("stroke", "#1b9e77");
      //
      //   bubbleSet.selectAll(".hull_right")
      //   .attr("fill", "#7570b3")
      //   .attr("stroke", "#7570b3");
      // }

    };

    function addNodes(svg, lymphNodes) {
      let nodes = svg.selectAll("circle.node")
        .append('g')
        .data(lymphNodes)
        .enter();

      /** Adds the nodes **/
      nodes
        .append("circle")
        .classed("node", true)
        .attr("cx", (d)=> d.x )
        .attr("cy", (d)=> d.y )
        .attr("r", self.radius)
        .attr("fill", "#f0f0f0")
        .attr("stroke", "black")
        .attr("stroke-width", "2px");

      /** Adds the text on top of the nodes **/
      // nodes
      //   .append("text")
      //   .attr("x", (d) =>d.x )
      //   .attr("y", (d) => d.y )
      //   .attr("dy", ".35em")
      //   .style({'text-anchor': 'middle', 'fill': 'black'})
      //   .text((d) =>  d.name );
    }

    function addLinks(svg, nodes, links) {
      /** Adds the links between the nodes **/
      svg.selectAll("graphLink")
        .data(links)
        .enter()
        .append("line")
        .classed("graphLink", true)
        .attr("x1", function (l) {
          let sourceNode = nodes.filter(function (d, i) { return i === l.source})[0];
          d3.select(this).attr("y1", sourceNode.y);
          return sourceNode.x
        })
        .attr("x2", function (l) {
          let targetNode = nodes.filter(function (d, i) { return i === l.target })[0];
          d3.select(this).attr("y2", targetNode.y);
          return targetNode.x
        })
        .attr("fill", "none")
        .attr("stroke", "black")
        .attr("stroke-width", "4px")
        .attr("shape-rendering", "crispEdges")

      ;
    }

    self.createNetwork = function(svg) {

      /*Add a group to house each graph and center it in the container */
      self.transformX = (self.width - self.graphWidth) / 2.0 +
        (self.radius - _.find(self.nodes, {"name": "5A"}).x) * 2.0;
      self.transformY = (self.height - self.graphHeight) / 2.0 +
        (self.radius - _.find(self.nodes, {"name": "5B"}).x) * 2.0;

      let g = svg.append("g")
        .attr("width", self.width)
        .attr("height", self.height)
        .attr("transform", "translate(" + self.transformX + ",-" + self.transformY + ")")
        .attr("id", "bubbleSet");

      /* Add the links to the network*/
      addLinks(g, self.nodes, self.links);

      /* Add the nodes to the network */
      addNodes(g, self.nodes);

      return svg;
    };

    this.extractBubbleGroups = function(i_nodes, laterality) {
      /* Store the two groups of nodes for the convex hull -- left and right */
      let self = this,
          groups = [], involvement = _.clone(i_nodes);

      involvement.forEach(function (t,i) {

        /* Check for empty sets */
        if(t.length === 0) return;

        /* Parse the data from the partitions */
        let group = _.chain(t).map( p => p.substring(1)).value();

        let connected_components = [group];
        /* Check the connectedness of the nodes */
        if(group.length > 1){
          connected_components = App.graphUtilities.connectedComponents(group, self.edges);
        }

        /* Iterate over the node groupings */
        connected_components.forEach(function (component_nodes) {

          /* Collect the nodes to be used in the convex hull*/
          let group_nodes = d3.nest().key(function (d) {
            return (_.indexOf(component_nodes, d.name) >= 0) ? d & 3 : 1;
          }).entries(self.nodes);

          group_nodes = _.filter(group_nodes, function (o) {
            return o.key === "0";
          });

          /* Add the nodes to the list */
          groups.push({
            orientation: function() {

              if(!laterality) {
                if(i === 0) return "left";
                else if(i === 1) return "right";

                if(t.length > 0) return (t[0][0]==="R") ? "right" : "left";
              }
              else {
                switch(laterality[i]) {
                  case 'R': return "right";
                  case 'L': return "left";
                  case 'N': return "non";
                }
              }

            }(),
            nodes: group_nodes,
          });
        });
      });

      return groups;
    };

  }

  PatientGraph.prototype = {

    init: function(options){
      let self = this;

      self.width = options.width;
      self.height = options.height;
      self.padding = options.padding || 5;
      self.radius = options.radius || 10;

      return new Promise(function(resolve) {
      /* load the data template */
      queue()
        .defer(d3.json, "../data/templates.json")
        .await(function(err, templates){

          self.nodes = templates.nodes;
          self.edges = templates.edges;
          self.links =  [
            {
              source: _.find(self.nodes, {"name": "1A"}).index,
              target: _.find(self.nodes, {"name": "1B"}).index,
              name: "1A-1B"
            },
            {
              source: _.find(self.nodes, {"name": "1A"}).index,
              target: _.find(self.nodes, {"name": "6"}).index,
              name: "1A-6"
            },
            {
              source: _.find(self.nodes, {"name": "1B"}).index,
              target: _.find(self.nodes, {"name": "2A"}).index,
              name: "1B-2A"
            },
            {
              source: _.find(self.nodes, {"name": "1B"}).index,
              target: _.find(self.nodes, {"name": "3"}).index,
              name: "1B-3"
            },
            {
              source: _.find(self.nodes, {"name": "2A"}).index,
              target: _.find(self.nodes, {"name": "2B"}).index,
              name: "2A-2B"
            },
            {
              source: _.find(self.nodes, {"name": "2A"}).index,
              target: _.find(self.nodes, {"name": "3"}).index,
              name: "2A-3"
            },

            {
              source: _.find(self.nodes, {"name": "2B"}).index,
              target: _.find(self.nodes, {"name": "5A"}).index,
              name: "2B-5A"
            },
            {
              source: _.find(self.nodes, {"name": "3"}).index,
              target: _.find(self.nodes, {"name": "4"}).index,
              name: "3-4"
            },
            {
              source: _.find(self.nodes, {"name": "3"}).index,
              target: _.find(self.nodes, {"name": "5A"}).index,
              name: "3-5A"
            },
            {
              source: _.find(self.nodes, {"name": "3"}).index,
              target: _.find(self.nodes, {"name": "6"}).index,
              name: "3-6"
            },
            {
              source: _.find(self.nodes, {"name": "4"}).index,
              target: _.find(self.nodes, {"name": "5B"}).index,
              name: "4-5B"
            },
            {
              source: _.find(self.nodes, {"name": "4"}).index,
              target: _.find(self.nodes, {"name": "6"}).index,
              name: "4-6"
            },
            {
              source: _.find(self.nodes, {"name": "5A"}).index,
              target: _.find(self.nodes, {"name": "5B"}).index,
              name: "5A-5B"
            }
          ];

          self.graphWidth  = _.find(self.nodes, {"name": "6"}).x - _.find(self.nodes, {"name": "RP"}).x;
          self.graphHeight = _.find(self.nodes, {"name": "4"}).y - _.find(self.nodes, {"name": "RP"}).y;

          resolve();
        });
      });
    },

    newGraph : function(div, data) {

      let svg = d3.select(`${div}`).append("svg")
        .attr("width", this.width)
        .attr("height", this.height);

       this.createNetwork(svg);

       /*Create the bubbles around the infected nodes */
    //createBubbles(svg.select("#bubbleSet"), data.groups, data.patient);
  }

  };

  return PatientGraph;

})();
