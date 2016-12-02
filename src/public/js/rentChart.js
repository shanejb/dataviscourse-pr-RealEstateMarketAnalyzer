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
    self.margin = {top: 10, right: 20, bottom: 30, left: 65};
    var divRentChart = d3.select("#rent-chart");

    // Get access to the div element created for this chart from HTML
    self.svgBounds = divRentChart.node().getBoundingClientRect();
    self.xAxisWidth = 100;
    self.yAxisHeight = 55;
    self.svgWidth = self.svgBounds.width - self.margin.left - self.margin.right;
    self.svgHeight = 310 - self.margin.top - self.margin.bottom;

    // Creates svg element within the div
    self.svg = divRentChart.append("svg")
        .attr("width", self.svgWidth)
        .attr("height", self.svgHeight);

    self.svg.append("g").attr("id", "xAxis");
    self.svg.append("g").attr("id", "yAxis");
    self.svg.append("g").attr("id", "lines");
    self.svg.append("g").attr("id", "axis-labels");

    // x axis label
    self.svg.select("#axis-labels")
        .style("visibility", "hidden");
    self.svg.select("#axis-labels")
        .append("text")
        .attr("text-anchor", "middle")
        .attr("x", (self.svgWidth / 2))
        .attr("y", self.svgHeight)
        .text("Months")
        .style("font-size", "12px");

    // y axis label
    self.svg.select("#axis-labels")
        .append("text")
        .attr("text-anchor", "middle")
        .attr("x", (self.svgHeight - self.yAxisHeight) / 2 * -1)
        .attr("y", 10)
        // .attr("dy", "0.55em")
        .attr("transform", "rotate(-90)")
        .text("Price ($)")
        .style("font-size", "12px");

    self.message = self.svg.append("text")
        .attr("id", "hri-message")
        .attr("x", 0)
        .attr("y", 30)
        .text("To get started, please select one or more states from the map on the left.");
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

        if (selectedStates.length == 0) {
            self.message.text("You have not selected any states from the map.");
            self.svg.select("#xAxis").style("visibility", "hidden");
            self.svg.select("#yAxis").style("visibility", "hidden");
            self.svg.select("#axis-labels").style("visibility", "hidden");
        } else if (selectedStates.indexOf("LA") > -1) {
            //  Do nothing for LA
            //self.message.text("We currently do not have data for Louisiana state. Please try some other states.");
        } else {
            self.message.text("");
            self.svg.select("#xAxis").style("visibility", "visible");
            self.svg.select("#yAxis").style("visibility", "visible");
            self.svg.select("#axis-labels").style("visibility", "visible");
        }

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

        // Handle hovering effect
        lines
            .on("mouseover", function (d) {
                var selected = d3.select(this);         // on mouseover of each line, give it a nice thick stroke
                selected.select(".line")
                    .style("stroke-width", "5px");
                selected.selectAll("circle")
                    .attr("r", "5")
                    .style("stroke-width", "2px");

                // d3.selectAll(".line")
                //     .style("opacity", function (d) {
                //         return (d == selected.data()[0]) ? 0.8 : 0.2;
                //     });

                // Select other line groups and reduce the opacity
                var selectOtherLines = lines
                    .filter(function (d) {
                        return d != selected.data()[0];
                    });

                selectOtherLines.select("path")
                    .style("opacity", 0.2);

                selectOtherLines.selectAll("circle")
                    .style("opacity", 0.2);

                selectOtherLines.select("text")
                    .style("opacity", 0.2);

                // Sort them so selected line is on top of other lines
                lines.sort(function (a, b) {
                    if (a != selected.data()[0]) {
                        return -1;
                    }
                    return 1;
                })
            })
            .on("mouseout", function (d) {
                var selected = d3.select(this);
                selected.select(".line")
                    .style("stroke-width", "2px");
                selected.selectAll("circle")
                    .attr("r", "3")
                    .style("stroke-width", "1px");

                var selectOtherLines = lines
                    .filter(function (d) {
                        return d != selected.data()[0];
                    });

                selectOtherLines.select("path")
                    .style("opacity", 0.8);

                selectOtherLines.selectAll("circle")
                    .style("opacity", 0.8);

                selectOtherLines.select("text")
                    .style("opacity", 0.8);
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
            .attr("x", self.svgWidth - self.xAxisWidth - 7)
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
