// ==UserScript==
// @name        V2EX Mate
// @namespace   BC79109B-4A9B-448D-9728-C7C97ADAA26C
// @include     http://v2ex.com/*
// @include     http://www.v2ex.com/*
// @include     https://v2ex.com/*
// @include     https://www.v2ex.com/*
// @version     1.1.0
// @grant       none
// ==/UserScript==


var block = /盗版|能上了/;

var highlight = /分享/;


var v2exMate = {

  filter: function() {
    $('a[href^="/t/"]:not(.count_livid)').each(function() {
      var topic = $(this).text();

      if (topic.search(block) >= 0) {
        $(this).parents('.cell').css('opacity', '.25');
      } else if (topic.search(highlight) >= 0) {
        $(this).css('font-weight', 'bold');
      }
    });
  },


  quote: function() {
    var replyMap = $('strong > .dark[href^="/member/"]').map(function(i, el) {
      return $(el).text();
    }).get();

    // 添加楼主
    replyMap.unshift($('.gray > a[href^="/member/"]').text());


    // 检索 @ 回复
    $('.reply_content > a[href^="/member/"]')
      .on('mouseover', function() {
        var member  = $(this).text(),
            thisEQ  = $(this).parents('div[id^="r_"]').index(),
            target  = replyMap.slice(0,thisEQ).lastIndexOf(member),
            $quote  = $('<span id="v2exmate-quote"/>'),
            content = '';

        if (target < 0) {
          content = '没有回复';
        } else if (target == 0) {
          content = '@楼主';
        } else {
          content = '<strong>#' + target + '</strong>' + $('.reply_content').eq(target - 1).html();
        }

        $(this).append($quote.html(content));
      })
      .on('mouseout', function() {
        $('#v2exmate-quote').remove();
      });


    // 检索用户全部回复
    $('strong > .dark[href^="/member/"]')
      .on('mouseover', function() {
        var member  = $(this).text(),
            $quote  = $('<span id="v2exmate-quote"/>'),
            content = '';

        // 不包含楼主
        for (var i = 1, j = replyMap.length; i < j; i++) {
          if (replyMap[i] == member) {
            content += '<strong>#' + i + '</strong>' + $('.reply_content').eq(i - 1).html() + '<hr/>';
          }
        }

        $(this).append($quote.html(content));
      })
     .on('mouseout', function() {
        $('#v2exmate-quote').remove();
     });
  },


  reply: function() {
    // 延时启用动画
    setTimeout(function() {
      $('#reply_content').attr('placeholder', '请尽量让自己的回复能够对别人有帮助').css('transition', 'transform .2s ease-in-out');
    }, 300);
  },


  visited: function() {
    // GreaseMonkey 使用 unsafeWindow.localStorage
    var localStorage = (typeof unsafeWindow === 'undefined') ? window.localStorage : unsafeWindow.localStorage;

    var thread      = location.pathname.match(/\d{4,}/)[0],
        threadArray = JSON.parse(localStorage['thread'] || '[]'),
        replyArray  = JSON.parse(localStorage['reply']  || '[]'),
        threadIndex = threadArray.indexOf(thread),
        replyCount  = parseInt( $('div[id^="r_"].inner').find('.no').text() );

    var lastReplyCount, lastReplyEQ, $replys, $overlay, $button;


    if (threadIndex >= 0) {
      lastReplyCount = replyArray[threadIndex];

      $button = $('<button id="v2exmate-showReplys">显示浏览过的回复</button>');
      $button.on('click', function() {
        $('div[id^="r_"]').show();
        $('#v2exmate-overlay').remove();
      });
      $overlay = $('<div id="v2exmate-overlay"/>').append($button);

      $replys = $('.reply_content');


      // 第一页 并且 不是内页
      if (lastReplyCount > 1 && replyCount <= 100 && lastReplyCount <= 100) {
        // 如果有真实删除的回复
        lastReplyEQ = $replys.length <= lastReplyCount ? $replys.length : lastReplyCount;
        $replys.slice(0, lastReplyEQ - 1).parents('.cell').hide();
        $replys.eq(lastReplyEQ - 1).parents('div[id^="r_"]').css('position', 'relative').append($overlay);

      // 已经翻页 并且 不是内页 或者 上次访问与本次在同一页
      } else if (replyCount > 100 && lastReplyCount <= replyCount && ( lastReplyCount.toString().charAt(0) == replyCount.toString().charAt(0) || replyCount % 100 == 0 )) {
        lastReplyCount = lastReplyCount % 100;
        lastReplyEQ    = $replys.length <= lastReplyCount ? $replys.length : lastReplyCount;
        $replys.slice(0, lastReplyEQ - 1).parents('.cell').hide();
        $replys.eq(lastReplyEQ - 1).parents('div[id^="r_"]').css('position', 'relative').append($overlay);
      }

      if (replyCount > lastReplyCount) {
        replyArray[threadIndex] = replyCount;
        localStorage['reply']  = JSON.stringify(replyArray);
      }

    } else {

      if (threadArray.length == 100) {
        threadArray.shift();
        replyArray.shift();
      }

      threadArray.push(thread);
      replyArray.push(replyCount);

      localStorage['thread'] = JSON.stringify(threadArray);
      localStorage['reply']  = JSON.stringify(replyArray);
    }
  },


  formatDate: function(timestamp) {
    var date = new Date(timestamp * 1000);
    return date.getFullYear() + ' 年 ' + (date.getMonth() + 1) + ' 月 ' + date.getDate() + ' 日';
  },


  loadProfile: function(el) {
    var id       = 'v2exmate-' + parseInt(el.offset().top) + '-' + parseInt(el.offset().left),  // 将 offset 作为独一无二的标识
        $profile = $('<div id="' + id + '" class="v2exmate-profile v2exmate-show"/>'),
        top      = el.offset().top,
        left     = el.offset().left,
        padding  = el.width(),
        content  = '',
        member;

    // .v2exmate-z 将 avatar 置顶，确保只有一个元素，每次 hover 时重置
    $('.v2exmate-z').removeClass('v2exmate-z');

    // viewed 标记已载入
    if ( !el.hasClass('v2exmate-viewed') ) {
      el.addClass('v2exmate-viewed v2exmate-z');


      if ( el.parent().is('a') ) {
        member = el.parent().attr('href').match(/\w+$/)[0];
      } else {
        member = el.parents('div[id^="r_"]').find('.dark[href^="/member/"]').attr('href').match(/\w+$/)[0];
      }


      $.getJSON(location.origin + '/api/members/show.json?username=' + member, function(data) {
        content += '<a href="' + location.origin + '/member/' + data['username'] + '" target="_blank">' + data['username'] + '</a><br/>';
        content += 'V2EX 第 ' + data['id'] + ' 号会员<br/>';
        content += '加入于 ' + v2exMate.formatDate(data['created']) + '<br/>';

        if (data['location'])
          content += '所在地: ' + data['location'] + '<br/>';
        if (data['tagline'])
          content += '签名: ' + data['tagline'] + '<br/>';
        if (data['website'])
          content += '个人网站: <a href="' + ( data['website'].slice(0,4) == 'http' ? data['website'] : 'http://' + data['website'] ) + '" target="_blank">' + data['website'] + '</a><br/>';
        if (data['twitter'])
          content += 'Twitter: <a href="https://twitter.com/' + data['twitter'] + '" target="_blank">' + data['twitter'] + '</a><br/>';
        if (data['github'])
          content += 'Github: <a href="https://github.com/' + data['github'] + '" target="_blank">' + data['github'] + '</a><br/>';
        if (data['bio'])
          content += '<span>' + data['bio'] + '</span>';


        $profile.html(content).css({
          'top': top - 10,
          'left': left - 10,
          'padding-left': padding + 25,
          'max-width': padding + 260,
          'min-height': padding
        });

        $('body').append($profile);
      });
    } else {
      el.addClass('v2exmate-z');
      $('#' + id).addClass('v2exmate-show');
    }
  },

  profile: function() {
    var timeOutThread;

    $('.avatar')
      .on('mouseover', function() {
        var el = $(this)

        if (!timeOutThread) {
          timeOutThread = setTimeout(function() {
            v2exMate.loadProfile(el);
          }, 250);
        }
      })
      .on('mouseout', function() {
        if (timeOutThread) {
          clearTimeout(timeOutThread);
          timeOutThread = null;
        }
        $('.v2exmate-show').removeClass('v2exmate-show');
      });
  },


  loadPreview: function(el) {
    var id = el.attr('href').match(/\d{4,}/)[0];

    if ( !el.hasClass('v2exmate-viewed') ) {
      el.addClass('v2exmate-viewed');

      var $preview = $('<div id="v2exmate-' + id + '" class="v2exmate-preview v2exmate-show"/>'),
          $content = $('<div class="v2exmate-preview-inner"/>'),
          top      = el.offset().top,
          left     = el.offset().left,
          width    = el.outerWidth();

      $preview.css({
        'top': top,
        'left': left + width
      });

      $.getJSON(location.origin + '/api/topics/show.json?id=' + id, function(data) {
        $content.html(data[0].content_rendered)
        $('body').append($preview.append($content));
      });
    } else {
      $('#v2exmate-' + id).addClass('v2exmate-show');
    }
  },


  preview: function() {
    var timeOutThread;

    $('.count_livid')
      .on('mouseover', function(el) {
        var el = $(this);

        if (!timeOutThread) {
          timeOutThread = setTimeout(function() {
            v2exMate.loadPreview(el);
          }, 250);
        }
      })
      .on('mouseout', function() {
        if (timeOutThread) {
          clearTimeout(timeOutThread);
          timeOutThread = null;
        }
        $('.v2exmate-show').removeClass('v2exmate-show');
      });
  }
};


// START

$('head').append($('<style/>').text('replace_style_here'));

if (location.pathname.match(/\/t\/\d+/)) {
  v2exMate.visited();
  v2exMate.reply();
  v2exMate.quote();
} else {
  v2exMate.filter();
  v2exMate.preview();
}

v2exMate.profile();
