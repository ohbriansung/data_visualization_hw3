// Color scheme by Tableau
const colors = {
  "Other Department": "#CDCC5D",
  "Integrated Agency": "#FF9E4A",
  "Twitter": "#AD8BC9",
  "Web": "#67BF5C",
  "Mobile/Open311": "#729ECE",
  "Phone": "#ED665D"
}

// Setup color scale
const colorScale = d3.scaleOrdinal()
  .range(Object.entries(colors).map(e => e[1]))
  .domain(Object.entries(colors).map(e => e[0]));

var attr = {
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
  dslider: svg.select("g#dslider")
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
var dataset;
d3.csv(files.records).then(function(d) {
  dataset = d;
  drawLegends(d);  // Only in the beginning

  let data = filterByMonth(d, 3);
  drawRecords(data);
});

var translate = function(a, b) {
  return "translate(" + a + ", " + b + ")";
}

// Filtering would be a good idea since there will be too many symbols if not doing so
var filterByMonth = function(data, m) {
  let temp = [];
  let y = m >= 13 ? 2019 : 2018;
  m = m <= 12 ? m : m % 12;

  data.forEach(function(row) {
    let open = row.Opened;
    let month = parseInt(open.substring(0, 2));
    let year = parseInt(open.substring(6, 10));

    if (month == m && year == y) {
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
    .style("fill", d => colorScale(d.Source))
    .style("opacity", 0);

  symbols.transition()
    .duration(250)
    .style("opacity", 1);

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
}

var drawLegends = function(data) {
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
    .attr("class", "legendBackground")
    .attr("id", d => (d.replace(/\W/g, '')))
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

  // Adding brushing
  let legends = d3.select("svg#svg").selectAll("g.legend");

  legends.on("mouseover.brushing", function(d) {
    let symbols = g.records.selectAll("circle");

    d3.select(this).select(".legendBackground")
      .transition()
      .duration(100)
      .style("fill", "#646C6E");

    symbols.filter(e => (e.Source != d))
      .lower()
      .transition()
      .style("fill", "#555555")
      .attr("r", 1);
  });

  legends.on("mouseout.brushing", function(d) {
    let symbols = g.records.selectAll("circle");

    d3.select(this).select(".legendBackground")
      .transition()
      .duration(100)
      .style("fill", "#2B3638");

    symbols.filter(e => (e.Source != d))
      .transition()
      .style("fill", e => colorScale(e.Source))
      .attr("r", 3);
  });
}

// Setup drag slider and value
attr.coordinate = {};
attr.coordinate.x = attr.plotWidth - 20;
attr.coordinate.y1 = attr.plotHeight - 260;
attr.coordinate.y2 = attr.plotHeight - 20;
attr.coordinate.current = attr.coordinate.y1;
attr.coordinate.step = 12;  // 12 + the beginning = 13 months
attr.coordinate.range = attr.coordinate.y2 - attr.coordinate.y1;
attr.coordinate.mid = (attr.coordinate.range / attr.coordinate.step) / 2;
attr.coordinate.data = d3.range(13);

g.dslider.selectAll(".tick")  // slider tick
  .data(attr.coordinate.data)
  .enter()
  .append("line")
  .attr("x1", attr.coordinate.x)
  .attr("x2", attr.coordinate.x - 10)
  .attr("y1", d => (attr.coordinate.y1 + d * 20))
  .attr("y2", d => (attr.coordinate.y1 + d * 20))
  .style("stroke", "#AAAAAA")
  .style("stroke-width", 1);

g.dslider.selectAll("text")  // slider text
  .data(attr.coordinate.data)
  .enter()
  .append("text")
  .attr("dx", attr.coordinate.x - 15)
  .attr("dy", d => (attr.coordinate.y1 + d * 20 + 4))
  .attr("text-anchor", "end")
  .text(function(d) {
    d += 3;
    let y = d >= 13 ? 2019 : 2018;
    d = d <= 12 ? d : d % 12;
    let m = ("0" + d).slice(-2);

    return m + "/" + y;
  })
  .on("click", switchMonth);

var line = g.dslider.append("line")  // slider bar
  .attr("x1", attr.coordinate.x)
  .attr("x2", attr.coordinate.x)
  .attr("y1", attr.coordinate.y1)
  .attr("y2", attr.coordinate.y2)
  .style("stroke", "#AAAAAA")
  .style("stroke-linecap", "round")
  .style("stroke-width", 5)
  .style("cursor", "pointer")
  .on("click", switchMonth);

var dragCircle = g.dslider.append("circle")  // slider dragger
  .attr("r", 7)
  .attr("cx", attr.coordinate.x)
  .attr("cy", attr.coordinate.y1)
  .style("fill", "#FFFFFF")
  .style("cursor", "pointer")
  .call(d3.drag().on("drag", switchMonth));

function switchMonth(d) {
  let y = d3.mouse(this)[1];  // Tracking y coordinate of mouse

  y = y < attr.coordinate.y1 ? attr.coordinate.y1 :
      y > attr.coordinate.y2 ? attr.coordinate.y2 : y;  // Setup boundaries for y

  y = parseInt((y % 20 <= attr.coordinate.mid) ? y / 20 : y / 20 + 1) * 20;  // Stepping

  g.dslider.select("circle").attr("cy", y);  // Changing circle position

  // on change, removing ole symbols and adding new ones
  if (attr.coordinate.current != y) {
    attr.coordinate.current = y;

    let symbols = g.records.selectAll("circle");
    symbols.transition()
      .duration(250)
      .style("opacity", 0)
      .remove();

    let month = (y - attr.coordinate.y1) / 20 + 3;
    setTimeout(function() {
      let data = filterByMonth(dataset, month);
      drawRecords(data);
    }, 600);
  }
}
