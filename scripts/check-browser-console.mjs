import { spawn } from 'child_process';

const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless',
  '--remote-debugging-port=9333',
  '--disable-gpu',
  '--user-data-dir=/tmp/chrome-test-profile-' + Date.now(),
  'about:blank'
]);

await new Promise(r => setTimeout(r, 1500));

const res = await fetch('http://localhost:9333/json');
const targets = await res.json();
const pageTarget = targets.find(t => t.type === 'page');

if (!pageTarget) {
  console.log('No page target found');
  chrome.kill();
  process.exit(1);
}

const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);

ws.onopen = () => {
  ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));
  ws.send(JSON.stringify({ id: 2, method: 'Console.enable' }));
  ws.send(JSON.stringify({ id: 3, method: 'Log.enable' }));
  ws.send(JSON.stringify({
    id: 4,
    method: 'Page.navigate',
    params: { url: 'http://localhost:4200/' }
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.method === 'Runtime.exceptionThrown') {
    console.error('EXCEPTION:', JSON.stringify(data.params.exceptionDetails, null, 2));
  } else if (data.method === 'Runtime.consoleAPICalled') {
    console.log('CONSOLE:', data.params.type, data.params.args.map(a => a.value || a.description).join(' '));
  }
};

setTimeout(() => {
  ws.close();
  chrome.kill();
  process.exit(0);
}, 4000);
