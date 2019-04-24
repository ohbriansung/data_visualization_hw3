# San Francisco Tree Maintenance March 2018 to March 2019

### Website hosted with GitHub [here](https://ohbriansung.github.io/data_visualization_hw3/).

*The svg in the website might not work properly on mobiles*

## Introduction

The dataset I used in this project was 311 Cases sourced from data.sfgov.org. This project focused on visualizing tree maintenance data happened between 03/01/2018 and 03/01/2019, especially with geospatial data, in order to get a better understanding about the stories underneath. I used Python3 and Tableau for creating my prototype, and I used D3.js version 5 for implementing the visualization. The font styles used in this website are powered by Google Fonts.

![screenshot](https://raw.githubusercontent.com/ohbriansung/data_visualization_hw3/gh-pages/img/screenshot.png)

![screenshot2](https://raw.githubusercontent.com/ohbriansung/data_visualization_hw3/gh-pages/img/screenshot2.png)

## How I Created the Visualizations

### SVG Content

0. Create groups in svg to order the layer. i.e.; "basemap" is under \(below\) "streets".

<details>
<summary>Source Code</summary>

```Html5
<svg id="svg1" class="map">
    <g id="basemap"></g>
    <g id="streets" pointer-events="none"></g>
    <g id="outline" pointer-events="none"></g>
    <g id="records"></g>
    <g id="piechar"></g>
    <g id="legends"></g>
    <g id="tooltip" pointer-events="none"></g>
    <g id="details" pointer-events="none"></g>
    <g id="picture" pointer-events="none"></g>
    <g id="dslider"></g>
</svg>
```

</details>

### Projection and geoPath

0. Create a projection with d3.geoConicEqualArea\(\).
1. Setup the Illinois-centric Albers by picking suitable parallels. I picked a point in Turkey.
1. Setup the central meridian by rotating the sphere. For our purpose, 122 degree.
1. Create a path object with d3.geoPath\(\) and set its projection to the project above.

<details>
<summary>Source Code</summary>
    
```JavaScript
const projection = d3.geoConicEqualArea();
projection.parallels([37.692514, 37.840699]);
projection.rotate([122, 0]);
const path = d3.geoPath().projection(projection);
```

</details>

### Basemap, Neighborhood Boundaries, Streets

0. Load the data from geoJSON files with d3.json\(\).
1. Create the Basemap with the path object above and the json data.
1. Same approach for drawing Neighborhood Boundaries and Streets.

<details>
<summary>Source Code</summary>

```JavaScript
let basemap = g.basemap.selectAll("path.land")
    .data(json["features"])
    .enter()
    .append("path")
    .attr("d", path)
    .attr("class", "land");

let outline = g.outline.selectAll("path.neighborhood")
    .data(json["features"])
    .enter()
    .append("path")
    .attr("d", whichPath)
    .attr("class", "neighborhood");

let street = g.streets.selectAll("path.street")
    .data(json)
    .enter()
    .append("path")
    .attr("d", path)
    .attr("class", "street");
```

</details>

### Record Symbols

0. Create the color scale with d3.scaleOrdinal\(\).
1. Load the data with d3.csv\(\).
1. Calculate \(x, y\) coordinators on the projection.
1. Create the record symbols with the data and the color scale into circles.

<details>
<summary>Source Code</summary>

```JavaScript
const colors = {
    "Other Department": "#CDCC5D",
    "Integrated Agency": "#FF9E4A",
    "Twitter": "#AD8BC9",
    "Web": "#67BF5C",
    "Mobile/Open311": "#729ECE",
    "Phone": "#ED665D"
};

const colorScale = d3.scaleOrdinal()
    .range(Object.entries(colors).map(e => e[1]))
    .domain(Object.entries(colors).map(e => e[0]));

data.forEach(function(row) {
    let lat = parseFloat(row.Latitude);
    let lon = parseFloat(row.Longitude)
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
    .attr("class", "symbol")
    .style("fill", d => colorScale(d.Source));
```

</details>

### Legends

0. Create one group per legend item.
1. Load the color scale domains as data.
1. Transform the positions for each domain.
1. Create rectangles for each domain and fill the colors with color scale.
1. Create legend texts for each domain.

<details>
<summary>Source Code</summary>
    
```JavaScript
let legend = g.legends.selectAll("g")
    .data(colorScale.domain())
    .enter()
    .append("g")
    .attr("class", "legend")
    .attr("transform",function(d, i) {
        return translate(
            attr.plotWidth - attr.margin.right, attr.margin.top + i * 20
        );
    });
```

```JavaScript
legend.append("rect")
    .attr("width", 15)
    .attr("height", 15)
    .attr("class", "legendColor")
    .style("fill", colorScale);

legend.append("text")
    .attr("x", 20)
    .attr("y", 12)
    .style("text-anchor", "start")
    .text(d => d);
```

</details>

### Pie Chart

0. Calculate the counts of each type of source and the total number of records.
1. Create pie function with d3.pie\(\).
1. Create arc function with d3.arc\(\) and set the innerRadius so it would look like a donut.
1. Draw the pie with the pie function results of the data calculated above. Draw the arcs as paths and fill the colors of the arcs with color scale.

<details>
<summary>Source Code</summary>

```JavaScript
let pie = d3.pie()
    .sort(null)
    .value(d => d.value);

let arc = d3.arc()
    .innerRadius(innerRadius)
    .outerRadius(outerRadius);

let arcs = g.piechar.selectAll(".arc")
    .data(pie(map))
    .enter()
    .append("path")
    .attr("class", "arc")
    .attr("d", arc)
    .style("fill", d => colorScale(d.data.source))
    .style("stroke", "none");
```

</details>

### Data Source Selector

0. Draw the ticks first so it will be under \(below\) the slider.
1. Create the tick texts which are the years and months from the data.
1. Draw the bar and the circle dragger.
1. Create interactivity with d3.drag\(\).
1. Calculate the y coordinate of the mouse.
1. The ranges of each tick are calculated by the y coordinate of the tick +-5.
1. Circle only moves to the tick when it's in the range above which makes it steps through the bar.
1. Remove the old record symbols and pie chart when the value of selector changes and draw new ones later.

<details>
<summary>Source Code</summary>

```JavaScript
let ticks = g.dslider.selectAll(".tick")
    .data(attr.coordinate.data)
    .enter()
    .append("line")
    .attr("x1", attr.coordinate.x)
    .attr("x2", attr.coordinate.x - 10)
    .attr("y1", d => attr.coordinate.y1 + d * 20)
    .attr("y2", d => attr.coordinate.y1 + d * 20)
    .style("stroke", "#AAAAAA")
    .style("stroke-width", 1);

let texts = g.dslider.selectAll("text")
    .data(attr.coordinate.data)
    .enter()
    .append("text")
    .attr("dx", attr.coordinate.x - 15)
    .attr("dy", d => attr.coordinate.y1 + d * 20 + 4)
    .attr("text-anchor", "end")
    .text(function(d) {
        d += 3;
        let y = d >= 13 ? 2019 : 2018;
        d = d <= 12 ? d : d % 12;
        let m = ("0" + d).slice(-2);

        return m + "/" + y;
    })
    .on("click", dragEnd);

let bar = g.dslider.append("line")
    .attr("x1", attr.coordinate.x)
    .attr("x2", attr.coordinate.x)
    .attr("y1", attr.coordinate.y1)
    .attr("y2", attr.coordinate.y2)
    .style("stroke", "#AAAAAA")
    .style("stroke-linecap", "round")
    .style("stroke-width", 5)
    .style("cursor", "pointer")
    .on("click", dragEnd);

let dragger = g.dslider.append("circle")
    .attr("r", 7)
    .attr("cx", attr.coordinate.x)
    .attr("cy", attr.coordinate.y1)
    .style("fill", "#FFFFFF")
    .style("cursor", "pointer")
    .call(
        d3.drag()
        .on("drag", dragging)
        .on("end", dragEnd)
    );

function dragging(d) {
    let y = d3.mouse(this)[1]; // Tracking y coordinate of mouse

    y = y < attr.coordinate.y1
            ? attr.coordinate.y1
            : y > attr.coordinate.y2
            ? attr.coordinate.y2
            : y; // Setup boundaries for y

    y = parseInt(y % 20 <= attr.coordinate.mid ? y / 20 : y / 20 + 1) * 20; // Stepping
    g.dslider.select("circle").attr("cy", y); // Changing circle position
}

function dragEnd(d) {
    let y = d3.mouse(this)[1]; // Tracking y coordinate of mouse

    y = y < attr.coordinate.y1
            ? attr.coordinate.y1
            : y > attr.coordinate.y2
            ? attr.coordinate.y2
            : y; // Setup boundaries for y

    y = parseInt(y % 20 <= attr.coordinate.mid ? y / 20 : y / 20 + 1) * 20; // Stepping
    g.dslider.select("circle").attr("cy", y); // Changing circle position

    if (attr.coordinate.current != y) {
        attr.coordinate.current = y;

        g.records
            .selectAll("circle")
            .transition()
            .duration(100)
            .style("opacity", 0)
            .remove();

        g.piechar
            .selectAll(".arc")
            .transition()
            .duration(100)
            .style("opacity", 0)
            .remove();

        let month = (y - attr.coordinate.y1) / 20 + 3;
        setTimeout(function() {
            let data = filterByMonth(dataset, month);
            let recordCount = drawRecords(data);
            drawPie(recordCount);
        }, 400);
    }
}
```

</details>

## Author

Chien-Yu (Brian) Sung

## Acknowledgment

This project is for academic purposes only.

## References

0. [Jekyll](https://help.github.com/articles/setting-up-your-github-pages-site-locally-with-jekyll/)
1. [Bulma.io](https://bulma.io/)
1. [FontAwesome](https://fontawesome.com/)
1. [Google Fonts](https://fonts.google.com/)
1. [D3.js v5](https://d3js.org)
1. [311 Cases by data.sfgov.org](https://data.sfgov.org/City-Infrastructure/311-Cases/vw6y-z8j6)
1. [SF Arrests Map by Sophie Engle](https://bl.ocks.org/sjengle/2f6d4832397e3cdd78d735774cb5a4f2)
1. [Circle Dragging I by Mike Bostock](https://bl.ocks.org/mbostock/22994cc97fefaeede0d861e6815a847e)
1. [SVG foreignObject Example by Mike Bostock](https://bl.ocks.org/mbostock/1424037)
