var escape = require('escape-html');

/*
    Generate HTML for the tab in the header

    @param {Block}
    @param {Boolean}
    @return {String}
*/
function createTab(block, i, isActive) {
    return '<div class="tab' + (isActive? ' active' : '') + '" data-tab="' + i + '">' + block.kwargs.name + '</div>';
}

/*
    Generate HTML for the tab's content

    @param {Block}
    @param {Boolean}
    @return {String}
*/
function createTabBody(block, i, isActive, book) {
    console.log("Building promise for tab "+i+" with body "+block.body);
    if(block.kwargs.type == "text" || block.kwargs.type == "asciidoc"){        
        return new Promise((resolve,reject) => {
                console.log("Processing text/asciidoc promise for tab "+i);
                book.renderBlock( 'asciidoc' , block.body )
                    .then(function(rendered){ 
                         var wrapped =  '<div class="tab' + (isActive? ' active' : '') + '" data-tab="' + i + '">' + rendered + '</div>';
                         console.log("Resolving text/asciidoc promise for tab "+i+" with rendered body "+wrapped);
                         resolve( wrapped , i);
                });
        });
    }else if(block.kwargs.type == "markdown"){
        return new Promise((resolve,reject) => {
                book.renderBlock( 'markdown' , block.body )
                    .then(function(rendered){ 
                         resolve( '<div class="tab' + (isActive? ' active' : '') + '" data-tab="' + i + '">' + rendered + '</div>' , i);
                });
        });        
    }else{
        return new Promise((resolve,reject) => {
            resolve( 
               '<div class="tab' + (isActive? ' active' : '') + '" data-tab="' + i + '"><pre><code class="lang-' + (block.kwargs.type || block.kwargs.name) + '">'
                  + escape(block.body) + '</code></pre></div>', i );
        });
    }
}

module.exports = {
    book: {
        assets: './assets',
        css: [
            'tabs.css'
        ],
        js: [
            'tabs.js'
        ]
    },

    blocks: {
        tabs: {
            blocks: ['tab'],
            process: function(parentBlock) {
                
                var promise = new Promise((resolve,reject) => {
                var blocks = [parentBlock].concat(parentBlock.blocks);
                var tabsContent = [];
                var tabsFish = '';
                var tabsHeader = [];
                var book = this;
                var counter = blocks.length;

                blocks.forEach(function(block, i) {
                    var isActive = (i == 0);                    
                    
                    if (!block.kwargs.name) {
                        throw new Error('Tab requires a "name" property');
                    }
                    
                    if (!block.kwargs.type) {
                        block.kwargs.type=block.kwargs.name;
                    }
                    
                    console.log("Processing "+i+" -> "+block.kwargs.name+" :: "+block.kwargs.type);

                    tabsHeader[i] = createTab(block, i, isActive);
                    createTabBody(block, i, isActive, book).then(function(tabBody, x){
                        tabsContent[x] = tabBody;
                        tabsFish += tabBody;
                        console.log("Tab "+i+" ("+x+") has completed.. counter is now "+counter+" tabBody was "+tabBody);
                        console.log("tabsContent:"+tabsContent);
                        console.log("tabsContent.length: "+tabsContent.length);
                        console.log("tabsFish: "+tabsFish);
                        if( --counter == 0) {    
                            
                            console.log("Building tab response");
                            
                            var tabContentText = '';
                            tabsContent.forEach(function(tab) {
                                console.log("Appending tab content "+tab);
                                tabContentText += tab;                                
                            });
                            
                            var tabHeaderText = '';
                            tabsHeader.forEach(function(header) {
                                tabHeaderText += header;
                            });

                            console.log("Resolving final promise: tabContentText : "+tabContentText);
                            resolve('<div class="tabs">' +
                                    '<div class="tabs-header">' + tabHeaderText + '</div>' +
                                    '<div class="tabs-body">' + tabContentText+ '</div>' +
                                     '</div>');
                        }
                    });
                });

            });
                return promise;
            }
        }
    }
};
