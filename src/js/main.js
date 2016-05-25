var template = {
    nodes: [
        {
            name: "1A",
            x: 175,
            y: 75
        },
        {
            name: "1B",
            x: 125,
            y: 75
        },
        {
            name: "2",
            x: 65,
            y: 100
        },
        {
            name: "3",
            x: 100,
            y: 150
        },
        {
            name: "4A",
            x: 100,
            y: 225
        },
        {
            name: "5A",
            x: 25,
            y: 150
        },
        {
            name: "5B",
            x: 25,
            y: 225
        },
        {
            name: "6",
            x: 200,
            y: 150
        },
        {
            name: "7A",
            x: 60,
            y: 50
        }
    ],
    links: [{
        source: 0,
        target: 1
    },
    {
        source: 1,
        target: 2
    },
    {
        source: 2,
        target: 3
    },
    {
        source: 3,
        target: 4
    },
    {
        source: 4,
        target: 6
    },
    {
        source: 4,
        target: 7
    },
    {
        source: 5,
        target: 7
    },
    {
        source: 5,
        target: 6
    },
    {
        source: 5,
        target: 2
    },
    {
        source: 2,
        target: 8
    },
    {
        source: 1,
        target: 7
    },
    {
    source: 0,
    target: 7
    }
    ]
};

var sites = [

    {
        patient: '1',
        nodes: ['1B', '2'],
        position: 'Right'
    },
    {
        patient: '2',
        nodes: ['2'],
        position: 'Left'
    },
    {
        patient: '3',
        nodes: [],
        position: 'Right'
    },
    {
        patient: '4',
        nodes: ['2'],
        position: 'Left'
    },
    {
        patient: '5',
        nodes: ['4A', '2', '3'],
        position: 'Right'
    },
    {
        patient: '6',
        nodes: ['2', '3'],
        position: 'Left'
    },
    {
        patient: '7',
        nodes: [],
        position: 'Left'
    },
    {
        patient: '8',
        nodes: ['2'],
        position: 'Right'
    },
    {
        patient: '9',
        nodes: ['2'],
        position: 'Bilateral'
    },
    {
        patient: '10',
        nodes: [],
        position: 'Right'
    },
    {
        patient: '11',
        nodes: ['7A', '2', '2'],
        position: 'Right'
    }

];

var groupPath = function(d) {

    // add fake points to the hull if there are < 3
    var fakePoints = [];
    if (d.values.length < 3) {
        fakePoints = [ [d.values[0].x + 0.001, d.values[0].y - 0.001],
            [d.values[0].x - 0.001, d.values[0].y + 0.001],
            [d.values[0].x - 0.001, d.values[0].y + 0.001]];
    }

    // construct the convex hull
    var hull = "M" +
        d3.geom.hull(d.values.map(function(i) {
            return [i.x, i.y]; }
        ).concat(fakePoints)) .join("L") + "Z";

    return hull;
};

var fill = d3.scale.category10();

var groupFill = function(d, i) { return '#de2d26'; };

function createNetwork(div, data, tumors){

    var svg = d3.select(div)
        .append("svg")
        .attr("width", 250)
        .attr("height", 250);

    var groups = d3.nest().key(function(d) {
        return (_.indexOf(tumors, d.name) >= 0) ? d & 3 : 1;
    }).entries(data.nodes);

    groups = _.filter(groups, function(o) { return o.key === "0"; });

    /** Adds the links between the nodes **/
    var links = svg.selectAll("link")
        .data(data.links)
        .enter()
        .append("line")
        .attr("class", "link")
        .attr("x1", function(l) {
            var sourceNode = data.nodes.filter(function(d, i) {
                return i == l.source
            })[0];

            d3.select(this).attr("y1", sourceNode.y);
            return sourceNode.x
        })
        .attr("x2", function(l) {
            var targetNode = data.nodes.filter(function(d, i) {
                return i == l.target
            })[0];

            d3.select(this).attr("y2", targetNode.y);
            return targetNode.x
        })
        .attr("fill", "none")
        .attr("stroke", "black");

    var nodes = svg.selectAll("circle.node")
        .append('g')
        .data(data.nodes)
        .enter();

    /** Adds the nodes **/
    nodes
        .append("circle")
        .attr("class", "node")
        .attr("cx", function(d) {
            return d.x
        })
        .attr("cy", function(d) {
            return d.y
        })
        .attr("r", 15)
        .attr("fill", function(d, i) {
            return "#f0f0f0";
            // if(d.name == '1A') return '#feb24c';
            // else if(d.name == '1B') return '#fd8d3c';
            // else if(d.name == '2') return '#c7e9c0';
            // else if(d.name == '3') return '#74c476';
            // else if(d.name == '4A') return '#41ae76';
            // else if(d.name == '5A') return '#9ecae1';
            // else if(d.name == '5B') return '#7fcdbb';
            // else if(d.name == '6') return '#fee0d2';
            // else if(d.name == '7A') return '#edf8b1';
        })
        .style("stroke", "gray");
//        .style('opacity', '0.75');

    /** Adds the text ontop of the nodes **/
    nodes
        .append("text")
        .attr("x", function(d) {
            return d.x;
        })
        .attr("y", function(d) {
            return d.y;
        })
        .attr("dy", ".35em")
        .style({'text-anchor':'middle', 'fill':'black'})
        .text(function(d) {
            return d.name;
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
        .attr("d", groupPath);
}

function createVisualizations(ranking){

    ranking.forEach(function(patient){
        createNetwork('#patient' + patient.patient, template, patient.nodes);
    });

}