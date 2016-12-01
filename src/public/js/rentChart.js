/**
 * Constructor for the RentChart
 */
function RentChart() {
    var self = this;
    self.init();
};

/**
 * Initializes the svg elements required for this chart
 */
RentChart.prototype.init = function () {
    var self = this;
    self.margin = {top: 10, right: 20, bottom: 30, left: 50};
    var divRentChart = d3.select("#rent-chart");

    // Get access to the div element created for this chart from HTML
    self.svgBounds = divRentChart.node().getBoundingClientRect();
    self.xAxisWidth = 100;
    self.yAxisHeight = 50;
    self.svgWidth = self.svgBounds.width - self.margin.left - self.margin.right;
    self.svgHeight = 300 - self.margin.top - self.margin.bottom;

    // Creates svg element within the div
    self.svg = divRentChart.append("svg")
        .attr("width", self.svgWidth)
        .attr("height", self.svgHeight);

    self.svg.append("g").attr("id", "xAxis");
    self.svg.append("g").attr("id", "yAxis");
    self.svg.append("g").attr("id", "lines");
};

/**
 * Create a line chart
 *
 * @param selectedState
 */
RentChart.prototype.update = function (selectedStates) {
    var self = this;

    // For animation
    var giveMeEmpty = d3.line().x(0).y(0);

    d3.csv("data/State_Zri_AllHomes.csv", function(error, data) {
        // var selectedState = data[0];
        //console.log(selectedState);

        // Generate years domain for x axis - this never change
        self.datesDomain = [];
        var skipKeys = ['RegionName', 'abbr', 'SizeRank'];
        for (var key in data[0]) {
            if (skipKeys.indexOf(key) == -1) {
                self.datesDomain.push(key);
            }
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
            console.log("state");
            console.log(state);

            var temp = {
                RegionName: state["RegionName"],
                abbr: state["abbr"],
                series: []
            };

            // Process state data
            for (var i = 0; i < self.datesDomain.length; i++) {
                var price = isNaN(parseInt(state[self.datesDomain[i]])) ? 0 : parseInt(state[self.datesDomain[i]]);
                temp["series"].push({
                    date: self.datesDomain[i],
                    price: price
                });
                self.maxValue = price > self.maxValue ? price : self.maxValue;
            }

            // Add to formattedData
            self.formattedData.push(temp);
        }

        console.log("selected states:");
        console.log(selectedStates);
        console.log(self.formattedData);

        self.xScale = d3.scaleBand()
            .domain(self.datesDomain)
            .range([0, self.svgWidth - self.xAxisWidth]);
        self.yScale = d3.scaleLinear()
            .domain([0, self.maxValue])
            .range([self.svgHeight - self.yAxisHeight, 0]);
        self.zScale = d3.scaleOrdinal(d3.schemeCategory10);


        // define the line
        self.valueLine = d3.line()
            .x(function (d) {
                return self.xScale(d.date) + 17;
            })
            .y(function (d) {
                return self.yScale(d.price);
            })
            .defined(function (d) {
                return d.price != 0;
            });

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
                return getInterpolation(d.series);
            });
        lines = lines.merge(linesEnter);

        // Required for fancy animation
        var getInterpolation = function (indexSeries) {

            var interpolate = d3.scaleQuantile()
                .domain([0,1])
                .range(d3.range(1, indexSeries.length + 1));

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
        self.svg.select("#xAxis")
            .attr("transform", "translate(" + self.margin.left + "," + (self.svgHeight - self.yAxisHeight + self.margin.top) + ")")
            .call(d3.axisBottom(self.xScale))
            .selectAll('text')
            .attr("x", -18)
            .attr("y", 5)
            .attr("transform", "rotate(-45)");

        // Draw y axis
        self.svg.select("#yAxis")
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
                return self.xScale(d.date) + 17;
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
                return self.xScale(d.date) + 17;
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
            .attr("x", self.svgWidth - self.xAxisWidth - 10)
            .attr("y", function (d) {
                return self.yScale(d.series[d.series.length - 1].price) + 6;
            });


        // Old code
        // // Draw line
        // self.svg.select("#line")
        //     .attr("transform", "translate(" + self.margin.left + "," + self.margin.top + ")")
        //     .append("path")
        //     .data([self.formatData.series])
        //     .classed("line", true)
        //     .attr("d", self.valueLine)
        //     .style("stroke", function (d) {
        //         return self.zScale(d.abbr);
        //     });
        //
        // // Draw x axis
        // self.svg.select("#xAxis")
        //     .attr("transform", "translate(" + self.margin.left + "," + (self.svgHeight - self.yAxisHeight + self.margin.top) + ")")
        //     .call(d3.axisBottom(self.xScale))
        //     .selectAll('text')
        //     .attr("x", -18)
        //     .attr("y", 5)
        //     .attr("transform", "rotate(-45)");
        //
        // // Draw y axis
        // self.svg.select("#yAxis")
        //     .attr("transform", "translate(" + self.margin.left + "," + self.margin.top + ")")
        //     .call(d3.axisLeft(self.yScale));
        //
        // // Draw dots
        // self.svg.selectAll("dot")
        //     .data(self.formatData.series)
        //     .enter()
        //     .append("circle")
        //     .attr("transform", "translate(" + self.margin.left + "," + self.margin.top + ")")
        //     .attr("r", 3)
        //     .attr("cx", function (d) {
        //         return self.xScale(d.date) + 12;
        //     })
        //     .attr("cy", function (d) {
        //         return self.yScale(d.price);
        //     })
        //     .attr("style", "border: 2px solid #fff;");
    });
};
