/**
 * Constructor for the HouseChart
 */
function HouseChart() {
    var self = this;
    self.init();
};

/**
 * Initializes the svg elements required for this chart
 */
HouseChart.prototype.init = function () {
    var self = this;
    self.margin = {top: 10, right: 20, bottom: 30, left: 50};
    var divHouseChart = d3.select("#house-chart");

    // Get access to the div element created for this chart from HTML
    self.svgBounds = divHouseChart.node().getBoundingClientRect();
    self.xAxisWidth = 100;
    self.yAxisHeight = 50;
    self.svgWidth = self.svgBounds.width - self.margin.left - self.margin.right;
    self.svgHeight = 300 - self.margin.top - self.margin.bottom;

    // Creates svg element within the div
    self.svg = divHouseChart.append("svg")
        .attr("width", self.svgWidth)
        .attr("height", self.svgHeight);
        //  Removed this on click, not sure of it's purpose [Shane]
        // .on("click", function () {
        //     self.update();
        // });

    self.svg.append("g").attr("id", "xAxis_house");
    self.svg.append("g").attr("id", "yAxis_house");
    self.svg.append("g").attr("id", "lines");

    self.message = d3.select("#hvi-message");
};

/**
 * Create a line chart
 *
 * @param selectedState
 */
HouseChart.prototype.update = function (selectedStates) {
    var self = this;
    // selectedStates = ['CA', 'UT', 'NY', 'ND']; // For testing purposes

    // self.svg.append("g").attr("id", "line");
    // For animation
    var giveMeEmpty = d3.line().x(0).y(0);

    d3.csv("data/State_Zhvi_AllHomes.csv", function(error, data) {
        // var selectedState = data[0];
        //console.log(selectedState);
        // Display alert messages
        if (selectedStates.length == 0) {
            self.message.text("You have not selected any states from the map.");
        } else if (selectedStates.indexOf("LA") > -1) {
            self.message.text("We currently do not have data for Louisiana state. Please try some other states.");
        } else {
            self.message.text("");
        }

        // Generate years domain for x axis - this never change
        self.yearsDomain = [];
        for (var i = 1996; i < 2017; i++) {
            self.yearsDomain.push(i);
        }

        // Format data for each selected states
        self.formattedData = [];
        self.maxValue = 0;

        // Reformat selected states data
        for (var abbr in selectedStates) {
            // Get state data
            var state = data.filter(function (d) {
                return d.abbr == selectedStates[abbr]
            });

            state = state[0];

            var temp = {
                RegionName: state["RegionName"],
                abbr: state["abbr"],
                series: []
            };

            // Process state data
            for (var i = 1996; i < 2017; i++) {
                var price = isNaN(parseInt(state[i])) ? 0 : parseInt(state[i]);
                temp["series"].push({
                    year: i,
                    price: price
                });
                self.maxValue = price > self.maxValue ? price : self.maxValue;
            }

            // Add to formattedData
            self.formattedData.push(temp);
        }

        //console.log(self.formattedData);

        // Define scales
        self.xScale = d3.scaleBand()
            .domain(self.yearsDomain)
            .range([0, self.svgWidth - self.xAxisWidth]);
        self.yScale = d3.scaleLinear()
            .domain([0, self.maxValue])
            .range([self.svgHeight - self.yAxisHeight, 0]);
        self.zScale = d3.scaleOrdinal(d3.schemeCategory10);

        // define the line
        self.valueLine = d3.line()
            .x(function (d) {
                return self.xScale(d.year) + 15;
            })
            .y(function (d) {
                return self.yScale(d.price);
            })
            .defined(function (d) {
                return d.price != 0;
            });

        // Draw lines
        // self.svg.select("#line")
        //     .attr("transform", "translate(" + self.margin.left + "," + self.margin.top + ")")
        //     .append("path")
        //     .data([self.formatData.series])
        //     .classed("line", true)
        //     .attr("d", self.valueLine);

        // First create a group for each line
        var lines = self.svg.select("#lines")
            .selectAll("g")
            .data(self.formattedData, function (d) {
                return d.abbr;
            });
        lines.exit()
            .style("opacity", 1)
            .transition()
            .duration(500)
            // .ease(d3.easeLinear)
            .style("opacity", 0)
            .remove();
        var linesEnter = lines.enter()
            .append("g")
            .attr("id", function (d) {
                console.log("appended g using:");
                console.log(d);
                return d.abbr;
            });
        linesEnter.append("text");
        linesEnter.append("path")
            .attr("d", function (d) {
                return giveMeEmpty(d.series);
            })
            .transition() // Animation
            .duration(1000)
            // .ease(d3.easeLinear)
            .attrTween("d", function (d) {
                console.log("debugging:");
                console.log(d.series);
                return getInterpolation(d.series);
            });
        lines = lines.merge(linesEnter);

        // Required for fancy animation
        var getInterpolation = function (indexSeries) {
            var start = 1;
            for (var i = 0; i < indexSeries.length; i++) {
                if (indexSeries[i].price == 0) {
                    start++;
                }
            }

            var interpolate = d3.scaleQuantile()
                .domain([0,1])
                .range(d3.range(start, indexSeries.length + 1));
            // the range uses (18 - indexSeries.length) as the starting point, 18 is the number of dates

            return function(t) {
                var interpolatedLine = indexSeries.slice(0, interpolate(t));
                return self.valueLine(interpolatedLine);
            }
        };

        // Draw lines
        lines
            .attr("transform", "translate(" + self.margin.left + "," + self.margin.top + ")")
            .select("path")
            .classed("line", true)
            .attr("d", function (d) {
                return self.valueLine(d.series);
            })
            .style("stroke", function (d) {
                return self.zScale(d.abbr);
            });

        // Draw x axis
        self.svg.select("#xAxis_house")
            .attr("transform", "translate(" + self.margin.left + "," + (self.svgHeight - self.yAxisHeight + self.margin.top) + ")")
            .call(d3.axisBottom(self.xScale))
            .selectAll('text')
            .attr("x", -18)
            .attr("y", 5)
            .attr("transform", "rotate(-45)");

        // Draw y axis
        self.svg.select("#yAxis_house")
            .attr("transform", "translate(" + self.margin.left + "," + self.margin.top + ")")
            .call(d3.axisLeft(self.yScale));

        var dots = lines.selectAll("circle")
            .data(function (d) {
                return d.series;
            });
        dots.exit().remove();
        var dotsEnter = dots
            .enter()
            .append("circle")
            .attr("cx", function (d) {
                return self.xScale(d.year) + 15;
            })
            .attr("cy", function (d) {
                return self.yScale(d.price);
            })
            .style("opacity", 0);
        dots = dots.merge(dotsEnter);

        dots
            .transition()
            .duration(500)
            .ease(d3.easeLinear)
            .style("opacity", 1)
            .attr("r", 3)
            .attr("cx", function (d) {
                return self.xScale(d.year) + 15;
            })
            .attr("cy", function (d) {
                return self.yScale(d.price);
            })
            .style("fill", function (d) {
                var parent = d3.select(this.parentNode).node();
                return self.zScale(parent.id);
            })
            .attr("visibility", function (d) { // Temporary hack to hide empty values for scatterplot
                return d.price == 0 ? 'hidden' : '';
            });

        var lineLabels = lines.select("text")
            .text(function (d) {
                return d.abbr;
            })
            .attr("x", self.svgWidth - self.xAxisWidth - 9)
            .attr("y", function (d) {
                return self.yScale(d.series[d.series.length - 1].price) + 6;
            });
    });
};
