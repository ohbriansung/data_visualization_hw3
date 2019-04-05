const files = {
  basemap: "../data/analysis_eighborhoods.geojson",
  streets: "../data/streets_active_and_retired.geojson",
  records: "../data/tree_maintenance_march_2018_to_2019.csv"
}

const svg = d3.select("body").select("svg#svg");

const g = {
  basemap: svg.select("g#basemap"),
  streets: svg.select("g#streets"),
  outline: svg.select("g#outline"),
  records: svg.select("g#records"),
}

// Resource: https://observablehq.com/@d3/conic-equal-area
const projection = d3.geoConicEqualArea();
projection.parallels([37.692514, 37.840699]);
projection.rotate([122, 0]);

const path = d3.geoPath().projection(projection);

d3.json(files.basemap).then(function(json) {
  projection.fitSize([960, 598], json);
  drawBasemap(json);
  drawOutline(json);
});

d3.json(files.streets).then(function(json) {
  drawStreets(json);
});

d3.csv(files.records).then(function(d) {
  drawRecords(d);
});

var translate = function(a, b) {
  return "translate(" + a + ", " + b + ")";
}

var drawBasemap = function(json) {
  let basemap = g.basemap.selectAll("path.land")
    .data(json["features"])
    .enter()
    .append("path")
    .attr("d", path)
    .attr("class", "land");
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
  data.forEach(function(row) {
    let lat = parseFloat(row.Latitude);
    let lon = parseFloat(row.Longitude);
    let pixels = projection([lon, lat]);

    row.x = pixels[0];
    row.y = pixels[1];
  });

  let symbols = g.records.selectAll("circle")
    .data(data)
    .enter()
    .append("circle")
    .attr("cx", d => d.x)
    .attr("cy", d => d.y)
    .attr("r", 3)
    .attr("class", "symbol");
}
