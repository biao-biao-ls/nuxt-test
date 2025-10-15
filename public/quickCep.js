function ajaxRequest(e) {
    var d = e.url
      , t = e.method
      , r = void 0 === t ? "GET" : t
      , t = e.data
      , s = void 0 === t ? {} : t
      , e = e.headers
      , c = void 0 === e ? {} : e;
    return new Promise(function(i, o) {
        var e, t, a = new XMLHttpRequest, n = "GET" === r.toUpperCase();
        for (t in n && s && (e = new URLSearchParams(s).toString(),
        d += (d.includes("?") ? "&" : "?") + e),
        a.open(r, d, !0),
        c)
            a.setRequestHeader(t, c[t]);
        a.onreadystatechange = function() {
            if (4 === a.readyState) {
                var e = a.status
                  , t = a.responseText;
                if (200 <= e && e < 300)
                    try {
                        var n = JSON.parse(t);
                        i(n)
                    } catch (e) {
                        i(t)
                    }
                else
                    o({
                        status: e,
                        message: a.statusText || "Request failed",
                        response: t
                    })
            }
        }
        ,
        n || !s ? a.send() : (a.setRequestHeader("Content-Type", "application/json"),
        a.send(JSON.stringify(s)))
    }
    )
}
!function() {
    function m(e, t) {
        for (var n = {}, i = e.indexOf("?"), o = e.substr(i + 1).split("&"), a = 0; a < o.length; a++) {
            var d = o[a].split("=");
            if (n[d[0]] = d[1],
            t && t === d[0])
                return d[1]
        }
        if (!t)
            return n
    }
    function e() {}
    var t, n, h = (t = function() {
        for (var e = +(new Date).getTime(), t = 0; e === (new Date).getTime(); )
            t++;
        return e.toString(16) + t.toString(16)
    }
    ,
    n = function() {
        var e, t, n = navigator.userAgent, o = [], i = 0;
        function a(e, t) {
            for (var n = 0, i = 0; i < t.length; i++)
                n |= o[i] << 8 * i;
            return e ^ n
        }
        for (e = 0; e < n.length; e++)
            t = n.charCodeAt(e),
            o.unshift(255 & t),
            4 <= o.length && (i = a(i, o),
            o = []);
        return (i = 0 < o.length ? a(i, o) : i).toString(16)
    }
    ,
    function() {
        var e = (window.screen.height * window.screen.width).toString(16);
        return t() + "-" + Math.random().toString(16).replace(".", "") + "-" + n() + "-" + e + "-" + t()
    }
    ), i = function() {
        window.quick_video_loader = function(e) {
            delete window.quick_video_loader;
            var t = document.createElement("script");
            t.setAttribute("src", "https://test-feedfront-quickcep.jlcerp.com/quickcep-feeds.iife.js"),
            t.async = !0,
            e && (t.onload = e),
            document.body.appendChild(t)
        }
    }, o = "true" === localStorage.getItem("quick-chat-debug"), r = o ? console.log.bind(console) : e, w = o ? console.time.bind(console) : e, f = o ? console.timeEnd.bind(console) : e;
    function s(e) {
        var n;
        window.quickLoadJs || (window.quickLoadJs = !0,
        n = e.contentDocument,
        "static/js/runtime-main.a4c9eefe.js,static/js/chunk-init.a4c9eefe.chunk.js,static/js/vendors~main.a4c9eefe.chunk.js,static/js/main.a4c9eefe.chunk.js".split(",").forEach(function(e) {
            var t = n.createElement("script");
            t.type = "text/javascript",
            t.setAttribute("src", "https://test-chat-quickcep.jlcerp.com/" + e),
            n.body.appendChild(t),
            r(n ? "iframe-js-loading" : "iframe-js-no-load")
        }),
        i())
    }
    function a() {
        window.quickChatloaded || (window.quickChatloaded = !0,
        function() {
            w("initMixPanel");
            var e, t = Array.prototype.slice.call(document.scripts).filter(function(e) {
                return e.src && e.src.includes("initQuickChat.js")
            }), a = m(t[0].src, "accessId"), d = m(t[0].src, "platform"), n = m(t[0].src, "medium") || "", i = m(t[0].src, "onlyChat"), r = m(t[0].src, "needIdentify"), o = m(t[0].src, "beNewChat"), s = m(t[0].src, "oemFlag"), c = m(t[0].src, "visitorId"), l = m(t[0].src, "lang");
            if (i && (window.__quick__onlyChat = !0),
            !window.__quick__initMixPanel)
                if (window.__quick__initMixPanel = !0,
                r ? sessionStorage.setItem("needIdentify", r) : sessionStorage.removeItem("needIdentify"),
                sessionStorage.setItem("quick-chat-accessId", a),
                sessionStorage.setItem("quick-chat-medium", n),
                o ? sessionStorage.setItem("quick-be-newchat", o) : sessionStorage.removeItem("quick-be-newchat"),
                l ? sessionStorage.setItem("quick-chat-lang", l) : sessionStorage.removeItem("quick-chat-lang"),
                s ? sessionStorage.setItem("quick-chat-oemFlag", s) : sessionStorage.getItem("quick-chat-oemFlag") && sessionStorage.removeItem("quick-chat-oemFlag"),
                c ? sessionStorage.setItem("quick-chat-visitorId", c) : sessionStorage.getItem("quick-chat-visitorId") && sessionStorage.removeItem("quick-chat-visitorId"),
                window.quickChatPreviewMode)
                    window.CEPMixpanel = {
                        onInitComplete: function(e) {
                            e()
                        }
                    };
                else if (window.quickChatSandbox) {
                    var u = (p = (p = function() {
                        return Math.random().toString(36).substring(2, 10)
                    }
                    )() + p(),
                    e ? p.substring(0, e) : p)
                      , p = m(t[0].src).sanboxRobotId;
                    sessionStorage.setItem("sandboxRobotId", p),
                    window.CEPMixpanel = {
                        cookie: {
                            props: {
                                $device_id: h()
                            }
                        },
                        _: {
                            info: {
                                getSessionId: function() {
                                    return u
                                }
                            }
                        },
                        onInitComplete: function(e) {
                            e()
                        }
                    }
                } else {
                    if (window.CEPMixpanel && window.CEPMixpanel.init)
                        return window.CEPMixpanelUnload = {
                            initCompleteCb: function() {},
                            onInitComplete: function(e) {
                                this.__loaded ? e() : this.initCompleteCb = e
                            }
                        },
                        window.CEPMixpanel.initCompleteCb = window.CEPMixpanelUnload.initCompleteCb,
                        window.CEPMixpanel.onInitComplete = window.CEPMixpanelUnload.onInitComplete,
                        ajaxRequest({
                            url: "https://test-app-quickcep.jlcerp.com/im-visitor/event/settings",
                            method: "post",
                            data: {
                                accessId: a
                            }
                        }).then(function(e) {
                            var t, n, i, o;
                            window.CEPMixpanel.init(a, {
                                platform: d || "shopify",
                                debug: !1,
                                batch_autostart: !1,
                                api_host: (null == e || null == (t = e.data) ? void 0 : t.reportEventHost) || "https://test-app-quickcep.jlcerp.com",
                                reportEventPath: (null == e || null == (n = e.data) ? void 0 : n.reportEventPath) || "/cdp-collect/cdp/collect/event/",
                                reportUserHost: (null == e || null == (i = e.data) ? void 0 : i.reportUserHost) || "https://test-app-quickcep.jlcerp.com",
                                reportUserPath: (null == e || null == (o = e.data) ? void 0 : o.reportUserPath) || "/cdp-collect/cdp/collect/user/",
                                persistence: "localStorage",
                                loaded: function() {
                                    window.CEPMixpanel.initCompleteCb(),
                                    f("mixpanel-single-init")
                                }
                            })
                        }).catch(function(e) {
                            window.CEPMixpanel.init(a, {
                                platform: d || "shopify",
                                debug: !1,
                                batch_autostart: !1,
                                api_host: "https://test-app-quickcep.jlcerp.com",
                                persistence: "localStorage",
                                reportEventPath: "/cdp-collect/cdp/collect/event/",
                                reportUserHost: "https://test-app-quickcep.jlcerp.com",
                                reportUserPath: "/cdp-collect/cdp/collect/user/",
                                loaded: function() {
                                    window.CEPMixpanel.initCompleteCb(),
                                    f("mixpanel-single-init")
                                }
                            })
                        });
                    p = document.createElement("script");
                    p.setAttribute("src", "https://front-assets.quickcep.com/js/mixpanel.iife.js?v=2.51.20"),
                    p.async = !0,
                    document.body.appendChild(p),
                    window.CEPMixpanelUnload = {
                        initCompleteCb: function() {},
                        __SV: 2,
                        onInitComplete: function(e) {
                            this.__loaded ? e(this.__loaded, r) : this.initCompleteCb = e
                        }
                    },
                    window.CEPMixpanel = window.CEPMixpanelUnload,
                    p.onload = function() {
                        window.CEPMixpanel.initCompleteCb = window.CEPMixpanelUnload.initCompleteCb,
                        window.CEPMixpanel.onInitComplete = window.CEPMixpanelUnload.onInitComplete,
                        window.CEPMixpanelUnload = void 0,
                        ajaxRequest({
                            url: "https://test-app-quickcep.jlcerp.com/im-visitor/event/settings",
                            method: "post",
                            data: {
                                accessId: a
                            }
                        }).then(function(e) {
                            var t, n, i, o;
                            window.CEPMixpanel.init(a, {
                                platform: d || "shopify",
                                debug: !1,
                                batch_autostart: !1,
                                api_host: (null == e || null == (t = e.data) ? void 0 : t.reportEventHost) || "https://test-app-quickcep.jlcerp.com",
                                reportEventPath: (null == e || null == (n = e.data) ? void 0 : n.reportEventPath) || "/cdp-collect/cdp/collect/event/",
                                reportUserHost: (null == e || null == (i = e.data) ? void 0 : i.reportUserHost) || "https://test-app-quickcep.jlcerp.com",
                                reportUserPath: (null == e || null == (o = e.data) ? void 0 : o.reportUserPath) || "/cdp-collect/cdp/collect/user/",
                                persistence: "localStorage",
                                loaded: function() {
                                    r && "function" == typeof window.CEPMixpanelIdentify && window.CEPMixpanelIdentify(window.CEPMixpanel),
                                    window.CEPMixpanel.initCompleteCb(this.__loaded, r),
                                    f("initMixPanel")
                                }
                            })
                        }).catch(function(e) {
                            window.CEPMixpanel.init(a, {
                                platform: d || "shopify",
                                debug: !1,
                                batch_autostart: !1,
                                api_host: "https://test-app-quickcep.jlcerp.com",
                                reportEventPath: "/cdp-collect/cdp/collect/event/",
                                reportUserHost: "https://test-app-quickcep.jlcerp.com",
                                reportUserPath: "/cdp-collect/cdp/collect/user/",
                                persistence: "localStorage",
                                loaded: function() {
                                    r && "function" == typeof window.CEPMixpanelIdentify && window.CEPMixpanelIdentify(window.CEPMixpanel),
                                    window.CEPMixpanel.initCompleteCb(this.__loaded, r),
                                    f("initMixPanel")
                                }
                            })
                        })
                    }
                }
        }(),
        function() {
            w("iniChat");
            var e = document.createElement("style");
            e.setAttribute("id", "quick-chat-custom-css"),
            document.head.appendChild(e),
            e.innerHTML = ".quick-chat-bodystyle {overflow: hidden !important}";
            var t, o = document.getElementById("quick-chat-iframe"), e = document.getElementById("quick-chat-box");
            o ? (s(o),
            f("iniChat")) : ((o = document.createElement("iframe")).id = "quick-chat-iframe",
            o.name = "quick-chat-iframe",
            o.src = 'javascript:(function(){document.open();document.write(" ");document.close();})();',
            t = {
                display: "none",
                border: "none",
                position: "fixed",
                right: "0",
                inset: "auto 0px 0px auto",
                width: "1px",
                height: "1px",
                opacity: "1",
                background: "none transparent",
                margin: "0px",
                maxHeight: "100%",
                maxWidth: "100vw",
                transform: "translateY(200px)",
                transition: "transform 0.3s ease 0s",
                visibility: "hidden",
                zIndex: "1000000000000",
                borderRadius: /Android|webOS|iPhone|iPod|SymbianOS|iPad|BlackBerry/i.test(navigator.userAgent) ? "none" : "47px 30px 47px 47px"
            },
            Object.keys(t).forEach(function(e) {
                o.style[e] = t[e]
            }),
            o.onload = function() {
                s(o),
                f("iniChat")
            }
            ,
            (e || document.body).appendChild(o),
            r("iframe-created! spend", (new Date).getTime() - performance.timing.navigationStart, "ms"));
            var a = !1
              , d = {
                x: 0,
                y: 0
            };
            window.addEventListener("message", function(e) {
                var t, n = e.data || {}, i = n.type, e = n.payload;
                "start-drag" === i && (o.style.transition = "none",
                a = !0,
                d = e.offset),
                "dragging" === i && a && (t = null == (n = document.getElementById("quick-chat-iframe")) ? void 0 : n.getBoundingClientRect(),
                n = e.clientX,
                e.clientY,
                0 < (n = n - d.x) && (o.style.left = n + "px"),
                ((null == t ? void 0 : t.width) || 0) + n > window.innerWidth && (o.style.left = window.innerWidth - ((null == t ? void 0 : t.width) || 0) + "px")),
                "end-drag" === i && (a = !1,
                t = e.clientX,
                console.log("clientX", t),
                t > window.innerWidth / 2 ? (o.style.left = "auto",
                o.style.right = "0",
                window.sessionStorage.setItem("iframePosition", JSON.stringify({
                    left: "auto",
                    right: "0"
                }))) : (o.style.left = "0px",
                o.style.right = "auto",
                window.sessionStorage.setItem("iframePosition", JSON.stringify({
                    left: "0",
                    right: "auto"
                })))),
                "redirectPostion" === i && ("left" === (e = e.position) && (o.style.left = "0px",
                o.style.right = "auto"),
                "right" === e && (o.style.left = "auto",
                o.style.right = "0"))
            })
        }())
    }
    var d, c;
    document.body ? a() : document.addEventListener ? (d = function() {
        document.removeEventListener("DOMContentLoaded", d),
        a()
    }
    ,
    document.addEventListener("DOMContentLoaded", d, !1)) : document.attachEvent && (c = function() {
        "complete" === document.readyState && (document.detachEvent("onreadystatechange", c),
        a())
    }
    ,
    document.attachEvent("onreadystatechange", c))
}();
