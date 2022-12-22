$("#q").keydown(function (event) {
  $("#r").show();
  $.post(
    "/search",
    {
      q: $("#q").val(),
    },
    function (data, status) {
      $("#r1").html(data[0].title.slice(0, 55));
      $("#r1").attr("href", "/item/" + data[0].id);
      $("#r2").html(data[1].title.slice(0, 55));
      $("#r2").attr("href", "/item/" + data[0].id);
      $("#r3").html(data[2].title.slice(0, 55));
      $("#r3").attr("href", "/item/" + data[0].id);
      $("#r4").html(data[3].title.slice(0, 55));
      $("#r4").attr("href", "/item/" + data[0].id);
      $("#r5").html(data[4].title.slice(0, 55));
      $("#r5").attr("href", "/item/" + data[0].id);
      $("#r6").html(data[4].title.slice(0, 55));
      $("#r6").attr("href", "/item/" + data[0].id);
    }
  );
});

$(document).on("click", function () {
  $("#r").hide();
});
