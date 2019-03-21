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
    self.images = {};
    self.lateralityMap = ["L", "R", "N", "N"];

    /* Ensures all the colros have been used before skipping to the next */
    self.usedColors = new Array(self.colorScale.length);
    self.usedColors.fill(0);

    this.elbow = (d) => { return  "M" + d.source.x + "," + d.source.y + "H" + d.target.x + "V" + d.target.y ; };

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
      .attr("y", 0 - margin.left/2.0)
      .attr("x",0 - ( (height-height_offset) / 2.0))
      .attr("text-anchor", "middle")
      .attr("font-size", "20px")
      .attr("font-weight", "bold")
      .attr("dy", "1em")
      .text("Merge Level");
    };

    this.setupXAxis = function(values) {
      let imageSize = _.clamp(Math.ceil((cluster.size()[0] + width_offset)/values.length), 20, margin.bottom/2.25);

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
      .data(values).enter()
      .append("g")
          .attr("id", function(d) { return d.node_id; });

      // let ticksRow2 = axis.selectAll(".ximages")
      //   .data(_.map(values, 'x')).enter()
      //   .append("g")
      //   .filter((d,i)=>{ return i % 2 });

      /* First row of graphs */
      ticksRow1.selectAll("involvements")
      .data(function(d,i){return d.images;}).enter().append("image")
      .attr("x", function(d) {return d.x - d.size/2.0})
      .attr("y", function(d, i) { return margin.top + d.size * i})
      .attr("width", d => d.size)
      .attr("height", d => d.size)
      .attr("xlink:href", d => d.src);

      // /* Second row of graphs */
      // ticksRow2.append("image")
      //   .attr("height", imageSize)
      //   .attr("x", (d)=> d - imageSize/2.0)
      //   .attr("y", imageSize + margin.top )
      //   .attr("width", imageSize)
      //   .attr("xlink:href", png);

      /* Tick marks under the axis */
      // ticksRow1.append("line")
      //   .attr("class","ticks")
      //   .attr("x1", d => d.x)
      //   .attr("x2", d => d.x)
      //   .attr("y1", margin.top - 4)
      //   .attr("y2", margin.top + 8);

      axis.append("text")
      .attr("class", "x label")
      .attr("x", (width-margin.left/3.0)/2.0)
      .attr("y", imageSize * 2.0 + margin.top)
      .attr("text-anchor", "middle")
      .attr("font-size", "20px")
      .attr("font-weight", "bold")
      .attr("dy", "1em")
      .text("Nodal Involvement");

    };

    this.setupTemplate = function(id) {
      return d3.select("#templates")
      .append("canvas")
      .attr("id", `c${id}`)
      .attr("width", self.templateWidth)
      .attr("height", self.templateHeight).node();
    };

    this.getGraph = function(svg, canvas) {
      let ctx = canvas.getContext("2d")
          , img = new Image()
          , svgString = new XMLSerializer().serializeToString(svg)
          , graphSVG = new Blob([svgString], {type: "image/svg+xml;charset=utf-8"})
          , DOMURL = window.URL || window.webkitURL || window
          , url = DOMURL.createObjectURL(graphSVG);

      return new Promise((function(resolve){

        img.onload = function() {
          ctx.drawImage(img, 0, 0);
          /* Access the PNG source, clean up the image, and resolve the promise */
          let png = canvas.toDataURL("image/png");
          DOMURL.revokeObjectURL(png);
          resolve(png);
        };
        img.src = url;
      }));
    };

    this.renderBubbles = function(key, consensus, non_consensus, cb){
      let group_promises = [];
      consensus
          .forEach(function(inv,i){
            
            /* No nodes */
            if(!inv.length && !non_consensus[i].length) {return group_promises.push(Promise.resolve(null))}

            /* Get the hash id based on the nodal involvements */
            let hash = key + i //inv.sort().join("").replace(/\D/g,'')
                , consensusSVG = d3.select(`#templates #s${hash}`), canvas;

            if(!self.images[hash]) {
              /* Clone the graph SVG and canvas templates */
              let graphSVG = self.graphSVG.cloneNode(true);
              graphSVG.setAttribute("id", `s${hash}`);

              canvas = self.setupTemplate(hash);

              d3.select("#templates").node().appendChild(graphSVG);
              consensusSVG = d3.select(`#templates #s${hash}`);

              /* Create the connected components for the bubble groups */
              let bubbles = App.GraphFactory.extractBubbleGroups([inv, non_consensus[i]], [self.lateralityMap[i], self.lateralityMap[i+2]]);
              App.GraphFactory.createBubbles(consensusSVG, bubbles);

              group_promises.push(new Promise(function(resolve){
                self.getGraph(consensusSVG.node(), canvas).then(function(png) {
                  /* Clean up */
                  d3.select(`#templates #s${hash}`).remove();
                  d3.select(`#templates #c${hash}`).remove();

                  self.images[hash] = png;
                  resolve(png)
                });
              }));
            }
            /* The image was already stored */
            else {
              group_promises.push(Promise.resolve(self.images[hash]))
            }
          });

      /* Resolve with the two images */
      Promise.all(group_promises).then((values)=>{
        cb(values);
      })

    };

    /**/
    this.addInvolvementImages = function(data) {

      let self = this;

      self.graphSVG = d3.select("#templates svg").node();
      let values = data.filter((d) => {if(d.y === cluster.size()[1]) return d.x})
          , imageSize = _.clamp(Math.ceil((cluster.size()[0] + width_offset)/values.length), 20, margin.bottom/2.25)
          , consensus = App.graphUtilities.getConsensus(_.map(values, "node_id"))
          , promises = [], order = [];

      _.forIn(consensus, function(involvement, key){

        order.push(parseInt(key));
        promises.push(new Promise(function(resolve){
          let swapped = 1;

          involvement.consensus = involvement.consensus.sort((a, b) => {
            swapped = b.length - a.length;
            return b.length - a.length;
          });

          involvement.non_consensus = involvement.non_consensus.sort(O_o => {return swapped});

          self.renderBubbles(key,
              involvement.consensus,
              involvement.non_consensus,
              resolve);
        }));

      });

      Promise.all(promises).then(function(images){
        images.forEach(function(pngs,i){
          let value = _.find(values, {"node_id":order[i]});

          value.images = [];
          pngs.forEach(png=>{
            value.images.push({src: png, size:imageSize, x: value.x, y: value.y})
          });

        });
        self.setupXAxis(values);
      });

    };
  }

  Dendrogram.prototype.update = function() {

    let self = this,
        nodes = cluster.nodes(data);

    /* Reset the coloring variables */
    self.colorIndex = 0;
    self.usedColors = new Array(self.colorScale.length);
    self.usedColors.fill(0);

    nodes.forEach(function(d) {
      if(d.dist) { if(!d.collapsed){ d.y = cluster.size()[1] - yScale(d.dist)} }
      delete d.color;
    });

    /* Assign color based on the cut */
    App.graphUtilities.iterativeInOrder(nodes[0], function(node){ self.setColor(self.cut, node);});

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
    .attr("r", 6)
    .on("click", self.click);
    //
    // node.append("text")
    //   .attr("dx", function(d) { return d.children ? -8 : 8; })
    //   .attr("dy", 3)
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
    self.templateWidth = options.width;
    self.templateHeight = options.height;

    //self.setupTemplates(options.width, options.height);

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

    /* Setup consensus groups*/
    App.graphUtilities.getGroupConsensus(cluster.nodes(data), 0.66);

    data.children.forEach(self.collapse.bind(this, 6.0));
  };

  Dendrogram.prototype.setCut = function(cut) { this.cut = cut;};

  return Dendrogram;

})();