
var fs = require('fs');

var script = fs.readFileSync('script.js', 'utf-8');
var style  = fs.readFileSync('style.css', 'utf-8');

// compress css
style = style.replace(/\n/g, '').replace(/\s?(:|;|{|>|!)\s*/g, '$1');

script = script.replace('replace_style_here', style);

fs.writeFileSync('V2EX_Mate.user.js', script);
console.log('Done');
