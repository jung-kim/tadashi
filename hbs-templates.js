this["templates"] = this["templates"] || {};

this["templates"]['./hbs/about/about-sub.hbs'] = Handlebars.template({"1":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, alias5=container.lambda, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"card\">\n    <div class=\"card-header\" id=\"heading"
    + alias4(((helper = (helper = lookupProperty(helpers,"index") || (data && lookupProperty(data,"index"))) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"index","hash":{},"data":data,"loc":{"start":{"line":3,"column":40},"end":{"line":3,"column":50}}}) : helper)))
    + "\">\n        <h2 class=\"mb-0\">\n            <button class=\"btn btn-link collapsed\" type=\"button\" data-toggle=\"collapse\" data-parent=\"#faq-accordion\"\n                href=\"#collapse"
    + alias4(((helper = (helper = lookupProperty(helpers,"index") || (data && lookupProperty(data,"index"))) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"index","hash":{},"data":data,"loc":{"start":{"line":6,"column":31},"end":{"line":6,"column":41}}}) : helper)))
    + "\" aria-expanded=\"false\" aria-controls=\"#collapse"
    + alias4(((helper = (helper = lookupProperty(helpers,"index") || (data && lookupProperty(data,"index"))) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"index","hash":{},"data":data,"loc":{"start":{"line":6,"column":89},"end":{"line":6,"column":99}}}) : helper)))
    + "\">\n                Q: "
    + alias4(alias5((depth0 != null ? lookupProperty(depth0,"title") : depth0), depth0))
    + "\n            </button>\n        </h2>\n    </div>\n    <div id=\"collapse"
    + alias4(((helper = (helper = lookupProperty(helpers,"index") || (data && lookupProperty(data,"index"))) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"index","hash":{},"data":data,"loc":{"start":{"line":11,"column":21},"end":{"line":11,"column":31}}}) : helper)))
    + "\" class=\"collapse\" aria-labelledby=\"heading"
    + alias4(((helper = (helper = lookupProperty(helpers,"index") || (data && lookupProperty(data,"index"))) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"index","hash":{},"data":data,"loc":{"start":{"line":11,"column":74},"end":{"line":11,"column":84}}}) : helper)))
    + "\" data-parent=\"#faq-accordion\">\n        <div class=\"card-body\">\n            "
    + ((stack1 = alias5((depth0 != null ? lookupProperty(depth0,"body") : depth0), depth0)) != null ? stack1 : "")
    + "\n        </div>\n    </div>\n</div>\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return ((stack1 = lookupProperty(helpers,"each").call(depth0 != null ? depth0 : (container.nullContext || {}),depth0,{"name":"each","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":1,"column":0},"end":{"line":17,"column":9}}})) != null ? stack1 : "");
},"useData":true});

this["templates"]['./hbs/about/about.hbs'] = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    return "<div id=\"about\" class=\"container-fluid\">\n    <section class=\"jumbotron text-center\">\n        <div class=\"container\">\n            <h1 class=\"jumbotron-heading\">Sonso</h1>\n            <p class=\"lead text-muted\">\n                Free streamers' data console. <br />\n                <br />\n                Sometimes, it can be difficult to track all the viewers and their activities when you are busy\n                broadcasting.<br />\n                <br />\n                Sonso is a free tool to help you get to know them and understand them better.\n            </p>\n        </div>\n    </section>\n\n    <h1 id=\"features-info\" class=\"sub-title text-center col-md-12\">\n        Features highlight\n    </h1>\n\n    <div class=\"album py-5 bg-light\">\n        <div id=\"about-features\" class=\"container\">\n        </div>\n    </div>\n\n    <h1 id=\"faq-info\" class=\"sub-title text-center col-md-12\">\n        Frequently Asked Questions\n    </h1>\n\n    <div id=\"faq-accordion\" class=\"accordion bg-light\">\n        <!-- about-sub.hbs -->\n    </div>\n</div>";
},"useData":true});

this["templates"]['./hbs/about/features.hbs'] = Handlebars.template({"1":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=depth0 != null ? depth0 : (container.nullContext || {}), lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"row\">\n    <div class=\"col-md-6\">\n        <div class=\"card mb-6 box-shadow\">\n"
    + ((stack1 = lookupProperty(helpers,"with").call(alias1,lookupProperty(helpers,"lookup").call(alias1,depth0,0,{"name":"lookup","hash":{},"data":data,"loc":{"start":{"line":5,"column":20},"end":{"line":5,"column":35}}}),{"name":"with","hash":{},"fn":container.program(2, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":5,"column":12},"end":{"line":12,"column":21}}})) != null ? stack1 : "")
    + "        </div>\n    </div>\n\n    <div class=\"col-md-6\">\n        <div class=\"card mb-6 box-shadow\">\n"
    + ((stack1 = lookupProperty(helpers,"with").call(alias1,lookupProperty(helpers,"lookup").call(alias1,depth0,1,{"name":"lookup","hash":{},"data":data,"loc":{"start":{"line":18,"column":20},"end":{"line":18,"column":35}}}),{"name":"with","hash":{},"fn":container.program(2, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":18,"column":12},"end":{"line":25,"column":21}}})) != null ? stack1 : "")
    + "        </div>\n    </div>\n</div>\n";
},"2":function(container,depth0,helpers,partials,data) {
    var alias1=container.lambda, alias2=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "            <img class=\"card-img-top\" src=\""
    + alias2(alias1((depth0 != null ? lookupProperty(depth0,"gif") : depth0), depth0))
    + "\">\n            <div class=\"card-body\">\n                <p class=\"card-text text-center\">\n                    "
    + alias2(alias1((depth0 != null ? lookupProperty(depth0,"message") : depth0), depth0))
    + "\n                </p>\n            </div>\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return ((stack1 = lookupProperty(helpers,"each").call(depth0 != null ? depth0 : (container.nullContext || {}),depth0,{"name":"each","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":1,"column":0},"end":{"line":29,"column":9}}})) != null ? stack1 : "");
},"useData":true});

this["templates"]['./hbs/components/nav-auth.hbs'] = Handlebars.template({"1":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=container.lambda, alias2=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<button class=\"btn disabled btn-outline-info my-2 my-sm-0\" type=\"button\">\n    <img src=\""
    + alias2(alias1(((stack1 = (depth0 != null ? lookupProperty(depth0,"_user") : depth0)) != null ? lookupProperty(stack1,"profile_image_url") : stack1), depth0))
    + "\" />\n    "
    + alias2(alias1(((stack1 = (depth0 != null ? lookupProperty(depth0,"_user") : depth0)) != null ? lookupProperty(stack1,"login") : stack1), depth0))
    + "\n</button>\n<button class=\"btn btn-outline-warning my-2 my-sm-0\" onclick=\"authLogout()\" type=\"button\">\n    Logout\n</button>\n";
},"3":function(container,depth0,helpers,partials,data) {
    return "<button class=\"btn btn-outline-success my-2 my-sm-0\" onclick=\"authenticate()\" type=\"button\">\n    Login / Sign up\n</button>\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return ((stack1 = lookupProperty(helpers,"if").call(depth0 != null ? depth0 : (container.nullContext || {}),(depth0 != null ? lookupProperty(depth0,"_authToken") : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.program(3, data, 0),"data":data,"loc":{"start":{"line":1,"column":0},"end":{"line":13,"column":7}}})) != null ? stack1 : "");
},"useData":true});

this["templates"]['./hbs/shared/alerts.hbs'] = Handlebars.template({"1":function(container,depth0,helpers,partials,data) {
    var helper, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "    <strong>"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"strong") || (depth0 != null ? lookupProperty(depth0,"strong") : depth0)) != null ? helper : container.hooks.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : (container.nullContext || {}),{"name":"strong","hash":{},"data":data,"loc":{"start":{"line":6,"column":12},"end":{"line":6,"column":22}}}) : helper)))
    + "</strong>\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<div class=\"alert alert-"
    + container.escapeExpression(((helper = (helper = lookupProperty(helpers,"type") || (depth0 != null ? lookupProperty(depth0,"type") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"type","hash":{},"data":data,"loc":{"start":{"line":1,"column":24},"end":{"line":1,"column":32}}}) : helper)))
    + " alert-dismissible fade show\" role=\"alert\">\n    <button type=\"button\" class=\"close\" data-dismiss=\"alert\" aria-label=\"Close\">\n        <span aria-hidden=\"true\">&times;</span>\n    </button>\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"strong") : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":5,"column":4},"end":{"line":7,"column":11}}})) != null ? stack1 : "")
    + "    "
    + ((stack1 = ((helper = (helper = lookupProperty(helpers,"body") || (depth0 != null ? lookupProperty(depth0,"body") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"body","hash":{},"data":data,"loc":{"start":{"line":8,"column":4},"end":{"line":8,"column":14}}}) : helper))) != null ? stack1 : "")
    + "\n</div>";
},"useData":true});

this["templates"]['./hbs/stream/chatters.hbs'] = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    return "<div id=\"chatter-container\" class=\"panel-group panel panel-default\">\n    <div class=\"chatter-header sticky-top\">\n        <h2>chatters</h2>\n        <svg id='chatters-help' class=\"octicon bi bi-question-circle\" width=\"1em\" height=\"1em\" viewBox=\"0 0 16 16\"\n            fill=\"currentColor\" xmlns=\"http://www.w3.org/2000/svg\">\n            <path fill-rule=\"evenodd\" d=\"M8 15A7 7 0 108 1a7 7 0 000 14zm0 1A8 8 0 108 0a8 8 0 000 16z\"\n                clip-rule=\"evenodd\" />\n            <path\n                d=\"M5.25 6.033h1.32c0-.781.458-1.384 1.36-1.384.685 0 1.313.343 1.313 1.168 0 .635-.374.927-.965 1.371-.673.489-1.206 1.06-1.168 1.987l.007.463h1.307v-.355c0-.718.273-.927 1.01-1.486.609-.463 1.244-.977 1.244-2.056 0-1.511-1.276-2.241-2.673-2.241-1.326 0-2.786.647-2.754 2.533zm1.562 5.516c0 .533.425.927 1.01.927.609 0 1.028-.394 1.028-.927 0-.552-.42-.94-1.029-.94-.584 0-1.009.388-1.009.94z\" />\n        </svg>\n        <svg id=\"chatters-search-icon\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 16 16\" width=\"16\" height=\"16\">\n            <path fill-rule=\"evenodd\"\n                d=\"M15.7 13.3l-3.81-3.83A5.93 5.93 0 0013 6c0-3.31-2.69-6-6-6S1 2.69 1 6s2.69 6 6 6c1.3 0 2.48-.41 3.47-1.11l3.83 3.81c.19.2.45.3.7.3.25 0 .52-.09.7-.3a.996.996 0 000-1.41v.01zM7 10.7c-2.59 0-4.7-2.11-4.7-4.7 0-2.59 2.11-4.7 4.7-4.7 2.59 0 4.7 2.11 4.7 4.7 0 2.59-2.11 4.7-4.7 4.7z\">\n            </path>\n        </svg>\n        <input id='chatters-search' class=\"form-control mr-sm-2\" type=\"text\" placeholder=\"Search\" aria-label=\"Search\"\n            onkeyup=\"domEvent(event)\">\n    </div>\n</div>";
},"useData":true});

this["templates"]['./hbs/stream/components/chart.hbs'] = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var alias1=container.lambda, alias2=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<svg id='"
    + alias2(alias1((depth0 != null ? lookupProperty(depth0,"_chartDomSelector") : depth0), depth0))
    + "-help' class=\"octicon bi bi-question-circle\" width=\"1em\" height=\"1em\"\n    viewBox=\"0 0 16 16\" fill=\"currentColor\" xmlns=\"http://www.w3.org/2000/svg\">\n    <path fill-rule=\"evenodd\" d=\"M8 15A7 7 0 108 1a7 7 0 000 14zm0 1A8 8 0 108 0a8 8 0 000 16z\" clip-rule=\"evenodd\" />\n    <path\n        d=\"M5.25 6.033h1.32c0-.781.458-1.384 1.36-1.384.685 0 1.313.343 1.313 1.168 0 .635-.374.927-.965 1.371-.673.489-1.206 1.06-1.168 1.987l.007.463h1.307v-.355c0-.718.273-.927 1.01-1.486.609-.463 1.244-.977 1.244-2.056 0-1.511-1.276-2.241-2.673-2.241-1.326 0-2.786.647-2.754 2.533zm1.562 5.516c0 .533.425.927 1.01.927.609 0 1.028-.394 1.028-.927 0-.552-.42-.94-1.029-.94-.584 0-1.009.388-1.009.94z\" />\n</svg>\n<canvas id=\"canvas-"
    + alias2(alias1((depth0 != null ? lookupProperty(depth0,"_chartDomSelector") : depth0), depth0))
    + "\"></canvas>";
},"useData":true});

this["templates"]['./hbs/stream/components/chatters-group-list.hbs'] = Handlebars.template({"1":function(container,depth0,helpers,partials,data) {
    var alias1=container.lambda, alias2=container.escapeExpression, alias3=depth0 != null ? depth0 : (container.nullContext || {}), alias4=container.hooks.helperMissing, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<li class=\"list-group-item justify-content-between lh-condensed\">\n    <small id=\"chatters-"
    + alias2(alias1((depth0 != null ? lookupProperty(depth0,"_userName") : depth0), depth0))
    + "\" class=\""
    + alias2((lookupProperty(helpers,"userFollowsCSS")||(depth0 && lookupProperty(depth0,"userFollowsCSS"))||alias4).call(alias3,(depth0 != null ? lookupProperty(depth0,"_userName") : depth0),{"name":"userFollowsCSS","hash":{},"data":data,"loc":{"start":{"line":3,"column":51},"end":{"line":3,"column":84}}}))
    + "\">"
    + alias2(alias1((depth0 != null ? lookupProperty(depth0,"_userName") : depth0), depth0))
    + "</small>\n    <span id=\"chatters-subs-"
    + alias2(alias1((depth0 != null ? lookupProperty(depth0,"_userName") : depth0), depth0))
    + "\" class=\"user-info "
    + alias2((lookupProperty(helpers,"getInfoCss")||(depth0 && lookupProperty(depth0,"getInfoCss"))||alias4).call(alias3,(depth0 != null ? lookupProperty(depth0,"_userName") : depth0),{"name":"getInfoCss","hash":{},"data":data,"loc":{"start":{"line":4,"column":65},"end":{"line":4,"column":94}}}))
    + "\">\n        <svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" fill=\"currentColor\" class=\"bi bi-info-circle\"\n            viewBox=\"0 0 16 16\">\n            <path d=\"M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z\" />\n            <path\n                d=\"m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z\" />\n        </svg>\n    </span>\n</li>\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return ((stack1 = lookupProperty(helpers,"each").call(depth0 != null ? depth0 : (container.nullContext || {}),depth0,{"name":"each","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data,"loc":{"start":{"line":1,"column":0},"end":{"line":13,"column":9}}})) != null ? stack1 : "");
},"useData":true});

this["templates"]['./hbs/stream/components/chatters-group.hbs'] = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var alias1=container.lambda, alias2=container.escapeExpression;

  return "<div class=\"panel-heading "
    + alias2(alias1(depth0, depth0))
    + "-header\">\n    <h4 class=\"panel-title d-flex justify-content-between align-items-center mb-3\">\n        <button id=\""
    + alias2(alias1(depth0, depth0))
    + "-expand\" class=\"text-muted btn btn-link\" type=\"button\" data-toggle=\"collapse\"\n            aria-controls=\""
    + alias2(alias1(depth0, depth0))
    + "-list\" data-target=\"#"
    + alias2(alias1(depth0, depth0))
    + "-list\" aria-expanded=\"false\">"
    + alias2(alias1(depth0, depth0))
    + "</button>\n        <span id=\""
    + alias2(alias1(depth0, depth0))
    + "-count\" class=\"badge badge-primary badge-pill\"></span>\n    </h4>\n</div>\n<div id=\""
    + alias2(alias1(depth0, depth0))
    + "-list\" class=\"list panel-collapse collapse\">\n    <div id=\""
    + alias2(alias1(depth0, depth0))
    + "-paginator\" class=\"pagination-info\">\n        <span id=\""
    + alias2(alias1(depth0, depth0))
    + "-pagination-numbers\" class=\"pagination-numbers\"></span>\n\n        <ul class=\"pagination pagination-sm justify-content-end\">\n            <li class=\"page-item\">\n                <a id=\""
    + alias2(alias1(depth0, depth0))
    + "-page-left\" class=\"page-link\" href=\"javascript:void(0);\" aria-label=\"Previous\"\n                    onclick=\"domEvent(event)\">\n                    <span aria-hidden=\"true\">&laquo;</span>\n                </a>\n            </li>\n            <li class=\"page-item\">\n                <a id=\""
    + alias2(alias1(depth0, depth0))
    + "-page-right\" class=\"page-link\" href=\"javascript:void(0);\" aria-label=\"Next\"\n                    onclick=\"domEvent(event)\">\n                    <span aria-hidden=\"true\">&raquo;</span>\n                </a>\n            </li>\n        </ul>\n    </div>\n    <ul id=\""
    + alias2(alias1(depth0, depth0))
    + "-list-chatters\" class=\"list-group mb-3 chatters-list\">\n    </ul>\n</div>";
},"useData":true});

this["templates"]['./hbs/stream/date-time-range.hbs'] = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    return "<svg id=\"time-help\" class=\"svg-help-dot\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 8 16\" width=\"8\" height=\"16\">\n    <path fill-rule=\"evenodd\" d=\"M0 8c0-2.2 1.8-4 4-4s4 1.8 4 4-1.8 4-4 4-4-1.8-4-4z\"></path>\n</svg>\n<input id=\"time-start\" class=\"simple-input ml-2\" />\n<span class=\"quite-text\">to</span>\n<input id=\"time-end\" class=\"simple-input\" />\n<div class=\"dropdown px-1 d-inline-block\">\n    <svg id=\"time-reset-help\" class=\"svg-help-dot\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 8 16\" width=\"8\"\n        height=\"16\">\n        <path fill-rule=\"evenodd\" d=\"M0 8c0-2.2 1.8-4 4-4s4 1.8 4 4-1.8 4-4 4-4-1.8-4-4z\"></path>\n    </svg>\n    <button id=\"time-reset\" class=\"btn btn-sm btn-info\" onclick=\"domEvent(event, 'time-reset')\">\n        <svg width=\"1em\" height=\"1em\" viewBox=\"0 0 16 16\" class=\"bi bi-arrow-counterclockwise\" fill=\"currentColor\"\n            xmlns=\"http://www.w3.org/2000/svg\">\n            <path fill-rule=\"evenodd\" d=\"M8 3a5 5 0 1 1-4.546 2.914.5.5 0 0 0-.908-.417A6 6 0 1 0 8 2v1z\" />\n            <path\n                d=\"M8 4.466V.534a.25.25 0 0 0-.41-.192L5.23 2.308a.25.25 0 0 0 0 .384l2.36 1.966A.25.25 0 0 0 8 4.466z\" />\n        </svg>\n</div>";
},"useData":true});

this["templates"]['./hbs/stream/index.hbs'] = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    return "<div id=\"stream\" class=\"container-fluid\">\n    <div id=\"twitch-stream\" class=\"row\">\n        <div class=\"col-md-12\">\n            <h2 id=\"embeded-twitch-collapse\" class=\"header pl-4\" data-toggle=\"collapse\" data-target=\"#twitch-embed\"\n                aria-expanded=\"true\" aria-controls=\"twitch-embed\" onclick=\"domEvent(event, 'embeded-twitch-collapse')\">\n                <span id=\"embeded-twitch-channel\" class=\"btn-link\">\n                </span>\n                <span id=\"embeded-twitch-desc\">\n                </span>\n            </h2>\n            <div id=\"twitch-embed\" class=\"collapse show\" aria-labelledby=\"headingOne\"\n                data-parent=\"#embeded-twitch-collapse\">\n            </div>\n        </div>\n    </div>\n    <div id=\"chart\" class=\"row\">\n        <div id=\"timeseries-container\" class=\"timeseries col-md-10\">\n            <canvas id=\"canvas-timeseries\"></canvas>\n        </div>\n        <div id=\"chatters-table\" class=\"chatters col-md-2\">\n        </div>\n    </div>\n    <div class=\"pie-active row\">\n        <div id='pie-chats-by-users' class=\"col-md-4\">\n        </div>\n\n        <div id='pie-proceeds-by-users' class=\"col-md-4\">\n        </div>\n\n        <div id='pie-proceeds' class=\"col-md-4\">\n        </div>\n    </div>\n    <div class=\"pie-active row\">\n        <div id='chart-followed-streamers' class=\"col-md-8\">\n        </div>\n\n        <div id='chart-subs-by-tiers' class=\"col-md-4\">\n        </div>\n    </div>\n</div>";
},"useData":true});

this["templates"]['./hbs/stream/nav-options.hbs'] = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    return "<div class=\"pl-2 pt-2\">\n    <div class=\"dropdown px-1 d-inline-block\">\n        <svg id=\"channel-refresh-help\" class=\"svg-help-dot\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 8 16\"\n            width=\"8\" height=\"16\">\n            <path fill-rule=\"evenodd\" d=\"M0 8c0-2.2 1.8-4 4-4s4 1.8 4 4-1.8 4-4 4-4-1.8-4-4z\"></path>\n        </svg>\n        <button id=\"channel-refresh\" class=\"btn btn-sm btn-info\" onclick=\"domEvent(event, 'channel-refresh')\">\n            <svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" fill=\"currentColor\"\n                class=\"bi bi-arrow-repeat\" viewBox=\"0 0 16 16\">\n                <path\n                    d=\"M11.534 7h3.932a.25.25 0 0 1 .192.41l-1.966 2.36a.25.25 0 0 1-.384 0l-1.966-2.36a.25.25 0 0 1 .192-.41zm-11 2h3.932a.25.25 0 0 0 .192-.41L2.692 6.23a.25.25 0 0 0-.384 0L.342 8.59A.25.25 0 0 0 .534 9z\" />\n                <path fill-rule=\"evenodd\"\n                    d=\"M8 3c-1.552 0-2.94.707-3.857 1.818a.5.5 0 1 1-.771-.636A6.002 6.002 0 0 1 13.917 7H12.9A5.002 5.002 0 0 0 8 3zM3.1 9a5.002 5.002 0 0 0 8.757 2.182.5.5 0 1 1 .771.636A6.002 6.002 0 0 1 2.083 9H3.1z\" />\n            </svg>\n        </button>\n    </div>\n    <div class=\"dropdown px-1 d-inline-block\">\n        <svg id=\"channel-save-help\" class=\"svg-help-dot\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 8 16\" width=\"8\"\n            height=\"16\">\n            <path fill-rule=\"evenodd\" d=\"M0 8c0-2.2 1.8-4 4-4s4 1.8 4 4-1.8 4-4 4-4-1.8-4-4z\"></path>\n        </svg>\n        <button id=\"channel-save\" class=\"btn btn-sm btn-info\" onclick=\"domEvent(event, 'channel-save')\">\n            <svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" fill=\"currentColor\" class=\"bi bi-save2\"\n                viewBox=\"0 0 16 16\">\n                <path\n                    d=\"M2 1a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H9.5a1 1 0 0 0-1 1v4.5h2a.5.5 0 0 1 .354.854l-2.5 2.5a.5.5 0 0 1-.708 0l-2.5-2.5A.5.5 0 0 1 5.5 6.5h2V2a2 2 0 0 1 2-2H14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h2.5a.5.5 0 0 1 0 1H2z\" />\n            </svg>\n        </button>\n    </div>\n</div>\n<div class=\"pr-1 pt-1\">\n    <div class=\"channel-input-group\">\n        <div class=\"input-group input-group-sm\">\n            <div class=\"input-group-prepend\">\n                <span class=\"input-group-text\" id=\"\">Channel:</span>\n            </div>\n            <input id=\"channel-input\" type=\"text\" value=\"\" onkeyup=\"domEvent(event)\" onclick=\"domEvent(event)\"\n                onfocusout=\"domEvent(event)\">\n        </div>\n    </div>\n</div>\n<div id=\"interval-selector\" class=\"dropdown px-1 pt-2\">\n    <svg id=\"interval-selector-help\" class=\"svg-help-dot\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 8 16\"\n        width=\"8\" height=\"16\">\n        <path fill-rule=\"evenodd\" d=\"M0 8c0-2.2 1.8-4 4-4s4 1.8 4 4-1.8 4-4 4-4-1.8-4-4z\"></path>\n    </svg>\n    <button id=\"interval-selector-btn\" class=\"btn btn-sm btn-info dropdown-toggle\" type=\"button\" data-toggle=\"dropdown\"\n        aria-haspopup=\"true\" aria-expanded=\"false\">\n        1 minute\n    </button>\n    <div class=\"dropdown-menu\" aria-labelledby=\"dropdownMenuButton\">\n        <a id=\"one-min-interval\" class=\"dropdown-item\" href=\"#\" onclick=\"domEvent(event)\">1 minute</a>\n        <a id=\"five-min-interval\" class=\"dropdown-item\" href=\"#\" onclick=\"domEvent(event)\">5 minutes</a>\n        <a id=\"one-hour-interval\" class=\"dropdown-item\" href=\"#\" onclick=\"domEvent(event)\">1 hour</a>\n        <a id=\"one-day-interval\" class=\"dropdown-item\" href=\"#\" onclick=\"domEvent(event)\">1 day</a>\n    </div>\n</div>\n<div id=\"time-selectors\" class=\"pt-2\">\n    <!-- date-time-range.hbs -->\n</div>";
},"useData":true});

this["templates"]['./hbs/svg/offline.hbs'] = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    return "<svg width=\"1em\" height=\"1em\" viewBox=\"0 0 16 16\" class=\"bi bi-wifi-off\" fill=\"currentColor\"\n    xmlns=\"http://www.w3.org/2000/svg\">\n    <path\n        d=\"M10.706 3.294A12.545 12.545 0 0 0 8 3 12.44 12.44 0 0 0 .663 5.379a.485.485 0 0 0-.048.736.518.518 0 0 0 .668.05A11.448 11.448 0 0 1 8 4c.63 0 1.249.05 1.852.148l.854-.854zM8 6c-1.905 0-3.68.56-5.166 1.526a.48.48 0 0 0-.063.745.525.525 0 0 0 .652.065 8.448 8.448 0 0 1 3.51-1.27L8 6zm2.596 1.404l.785-.785c.63.24 1.228.545 1.785.907a.482.482 0 0 1 .063.745.525.525 0 0 1-.652.065 8.462 8.462 0 0 0-1.98-.932zM8 10l.934-.933a6.454 6.454 0 0 1 2.012.637c.285.145.326.524.1.75l-.015.015a.532.532 0 0 1-.611.09A5.478 5.478 0 0 0 8 10zm4.905-4.905l.747-.747c.59.3 1.153.645 1.685 1.03a.485.485 0 0 1 .048.737.518.518 0 0 1-.668.05 11.496 11.496 0 0 0-1.812-1.07zM9.02 11.78c.238.14.236.464.04.66l-.706.706a.5.5 0 0 1-.708 0l-.707-.707c-.195-.195-.197-.518.04-.66A1.99 1.99 0 0 1 8 11.5c.373 0 .722.102 1.02.28zm4.355-9.905a.53.53 0 1 1 .75.75l-10.75 10.75a.53.53 0 0 1-.75-.75l10.75-10.75z\" />\n</svg>";
},"useData":true});

this["templates"]['./hbs/svg/online.hbs'] = Handlebars.template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    return "<svg width=\"1em\" height=\"1em\" viewBox=\"0 0 16 16\" class=\"bi bi-wifi\" fill=\"currentColor\"\n    xmlns=\"http://www.w3.org/2000/svg\">\n    <path\n        d=\"M15.385 6.115a.485.485 0 0 0-.048-.736A12.443 12.443 0 0 0 8 3 12.44 12.44 0 0 0 .663 5.379a.485.485 0 0 0-.048.736.518.518 0 0 0 .668.05A11.448 11.448 0 0 1 8 4c2.507 0 4.827.802 6.717 2.164.204.148.489.13.668-.049z\" />\n    <path\n        d=\"M13.229 8.271c.216-.216.194-.578-.063-.745A9.456 9.456 0 0 0 8 6c-1.905 0-3.68.56-5.166 1.526a.48.48 0 0 0-.063.745.525.525 0 0 0 .652.065A8.46 8.46 0 0 1 8 7a8.46 8.46 0 0 1 4.577 1.336c.205.132.48.108.652-.065zm-2.183 2.183c.226-.226.185-.605-.1-.75A6.472 6.472 0 0 0 8 9c-1.06 0-2.062.254-2.946.704-.285.145-.326.524-.1.75l.015.015c.16.16.408.19.611.09A5.478 5.478 0 0 1 8 10c.868 0 1.69.201 2.42.56.203.1.45.07.611-.091l.015-.015zM9.06 12.44c.196-.196.198-.52-.04-.66A1.99 1.99 0 0 0 8 11.5a1.99 1.99 0 0 0-1.02.28c-.238.14-.236.464-.04.66l.706.706a.5.5 0 0 0 .708 0l.707-.707z\" />\n</svg>";
},"useData":true});