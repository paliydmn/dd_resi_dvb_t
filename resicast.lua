astra_storage["/mod.js"] = astra_storage["/mod.js"] .. [[

(function() {
"use strict";

window.ResiCastModule = {
	label: 'ResiCast',
	link: '#/resicast',
	order: 5,
    frame: null,
}

ResiCastModule.run = function() {
    window.on('message', (event) => {
        const frame = ResiCastModule.frame;
        if(!frame) {
            return;
        }

        const appHost = app.hosts[location.host];

        const data = event.data;
        if(data.request === 'stream-list') {
            frame.contentWindow.postMessage({
                response: 'stream-list',
                streams: appHost.config.make_stream,
            }, '*')
        }
    });
}

ResiCastModule.postStreamEvent = function(event) {
    const frame = ResiCastModule.frame;
    if(!frame) {
        return;
    }

    frame.contentWindow.postMessage({
        event: 'stream-event',
        data: event.data,
    }, '*');
}

ResiCastModule.render = function() {
	var self = this,
		object = app.renderInit();

    var frame = $.element('iframe')
        .addAttr('src', 'http://' + location.hostname + ':8008/adapters/')
        .addAttr('style', 'width: 100%; height: calc(100vh - 31px); border: none; margin-left: -10px; margin-right: -10px;');

    app.on('stream_event', ResiCastModule.postStreamEvent);

    ResiCastModule.frame = frame;
    self.on('destroy', () => {
        ResiCastModule.frame = null
        app.off('stream_event', ResiCastModule.postStreamEvent);
    });

    object.addChild(frame);
}

ResiCastModule.init = function() {
	$.body.bindScope(ResiCastModule.render, {});
}

app.modules.push(ResiCastModule)
app.menu.push(ResiCastModule)
})();

]]
