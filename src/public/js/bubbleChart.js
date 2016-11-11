/**
 * Constructor for the BubbleChart
 */
function BubbleChart() {
    var self = this;
    self.init();
};

/**
 * Initializes the svg elements required to for this chart
 */
BubbleChart.prototype.init = function () {
    var self = this;
    var divBubbleChart = d3.select("#bubble-chart");

    // Gets access to the div element created for this chart from HTML
    self.svgBounds = divBubbleChart.node().getBoundingClientRect();
    self.xAxisWidth = 100;
    self.yAxisHeight = 50;
    self.svgWidth = self.svgBounds.width - self.xAxisWidth;
    self.svgHeight = 400;

    // creates svg element within the div
    self.svg = divBubbleChart.append("svg")
        .attr("width", self.svgWidth)
        .attr("height", self.svgHeight);

    self.svg.append("g").attr("id", "xAxis");
    self.svg.append("g").attr("id", "yAxis");
    self.svg.append("g").attr("id", "circles");

    d3.csv("data/State_Zhvi_AllHomes.csv", function(error, data) {
            // Create the x, y and r scales
            // Create colorScale

            self.xScale = d3.scaleBand()
                .domain(data.map(function (d) {
                    return parseInt(d.SizeRank);
                })).range([self.yAxisHeight, self.svgWidth ]);

            self.maxValue = d3.max(data, function (d) {
                return parseInt(d["2016"]);
            });
            self.yScale = d3.scaleLinear()
                .domain([0, self.maxValue]).range([self.svgHeight - self.yAxisHeight,10]);
            self.rScale = d3.scaleLinear()
                .domain([1,50])
                .range([10,1]);
            self.colorScale = d3.scaleLinear()
                .domain([1, 10])
                .range(["#800026","#bd0026","#e31a1c","fc4e2a","fd8d3c"]);

            // Create the axes
            self.xAxis = d3.axisLeft()
                .scale(self.xScale);
            d3.select("#xAxis")
                .attr("transform", "rotate(-90) translate(" + (self.yAxisHeight - self.svgHeight -1) + ",0)")
                .call(self.xAxis);
            self.yAxis = d3.axisLeft()
                .scale(self.yScale);
            d3.select("#yAxis")
                .attr("transform", "translate(" + self.yAxisHeight + ",0)")
                .call(self.yAxis);

            // Draw bubble chart for the first time
            //Start off with year 1996 selected
            self.circles = d3.select("#circles").selectAll(".circle")
                .data(data)
                .enter().append("circle")
                .attr("class", "circle")
                .attr("cx", function(d) { return self.xScale(d.SizeRank) + 10})
                .attr("r", function(d) { return self.rScale(d.SizeRank)})
                .attr("cy", function(d) { return self.yScale(d["1996"]); })
              .style("fill", function(d) { return self.colorScale(d.SizeRank)});

           d3.select("#slider").on("input", function() {
               self.update(+this.value);
            }
             );
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
    var year= 1996;
  //  var year2 = year + 1;
   d3.select("#circles").selectAll(".circle")
        .attr("cy", function(d) {
            for (i = 0; i <= 20; i++)  {
                var year2 = year + i;
                if (selectedYear == year2) {
                    return self.yScale(d[year2]);
                }
            }
        })
    };
