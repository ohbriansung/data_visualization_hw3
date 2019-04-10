const svg2 = d3.select("body").select("svg#svg2");

// Selecting groups in svg
const g2 = {
  basemap: svg2.select("g#basemap"),
  outline: svg2.select("g#outline"),
  legends: svg2.select("g#legends"),
  details: svg2.select("g#details")
}

// Setup details
var details2 = g2.details.append("foreignObject")
  .attr("id", "foreigndDetail")
  .attr("width", attr.plotWidth)
  .attr("height", attr.plotHeight)
  .attr("x", 0)
  .attr("y", 0)
  .style("visibility", "hidden");

var detailBody2 = details2.append("xhtml:body")
  .style("text-align", "left")
  .style("background", "none")
  .html("<p>N/A</p>");

setTimeout(function() {
  d3.json(files.supdist).then(function(json) {
    projection.fitSize([attr.plotWidth, attr.plotHeight - 3], json);
    drawBasemap2(json, dataset);
    drawOutline(json, g2.outline);
  });
}, 1000);


var drawBasemap2 = function(json, data) {
  let dataCount = {};
  dataCount.total = 0;
  dataCount.values = {};

  data.forEach(function(row) {
    let dist = row["Supervisor District"];

    if (!(dist in dataCount.values)) {
      dataCount.values[dist] = 0;
    }

    dataCount.values[dist]++;
    dataCount.total++;
  });

  let values = Object.values(dataCount.values);
  let max = d3.max(values);
  let min = d3.min(values);
  let range = [min, max];
  let seqColorScale = d3.scaleLinear()
    .domain([min, max])
    .range(["#70B466", "#243F20"]);

  let basemap = g2.basemap.selectAll("path.land")
    .data(json["features"])
    .enter()
    .append("path")
    .attr("d", path)
    .attr("class", "land")
    .style("fill", d => seqColorScale(dataCount.values[d.properties.supervisor]));

  // Creating color legend
  let legendWidth = 200;
  let legendHeight = 20;
  let legend = g2.legends.attr("transform",
    translate(attr.plotWidth - 220, 15));

  let title = legend.append("text")
    .attr("class", "bold")
    .attr("dy", 12)
    .text("Number of Records");

  let colorbox = legend.append("rect")
    .attr("class", "colorLegend")
    .attr("x", 0)
    .attr("y", 12 + 6)
    .attr("width", legendWidth)
    .attr("height", legendHeight);

  let percentScale = d3.scaleLinear()
    .range([0, 100])
    .domain(range);

  let defs = legend.append("defs");

  defs.append("linearGradient")
    .attr("id", "gradient")
    .selectAll("stop")
    .data(seqColorScale.ticks())
    .enter()
    .append("stop")
    .attr("offset", d => percentScale(d) + "%")
    .attr("stop-color", d => seqColorScale(d));

  colorbox.style("fill", "url(#gradient)");

  let legendScale = d3.scaleLinear()
    .domain(range)
    .range([0, legendWidth]);

  let legendAxis = d3.axisBottom(legendScale)
    .tickValues(range)
    .tickSize(legendHeight)
    .tickSizeOuter(0);

  let axisGroup = legend.append("g")
    .attr("id", "colorAxis")
    .attr("transform", translate(0, 12 + 6))
    .call(legendAxis);

  axisGroup.selectAll("text").each(function(d, i) {
    if (i == 0) {
      d3.select(this).attr("text-anchor", "start");
    }
    else if (i == legendAxis.tickValues().length - 1) {
      d3.select(this).attr("text-anchor", "end");
    }
  });

  // Adding highlight
  basemap.on("mouseover.highlight2", function(d) {
    d3.select(d.properties.outline).raise();
    d3.select(d.properties.outline).classed("active", true);
  });

  basemap.on("mouseout.highlight2", function(d) {
    d3.select(d.properties.outline).classed("active", false);
  });

  // Adding tooltip
  basemap.on("mouseover.details2", function(d) {
    d3.select(this).classed("active", true);

    let dist = d.properties.supervisor;
    detailBody2.html(
      "<table>" +
      "<tr><th>District:</th><td>" + dist + "</td></tr>" +
      "<tr><th>Count:</th><td>" + dataCount.values[dist] +
      " / " + dataCount.total + "</td></tr>" +
      "<tr><th>Ratio:</th><td>" +
      calculateRatio(dataCount.values[dist], dataCount.total) +
      "</td></tr></table>"
    );

    details2.style("visibility", "visible");
  });

  basemap.on("mouseout.details2", function(d) {
    d3.select(this).classed("active", false);
    details2.style("visibility", "hidden");
  });
}
