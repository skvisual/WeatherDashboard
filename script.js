//  .ready method waits to execute javascript code until after the HTML is loaded
$(document).ready(function() {
  // bind an 'onclick' listener to HTML element with id="search-button" (the search icon)
  $("#search-button").on("click", function() {
    // when the search icon is clicked, execute this block of code
    // set 'searchValue' to the string entered in the text box
    var searchValue = $("#search-value").val();

    // clear input box
    $("#search-value").val("");

    // call function searchWeather() and pass searchValue as an argument
    searchWeather(searchValue);
  });
  // event listener bound to values in the list of previous cities searched, executes searchWeather()
  $(".history").on("click", "li", function() {
    searchWeather($(this).text());
  });

  // function to render li tags under the ul tag showing the cities previously searched
  function makeRow(text) {
    // create an li tag with the city name
    var li = $("<li>").addClass("list-group-item list-group-item-action").text(text);
    // append the li to the ul tag
    $(".history").append(li);
  }

  // function to request data from the openweather API for the city entered, get current conditions
  function searchWeather(searchValue) {
    // GET request to the API, searching for weather information for city name entered.  Ajax allows asynchronous operation so other script can execute while the app waits for openweather to respond
    $.ajax({
      // GET request asks for information to be returned from the API
      type: "GET",
      // URL meeting the API requirements to GET data for a particular location
      url: "https://api.openweathermap.org/data/2.5/weather?q=" + searchValue + "&appid=600327cb1a9160fea2ab005509d1dc6d&units=imperial",
      // response will be in JSON (javascript object notation) format
      dataType: "json",
      // if there is no error sent by the API, execute the callback function
      success: function(data) {
        // create history link for this search
        //  If searchValue is not in the history, add it to an array history[]
        if (history.indexOf(searchValue) === -1) {
          history.push(searchValue);
          // also store an new location in local storage to provide data persistence
          window.localStorage.setItem("history", JSON.stringify(history));
          // call function makeRow() to append a new row to the history list
          makeRow(searchValue);
        }
        
        // clear any old content
        $("#today").empty();

        // create html content for current weather
        // the following variables hold specific weather data for the location searched as provided by the API
        // .toLocaleDateString() converts the date to text.
        var title = $("<h3>").addClass("card-title").text(data.name + " (" + new Date().toLocaleDateString() + ")");
        // a 'card' is created to hold the current weather conditions
        // other elements are created to hold the data for the current conditions
        var card = $("<div>").addClass("card");
        var wind = $("<p>").addClass("card-text").text("Wind Speed: " + data.wind.speed + " MPH");
        var humid = $("<p>").addClass("card-text").text("Humidity: " + data.main.humidity + "%");
        var temp = $("<p>").addClass("card-text").text("Temperature: " + data.main.temp + " °F");
        // create the card body div with class="card-body"
        var cardBody = $("<div>").addClass("card-body");
        var img = $("<img>").attr("src", "https://openweathermap.org/img/w/" + data.weather[0].icon + ".png");

        // merge and add to page
        title.append(img);
        // add the current conditions data to the card div (class="card-body")
        cardBody.append(title, temp, humid, wind);
        // appends content (.card-body) to the card
        card.append(cardBody);
        $("#today").append(card);

        // call follow-up api endpoints
        getForecast(searchValue);
        getUVIndex(data.coord.lat, data.coord.lon);
      },
        // add error handling to the ajax GET call.  The function operates if an error ia returned by ajax.
        error: function(xhr, status, error){
          // xhr.status is the error code (400, etc.), and xhr.statusText is the description ('Bad Request', etc.)
          var errorMessage = xhr.status + ': ' + xhr.statusText
          var modalTitle = $('.modal-title');
          // render the error message to the modal title h5 element
          modalTitle.text('ERROR: ' + errorMessage);
          // activate Bootstrap modal dialog
          $('#myModal').modal('show')
        }
    });
  }
  
  // function to get the five day forecast
  function getForecast(searchValue) {
    $.ajax({
      type: "GET",
      url: "https://api.openweathermap.org/data/2.5/forecast?q=" + searchValue + "&appid=600327cb1a9160fea2ab005509d1dc6d&units=imperial",
      dataType: "json",
      success: function(data) {
        // overwrite any existing content with title and empty row
        $("#forecast").html("<h4 class=\"mt-3\">5-Day Forecast:</h4>").append("<div class=\"row\">");

        // loop over all forecasts (by 3-hour increments)
        for (var i = 0; i < data.list.length; i++) {
          // only look at forecasts around 3:00pm
          if (data.list[i].dt_txt.indexOf("15:00:00") !== -1) {
            // create html elements for a bootstrap card
            var col = $("<div>").addClass("col-md-2");
            var card = $("<div>").addClass("card bg-primary text-white");
            var body = $("<div>").addClass("card-body p-2");

            var title = $("<h5>").addClass("card-title").text(new Date(data.list[i].dt_txt).toLocaleDateString());

            var img = $("<img>").attr("src", "https://openweathermap.org/img/w/" + data.list[i].weather[0].icon + ".png");

            var p1 = $("<p>").addClass("card-text").text("Temp: " + data.list[i].main.temp_max + " °F");
            var p2 = $("<p>").addClass("card-text").text("Humidity: " + data.list[i].main.humidity + "%");

            // merge together and put on page
            col.append(card.append(body.append(title, img, p1, p2)));
            $("#forecast .row").append(col);
          }
        }
      }
    });
  }

  // function to get the UV index based on latitude and longitude gathered in searchWeather()
  function getUVIndex(lat, lon) {
    $.ajax({
      type: "GET",
      // request data including lat and long
      url: "https://api.openweathermap.org/data/2.5/uvi?appid=600327cb1a9160fea2ab005509d1dc6d&lat=" + lat + "&lon=" + lon,
      dataType: "json",
      success: function(data) {
        // create elements to display the uv data
        var uv = $("<p>").text("UV Index: ");
        var btn = $("<span>").addClass("btn btn-sm").text(data.value);
        
        // change color depending on uv value
        if (data.value < 3) {
          btn.addClass("btn-success");
        }
        else if (data.value < 7) {
          btn.addClass("btn-warning");
        }
        else {
          btn.addClass("btn-danger");
        }
        
        $("#today .card-body").append(uv.append(btn));
      }
    });
  }

  // get current history, if any
  var history = JSON.parse(window.localStorage.getItem("history")) || [];
  // get the weather conditions for the last location saved to local storage
  if (history.length > 0) {
    searchWeather(history[history.length-1]);
  }
  // render the search history by adding 'li's to the 'ul'.
  for (var i = 0; i < history.length; i++) {
    makeRow(history[i]);
  }
});