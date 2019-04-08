const args = [ 'start' ];
const opts = { stdio: 'inherit', cwd: './client', shell: true };
const child_process = require('child_process')

const children = []
children.push(
  child_process.spawn('npm', args, opts)
)

process.on('exit', function() {
  console.log('killing', children.length, 'child processes');
  children.forEach(function(child) {
    child.kill();
  });
});
