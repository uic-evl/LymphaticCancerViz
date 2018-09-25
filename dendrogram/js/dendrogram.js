"use strict";
var App = App || {};

const Dendrogram = (function(){

  let width , height
    , padding = {x:0, y:50}
    , margin = {left: 150, top: 40, right: 50, bottom: 150}
    , height_offset = margin.top + margin.bottom
    , width_offset = margin.left + margin.right;

  let cluster;

  let svg, yScale, xScale, data;

  function Dendrogram(colorScale) {

    let self = this;
    self.colorIndex = 0;
    self.colorScale = colorScale || colorbrewer.Set1["9"];
    self.cut = 0;

    /* Ensures all the colros have been used before skipping to the next */
    self.usedColors = new Array(self.colorScale.length);
    self.usedColors.fill(0);

    this.elbow = (d) => {
      return  "M" + d.source.x + "," + d.source.y
        + "H" + d.target.x + "V" + d.target.y ;
    };

    this.collapse = (dist, d) => {
      if (d.children) {
        if(d.dist < dist) {
          d._children = d.children;
          d._children.forEach(self.collapse.bind(this, dist));
          d.children = null;
          d.collapsed = true;
        }
        else {
          d.children.forEach(self.collapse.bind(this, dist));
        }
      }
    };

    // Toggle children on click.
    this.click = (d) => {
      if (d.children) {
        d._children = d.children;
        d.children = null;
        d.collapsed = true;
      } else {
        d.children = d._children;
        d._children = null;
        d.collapsed = false;
      }
      self.update(data);
    };

    this.setColor = function(cut, d) {
      if(d.dist < cut) {
        d.color = self.colorScale[self.colorIndex];
        self.usedColors[self.colorIndex]++;
      }
      else {
        d.color = "black";
        /* Ensures that the previous color was used */
        if(self.usedColors[self.colorIndex]){
          self.colorIndex++;
        }
      }
    };

    this.setupYAxis = function(data) {

      let yAxisScale = d3.scale.linear()
        .domain([data.children[0].dist, 0])
        .range([0, cluster.size()[1]]);

      let yAxis = d3.svg.axis()
        .orient("left")
        .scale(yAxisScale)
        /* Grid lines */
        // .innerTickSize(-width)
        // .outerTickSize(0)
        // .tickPadding(10)
      ;

      /* Add the axis to the svg */
      let axis = d3.select(svg.node().parentNode).append("g")
        .attr("class", "y axis")
        .attr("transform", `translate(${margin.left/2.0}, ${margin.top})`)
        .call(yAxis);

      // text label for the y axis
      axis.append("text")
        .attr("class", "y label")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left/2)
        .attr("x",0 - ( (height-height_offset) / 2))
        .attr("text-anchor", "middle")
        .attr("font-size", "20px")
        .attr("font-weight", "bold")
        .attr("dy", "1em")
        .text("Merge Level");
    };

    this.setupXAxis = function(data) {

      let values = data.filter((d)=> {if(d.y === cluster.size()[1]) return d.x});

      let axis = d3.select(svg.node().parentNode).insert("g", ":first-child")
      .attr("class", "x axis")
      .attr("transform", `translate(${margin.left/2.0}, ${height - height_offset})`);

      axis.append("line")
      .attr("x1", 0)
      .attr("x2", cluster.size()[0] + margin.left/2.0)
      .attr("y1", margin.top)
      .attr("y2", margin.top);

      axis.selectAll(".xlabel")
      .data(_.map(values, 'x'))
      .enter().append("line")
      .attr("class","ticks")
      .attr("x1", (d)=> d + margin.left/2.0)
      .attr("x2", (d)=> d + margin.left/2.0)
      .attr("y1", margin.top - 4)
      .attr("y2", margin.top + 8);

      axis.append("text")
      .attr("class", "x label")
      .attr("x", (width-width_offset)/2.0)
      .attr("y", margin.bottom)
      .attr("text-anchor", "middle")
      .attr("font-size", "20px")
      .attr("font-weight", "bold")
      .attr("dy", "1em")
      .text("Nodal Involvement");

    };
  }

  Dendrogram.prototype.update = function(root) {

    let self = this
      , nodes = cluster.nodes(root);

    /* Reset the coloring variables */
    self.colorIndex = 0;
    self.usedColors = new Array(self.colorScale.length);
    self.usedColors.fill(0);

    nodes.forEach(function(d) {
      if(d.dist) { if(!d.collapsed){ d.y = cluster.size()[1] - yScale(d.dist)} }
      delete d.color;
    });

    /* Assign color based on the cut */
    App.graphUtilities.iterativeInOrder(nodes[0], self.setColor.bind(self, self.cut));

    svg.selectAll("path.link").remove();
    svg.selectAll("g").remove();
    d3.selectAll(".x.axis").remove();

    self.setupXAxis(nodes);

    let links = cluster.links(nodes)
      , link = svg.selectAll(".link")
      .data(links)
      .enter().append("path")
      .attr("class", "link")
      .attr("d", self.elbow)
      .attr("stroke", (d) => { return (d.source.color === d.target.color) ? d.source.color : "black";});

    let node = svg.selectAll(".node")
      .data(nodes)
      .enter().append("g")
      .filter((d)=>{return d.dist > 0})
      .attr("class", "node")
      .attr("dist", (d)=>d.dist)
      .attr("transform", function(d) {return "translate(" + d.x + "," + d.y + ")";});

    node.append("circle")
      .attr("r", 4.5)
      .on("click", self.click);
    //
    // node.append("text")
    //   .attr("dx", function(d) { return d.children ? -8 : 8; })
    //   // .attr("dy", 3)
    //   .style("text-anchor", function(d) { return d.children ? "end" : "start"; })
    //   .text(function(d) {
    //     return d.node_id;
    //   });
  };

  Dendrogram.prototype.init = function(hier) {
    let self = this;
    data = hier;

    width = document.getElementsByTagName("body")[0].offsetWidth;
    height = document.getElementsByTagName("body")[0].offsetHeight;

    cluster = d3.layout.cluster()
      .size([width - width_offset, height - height_offset ]);

    svg = d3.select("#dendrogram").append("svg")
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform",`translate(${margin.left},${margin.top})`);

    /* Create the Y scale and axis */
    yScale = d3.scale.linear()
      .domain([0, data.children[0].dist])
      .range([0, cluster.size()[1]]);

    /* Setup the y-axis*/
    self.setupYAxis(data);

    data.children.forEach(self.collapse.bind(this, 2.3));
    self.update(data);
  };

  Dendrogram.prototype.setCut = function(cut) { this.cut = cut;};

  return Dendrogram;

})();