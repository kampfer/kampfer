kampfer.addDependency('ajax.js', [], []);
kampfer.addDependency('base.js', [], []);
kampfer.addDependency('class.js', [], []);
kampfer.addDependency('data.js', ['data'], ['browser.support']);
kampfer.addDependency('events.js', ['events','events.Event','events.Listener'], ['data']);
kampfer.addDependency('support.js', ['browser.support'], []);