$(function() {
    $(window).resize(function(){
        updateGrids();
    })
    $( ".resizable" ).resizable({resize:function(){
        updateGrids();
    }});
    updateGrids();
});
function updateGrids(){
    $(".grid").gridPanel();
}
function addDemo2Content(){
    $("#demo2grid .grid-item2").append("Content<br/>");
    updateGrids();
}
function clearDemo2Content(){
    $("#demo2grid .grid-item2").empty();
    updateGrids();
}

