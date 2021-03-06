/**
 * Constructor for the BubbleChart
 */
function BubbleChart() {
    var self = this;
    self.init();
}

/**
 * Initializes the svg elements required to for this chart
 */
BubbleChart.prototype.init = function () {
    var self = this;
    var divBubbleChart = d3.select("#bubble-chart");

    // Gets access to the div element created for this chart from HTML
    self.svgBounds = divBubbleChart.node().getBoundingClientRect();
    self.xAxisWidth = 10;
    self.yAxisHeight = 85;
    self.svgWidth = self.svgBounds.width - self.xAxisWidth;
    self.svgHeight = 400;

    // creates svg element within the div
    self.svg = divBubbleChart.append("svg")
        .attr("width", self.svgWidth)
        .attr("height", self.svgHeight);

    self.svg.append("g").attr("id", "xAxis_bubble");
    self.svg.append("g").attr("id", "yAxis_bubble");
    self.svg.append("g").attr("id", "circles");

    d3.csv("data/State_Zhvi_AllHomes.csv", function(error, data) {
            // Create the x, y and r scales

            self.xScale = d3.scaleBand()
                .domain(data.map(function (d) {
                    return d.RegionName;
                })).range([self.yAxisHeight, self.svgWidth ]);

            self.maxValue = d3.max(data, function (d) {
                return parseInt(d["2016"]);
            });
            self.yScale = d3.scaleLinear()
                .domain([0, self.maxValue]).range([self.svgHeight - self.yAxisHeight,10]);
            self.rScale = d3.scaleLinear()
                .domain([1,50])
                .range([25,1]);
           // self.colorScale = d3.scaleLinear()
             //   .domain([1, 10])
             //   .range(["#800026","#bd0026","#e31a1c","fc4e2a","fd8d3c"]);

            // Create the axes
            self.xAxis = d3.axisLeft()
                .scale(self.xScale);
            d3.select("#xAxis_bubble")
                .attr("transform", "rotate(-90) translate(" + (self.yAxisHeight - self.svgHeight -1) + ",0)")
                .call(self.xAxis)
                .selectAll('text')
                .attr("x", -5)
                .attr("y", 11)
                .attr("transform", "rotate(45)");
            self.yAxis = d3.axisLeft()
                .scale(self.yScale);
            d3.select("#yAxis_bubble")
                .attr("transform", "translate(" + self.yAxisHeight + ",0)")
                .call(self.yAxis);

            // display x,y axis labels
            self.svg.append("text")
            //     .attr("class", "")
                .attr("text-anchor", "middle")
                .attr("x", self.svgWidth/2)
                .attr("y", self.svgHeight - 10)
                .text("State Size Rank (by Population)");

            self.svg.append("text")
            //     .attr("class", "")
                .attr("text-anchor", "middle")
                .attr("x", (self.svgHeight - self.yAxisHeight) / 2 * -1)
                .attr("y", 20)
                .attr("transform", "rotate(-90)")
                .text("ZHVI house price ($)");

            // Draw bubble chart for the first time
            //Start off with year 1996 selected
            self.circles = d3.select("#circles").selectAll(".circle")
                .data(data)
                .enter().append("circle")
                .attr("class", "circle")
                .attr("cx", function(d) { return self.xScale(d.RegionName) + 14})
                .attr("r", function(d) { return self.rScale(d.SizeRank)})
                .attr("cy", function(d) { return self.yScale(d["1996"]); })
            //  .style("fill", function(d) { return self.colorScale(d.SizeRank)});
                .attr("name", function(d) { return d.RegionName; })
                .style("fill", "#00688B")
                .on("mouseover", function(d) {
                    d3.select('.selected').classed('selected', false);
                    d3.select(this).classed('selected', true);
                });


            function tabulate(data, columns) {
                var table = d3.select("#table").append("table")
                        .attr("style", "margin-left: 250px"),
                    thead = table.append("thead"),
                    tbody = table.append("tbody");

                // append the header row
                thead.append("tr")
                    .selectAll("th")
                    .data(columns)
                    .enter()
                    .append("th")
                    .text(function(column) { return column; });

                // create a row for each object in the data
                var rows = tbody.selectAll("tr")
                    .data(data)
                    .enter()
                    .append("tr");

                // create a cell in each row for each column
                var cells = rows.selectAll("td")
                    .data(function(row) {
                        return columns.map(function(column) {
                            return {column: column, value: row[column]};
                        });
                    })
                    .enter()
                    .append("td")
                    .attr("style", "font-family: Courier") // sets the font style
                    .html(function(d) { return d.value; });

                return table;
            }
            d3.select("#slider").on("input", function() {
               self.update(+this.value);
            });
           self.update(1996);
    }
    )};

/**
 * Create a bubble chart
 *
 * @param selectedState sale/rent data for a state
 */
BubbleChart.prototype.update = function (selectedYear) {
    var self = this;
    d3.select("#year").text(selectedYear);
    var cy = d3.select("#slider").property("value", selectedYear);
    var div = d3.select(".tooltip");
    var year= 1996;
  //  var year2 = year + 1;
   d3.select("#circles").selectAll("circle")
       .attr("cy", function(d) {
           for (i = 0; i <= 20; i++)  {
               var year2 = year + i;
               if (selectedYear == year2) {
                   return self.yScale(d[year2]);
               }
           }
       })
       .attr("value", function(d) {
           for (i = 0; i <= 20; i++) {
             //  var value;
               var year2 = year + i;
               if (selectedYear == year2) {
                   if (d[year2] < 1)
                       return "No Data";
                   else
                       //return "$" + d[year2];
                       return "$"+ d[year2].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
               }
           }
       }
       )
       .on("mouseover", function() {
           div.transition()
               .duration(200)
               .style("opacity", 2);
           div.html(d3.select(d3.event.target).attr("name") + "<br/>" + d3.select(d3.event.target).attr("value"))
               .style("left", (d3.event.pageX) + "px")
               .style("top", (d3.event.pageY - 28) + "px");
       })
       .on("mouseout", function() {
           div.transition()
               .duration(500)
               .style("opacity", 0);
       });

  };
