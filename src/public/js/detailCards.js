/**
 * Constructor for the DetailCards
 */
function DetailCards() {
    var self = this;
    self.init();
};

/**
 * Initializes the svg elements required for this chart
 */
DetailCards.prototype.init = function () {
    var self = this;
};

/**
 * Create a line chart
 *
 * @param selectedState
 */
DetailCards.prototype.update = function (selectedStates) {
    var self = this;

    var cards = d3.select("#detail-cards");

    //  Remove existing cards, this will prevent duplicate state cards from appearing
    cards.selectAll("div").remove();

    d3.csv("data/states_facts.csv", function(error, data){

        self.states = [];
        //  Get the state data
        for (var abbr in selectedStates) {
            // Get state data
            var state = data.filter(function (d) {
                return d.abbr == selectedStates[abbr]
            });

            state = state[0];

            self.states.push(state);

            var div = cards.append("div")
                .attr("id",state["abbr"])
                .attr("class","card card-inverse")
                .attr("style","background-color: #333; border-color: #333;");

            div.append("h4")
                .attr("class","card-title")
                .text(state.name);

            var ul = div.append("ul");
            ul.append("li").attr("class","card-text").text("Capital: " + state.capital_city);
            ul.append("li").attr("class","card-text").text("Largest City: " + state.largest_city);
            ul.append("li").attr("class","card-text").text("Statehood: " + state.statehood);
            ul.append("li").attr("class","card-text").text("Population (2015): " + state.population2015);
            ul.append("li").attr("class","card-text").text("Area: " + state.area_sqmi + " Square Miles");
            ul.append("li").attr("class","card-text").text("Land Area: " + state.land_area_sqmi + " Square Miles");
            ul.append("li").attr("class","card-text").text("Water Area: " + state.water_area_sqmi + " Square Miles");
            ul.append("li").attr("class","card-text").text("Representives: " + state.reps);

        };

        //console.log(self.states);
    });

};
