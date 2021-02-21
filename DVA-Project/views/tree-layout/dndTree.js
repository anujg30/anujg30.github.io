/*
0. Link bubbles and trees
1. Change name to all apps
7. Add details on demand to compare apps
8. Color circles by sentiment and popularity
11. Add number of version to filtering
10. Change to modals
*/

// Get JSON data
treeJSON = d3.json("apps-large-compressed.json", function(error, treeData) {

    // Calculate total nodes, max label length
    var totalNodes = 0;
    var maxLabelLength = 0;
    // variables for drag/drop
    var selectedNode = null;
    var draggingNode = null;
    // panning variables
    var panSpeed = 200;
    var panBoundary = 20; // Within 20px from edges will pan when dragging.
    // Misc. variables
    var i = 0;
    var duration = 750;
    var root;
    var treeUtilities = parent.treeUtilities;

    // size of the diagram
    var viewerWidth = $(document).width() * 0.60;
    var viewerHeight = $(document).height() - 15;

    // var viewerWidth = $('body').width();
    // var viewerHeight = $('body').height;


    var tree = d3.layout.tree()
        .size([viewerHeight, viewerWidth]);

    // define a d3 diagonal projection for use by the node paths later on.
    var diagonal = d3.svg.diagonal()
        .projection(function(d) {
            return [d.y, d.x];
        });

    // A recursive helper function for performing some setup by walking through all nodes

    function visit(parent, visitFn, childrenFn) {
        if (!parent) return;

        visitFn(parent);

        var children = childrenFn(parent);
        if (children) {
            var count = children.length;
            for (var i = 0; i < count; i++) {
                visit(children[i], visitFn, childrenFn);
            }
        }
    }

    // Call visit function to establish maxLabelLength
    visit(treeData, function(d) {
        totalNodes++;
        maxLabelLength = Math.max(d.name.length, maxLabelLength);

    }, function(d) {
        return d.children && d.children.length > 0 ? d.children : null;
    });


    // sort the tree according to the node names

    function sortTree() {
        tree.sort(function(a, b) {
            return b.name.toLowerCase() < a.name.toLowerCase() ? 1 : -1;
        });
    }
    // Sort the tree initially incase the JSON isn't in a sorted order.
    sortTree();

    // TODO: Pan function, can be better implemented.

    function pan(domNode, direction) {
        var speed = panSpeed;
        if (panTimer) {
            clearTimeout(panTimer);
            translateCoords = d3.transform(svgGroup.attr("transform"));
            if (direction == 'left' || direction == 'right') {
                translateX = direction == 'left' ? translateCoords.translate[0] + speed : translateCoords.translate[0] - speed;
                translateY = translateCoords.translate[1];
            } else if (direction == 'up' || direction == 'down') {
                translateX = translateCoords.translate[0];
                translateY = direction == 'up' ? translateCoords.translate[1] + speed : translateCoords.translate[1] - speed;
            }
            scaleX = translateCoords.scale[0];
            scaleY = translateCoords.scale[1];
            scale = zoomListener.scale();
            svgGroup.transition().attr("transform", "translate(" + translateX + "," + translateY + ")scale(" + scale + ")");
            d3.select(domNode).select('g.node').attr("transform", "translate(" + translateX + "," + translateY + ")");
            zoomListener.scale(zoomListener.scale());
            zoomListener.translate([translateX, translateY]);
            panTimer = setTimeout(function() {
                pan(domNode, speed, direction);
            }, 50);
        }
    }

    // Define the zoom function for the zoomable tree

    function zoom() {
        svgGroup.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
    }


    // define the zoomListener which calls the zoom function on the "zoom" event constrained within the scaleExtents
    var zoomListener = d3.behavior.zoom().scaleExtent([0.1, 3]).on("zoom", zoom);

    function initiateDrag(d, domNode) {
        draggingNode = d;
        d3.select(domNode).select('.ghostCircle').attr('pointer-events', 'none');
        d3.selectAll('.ghostCircle').attr('class', 'ghostCircle show');
        d3.select(domNode).attr('class', 'node activeDrag');

        svgGroup.selectAll("g.node").sort(function(a, b) { // select the parent and sort the path's
            if (a.id != draggingNode.id) return 1; // a is not the hovered element, send "a" to the back
            else return -1; // a is the hovered element, bring "a" to the front
        });
        // if nodes has children, remove the links and nodes
        if (nodes.length > 1) {
            // remove link paths
            links = tree.links(nodes);
            nodePaths = svgGroup.selectAll("path.link")
                .data(links, function(d) {
                    return d.target.id;
                }).remove();
            // remove child nodes
            nodesExit = svgGroup.selectAll("g.node")
                .data(nodes, function(d) {
                    return d.id;
                }).filter(function(d, i) {
                    if (d.id == draggingNode.id) {
                        return false;
                    }
                    return true;
                }).remove();
        }

        // remove parent link
        parentLink = tree.links(tree.nodes(draggingNode.parent));
        svgGroup.selectAll('path.link').filter(function(d, i) {
            if (d.target.id == draggingNode.id) {
                return true;
            }
            return false;
        }).remove();

        dragStarted = null;
    }

    // define the baseSvg, attaching a class for styling and the zoomListener
    var baseSvg = d3.select("#tree-container").append("svg")
        .attr("width", viewerWidth)
        .attr("height", viewerHeight)
        .attr("class", "overlay")
        .call(zoomListener);


    // Define the drag listeners for drag/drop behaviour of nodes.
    dragListener = d3.behavior.drag()
        .on("dragstart", function(d) {
            if (d == root) {
                return;
            }
            dragStarted = true;
            nodes = tree.nodes(d);
            d3.event.sourceEvent.stopPropagation();
            // it's important that we suppress the mouseover event on the node being dragged. Otherwise it will absorb the mouseover event and the underlying node will not detect it d3.select(this).attr('pointer-events', 'none');
        })
        .on("drag", function(d) {
            if (d == root) {
                return;
            }
            if (dragStarted) {
                domNode = this;
                initiateDrag(d, domNode);
            }

            // get coords of mouseEvent relative to svg container to allow for panning
            relCoords = d3.mouse($('svg').get(0));
            if (relCoords[0] < panBoundary) {
                panTimer = true;
                pan(this, 'left');
            } else if (relCoords[0] > ($('svg').width() - panBoundary)) {

                panTimer = true;
                pan(this, 'right');
            } else if (relCoords[1] < panBoundary) {
                panTimer = true;
                pan(this, 'up');
            } else if (relCoords[1] > ($('svg').height() - panBoundary)) {
                panTimer = true;
                pan(this, 'down');
            } else {
                try {
                    clearTimeout(panTimer);
                } catch (e) {

                }
            }

            d.x0 += d3.event.dy;
            d.y0 += d3.event.dx;
            var node = d3.select(this);
            node.attr("transform", "translate(" + d.y0 + "," + d.x0 + ")");
            updateTempConnector();
        }).on("dragend", function(d) {
            if (d == root) {
                return;
            }
            domNode = this;
            if (selectedNode) {
                // now remove the element from the parent, and insert it into the new elements children
                var index = draggingNode.parent.children.indexOf(draggingNode);
                if (index > -1) {
                    draggingNode.parent.children.splice(index, 1);
                }
                if (typeof selectedNode.children !== 'undefined' || typeof selectedNode._children !== 'undefined') {
                    if (typeof selectedNode.children !== 'undefined') {
                        selectedNode.children.push(draggingNode);
                    } else {
                        selectedNode._children.push(draggingNode);
                    }
                } else {
                    selectedNode.children = [];
                    selectedNode.children.push(draggingNode);
                }
                // Make sure that the node being added to is expanded so user can see added node is correctly moved
                expand(selectedNode);
                sortTree();
                endDrag();
            } else {
                endDrag();
            }
        });

    function endDrag() {
        selectedNode = null;
        d3.selectAll('.ghostCircle').attr('class', 'ghostCircle');
        d3.select(domNode).attr('class', 'node');
        // now restore the mouseover event or we won't be able to drag a 2nd time
        d3.select(domNode).select('.ghostCircle').attr('pointer-events', '');
        updateTempConnector();
        if (draggingNode !== null) {
            update(root);
            centerNode(draggingNode);
            draggingNode = null;
        }
    }

    // Helper functions for collapsing and expanding nodes.

    function collapse(d) {
        if (d.children) {
            d._children = d.children;
            d._children.forEach(collapse);
            d.children = null;
        }
    }

    function expand(d) {
        if (d._children) {
            d.children = d._children;
            d.children.forEach(expand);
            d._children = null;
        }
    }

    var overCircle = function(d) {
        selectedNode = d;
        updateTempConnector();
    };
    var outCircle = function(d) {
        selectedNode = null;
        updateTempConnector();
    };

    // Function to update the temporary connector indicating dragging affiliation
    var updateTempConnector = function() {
        var data = [];
        if (draggingNode !== null && selectedNode !== null) {
            // have to flip the source coordinates since we did this for the existing connectors on the original tree
            data = [{
                source: {
                    x: selectedNode.y0,
                    y: selectedNode.x0
                },
                target: {
                    x: draggingNode.y0,
                    y: draggingNode.x0
                }
            }];
        }
        var link = svgGroup.selectAll(".templink").data(data);

        link.enter().append("path")
            .attr("class", "templink")
            .attr("d", d3.svg.diagonal())
            .attr('pointer-events', 'none');

        link.attr("d", d3.svg.diagonal());

        link.exit().remove();
    };

    // Function to center node when clicked/dropped so node doesn't get lost when collapsing/moving with large amount of children.

    function centerNode(source) {
        scale = zoomListener.scale();
        x = -source.y0;
        y = -source.x0;
        x = x * scale + viewerWidth / 2;
        y = y * scale + viewerHeight / 2;
        d3.select('g').transition()
            .duration(duration)
            .attr("transform", "translate(" + x + "," + y + ")scale(" + scale + ")");
        zoomListener.scale(scale);
        zoomListener.translate([x, y]);
    }

    // Toggle children function

    function toggleChildren(d) {
        if (d.children) {
            d._children = d.children;
            d.children = null;
        } else if (d._children) {
            d.children = d._children;
            d._children = null;
        }
        return d;
    }

    // Toggle children on click.

    function click(d) {
        if (d3.event.defaultPrevented) return; // click suppressed
        d = toggleChildren(d);
        update(d);
        centerNode(d);
        addToComparisonList(d);
    }

    function filteredClick(newRoot, d) {
        if (d3.event.defaultPrevented) return; // click suppressed
        d = toggleChildren(d);
        filteredUpdate(newRoot, d);
        centerNode(d);
        addToComparisonList(d);
    }

    function update(source) {
        // Compute the new height, function counts total children of root node and sets tree height accordingly.
        // This prevents the layout looking squashed when new nodes are made visible or looking sparse when nodes are removed
        // This makes the layout more consistent.
        var levelWidth = [1];
        var childCount = function(level, n) {

            if (n.children && n.children.length > 0) {
                if (levelWidth.length <= level + 1) levelWidth.push(0);

                levelWidth[level + 1] += n.children.length;
                n.children.forEach(function(d) {
                    childCount(level + 1, d);
                });
            }
        };
        childCount(0, root);
        var newHeight = d3.max(levelWidth) * 25; // 25 pixels per line
        tree = tree.size([newHeight, viewerWidth]);

        // Compute the new tree layout.
        var nodes = tree.nodes(root).reverse(),
            links = tree.links(nodes);

        // Set widths between levels based on maxLabelLength.
        // Set meta data for the current data
        // Set the max app count found so far
        // Set the max number of review found so far
        // Set the categories found so far
        nodes.forEach(function(d) {
            if (d.depth == 1 && d._children) {
                treeUtilities.setMaxApps(d._children.length);
                treeUtilities.addCategory(d.name);
                treeUtilities.resetMaxReviews();
                treeUtilities.resetSentiments();
                for (var appIndex in d._children) {
                    treeUtilities.setMaxReviews(d._children[appIndex].dod.numReviews);
                    treeUtilities.setMinSentiment(d._children[appIndex].dod.sentimentScore);
                    treeUtilities.setMaxSentiment(d._children[appIndex].dod.sentimentScore);
                }
            }
            d.y = (d.depth * (maxLabelLength * 10)); //maxLabelLength * 10px
            // alternatively to keep a fixed scale one can set a fixed depth per level
            // Normalize for fixed-depth by commenting out below line
            // d.y = (d.depth * 500); //500px per level.
        });

        // Update the nodes…
        node = svgGroup.selectAll("g.node")
            .data(nodes, function(d) {
                return d.id || (d.id = ++i);
            });

        // Enter any new nodes at the parent's previous position.
        var nodeEnter = node.enter().append("g")
            .call(dragListener)
            .attr("class", "node")
            .attr("transform", function(d) {
                return "translate(" + source.y0 + "," + source.x0 + ")";
            })
            .on('click', click);

        nodeEnter.append("circle")
            .attr('class', 'nodeCircle')
            .attr("r", 0)
            .style("fill", function(d) {
                return d._children ? "lightsteelblue" : "#fff";
            });

        nodeEnter.append("text")
            .attr("x", function(d) {
                return d.children || d._children ? -15 : 15;
            })
            .attr("dy", ".35em")
            .attr('class', 'nodeText')
            .attr("text-anchor", function(d) {
                return d.children || d._children ? "end" : "start";
            })
            .text(function(d) {
                return d.name;
            })
            .style("fill-opacity", 0);

        // phantom node to give us mouseover in a radius around it
        nodeEnter.append("circle")
            .attr('class', 'ghostCircle')
            .attr("r", 30)
            .attr("opacity", 0.2) // change this to zero to hide the target area
        .style("fill", "red")
            .attr('pointer-events', 'mouseover')
            .on("mouseover", function(node) {
                overCircle(node);
            })
            .on("mouseout", function(node) {
                outCircle(node);
            });

        // Update the text to reflect whether node has children or not.
        node.select('text')
            .attr("x", function(d) {
                return d.children || d._children ? -15 : 10;
            })
            .attr("text-anchor", function(d) {
                return d.children || d._children ? "end" : "start";
            })
            .text(function(d) {
                return d.name;
            });

        var categoryRadiusScale = d3.scale.linear().domain([0, treeUtilities.getMaxApps()]).range([0, 10]);
        var appRadiusScale = d3.scale.linear().domain([0, treeUtilities.getMaxReviews()]).range([0, 10]);
        // Change the circle fill depending on whether it has children and is collapsed
        node.select("circle.nodeCircle")
            .attr("r", function(d) {
                if (d.depth == 1 && d._children) {
                    // Categories radius is based on the number of apps
                    return categoryRadiusScale(d._children.length);
                } else if (d.depth == 1 && d.children) {
                    // Categories radius is based on the number of apps
                    return categoryRadiusScale(d.children.length);
                } else if (d.depth == 2) {
                    return appRadiusScale(d.dod.numReviews);
                } else if (d.depth == 3) {
                    return appRadiusScale(d.size) > 2 ? appRadiusScale(d.size) : 2;
                }
                // Random
                return 5;
            })
            .style("fill", function(d) {
                return d._children ? "lightsteelblue" : "#fff";
            });

        // Transition nodes to their new position.
        var nodeUpdate = node.transition()
            .duration(duration)
            .attr("transform", function(d) {
                return "translate(" + d.y + "," + d.x + ")";
            });

        // Fade the text in
        nodeUpdate.select("text")
            .style("fill-opacity", 1);

        // Transition exiting nodes to the parent's new position.
        var nodeExit = node.exit().transition()
            .duration(duration)
            .attr("transform", function(d) {
                return "translate(" + source.y + "," + source.x + ")";
            })
            .remove();

        nodeExit.select("circle")
            .attr("r", 0);

        nodeExit.select("text")
            .style("fill-opacity", 0);

        // Update the links…
        var link = svgGroup.selectAll("path.link")
            .data(links, function(d) {
                return d.target.id;
            });

        // Enter any new links at the parent's previous position.
        link.enter().insert("path", "g")
            .attr("class", "link")
            .attr("d", function(d) {
                var o = {
                    x: source.x0,
                    y: source.y0
                };
                return diagonal({
                    source: o,
                    target: o
                });
            });

        // Transition links to their new position.
        link.transition()
            .duration(duration)
            .attr("d", diagonal);

        // Transition exiting nodes to the parent's new position.
        link.exit().transition()
            .duration(duration)
            .attr("d", function(d) {
                var o = {
                    x: source.x,
                    y: source.y
                };
                return diagonal({
                    source: o,
                    target: o
                });
            })
            .remove();

        // Stash the old positions for transition.
        nodes.forEach(function(d) {
            d.x0 = d.x;
            d.y0 = d.y;
        });
    }

    function filteredUpdate(newRoot, source) {
        // Compute the new height, function counts total children of newRoot node and sets tree height accordingly.
        // This prevents the layout looking squashed when new nodes are made visible or looking sparse when nodes are removed
        // This makes the layout more consistent.
        var levelWidth = [1];
        var childCount = function(level, n) {

            if (n.children && n.children.length > 0) {
                if (levelWidth.length <= level + 1) levelWidth.push(0);

                levelWidth[level + 1] += n.children.length;
                n.children.forEach(function(d) {
                    childCount(level + 1, d);
                });
            }
        };
        childCount(0, newRoot);
        var newHeight = d3.max(levelWidth) * 25; // 25 pixels per line
        tree = tree.size([newHeight, viewerWidth]);

        // Compute the new tree layout.
        var nodes = tree.nodes(newRoot).reverse(),
            links = tree.links(nodes);

        // Set widths between levels based on maxLabelLength.
        // Set meta data for the current data
        // Set the max app count found so far
        // Set the max number of review found so far
        // Set the categories found so far
        nodes.forEach(function(d) {
            // console.log(d);
            if (d.depth == 1 && d._children) {
                treeUtilities.setMaxApps(d._children.length);
                treeUtilities.addCategory(d.name);
                treeUtilities.resetMaxReviews();
                treeUtilities.resetSentiments();
                for (var appIndex in d._children) {
                    treeUtilities.setMaxReviews(d._children[appIndex].dod.numReviews);
                    treeUtilities.setMinSentiment(d._children[appIndex].dod.sentimentScore);
                    treeUtilities.setMaxSentiment(d._children[appIndex].dod.sentimentScore);
                }
            }
            d.y = (d.depth * (maxLabelLength * 10)); //maxLabelLength * 10px
            // alternatively to keep a fixed scale one can set a fixed depth per level
            // Normalize for fixed-depth by commenting out below line
            // d.y = (d.depth * 500); //500px per level.
        });

        // Update the nodes…
        node = svgGroup.selectAll("g.node")
            .data(nodes, function(d) {
                return d.id || (d.id = ++i);
            });

        // Enter any new nodes at the parent's previous position.
        var nodeEnter = node.enter().append("g")
            .call(dragListener)
            .attr("class", "node")
            .attr("transform", function(d) {
                return "translate(" + source.y0 + "," + source.x0 + ")";
            })
            .on('click', function(d) {
                filteredClick(newRoot, d);
            });

        nodeEnter.append("circle")
            .attr('class', 'nodeCircle')
            .attr("r", 0)
            .style("fill", function(d) {
                return d._children ? "lightsteelblue" : "#fff";
            });

        nodeEnter.append("text")
            .attr("x", function(d) {
                return d.children || d._children ? -15 : 15;
            })
            .attr("dy", ".35em")
            .attr('class', 'nodeText')
            .attr("text-anchor", function(d) {
                return d.children || d._children ? "end" : "start";
            })
            .text(function(d) {
                return d.name;
            })
            .style("fill-opacity", 0);

        // phantom node to give us mouseover in a radius around it
        nodeEnter.append("circle")
            .attr('class', 'ghostCircle')
            .attr("r", 30)
            .attr("opacity", 0.2) // change this to zero to hide the target area
        .style("fill", "red")
            .attr('pointer-events', 'mouseover')
            .on("mouseover", function(node) {
                overCircle(node);
            })
            .on("mouseout", function(node) {
                outCircle(node);
            });

        // Update the text to reflect whether node has children or not.
        node.select('text')
            .attr("x", function(d) {
                return d.children || d._children ? -15 : 10;
            })
            .attr("text-anchor", function(d) {
                return d.children || d._children ? "end" : "start";
            })
            .text(function(d) {
                return d.name;
            });

        var categoryRadiusScale = d3.scale.linear().domain([0, treeUtilities.getMaxApps()]).range([0, 10]);
        var appRadiusScale = d3.scale.linear().domain([0, treeUtilities.getMaxReviews()]).range([0, 10]);
        // Change the circle fill depending on whether it has children and is collapsed
        node.select("circle.nodeCircle")
            .attr("r", function(d) {
                if (d.depth == 1 && d._children) {
                    // Categories radius is based on the number of apps
                    return categoryRadiusScale(d._children.length);
                } else if (d.depth == 1 && d.children) {
                    // Categories radius is based on the number of apps
                    return categoryRadiusScale(d.children.length);
                } else if (d.depth == 2) {
                    return appRadiusScale(d.dod.numReviews);
                } else if (d.depth == 3) {
                    return appRadiusScale(d.size) > 4 ? appRadiusScale(d.size) : 4;
                }
                // Random
                return 5;
            })
            .style("fill", function(d) {
                return d._children ? "lightsteelblue" : "#fff";
            });

        // Transition nodes to their new position.
        var nodeUpdate = node.transition()
            .duration(duration)
            .attr("transform", function(d) {
                return "translate(" + d.y + "," + d.x + ")";
            });

        // Fade the text in
        nodeUpdate.select("text")
            .style("fill-opacity", 1);

        // Transition exiting nodes to the parent's new position.
        var nodeExit = node.exit().transition()
            .duration(duration)
            .attr("transform", function(d) {
                return "translate(" + source.y + "," + source.x + ")";
            })
            .remove();

        nodeExit.select("circle")
            .attr("r", 0);

        nodeExit.select("text")
            .style("fill-opacity", 0);

        // Update the links…
        var link = svgGroup.selectAll("path.link")
            .data(links, function(d) {
                return d.target.id;
            });

        // Enter any new links at the parent's previous position.
        link.enter().insert("path", "g")
            .attr("class", "link")
            .attr("d", function(d) {
                var o = {
                    x: newRoot.x0,
                    y: newRoot.y0
                };
                return diagonal({
                    source: o,
                    target: o
                });
            });

        // Transition links to their new position.
        link.transition()
            .duration(duration)
            .attr("d", diagonal);

        // Transition exiting nodes to the parent's new position.
        link.exit().transition()
            .duration(duration)
            .attr("d", function(d) {
                var o = {
                    x: newRoot.x,
                    y: newRoot.y
                };
                return diagonal({
                    source: o,
                    target: o
                });
            })
            .remove();

        // Stash the old positions for transition.
        nodes.forEach(function(d) {
            d.x0 = d.x;
            d.y0 = d.y;
        });
    }

    function filterNodes(newRoot) {
        var tree = d3.layout.tree()
            .size([viewerHeight, viewerWidth]);

        // define a d3 diagonal projection for use by the node paths later on.
        var diagonal = d3.svg.diagonal()
            .projection(function(d) {
                return [d.y, d.x];
            });

        visit(treeData, function(d) {
            totalNodes++;
            maxLabelLength = Math.max(d.name.length, maxLabelLength);

        }, function(d) {
            return d.children && d.children.length > 0 ? d.children : null;
        });

        sortTree();
        newRoot.x0 = viewerHeight / 2;
        newRoot.y0 = 0;

        // Collapse all children of newRoots children before rendering.
        newRoot.children.forEach(function(child) {
            collapse(child);
        });

        // Compute the new height, function counts total children of newRoot node and sets tree height accordingly.
        // This prevents the layout looking squashed when new nodes are made visible or looking sparse when nodes are removed
        // This makes the layout more consistent.
        var levelWidth = [1];
        var childCount = function(level, n) {

            if (n.children && n.children.length > 0) {
                if (levelWidth.length <= level + 1) levelWidth.push(0);

                levelWidth[level + 1] += n.children.length;
                n.children.forEach(function(d) {
                    childCount(level + 1, d);
                });
            }
        };
        childCount(0, newRoot);
        var newHeight = d3.max(levelWidth) * 25; // 25 pixels per line
        tree = tree.size([newHeight, viewerWidth]);

        // Compute the new tree layout.
        var nodes = tree.nodes(newRoot).reverse(),
            links = tree.links(nodes);

        // Set widths between levels based on maxLabelLength.
        // Set meta data for the current data
        // Set the max app count found so far
        // Set the max number of review found so far
        // Set the categories found so far
        nodes.forEach(function(d) {
            // console.log(d);
            if (d.depth == 1 && d._children) {
                treeUtilities.setMaxApps(d._children.length);
                treeUtilities.addCategory(d.name);
                treeUtilities.resetMaxReviews();
                treeUtilities.resetSentiments();
                for (var appIndex in d._children) {
                    treeUtilities.setMaxReviews(d._children[appIndex].dod.numReviews);
                    treeUtilities.setMinSentiment(d._children[appIndex].dod.sentimentScore);
                    treeUtilities.setMaxSentiment(d._children[appIndex].dod.sentimentScore);
                }
            }
            d.y = (d.depth * (maxLabelLength * 10)); //maxLabelLength * 10px
            // alternatively to keep a fixed scale one can set a fixed depth per level
            // Normalize for fixed-depth by commenting out below line
            // d.y = (d.depth * 500); //500px per level.
        });

        // Update the nodes…
        node = svgGroup.selectAll("g.node")
            .data(nodes, function(d) {
                return d.id || (d.id = ++i);
            });

        // Enter any new nodes at the parent's previous position.
        var nodeEnter = node.enter().append("g")
            .call(dragListener)
            .attr("class", "node")
            .attr("transform", function(d) {
                return "translate(" + newRoot.y0 + "," + newRoot.x0 + ")";
            })
            .on('click', function(d) {
                filteredClick(newRoot, d);
            });

        nodeEnter.append("circle")
            .attr('class', 'nodeCircle')
            .attr("r", 0)
            .style("fill", function(d) {
                return d._children ? "lightsteelblue" : "#fff";
            });

        nodeEnter.append("text")
            .attr("x", function(d) {
                return d.children || d._children ? -15 : 15;
            })
            .attr("dy", ".35em")
            .attr('class', 'nodeText')
            .attr("text-anchor", function(d) {
                return d.children || d._children ? "end" : "start";
            })
            .text(function(d) {
                return d.name;
            })
            .style("fill-opacity", 0);

        // phantom node to give us mouseover in a radius around it
        nodeEnter.append("circle")
            .attr('class', 'ghostCircle')
            .attr("r", 30)
            .attr("opacity", 0.2) // change this to zero to hide the target area
        .style("fill", "red")
            .attr('pointer-events', 'mouseover')
            .on("mouseover", function(node) {
                overCircle(node);
            })
            .on("mouseout", function(node) {
                outCircle(node);
            });

        // Update the text to reflect whether node has children or not.
        node.select('text')
            .attr("x", function(d) {
                return d.children || d._children ? -15 : 10;
            })
            .attr("text-anchor", function(d) {
                return d.children || d._children ? "end" : "start";
            })
            .text(function(d) {
                return d.name;
            });

        var categoryRadiusScale = d3.scale.linear().domain([0, treeUtilities.getMaxApps()]).range([0, 10]);
        var appRadiusScale = d3.scale.linear().domain([0, treeUtilities.getMaxReviews()]).range([0, 10]);
        // Change the circle fill depending on whether it has children and is collapsed
        node.select("circle.nodeCircle")
            .attr("r", function(d) {
                if (d.depth == 1 && d._children) {
                    // Categories radius is based on the number of apps
                    return categoryRadiusScale(d._children.length);
                } else if (d.depth == 1 && d.children) {
                    // Categories radius is based on the number of apps
                    return categoryRadiusScale(d.children.length);
                } else if (d.depth == 2) {
                    return appRadiusScale(d.dod.numReviews);
                } else if (d.depth == 3) {
                    return appRadiusScale(d.size) > 4 ? appRadiusScale(d.size) : 4;
                }
                // Random
                return 5;
            })
            .style("fill", function(d) {
                return d._children ? "lightsteelblue" : "#fff";
            });

        // Transition nodes to their new position.
        var nodeUpdate = node.transition()
            .duration(duration)
            .attr("transform", function(d) {
                return "translate(" + d.y + "," + d.x + ")";
            });

        // Fade the text in
        nodeUpdate.select("text")
            .style("fill-opacity", 1);

        // Transition exiting nodes to the parent's new position.
        var nodeExit = node.exit().transition()
            .duration(duration)
            .attr("transform", function(d) {
                return "translate(" + newRoot.y + "," + newRoot.x + ")";
            })
            .remove();

        nodeExit.select("circle")
            .attr("r", 0);

        nodeExit.select("text")
            .style("fill-opacity", 0);

        // Update the links…
        var link = svgGroup.selectAll("path.link")
            .data(links, function(d) {
                return d.target.id;
            });

        // Enter any new links at the parent's previous position.
        link.enter().insert("path", "g")
            .attr("class", "link")
            .attr("d", function(d) {
                var o = {
                    x: newRoot.x0,
                    y: newRoot.y0
                };
                return diagonal({
                    source: o,
                    target: o
                });
            });

        // Transition links to their new position.
        link.transition()
            .duration(duration)
            .attr("d", diagonal);

        // Transition exiting nodes to the parent's new position.
        link.exit().transition()
            .duration(duration)
            .attr("d", function(d) {
                var o = {
                    x: newRoot.x,
                    y: newRoot.y
                };
                return diagonal({
                    source: o,
                    target: o
                });
            })
            .remove();

        // Stash the old positions for transition.
        nodes.forEach(function(d) {
            d.x0 = d.x;
            d.y0 = d.y;
        });

        centerNode(newRoot);
    }

    // Append a group which holds all nodes and which the zoom Listener can act upon.
    var svgGroup = baseSvg.append("g");

    // Define the root
    root = treeData;
    root.x0 = viewerHeight / 2;
    root.y0 = 0;

    // Collapse all children of roots children before rendering.
    root.children.forEach(function(child) {
        collapse(child);
    });

    // Layout the tree initially and center on the root node.
    update(root);
    centerNode(root);

    d3.select("#filter-container").append("tr").attr("height", "10px");

    d3.select("#filter-container")
        .append("tr").html("What kinds of apps are you interested in?");

    d3.select("#filter-container").append("tr").append("hr");

    // Add category filtering
    var category_filter = d3.select("#filter-container")
        .append("tr")
        .attr("class", "info")
        .append("div")
        .attr("id", "category-group-holder")
        .attr("class", "row")
        .style("margin", "10px")
        .style("width", $(document).width() * 0.40)
        .style("height", $(document).height() - 4);

    category_filter.append("select");
    category_filter.attr("id", "category-filter")
        .style("vertical-align", "top")
        .attr("multiple", "multiple")
        .selectAll("option")
        .data(treeUtilities.getCategories())
        .enter()
        .append("option")
        .attr("value", function(d) {
            return d;
        })
        .html(function(d) {
            return d;
        });

    $(document).ready(function() {
        $('#category-filter').multiselect({
            buttonWidth: '300px',
            onChange: function(option, checked) {
                treeUtilities.updateSelectedCategory(option, checked);
            },
            onDropdownHide: function(event, option, checked) {
                var categories = treeUtilities.getSelectedCategories();
                var allTopics = [];
                var topicTracker = {};

                for (var categoryIndex in treeData.children) {
                    if (categories.indexOf(treeData.children[categoryIndex].name) >= 0) {
                        var currentCategoryApps = treeData.children[categoryIndex]._children;
                        for (appIndex in currentCategoryApps) {
                            var currentTopics = currentCategoryApps[appIndex].dod.topics;
                            for (var topic in currentTopics) {
                                if (topicTracker[topic] == undefined || topicTracker[topic] < currentTopics[topic]) {
                                    var tempObject = {};
                                    tempObject["key"] = topic;
                                    tempObject["value"] = currentTopics[topic];
                                    allTopics.push(tempObject);
                                    topicTracker[topic] = currentTopics[topic];
                                }
                            }
                        }
                    }
                }
                allTopics.sort(function(a, b) {
                    return b.value - a.value;
                });

                var chosenTopics = []
                if (allTopics.length > 10) {
                    var bestTopics = allTopics.slice(0, 5);
                    var worstTopics = allTopics.slice(-5);
                    for (topicIndex in bestTopics) {
                        chosenTopics.push(bestTopics[topicIndex]["key"]);
                    }
                    for (topicIndex in worstTopics) {
                        chosenTopics.push(worstTopics[topicIndex]["key"]);
                    }
                } else {
                    for (topicIndex in allTopics) {
                        chosenTopics.push(worstTopics[topicIndex]["key"]);
                    }
                }

                topic_filter = d3.select("#topic-filter");
                topic_filter.selectAll("option").remove();
                topic_filter.attr("multiple", "multiple")
                    .style("visibility", "visibile")
                    .selectAll("option")
                    .data(chosenTopics)
                    .enter()
                    .append("option")
                    .attr("value", function(d) {
                        return d;
                    })
                    .html(function(d) {
                        return d;
                    });

                $('#topic-filter').multiselect('destroy');
                $('#topic-filter').multiselect({
                    buttonWidth: '300px',
                    onChange: function(option, checked) {
                        treeUtilities.updateSelectedTopics(option, checked);
                    },
                    onDropdownHide: function(event, option, checked) {

                    }
                });

                $('#topic-filter').multiselect('refresh');
            }
        });
    });

    d3.select("#filter-container").append("tr").append("hr");

    // Add topic filtering
    var topic_filter = d3.select("#filter-container")
        .append("tr")
        .attr("class", "info")
        .append("div")
        .attr("id", "topic-group-holder")
        .style("margin", "10px")
        .style("width", $(document).width() * 0.40)
        .style("height", $(document).height() - 4);

    topic_filter.append("select");
    topic_filter.attr("id", "topic-filter")
        .style("vertical-align", "top");

    $('#topic-filter').multiselect({
        buttonWidth: '300px'
    });

    d3.select("#filter-container").append("tr").append("hr");
    // Add number of review filtering
    var review_count_filter = d3.select("#filter-container")
        .append("tr")
        .attr("class", "info")
        .append("div")
        .attr("class", "row")
        .attr("id", "review-count-group-holder");

    review_count_filter.append("div").attr("class", "col-md-3").append("b").html("No reviews");
    review_count_filter.append("div")
        .attr("class", "col-md-6")
        .append("input")
        .attr("id", "review-count-slider")
        .attr("type", "text")
        .attr("class", "span2")
        .attr("value", "")
        .attr("data-slider-min", "0")
        .attr("data-slider-max", String(treeUtilities.getMaxReviews()))
        .attr("data-slider-steps", "1")
        .attr("data-slider-value", "[0," + treeUtilities.getMaxReviews() + "]");
    review_count_filter.append("div").attr("class", "col-md-3").append("b").html(treeUtilities.getMaxReviews() + " reviews");

    var review_slider = $("#review-count-slider").slider({})
        .on('slideStop', function(newValue) {
            treeUtilities.setReviewCountSlider(newValue.value);
        });

    treeUtilities.setReviewCountSlider([0, treeUtilities.getMaxReviews()]);

    d3.select("#filter-container").append("tr").append("hr");
    // Add rating filtering
    var rating_filter = d3.select("#filter-container")
        .append("tr")
        .attr("class", "info")
        .append("div")
        .attr("class", "row")
        .attr("id", "rating-group-holder");

    rating_filter.append("div").attr("class", "col-md-3").append("b").html("0 Stars");
    rating_filter.append("div").attr("class", "col-md-6").append("input")
        .attr("id", "rating-slider")
        .attr("type", "text")
        .attr("class", "span2")
        .attr("value", "")
        .attr("data-slider-min", "0")
        .attr("data-slider-max", "5")
        .attr("data-slider-steps", 0.25)
        .attr("data-slider-value", "[0,5]");

    rating_filter.append("div").attr("class", "col-md-3").append("b").html("5 Stars");
    var review_slider = $("#rating-slider").slider({
            step: 0.1,
            precison: 2
        })
        .on('slideStop', function(newValue) {
            treeUtilities.setRatingSlider(newValue.value);
        });

    treeUtilities.setRatingSlider([0, 5]);
    d3.select("#filter-container").append("tr").append("hr");
    // Add sentiment filtering
    var sentiment_filter = d3.select("#filter-container")
        .append("tr")
        .attr("padding", "1em")
        .attr("class", "info")
        .append("div")
        .attr("class", "row")
        .attr("id", "sentiment-group-holder");

    sentiment_filter.append("div").attr("class", "col-md-3").append("b").html("Very unhappy");
    sentiment_filter.append("div").attr("class", "col-md-6").append("input")
        .attr("id", "sentiment-slider")
        .attr("type", "text")
        .attr("class", "span2")
        .attr("value", "")
        .attr("data-slider-min", treeUtilities.getSentiment()[0])
        .attr("data-slider-max", treeUtilities.getSentiment()[1])
        .attr("data-slider-steps", 0.25)
        .attr("data-slider-value", "[" + treeUtilities.getSentiment()[0] + "," + treeUtilities.getSentiment()[1] + "]");

    sentiment_filter.append("div").attr("class", "col-md-3").append("b").html("Very happy");
    var sentiment_slider = $("#sentiment-slider").slider({})
        .on('slideStop', function(newValue) {
            treeUtilities.setSentimentSlider(newValue.value);
        });

    treeUtilities.setSentimentSlider([treeUtilities.getSentiment()[0], treeUtilities.getSentiment()[1]]);
    // console.log(treeUtilities.getSentimentSlider());
    d3.select("#filter-container").append("tr").append("hr");
    // Add a filter button
    var filter_update_button = d3.select("#filter-container")
        .append("tr")
        .attr("padding", "1em")
        .attr("class", "info")
        .append("div")
        .append("button")
        .attr("class", "btn btn-default")
        .on("click", function() {
            var selectedCategories = treeUtilities.getSelectedCategories();
            var selectedTopics = treeUtilities.getSelectedTopics();
            var reviewCountSlider = treeUtilities.getReviewCountSlider();
            var ratingSlider = treeUtilities.getRatingSlider();
            var sentimentSlider = treeUtilities.getSentimentSlider();
            updateWithFilters(selectedCategories, selectedTopics, reviewCountSlider, ratingSlider, sentimentSlider);
        })
        .html("Update!");
    d3.select("#filter-container").append("tr").append("hr");
    // Add a comparison area
    var comparison_area = d3.select("#filter-container")
        .append("tr")
        .attr("class", "info")
        .append("div")
        .attr("id", "comparison-area");

    var comparisonText = comparison_area.append("div")
        .attr("id", "comparison-text")
        .html("You can select up to 3 apps for comparisons.");

    comparison_area.append("p").attr("height", "12px");
    var comparisonRow = comparison_area.append("div");

    comparisonRow.append("p").attr("id", "comparisonItem-0");
    comparisonRow.append("p").attr("id", "comparisonItem-1");
    comparisonRow.append("p").attr("id", "comparisonItem-2");

    var compareLinkBox = comparison_area.append("div")
        .attr("id", "compareLinkBox");

    function addToComparisonList(item) {
        if (item.depth == 2) {
            treeUtilities.updateComparisonItems(item);
            var comparisonItems = treeUtilities.getComparisonItems();
            var comparisonItemKeys = Object.keys(comparisonItems);
            d3.select("#comparisonItem-0").html("");
            d3.select("#comparisonItem-1").html("");
            d3.select("#comparisonItem-2").html("");
            for (var index in comparisonItemKeys) {
                var appRow = d3.select("#comparisonItem-" + index)
                    .append("div")
                    .attr("class", "row");

                appRow.append("div")
                    .attr("class", "col-md-1")
                    .attr("text-align", "right")
                    .append("img")
                    .attr("class", "appIcons")
                    .style("display", "inline")
                    .attr("src", comparisonItems[comparisonItemKeys[index]].dod.icon)
                    .attr("height", "25px")
                    .attr("width", "25px");

                appRow.append("div")
                    .attr("class", "col-md-11")
                    .attr("text-align", "left")
                    .html(comparisonItems[comparisonItemKeys[index]].name);
            }

            d3.select("#compareLinkBox").selectAll("a").remove();
            if (comparisonItemKeys.length > 0) {
                d3.select("#compareLinkBox")
                    .append("a")
                    .attr("id", "shiftViews")
                    .attr("href", "/#mainCompare")
                    .attr("target", "_top")
                    .html("Click here to view details");

                $('#shiftViews').click(function() {
                    updateTable();
                });
            }
        }
    }

    var updateWithFilters = function(passedCategories, passedTopics, reviewCountSlider, ratingSlider, sentimentSlider) {

        d3.json("apps-large-compressed.json", function(error, updatedData) {
            var updatedCategoryArray = []
            for (var categoryKey in updatedData.children) {
                if (passedCategories.indexOf(updatedData.children[categoryKey].name) >= 0) {
                    updatedCategoryArray.push(updatedData.children[categoryKey]);
                }
            }
            for (var categoryIndex in updatedCategoryArray) {
                var updatedApps = []
                var currentCategoryApps = updatedCategoryArray[categoryIndex].children;
                for (var appIndex in currentCategoryApps) {
                    var topics = currentCategoryApps[appIndex].dod.topics;
                    for (var topic in topics) {
                        if (passedTopics.indexOf(topic) >= 0) {
                            updatedApps.push(currentCategoryApps[appIndex]);
                            break;
                        }
                    }
                }
                updatedCategoryArray[categoryIndex].children = updatedApps;
            }

            for (var categoryIndex in updatedCategoryArray) {
                var updatedApps = []
                var currentCategoryApps = updatedCategoryArray[categoryIndex].children;
                for (var appIndex in currentCategoryApps) {
                    var appReviewCount = currentCategoryApps[appIndex].dod.numReviews;
                    if (appReviewCount >= reviewCountSlider[0] && appReviewCount <= reviewCountSlider[1]) {
                        updatedApps.push(currentCategoryApps[appIndex]);
                    }
                }
                updatedCategoryArray[categoryIndex].children = updatedApps;
            }

            for (var categoryIndex in updatedCategoryArray) {
                var updatedApps = []
                var currentCategoryApps = updatedCategoryArray[categoryIndex].children;
                for (var appIndex in currentCategoryApps) {
                    var avgRating = currentCategoryApps[appIndex].dod.avgRating;
                    if (avgRating >= ratingSlider[0] && avgRating <= ratingSlider[1]) {
                        updatedApps.push(currentCategoryApps[appIndex]);
                    }
                }
                updatedCategoryArray[categoryIndex].children = updatedApps;
            }

            for (var categoryIndex in updatedCategoryArray) {
                var updatedApps = []
                var currentCategoryApps = updatedCategoryArray[categoryIndex].children;
                for (var appIndex in currentCategoryApps) {
                    var sentimentScore = currentCategoryApps[appIndex].dod.sentimentScore;
                    if (sentimentScore >= sentimentSlider[0] && sentimentScore <= sentimentSlider[1]) {
                        updatedApps.push(currentCategoryApps[appIndex]);
                    }
                }
                updatedCategoryArray[categoryIndex].children = updatedApps;
            }

            updatedData.children = updatedCategoryArray;
            filterNodes(updatedData);
        });
    };
});