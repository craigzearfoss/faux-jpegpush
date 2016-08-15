var regUserId = regUserId || false;
var regUsername = regUsername || false;
var regPassword = regPassword || false;
var regEmail = regEmail || false;
if (regUserId && regUsername && regPassword && regEmail) {
    try {
        $.cookie("regUserId", regUserId, {
            path: "/"
        });
        $.cookie("regUsername", regUsername, {
            path: "/"
        });
        $.cookie("regPassword", regPassword, {
            path: "/"
        });
        $.cookie("regEmail", regEmail, {
            path: "/"
        })
    } catch (e) {}
}
$(document).ready(function() {
    if (typeof action != "undefined") {
        if (action == "player") {
            initializeChat()
        }
    }
    $("#video_cover").on("click", function() {
        $("#video_overlay").css("display", "block")
    });
    $("#send-message").on("click", function() {
        document.location = $("#hidden-join-link").attr("href")
    })
});
var model = null;
var users = new Array;
var roomUsers = new Array;
var messages = new Array;
var msgPtr = -1;
var userPtr = -1;
var maxMessages = 40;
var firstMessageIndex = -1;
var currentMessageIndex = -1;
var textColorClasses = new Array;
textColorClasses[0] = "";
textColorClasses[1] = "blue-txt";
textColorClasses[2] = "brown-txt";
textColorClasses[3] = "green-txt";
textColorClasses[4] = "orange-txt";
textColorClasses[5] = "red-txt";

function initializeChat() {
    if (typeof modelName == "undefined") {
        modelName = "unknown"
    }
    var numUsers = 30;
    var numMessages = 50;
    var userOffset = Math.floor(Math.random() * 350 + 0);
    var msgOffset = Math.floor(Math.random() * 250 + 0);
    $.ajax({
        type: "GET",
        url: "/ajax/get-chat/" + encodeURIComponent(modelName) + "/random/" + numUsers + "/" + numMessages + "/" + userOffset + "/" + msgOffset,
        dataType: "json",
        cache: false,
        async: true,
        success: function(data) {
            if (data.status) {
                model = data.model;
                users = data.users;
                messages = data.messages;
                if (document.cookie.indexOf("models") >= 0) {
                    var recentModelIds = $.cookie("models");
                    if (typeof recentModelIds == "undefined" || recentModelIds.length == "undefined" || recentModelIds.length == 0) {
                        recentModelIds = "|"
                    }
                } else {
                    recentModelIds = "|"
                }
                $.cookie("models", recentModelIds + model["id"] + "|", {
                    path: "/"
                });
                $.cookie("u1", model["id"], {
                    path: "/"
                });
                if (recentModelIds.indexOf("|" + model["id"] + "|") > -1) {
                    var previouslyViewed = true;
                    showPlayerOverlay()
                } else {
                    var previouslyViewed = false
                }
                initializeJpgpushPlayer(jpegpushOptions || {});
                $(".live-player").css("display", "block");
                for (var i = 0; i < users.length; i++) {
                    users[i]["class"] = textColorClasses[Math.floor(Math.random() * textColorClasses.length + 1) - 1]
                }
                var numInitUsers = Math.floor(Math.random() * 12 + 4);
                var usersHtml = '<p id="user-count">(' + numInitUsers + ") users in room</p>";
                for (var i = 0; i < numInitUsers; i++) {
                    userPtr = i;
                    roomUsers[i] = users[i];
                    usersHtml += '<p id="user-' + roomUsers[i]["id"] + '"><a href="javascript:void(0);" class="' + roomUsers[i]["class"] + ' fancybox">' + roomUsers[i]["username"] + "</a></p>"
                }
                $("#users-div").html(usersHtml);
                var msgHtml = "";
                var currentMessages = $("#messages-div").html();
                $("#messages-div").html(currentMessages + msgHtml);
                var numInitMessages = Math.floor(Math.random() * 4 + 2);
                if (numInitMessages > messages.length) numInitMessages = messages.length;
                firstMessageIndex = 0;
                for (var i = 0; i < numInitMessages; i++) {
                    msgPtr = i;
                    currentMessageIndex = i;
                    if (roomUsers.length > 0) {
                        if (messages[msgPtr]["type"] == "model") {
                            msgHtml = '<div id="msg-' + currentMessageIndex + '">' + model["username"] + ":" + messages[msgPtr]["text"] + "</div>"
                        } else {
                            var userIndex = Math.floor(Math.random() * roomUsers.length + 1) - 1;
                            msgHtml = '<div id="msg-' + currentMessageIndex + '" class="' + roomUsers[userIndex]["class"] + '">' + roomUsers[userIndex]["username"] + ":" + messages[msgPtr]["text"] + "</div>"
                        }
                        var currentMessages = $("#messages-div").html();
                        $("#messages-div").html(currentMessages + msgHtml)
                    }
                }
                setMessageTimeout();
                setUserTimeout()
            }
        },
        error: function(XMLHttpRequest, textStatus, errorThrown) {
            console.log("error " + textStatus);
            console.log("incoming Text " + jqXHR.responseText)
        }
    })
}

function initializeJpgpushPlayer(options) {
    options = options || {};
    if ($.isEmptyObject(options)) {
        options.onComplete = function() {
            $("#video_overlay").css("display", "block")
        };
        options.onError = function() {
            $("#video_overlay").css("display", "block")
        }
    }
    var jpegPush = new FauxJpegPush;
    jpegPush.setup(options);
    jpegPush.start()
}

function nextMessage() {
    if (msgPtr + 1 >= messages.length) {
        var numMessages = 50;
        var msgOffset = Math.floor(Math.random() * 250 + 0);
        $.ajax({
            type: "GET",
            url: "/ajax/get-messages/" + numMessages + "/random/" + msgOffset,
            dataType: "json",
            cache: false,
            async: true,
            success: function(data) {
                if (data.status) {
                    messages = data.messages;
                    if (typeof messages != "undefined" && messages.length > 0) {
                        msgPtr = 0;
                        if (users.length > 0) {
                            currentMessageIndex = currentMessageIndex + 1;
                            if (messages[msgPtr]["type"] == "model") {
                                msgHtml = '<p id="msg-' + currentMessageIndex + '">' + model["username"] + ":" + messages[msgPtr]["text"] + "</a></p>"
                            } else {
                                var userIndex = Math.floor(Math.random() * users.length + 1) - 1;
                                var colorClass = users[userIndex]["class"];
                                msgHtml = '<p id="msg-' + currentMessageIndex + '" class="' + users[userIndex]["class"] + '">' + users[userIndex]["username"] + ":" + messages[msgPtr]["text"] + "</a></p>"
                            }
                            var currentMessages = $("#messages-div").html();
                            $("#messages-div").html(currentMessages + msgHtml);
                            var objDiv = document.getElementById("messages-div");
                            objDiv.scrollTop = objDiv.scrollHeight;
                            if (currentMessageIndex - firstMessageIndex > maxMessages) {
                                $("#msg-" + firstMessageIndex).remove();
                                firstMessageIndex = firstMessageIndex + 1
                            }
                        }
                        setMessageTimeout()
                    }
                }
            },
            error: function(XMLHttpRequest, textStatus, errorThrown) {
                console.log("error " + textStatus);
                console.log("incoming Text " + jqXHR.responseText)
            }
        })
    } else {
        msgPtr = msgPtr + 1;
        currentMessageIndex = currentMessageIndex + 1;
        if (messages[msgPtr]["type"] == "model") {
            msgHtml = '<p id="msg-' + currentMessageIndex + '">' + model["username"] + ":" + messages[msgPtr]["text"] + "</a></p>"
        } else {
            var userIndex = Math.floor(Math.random() * users.length + 1) - 1;
            var colorClass = users[userIndex]["class"];
            msgHtml = '<p id="msg-' + currentMessageIndex + '" class="' + users[userIndex]["class"] + '">' + users[userIndex]["username"] + ":" + messages[msgPtr]["text"] + "</a></p>"
        }
        var currentMessages = $("#messages-div").html();
        $("#messages-div").html(currentMessages + msgHtml);
        if (currentMessageIndex - firstMessageIndex > maxMessages) {
            $("#msg-" + firstMessageIndex).remove();
            firstMessageIndex = firstMessageIndex + 1
        }
        var objDiv = document.getElementById("messages-div");
        objDiv.scrollTop = objDiv.scrollHeight;
        setMessageTimeout()
    }
}

function addUser() {
    if (userPtr + 1 >= users.length) {
        var numUsers = 20;
        var userOffset = Math.floor(Math.random() * 250 + 0);
        $.ajax({
            type: "GET",
            url: "/ajax/get-users/" + numUsers + "/random/" + userOffset,
            dataType: "json",
            cache: false,
            async: true,
            success: function(data) {
                if (data.status) {
                    users = data.users;
                    if (typeof users != "undefined" && users.length > 0) {
                        for (var i = 0; i < users.length; i++) {
                            users[i]["class"] = textColorClasses[Math.floor(Math.random() * textColorClasses.length + 1) - 1]
                        }
                        userPtr = 0;
                        var newUser = users[userPtr];
                        roomUsers[roomUsers.length] = newUser;
                        var userHtml = '<p id="user-' + newUser["id"] + '"><a href="javascript:void(0);" class="' + newUser["class"] + ' fancybox">' + newUser["username"] + "</a></p>";
                        var currentUsers = $("#users-div").html();
                        $("#users-div").html(currentUsers + userHtml);
                        $("#user-count").html(roomUsers.length + " users in room");
                        setUserTimeout()
                    }
                }
            },
            error: function(XMLHttpRequest, textStatus, errorThrown) {
                console.log("error " + textStatus);
                console.log("incoming Text " + jqXHR.responseText)
            }
        })
    } else {
        userPtr = userPtr + 1;
        var newUser = users[userPtr];
        roomUsers[roomUsers.length] = newUser;
        var userHtml = '<p id="user-' + newUser["id"] + '"><a href="javascript:void(0);" class="' + newUser["class"] + ' fancybox">' + newUser["username"] + "</a></p>";
        var currentUsers = $("#users-div").html();
        $("#users-div").html(currentUsers + userHtml);
        $("#user-count").html(roomUsers.length + " users in room");
        setUserTimeout()
    }
}

function removeUser() {
    var userIndex = Math.floor(Math.random() * roomUsers.length + 1) - 1;
    var userId = roomUsers[userIndex]["id"];
    $("#user-" + userId).remove();
    roomUsers.splice(userIndex + 1, 1);
    $("#user-count").html(roomUsers.length + " users in room");
    setUserTimeout()
}

function setMessageTimeout() {
    var tid = setTimeout(nextMessage, Math.floor(Math.random() * 5500 + 500))
}

function setUserTimeout() {
    if (Math.random() > .5) {
        var uid = setTimeout(addUser, Math.floor(Math.random() * 2e4 + 1e4))
    } else {
        var uid = setTimeout(removeUser, Math.floor(Math.random() * 2e4 + 1e4))
    }
}

function showCamsterOverlay() {
    alert("Show overlay");
    showCamsterPopup();
    return false
}

function showPlayerOverlay() {
    $(".rgOverlay").show()
}

function getQueryString() {
    var query_string = {};
    try {
        var query = window.location.search.substring(1);
        var vars = query.split("&");
        for (var i = 0; i < vars.length; i++) {
            var pair = vars[i].split("=");
            if (typeof query_string[pair[0]] === "undefined") {
                query_string[pair[0]] = pair[1]
            } else if (typeof query_string[pair[0]] === "string") {
                var arr = [query_string[pair[0]], pair[1]];
                query_string[pair[0]] = arr
            } else {
                query_string[pair[0]].push(pair[1])
            }
        }
    } catch (e) {}
    return query_string
}

function FauxJpegPush(options) {
    "use strict";
    this.errorMsgs = [];
    this.fetchImages = function() {
        for (var i = 0; i < FJPData.preloadSize; i++) {
            if (FJPData.preloadCount >= FJPData.totalImages) {
                break
            }
            $("." + FJPData.classes.preloadCount).html(++FJPData.preloadCount);
            if (this.preloadCount > FJPData.totalImages) {
                $(this).data("status", "stopped");
                $(this).html("RESET");
                break
            } else {
                var newImage = new Image;
                newImage.src = this.getImageName(FJPData.preloadCount);
                FJPData.preloadStack.push(newImage);
                $("." + FJPData.classes.stackLength).html(FJPData.preloadStack.length)
            }
        }
    };
    this.getErrorMsgs = function() {
        return this.errorMsgs
    };
    this.getImageName = function(idx) {
        var url = FJPData.url + "img_" + idx + ".jpg";
        var i = idx % 10;
        if (url.match(/images2.bangbros.com/g).length) {
            url = url.replace("images2.bangbros.com", "images2" + (i + 1) + ".bangbros.com")
        }
        return url
    };
    this.nextImage = function() {
        var thisInstance = this;
        if (FJPData.preloadStack.length && FJPData.preloadStack[0].height) {
            $("#" + FJPData.playerId).html(FJPData.preloadStack.shift());
            $("." + FJPData.classes.currentImage).html($("#" + FJPData.playerId).find("img").attr("src"));
            $("." + FJPData.classes.shownCount).html(++FJPData.shownCount);
            $("." + FJPData.classes.stackLength).html(FJPData.preloadStack.length);
            setTimeout(function() {
                thisInstance.nextImage()
            }, FJPData.interval);
            if (FJPData.preloadStack.length < FJPData.minStack) {
                this.fetchImages()
            }
        } else {
            if (FJPData.shownCount < FJPData.totalImages) {
                setTimeout(function() {
                    thisInstance.nextImage()
                }, FJPData.interval)
            } else {
                if (FJPData.hasOwnProperty("onComplete")) {
                    FJPData.onComplete()
                }
            }
        }
    };
    this.resetErrorMsgs = function() {
        this.errorMsgs = []
    };
    this.setup = function(options) {
        window.FJPData = options;
        window.FJPData.playerId = window.FJPData.playerId || null;
        window.FJPData.url = window.FJPData.url || null;
        window.FJPData.totalImages = window.FJPData.totalImages || 0;
        window.FJPData.delay = window.FJPData.delay || 1e3;
        window.FJPData.interval = window.FJPData.interval || 200;
        window.FJPData.minStack = window.FJPData.minStack || 20;
        window.FJPData.preloadSize = window.FJPData.preloadSize || 25;
        window.FJPData.shownCount = 0;
        window.FJPData.preloadCount = 0;
        window.FJPData.preloadStack = [];
        window.FJPData.classes = window.FJPData.classes || {};
        window.FJPData.classes.preloadCount = window.FJPData.classes.preloadCount || "preload-count";
        window.FJPData.classes.shownCount = window.FJPData.classes.shownCount || "shown-count";
        window.FJPData.classes.stackLength = window.FJPData.classes.stackLength || "stack-length";
        window.FJPData.classes.currentImage = window.FJPData.classes.currentImage || "current-image";
        $("." + FJPData.classes.shownCount).html(FJPData.shownCount);
        $("." + FJPData.classes.preloadCount).html(FJPData.preloadCount);
        $("." + FJPData.classes.stackLength).html(FJPData.preloadStack.length);
        $("." + FJPData.classes.currentImage).html("");
        if (options.hasOwnProperty("onComplete")) {
            window.FJPData.onComplete = options.onComplete
        } else {
            window.FJPData.onComplete = function() {}
        }
        if (options.hasOwnProperty("onError")) {
            window.FJPData.onError = options.onError
        } else {
            window.FJPData.onError = function() {}
        }
    };
    this.stop = function() {
        window.FJPData.shownCount = window.FJPData.shownCount + 1;
        window.FJPData.preloadStack = []
    };
    this.start = function() {
        if (typeof FJPData === "undefined" || $.isEmptyObject(FJPData)) {
            alert("No options specified.");
            return false
        }
        this.fetchImages();
        var thisInstance = this;
        if (!this.validate()) {
            if (FJPData.hasOwnProperty("onError")) {
                var err = new Error(this.errorMsgs.join(" "));
                FJPData.onError(err)
            } else {
                alert(this.errorMsgs.join("\n\n"))
            }
            return false
        } else {
            if (FJPData.delay) {
                setTimeout(function() {
                    thisInstance.nextImage()
                }, FJPData.delay)
            } else {
                this.nextImage()
            }
        }
    };
    this.validate = function() {
        this.resetErrorMsgs();
        if (!FJPData.playerId) {
            this.errorMsgs[this.errorMsgs.length] = "No `playerId` specified."
        }
        if (!FJPData.url || FJPData.url.length == 0) {
            this.errorMsgs[this.errorMsgs.length] = "No `url` for images specified."
        }
        if (!FJPData.totalImages) {
            this.errorMsgs[this.errorMsgs.length] = "`totalImages` not specified."
        } else {
            this.totalImages = parseInt(FJPData.totalImages)
        }
        FJPData.preloadSize = parseInt(FJPData.preloadSize);
        return this.errorMsgs.length ? false : true
    };
    if (typeof options !== "undefined") {
        this.setup(options)
    }
}