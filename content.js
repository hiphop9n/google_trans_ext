console.log("========== " + G_PROJECT_NAME + " Content is running " + " ==========");

var delay_count = '0';

/*----------------------- 이벤트 영역 -----------------------*/

/* 마우스 클릭 이벤트 함수 */
var simulateMouseClickEvent = function(jquery_target, js_target) {

    // 카테고리 클릭
    var mouseEvent = document.createEvent('MouseEvent');
    var client_info = js_target.getBoundingClientRect();
    var page_x = getRandomCount(jquery_target.offset().left, (jquery_target.offset().left + jquery_target.width()), 1);
    var page_y = getRandomCount(jquery_target.offset().top, jquery_target.offset().top + jquery_target.height(), 1);
    var client_x = page_x - $(window).scrollLeft();
    var client_y = page_y - $(window).scrollTop();
    // 창 30,30 기준으로 top frame 25px, left frame 3px
    var screen_x = client_x + getRandomCount(10, 33, 1);
    // 창 30,30 기준으로 top frame 25px, left frame 3px
    var screen_y = client_y + getRandomCount(10, 33, 1);

    mouseEvent.initMouseEvent('click', true, true, window, 0, screen_x, screen_y, client_x, client_y, false, false, false, false, 0, null);

    js_target.dispatchEvent(mouseEvent);
};

/* 마우스 오버 이벤트 함수 */
var simulateMouseOverEvent = function(jquery_target, js_target) {

    // 카테고리 클릭
    var mouseEvent = document.createEvent('MouseEvent');
    var client_info = js_target.getBoundingClientRect();
    var page_x = getRandomCount(jquery_target.offset().left, (jquery_target.offset().left + jquery_target.width()), 1);
    var page_y = getRandomCount(jquery_target.offset().top, jquery_target.offset().top + jquery_target.height(), 1);
    var client_x = page_x - $(window).scrollLeft();
    var client_y = page_y - $(window).scrollTop();
    // 창 30,30 기준으로 top frame 25px, left frame 3px
    var screen_x = client_x + getRandomCount(10, 33, 1);
    // 창 30,30 기준으로 top frame 25px, left frame 3px
    var screen_y = client_y + getRandomCount(10, 33, 1);

    mouseEvent.initMouseEvent('mouseover', true, true, window, 0, screen_x, screen_y, client_x, client_y, false, false, false, false, 0, null);

    js_target.dispatchEvent(mouseEvent);
};
/*--------------------------------------------------------------------*/

/*----------------------- 프로세스 영역 -----------------------*/

/*
 * 작업 정보 조회 프로세스 message
 */
var get_process_settings = {
    requestMessage : {background_action: "get_process", page_hostname : location.hostname},
    messageCallback : function(response) {
        if(response.replCd != '00') {
            console.log(response);
        }
    }
};

/*
 * 프로그램 새로고침 프로세스 message
 */
var reload_process_settings = {
    requestMessage : {background_action: "reload_process", page_hostname : location.hostname},
    messageCallback : function(response) {
        if(response.replCd != '00') {
            console.log(response);
        }
    }
};

/*--------------------------------------------------------------------*/

/*----------------------- 라우터 영역 -----------------------*/

/*
 * 정상 Index 페이지로 이동 함수
 */
var goToIndexPage = function(result) {
    console.log('정상 Index 페이지로 이동');
    try {
        var result = result;
        location.href = 'http://localhost/openTab';
    } catch(err) {
        console.log(err);
        processSendMessage(reload_process_settings);
    }
};

/*
 * 에러 Index 페이지로 이동 함수
 */
var initPage = function(result) {
    console.log('5초 후 에러 Index 페이지로 이동');
    try {
        var result = result;
        setTimeout(function(){
            location.href = 'http://localhost/openTab';
        }, 5 * 1000);
    } catch(err) {
        console.log(err);
        processSendMessage(reload_process_settings);
    }
};

/*
 * 수행 작업 요청 함수
 */
var requestProcessPage = function(result) {
    console.log('수행 작업 요청');
    try {
        var result = result;
        processSendMessage(get_process_settings);
    } catch(err) {
        console.log(err);
        processSendMessage(reload_process_settings);
    }
};

/*
 * 구글 번역 메인 페이지 이동 함수
 */
var goToMainPage = function(result) {

    console.log('구글 번역 메인 페이지 이동');

    try {

        var result = result;
        
        // #gt-sl-gms-menu table tbody tr td div.goog-menuitem-group div.goog-menuitem.goog-option > goog-menuitem-content > goog-menuitem-checkbox
        // FROM[EN:영어(:1n), KR:한국어(:2t), JP:일본어(:1x), CN:중국어간체(:21), DE:독일어(:9)]
        var from_lang = result['FROM_LANG'].toLowerCase();

        // #gt-tl-gms-menu table tbody tr td div.goog-menuitem-group div.goog-menuitem.goog-option > goog-menuitem-content > goog-menuitem-checkbox
        // TO[EN:영어(:4j), KR:한국어(:5q)]
        var to_lang = result['TO_LANG'].toLowerCase();

        var pre_data = result['PRE_DATA'];
        var source_lang = null;
        var target_lang = null;
        var url = 'https://translate.google.com/#';

        switch(from_lang) {
            case 'kr' :
                source_lang = 'ko';
                break;
            case 'de' :
                source_lang = 'de';
                break;
            case 'jp' :
                source_lang = 'ja';
                break;
            case 'cn' :
                source_lang = 'zh-CN';
                break;
            default :
                source_lang = 'en';
        }

        switch(to_lang) {
            case 'kr' :
                target_lang = 'ko';
                break;
            default :
                target_lang = 'en';
        }

        //url += source_lang + '/' + target_lang + '/' + pre_data;
        url += source_lang + '/' + target_lang;

        location.href = url;

    } catch(err) {
        console.log(err);
        processSendMessage(reload_process_settings);
    }
};

/*
 * 구글 페이지 번역 결과 함수
 */
var setResultPage = function(result) {

    console.log('구글 페이지 번역 결과');

    try {

        ++delay_count;

        var transResult = result;

        $('textarea#source').val(result.pre_data);
        $('#gt-lang-submit > #gt-submit').click();

        var resultTimeout = null;
        var source_textarea = $('textarea#source');
            source_textarea.focus();
            simulateMouseClickEvent(source_textarea, source_textarea.get(0));

        var after_data = $.trim($('#result_box').text());

        if( isEmpty(after_data) 
            || after_data.includes('번역 중')
            || ( $('#gt-res-error').css('display').toString() == 'none' && !isEmpty( $('#gt-res-error').text() ) )
            || ( $('#gt-res-error').css('display').toString() != 'none' && !isEmpty( $('#gt-res-error').text() ) )
            || after_data.substring(0,20).includes('Translating')
            || after_data.substring(0,20).includes('Request')
            || after_data.substring(0,20).includes('error')
            || after_data.substring(0,20).includes('big') ) {

            if(delay_count <= 10) {

                resultTimeout = setTimeout(function() {
                    console.log('결과 재요청 대기[delay_count : ' + delay_count + ']');
                    setResultPage(transResult);
                }, 1000);

            } else {
                processSendMessage(reload_process_settings);
            }

        } else {

            clearTimeout(resultTimeout);

            var href = location.href;

            transResult['after_data'] = after_data;

            var result_process_settings = {
                requestMessage : {background_action: "result_process", page_hostname : location.hostname, param : transResult},
                messageCallback : function(response) {
                    if(response.replCd != '00') {
                        console.log(response);
                    }
                }
            };

            chrome.runtime.sendMessage(result_process_settings.requestMessage,result_process_settings.messageCallback);

        }

    } catch(err) {
        console.log(err);
        processSendMessage(reload_process_settings);
    }
};

/*
 * 업무 요청에 따라 수행할 콜백 ROUTER 모음
 */
var pageRouter = {
    request_process_page : requestProcessPage,
    go_to_index_page : goToIndexPage,
    init_page : initPage,
    go_to_main_page : goToMainPage,
    set_result_page : setResultPage
};

/* background.js에서 sendMessage Listener */
chrome.runtime.onMessage.addListener(function(request, sender, callback) {
    console.log('####### background.js에서 sendMessage Listener 시작 ###### ');
    try {

        console.log(request);
        var action = request.action;
        var current_tab_id = request.current_tab_id;
        var param = request.param;

        if(action === 'request_process_page' || action === 'go_to_index_page' || action === 'init_page' || action === 'go_to_main_page' || action === 'set_result_page') {

            pageRouter[action](param);

        } 

    } catch(err) {
        console.log(err);
    }

    console.log('####### background.js에서 sendMessage Listener 종료 ###### ');
});

/*--------------------------------------------------------------------*/

var processSendMessage = function(settings) {
    console.log('---------- PROCESS SEND MESSAGE[' + settings.requestMessage.background_action + '] ----------');
    chrome.runtime.sendMessage(settings.requestMessage,settings.messageCallback);
};

$(document).ready(function() {
    console.log('---------- 페이지 로딩 [' + location.hostname + location.pathname + ']---------');
    if (location.hostname == 'translate.google.com') {
        processSendMessage(get_process_settings);
        console.log('수행할 업무 요청 완료[' + location.hostname + location.pathname + ']');
    }
    else if(location.hostname == 'localhost') {
        if(location.pathname == '/openTab') {
            processSendMessage(get_process_settings);
            console.log('수행할 업무 요청 완료[' + location.hostname + location.pathname + ']');
        } else {
            processSendMessage(reload_process_settings);
            console.log('새로고침 요청 완료[' + location.hostname + location.pathname + ']');
        }
    }
    else {
        console.log('작업 수행 domain이 아님[' + location.hostname + location.pathname + ']');
    }
});

/* ------------------------------------------------- */

/* 오류 방지 스크립트
   10분동안 머무르면 extension 새로고침
*/
setTimeout(function(){
    console.log('오류 방지 스크립트');
    processSendMessage(reload_process_settings);
}, 5 * 60 * 1000);
