"use strict";

var App = App || {};

(function () {

    let self = {};

    let margin = {top: 20, right: 20, bottom: 20, left: 20},
        width = 1024 - margin.left - margin.right,
        height = 768 - margin.top - margin.bottom,
        depth = 4, root, i = 0, duration = 550, radius = 5;

    let tree = d3.tree()
        .size([width, height]);


    function buildHeap(hierarchy) {
        root = d3.hierarchy(hierarchy[hierarchy.length - 1]);
        root.x0 = width / 2;
        root.y0 = 0;

        root.children.forEach(collapse);

        update(root)
    }


    // just leaving this global so i can mess with it in the console
    let nodes;

    function update(source) {
    //  root = d3.hierarchy(newsource, function(d) { return d.children; });

        let treeData = tree(root);
        nodes = treeData.descendants();
        let links = treeData.descendants().slice(1);

        // ****************** Nodes section ***************************
        // Update the nodes...
        let node = self.g.selectAll('g.node')
            .data(nodes, function (d) {
                return d.id || (d.id = ++i);
            });

        // Enter any new modes at the parent's previous position.
        let nodeEnter = node.enter().append('g')
            .attr('class', 'node')
            .attr("transform", function (d) {
                return "translate(" + source.x0 + "," + source.y0 + ")";
            })
            .on('click', click);

        // Add Circle for the nodes
        nodeEnter.append('circle')
            .attr('class', 'node')
            .attr('r', 1e-6)
            .style("fill", function (d) {
                return d._children ? "lightsteelblue" : "#fff";
            });

        // Add labels for the nodes
        nodeEnter.append('text')
            .attr("dy", ".35em")
            .attr("x", function (d) {
                return d.children || d._children ? -13 : 13;
            })
            .attr("text-anchor", function (d) {
                return d.children || d._children ? "end" : "start";
            })
            .text(function (d) {
                return d.data.name;
            });

        // UPDATE
        let nodeUpdate = nodeEnter.merge(node);

        // Transition to the proper position for the node
        nodeUpdate.transition()
            .duration(duration)
            .attr("transform", function (d) {
                return "translate(" + d.x + "," + d.y + ")";
            });

        // Update the node attributes and style
        nodeUpdate.select('circle.node')
            .attr('r', 10)
            .style("fill", function (d) {
                return d._children ? "lightsteelblue" : "#fff";
            })
            .attr('cursor', 'pointer');


        // Remove any exiting nodes
        let nodeExit = node.exit().transition()
            .duration(duration)
            .attr("transform", function (d) {
                return "translate(" + source.x + "," + source.y + ")";
            })
            .remove();

        // On exit reduce the node circles size to 0
        nodeExit.select('circle')
            .attr('r', 1e-6);

        // On exit reduce the opacity of text labels
        nodeExit.select('text')
            .style('fill-opacity', 1e-6);

// ****************** links section ***************************

        // Update the links...
        let link = self.g.selectAll('path.link')
            .data(links, function (d) {
                return d.id;
            });

        // Enter any new links at the parent's previous position.
        let linkEnter = link.enter().insert('path', "g")
            .attr("class", "link")
            .attr('d', function (d) {
                let o = {y: source.y0, x: source.x0}
                return diagonal(o, o)

            });

        // UPDATE
        let linkUpdate = linkEnter.merge(link);

        // Transition back to the parent element position
        linkUpdate.transition()
            .duration(duration)
            .attr('d', function (d) {
                return diagonal(d, d.parent)
            });

        // Remove any exiting links
        let linkExit = link.exit().transition()
            .duration(duration)
            .attr('d', function (d) {
                let o = {x: source.x, y: source.y};
                return diagonal(o, o)
            })
            .remove();

        // Store the old positions for transition.
        nodes.forEach(function (d, i) {
            d.x0 = d.x;
            d.y0 = d.y;
        });

        //nodes[0].data.children = nodes[0].data._children;
        //nodes[0].data._children = null;


    }

    // Takes an index and an array and finds all the children.
    // returns an array which can be added to children of the root node to
    // make a json thing which can be used to make a d3.hierarchy();
    function getChildren(i, arr) {
        let childs = [];

        if (arr[i + 1 + i]) {
            childs[0] = {name: arr[i * 2 + 1], children: []};
            if (arr[i + i + 2]) {
                //  console.log(arr[i+1+ i], arr[i+i+2])
                childs[1] = {name: arr[i * 2 + 2], children: []};
            }
        }

        let nextin = i * 2 + 1;
        if (arr[nextin * 2 + 1]) {
            //  console.log('more children')
            childs[0].children = getChildren(nextin, arr);
            childs[0]._children = null;

            if (arr[nextin * 2 + 2]) {
                childs[1].children = getChildren(nextin + 1, arr);
                childs[1]._children = null;
            }
        }
        return childs;
    }


    // not called but kind of what I might use to annimate the swap thing while
    // balancing binary heaps
    function expandChildren(index, chi) {
        setTimeout(function () {
            //buildHeap([ 4, 3, 2, 9, 14, 29] );
            console.log('hooho', nodes);
            if (nodes[index].children === null) {
                nodes[0].children = [nodes[0]._children[chi]]
            }
            else {
                console.log(typeof nodes[0].children);
                nodes[index].children.push(nodes[index]._children[1])
            }


            update(nodes[index]);
            if (chi < 1) {
                expandChildren(0, 1)
            }
        }, 3000);

    }


    // Creates a curved (diagonal) path from parent to the child nodes
    // switched around all the x's and y's from orig so it's vertical
    function diagonal(s, d) {
        return `M ${s.x} ${s.y}
          C ${(s.x + d.x) / 2} ${s.y},
            ${(s.x + d.x) / 2} ${d.y},
            ${d.x} ${d.y}`;

    }


    // Toggle children on click.
    function click(d) {
        if (d.children) {
            d._children = d.children;
            d.children = null;
        } else {
            d.children = d._children;
            d._children = null;
        }

        update(d);
    }

// will make all the children null and store the real vals in _children
    function collapse(d) {

        if (d.children && d.depth > depth) {
            d._children = d.children;
            d.children = null;
            d._children.forEach(collapse)
        }
    }

    function construct_xAxis(pid, order) {

        self.svg = d3.select("body").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom);

        self.g = self.svg.append("g")
            .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");


        let scale = d3.scaleLinear()
            .domain(d3.extent(pid, (d, i) => {
                return i;
            }))
            .range([0, width]);

        // svg.selectAll(".linear")
        //     .data(pid)
        //     .enter().append("circle")
        //     .attr("r", 5)
        //     .attr("cy", 40)
        //     .attr("cx", function(d) { return scale(i); })

        // self.svg.append("g")
        //     .attr("class","x axis")
        //     .attr("transform","translate(0," + height + ")")
        //     .call(d3.axisBottom(scale));

        return scale;

    }

    function construct_hierarchy(linkage, pids, scale, order) {

        /* Extract the clusters and distance from the Z output*/
        let c1 = _.map(_.map(linkage, 'Cluster 1'), _.toInteger),
            c2 = _.map(_.map(linkage, 'Cluster 2'), _.toInteger),
            cluster_id = _.map(_.map(linkage, 'Cluster ID'), _.toInteger),
            distance = _.map(_.map(linkage, 'Distance'), _.toNumber);

        let nodes = [];
        distance.forEach(function (distance, i) {
            /* Root node */
            nodes.push({
                "name": cluster_id[i],
                "children": [
                    (c1[i] > pids.length) ? _.find(nodes, ["name", c1[i]]) :
                        {
                            "patient": pids[c1[i]], "id": c1[i], "type": "leaf",
                            // "y" : distance, "x":scale(_.indexOf(order, c1[i]))
                        }
                    ,
                    (c2[i] > pids.length) ? _.find(nodes, ["name", c2[i]]) :
                        {
                            "patient": c2[i], "id": c2[i], "type": "leaf",
                            // "y" : distance, "x": scale(_.indexOf(order, c2[i]))
                        }
                ],
                "y": distance,
                "type": "branch"
            })
        });
        return nodes;
    }

    queue()
        .defer(d3.csv, "data/csv/clusterLinkages.csv")
        .defer(d3.csv, "data/csv/patient_Groups_Ordering.csv")
        .await(function (error, linkage, groups) {
            if (error) {
                return console.warn(error);
            }

            /* Extract the data ids, groups, and order */
            let pid = _.map(_.map(groups, 'Aids'), _.toInteger),
                group = _.map(_.map(groups, 'Group'), _.toInteger),
                order = _.map(_.map(groups, 'Order'), _.toInteger);

            let scale = construct_xAxis(pid, order);

            let hierarchy = construct_hierarchy(linkage, pid, scale, order);
            buildHeap(hierarchy);

        });
})();