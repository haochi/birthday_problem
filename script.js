window.fbAsyncInit = function() {
  FB.init({
    appId      : '346054032138606', // App ID
    channelUrl : '/channel.html', // Channel File
    status     : true, // check login status
    cookie     : true, // enable cookies to allow the server to access the session
    oauth      : true, // enable OAuth 2.0
    xfbml      : true  // parse XFBML
  });

  FB.getLoginStatus(after_login);

  $("#login").click(function(e){
    e.preventDefault();
    FB.login(after_login, {scope: 'user_birthday,friends_birthday'});
  });
};


function after_login(response){
  var list = $("#list")
    , message = $("#message")
    , title = $("<h2>")
    , text = $("<p>");
  if(response.authResponse){
    $("#login").remove();
    FB.api({
      method: 'fql.query',
      query: 'SELECT uid, name, birthday_date FROM user WHERE uid = me() OR uid IN (SELECT uid2 FROM friend WHERE uid1 = me())'
    }, function(users) {
      var birthdays = []
        , _users = {};
      _.each(users, function(user){
        var birthdate = user.birthday_date;
        if(birthdate){
          _users[user.uid] = user;
          birthday = birthdate.substring(0, 5);
          (birthdays[birthday] || (birthdays[birthday] = [])).push(user.uid);
        }
      });

      _.each(_.keys(birthdays).sort(), function(birthday){
        var friends = birthdays[birthday];
        if(friends.length > 1){
          var li = $("<li>");
          li.append($("<span>").text(birthday));
          _.each(friends, function(uid){
            var user = _users[uid];
            li.append($("<a>").attr("href", "http://facebook.com/profile.php?id="+uid).text(user.name));
          });
          li.appendTo(list);
        }
      });

      var pairs = list.find("li").length;
      if(pairs > 0){
        title.text("Congratulations!");
        var friends_with_birthday = _.keys(_users).length;
        if(friends_with_birthday > 366){
          text.text("You have more than 366 friends, so it's not a surprise that you beat the birthday paradox.");
        }else{
          text.html(_.template(["With <%= number_of %> friends with birthdays on Facebook,",
                             "the probability of having <strong>one</strong> pair of friends with the same birthday is <%= probability %>,",
                             "but you beat the birthday paradox with <strong><%= pairs %></strong> of friends!"].join(" "),
          {
            probability: p(friends_with_birthday) * 100 + "%",
            number_of: friends_with_birthday,
            pairs: pairs == 1 ? pairs + " groups" : pairs + " groups"
          }));
        }
      }else{
        title.text("D'oh");
        text.text("I can't find any groups of your Facebook friends with the same birthday. :(");
      }
      message.append(title).append(text).addClass("alert");
    });
  }
}

function p(n){
  return 1 - p_bar(n);
}

function p_bar(n){
  var r = 1;
  for(var i=1; i<n; i++){
    r *= (1 - i/365);
  }
  return r;
}
