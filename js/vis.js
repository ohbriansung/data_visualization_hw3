// Color scheme by Tableau
const colors = {
  "Other Department": "#CDCC5D",
  "Integrated Agency": "#FF9E4A",
  "Twitter": "#AD8BC9",
  "Web": "#67BF5C",
  "Mobile/Open311": "#729ECE",
  "Phone": "#ED665D"
}

const attr = {
  plotWidth: 960,
  plotHeight: 600,
  margin: {
    top: 30,
    right: 160
  }
}

// Data locations
const files = {
  basemap: "../data/analysis_eighborhoods.geojson",
  streets: "../data/streets_active_and_retired.geojson",
  records: "../data/tree_maintenance_march_2018_to_2019.csv"
}

// Selecting svg tag
const svg = d3.select("body").select("svg#svg");

// Selecting groups in svg
const g = {
  basemap: svg.select("g#basemap"),
  streets: svg.select("g#streets"),
  outline: svg.select("g#outline"),
  records: svg.select("g#records"),
  legends: svg.select("g#legends"),
  tooltip: svg.select("g#tooltip"),
  details: svg.select("g#details"),
  picture: svg.select("g#picture"),
  mslider: svg.select("g#mslider")
}

// Setup tooltip
var tooltip = g.tooltip.append("text")
  .attr("id", "tooltip")
  .attr("text-anchor", "end")
  .attr("dx", 0)
  .attr("dy", 0)
  .style("visibility", "hidden");

// Setup details
var details = g.details.append("foreignObject")
  .attr("id", "foreigndDetail")
  .attr("width", attr.plotWidth)
  .attr("height", attr.plotHeight)
  .attr("x", 0)
  .attr("y", 0)
  .style("visibility", "hidden");

var detailBody = details.append("xhtml:body")
  .style("text-align", "left")
  .style("background", "none")
  .html("<p>N/A</p>");

// setup month slider
// var form = g.mslider.append("form");
// var slider = form.append("input")
//   .attr("id", "month")
//   .attr("type", "range")
//   .attr("dx", 10)
//   .attr("dy", 10)
//   .attr("min", 3)
//   .attr("max", 15)
//   .attr("step", 1)
//   .attr("value", 3)
//   .attr("oninput", "selected_month.value = month.value");
// var sliderOutput = form.append("output")
//   .attr("id", "selected_month")
//   .attr("name", "selected_month")
//   .attr("dx", 20)
//   .attr("dy", 10)
//   .text(3);

// Setup projection
const projection = d3.geoConicEqualArea();
projection.parallels([37.692514, 37.840699]);
projection.rotate([122, 0]);

// Setup path
const path = d3.geoPath().projection(projection);

// Drawing basemap and outline of neighborhood
d3.json(files.basemap).then(function(json) {
  projection.fitSize([attr.plotWidth, attr.plotHeight - 3], json);
  drawBasemap(json);
  drawOutline(json);
});

// Drawing streets
d3.json(files.streets).then(function(json) {
  drawStreets(json);
});

// Drawing records on map
d3.csv(files.records).then(function(d) {
  let data = filterByMonth(d, 3);
  drawRecords(data);
});

var translate = function(a, b) {
  return "translate(" + a + ", " + b + ")";
}

// Filtering would be a good idea since there will be too many symbols if not doing so
var filterByMonth = function(data, m) {
  let temp = [];

  data.forEach(function(row) {
    let open = row.Opened;
    let month = parseInt(open.substring(0, 2));

    if (month == m) {
      temp.push(row);
    }
  });

  return temp;
}

var drawBasemap = function(json) {
  let basemap = g.basemap.selectAll("path.land")
    .data(json["features"])
    .enter()
    .append("path")
    .attr("d", path)
    .attr("class", "land");

  // Adding highlight
  basemap.on("mouseover.highlight", function(d) {
    d3.select(d.properties.outline).raise();
    d3.select(d.properties.outline).classed("active", true);
  });

  basemap.on("mouseout.highlight", function(d) {
    d3.select(d.properties.outline).classed("active", false);
  });

  // Adding tooltip
  basemap.on("mouseover.tooltip", function(d) {
    tooltip.text(d.properties.nhood);
    tooltip.style("visibility", "visible");
  });

  basemap.on("mousemove.tooltip", function(d) {
    let coords = d3.mouse(g.basemap.node());
    tooltip.attr("x", coords[0] - 10);
    tooltip.attr("y", coords[1]);
  });

  basemap.on("mouseout.tooltip", function(d) {
    tooltip.style("visibility", "hidden");
  });
}

var drawOutline = function(json) {
  let outline = g.outline.selectAll("path.neighborhood")
    .data(json["features"])
    .enter()
    .append("path")
    .attr("d", path)
    .attr("class", "neighborhood")
    .each(function(d) {
      d.properties.outline = this;
    });
}

var drawStreets = function(json) {
  let streets = json.features.filter(function(d) {
    return d.properties.active === "true";
  });

  g.streets.selectAll("path.street")
    .data(streets)
    .enter()
    .append("path")
    .attr("d", path)
    .attr("class", "street");
}

var drawRecords = function(data) {
  // Setup color scale
  let colorEntries = Object.entries(colors);
  let sourceList = colorEntries.map(e => e[0]);
  let colorList = colorEntries.map(e => e[1]);
  let colorScale = d3.scaleOrdinal().range(colorList).domain(sourceList);

  // Filtering and calculating x,y coordinators on map
  data.forEach(function(row) {
    let lat = parseFloat(row.Latitude);
    let lon = parseFloat(row.Longitude);
    let pixels = projection([lon, lat]);

    row.x = pixels[0];
    row.y = pixels[1];
  });

  // Drawing Symbols
  let symbols = g.records.selectAll("circle")
    .data(data)
    .enter()
    .append("circle")
    .attr("cx", d => d.x)
    .attr("cy", d => d.y)
    .attr("r", 3)
    .attr("class", "symbol")
    .style("fill", d => colorScale(d.Source));

  // legend
  g.legends.append("text")  // legend title
    .attr("class", "bold")
    .attr("text-anchor", "start")
    .attr("transform", translate(attr.plotWidth - attr.margin.right, attr.margin.top - 5))
    .text("Source");

  let legend = g.legends.selectAll("g")  // legend rows
		.data(colorScale.domain())
		.enter()
    .append("g")
		.attr("class", "legend")
		.attr("transform", function(d, i) {
      return translate(attr.plotWidth - attr.margin.right, attr.margin.top + i * 20);
    });

  legend.append("rect")  // rect for interactivity
		.attr("width", attr.margin.right - 10)
		.attr("height", 15)
		.style("fill", "#2B3638");

	legend.append("rect")  // color box
		.attr("width", 15)
		.attr("height", 15)
		.style("fill", colorScale);

	legend.append("text")  // legend text
		.attr("x", 20)
		.attr("y", 12)
		.style("text-anchor", "start")
		.text(d => d);

  // Adding details
  symbols.on("mouseover.details", function(d) {
    d3.select(this).raise();
    d3.select(this).classed("active", true);

    detailBody.html(
      "<table>" +
      "<tr><th>Address:</th><td>" + d["Address"] + "</td></tr>" +
      "<tr><th>Detail:</th><td>" + d["Request Details"] + "</td></tr>" +
      "<tr><th>Opened:</th><td>" + d["Opened"] + "</td></tr>" +
      "<tr><th>Closed:</th><td>" + d["Closed"] + "</td></tr>" +
      "<tr><th>Status:</th><td>" + d["Status"] + "</td></tr>" +
      "<tr><th>District:</th><td>" + d["Supervisor District"] + "</td></tr>" +
      "<tr><th>Neighborhood:</th><td>" + d["Neighborhood"] + "</td></tr>" +
      "</table>" +
      (d["Media URL"] == "" ?
        "" :
        "<img src=\"" + d["Media URL"] +
        "\" class=\"detailImage\" alt=\"Image Not Found\">")
    );

    details.style("visibility", "visible");
  });

  symbols.on("mouseout.details", function(d) {
    d3.select(this).classed("active", false);
    details.style("visibility", "hidden");
  });

  // Adding brushing
  let legends = d3.select("svg#svg").selectAll("g.legend");

  legends.on("mouseover.brushing", function(d) {
    symbols.filter(e => (e.Source != d))
      .lower()
      .transition()
      .style("fill", "#555555")
      .attr("r", 1);
  });

  legends.on("mouseout.brushing", function(d) {
    symbols.filter(e => (e.Source != d))
      .transition()
      .style("fill", e => colorScale(e.Source))
      .attr("r", 3);
  });
}
