var sentimentMin = -275;
var sentimentMax = 1240;

var sentimentEmotionScale = function(value) {
    if (value < -175) return 0;
    if (value >= -175 && value < 0) return 1;
    if (value >= 0 && value < 500) return 3;
    if (value >= 500 && value < 1000) return 3;
    if (value >= 1000) return 4;
}

var sentimentColorScale = function(value) {
    if (value < -175) return "red";
    if (value >= -175 && value < 0) return "tomato";
    if (value >= 0 && value < 500) return "teal";
    if (value >= 500 && value < 1000) return "cobalt";
    if (value >= 1000) return "indigo";
}

console.log(sentimentColorScale(-200));
console.log(sentimentColorScale(-100));
console.log(sentimentColorScale(200));
console.log(sentimentColorScale(250));
console.log(sentimentColorScale(1001));

var margin = 10,
    outerDiameter = 700,
    innerDiameter = outerDiameter - margin - margin;

var x = d3.scale.linear()
    .range([0, innerDiameter]);

var y = d3.scale.linear()
    .range([0, innerDiameter]);

var colorScale = d3.scale.linear()
    .domain([-1, 5])
    .range(["hsl(152,80%,80%)", "hsl(228,30%,40%)"])
    .interpolate(d3.interpolateHcl);

function color(d) {
    if (d.depth == 3) {
        return sentimentColorScale(d.sentimentScore);
    } else if (d.depth == 2) {
        return "#dadada";
    } else if (d.depth == 1) {
        return "#f6f6f6";
    } else if (d.depth == 0) {
        return "none";
    }
}

function comparator(a, b) {
    return b.value - a.value;
}

var pack = d3.layout.pack()
    .padding(2)
    .sort(comparator)
    .size([innerDiameter, innerDiameter])
    .value(function(d) {
        return d.size;
    })

var svg = d3.select("body").append("svg")
    .attr("width", $(document).width() - margin)
    .attr("height", $(document).height() - margin)
    .append("g")
    .attr("transform", "translate(" + $(document).width() / 4 + "," + margin + ")");

d3.json("apps-large-compressed.json", function(error, root) {
    var focus = root,
        nodes = pack.nodes(root);

    console.log(root);
    svg.append("g").selectAll("circle")
        .data(nodes)
        .enter().append("circle")
        .attr("class", function(d) {
            if (d.depth != (focus.depth + 1)) {
                this.style["pointer-events"] = "none";
            } else if (d.depth == 3) {
                this.style["pointer-events"] = "none";
            } else {
                this.style["pointer-events"] = "auto";
            }
            if (d.depth == 2) {
                $(this).popover(getAppContent(d));
            }
            return d.parent ? d.children ? "node" : "node node--leaf" : "node node--root";
        })
        .attr("transform", function(d) {
            return "translate(" + d.x + "," + d.y + ")";
        })
        .attr("r", function(d) {
            return d.r;
        })
        .style("opacity", function(d) {
            if (d.depth == 3) {
                if (sentimentColorScale(d.sentimentScore) == "red" ||
                    sentimentColorScale(d.sentimentScore) == "tomato") {
                    return 0.5;
                } else if (sentimentColorScale(d.sentimentScore) == "teal") {
                    return 0.3;
                } else if (sentimentColorScale(d.sentimentScore) == "cobalt" ||
                    sentimentColorScale(d.sentimentScore) == "indigo") {
                    return 1;
                }
                return 0.3;
            } else if (d.depth != (focus.depth + 1)) {
                return 0.3;
            } else {
                return 0.7;
            }
        })
        .attr("data-toggle", "popover")
        .style("fill", function(d) {
            return color(d);
        })
        .on("mouseover", function(d) {})
        .on("click", function(d) {
            return zoom(focus == d ? root : d);
        });

    svg.append("g")
        .attr("class", "label-group")
        .selectAll("text")
        .data(nodes)
        .enter().append("text")
        .attr("class", "label")
        .attr("transform", function(d) {
            return "translate(" + d.x + "," + d.y + ")";
        })
        .style("fill-opacity", function(d) {
            return d.parent === root ? 1 : 0;
        })
        .style("display", function(d) {
            return d.parent === root ? null : "none";
        })
        .text(function(d) {
            if (d.depth != 3) {
                return d.name;
            }
        });

    var leaves = svg.selectAll(".label-group")
        .selectAll("text")
        .filter(function(d) {
            return d.depth == 3;
        });

    leaves.append("tspan")
        .attr("x", "0px")
        .attr("dy", "-10px")
        .text(function(d) {
            return "Version " + d.name;
        });

    leaves.append("tspan")
        .attr("x", "0")
        .attr("dy", "13px")
        .text(function(d) {
            return "Rated " + (d.avgRating).toFixed(2);;
        });

    d3.select(window)
        .on("click", function() {
            zoom(root);
        });

    function zoom(d, i) {

        var focus0 = focus;
        focus = d;

        var k = innerDiameter / d.r / 2;
        x.domain([d.x - d.r, d.x + d.r]);
        y.domain([d.y - d.r, d.y + d.r]);
        d3.event.stopPropagation();

        var transition = d3.selectAll("text,circle").transition()
            .duration(d3.event.altKey ? 7500 : 1000)
            .attr("transform", function(d) {
                return "translate(" + x(d.x) + "," + y(d.y) + ")";
            });

        transition.filter("circle")
            .style("opacity", function(d) {
                if (d.depth == 3) {

                    if (sentimentColorScale(d.sentimentScore) == "red" ||
                        sentimentColorScale(d.sentimentScore) == "tomato") {
                        return 0.5;
                    } else if (sentimentColorScale(d.sentimentScore) == "teal") {
                        return 0.3;
                    } else if (sentimentColorScale(d.sentimentScore) == "cobalt" ||
                        sentimentColorScale(d.sentimentScore) == "indigo") {
                        return 1;
                    }
                    return 0.3;
                } else if (d.depth != (focus.depth + 1)) {
                    return 0.3;
                } else {
                    return 0.7;
                }
            })
            .style("pointer-events", function(d) {
                if (d.depth > (focus.depth + 1)) {
                    return "none";
                } else if (d.depth == 3) {
                    return "none";
                } else {
                    return "auto";
                }
            })
            .attr("r", function(d) {
                return k * d.r;
            });

        transition.filter("text")
            .filter(function(d) {
                return d.parent === focus || d.parent === focus0;
            })
            .style("fill-opacity", function(d) {
                return d.parent === focus ? 1 : 0;
            })
            .each("start", function(d) {
                if (d.parent === focus) this.style.display = "inline";
            })
            .each("end", function(d) {
                if (d.parent !== focus) this.style.display = "none";
            });
    }

    function getAppContent(d) {
        var topic_html_string = `
            <hr style="margin: 10px"/>
            <div class="row">
                <div class="topic-heading col-md-12">Important Topics</div>
            </div>`;

        var topic_count = 0;
        for (var topic in d.dod.topics) {
            //if (topic_count > 6) break;
            topic_count++;
            topic_html_string += `
                <div class="row">
                <div class="topic-emtions col-md-5">` + getSentimentImage(d.dod.topics[topic]) + `</div>` +
                `<div class="topic-list col-md-7">` + topic + `</div>
                </div>`;
        }

        var starSpans = '';
        for (var i=0; i< d.dod.avgRating; i++) {
            starSpans += '<span>☆</span>'
        }
        return {
            "title": d.name,
            "html": "true",
            "container": "body",
            "trigger": "hover",
            "content": `<div style='text-align:center'>` +
                `<img class='appIcon'
                      style='display:inline'
                      src='` + d.dod.icon + `' height='50px' width='50px'/>` +
                `<div class="rating">`+starSpans+`</div>`+
                `</div>` + topic_html_string
        };
    }

    function getSentimentImage(sentimentScore) {
        var imageMap = ['angry', 'sad', 'indifferent', 'happy', 'ecstatic'];
        var type = imageMap[Math.round(sentimentEmotionScale(sentimentScore))];

        return `<img class="sentimentIcon"
            stlye="display:inline"
            src="img/` + type + `.png"
            height="25px"
            width="25px"
        />`;
    }

});