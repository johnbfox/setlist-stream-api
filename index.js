var config = require('./config/config.json'),
    express = require('express'),
    twitter = require('twitter'),
    http = require('http'),
    app = express(),
    twit = new twitter({
      consumer_key: config['consumer_key'],
      consumer_secret: config['consumer_secret'],
      access_token_key: config['access_token_key'],
      access_token_secret: config['access_token_secret']
    }),
    shows = require('./data/shows.json')["shows"],
    showOngoing = false,
    songArray = new Array();

app.set('port', (process.env.PORT || 5000));

app.get('/', function(request, response) {
  response.send("Welcome to the Phish");
});

app.get('/phish', function(request, response) {

  var dateStamp = new Date(),
  currentDay = dateStamp.getDate(),
  currentMonth = dateStamp.getMonth(),
  currentYear  = dateStamp.getFullYear(),
  currentHours = dateStamp.getHours(),
  currentDate = new Date(Date.UTC(currentYear, currentMonth, currentDay, currentHours)),
  nextShow,
  respContents;

  if(showOngoing){
    //send show response with setlist
    respContents = {
      data:{
        'setlist': songArray,
        'is-phish-playing': showOngoing,
        'time': new Date()
      }
    }
  }else{
    //find out which show is next to place in response
    for(var i = 0; i < shows.length; i++){
      var showDate = new Date(Date.UTC(shows[i]["year"], shows[i]["month"], shows[i]["day"], shows[i]["hours"]));
      if(!nextShow){
        nextShow = shows[i];
      }else{
        if(shows[i] ["month"] <= nextShow["month"] && shows[i]["day"] < nextShow["day"] && shows[i]["year"] <= nextShow["year"]){
          nextShow = shows[i];
        }
      }
    }
    responseText = "Next show:\n" + (parseInt(nextShow["month"])+1) + '-' + nextShow["day"] + '-' + nextShow["year"] + '\n' + nextShow["venue"] + '\n' + nextShow["location"];

    respContents = {
      data:{
        'is-phish-playing': false,
        'next-show-text': responseText
      }
    }
  }

  response.send(respContents);
});

app.listen(app.get('port'), function() {
  console.log('Phish songlistener is running on port', app.get('port'));

  //hit api every 5 minutes to prevent from sleeping
  setInterval(function() {
      http.get("http://safe-tundra-67149.herokuapp.com/");
  }, 300000);

  twit.stream('statuses/filter',{ follow: '153850397' }, function(stream) {
    stream.on('data', function(tweet) {
      //kicks off show listener
      if(tweet.text.indexOf("SET ONE:") > -1){
        showOngoing = true;
      }
      //indicates show has ended
      if(tweet.text.indexOf("is now available for download.") > -1){
        showOngoing = false;
        songArray = [];
      }
      if(showOngoing){
        var songTweet = {
          timestamp: tweet.created_at,
          text: tweet.text
        }
        songArray.push(songTweet);
      }
    });

    stream.on('error', function(error) {
      throw error;
    });

  });
});
