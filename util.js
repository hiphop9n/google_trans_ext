/*
 * 배열 순서 섞기 Function
 * @author Jong Pil Kim
 * @since 2016. 7. 29.
*/
function shuffle(a, length) {
    var j, x, i;

    for (i = a.length; i; i--) {
        j = Math.floor(Math.random() * i);
        x = a[i - 1];
        a[i - 1] = a[j];
        a[j] = x;
    }
    return a;
};

/**
 * max, min 값에 따른 랜덤 발생 함수
 */
function getRandomCount(min, max, times) {
	if(undefined == times) {
		times = 1;
	}
	return Math.floor((Math.random() * (parseInt(max, 10) - parseInt(min, 10) + 1)) + parseInt(min, 10)) * parseInt(times, 10);
};

/**
 * isEmpty 함수
 */
function isEmpty(param) {
    if(undefined != param && null != param && '' != param) {
        return false;
    }
    return true;
};

String.prototype.string = function(len){var s = '', i = 0; while (i++ < len) { s += this; } return s;};
String.prototype.zf = function(len){return "0".string(len - this.length) + this;};
Number.prototype.zf = function(len){return this.toString().zf(len);};
Date.prototype.format = function(f) {
    if (!this.valueOf()) return " ";

    var weekName = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
    var d = this;

    return f.replace(/(yyyy|yy|MM|dd|E|hh|mm|ss|a\/p)/gi, function($1) {
        switch ($1) {
            case "yyyy": return d.getFullYear();
            case "yy": return (d.getFullYear() % 1000).zf(2);
            case "MM": return (d.getMonth() + 1).zf(2);
            case "dd": return d.getDate().zf(2);
            case "E": return weekName[d.getDay()];
            case "HH": return d.getHours().zf(2);
            case "hh": return ((h = d.getHours() % 12) ? h : 12).zf(2);
            case "mm": return d.getMinutes().zf(2);
            case "ss": return d.getSeconds().zf(2);
            case "a/p": return d.getHours() < 12 ? "오전" : "오후";
            default: return $1;
        }
    });
};

 /**
  * 문자열 치환 함수
  */
replaceAll = function(input,search,replace){
    while(input.indexOf(search) != -1){
        input = input.replace(search,replace);
    }
    return input;
};

/* ------------------------------------------------------------------------------------------------------------------------------------ */

