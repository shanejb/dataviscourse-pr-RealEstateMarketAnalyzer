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
    self.svgHeight = 400 - self.margin.top - self.margin.bottom;

    // Creates svg element within the div
    self.svg = divHouseChart.append("svg")
        .attr("width", self.svgWidth)
        .attr("height", self.svgHeight);

    self.svg.append("g").attr("id", "xAxis");
    self.svg.append("g").attr("id", "yAxis");
    self.svg.append("g").attr("id", "line");

    d3.csv("data/State_Zhvi_AllHomes.csv", function(error, data) {
        var selectedState = data[0];
        console.log(selectedState);

        self.yearsDomain = [];
        self.formatData = {
            RegionName: selectedState['RegionName'],
            abbr: selectedState['abbr'],
            series: []
        };
        self.maxValue = 0;

        for (var i = 1996; i < 2017; i++) {
            self.yearsDomain.push(i);
            self.formatData['series'].push({ year: i, price: selectedState[i]});
            self.maxValue = selectedState[i] > self.maxValue ? selectedState[i] : self.maxValue;
        }

        console.log(self.formatData);

        self.xScale = d3.scaleBand()
            .domain(self.yearsDomain)
            .range([0, self.svgWidth - self.xAxisWidth]);
        self.yScale = d3.scaleLinear()
            .domain([0, self.maxValue])
            .range([self.svgHeight - self.yAxisHeight, 0]);

        // define the line
        self.valueLine = d3.line()
            .x(function (d) {
                return self.xScale(d.year) + 12;
            })
            .y(function (d) {
                return self.yScale(d.price);
            });

        // Draw line
        self.svg.select("#line")
            .attr("transform", "translate(" + self.margin.left + "," + self.margin.top + ")")
            .append("path")
            .data([self.formatData.series])
            .classed("line", true)
            .attr("d", self.valueLine);

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

        // Draw dots
        self.svg.selectAll("dot")
            .data(self.formatData.series)
            .enter()
            .append("circle")
            .attr("transform", "translate(" + self.margin.left + "," + self.margin.top + ")")
            .attr("r", 3)
            .attr("cx", function (d) {
                return self.xScale(d.year) + 12;
            })
            .attr("cy", function (d) {
                return self.yScale(d.price);
            })
            .attr("style", "border: 2px solid #fff;");
    });
};

/**
 * Create a line chart
 *
 * @param selectedState
 */
HouseChart.prototype.update = function (selectedStates) {
    var self = this;
};
