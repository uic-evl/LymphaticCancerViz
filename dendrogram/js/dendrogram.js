"use strict";
var App = App || {};

const Dendrogram = (function(){

  let svg, yScale, data, cluster;
  let width , height, margin, height_offset, width_offset;


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
      self.update();
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
        .innerTickSize(-width)
        .outerTickSize(0)
        .tickPadding(10)
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
        .attr("y", 0 - margin.left/2.0)
        .attr("x",0 - ( (height-height_offset) / 2.0))
        .attr("text-anchor", "middle")
        .attr("font-size", "20px")
        .attr("font-weight", "bold")
        .attr("dy", "1em")
        .text("Merge Level");
    };

    this.setupXAxis = function(data, png) {

      let values = data.filter((d) => {if(d.y === cluster.size()[1]) return d.x})
        , imageSize = _.clamp(Math.ceil((cluster.size()[0] + width_offset)/values.length), 20, margin.bottom/2.25);

      let axis = d3.select(svg.node().parentNode).insert("g", ":first-child")
      .attr("class", "x axis")
      .attr("transform", `translate(${margin.left/2.0}, ${height - height_offset})`);

      axis.append("line")
      .attr("x1", 0)
      .attr("x2", cluster.size()[0] + margin.left/2.0)
      .attr("y1", margin.top)
      .attr("y2", margin.top);

      // axis.selectAll(".xlabel")
      // .data(_.map(values, 'x'))
      // .enter().append("line")
      // .attr("class","ticks")
      // .attr("x1", (d)=> d + margin.left/2.0)
      // .attr("x2", (d)=> d + margin.left/2.0)
      // .attr("y1", margin.top - 4)
      // .attr("y2", margin.top + 8);

      let ticksRow1 = axis.selectAll(".ximages")
        .data(_.map(values, 'x')).enter()
        .append("g");

      let ticksRow2 = axis.selectAll(".ximages")
        .data(_.map(values, 'x')).enter()
        .append("g")
        .filter((d,i)=>{ return i % 2 });

      /* First row of graphs */
      ticksRow1.append("image")
        .attr("height", imageSize)
        .attr("x", (d)=> d - imageSize/2.0)
        .attr("y", margin.top)
        .attr("width", imageSize)
        .attr("xlink:href", png);

      /* Second row of graphs */
      ticksRow2.append("image")
        .attr("height", imageSize)
        .attr("x", (d)=> d - imageSize/2.0)
        .attr("y", imageSize + margin.top )
        .attr("width", imageSize)
        .attr("xlink:href", png);

      /* Tick marks under the axis */
      ticksRow1.append("line")
        .attr("class","ticks")
        .attr("x1", (d)=> d)
        .attr("x2", (d)=> d)
        .attr("y1", margin.top - 4)
        .attr("y2", margin.top + 8);

      axis.append("text")
      .attr("class", "x label")
      .attr("x", (width-margin.left/3.0)/2.0)
      .attr("y", imageSize*2.0 + margin.top)
      .attr("text-anchor", "middle")
      .attr("font-size", "20px")
      .attr("font-weight", "bold")
      .attr("dy", "1em")
      .text("Nodal Involvement");

    };

    this.setupTemplates = function(width, height) {
      this.templateCanvas = d3.select("#templates").append("canvas")
        .attr("width", width)
        .attr("height", height).node();

      this.templateCTX = this.templateCanvas.getContext("2d");
    };

    this.getGraph = function() {

      let me = this
        , img = new Image()
        , svgString = new XMLSerializer().serializeToString(d3.select("#templates svg").node())
        , graphSVG = new Blob([svgString], {type: "image/svg+xml;charset=utf-8"})
        , DOMURL = window.URL || window.webkitURL || window
        , url = DOMURL.createObjectURL(graphSVG)
        , canvasWidth = this.templateCanvas.width
        , canvasHeight = this.templateCanvas.height;

      return new Promise((function(resolve){

        img.onload = function() {
          /* Clear the canvas and draw the image */
          // me.templateCTX.fillStyle = "white";
          // me.templateCTX.fillRect(0, 0, canvasWidth, canvasHeight);
          me.templateCTX.drawImage(img, 0, 0);

          /* Access the PNG source, clean up the image, and resolve the promise */
          let png = me.templateCanvas.toDataURL("image/png");
          DOMURL.revokeObjectURL(png);

          resolve(png);
        };
        img.src = url;
      }));
    };

    /**/
    this.addInvolvementImages = function(data) {

      this.getGraph().then(function(png){ self.setupXAxis(data, png);});

    };
  }

  Dendrogram.prototype.update = function() {

    let self = this
      , nodes = cluster.nodes(data);

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

    self.addInvolvementImages(nodes);

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

  Dendrogram.prototype.init = function(hier, options) {
    let self = this;
    data = hier;

    width = document.getElementsByTagName("body")[0].offsetWidth;
    height = document.getElementsByTagName("body")[0].offsetHeight;

    margin = {
      left: Math.ceil(width/100)*10, top: Math.ceil(height/100)*2,
      right: Math.ceil(width/100)*5, bottom: Math.ceil(height/100)*20
    };
    height_offset = margin.top + margin.bottom;
    width_offset = margin.left + margin.right;

    /* Setup canvas and SVG */
    self.setupTemplates(options.width, options.height);

    cluster = d3.layout.cluster()
      .size([width - margin.right/2.0 - margin.left/3.0, height - height_offset ])
      /* A value of 1 makes the separation of all nodes equal */
      .separation((a,b)=>1);

    svg = d3.select("#dendrogram").append("svg")
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform",`translate(${margin.left/2.0},${margin.top})`);

    /* Create the Y scale and axis */
    yScale = d3.scale.linear()
      .domain([0, data.children[0].dist])
      .range([0, cluster.size()[1]]);

    /* Setup the y-axis*/
    self.setupYAxis(data);

    data.children.forEach(self.collapse.bind(this, 2.3));
    // self.update(data);
  };

  Dendrogram.prototype.setCut = function(cut) { this.cut = cut;};

  return Dendrogram;

})();