window.Canvas={swirl:function(e,f,a,b){var c=$("<canvas />"),d=c[0].getContext("2d");c.attr("width",px(a));c.attr("height",px(a));c.css({"margin-top":"-0.5em","border-radius":px(5)});d.fillStyle="white";d.fillRect(0,0,a,a);var g=function(){d.strokeStyle=e;d.lineWidth=f;var c=a/4+6;d.moveTo(3,c);d.beginPath();for(var b=0;b<a;b++){var g=.2*b;d.lineTo(3+b,c+(1+4*g)*Math.sin(g)*.8)}d.stroke()};g();b&&(f=1,e="black",d.fillStyle=e,g());return c},circle:function(e,f,a){a=a||f;var b=$("<canvas />"),c=a/2;
b.attr("width",a);b.attr("height",a);b.css({width:px(a),height:px(a)});a=b[0].getContext("2d");a.fillStyle=e;a.strokeStyle=e;a.beginPath();a.arc(c,c,f/2,0,2*Math.PI);a.closePath();a.fill();return b}};