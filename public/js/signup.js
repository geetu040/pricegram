$("#invalid-username").hide();
$("#username").keyup(function (event) {
  $.post(
    "/username",
    {
      username: $("#username").val(),
    },
    function (data, status) {
      if (data.username == $("#username").val()) {
        $("#invalid-username").html("username already exists!");
        $("#user-div").css("margin", "0px");
        $("#invalid-username").show();
      } else {
        $("#invalid-username").hide();
        $("#user-div").css("margin-bottom", "1rem");
      }
    }
  );
});
