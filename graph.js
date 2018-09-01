// https://bl.ocks.org/mbostock/1093130

const env = location.hostname === "localhost" || location.hostname === "127.0.0.1" ? "local" : "production";
console.log("env:", env);

let root;
const width = window.innerWidth,
    height = window.innerHeight;

const force = d3.layout.force()
    .linkDistance(60)
    .charge(-180)
    .gravity(.03)
    .size([width, height])
    .on("tick", tick);

const svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height);

let link = svg.selectAll(".link"),
    node = svg.selectAll(".node"),
    defs = svg.append('svg:defs');

run();

function run () {
  d3.json("art-pieces.json", function(error, json) {
    if (error) throw error;

    root = json;
    update();
  });
}

function update() {
  const nodes = flatten(root),
      links = d3.layout.tree().links(nodes);

  // Restart the force layout.
  force
      .nodes(nodes)
      .links(links)
      .start();

  // Update defs.
  nodes.forEach(function(d, i) {
    const radius = Math.sqrt(d.size) / 10 || 4.5;
    defs.append("circle:pattern")
      .attr("id", d.name)
      .attr("width", 1)
      .attr("height", 1)
      .attr("x", 0)
      .attr("y", 0)
      .append("svg:image")
      .attr("xlink:href", getImageLink(d))
      .attr("height", 2 * radius)
      .attr("x", 0)
      .attr("y", 0);
  })
  
  // Update links.
  link = link.data(links, function(d) { return d.target.id; });

  link.exit().remove();

  link.enter().insert("line", ".node")
      .attr("class", "link");

  // Update nodes.
  node = node.data(nodes, function(d) { return d.id; });

  node.exit().remove();

  const nodeEnter = node.enter().append("g")
      .attr("class", "node")
      .on("click", click)
      .call(force.drag);

  nodeEnter.append("circle")
      .attr("r", function(d) { return Math.sqrt(d.size) / 10 || 4.5; });

  node.select("circle")
    .style("fill", color)

}

function tick() {
  link.attr("x1", function(d) { return d.source.x; })
      .attr("y1", function(d) { return d.source.y; })
      .attr("x2", function(d) { return d.target.x; })
      .attr("y2", function(d) { return d.target.y; });

  node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
}

function color(d) {
  return d._children ? "#3182bd" // collapsed package
      : d.children ? "#c6dbef" // expanded package
      : `url(#${d.name})`; // leaf node
}

function click(d) {
   // Ignore drag.
  if (d3.event.defaultPrevented) return;
  
  // If parent node, toggle children on click.
  if (d.children) {
    d._children = d.children;
    d.children = null;
  } else {
    d.children = d._children;
    d._children = null;
  }

  // If child node, open carousel view.
  if (!d.isCategory) {
    d3.select(".slideshow-container")
      .style("display", "block");
    
    d3.select("svg")
      .style("display", "none")
  }
  update();
}

// Returns a list of all nodes under the root.
function flatten(root) {
  let nodes = [], i = 0;

  function recurse(node) {
    if (node.children) node.children.forEach(recurse);
    if (!node.id) node.id = ++i;
    nodes.push(node);
  }

  recurse(root);
  return nodes;
}

function getImageLink (d) { 
  const filePath = d.isCategory ? '' : `img/${d.name}-min.jpg`; 
  return env == "local" ? filePath : `https://github.com/michelle-chiang/visual-portfolio/raw/master/${filePath}`;
}