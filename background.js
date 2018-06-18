console.log('========== ' + G_PROJECT_NAME + ' Background is running ' + ' ==========');

// "Database 이름", "Database Version", "Database 설명", "Database Size KB"
var db = openDatabase("google_translation_collector", "1.0", "구글 번역 데이터 수집기", "2048 * 1024 * 1024");
db.transaction(function (tx) {
      tx.executeSql('CREATE TABLE IF NOT EXISTS TB_PROCESS (storage_key unique, status, job_id, to_lang, from_lang, pre_data, etc, reg_time)');
});

var SELECT_PROCESS_SQL = 'SELECT storage_key, status, job_id, to_lang, from_lang, pre_data, etc, reg_time FROM TB_PROCESS WHERE storage_key = ?';
var INSERT_PROCESS_SQL = 'INSERT INTO TB_PROCESS (storage_key, status, job_id, to_lang, from_lang, pre_data, etc, reg_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
var UPDATE_PROCESS_SQL = 'UPDATE TB_PROCESS SET status = ?, job_id = ?, to_lang = ?, from_lang = ?, pre_data = ?, etc = ? WHERE storage_key = ?';
var DELETE_PROCESS_SQL = 'DELETE FROM TB_PROCESS WHERE storage_key = ?';

var exec_web_sql = function(sql, storage_key, paramObj) {

    var deferred = $.Deferred();
    var self = this;
    var resultObj = null;

    db.transaction(function (tx) {
        tx.executeSql(sql, paramObj, function(tx, results) {
            resultObj = results;
        });
    },
    function(err) { // fail
        console.log(err);
        deferred.rejectWith(self, [sql, storage_key, paramObj, resultObj, err.message]);
    },
    function() { // success
        console.log('transaction 성공');
        deferred.resolveWith(self, [sql, storage_key, paramObj, resultObj, 'SUCCESS']);
    });

    deferred.fail(function() {
        console.log('db fail : ' + storage_key + '[' + sql + ']');
    });

    return deferred.promise();
};

var send_message = function(tab_id, callback_action, callback_param) {
    chrome.tabs.sendMessage(tab_id, { action: callback_action, current_tab_id: tab_id, param : callback_param }, function(response) {
        console.log('수행할 업무 유형 정보 전송 성공[' + callback_action + ', ' + tab_id + ']');
    });
};

/* content.js에서 요청한 메시지 라우터 */
var router = function(requestMessage, current_tab, callback) {

    /*console.log('========== PROCESS_TYPE : ' + PRCESS_TYPE + ' [hostname : ' + requestMessage.page_hostname + '] ==========');*/
    console.log('------------------- 라우터 시작[' + requestMessage.background_action + '] ------------------------');

    var background_action = requestMessage.background_action;
    var param = requestMessage.param;
    var current_tab = current_tab;
    var tab_info = current_tab.tab;
    var tab_id = tab_info.id;
    var tab_title = tab_info.title;
    var tab_url = tab_info.url;
    var callback_param = {};
    var callback_action = '';
    var resultObj = {};
    var storage_key = tab_id.toString();

    try {

        if(current_tab.frameId != 0) {
            return false;
        }

        resultObj['replCd'] = '00';
        resultObj['replMsg'] = 'SUCCESS';

        var table = exec_web_sql(SELECT_PROCESS_SQL, storage_key, [storage_key]);
        table.done(function(sql, storage_key, param, results, repl_msg) {

            // 작업 요청
            if(background_action === 'get_process') {

                console.log('========== get process ==========');

                var rows = results.rows;
                var length = rows.length;
                var status = null;
                var job_id = null;
                var to_lang = null;
                var from_lang = null;
                var pre_data = null;
                var etc = null;

                // 작업 할당
                if(length == 0) {

                    console.log('준비');
                    status = 'READY';

                    // 순서 주의(? 순서와 같게 설정)
                    var INSERT_VALUE_ARR = [
                            storage_key,
                            status, 
                            job_id,
                            from_lang, 
                            to_lang, 
                            pre_data, 
                            etc, 
                            new Date().format("yyyy-MM-dd HH:mm:ss")
                        ];

                    var row = exec_web_sql(INSERT_PROCESS_SQL, storage_key, INSERT_VALUE_ARR);

                    row.done(function(sql, storage_key, param, results, repl_msg){
                        console.log('insert done!');
                        console.log(sql, storage_key, param, results, repl_msg);
                    });

                    row.fail(function(sql, storage_key, results, repl_msg){
                        console.log(storage_key + ' : ' + repl_msg);
                    });

                    callback_action = 'request_process_page';
                    send_message(tab_id, callback_action, callback_param);

                }

                // 상태에 따른 작업 변경
                else {

                    var row = rows[0];
                    status = row.status;
                    job_id = row.job_id;
                    to_lang = row.to_lang;
                    from_lang = row.from_lang;
                    pre_data = row.pre_data;
                    etc = row.etc;

                    console.log('상태에 따른 작업 변경[' + row.status + ']');

                    switch(status) {
                        case 'READY' :
                            console.log('작업 요청');
                            var url = 'http://google.haenasoft.com/GOOGLE_TRANS_SERVER/getTransData.hs';
                            $.ajax({
                                url: url,
                                async: false,
                                method : 'POST',
                                dataType: "json",
                                success: function(response) {

                                    var result = response;

                                    if(result['REPL_CD'] === '00') {

                                        callback_param = result;

                                        status = 'SET_RESULT';

                                        callback_param['status'] = status;
                                        callback_param['job_id'] = result['JOB_ID'];
                                        callback_param['to_lang'] = result['TO_LANG'];
                                        callback_param['from_lang'] = result['FROM_LANG'];
                                        callback_param['pre_data'] = decodeURIComponent(result['PRE_DATA'].replace(/\+/gi, ' '));
                                        callback_param['etc'] = JSON.stringify(callback_param);

                                        // 순서 주의(? 순서와 같게 설정), 번역 대상 데이터 INSERT
                                        var UPDATE_VALUE_ARR = [
                                                status, 
                                                callback_param['job_id'], 
                                                callback_param['to_lang'], 
                                                callback_param['from_lang'], 
                                                callback_param['pre_data'], 
                                                callback_param['etc'], 
                                                storage_key
                                            ];

                                        var row = exec_web_sql(UPDATE_PROCESS_SQL, storage_key, UPDATE_VALUE_ARR);

                                        row.done(function(sql, storage_key, param, results, repl_msg){
                                            console.log('update done!');
                                        });

                                        row.fail(function(sql, storage_key, results, repl_msg){
                                            console.log(storage_key + ' : ' + repl_msg);
                                        });

                                        console.log('pre data length [ ' + result['PRE_DATA'].length + ' ]');

                                        // go_to_main_page callback_action 호출
                                        callback_action = 'go_to_main_page';
                                        send_message(tab_id, callback_action, callback_param);

                                    } else {

                                        console.log(result['REPL_CD']);
                                        console.log(result['REPL_MSG']);

                                        callback_action = 'init_page';

                                        // 순서 주의(? 순서와 같게 설정)
                                        var DELETE_VALUE_ARR = [storage_key];

                                        var row = exec_web_sql(DELETE_PROCESS_SQL, storage_key, DELETE_VALUE_ARR);

                                        row.done(function(sql, storage_key, param, results, repl_msg){
                                            console.log('delete done!');
                                            send_message(tab_id, callback_action, callback_param);
                                        });

                                        row.fail(function(sql, storage_key, results, repl_msg){
                                            console.log(storage_key + ' : ' + repl_msg);
                                            send_message(tab_id, callback_action, callback_param);
                                        });

                                    }
                                },
                                error: function(err) {
                                    console.log(err);
                                }
                            });
                            break;

                        case 'SET_RESULT' :

                            callback_param['job_id'] = job_id;
                            callback_param['from_lang'] = from_lang;
                            callback_param['to_lang'] = to_lang;
                            callback_param['pre_data'] = pre_data;
                            callback_param['etc'] = etc;

                            callback_action = 'set_result_page';
                            send_message(tab_id, callback_action, callback_param);

                            break;

                        default :
                            console.log('2');
                            return false;
                            break;
                    }
                }
            }

            // 결과 페이지
            else if(background_action === 'result_process') {

                console.log('========== result process ==========');

                resultObj['replCd'] = '00';
                resultObj['replMsg'] = 'SUCCESS';
                callback_action = 'go_to_index_page';

                var url = 'http://google.haenasoft.com/GOOGLE_TRANS_SERVER/getTransDataResult.hs';
                var requestParam = requestMessage.param;
                var paramObj = JSON.parse(requestParam['etc']);
                    paramObj['AFTER_DATA'] = requestParam['after_data'];

                // 테스트용
                /*console.log(paramObj);
                return false;*/

                $.ajax({
                    url: url,
                    async: false,
                    data : paramObj,
                    method : 'POST',
                    dataType: "json",
                    success: function(response) {

                        var result = response;

                        if(result['REPL_CD'] === '00') {
                            console.log('결과 저장 성공');
                        } else {

                            console.log(result['REPL_CD']);
                            console.log(result['REPL_MSG']);

                            callback_action = 'init_page';

                            // 순서 주의(? 순서와 같게 설정)
                            var DELETE_VALUE_ARR = [storage_key];

                            var row = exec_web_sql(DELETE_PROCESS_SQL, storage_key, DELETE_VALUE_ARR);

                            row.done(function(sql, storage_key, param, results, repl_msg){
                                console.log('delete done!');
                                send_message(tab_id, callback_action, callback_param);
                            });

                            row.fail(function(sql, storage_key, results, repl_msg){
                                console.log(storage_key + ' : ' + repl_msg);
                                send_message(tab_id, callback_action, callback_param);
                            });

                        }
                    },
                    error: function(err) {
                        console.log(err);
                    }
                });

                console.log('결과 저장 완료[' + background_action + ']');

                // 순서 주의(? 순서와 같게 설정)
                var DELETE_VALUE_ARR = [storage_key];

                var row = exec_web_sql(DELETE_PROCESS_SQL, storage_key, DELETE_VALUE_ARR);

                row.done(function(sql, storage_key, param, results, repl_msg){
                    console.log('delete done!');
                    send_message(tab_id, callback_action, callback_param);
                });

                row.fail(function(sql, storage_key, results, repl_msg){
                    console.log(storage_key + ' : ' + repl_msg);
                    send_message(tab_id, callback_action, callback_param);
                });

            }

            // 페이지 새로고침
            else if(background_action === 'reload_process') {

                console.log('========== reload process ==========');

                resultObj['replCd'] = '02';
                resultObj['replMsg'] = 'RELOAD';
                callback_action = 'init_page';

                // 순서 주의(? 순서와 같게 설정)
                // TB_PROCESS 데이터 삭제
                var DELETE_VALUE_ARR = [storage_key];
                var row = exec_web_sql(DELETE_PROCESS_SQL, storage_key, DELETE_VALUE_ARR);

                row.done(function(sql, storage_key, param, results, repl_msg){
                    console.log('delete done!');
                    send_message(tab_id, callback_action, callback_param);
                });

                row.fail(function(sql, storage_key, results, repl_msg){
                    console.log(storage_key + ' : ' + repl_msg);
                    send_message(tab_id, callback_action, callback_param);
                });

            }
            else {

                console.log('알 수 없는 메시지[' + background_action + ']');

                resultObj['replCd'] = '03';
                resultObj['replMsg'] = 'NO_URL';
                callback_action = 'init_page';

                // 순서 주의(? 순서와 같게 설정)
                // TB_PROCESS 데이터 삭제
                var DELETE_VALUE_ARR = [storage_key];
                var row = exec_web_sql(DELETE_PROCESS_SQL, storage_key, DELETE_VALUE_ARR);

                row.done(function(sql, storage_key, param, results, repl_msg){
                    console.log('delete done!');
                    send_message(tab_id, callback_action, callback_param);
                });

                row.fail(function(sql, storage_key, results, repl_msg){
                    console.log(storage_key + ' : ' + repl_msg);
                    send_message(tab_id, callback_action, callback_param);
                });

            }
        });
        table.fail(function(sql, storage_key, results, repl_msg){
            console.log(storage_key + ' : ' + repl_msg);
        });

    } catch(err) {

        console.log('알 수 없는 오류[' + background_action + ']');
        console.log(err);

        resultObj['replCd'] = '99';
        resultObj['replMsg'] = 'FAIL';
        callback_action = 'init_page';

        // 순서 주의(? 순서와 같게 설정)
        // TB_PROCESS 데이터 삭제
        var DELETE_VALUE_ARR = [storage_key];
        var row = exec_web_sql(DELETE_PROCESS_SQL, storage_key, DELETE_VALUE_ARR);

        row.done(function(sql, storage_key, param, results, repl_msg){
            console.log('delete done! (tb_process)');
            send_message(tab_id, callback_action, callback_param);
        });

        row.fail(function(sql, storage_key, results, repl_msg){
            console.log(storage_key + ' : ' + repl_msg);
            send_message(tab_id, callback_action, callback_param);
        });

    } finally {
        callback({
            result : resultObj
        });
    }

};
chrome.runtime.onMessage.addListener(router);

var webrequest_callback = function(details){
    var type = details.type;
    var tab_id = details.tabId;
    var callback_action = 'request_process_page';
    if(type == 'main_frame') {
        console.log(details);
        console.log('webRequest 성공[' + callback_action + ', ' + tab_id + ']');
        chrome.tabs.sendMessage(tab_id, { action: callback_action, current_tab_id: tab_id, param : null}, function(response) {
            console.log('message 전송');
        });
    }
};

/* ------------------------------------------------- */

// 요청 구분 (main_frame, sub_frame, script)을 위해서 webRequest가 webNavigation보다 나음
/*chrome.webRequest.onCompleted.addListener(webrequest_callback, {
    urls: ["*://localhost/*", '*://*.google.com/', '*://*.google.com/*']
});*/
